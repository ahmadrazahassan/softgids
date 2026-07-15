# Frontend Build Prompt — Stack Match (South Africa Edition)

> **Role for the AI receiving this prompt:** You are a senior full-stack engineer and product designer.
> Build the **complete public-facing frontend** of an independent business-software review and comparison
> platform, **localised for the South African market**. This document is the single source of truth for the
> UI: stack, design tokens, fonts, colours, layout system, component inventory, and page-by-page copy.
> A companion document, `PROMPT_BACKEND_SOUTH_AFRICA.md`, specifies the database, server actions and data model —
> read it too, because pages consume that data.
>
> **Prime directive:** Reproduce the design, structure and quality of the reference platform *pixel-for-pixel in
> spirit*, but every market signal — currency, tax terminology, geography, compliance, reviewer identities,
> pricing — must be **South African, not British**. Where this document names a UK artefact, it is telling you
> what to replace, never what to keep.

---

## 1. Product overview

Stack Match is a server-rendered directory of business software (accounting, payroll, HR, CRM, ERP,
project management). Each product has a rich profile page with pricing tiers, features, integrations,
screenshots, aggregated star ratings, and verified user reviews. The site also offers side-by-side
comparisons, an editorial blog, a newsletter, full legal pages, and outbound affiliate-tracked vendor links.

There are two route groups in one codebase:

- **`(public)`** — the marketing + directory site (this document).
- **`(admin)`** — an authenticated CMS (covered in the backend document).

**Audience:** owners, finance managers, HR and operations staff at South African small and medium businesses
choosing software. Tone: independent, expert, plain-spoken, trustworthy. British English → **South African English**.

---

## 2. Technology stack (use these exact versions/idioms)

| Layer | Technology |
| --- | --- |
| Framework | **Next.js 16** (App Router, Turbopack, React Server Components by default) |
| Language | **TypeScript** (strict) |
| UI runtime | **React 19** |
| Styling | **Tailwind CSS v4** with CSS design tokens declared in `app/globals.css` (`@theme inline`) |
| Component primitives | **Radix UI** + shadcn-style components in `components/ui` |
| Data + auth | **Supabase** (Postgres, RLS, Storage, Auth) via `@supabase/ssr` and `@supabase/supabase-js` |
| Data grids (admin) | **TanStack Table** |
| Charts | **Recharts** |
| Rich text (admin) | **Tiptap** |
| Toasts | **Sonner** |
| Icons | **Lucide** + in-house SVG brand marks |
| Carousels | **embla-carousel-react** |
| Analytics | **@vercel/analytics** |
| Theming | **next-themes** (class-based dark mode) |

Server components + server actions are the default. Client components only where interactivity requires it
(`"use client"`). Never expose the Supabase service-role key to the browser.

**IMPORTANT — this is not the Next.js in your training data.** Next 16 has breaking changes. Consult
`node_modules/next/dist/docs/` before writing routing/metadata/caching code. `params`/`searchParams` in pages
are async (await them). Use `export const revalidate = <seconds>` for ISR.

---

## 3. Design system

### 3.1 Fonts (Google Fonts via `next/font/google`, loaded in `app/layout.tsx`)

| Font | CSS variable | Role |
| --- | --- | --- |
| **DM Sans** (400/500/700) | `--font-dm-sans` | Primary body/UI sans (`font-sans`) |
| **Inter** (400/500/600/700) | `--font-inter` | Fallback sans, secondary |
| **Inter Tight** (400–900) | `--font-inter-tight` | Headings (`font-heading`), also `font-outfit` |

Token wiring in `@theme inline`:
```css
--font-sans: var(--font-dm-sans), var(--font-inter), sans-serif;
--font-heading: var(--font-inter-tight), var(--font-inter), sans-serif;
--font-mono: ui-monospace, monospace;
```
All `h1–h6` use `font-family: var(--font-heading)`. Body uses `font-sans`. `html { scroll-behavior: smooth }`.

### 3.2 Colour tokens (light theme `:root`, plus a `.dark` variant)

Brand palette (keep these — they are brand identity, not market signals):
```css
--color-brand:       #00a86b;  /* primary green — CTAs, active states, accents */
--color-brand-dark:  #008f5b;
--color-brand-light: #e6f7f0;
--color-navy:        #1b1f3b;  /* secondary / admin sidebar */
--color-amber:       #f5a623;  /* stars, highlights */
--color-amber-dark:  #e0941a;
--color-success:     #10b981;
--color-warning:     #f59e0b;
--color-error:       #ef4444;
--color-star:        #f5a623;
```
Semantic tokens (light): `--background #ffffff`, `--foreground #111827`, `--primary #00a86b`,
`--primary-foreground #fff`, `--secondary #1b1f3b`, `--muted #f9fafb`, `--muted-foreground #6b7280`,
`--accent #f3f4f6`, `--border #e5e7eb`, `--ring #00a86b`, `--destructive #ef4444`.
Charts: `--chart-1 #00a86b`, `--chart-2 #1b1f3b`, `--chart-3 #f5a623`, `--chart-4 #10b981`, `--chart-5 #6b7280`.
Admin sidebar: `--sidebar #1b1f3b`, `--sidebar-foreground #e5e7eb`, `--sidebar-primary #00a86b`.

Radius scale from `--radius: 0.5rem`: `sm ×0.6`, `md ×0.8`, `lg ×1`, `xl ×1.4`, `2xl ×1.8`, `3xl ×2.2`, `4xl ×2.6`.

### 3.3 Per-product brand accent

Each software product can carry its own accent colour (`software.brand_color` hex). Resolution precedence:
1. admin-set `brand_color` column, 2. a hardcoded slug→colour map (`lib/brandColors.ts`), 3. site brand green.
Provide `brandColorFor({ slug, brand_color })`. **Re-key the hardcoded map to the SA product roster** (see §7).

### 3.4 Motion & signature styling

- `--animate-float` / `--animate-float-delayed`: gentle 6–8s float+rotate on decorative hero shapes.
- `.reveal-on-scroll`: scroll-driven reveal via `animation-timeline: view()` behind `@supports` +
  `prefers-reduced-motion: no-preference` (progressive enhancement, no JS).
- `.animate-fill-bar`: rating bars fill from 0 with a `cubic-bezier(0.16,1,0.3,1)` ease.
- Cards: rounded (`rounded-3xl`), soft shadows `shadow-[0_10px_30px_-18px_rgba(0,0,0,0.22)]`, hover lift
  `hover:-translate-y-1`, dashed hairline borders (`border-dashed border-zinc-200 dark:border-zinc-800`) as a
  recurring motif. `.container-site` = `mx-auto w-full max-w-[1440px] px-4 md:px-8 lg:px-12`.
- Prose systems in `globals.css`: `.prose-content` (rendered rich text), `.legal-content` (policy pages with
  custom bullet dots), `.article-content` (long-form blog with large drop-first-paragraph, branded markers).

### 3.5 Dark mode

Full dark theme via `next-themes` (class strategy, `@custom-variant dark (&:is(.dark *))`). Every surface,
border and prose system must have a `dark:` treatment. Zinc is the neutral ramp.

---

## 4. Global layout

- `app/layout.tsx`: loads the three fonts, sets `<html lang="en-ZA">` (**change from en-GB**), renders
  `<Toaster position="top-right" richColors />` and `<Analytics />`. Metadata: `metadataBase` from a shared
  `siteUrl` helper; OpenGraph `locale: "en_ZA"`, `siteName: "Stack Match"`.
- `app/(public)/layout.tsx`: wraps pages with `<Navbar>` + `<Footer>`, both fed live data (categories,
  popular software, site settings) from Supabase.
- `app/globals.css`: all tokens + prose systems above.
- `app/api/og/route.tsx`: dynamic OpenGraph image (1200×630) rendering the brand mark, product name/rating,
  and the domain. **Change the footer domain string** from `stackmatch.uk` to the SA domain.
- `app/robots.ts` + `app/sitemap.ts`: generated from `siteUrl`.
- `app/icon.svg`: transparent brand mark favicon.

---

## 5. Component inventory (build all of these)

### 5.1 Public chrome & primitives
- **Navbar** (`components/public/Navbar.tsx`, client): sticky, frosted-on-scroll, animated active-route "pill"
  that measures link rects and slides. Links: Software Reviews, Categories, Compare, Blog. Command-style search
  overlay (`cmdk`), mobile drawer, a **"List your software"** CTA (`GlossyButton`) mailto. **No ⌘K hint text,
  no nav underline dots** — keep the header premium-minimal (this is a standing design preference).
- **Footer**: dark rounded-top slab. Newsletter block, brand block + tagline + socials, link columns
  (Explore / Company / Popular software / Get in touch), contact email + phone + **location line** (change
  `London, United Kingdom` → a South African city, e.g. `Cape Town, South Africa`), bottom legal bar.
- **GlossyButton**, **SearchBar**, **SocialIcons** (Facebook/LinkedIn/X), **BrandLogo/LogoMark**,
  **Breadcrumb**, **Pagination**, **StarRating**, **CircularRating**, **RatingBar**, **StatusBadge**.

### 5.2 Directory & cards
- **SoftwareCard**, **SoftwareListRow**, **SoftwareLogo** (with fallback), **CategoryCard**,
  **AlternativeCard**, **ComparisonCard**, **FilterSidebar**, **SearchBar**.

### 5.3 Product profile
- **ProfileShell** + **ProfileNav** (sticky in-page section nav), **PricingCards**, **PricingTable**,
  **FeaturesSection**, **FeatureChecklist**, **ScreenshotCarousel** (embla + lightbox),
  **SoftwareSidebar** (vendor facts, affiliate CTA), **AffiliateCTAButton**, **AffiliateDisclosureNote**,
  **SoftwareRatingsChart**, **SentimentBar**, **CompanySizeChart**, **DonutChart**, **FaqAccordion**,
  **VerifiedBadges**, **ReviewCard**.

### 5.4 Compare
- **CompareSelector**, **CompareStickyBar**, **CompareCharts**, **ComparisonRadarChart**,
  **ComparisonTable**, **ComparisonMatrix**, **HomepageCompare**.

### 5.5 Reviews & forms
- **ReviewCard**, **ReviewFilters**, review submission form (client) with per-dimension `StarSelector`,
  **ContactForm**, **NewsletterForm** / **NewsletterSection** / **NewsletterUnsubscribeForm**.

### 5.6 Home
- **HomepageExplore** (category-tabbed explorer), **HomepageCompare**, hero with floating 3D shapes + stats bar.

### 5.7 UI primitives (`components/ui`, shadcn-style, Radix-backed)
alert-dialog, avatar, badge, breadcrumb, button, card, checkbox, command, dialog, dropdown-menu, input,
input-group, label, navigation-menu, popover, progress, scroll-area, select, separator, skeleton, sonner,
switch, table, tabs, textarea.

---

## 6. Public pages (routes + purpose + localisation notes)

Build every route below. Each page sets its own `metadata` (title/description/canonical, OG). All user-facing
counts use a locale formatter — **change `toLocaleString("en-GB")` → `toLocaleString("en-ZA")` everywhere**.

| Route | Purpose |
| --- | --- |
| `/` | Home: hero + search + popular tags, stats bar, category explorer, comparisons strip, top-rated, newsletter, recently reviewed, blog preview |
| `/software` | Directory: filter sidebar (category, min rating, free trial, free version, paid), sort (reviews/rating/recent), pagination |
| `/software/[slug]` | Product profile: overview, pricing, features, integrations, screenshots, rating breakdown, FAQs, reviews, alternatives, affiliate CTA, JSON-LD |
| `/software/[slug]/reviews` | Full reviews list with filters (country, industry, company size, duration; sort helpful/recent) |
| `/software/[slug]/reviews/new` | Verified review submission (server action) |
| `/software/[slug]/alternatives` | Ranked alternatives/competitors |
| `/categories` | All categories grid |
| `/category/[slug]` | Category landing: "Best {category} in {country} {year}" |
| `/compare` | Comparison hub: trending head-to-heads + build-your-own selector |
| `/compare/[pair]` | Dynamic A-vs-B: radar chart, matrix, pricing, verdict, JSON-LD |
| `/blog` | Article index (paginated) |
| `/blog/[slug]` | Article: author box, related software, structured data, `.article-content` prose |
| `/search` | Full-text search across software + articles |
| `/newsletter` + `/newsletter/unsubscribe` | Subscribe / one-click unsubscribe |
| `/contact` | Contact form (server action) + company facts |
| `/about` | Mission, "written for {country} businesses", founder, stats |
| Legal suite | `/privacy-policy`, `/cookie-policy`, `/terms`, `/affiliate-disclosure`, `/editorial-policy`, `/accessibility` |

SEO: dynamic metadata per page, OG image generation, `sitemap.ts`, `robots.ts`, JSON-LD (Product, Review,
AggregateRating, BreadcrumbList, Article) on the relevant pages.

---

## 7. 🇿🇦 SOUTH AFRICA LOCALISATION — the part that actually matters

The reference build was migrated **from South Africa to the UK**. You are reversing that. Apply every change
below. Treat any lingering UK signal as a bug.

### 7.1 Currency & pricing
- Default currency **`ZAR`**, symbol **`R`** (prefix, e.g. `R299/mo`). Currency map:
  `{ ZAR: "R", USD: "US$", EUR: "€", GBP: "£" }` with **ZAR first/default**.
- Admin currency dropdown order: `["ZAR", "USD", "EUR", "GBP"]`, default `ZAR`.
- All prices in **rand**, at realistic **South African list prices** (South African vendors publish ZAR;
  international vendors localise — see backend doc §pricing for the numbers). Do not just relabel £→R; reprice.
- Number/locale formatting: **`en-ZA`** everywhere (`toLocaleString`, dates `toLocaleDateString`).

### 7.2 Tax, payroll & compliance vocabulary (reverse the UK scrub)
Replace UK terms with the South African equivalents **throughout copy, features, FAQs, articles, verdicts**:

| UK term (remove) | South African term (use) |
| --- | --- |
| HM Revenue and Customs (HMRC) | South African Revenue Service (SARS) |
| Making Tax Digital / MTD | SARS eFiling (SA has no "MTD"; digital filing is via eFiling) |
| VAT return / VAT (20%) | **VAT201** return, VAT at **15%** |
| RTI submissions | **EMP201** (monthly) and **EMP501** (bi-annual reconciliation) |
| National Insurance (NI) | **UIF** (Unemployment Insurance Fund) |
| the Apprenticeship Levy | **SDL** (Skills Development Levy) |
| P60 / P45 | **IRP5** (employee tax certificate) |
| pension auto-enrolment | (SA has no auto-enrolment; use retirement/provident fund contributions) |
| RTI-ready payroll software | **e@syFile-ready** payroll software |
| Companies House | **CIPC** (Companies and Intellectual Property Commission) |
| ICO (Information Commissioner's Office) | **Information Regulator (South Africa)** |
| UK GDPR + PECR + Data Protection Act 2018 | **POPIA** (Protection of Personal Information Act, 2013) |
| CIS (Construction Industry Scheme) | (no direct equivalent — drop or replace with generic SA context) |
| PAYE | PAYE (same term — keep) |

Keep a reusable text-scrub map (mirror of the backend's `scrubSA`, but running the *other direction*).

### 7.3 Geography & identity
- Site tagline: **"South Africa's #1 Business Software Reviews Platform"**.
- Footer/contact location: a South African city (**Cape Town** or **Johannesburg**), `… , South Africa`.
- About/editorial/category copy: "for South African businesses", "in South Africa", "SA SMBs".
- Reviewer countries pool (forms + filters): **`["South Africa", "Namibia", "Botswana", "Zambia",
  "Kenya", "Nigeria", "Zimbabwe", "Other"]`**, default **`South Africa`** (was UK/Ireland/etc.).
- Reviewer names, companies, industries and cities should read as authentically South African
  (e.g. Cape Town, Durban, Pretoria, Sandton; names across SA's communities).
- Contact email + domain: replace `hello@stackmatch.uk` / `stackmatch.uk` with the SA domain
  (e.g. `hello@stackmatch.co.za` / `stackmatch.co.za`). Update the login placeholder, OG domain, `siteUrl`
  fallback, and every hardcoded mailto.

### 7.4 Locale flags to flip (grep for these)
- `lang="en-GB"` → `lang="en-ZA"`; `locale: "en_GB"` → `"en_ZA"`.
- Every `toLocaleString("en-GB")` / `toLocaleDateString("en-GB", …)` → `"en-ZA"`.
- Remove the `impact-site-verification` meta unless the SA affiliate programme provides its own token.

### 7.5 Category descriptions (SA-flavoured)
- Accounting: "Bookkeeping, invoicing, VAT and financial reporting tools for South African businesses."
- Payroll: "Payroll processing, payslips, SARS submissions, UIF and compliance for SA employers."
- HR / CRM / ERP / Project Management: generic (already market-neutral).

### 7.6 Product roster & affiliate links
- Feature software with a genuine **South African** presence (accounting: Sage Business Cloud Accounting,
  Xero ZA, QuickBooks; payroll: SimplePay, PaySpace, Sage Pastel Payroll, SARS-recognised tools; HR: BambooHR,
  Sage HR; CRM: Zoho, Salesforce; ERP: Odoo, SAP; PM: monday.com, Asana). Exact list in the backend doc.
- Re-key `lib/brandColors.ts` to the SA slugs.
- Affiliate URLs come from `software.affiliate_url` (DB), surfaced via `/api/track-click`. Use the SA
  affiliate/referral links the operator provides; never hardcode vendor links in components.

---

## 8. Data access pattern (frontend side)

- Public reads go through helpers in `lib/supabase/queries.ts` using a public (anon, RLS-constrained) client.
  Every fetcher degrades gracefully to empty/placeholder when Supabase is unset, so the site always builds.
- Provide expand/contract-safe column probing (e.g. detect whether `brand_color` exists before selecting it).
- Card column sets, list filters, review filters, rating distribution, alternatives, comparisons, articles,
  pages, site stats, full-text search, and site settings all have dedicated fetchers (see backend doc for the
  full contract). Pages call these in parallel with `Promise.all`.
- ISR: `export const revalidate = 3600` on high-traffic pages (home, directory, profiles).

---

## 9. Accessibility, performance, SEO

- Semantic landmarks, `aria-label`s on icon buttons and nav regions, focus-visible rings (`--ring`),
  `prefers-reduced-motion` honoured on all animation.
- `next/image` for all imagery with correct `sizes`; hero image `priority`.
- Keyboard: Escape closes overlays; search overlay is `cmdk`-driven.
- Ship an accessibility statement page reflecting the real state of the build.

---

## 10. Acceptance checklist

- [ ] Home, directory, profile, compare, blog, search, newsletter, contact, about, and all 6 legal pages render.
- [ ] Fonts = DM Sans / Inter / Inter Tight; headings use Inter Tight; brand green `#00a86b` is the accent.
- [ ] Light **and** dark themes complete across every surface and prose system.
- [ ] **Zero** UK signals remain: no £/GBP-default, no HMRC/MTD/VAT201-as-"VAT return"/RTI/NI/P60/ICO/PECR/
      "United Kingdom"/London/`stackmatch.uk`/`en-GB`/`en_GB`. Everything reads South African.
- [ ] Currency defaults to ZAR (`R`), locale to `en-ZA`, tagline references South Africa.
- [ ] Reviewer country pool + defaults are SA-centric; reviewer identities read as South African.
- [ ] Affiliate CTAs resolve to DB `affiliate_url` via `/api/track-click`; no hardcoded vendor links in JSX.
- [ ] Site builds and renders with Supabase unset (graceful placeholders).

**Deliver the frontend to match the reference platform's structure and polish exactly — only the market is different.**
