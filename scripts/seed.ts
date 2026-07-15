/**
 * Stack Match (South Africa) — database seed.
 *
 *   npm run seed
 *
 * Upserts the SA roster (categories, software with rand pricing, reviews,
 * articles, comparisons, alternatives, pages, settings) using the service
 * role key from .env.local. Idempotent: rows are keyed by slug or by a
 * deterministic id, so running it twice changes nothing.
 *
 * Aggregate ratings are never written here; the update_software_ratings()
 * trigger derives them from the seeded reviews.
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { placeholderCategories } from "../lib/placeholder/categories";
import { placeholderSoftware } from "../lib/placeholder/software";
import { placeholderReviews } from "../lib/placeholder/reviews";
import { placeholderArticles } from "../lib/placeholder/articles";
import { placeholderPages } from "../lib/placeholder/pages";
import { placeholderAlternatives, placeholderComparisons } from "../lib/placeholder";

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
  // RFC 4122 shape, version 5 style, variant 10
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

const demoSuffix = process.env.SEED_NO_DEMO_SUFFIX ? "" : " (Demo)";

async function main() {
  /* ----- categories ----- */
  const categoryIdBySlug = new Map<string, string>();
  const categoryIdByPlaceholder = new Map<string, string>();
  for (const category of placeholderCategories) {
    const id = await upsertBySlug("categories", category.slug, {
      name: category.name,
      icon: category.icon,
      description: category.description,
      display_order: category.display_order,
    });
    categoryIdBySlug.set(category.slug, id);
    categoryIdByPlaceholder.set(category.id, id);
  }
  console.log(`categories: ${categoryIdBySlug.size}`);

  /* ----- software (no aggregate ratings; the trigger owns those) ----- */
  const softwareIdByPlaceholder = new Map<string, string>();
  const softwareIdBySlug = new Map<string, string>();
  for (const product of placeholderSoftware) {
    const id = await upsertBySlug("software", product.slug, {
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
    softwareIdByPlaceholder.set(product.id, id);
    softwareIdBySlug.set(product.slug, id);
  }
  console.log(`software: ${softwareIdByPlaceholder.size}`);

  /* ----- reviews (idempotent by deterministic id) ----- */
  let seededReviews = 0;
  for (const review of placeholderReviews) {
    const softwareId = softwareIdByPlaceholder.get(review.software_id);
    if (!softwareId) continue;
    const { error } = await db.from("reviews").upsert(
      {
        id: stableId("review", review.id),
        software_id: softwareId,
        reviewer_name: review.reviewer_name + demoSuffix,
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
      },
      { onConflict: "id" }
    );
    if (error) throw new Error(`review ${review.id}: ${error.message}`);
    seededReviews += 1;
  }
  console.log(`reviews: ${seededReviews}`);

  /* ----- articles ----- */
  for (const article of placeholderArticles) {
    await upsertBySlug("articles", article.slug, {
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      featured_image_url: article.featured_image_url,
      category_tag: article.category_tag,
      related_software_id: article.related_software_id
        ? (softwareIdByPlaceholder.get(article.related_software_id) ?? null)
        : null,
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
  }
  console.log(`articles: ${placeholderArticles.length}`);

  /* ----- alternatives ----- */
  let seededAlternatives = 0;
  for (const [slug, alternativeSlugs] of Object.entries(placeholderAlternatives)) {
    const softwareId = softwareIdBySlug.get(slug);
    if (!softwareId) continue;
    for (let index = 0; index < alternativeSlugs.length; index += 1) {
      const alternativeId = softwareIdBySlug.get(alternativeSlugs[index]);
      if (!alternativeId) continue;
      const { error } = await db.from("software_alternatives").upsert(
        {
          id: stableId("alternative", `${slug}:${alternativeSlugs[index]}`),
          software_id: softwareId,
          alternative_id: alternativeId,
          display_order: index,
        },
        { onConflict: "software_id,alternative_id" }
      );
      if (error) throw new Error(`alternative ${slug}: ${error.message}`);
      seededAlternatives += 1;
    }
  }
  console.log(`alternatives: ${seededAlternatives}`);

  /* ----- comparisons ----- */
  for (const comparison of placeholderComparisons) {
    const { error } = await db.from("comparisons").upsert(
      {
        id: stableId("comparison", comparison.id),
        software_a_id: softwareIdByPlaceholder.get(comparison.software_a_id),
        software_b_id: softwareIdByPlaceholder.get(comparison.software_b_id),
        custom_verdict: comparison.custom_verdict,
        status: comparison.status,
      },
      { onConflict: "id" }
    );
    if (error) throw new Error(`comparison ${comparison.id}: ${error.message}`);
  }
  console.log(`comparisons: ${placeholderComparisons.length}`);

  /* ----- pages ----- */
  for (const page of placeholderPages) {
    await upsertBySlug("pages", page.slug, {
      title: page.title,
      content: page.content,
      meta_title: page.meta_title ?? null,
      meta_description: page.meta_description ?? null,
      status: page.status,
    });
  }
  console.log(`pages: ${placeholderPages.length}`);

  console.log("Seed complete. Ratings and category counts were derived by triggers.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
