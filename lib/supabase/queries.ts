import { createPublicClient } from "./public";
import type {
  Article,
  Category,
  Comparison,
  Page,
  RatingDistribution,
  Review,
  ReviewFilters,
  SearchResults,
  SiteStats,
  Software,
  SoftwareListFilters,
} from "@/lib/types";
import {
  placeholderAlternatives,
  placeholderArticles,
  placeholderCategories,
  placeholderComparisons,
  placeholderPages,
  placeholderReviews,
  placeholderSettings,
  placeholderSoftware,
  placeholderStats,
} from "@/lib/placeholder";

/* ------------------------------------------------------------------ */
/* safe(): every public read degrades gracefully to its fallback when  */
/* Supabase is unconfigured or a query throws — the site always builds.*/
/* ------------------------------------------------------------------ */

async function safe<T>(fallback: T, fn: () => Promise<T>): Promise<T> {
  const client = createPublicClient();
  if (!client) return fallback;
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

function sb() {
  const client = createPublicClient();
  if (!client) throw new Error("Supabase not configured");
  return client;
}

/* ------------------------------------------------------------------ */
/* Expand/contract-safe column sets. `brand_color` and `integrations`  */
/* arrive via a later migration — probe once and fall back to the base */
/* column set when Postgres reports 42703 (undefined column).          */
/* ------------------------------------------------------------------ */

const CARD_COLUMNS_BASE =
  "id, name, slug, tagline, description_short, logo_url, category_id, starting_price, price_currency, billing_period, free_trial, free_version, overall_rating, ease_of_use_rating, value_for_money_rating, customer_service_rating, functionality_rating, review_count, status, featured, updated_at, vendor_name";
const CARD_COLUMNS_EXTENDED = `${CARD_COLUMNS_BASE}, brand_color`;

let extendedColumnsAvailable: boolean | null = null;

async function cardColumns(): Promise<string> {
  if (extendedColumnsAvailable === null) {
    const { error } = await sb()
      .from("software")
      .select("brand_color")
      .limit(1);
    extendedColumnsAvailable = !(error && error.code === "42703");
  }
  return extendedColumnsAvailable ? CARD_COLUMNS_EXTENDED : CARD_COLUMNS_BASE;
}

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

export async function getCategories(limit?: number): Promise<Category[]> {
  const fallback = limit ? placeholderCategories.slice(0, limit) : placeholderCategories;
  return safe(fallback, async () => {
    let query = sb()
      .from("categories")
      .select("*")
      .order("display_order", { ascending: true });
    if (limit) query = query.limit(limit);
    const { data, error } = await query;
    if (error) throw error;
    return (data as Category[]) ?? [];
  });
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const fallback = placeholderCategories.find((c) => c.slug === slug) ?? null;
  return safe(fallback, async () => {
    const { data, error } = await sb()
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    return (data as Category) ?? null;
  });
}

/* ------------------------------------------------------------------ */
/* Software                                                            */
/* ------------------------------------------------------------------ */

const published = (list: Software[]) => list.filter((s) => s.status === "published");

export async function getFeaturedSoftware(limit = 6): Promise<Software[]> {
  const fallback = published(placeholderSoftware).filter((s) => s.featured).slice(0, limit);
  return safe(fallback, async () => {
    const { data, error } = await sb()
      .from("software")
      .select(await cardColumns())
      .eq("status", "published")
      .eq("featured", true)
      .order("overall_rating", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data as unknown as Software[]) ?? [];
  });
}

export async function getTopRatedSoftware(limit = 6): Promise<Software[]> {
  const fallback = [...published(placeholderSoftware)]
    .sort((a, b) => b.overall_rating - a.overall_rating || b.review_count - a.review_count)
    .slice(0, limit);
  return safe(fallback, async () => {
    const { data, error } = await sb()
      .from("software")
      .select(await cardColumns())
      .eq("status", "published")
      .order("overall_rating", { ascending: false })
      .order("review_count", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data as unknown as Software[]) ?? [];
  });
}

export async function getRecentlyUpdatedSoftware(limit = 6): Promise<Software[]> {
  const fallback = [...published(placeholderSoftware)]
    .sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""))
    .slice(0, limit);
  return safe(fallback, async () => {
    const { data, error } = await sb()
      .from("software")
      .select(await cardColumns())
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data as unknown as Software[]) ?? [];
  });
}

export async function getSoftwareBySlug(slug: string): Promise<Software | null> {
  const fallback =
    published(placeholderSoftware).find((s) => s.slug === slug) ?? null;
  return safe(fallback, async () => {
    const { data, error } = await sb()
      .from("software")
      .select("*, category:categories(*)")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw error;
    return (data as unknown as Software) ?? null;
  });
}

export interface SoftwareListResult {
  items: Software[];
  total: number;
}

export async function getSoftwareList(
  filters: SoftwareListFilters = {}
): Promise<SoftwareListResult> {
  const {
    category,
    minRating,
    freeTrial,
    freeVersion,
    paidOnly,
    sort = "reviews",
    page = 1,
    perPage = 10,
  } = filters;

  const fallback = (() => {
    let items = published(placeholderSoftware);
    if (category) items = items.filter((s) => s.category?.slug === category);
    if (minRating) items = items.filter((s) => s.overall_rating >= minRating);
    if (freeTrial) items = items.filter((s) => s.free_trial);
    if (freeVersion) items = items.filter((s) => s.free_version);
    if (paidOnly) items = items.filter((s) => (s.starting_price ?? 1) > 0 || s.starting_price === null);
    items = [...items].sort((a, b) => {
      if (sort === "rating") return b.overall_rating - a.overall_rating || b.review_count - a.review_count;
      if (sort === "recent") return (b.updated_at ?? "").localeCompare(a.updated_at ?? "");
      return b.review_count - a.review_count || b.overall_rating - a.overall_rating;
    });
    const total = items.length;
    const start = (page - 1) * perPage;
    return { items: items.slice(start, start + perPage), total };
  })();

  return safe(fallback, async () => {
    let categoryId: string | undefined;
    if (category) {
      const cat = await getCategoryBySlug(category);
      if (!cat) return { items: [], total: 0 };
      categoryId = cat.id;
    }
    let query = sb()
      .from("software")
      .select(await cardColumns(), { count: "exact" })
      .eq("status", "published");
    if (categoryId) query = query.eq("category_id", categoryId);
    if (minRating) query = query.gte("overall_rating", minRating);
    if (freeTrial) query = query.eq("free_trial", true);
    if (freeVersion) query = query.eq("free_version", true);
    if (paidOnly) query = query.or("starting_price.gt.0,starting_price.is.null");
    if (sort === "rating") {
      query = query
        .order("overall_rating", { ascending: false })
        .order("review_count", { ascending: false });
    } else if (sort === "recent") {
      query = query.order("updated_at", { ascending: false });
    } else {
      query = query
        .order("review_count", { ascending: false })
        .order("overall_rating", { ascending: false });
    }
    const start = (page - 1) * perPage;
    query = query.range(start, start + perPage - 1);
    const { data, count, error } = await query;
    if (error) throw error;
    return { items: (data as unknown as Software[]) ?? [], total: count ?? 0 };
  });
}

/* ------------------------------------------------------------------ */
/* Reviews                                                             */
/* ------------------------------------------------------------------ */

export async function getReviewsForSoftware(
  softwareId: string,
  filters: ReviewFilters = {}
): Promise<Review[]> {
  const { country, industry, companySize, duration, sort = "helpful" } = filters;

  const fallback = (() => {
    let items = placeholderReviews.filter(
      (r) => r.software_id === softwareId && r.status === "published"
    );
    if (country) items = items.filter((r) => r.reviewer_country === country);
    if (industry) items = items.filter((r) => r.reviewer_industry === industry);
    if (companySize) items = items.filter((r) => r.reviewer_company_size === companySize);
    if (duration) items = items.filter((r) => r.used_for_duration === duration);
    return [...items].sort((a, b) =>
      sort === "recent"
        ? b.review_date.localeCompare(a.review_date)
        : b.helpful_count - a.helpful_count || b.review_date.localeCompare(a.review_date)
    );
  })();

  return safe(fallback, async () => {
    let query = sb()
      .from("reviews")
      .select("*")
      .eq("software_id", softwareId)
      .eq("status", "published");
    if (country) query = query.eq("reviewer_country", country);
    if (industry) query = query.eq("reviewer_industry", industry);
    if (companySize) query = query.eq("reviewer_company_size", companySize);
    if (duration) query = query.eq("used_for_duration", duration);
    query =
      sort === "recent"
        ? query.order("review_date", { ascending: false })
        : query
            .order("helpful_count", { ascending: false })
            .order("review_date", { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    return (data as Review[]) ?? [];
  });
}

export async function getRatingDistribution(
  softwareId: string
): Promise<RatingDistribution> {
  const empty: RatingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const fromRows = (rows: Array<{ overall_rating: number }>) =>
    rows.reduce<RatingDistribution>(
      (acc, row) => {
        const star = Math.min(5, Math.max(1, Math.round(row.overall_rating))) as 1 | 2 | 3 | 4 | 5;
        acc[star] += 1;
        return acc;
      },
      { ...empty }
    );

  const fallback = fromRows(
    placeholderReviews.filter(
      (r) => r.software_id === softwareId && r.status === "published"
    )
  );

  return safe(fallback, async () => {
    const { data, error } = await sb()
      .from("reviews")
      .select("overall_rating")
      .eq("software_id", softwareId)
      .eq("status", "published");
    if (error) throw error;
    return fromRows((data as Array<{ overall_rating: number }>) ?? []);
  });
}

/* ------------------------------------------------------------------ */
/* Alternatives & comparisons                                          */
/* ------------------------------------------------------------------ */

export async function getAlternatives(softwareId: string): Promise<Software[]> {
  const fallback = (() => {
    const product = placeholderSoftware.find((s) => s.id === softwareId);
    if (!product) return [];
    const slugs = placeholderAlternatives[product.slug] ?? [];
    return slugs
      .map((slug) => placeholderSoftware.find((s) => s.slug === slug))
      .filter((s): s is Software => Boolean(s && s.status === "published"));
  })();

  return safe(fallback, async () => {
    const { data, error } = await sb()
      .from("software_alternatives")
      .select("display_order, alternative:software!software_alternatives_alternative_id_fkey(*)")
      .eq("software_id", softwareId)
      .order("display_order", { ascending: true });
    if (error) throw error;
    return ((data ?? []) as unknown as Array<{ alternative: Software }>)
      .map((row) => row.alternative)
      .filter((s) => s && s.status === "published");
  });
}

export async function getCategoryPeers(
  softwareId: string,
  categoryId: string | null,
  limit = 4
): Promise<Software[]> {
  const fallback = published(placeholderSoftware)
    .filter((s) => s.id !== softwareId && s.category_id === categoryId)
    .sort((a, b) => b.overall_rating - a.overall_rating)
    .slice(0, limit);

  if (!categoryId) return fallback;
  return safe(fallback, async () => {
    const { data, error } = await sb()
      .from("software")
      .select(await cardColumns())
      .eq("status", "published")
      .eq("category_id", categoryId)
      .neq("id", softwareId)
      .order("overall_rating", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data as unknown as Software[]) ?? [];
  });
}

export async function getComparisonRecord(
  aId: string,
  bId: string
): Promise<Comparison | null> {
  const fallback =
    placeholderComparisons.find(
      (c) =>
        (c.software_a_id === aId && c.software_b_id === bId) ||
        (c.software_a_id === bId && c.software_b_id === aId)
    ) ?? null;
  return safe(fallback, async () => {
    const { data, error } = await sb()
      .from("comparisons")
      .select("*")
      .eq("status", "published")
      .or(
        `and(software_a_id.eq.${aId},software_b_id.eq.${bId}),and(software_a_id.eq.${bId},software_b_id.eq.${aId})`
      )
      .maybeSingle();
    if (error) throw error;
    return (data as Comparison) ?? null;
  });
}

export async function getPublishedComparisons(): Promise<Comparison[]> {
  return safe(placeholderComparisons, async () => {
    const { data, error } = await sb()
      .from("comparisons")
      .select(
        "*, software_a:software!comparisons_software_a_id_fkey(*), software_b:software!comparisons_software_b_id_fkey(*)"
      )
      .eq("status", "published")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as unknown as Comparison[]) ?? [];
  });
}

/* ------------------------------------------------------------------ */
/* Articles & pages                                                    */
/* ------------------------------------------------------------------ */

export interface ArticleListResult {
  items: Article[];
  total: number;
}

const publishedArticles = () =>
  placeholderArticles
    .filter((a) => a.status === "published")
    .sort((a, b) => b.published_date.localeCompare(a.published_date));

export async function getArticles(page = 1, perPage = 9): Promise<ArticleListResult> {
  const all = publishedArticles();
  const fallback = {
    items: all.slice((page - 1) * perPage, page * perPage),
    total: all.length,
  };
  return safe(fallback, async () => {
    const start = (page - 1) * perPage;
    const { data, count, error } = await sb()
      .from("articles")
      .select("*", { count: "exact" })
      .eq("status", "published")
      .order("published_date", { ascending: false })
      .range(start, start + perPage - 1);
    if (error) throw error;
    return { items: (data as Article[]) ?? [], total: count ?? 0 };
  });
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const fallback = (() => {
    const article = publishedArticles().find((a) => a.slug === slug) ?? null;
    if (!article) return null;
    return {
      ...article,
      related_software: article.related_software_id
        ? placeholderSoftware.find((s) => s.id === article.related_software_id) ?? null
        : null,
    };
  })();
  return safe(fallback, async () => {
    const { data, error } = await sb()
      .from("articles")
      .select("*, related_software:software(*)")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw error;
    return (data as unknown as Article) ?? null;
  });
}

export async function getLatestArticles(limit = 3): Promise<Article[]> {
  const fallback = publishedArticles().slice(0, limit);
  return safe(fallback, async () => {
    const { data, error } = await sb()
      .from("articles")
      .select("*")
      .eq("status", "published")
      .order("published_date", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data as Article[]) ?? [];
  });
}

export async function getPageBySlug(slug: string): Promise<Page | null> {
  const fallback = placeholderPages.find((p) => p.slug === slug) ?? null;
  return safe(fallback, async () => {
    const { data, error } = await sb()
      .from("pages")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw error;
    return (data as Page) ?? null;
  });
}

/* ------------------------------------------------------------------ */
/* Stats, search, settings                                             */
/* ------------------------------------------------------------------ */

export async function getSiteStats(): Promise<SiteStats> {
  return safe(placeholderStats(), async () => {
    const [reviews, software, categories] = await Promise.all([
      sb().from("reviews").select("id", { count: "exact", head: true }).eq("status", "published"),
      sb().from("software").select("id", { count: "exact", head: true }).eq("status", "published"),
      sb().from("categories").select("id", { count: "exact", head: true }),
    ]);
    return {
      reviews: reviews.count ?? 0,
      software: software.count ?? 0,
      categories: categories.count ?? 0,
    };
  });
}

export async function searchContent(query: string): Promise<SearchResults> {
  const q = query.trim();
  if (!q) return { software: [], articles: [] };

  const fallback = (() => {
    const needle = q.toLowerCase();
    const software = published(placeholderSoftware).filter((s) =>
      [s.name, s.tagline ?? "", s.description_short, s.vendor_name ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
    const articles = publishedArticles().filter((a) =>
      [a.title, a.excerpt ?? ""].join(" ").toLowerCase().includes(needle)
    );
    return { software, articles };
  })();

  return safe(fallback, async () => {
    const [softwareRes, articleRes] = await Promise.all([
      sb()
        .from("software")
        .select(await cardColumns())
        .eq("status", "published")
        .textSearch("search_vector", q, { type: "plain", config: "english" })
        .limit(20),
      sb()
        .from("articles")
        .select("*")
        .eq("status", "published")
        .textSearch("search_vector", q, { type: "plain", config: "english" })
        .limit(10),
    ]);
    if (softwareRes.error) throw softwareRes.error;
    if (articleRes.error) throw articleRes.error;
    return {
      software: (softwareRes.data as unknown as Software[]) ?? [],
      articles: (articleRes.data as Article[]) ?? [],
    };
  });
}

export async function getSiteSettings(): Promise<Record<string, string>> {
  return safe(placeholderSettings, async () => {
    const { data, error } = await sb().from("site_settings").select("key, value");
    if (error) throw error;
    const map: Record<string, string> = { ...placeholderSettings };
    for (const row of (data as Array<{ key: string; value: string }>) ?? []) {
      map[row.key] = row.value;
    }
    return map;
  });
}
