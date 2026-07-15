/**
 * Stack Match (South Africa) — Sage roster push.
 *
 *   npx tsx scripts/seed-sage.ts
 *
 * Upserts only the Sage products (vendor_name === "Sage") from
 * lib/placeholder/software.ts into Supabase, with current official
 * ZAR pricing verified against sage.com/en-za and shop.sage.co.za.
 * Categories referenced by those products are upserted first so the
 * script also works against an empty database. Idempotent: rows are
 * keyed by slug with deterministic ids, so reruns change nothing.
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { placeholderCategories } from "../lib/placeholder/categories";
import { placeholderSoftware } from "../lib/placeholder/software";

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
  const sageProducts = placeholderSoftware.filter((p) => p.vendor_name === "Sage");
  if (sageProducts.length === 0) {
    console.error("No Sage products found in the placeholder roster.");
    process.exit(1);
  }

  /* ----- categories the Sage products need ----- */
  const neededCategoryIds = new Set(sageProducts.map((p) => p.category_id).filter(Boolean));
  const categoryIdByPlaceholder = new Map<string, string>();
  for (const category of placeholderCategories) {
    if (!neededCategoryIds.has(category.id)) continue;
    const id = await upsertBySlug("categories", category.slug, {
      name: category.name,
      icon: category.icon,
      description: category.description,
      display_order: category.display_order,
    });
    categoryIdByPlaceholder.set(category.id, id);
  }
  console.log(`categories: ${categoryIdByPlaceholder.size}`);

  /* ----- Sage software (aggregate ratings stay trigger-owned) ----- */
  for (const product of sageProducts) {
    await upsertBySlug("software", product.slug, {
      name: product.name,
      tagline: product.tagline,
      description_short: product.description_short,
      description_full: product.description_full,
      logo_url: product.logo_url ?? `/logos/${product.slug}.png`,
      screenshots: product.screenshots,
      category_id: product.category_id
        ? (categoryIdByPlaceholder.get(product.category_id) ?? null)
        : null,
      starting_price: product.starting_price,
      price_currency: product.price_currency,
      billing_period: product.billing_period,
      free_trial: product.free_trial,
      free_version: product.free_version,
      pricing_plans: product.pricing_plans,
      features: product.features,
      top_features: product.top_features,
      integrations: product.integrations,
      brand_color: product.brand_color ?? null,
      affiliate_url: product.affiliate_url,
      vendor_website: product.vendor_website,
      vendor_name: product.vendor_name,
      founded_year: product.founded_year,
      support_types: product.support_types,
      countries_available: product.countries_available,
      languages: product.languages,
      meta_title: product.meta_title ?? null,
      meta_description: product.meta_description ?? null,
      status: product.status,
      featured: product.featured,
    });
    console.log(
      `  upserted ${product.name} (${product.slug}) — ` +
        (product.starting_price === null
          ? "custom pricing"
          : `from R${product.starting_price} per ${product.billing_period}`)
    );
  }
  console.log(`software: ${sageProducts.length} Sage products pushed to Supabase.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
