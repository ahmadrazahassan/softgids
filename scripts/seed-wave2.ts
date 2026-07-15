/**
 * Stack Match (South Africa) — wave two roster push.
 *
 *   npx tsx scripts/seed-wave2.ts
 *
 * Upserts the wave two products (Pipedrive, Freshsales, Zoho People, Deel,
 * NetSuite, SYSPRO, Palladium, Omni Accounts, ClickUp, Jira) from
 * lib/placeholder/software.ts into Supabase. Logo files are optional: when
 * /public/logos/<slug>.png exists it is used, otherwise logo_url stays null
 * and the site renders its branded initial fallback. Drop a logo in later
 * and rerun this script to pick it up. Idempotent by slug.
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { placeholderCategories } from "../lib/placeholder/categories";
import { placeholderSoftware } from "../lib/placeholder/software";
import { loadEnvLocal, stableId } from "./review-generator";

export const WAVE2_SLUGS = [
  "pipedrive",
  "freshsales",
  "zoho-people",
  "deel",
  "netsuite",
  "syspro",
  "palladium-accounting",
  "omni-accounts",
  "clickup",
  "jira",
];

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

function logoFor(slug: string, explicit: string | null): string | null {
  const local = resolve(process.cwd(), "public", "logos", `${slug}.png`);
  if (existsSync(local)) return `/logos/${slug}.png`;
  /* the roster defaults to /logos/<slug>.png even when no file exists yet;
     push null instead so the site renders its branded initial fallback */
  if (explicit && !explicit.startsWith("/logos/")) return explicit;
  return null;
}

async function main() {
  const products = placeholderSoftware.filter((p) => WAVE2_SLUGS.includes(p.slug));
  if (products.length !== WAVE2_SLUGS.length) {
    console.error("Wave two products missing from the placeholder roster.");
    process.exit(1);
  }

  const neededCategoryIds = new Set(products.map((p) => p.category_id).filter(Boolean));
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

  for (const product of products) {
    const logo = logoFor(product.slug, product.logo_url);
    await upsertBySlug("software", product.slug, {
      name: product.name,
      tagline: product.tagline,
      description_short: product.description_short,
      description_full: product.description_full,
      logo_url: logo,
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
      `  upserted ${product.name} (${product.slug}) — ${logo ? "logo file" : "initial avatar"}, ` +
        (product.starting_price === null
          ? "custom pricing"
          : product.starting_price === 0
            ? "free tier"
            : `from R${product.starting_price} per ${product.billing_period}`)
    );
  }
  console.log(`software: ${products.length} wave two products pushed to Supabase.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
