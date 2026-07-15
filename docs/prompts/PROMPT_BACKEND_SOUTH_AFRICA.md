# Backend Build Prompt — Stack Match (South Africa Edition)

> **Role for the AI receiving this prompt:** You are a senior backend engineer. Build the **complete data layer,
> server logic, and admin CMS** for an independent business-software review and comparison platform, **localised
> for South Africa**. This document specifies the Postgres schema, Row Level Security, triggers, storage,
> Supabase access layers, server actions, route handlers, the admin panel, migrations and seed data. The
> companion `PROMPT_FRONTEND_SOUTH_AFRICA.md` describes the UI that consumes this data.
>
> **Prime directive:** Same architecture and data contracts as the reference build, but every data-level market
> signal — default currency, tax terminology, reviewer geography, pricing, compliance copy — must be **South
> African**. Conveniently, the *original* schema defaults were already South African (`price_currency 'ZAR'`,
> `reviewer_country 'South Africa'`); a later migration UK-ified the content. You are building the SA version
> natively, so keep the SA defaults and seed SA content from the start.

---

## 1. Architecture

- **Runtime:** Next.js 16 App Router (server components, server actions, route handlers) + Supabase
  (PostgreSQL, RLS, Storage, Auth). TypeScript throughout.
- **Trust boundary:**
  - *Public reads* — browser/server components read **published** rows through an anon client constrained by RLS.
  - *Privileged writes* — review submission, newsletter signup, affiliate-click logging, and **all** admin
    mutations run server-side (server actions / route handlers) using a **service-role** client that is never
    shipped to the browser.
- **Aggregates by trigger:** product star ratings and review counts are recomputed by a database trigger
  whenever reviews change, so read paths stay trivial and always consistent.
- **Single-admin auth model:** any authenticated Supabase user is *the* admin. Public sign-ups are disabled;
  create exactly one account. RLS: anon can read published content; authenticated has full access.

### 1.1 Supabase client modules (`lib/supabase/`)
- `client.ts` — browser client (anon key).
- `server.ts` — server component client (cookies via `@supabase/ssr`).
- `public.ts` — `createPublicClient()` + `isSupabaseConfigured()`; used by read fetchers, degrades gracefully.
- `admin.ts` — service-role client for privileged writes (server-only).
- `queries.ts` — all public read fetchers (see §6).

### 1.2 Environment variables (`.env.local`)
| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | RLS-constrained public key |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | **server-only**, never `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_SITE_URL` | yes | canonical URL; SA fallback e.g. `https://stackmatch.co.za` |
| `NEXT_PUBLIC_GA_ID` | no | analytics id |

Node scripts load `.env.local` with a tiny hand-rolled parser (see the migration/utility scripts pattern);
they instantiate a service-role client with `{ auth: { persistSession: false, autoRefreshToken: false } }`.

---

## 2. Database schema (Postgres / Supabase SQL)

Enable `uuid-ossp`. Create the following tables. **Note the South African defaults in bold.**

### 2.1 `categories`
`id uuid pk`, `name text`, `slug text unique`, `icon text`, `description text`,
`software_count int default 0`, `display_order int default 0`, `created_at timestamptz default now()`.

### 2.2 `software`
Core identity: `id uuid pk`, `name`, `slug text unique`, `tagline`, `description_short text not null`,
`description_full text not null`, `logo_url`, `screenshots jsonb default '[]'`,
`category_id uuid references categories(id)`.

Pricing: `starting_price numeric`, **`price_currency text default 'ZAR'`**, `billing_period text default 'month'`,
`free_trial boolean default false`, `free_version boolean default false`, `pricing_plans jsonb default '[]'`.

Features: `features jsonb default '[]'`, `top_features jsonb default '[]'`, `integrations jsonb default '[]'`
(added via migration), `brand_color text` (per-product accent hex, added via migration).

Affiliate: `affiliate_url text`, `vendor_website text`.

Vendor: `vendor_name text`, `founded_year int`, `support_types jsonb default '[]'`,
`countries_available jsonb default '[]'`, `languages jsonb default '[]'`.

Ratings (trigger-maintained): `overall_rating numeric(3,1) default 0`, `ease_of_use_rating`,
`value_for_money_rating`, `customer_service_rating`, `functionality_rating`, `review_count int default 0`.

SEO: `meta_title`, `meta_description`, `og_image_url`.

Status: `status text default 'draft' check (status in ('published','draft'))`, `featured boolean default false`,
`created_at`, `updated_at`.

Search: `search_vector tsvector generated always as (to_tsvector('english', name || tagline || description_short
|| vendor_name)) stored`. Indexes: GIN on `search_vector`; `(category_id) where status='published'`; `(status)`.

### 2.3 `reviews`
`id uuid pk`, `software_id uuid references software(id) on delete cascade`.
Reviewer: `reviewer_name text not null`, `reviewer_job_title`, `reviewer_company`, `reviewer_industry`,
`reviewer_company_size`, **`reviewer_country text default 'South Africa'`**, `reviewer_avatar_url`,
`verified_linkedin boolean default false`, `verified_badge text`.
Usage: `used_for_duration text`.
Ratings: `overall_rating int not null check (1..5)`, `ease_of_use`, `value_for_money`, `customer_service`,
`functionality` (each `int check (1..5)`).
Content: `review_title text not null`, `summary`, `pros`, `cons`.
Vendor response: `vendor_response text`, `vendor_response_date date`.
Meta: `review_date date not null default current_date`, `helpful_count int default 0`,
`status text default 'published' check (status in ('published','hidden'))`, `created_at`.
Indexes: `(software_id) where status='published'`, `(review_date desc)`.

### 2.4 `articles`
`id`, `title`, `slug unique`, `excerpt`, `content text not null`, `featured_image_url`, `category_tag`,
`related_software_id uuid references software(id) on delete set null`, author block
(`author_name not null`, `author_bio`, `author_avatar_url`, `author_title`), SEO block, `read_time_minutes int
default 5`, status/`featured`/`published_date`, timestamps, and a `search_vector` (title + excerpt) with GIN index.

### 2.5 `software_alternatives`
`id`, `software_id`, `alternative_id` (both fk → software, cascade), `display_order int`,
`unique(software_id, alternative_id)`.

### 2.6 `comparisons`
`id`, `software_a_id`, `software_b_id` (fk → software, cascade), `custom_verdict text`, SEO block,
`status text default 'published'`, `created_at`.

### 2.7 `affiliate_clicks`
`id`, `software_id uuid references software(id) on delete set null`, `software_name text`, `affiliate_url text`,
`clicked_at timestamptz default now()`, `ip_hash text`, `user_agent text`, `referrer text`, `country_code text`.
Indexes on `(software_id, clicked_at desc)` and `(clicked_at desc)`. **No anon/auth writes — service role only.**

### 2.8 `site_settings`
`id`, `key text unique`, `value text`, `updated_at`. Seed keys (SA values):
```
site_name       = 'Stackmatch'
tagline         = "South Africa's #1 Business Software Reviews Platform"
contact_email   = 'hello@stackmatch.co.za'
footer_text     = 'Stackmatch helps South African businesses find the right software through verified reviews and expert comparisons.'
social_twitter / social_linkedin / social_facebook = ''
ga_tracking_id  = ''
items_per_page  = '10'
```

### 2.9 Added by later migrations (build them in natively)
- `pages` (editable static pages: About/Privacy/Terms etc.) — `slug unique`, `title`, `content`, SEO, status, timestamps.
- `audit_log` (who changed what; populated by triggers), `redirects` (301/302 table), `media_library` (asset tracking).
- `newsletter_subscribers` — see §5.3.
- `software.brand_color` and `software.integrations` columns.

---

## 3. Triggers & functions

1. **`update_software_ratings()`** — `AFTER INSERT/UPDATE/DELETE ON reviews FOR EACH ROW`. Recomputes the five
   averaged ratings (`round(avg(...),1)`, published only) + `review_count` for `coalesce(NEW.software_id,
   OLD.software_id)`; sets `updated_at`. `COALESCE(NEW,OLD)` so DELETE works.
2. **`update_category_counts()`** — `AFTER INSERT/UPDATE OF category_id,status/DELETE ON software`. Keeps
   `categories.software_count` in sync with published software in both old and new category.
3. **`set_updated_at()`** — `BEFORE UPDATE` on `software` and `articles`, stamps `updated_at = now()`.

---

## 4. Row Level Security & Storage

Enable RLS on every table. Policies:
- **Public read (anon):** categories (all), software (`status='published'`), reviews (`status='published'`),
  articles (`status='published'`), software_alternatives (all), comparisons (`status='published'`),
  site_settings (all).
- **Admin (`authenticated`):** `FOR ALL USING(true) WITH CHECK(true)` on categories, software, reviews,
  articles, alternatives, comparisons, site_settings. `affiliate_clicks`: authenticated **read-only**
  (`FOR SELECT`); inserts happen through the service role only.

Storage buckets (public read, authenticated write): `logos`, `screenshots`, `avatars`, `articles`.
Policies: public `SELECT` on those buckets; authenticated `INSERT/UPDATE/DELETE`.

---

## 5. Server actions & route handlers

### 5.1 Affiliate click tracking — `app/api/track-click/route.ts`
Looks up `software (id, name, affiliate_url, vendor_website)`; destination = `affiliate_url || vendor_website`;
inserts an `affiliate_clicks` row with a **hashed** IP (never store raw IP), user agent, referrer, country;
redirects the visitor to the destination. Service-role client. This is how outbound affiliate links are counted
and is the single source for the affiliate URL — **the frontend never hardcodes vendor links**.

### 5.2 Review submission — `app/(public)/software/[slug]/reviews/new/actions.ts`
Server action: validates, inserts a `reviews` row (`status='published'` or moderated per policy),
`reviewer_country` defaulting to **`'South Africa'`**. The ratings trigger updates the product aggregate.

### 5.3 Newsletter — `migration_005` table + `app/(public)/newsletter/actions.ts`
Table `newsletter_subscribers`: `id`, `email`, `status ('pending'|'confirmed'|'unsubscribed')`,
`interests text[]`, `confirm_token`, `confirmed_at`, `unsubscribed_at`, `consent_ip_hash`, `consent_source`,
`user_agent`, `created_at`. Double-opt-in with a consent audit trail and one-click unsubscribe. **Compliance
copy references POPIA** (Protection of Personal Information Act), **not** UK GDPR/PECR.

### 5.4 Contact — `app/(public)/contact/actions.ts`
Server action persisting/forwarding contact messages (see `migration_007_contact_messages`), with length caps
and basic anti-abuse. Locale-format any counters with `en-ZA`.

### 5.5 Admin auth — `app/(admin)/admin/actions.ts` + `lib/hooks/useAuth.ts`
Supabase email/password login at `/admin/login`; middleware/guards protect `(admin)` routes.

---

## 6. Public read fetchers (`lib/supabase/queries.ts`)

Provide all of these, each wrapped in a `safe(fallback, fn)` that returns the fallback if Supabase is
unconfigured or throws. Include the expand/contract-safe `brand_color` column probe (fall back to a base column
set if `migration` adding `brand_color` hasn't run — detect Postgres error `42703`).

`getCategories(limit?)`, `getCategoryBySlug(slug)`, `getFeaturedSoftware(limit)`, `getTopRatedSoftware(limit)`,
`getRecentlyUpdatedSoftware(limit)`, `getSoftwareBySlug(slug)`, `getSoftwareList(filters)` (category, minRating,
freeTrial, freeVersion, paidOnly, sort reviews|rating|recent, page, perPage → `{items,total}`),
`getReviewsForSoftware(id, filters)` (country/industry/companySize/duration, sort helpful|recent),
`getRatingDistribution(id)`, `getAlternatives(id)`, `getCategoryPeers(id, categoryId)`,
`getComparisonRecord(aId,bId)`, `getPublishedComparisons()`, `getArticles(page,perPage)`,
`getArticleBySlug(slug)`, `getLatestArticles(limit)`, `getPageBySlug(slug)`, `getSiteStats()`
(`{reviews,software,categories}`), `searchContent(query)` (full-text over software + articles via
`textSearch('search_vector', q, {type:'plain', config:'english'})`), `getSiteSettings()` → `Record<string,string>`.

Shared domain types live in `lib/types.ts` (`Category`, `Software`, `PricingPlan`, `Review`, `Article`, `Page`,
`Comparison`, `AffiliateClick`, `SiteSetting`, `NewsletterSubscriber`, statuses). Mirror the reference shapes.

---

## 7. Admin CMS (`app/(admin)/admin/(panel)/`)

Authenticated, single-admin. Navy sidebar (`--sidebar` tokens). Build full CRUD for each resource with a
TanStack-Table list (`components/admin/DataTable`) + a form, plus supporting tooling:

- **Dashboard** (`page.tsx` + `DashboardCharts`): stats tiles, Recharts visualisations. Format counts `en-ZA`.
- **Software** (`software/…`): form with pricing plans editor, features/top-features (`TagInput`),
  integrations, `brand_color` picker, SEO, screenshots via `ImageUploader`, status/featured. **Currency
  dropdown `["ZAR","USD","EUR","GBP"]` default `ZAR`; country placeholder e.g. "South Africa".**
- **Reviews** (`reviews/…`): form with `StarSelector` per dimension; **country dropdown default
  `"South Africa"`, pool `["South Africa","Namibia","Botswana","Zambia","Kenya","Nigeria","Zimbabwe","Other"]`**.
- **Categories** (`CategoriesManager`), **Comparisons** (`ComparisonForm` + `SoftwareCombobox`),
  **Articles** (`ArticleForm` with Tiptap `RichTextEditor`), **Pages** (`PageForm`),
  **Newsletter** (`NewsletterManager`: stats, status control, CSV export), **Settings** (`SettingsForm`),
  **Analytics** (affiliate-click charts).
- Shared admin components: `AdminHeader`, `ConfirmDialog`, `DataTable`, `ImageUploader`, `RichTextEditor`,
  `SoftwareCombobox`, `StarSelector`, `StatusBadge`, `TagInput`.

---

## 8. Migrations & seed (apply in order, each idempotent)

Mirror this sequence (adapt content to SA):
1. `migrations.sql` — core schema, triggers, RLS, storage buckets, default `site_settings` (SA values).
2. `migration_002_pages_and_settings.sql` — `pages` + extra settings keys (homepage stats, footer tagline).
3. `migration_003_enterprise_additions.sql` — `audit_log`, `redirects`, `media_library`.
4. `migration_004_software_brand_color.sql` — `brand_color` + `integrations` columns; backfill accents.
5. `migration_005_newsletter.sql` — subscribers + consent trail.
6. `migration_006_sa_software_expansion.sql` — the SA product roster (this replaces the reference's UK expansion).
7. `migration_007_contact_messages.sql` — contact form storage.

Idempotency: `INSERT … ON CONFLICT DO NOTHING/UPDATE`; guard repeatable data ops. Seed reviewer names suffixed
`(Demo)` for placeholder content; real content is entered via the admin panel.

### 8.1 Categories (seed)
Accounting Software, Payroll Software, HR Software, CRM Software, ERP Software, Project Management — with the
**SA descriptions** from the frontend doc §7.5 (SARS/UIF/VAT wording for accounting & payroll).

### 8.2 Product roster (South African market)
Seed products with a genuine SA footprint and **realistic ZAR pricing**. Suggested set:
- **Accounting:** Sage Business Cloud Accounting, Xero (ZA), QuickBooks Online, Zoho Books, Sage Pastel Accounting.
- **Payroll:** SimplePay, PaySpace, Sage Pastel Payroll, Payroll by SARS-recognised vendors.
- **HR:** Sage HR, BambooHR, PaySpace HR.
- **CRM:** Zoho CRM, Salesforce, HubSpot.
- **ERP:** Odoo, SAP Business One, Sage Intacct/Evolution.
- **Project management:** monday.com, Asana, Trello.

For each: SA-market `description_full`/`description_short` written in **SARS/VAT201/UIF/SDL/IRP5/eFiling/
e@syFile** vocabulary; `price_currency='ZAR'`; `pricing_plans` in rand at real SA list prices; `countries_available`
led by `South Africa` (plus regional/Global as true); `vendor_name`, `founded_year`, `support_types`, `languages`.
Re-key `lib/brandColors.ts` to these slugs.

> **Pricing guidance:** SA-domiciled vendors (SimplePay, PaySpace, Sage Pastel) publish ZAR list prices — use
> them. International vendors (Xero, QuickBooks, Zoho, monday) run localised ZAR or USD SA pricing — use their
> published South Africa pricing, not a naïve currency conversion. Never carry over the reference build's GBP
> numbers.

### 8.3 Reviews (seed)
Authentically South African reviewer names, companies, industries and cities (Johannesburg, Cape Town,
Durban, Pretoria, Sandton, Port Elizabeth/Gqeberha). Content references SARS, VAT201, UIF, EMP201/EMP501,
IRP5s, eFiling — the day-to-day of SA finance/payroll teams. `reviewer_country` mostly `South Africa`, some
neighbouring markets. The trigger derives aggregate ratings — never hardcode them.

### 8.4 Articles (seed)
SA-focused editorial, e.g.:
- "How to Choose Accounting Software for Your South African Small Business"
- "Sage vs Xero vs QuickBooks: Which Should Your South African Business Choose?"
- "South African Payroll Compliance: A Practical Checklist (SARS, UIF, EMP201/EMP501, IRP5)"

---

## 9. SA localisation quick-reference (data-layer scrub map)

If you migrate an existing UK dataset instead of seeding fresh, run a `scrubUKtoSA(text)` transform over all
text fields (`description_full/short`, `tagline`, `meta_*`, article `content/title/excerpt`, comparison
verdicts). Reverse of the reference's `scrubSA`:

| Replace (UK) | With (SA) |
| --- | --- |
| HM Revenue and Customs (HMRC) / HMRC | South African Revenue Service (SARS) / SARS |
| Making Tax Digital / MTD-ready | SARS eFiling / VAT201-ready |
| VAT return(s) | VAT201 return(s) |
| RTI (and year end) | EMP201 and EMP501 |
| National Insurance | UIF |
| the Apprenticeship Levy | SDL |
| P60(s) | IRP5(s) |
| RTI ready | e@syFile-ready |
| Companies House | CIPC |
| ICO | Information Regulator (South Africa) |
| UK GDPR / PECR / Data Protection Act 2018 | POPIA (Protection of Personal Information Act, 2013) |
| the United Kingdom / UK / British | South Africa / SA / South African |
| in the UK / based in the UK / across the UK | in South Africa / based in South Africa / across South Africa |
| GBP / in GBP / the pound / pound-based | ZAR / in ZAR / the rand / rand-based |
| London, United Kingdom | Cape Town, South Africa (or Johannesburg) |
| stackmatch.uk / hello@stackmatch.uk / en-GB / en_GB | stackmatch.co.za / hello@stackmatch.co.za / en-ZA / en_ZA |

Also flip: `price_currency` `'GBP'→'ZAR'` and reprice `pricing_plans`; `reviewer_country` UK-pool → SA-pool;
default `reviewer_country` → `'South Africa'`; VAT rate references 20% → 15%.

---

## 10. Acceptance checklist

- [ ] Schema, triggers, RLS, storage buckets created; `price_currency` defaults to **`ZAR`**,
      `reviewer_country` defaults to **`South Africa`**.
- [ ] Ratings + category counts are trigger-maintained (never hardcoded); DELETE recomputes correctly.
- [ ] Public reads are RLS-limited to published rows; all privileged writes use the service-role client only.
- [ ] `/api/track-click` logs a hashed IP and redirects to `affiliate_url || vendor_website`.
- [ ] Newsletter uses double opt-in + consent trail; compliance copy cites **POPIA** (not GDPR/PECR).
- [ ] Seeded categories, SA product roster (ZAR pricing), SA reviewer identities, and SA articles present.
- [ ] `site_settings` tagline/footer/contact/email reflect South Africa and `stackmatch.co.za`.
- [ ] **Zero** UK data signals remain (no HMRC/MTD/VAT201-as-"VAT return"/RTI/NI/P60/ICO/PECR/GBP/UK/London).
- [ ] Every read fetcher degrades gracefully when Supabase is unconfigured.

**Deliver the backend to match the reference platform's architecture and data contracts exactly — only the market (South Africa) is different.**
