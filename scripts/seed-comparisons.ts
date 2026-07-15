/**
 * Stack Match (South Africa) — comparisons push + category count repair.
 *
 *   npx tsx scripts/seed-comparisons.ts
 *
 * Upserts every curated comparison from lib/placeholder/index.ts into
 * Supabase, resolving software ids by slug from the live database, and then
 * recalculates categories.software_count from published software (the
 * database trigger owns this normally, but a database created before the
 * trigger existed shows 0 everywhere until repaired). Idempotent.
 */

import { createClient } from "@supabase/supabase-js";
import { placeholderComparisons, placeholderSoftware } from "../lib/placeholder";
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
  /* ----- resolve live software ids by slug ----- */
  const { data: softwareRows, error: swError } = await db
    .from("software")
    .select("id, slug");
  if (swError) throw new Error(`software lookup: ${swError.message}`);
  const idBySlug = new Map((softwareRows ?? []).map((r) => [r.slug, r.id]));

  const slugByPlaceholderId = new Map(
    placeholderSoftware.map((s) => [s.id, s.slug])
  );

  /* ----- comparisons ----- */
  let pushed = 0;
  for (const comparison of placeholderComparisons) {
    const slugA = slugByPlaceholderId.get(comparison.software_a_id);
    const slugB = slugByPlaceholderId.get(comparison.software_b_id);
    const idA = slugA ? idBySlug.get(slugA) : undefined;
    const idB = slugB ? idBySlug.get(slugB) : undefined;
    if (!idA || !idB) {
      console.warn(`  skipped ${comparison.id}: ${slugA ?? "?"} vs ${slugB ?? "?"} not in database`);
      continue;
    }
    const { error } = await db.from("comparisons").upsert(
      {
        id: stableId("comparison", comparison.id),
        software_a_id: idA,
        software_b_id: idB,
        custom_verdict: comparison.custom_verdict,
        status: comparison.status,
      },
      { onConflict: "id" }
    );
    if (error) throw new Error(`comparison ${comparison.id}: ${error.message}`);
    console.log(`  upserted ${slugA} vs ${slugB}`);
    pushed += 1;
  }
  console.log(`comparisons: ${pushed} pushed to Supabase.`);

  /* ----- repair categories.software_count ----- */
  const { data: categories, error: catError } = await db
    .from("categories")
    .select("id, slug");
  if (catError) throw new Error(`categories lookup: ${catError.message}`);

  for (const category of categories ?? []) {
    const { count, error: countError } = await db
      .from("software")
      .select("id", { count: "exact", head: true })
      .eq("category_id", category.id)
      .eq("status", "published");
    if (countError) throw new Error(`count ${category.slug}: ${countError.message}`);
    const { error: updateError } = await db
      .from("categories")
      .update({ software_count: count ?? 0 })
      .eq("id", category.id);
    if (updateError) throw new Error(`update ${category.slug}: ${updateError.message}`);
    console.log(`  ${category.slug}: ${count ?? 0} products`);
  }
  console.log("category counts repaired.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
