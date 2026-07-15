/**
 * Stack Match (South Africa) — new-wave roster + reviews push.
 *
 *   npx tsx scripts/seed-newwave.ts
 *
 * Upserts the ten new-wave products (five Sage additions plus CaseWare,
 * Draftworx, Skynamo, QuickEasy BOS and Paymaster) from the placeholder
 * roster into Supabase, then pushes their generated review corpus from
 * lib/placeholder/reviews-new.ts. Categories referenced by the products are
 * upserted first so the script works against an empty database too.
 *
 * Idempotent: software rows are keyed by slug with deterministic ids, reviews
 * keep their generated ids, so reruns change nothing. Aggregate ratings stay
 * owned by the database trigger.
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { placeholderCategories } from "../lib/placeholder/categories";
import { placeholderSoftware } from "../lib/placeholder/software";
import { newReviewBank } from "../lib/placeholder/reviews-new";

const NEW_SLUGS = new Set([
  "sage-payroll-professional",
  "sage-300-people",
  "sage-intacct",
  "sage-x3",
  "sage-crm",
  "caseware",
  "draftworx",
  "skynamo",
  "quickeasy-bos",
  "paymaster",
]);

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
  const products = placeholderSoftware.filter((p) => NEW_SLUGS.has(p.slug));
  if (products.length !== NEW_SLUGS.size) {
    console.error(
      `Expected ${NEW_SLUGS.size} new products in the roster, found ${products.length}.`
    );
    process.exit(1);
  }

  /* ----- categories the new products need ----- */
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

  /* ----- software (aggregate ratings stay trigger-owned) ----- */
  const dbIdByPlaceholderId = new Map<string, string>();
  for (const product of products) {
    const dbId = await upsertBySlug("software", product.slug, {
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
    dbIdByPlaceholderId.set(product.id, dbId);
    console.log(
      `  upserted ${product.name} (${product.slug}) — ` +
        (product.starting_price === null
          ? "custom pricing"
          : `from R${product.starting_price} per ${product.billing_period}`)
    );
  }
  console.log(`software: ${products.length} products pushed.`);

  /* ----- reviews: remap placeholder software_id -> Supabase uuid ----- */
  const rows = newReviewBank
    .map((review) => {
      const softwareId = dbIdByPlaceholderId.get(review.software_id);
      if (!softwareId) return null;
      return {
        id: stableId("newwave-review", review.id),
        software_id: softwareId,
        reviewer_name: review.reviewer_name,
        reviewer_job_title: review.reviewer_job_title,
        reviewer_company: review.reviewer_company,
        reviewer_industry: review.reviewer_industry,
        reviewer_company_size: review.reviewer_company_size,
        reviewer_country: review.reviewer_country,
        reviewer_avatar_url: review.reviewer_avatar_url,
        verified_linkedin: review.verified_linkedin,
        verified_badge: review.verified_badge,
        used_for_duration: review.used_for_duration,
        overall_rating: review.overall_rating,
        ease_of_use: review.ease_of_use,
        value_for_money: review.value_for_money,
        customer_service: review.customer_service,
        functionality: review.functionality,
        review_title: review.review_title,
        summary: review.summary,
        pros: review.pros,
        cons: review.cons,
        vendor_response: review.vendor_response,
        vendor_response_date: review.vendor_response_date,
        review_date: review.review_date,
        helpful_count: review.helpful_count,
        status: review.status,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  for (let offset = 0; offset < rows.length; offset += 100) {
    const chunk = rows.slice(offset, offset + 100);
    const { error } = await db.from("reviews").upsert(chunk, { onConflict: "id" });
    if (error) throw new Error(`reviews chunk @${offset}: ${error.message}`);
  }
  console.log(`reviews: ${rows.length} pushed. Aggregates recalculated by trigger.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
