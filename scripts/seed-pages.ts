/**
 * Stack Match (South Africa) — legal & policy pages push.
 *
 *   npx tsx scripts/seed-pages.ts
 *
 * Upserts every page from lib/placeholder/pages.ts into Supabase, keyed by
 * slug with deterministic ids. The public /terms, /privacy-policy,
 * /cookie-policy, /accessibility, /affiliate-disclosure and /editorial-policy
 * routes read from this table, so an empty table makes all of them 404.
 * Idempotent: reruns update the same rows.
 */

import { createClient } from "@supabase/supabase-js";
import { placeholderPages } from "../lib/placeholder/pages";
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
  for (const page of placeholderPages) {
    const row = {
      title: page.title,
      content: page.content,
      meta_title: page.meta_title ?? null,
      meta_description: page.meta_description ?? null,
      status: page.status,
    };

    const { data: existing, error: selectError } = await db
      .from("pages")
      .select("id")
      .eq("slug", page.slug)
      .maybeSingle();
    if (selectError) throw new Error(`${page.slug}: ${selectError.message}`);

    if (existing) {
      const { error } = await db.from("pages").update(row).eq("id", existing.id);
      if (error) throw new Error(`${page.slug}: ${error.message}`);
    } else {
      const { error } = await db
        .from("pages")
        .insert({ id: stableId("page", page.id), slug: page.slug, ...row });
      if (error) throw new Error(`${page.slug}: ${error.message}`);
    }
    console.log(`  upserted ${page.slug} (${page.title})`);
  }
  console.log(`pages: ${placeholderPages.length} pushed to Supabase.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
