/**
 * Stack Match (South Africa) — editorial push.
 *
 *   npx tsx scripts/seed-articles.ts
 *
 * Upserts every article from lib/placeholder/articles.ts into Supabase,
 * keyed by slug with deterministic ids. related_software_id is resolved
 * against the live database by slug and left null when the product is not
 * seeded. Idempotent: reruns update the same rows.
 */

import { createClient } from "@supabase/supabase-js";
import { placeholderArticles } from "../lib/placeholder/articles";
import { placeholderSoftware } from "../lib/placeholder/software";
import { loadEnvLocal, stableId } from "./review-generator";

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local first."
  );
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const { data: softwareRows, error: swError } = await db
    .from("software")
    .select("id, slug");
  if (swError) throw new Error(`software lookup: ${swError.message}`);
  const dbIdBySlug = new Map((softwareRows ?? []).map((r) => [r.slug, r.id]));
  const slugByPlaceholderId = new Map(placeholderSoftware.map((s) => [s.id, s.slug]));

  for (const article of placeholderArticles) {
    const relatedSlug = article.related_software_id
      ? slugByPlaceholderId.get(article.related_software_id)
      : undefined;
    const relatedId = relatedSlug ? (dbIdBySlug.get(relatedSlug) ?? null) : null;

    const { data: existing, error: selectError } = await db
      .from("articles")
      .select("id")
      .eq("slug", article.slug)
      .maybeSingle();
    if (selectError) throw new Error(`${article.slug}: ${selectError.message}`);

    const row = {
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      featured_image_url: article.featured_image_url,
      category_tag: article.category_tag,
      related_software_id: relatedId,
      author_name: article.author_name,
      author_bio: article.author_bio,
      author_avatar_url: article.author_avatar_url,
      author_title: article.author_title,
      read_time_minutes: article.read_time_minutes,
      published_date: article.published_date,
      status: article.status,
      featured: article.featured,
    };

    if (existing) {
      const { error } = await db.from("articles").update(row).eq("id", existing.id);
      if (error) throw new Error(`${article.slug}: ${error.message}`);
    } else {
      const { error } = await db
        .from("articles")
        .insert({ id: stableId("article", article.id), slug: article.slug, ...row });
      if (error) throw new Error(`${article.slug}: ${error.message}`);
    }
    const words = article.content.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
    console.log(`  upserted ${article.slug} (${words} words${relatedId ? "" : ", no related product"})`);
  }
  console.log(`articles: ${placeholderArticles.length} pushed to Supabase.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
