/**
 * Stack Match (South Africa) — Sage blog push.
 *
 *   npx tsx scripts/seed-sage-articles.ts
 *
 * Upserts the 15 Sage focused articles from lib/placeholder/sage-articles.ts
 * into the Supabase `articles` table. Each article's related_software_id is
 * resolved from the live `software` table by matching the placeholder software
 * id to its slug, so the link points at the real row whatever its database id.
 *
 * Idempotent: rows are keyed by slug with deterministic ids, so reruns update
 * in place and change nothing structurally.
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { placeholderSoftware } from "../lib/placeholder/software";
import { sageArticles } from "../lib/placeholder/sage-articles";

/* ---------- tiny .env.local parser (no dotenv dependency) ---------- */
function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (!match) continue;
      const value = match[2].replace(/^["']|["']$/g, "");
      if (!process.env[match[1]]) process.env[match[1]] = value;
    }
  } catch {
    /* .env.local is optional when vars are already exported */
  }
}
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

/* ---------- deterministic ids so reruns hit the same rows ---------- */
function stableId(kind: string, key: string): string {
  const hex = createHash("sha1").update(`stackmatch:${kind}:${key}`).digest("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    "5" + hex.slice(13, 16),
    ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16) + hex.slice(17, 20),
    hex.slice(20, 32),
  ].join("-");
}

/** Select by slug; update if present, insert with a deterministic id if not. */
async function upsertBySlug(
  table: string,
  slug: string,
  row: Record<string, unknown>
): Promise<string> {
  const { data: existing, error: selectError } = await db
    .from(table)
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (selectError) throw new Error(`${table}/${slug}: ${selectError.message}`);

  if (existing) {
    const { error } = await db.from(table).update(row).eq("id", existing.id);
    if (error) throw new Error(`${table}/${slug}: ${error.message}`);
    return existing.id as string;
  }
  const id = stableId(table, slug);
  const { error } = await db.from(table).insert({ id, slug, ...row });
  if (error) throw new Error(`${table}/${slug}: ${error.message}`);
  return id;
}

async function main() {
  /* placeholder software id -> slug (so we can find the live row) */
  const slugByPlaceholderId = new Map(placeholderSoftware.map((p) => [p.id, p.slug]));

  /* live software id -> resolved from the database by slug, cached */
  const softwareIdBySlug = new Map<string, string>();
  async function resolveSoftwareId(placeholderId: string | null): Promise<string | null> {
    if (!placeholderId) return null;
    const slug = slugByPlaceholderId.get(placeholderId);
    if (!slug) {
      console.warn(`  no slug for placeholder software id ${placeholderId}, leaving link empty`);
      return null;
    }
    if (softwareIdBySlug.has(slug)) return softwareIdBySlug.get(slug)!;
    const { data, error } = await db
      .from("software")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw new Error(`software/${slug}: ${error.message}`);
    if (!data) {
      console.warn(`  software slug ${slug} not found in database, leaving link empty`);
      return null;
    }
    softwareIdBySlug.set(slug, data.id as string);
    return data.id as string;
  }

  let count = 0;
  for (const article of sageArticles) {
    const relatedId = await resolveSoftwareId(article.related_software_id);
    await upsertBySlug("articles", article.slug, {
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
      meta_title: article.meta_title ?? null,
      meta_description: article.meta_description ?? null,
      read_time_minutes: article.read_time_minutes,
      status: article.status,
      featured: article.featured,
      published_date: article.published_date,
    });
    count += 1;
    console.log(`  upserted ${article.slug}`);
  }
  console.log(`articles: ${count} Sage blogs pushed to Supabase.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
