/**
 * Admin resource registry. One field map per table drives both the form
 * renderer and the save action, so nothing outside this whitelist can be
 * written from the admin panel.
 */

export type FieldType =
  | "text"
  | "textarea"
  | "html"
  | "number"
  | "checkbox"
  | "select"
  | "date"
  | "color"
  | "json";

export interface FieldSpec {
  name: string;
  label: string;
  type: FieldType;
  options?: string[];
  required?: boolean;
  hint?: string;
  rows?: number;
}

export interface ResourceSpec {
  table: string;
  title: string;
  /** column shown as the row label in lists */
  labelColumn: string;
  fields: FieldSpec[];
}

const status = (values: string[]): FieldSpec => ({
  name: "status",
  label: "Status",
  type: "select",
  options: values,
  required: true,
});

export const RESOURCES: Record<string, ResourceSpec> = {
  software: {
    table: "software",
    title: "Software",
    labelColumn: "name",
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "tagline", label: "Tagline", type: "text" },
      { name: "description_short", label: "Short description", type: "textarea", required: true, rows: 3 },
      { name: "description_full", label: "Full description (HTML)", type: "html", required: true, rows: 14 },
      { name: "logo_url", label: "Logo URL", type: "text" },
      { name: "screenshots", label: "Screenshots (JSON array of URLs)", type: "json", rows: 3 },
      { name: "category_id", label: "Category", type: "select", options: [] },
      { name: "starting_price", label: "Starting price", type: "number" },
      { name: "price_currency", label: "Currency", type: "select", options: ["ZAR", "USD", "EUR", "GBP"] },
      { name: "billing_period", label: "Billing period", type: "text", hint: "month, year, user/month" },
      { name: "free_trial", label: "Free trial", type: "checkbox" },
      { name: "free_version", label: "Free version", type: "checkbox" },
      { name: "pricing_plans", label: "Pricing plans (JSON)", type: "json", rows: 10 },
      { name: "features", label: "Features (JSON array)", type: "json", rows: 5 },
      { name: "top_features", label: "Top features (JSON array)", type: "json", rows: 3 },
      { name: "integrations", label: "Integrations (JSON array)", type: "json", rows: 3 },
      { name: "brand_color", label: "Brand colour", type: "color" },
      { name: "affiliate_url", label: "Affiliate URL", type: "text" },
      { name: "vendor_website", label: "Vendor website", type: "text" },
      { name: "vendor_name", label: "Vendor name", type: "text" },
      { name: "founded_year", label: "Founded year", type: "number" },
      { name: "support_types", label: "Support types (JSON array)", type: "json", rows: 2 },
      { name: "countries_available", label: "Countries available (JSON array)", type: "json", rows: 2, hint: "Lead with South Africa" },
      { name: "languages", label: "Languages (JSON array)", type: "json", rows: 2 },
      { name: "meta_title", label: "Meta title", type: "text" },
      { name: "meta_description", label: "Meta description", type: "textarea", rows: 2 },
      status(["draft", "published"]),
      { name: "featured", label: "Featured", type: "checkbox" },
    ],
  },
  reviews: {
    table: "reviews",
    title: "Reviews",
    labelColumn: "review_title",
    fields: [
      { name: "software_id", label: "Software", type: "select", options: [], required: true },
      { name: "reviewer_name", label: "Reviewer name", type: "text", required: true },
      { name: "reviewer_job_title", label: "Job title", type: "text" },
      { name: "reviewer_company", label: "Company", type: "text" },
      { name: "reviewer_industry", label: "Industry", type: "text" },
      { name: "reviewer_company_size", label: "Company size", type: "text" },
      {
        name: "reviewer_country",
        label: "Country",
        type: "select",
        options: ["South Africa", "Namibia", "Botswana", "Zambia", "Kenya", "Nigeria", "Zimbabwe", "Other"],
      },
      { name: "used_for_duration", label: "Used for", type: "text" },
      { name: "overall_rating", label: "Overall rating (1 to 5)", type: "number", required: true },
      { name: "ease_of_use", label: "Ease of use", type: "number" },
      { name: "value_for_money", label: "Value for money", type: "number" },
      { name: "customer_service", label: "Customer service", type: "number" },
      { name: "functionality", label: "Functionality", type: "number" },
      { name: "review_title", label: "Review title", type: "text", required: true },
      { name: "summary", label: "Summary", type: "textarea", rows: 5 },
      { name: "pros", label: "Pros", type: "textarea", rows: 3 },
      { name: "cons", label: "Cons", type: "textarea", rows: 3 },
      { name: "vendor_response", label: "Vendor response", type: "textarea", rows: 3 },
      { name: "review_date", label: "Review date", type: "date" },
      { name: "verified_linkedin", label: "Verified via LinkedIn", type: "checkbox" },
      { name: "verified_badge", label: "Verified badge", type: "text" },
      status(["published", "hidden"]),
    ],
  },
  categories: {
    table: "categories",
    title: "Categories",
    labelColumn: "name",
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "icon", label: "Icon (lucide name)", type: "text" },
      { name: "description", label: "Description", type: "textarea", rows: 3 },
      { name: "display_order", label: "Display order", type: "number" },
    ],
  },
  articles: {
    table: "articles",
    title: "Articles",
    labelColumn: "title",
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "excerpt", label: "Excerpt", type: "textarea", rows: 3 },
      { name: "content", label: "Content (HTML)", type: "html", required: true, rows: 20 },
      { name: "featured_image_url", label: "Featured image URL", type: "text" },
      { name: "category_tag", label: "Category tag", type: "text" },
      { name: "related_software_id", label: "Related software", type: "select", options: [] },
      { name: "author_name", label: "Author name", type: "text", required: true },
      { name: "author_title", label: "Author title", type: "text" },
      { name: "author_bio", label: "Author bio", type: "textarea", rows: 2 },
      { name: "read_time_minutes", label: "Read time (minutes)", type: "number" },
      { name: "published_date", label: "Published date", type: "date" },
      { name: "meta_title", label: "Meta title", type: "text" },
      { name: "meta_description", label: "Meta description", type: "textarea", rows: 2 },
      status(["draft", "published"]),
      { name: "featured", label: "Featured", type: "checkbox" },
    ],
  },
  comparisons: {
    table: "comparisons",
    title: "Comparisons",
    labelColumn: "id",
    fields: [
      { name: "software_a_id", label: "Software A", type: "select", options: [], required: true },
      { name: "software_b_id", label: "Software B", type: "select", options: [], required: true },
      { name: "custom_verdict", label: "Verdict", type: "textarea", rows: 6 },
      { name: "meta_title", label: "Meta title", type: "text" },
      { name: "meta_description", label: "Meta description", type: "textarea", rows: 2 },
      status(["draft", "published"]),
    ],
  },
  pages: {
    table: "pages",
    title: "Pages",
    labelColumn: "title",
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "Slug", type: "text", required: true },
      { name: "content", label: "Content (HTML)", type: "html", required: true, rows: 20 },
      { name: "meta_title", label: "Meta title", type: "text" },
      { name: "meta_description", label: "Meta description", type: "textarea", rows: 2 },
      status(["draft", "published"]),
    ],
  },
};

export type ResourceKey = keyof typeof RESOURCES;

export function getResource(key: string): ResourceSpec | null {
  return Object.prototype.hasOwnProperty.call(RESOURCES, key)
    ? RESOURCES[key as ResourceKey]
    : null;
}
