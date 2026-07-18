/**
 * Stack Match (South Africa) — Sage affiliate link push.
 *
 *   npx tsx scripts/set-sage-affiliate-links.ts [--dry]
 *
 * Writes the Impact tracking URL onto every Sage row's `affiliate_url`, and
 * nothing else. Deliberately narrower than seed-sage.ts: that script rewrites
 * pricing, copy and ratings, which is far more blast radius than a link swap
 * needs against a live database.
 *
 * Destinations come from lib/affiliate.ts, so the deep-link rules (and the
 * shop.sage.co.za carve-out documented there) stay in one place. Idempotent —
 * rows already holding the correct URL are skipped, so reruns are free.
 *
 * To revert: set affiliate_url back to null on the same rows; /api/track-click
 * falls straight back to vendor_website.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { sageAffiliateUrl } from "../lib/affiliate";

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

const dryRun = process.argv.includes("--dry");
const db = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const { data: rows, error } = await db
    .from("software")
    .select("id, slug, vendor_name, vendor_website, affiliate_url")
    .eq("vendor_name", "Sage")
    .order("slug");
  if (error) throw new Error(`select software: ${error.message}`);
  if (!rows?.length) {
    console.log("No Sage rows found — nothing to do.");
    return;
  }

  let written = 0;
  let skipped = 0;

  for (const row of rows) {
    const target = sageAffiliateUrl(row.vendor_website);
    const deep = target.includes("?u=");

    if (row.affiliate_url === target) {
      skipped += 1;
      console.log(`  = ${row.slug} (already current)`);
      continue;
    }

    if (dryRun) {
      written += 1;
      console.log(`  ~ ${row.slug} -> ${deep ? "deep link" : "programme homepage"}`);
      continue;
    }

    const { error: updateError } = await db
      .from("software")
      .update({ affiliate_url: target })
      .eq("id", row.id);
    if (updateError) throw new Error(`${row.slug}: ${updateError.message}`);

    written += 1;
    console.log(`  + ${row.slug} -> ${deep ? "deep link" : "programme homepage"}`);
  }

  console.log(
    `\n${dryRun ? "[dry run] would update" : "Updated"} ${written} row(s), ${skipped} already current.`
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
