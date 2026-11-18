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
 * Only the products the programme actually sells are linked, and any other
 * Sage row has its affiliate_url cleared. The Impact campaign is a Sage
 * Accounting campaign, so a tracking URL on Sage X3 or Sage CRM would send a
 * reader to an offer for a product they were not reading about.
 * `programForSlug` in lib/affiliate.ts decides which is which.
 *
 * The link is used verbatim; nothing is appended per product. Idempotent: rows
 * already correct are skipped, so reruns are free.
 *
 * Note what this column does and does not do. Rendering never reads
 * `affiliate_url` for an href; `outboundLink()` resolves the programme from
 * lib/affiliate.ts and adds the placement ID. A non-null value here is what
 * marks a row as monetised.
 *
 * To revert: set affiliate_url back to null on the same rows. Those products
 * then render a plain `nofollow` link to vendor_website instead.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { SAGE_AFFILIATE_URL, programForSlug } from "../lib/affiliate";

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
  let cleared = 0;
  let skipped = 0;

  for (const row of rows) {
    // Only the products the programme actually sells carry the link. The rest
    // are cleared: the campaign is a Sage Accounting campaign, and a tracking
    // URL sitting on Sage X3 or Sage CRM is how a reader ends up clicking
    // through to an accounting offer for a product they were not reading about.
    const covered = Boolean(programForSlug(row.slug));
    const target = covered ? SAGE_AFFILIATE_URL : null;

    if (row.affiliate_url === target) {
      skipped += 1;
      console.log(`  = ${row.slug} (already correct)`);
      continue;
    }

    if (dryRun) {
      if (covered) written += 1;
      else cleared += 1;
      console.log(`  ${covered ? "~" : "-"} ${row.slug}`);
      continue;
    }

    const { error: updateError } = await db
      .from("software")
      .update({ affiliate_url: target })
      .eq("id", row.id);
    if (updateError) throw new Error(`${row.slug}: ${updateError.message}`);

    if (covered) {
      written += 1;
      console.log(`  + ${row.slug}`);
    } else {
      cleared += 1;
      console.log(`  - ${row.slug} (not sold by this programme, link removed)`);
    }
  }

  console.log(
    `\n${dryRun ? "[dry run] would link" : "Linked"} ${written}, ` +
      `${dryRun ? "would clear" : "cleared"} ${cleared}, ${skipped} already correct.`
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
