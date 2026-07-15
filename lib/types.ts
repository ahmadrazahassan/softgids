/**
 * Shared domain types — mirror of the Supabase schema described in
 * docs/prompts/PROMPT_BACKEND_SOUTH_AFRICA.md. The frontend codes against
 * these contracts; Phase 2 wires them to live tables.
 */

export type SoftwareStatus = "published" | "draft";
export type ReviewStatus = "published" | "hidden";
export type ArticleStatus = "published" | "draft";
export type NewsletterStatus = "pending" | "confirmed" | "unsubscribed";

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  software_count: number;
  display_order: number;
  created_at?: string;
}

export interface PricingPlan {
  name: string;
  price: number | null; // null = custom / contact sales
  currency?: string; // defaults to software.price_currency (ZAR)
  period?: string; // "month" | "year" | "user/month" | "employee/month"
  description?: string;
  features?: string[];
  highlighted?: boolean;
  price_label?: string; // overrides formatting, e.g. "Free", "Custom"
}

export interface Software {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description_short: string;
  description_full: string;
  logo_url: string | null;
  screenshots: string[];
  category_id: string | null;
  category?: Category | null;

  starting_price: number | null;
  price_currency: string; // default 'ZAR'
  billing_period: string; // default 'month'
  free_trial: boolean;
  free_version: boolean;
  pricing_plans: PricingPlan[];

  features: string[];
  top_features: string[];
  integrations: string[];
  brand_color?: string | null;

  affiliate_url: string | null;
  vendor_website: string | null;

  vendor_name: string | null;
  founded_year: number | null;
  support_types: string[];
  countries_available: string[];
  languages: string[];

  overall_rating: number;
  ease_of_use_rating: number;
  value_for_money_rating: number;
  customer_service_rating: number;
  functionality_rating: number;
  review_count: number;

  meta_title?: string | null;
  meta_description?: string | null;
  og_image_url?: string | null;

  status: SoftwareStatus;
  featured: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Review {
  id: string;
  software_id: string;
  reviewer_name: string;
  reviewer_job_title: string | null;
  reviewer_company: string | null;
  reviewer_industry: string | null;
  reviewer_company_size: string | null;
  reviewer_country: string; // default 'South Africa'
  reviewer_avatar_url: string | null;
  verified_linkedin: boolean;
  verified_badge: string | null;
  used_for_duration: string | null;
  overall_rating: number;
  ease_of_use: number | null;
  value_for_money: number | null;
  customer_service: number | null;
  functionality: number | null;
  review_title: string;
  summary: string | null;
  pros: string | null;
  cons: string | null;
  vendor_response: string | null;
  vendor_response_date: string | null;
  review_date: string;
  helpful_count: number;
  status: ReviewStatus;
  created_at?: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image_url: string | null;
  category_tag: string | null;
  related_software_id: string | null;
  related_software?: Software | null;
  author_name: string;
  author_bio: string | null;
  author_avatar_url: string | null;
  author_title: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  read_time_minutes: number;
  status: ArticleStatus;
  featured: boolean;
  published_date: string;
  created_at?: string;
  updated_at?: string;
}

export interface Page {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_title?: string | null;
  meta_description?: string | null;
  status: "published" | "draft";
  updated_at?: string;
}

export interface Comparison {
  id: string;
  software_a_id: string;
  software_b_id: string;
  software_a?: Software | null;
  software_b?: Software | null;
  custom_verdict: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  status: "published" | "draft";
  created_at?: string;
}

export interface AffiliateClick {
  id: string;
  software_id: string | null;
  software_name: string | null;
  affiliate_url: string | null;
  clicked_at: string;
  ip_hash: string | null;
  user_agent: string | null;
  referrer: string | null;
  country_code: string | null;
}

export interface SiteSetting {
  id: string;
  key: string;
  value: string;
  updated_at?: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  status: NewsletterStatus;
  interests: string[];
  confirm_token: string | null;
  confirmed_at: string | null;
  unsubscribed_at: string | null;
  consent_ip_hash: string | null;
  consent_source: string | null;
  user_agent: string | null;
  created_at: string;
}

/* ---------- Fetcher contracts ---------- */

export type SoftwareSort = "reviews" | "rating" | "recent";

export interface SoftwareListFilters {
  category?: string; // category slug
  minRating?: number;
  freeTrial?: boolean;
  freeVersion?: boolean;
  paidOnly?: boolean;
  sort?: SoftwareSort;
  page?: number;
  perPage?: number;
}

export type ReviewSort = "helpful" | "recent";

export interface ReviewFilters {
  country?: string;
  industry?: string;
  companySize?: string;
  duration?: string;
  sort?: ReviewSort;
}

export interface RatingDistribution {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

export interface SiteStats {
  reviews: number;
  software: number;
  categories: number;
}

export interface SearchResults {
  software: Software[];
  articles: Article[];
}
