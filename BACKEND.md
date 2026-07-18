# BACKEND SPECIFICATION
## Independent Business Software Review & Comparison Platform — North America

> **Purpose.** A complete, implementation ready backend specification derived by reading a live production codebase (a South African software review platform). A developer or AI agent should be able to rebuild the entire backend from an empty Supabase project using only this file.
>
> **Companion document:** `FRONTEND.md`. Read §1.4 there first — the market decision is **North America as a single market**: one site, `en-US`, USD, no region switcher. Compliance still covers both countries because law follows the user, not the marketing.
>
> **Everything below is taken from real source.** File paths are cited. Where the original is wrong, it is flagged rather than copied.

---

## Table of contents

1. [Architecture overview](#1-architecture-overview)
2. [Database schema](#2-database-schema)
3. [Data access layer](#3-data-access-layer)
4. [Ranking, rating and scoring](#4-ranking-rating-and-scoring)
5. [API routes and server actions](#5-api-routes-and-server-actions)
6. [Authentication and authorization](#6-authentication-and-authorization)
7. [Admin panel](#7-admin-panel)
8. [Seeding and content pipeline](#8-seeding-and-content-pipeline)
9. [Email](#9-email)
10. [Affiliate tracking](#10-affiliate-tracking)
11. [Search](#11-search)
12. [Caching and revalidation](#12-caching-and-revalidation)
13. [Environment variables](#13-environment-variables)
14. [Security and privacy posture](#14-security-and-privacy-posture)
15. [Deployment and infrastructure](#15-deployment-and-infrastructure)
16. [Known issues and improvements](#16-known-issues-and-improvements)
17. [Localization checklist](#17-localization-checklist)

---

## 1. Architecture overview

### 1.1 Shape

There is **no separate API server**. The backend is Postgres (Supabase) plus Next.js server code. All reads happen inside React Server Components; all writes go through Server Actions or Route Handlers.

```
┌─────────────────────────────────────────────────────────────┐
│ Browser                                                     │
│   Server Components (HTML)  ·  Client islands (forms, tabs)  │
└───────────────┬─────────────────────────┬───────────────────┘
                │ reads                   │ writes
                ▼                         ▼
┌───────────────────────────┐  ┌──────────────────────────────┐
│ lib/supabase/queries.ts   │  │ Server Actions               │
│  every public read        │  │  newsletter, contact, review │
│  wrapped in safe()        │  │ Route Handlers               │
│                           │  │  /api/track-click            │
│  anon key + RLS           │  │  /api/newsletter/confirm     │
└───────────┬───────────────┘  │  /admin/newsletter-export    │
            │                  └──────────────┬───────────────┘
            │                                 │ service role
            ▼                                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Supabase Postgres                                           │
│  RLS  ·  triggers (ratings, counts, updated_at, audit)      │
│  generated tsvector + GIN  ·  Storage buckets                │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 The three clients (this distinction is the whole security model)

| Client | File | Key | RLS | Used for |
|---|---|---|---|---|
| **Public** | `lib/supabase/public.ts` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ enforced | Every public read |
| **Server (session)** | `lib/supabase/server.ts` | anon key + user cookies | ✅ enforced, as the signed in user | Admin panel reads/writes |
| **Admin (service role)** | `lib/supabase/admin.ts` | `SUPABASE_SERVICE_ROLE_KEY` | ⛔ **bypassed** | Public form writes, click logging, seeds |

```ts
// lib/supabase/admin.ts
import "server-only";
```

`server-only` poisons the module if it is ever imported into a client bundle. The service role key is **never** `NEXT_PUBLIC_`. Keep both properties.

**Why a service role is needed at all:** RLS gives anon *read* on published rows only. There is no anon *insert* policy anywhere. So public writes (newsletter signup, contact message, affiliate click) are performed server side with the service role, after the server has validated the input. This is deliberate: the database refuses anonymous writes, and the only path in is through validated server code.

### 1.3 Request flow, read path

```
Server Component
  → getSoftwareBySlug(slug)          lib/supabase/queries.ts
    → safe(fallback, fn)
        → createPublicClient()        null if env unset → return fallback
        → supabase.from("software")…  RLS: status = 'published'
        → on throw → return fallback  ⚠ see §16
  → render
  → ISR caches for 3600s
```

### 1.4 Request flow, write path

```
Client form (useActionState)
  → Server Action "use server"
    → validate (regex, length caps, honeypot)
    → createAdminClient()             null → "preview mode" message
    → hashIp(x-forwarded-for)
    → insert/upsert
    → sendEmail() where relevant
  → { ok, message } back to the form
```

### 1.5 Graceful degradation (a real design goal)

The site **always builds and renders**, even with no database. Every public read falls back to bundled placeholder data in `lib/placeholder/*`. Every write returns an honest "Preview mode: the database isn't connected yet" message instead of throwing.

This is genuinely useful for CI and previews. It also hides a serious bug — see §16 issue #1.

---

## 2. Database schema

Source: **`supabase/setup_complete.sql`** (579 lines). One idempotent file: schema, triggers, RLS, storage, allowlist and base seed. Paste into the Supabase SQL editor and run. Running it ten times produces the same result.

```sql
create extension if not exists "uuid-ossp";
```

### 2.1 Table overview

| Table | Rows own | Purpose |
|---|---|---|
| `admin_allowlist` | email | Who is an admin |
| `categories` | ~6 | Software categories |
| `software` | catalogue | The products |
| `reviews` | thousands | Verified user reviews |
| `articles` | editorial | Blog posts |
| `pages` | 6 | CMS driven legal/policy pages |
| `comparisons` | curated | Head to head matchups |
| `software_alternatives` | join | Curated alternatives |
| `affiliate_clicks` | append only | Outbound click log |
| `newsletter_subscribers` | list | Double opt in list + consent trail |
| `contact_messages` | inbox | Contact form |
| `site_settings` | k/v | Editable site config |
| `audit_log` | append only | Every content mutation |
| `redirects` | few | Path redirects (**unused by the app**) |
| `media_library` | assets | Uploaded media index (**unused by the app**) |

### 2.2 `admin_allowlist`

```sql
create table if not exists admin_allowlist (
  email text primary key,
  added_at timestamptz not null default now()
);

alter table admin_allowlist enable row level security;
-- RLS ON with NO policies: nothing can read it except the security definer fn.

insert into admin_allowlist (email) values ('you@yourbrand.com')
on conflict (email) do nothing;

create or replace function is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from admin_allowlist
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
```

**This is the cleanest idea in the codebase.** RLS is enabled with zero policies, so the table is unreadable by anon and authenticated alike. Only `is_admin()` — `security definer`, so it runs as the owner — can see it. Every admin policy calls `is_admin()`. Granting access is one INSERT. Revoking is one DELETE. `set search_path = public` prevents search path hijacking.

Sign ups must be **disabled** in the Supabase dashboard. An allowlisted email with no auth user cannot log in; an auth user not on the allowlist can log in but can read and write nothing.

### 2.3 `categories`

```sql
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  icon text,
  description text,
  software_count int not null default 0,   -- trigger owned, never write by hand
  display_order int not null default 0,
  created_at timestamptz not null default now()
);
```

### 2.4 `software` (the core table)

```sql
create table if not exists software (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  tagline text,
  description_short text not null,
  description_full text not null,          -- HTML, rendered via .prose-content
  logo_url text,
  screenshots jsonb not null default '[]',
  category_id uuid references categories(id),

  starting_price numeric,
  price_currency text not null default 'ZAR',   -- 🔁 → 'USD'
  billing_period text not null default 'month',
  free_trial boolean not null default false,
  free_version boolean not null default false,
  pricing_plans jsonb not null default '[]',

  features jsonb not null default '[]',
  top_features jsonb not null default '[]',
  integrations jsonb not null default '[]',
  brand_color text,

  affiliate_url text,
  vendor_website text,

  vendor_name text,
  founded_year int,
  support_types jsonb not null default '[]',
  countries_available jsonb not null default '[]',
  languages jsonb not null default '[]',

  -- All six are TRIGGER OWNED. Never write these by hand.
  overall_rating numeric(3,1) not null default 0,
  ease_of_use_rating numeric(3,1) not null default 0,
  value_for_money_rating numeric(3,1) not null default 0,
  customer_service_rating numeric(3,1) not null default 0,
  functionality_rating numeric(3,1) not null default 0,
  review_count int not null default 0,

  meta_title text,
  meta_description text,
  og_image_url text,

  status text not null default 'draft' check (status in ('published','draft')),
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  search_vector tsvector generated always as (
    to_tsvector('english',
      coalesce(name, '') || ' ' || coalesce(tagline, '') || ' ' ||
      coalesce(description_short, '') || ' ' || coalesce(vendor_name, ''))
  ) stored
);

-- Expand/contract migration remnants; harmless on a fresh install.
alter table software add column if not exists integrations jsonb not null default '[]';
alter table software add column if not exists brand_color text;

create index if not exists software_search_idx on software using gin (search_vector);
create index if not exists software_category_published_idx on software (category_id) where status = 'published';
create index if not exists software_status_idx on software (status);
```

Notes:
- `status` defaults to **`draft`**. A newly inserted product is invisible until published. Correct default.
- `numeric(3,1)` caps ratings at `99.9` and stores one decimal, matching `formatRating`.
- The partial index on `(category_id) where status = 'published'` matches the exact shape of the category query.
- `search_vector` is a **generated stored column**. It cannot drift from the row.

### 2.5 `reviews`

```sql
create table if not exists reviews (
  id uuid primary key default uuid_generate_v4(),
  software_id uuid not null references software(id) on delete cascade,

  reviewer_name text not null,
  reviewer_job_title text,
  reviewer_company text,
  reviewer_industry text,
  reviewer_company_size text,
  reviewer_country text not null default 'South Africa',   -- 🔁 → 'United States'
  reviewer_avatar_url text,
  verified_linkedin boolean not null default false,
  verified_badge text,

  used_for_duration text,

  overall_rating int not null check (overall_rating between 1 and 5),
  ease_of_use int check (ease_of_use between 1 and 5),
  value_for_money int check (value_for_money between 1 and 5),
  customer_service int check (customer_service between 1 and 5),
  functionality int check (functionality between 1 and 5),

  review_title text not null,
  summary text,
  pros text,
  cons text,

  vendor_response text,
  vendor_response_date date,

  review_date date not null default current_date,
  helpful_count int not null default 0,
  status text not null default 'published' check (status in ('published','hidden')),
  created_at timestamptz not null default now()
);

create index if not exists reviews_software_published_idx on reviews (software_id) where status = 'published';
create index if not exists reviews_date_idx on reviews (review_date desc);
```

- `overall_rating` is **`int` 1–5 and NOT NULL**; the four dimensions are nullable ints. So a review always has an overall score, and dimension scores are optional. The averaging trigger handles nulls via `avg()` ignoring them.
- Reviews **cascade delete** with their product.
- `status` defaults to `published` — reviews are live on insert. This is the moderation model: publish first, hide later (`'hidden'`), which recomputes ratings via the trigger.

### 2.6 `articles`

```sql
create table if not exists articles (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null,                    -- HTML, rendered via .article-content
  featured_image_url text,
  category_tag text,
  related_software_id uuid references software(id) on delete set null,

  author_name text not null,
  author_bio text,
  author_avatar_url text,
  author_title text,

  meta_title text,
  meta_description text,

  read_time_minutes int not null default 5,
  status text not null default 'draft' check (status in ('published','draft')),
  featured boolean not null default false,
  published_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(excerpt, ''))
  ) stored
);

create index if not exists articles_search_idx on articles using gin (search_vector);
```

`related_software_id` is `on delete set null` — deleting a product must not delete the article that mentions it.

> ⚠️ Article search only indexes `title` and `excerpt`, **not `content`**. Full text search will not find a phrase in the body. See §16.

### 2.7 `software_alternatives` and `comparisons`

```sql
create table if not exists software_alternatives (
  id uuid primary key default uuid_generate_v4(),
  software_id uuid not null references software(id) on delete cascade,
  alternative_id uuid not null references software(id) on delete cascade,
  display_order int not null default 0,
  unique (software_id, alternative_id)
);

create table if not exists comparisons (
  id uuid primary key default uuid_generate_v4(),
  software_a_id uuid not null references software(id) on delete cascade,
  software_b_id uuid not null references software(id) on delete cascade,
  custom_verdict text,
  meta_title text,
  meta_description text,
  status text not null default 'published' check (status in ('published','draft')),
  created_at timestamptz not null default now()
);
```

> ⚠️ `software_alternatives` is **directional and not symmetric**: A→B does not imply B→A. And `comparisons` has **no unique constraint** on the pair, so `(A,B)` and `(B,A)` can both exist and produce two URLs for one matchup. Add `unique (least(software_a_id, software_b_id), greatest(software_a_id, software_b_id))`. See §16.

### 2.8 `pages`, `site_settings`

```sql
create table if not exists site_settings (
  id uuid primary key default uuid_generate_v4(),
  key text not null unique,
  value text,
  updated_at timestamptz not null default now()
);

create table if not exists pages (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  title text not null,
  content text not null,                   -- HTML, rendered via .legal-content
  meta_title text,
  meta_description text,
  status text not null default 'published' check (status in ('published','draft')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

**`pages` powers `/privacy-policy`, `/cookie-policy`, `/terms`, `/accessibility`.** If the table is empty every one of those routes 404s. Seeding it is a deployment step, not an optional nicety. See §16 issue #1.

### 2.9 `affiliate_clicks`, `newsletter_subscribers`, `contact_messages`

```sql
create table if not exists affiliate_clicks (
  id uuid primary key default uuid_generate_v4(),
  software_id uuid references software(id) on delete set null,
  software_name text,                       -- denormalized: survives product deletion
  affiliate_url text,
  clicked_at timestamptz not null default now(),
  ip_hash text,
  user_agent text,
  referrer text,
  country_code text
);
create index if not exists affiliate_clicks_software_idx on affiliate_clicks (software_id, clicked_at desc);
create index if not exists affiliate_clicks_time_idx on affiliate_clicks (clicked_at desc);

create table if not exists newsletter_subscribers (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  status text not null default 'pending' check (status in ('pending','confirmed','unsubscribed')),
  interests text[] not null default '{}',
  confirm_token text,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  consent_ip_hash text,
  consent_source text,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists newsletter_token_idx on newsletter_subscribers (confirm_token);

create table if not exists contact_messages (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  ip_hash text,
  user_agent text,
  handled boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists contact_messages_time_idx on contact_messages (created_at desc);
```

`software_name` on `affiliate_clicks` is deliberately denormalized so the click history survives a product deletion (`on delete set null`).

`newsletter_subscribers` carries the full consent trail: hashed IP, source, user agent, timestamps for confirm and unsubscribe. That trail is what proves express consent under **CASL**, which is the standard this rebuild must meet.

> ⚠️ `interests text[]` exists in the schema and in the `NewsletterSubscriber` type but **is never written** by the signup action. Either wire it up or drop it.

### 2.10 `audit_log`, `redirects`, `media_library`

```sql
create table if not exists audit_log (
  id uuid primary key default uuid_generate_v4(),
  table_name text not null,
  row_id uuid,
  action text not null check (action in ('INSERT','UPDATE','DELETE')),
  actor uuid,
  changed_at timestamptz not null default now(),
  old_data jsonb,
  new_data jsonb
);
create index if not exists audit_log_table_idx on audit_log (table_name, changed_at desc);

create table if not exists redirects (
  id uuid primary key default uuid_generate_v4(),
  from_path text not null unique,
  to_path text not null,
  status_code int not null default 301 check (status_code in (301, 302)),
  created_at timestamptz not null default now()
);

create table if not exists media_library (
  id uuid primary key default uuid_generate_v4(),
  bucket text not null,
  path text not null,
  public_url text not null,
  alt_text text,
  uploaded_by uuid,
  created_at timestamptz not null default now(),
  unique (bucket, path)
);
```

> ⚠️ **`redirects` and `media_library` are dead tables.** Nothing in `app/`, `components/` or `lib/` reads them, and there is no `middleware.ts` to apply a redirect. Either implement them or drop them. See §16.

### 2.11 Triggers

#### Ratings (the single most important rule in the system)

```sql
create or replace function update_software_ratings()
returns trigger language plpgsql security definer
set search_path = public
as $$
declare
  target uuid := coalesce(new.software_id, old.software_id);
begin
  update software s set
    overall_rating          = coalesce((select round(avg(r.overall_rating)::numeric, 1)   from reviews r where r.software_id = target and r.status = 'published'), 0),
    ease_of_use_rating      = coalesce((select round(avg(r.ease_of_use)::numeric, 1)      from reviews r where r.software_id = target and r.status = 'published'), 0),
    value_for_money_rating  = coalesce((select round(avg(r.value_for_money)::numeric, 1)  from reviews r where r.software_id = target and r.status = 'published'), 0),
    customer_service_rating = coalesce((select round(avg(r.customer_service)::numeric, 1) from reviews r where r.software_id = target and r.status = 'published'), 0),
    functionality_rating    = coalesce((select round(avg(r.functionality)::numeric, 1)    from reviews r where r.software_id = target and r.status = 'published'), 0),
    review_count            = (select count(*) from reviews r where r.software_id = target and r.status = 'published'),
    updated_at              = now()
  where s.id = target;
  return coalesce(new, old);
end $$;

drop trigger if exists reviews_update_ratings on reviews;
create trigger reviews_update_ratings
  after insert or update or delete on reviews
  for each row execute function update_software_ratings();
```

**Ratings are derived, never authored.** This is the technical enforcement of the site's public promise that vendors cannot buy a score. Fires on insert, update **and** delete, so hiding or removing a review recomputes immediately. `coalesce(…, 0)` means a product with no published reviews reads 0, not null.

> ⚠️ It is `for each row` and runs **six correlated subqueries per review write**. Seeding 6,000 reviews issues ~36,000 subqueries. It is correct but slow. See §16 for the batch seeding fix.

#### Category counts

```sql
create trigger software_update_category_counts
  after insert or update of category_id, status or delete on software
  for each row execute function update_category_counts();
```

Recounts published software for both the old and the new category, so moving a product between categories fixes both sides. Narrowly scoped to `update of category_id, status` so unrelated edits do not fire it.

> ⚠️ Because it only fires on `software` mutations, a database created before the trigger existed shows `software_count = 0` everywhere. `scripts/seed-comparisons.ts` contains a repair pass for exactly this. Keep a repair path.

#### `updated_at`

```sql
create trigger software_set_updated_at before update on software for each row execute function set_updated_at();
create trigger articles_set_updated_at before update on articles for each row execute function set_updated_at();
create trigger pages_set_updated_at   before update on pages   for each row execute function set_updated_at();
```

`pages.updated_at` is what renders "Last updated {date}" on the legal pages.

#### Audit log

```sql
create or replace function write_audit_log()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  insert into audit_log (table_name, row_id, action, actor, old_data, new_data)
  values (
    tg_table_name,
    coalesce((to_jsonb(new) ->> 'id')::uuid, (to_jsonb(old) ->> 'id')::uuid),
    tg_op,
    auth.uid(),
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end $$;
```

Attached to `software`, `articles`, `reviews`, `pages`, `site_settings`. Captures `auth.uid()` as the actor — which is **null for service role writes**, so seeds and public form writes are logged anonymously. That is expected, but it means the audit log answers "what changed" better than "who changed it" for non admin paths.

### 2.12 Row Level Security

```sql
alter table categories, software, reviews, articles, software_alternatives,
      comparisons, affiliate_clicks, site_settings, pages, audit_log,
      redirects, media_library, newsletter_subscribers, contact_messages
  enable row level security;
```

**Public read policies** (anon):

| Table | Policy |
|---|---|
| `categories` | `using (true)` |
| `software` | `using (status = 'published')` |
| `reviews` | `using (status = 'published')` |
| `articles` | `using (status = 'published')` |
| `software_alternatives` | `using (true)` |
| `comparisons` | `using (status = 'published')` |
| `site_settings` | `using (true)` |
| `pages` | `using (status = 'published')` |
| `redirects` | `using (true)` |

**Admin full control** (`for all to authenticated using (is_admin()) with check (is_admin())`) on: `categories`, `software`, `reviews`, `articles`, `software_alternatives`, `comparisons`, `site_settings`, `pages`, `redirects`, `media_library`.

**Restricted admin surfaces:**

| Table | Admin can |
|---|---|
| `affiliate_clicks` | select only |
| `audit_log` | select only |
| `newsletter_subscribers` | select, update |
| `contact_messages` | select, update |

Nobody gets `delete` on `audit_log` or `affiliate_clicks` through the API — append only by policy. Nobody gets `insert` on subscribers or contact through a session client; those arrive via service role only.

> ⚠️ `site_settings` is `using (true)` for anon — the whole key/value table is world readable. Fine today (site name, tagline, contact email). It becomes a leak the moment someone stores an API key there. Move secrets to env, or restrict the policy to a known key allowlist.

### 2.13 Storage

```sql
insert into storage.buckets (id, name, public) values
  ('logos', 'logos', true),
  ('screenshots', 'screenshots', true),
  ('avatars', 'avatars', true),
  ('articles', 'articles', true)
on conflict (id) do nothing;

create policy "public read site assets" on storage.objects
  for select using (bucket_id in ('logos','screenshots','avatars','articles'));

create policy "admin insert site assets" on storage.objects
  for insert to authenticated with check (is_admin() and bucket_id in (...));
-- plus matching update and delete policies
```

Four public read, admin write buckets. `next.config.ts` whitelists `**.supabase.co` for `next/image`.

> Note: the frontend currently serves screenshots from `/public/screenshots` via a hand maintained slug map, **not** from the `screenshots` bucket. See `FRONTEND.md` §5.4 and §16 here.

### 2.14 Base seed

```sql
insert into site_settings (key, value) values
  ('site_name', '…'), ('tagline', '…'), ('contact_email', '…'), ('footer_text', '…'),
  ('social_twitter', ''), ('social_linkedin', ''), ('social_facebook', ''),
  ('ga_tracking_id', ''), ('items_per_page', '10'),
  ('homepage_stats_reviews', ''), ('homepage_stats_software', ''),
  ('homepage_stats_categories', ''), ('footer_tagline', '…')
on conflict (key) do nothing;

insert into categories (name, slug, icon, description, display_order) values
  ('Accounting Software',  'accounting-software', 'calculator',      '…', 1),
  ('Payroll Software',     'payroll-software',    'banknote',        '…', 2),
  ('HR Software',          'hr-software',         'users',           '…', 3),
  ('CRM Software',         'crm-software',        'heart-handshake', '…', 4),
  ('ERP Software',         'erp-software',        'factory',         '…', 5),
  ('Project Management',   'project-management',  'kanban',          '…', 6)
on conflict (slug) do nothing;
```

The six categories carry over unchanged. **Rewrite every `description`** for North America (the current ones name VAT, SARS and UIF).

> ⚠️ Of the 13 settings keys, only `site_name`, `contact_email` and `footer_text` are read by the app. `ga_tracking_id`, `social_*`, `items_per_page` and `homepage_stats_*` are dead. Prune them.

---

## 3. Data access layer

Source: **`lib/supabase/queries.ts`** (566 lines). Every public read lives here. Nothing else touches the public client.

### 3.1 The `safe()` wrapper

```ts
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
```

Every exported reader is `safe(placeholderFallback, async () => { …live query… })`. The site never white screens on a database blip.

> 🚨 **`catch {}` swallows the error silently.** A schema mistake, an RLS misconfiguration or a network failure all render as bundled placeholder content with no log and no alert. Production could serve stale demo data indefinitely and nobody would know. **Log the error before falling back.** See §16 issue #2.

### 3.2 Expand/contract column probing

```ts
const CARD_COLUMNS_BASE =
  "id, name, slug, tagline, description_short, logo_url, category_id, starting_price, " +
  "price_currency, billing_period, free_trial, free_version, overall_rating, " +
  "ease_of_use_rating, value_for_money_rating, customer_service_rating, " +
  "functionality_rating, review_count, status, featured, updated_at, vendor_name";
const CARD_COLUMNS_EXTENDED = `${CARD_COLUMNS_BASE}, brand_color`;

let extendedColumnsAvailable: boolean | null = null;

async function cardColumns(): Promise<string> {
  if (extendedColumnsAvailable === null) {
    const { error } = await sb().from("software").select("brand_color").limit(1);
    extendedColumnsAvailable = !(error && error.code === "42703"); // undefined_column
  }
  return extendedColumnsAvailable ? CARD_COLUMNS_EXTENDED : CARD_COLUMNS_BASE;
}
```

A one time probe per process, cached in module scope, that degrades to the base column set if `brand_color` has not been migrated yet. Genuinely thoughtful zero downtime deploy handling.

**In a fresh build this is unnecessary complexity.** The new schema has `brand_color` from day one. Ship `CARD_COLUMNS` as one constant and delete the probe.

Card queries select an **explicit column list**, never `select("*")`. Detail queries use `select("*, category:categories(*)")`. Keep that discipline: list pages must not ship `description_full` to the client.

### 3.3 Complete query API

| Function | Signature | Query |
|---|---|---|
| `getCategories` | `(limit?) → Category[]` | order `display_order` asc |
| `getCategoryBySlug` | `(slug) → Category \| null` | `eq slug`, `maybeSingle` |
| `getFeaturedSoftware` | `(limit = 6) → Software[]` | published + featured, order rating desc |
| `getTopRatedSoftware` | `(limit = 6) → Software[]` | published, order rating desc, then review_count desc |
| `getRecentlyUpdatedSoftware` | `(limit = 6) → Software[]` | published, order `updated_at` desc |
| `getSoftwareBySlug` | `(slug) → Software \| null` | `*, category:categories(*)`, published |
| `getSoftwareList` | `(filters) → { items, total }` | see below |
| `getReviewsForSoftware` | `(softwareId, filters) → Review[]` | published, filterable, sortable |
| `getRatingDistribution` | `(softwareId) → RatingDistribution` | see below |
| `getAlternatives` | `(softwareId) → Software[]` | join table, ordered |
| `getCategoryPeers` | `(softwareId, categoryId, limit = 4) → Software[]` | same category, exclude self |
| `getComparisonRecord` | `(aId, bId) → Comparison \| null` | either direction |
| `getPublishedComparisons` | `() → Comparison[]` | with both software joined |
| `getArticles` | `(page = 1, perPage = 9) → { items, total }` | published, date desc |
| `getArticleBySlug` | `(slug) → Article \| null` | with `related_software` |
| `getLatestArticles` | `(limit = 3) → Article[]` | published, date desc |
| `getPageBySlug` | `(slug) → Page \| null` | published |
| `getSiteStats` | `() → SiteStats` | three `count: "exact", head: true` |
| `searchContent` | `(query) → SearchResults` | full text, software + articles |
| `getSiteSettings` | `() → Record<string,string>` | merged over placeholder defaults |

### 3.4 `getSoftwareList` — the directory query

```ts
export async function getSoftwareList(filters: SoftwareListFilters = {}): Promise<SoftwareListResult> {
  const { category, minRating, freeTrial, freeVersion, paidOnly,
          sort = "reviews", page = 1, perPage = 10 } = filters;

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

    if (categoryId)   query = query.eq("category_id", categoryId);
    if (minRating)    query = query.gte("overall_rating", minRating);
    if (freeTrial)    query = query.eq("free_trial", true);
    if (freeVersion)  query = query.eq("free_version", true);
    if (paidOnly)     query = query.or("starting_price.gt.0,starting_price.is.null");

    if (sort === "rating") {
      query = query.order("overall_rating", { ascending: false })
                   .order("review_count", { ascending: false });
    } else if (sort === "recent") {
      query = query.order("updated_at", { ascending: false });
    } else { // "reviews" (default)
      query = query.order("review_count", { ascending: false })
                   .order("overall_rating", { ascending: false });
    }

    const start = (page - 1) * perPage;
    query = query.range(start, start + perPage - 1);

    const { data, count, error } = await query;
    if (error) throw error;
    return { items: (data as unknown as Software[]) ?? [], total: count ?? 0 };
  });
}
```

Notes:
- `paidOnly` treats `starting_price is null` (custom pricing) as paid. Deliberate.
- Sorts always have a **tiebreaker**, so pagination is stable.
- `count: "exact"` on every page load is fine at this catalogue size; revisit past ~10k rows.
- An unknown category slug returns an empty result rather than the unfiltered list. Correct.

### 3.5 `getRatingDistribution`

```ts
export async function getRatingDistribution(softwareId: string): Promise<RatingDistribution> {
  const empty: RatingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const fromRows = (rows: Array<{ overall_rating: number }>) =>
    rows.reduce<RatingDistribution>((acc, row) => {
      const star = Math.min(5, Math.max(1, Math.round(row.overall_rating))) as 1|2|3|4|5;
      acc[star] += 1;
      return acc;
    }, { ...empty });

  return safe(fallback, async () => {
    const { data, error } = await sb()
      .from("reviews").select("overall_rating")
      .eq("software_id", softwareId).eq("status", "published");
    if (error) throw error;
    return fromRows((data as Array<{ overall_rating: number }>) ?? []);
  });
}
```

> ⚠️ **This pulls every published review row to count five buckets.** For a product with 296 reviews it transfers 296 rows to bucket them in JS. The homepage calls it **six times** (once per card). Replace with a grouped count or an RPC. See §16 issue #4.

### 3.6 Alternatives (foreign key disambiguation)

```ts
const { data, error } = await sb()
  .from("software_alternatives")
  .select("display_order, alternative:software!software_alternatives_alternative_id_fkey(*)")
  .eq("software_id", softwareId)
  .order("display_order", { ascending: true });
```

The `!software_alternatives_alternative_id_fkey` hint is **required** — the table has two FKs to `software` and PostgREST cannot guess which one to follow. Same pattern in `getPublishedComparisons`:

```ts
.select("*, software_a:software!comparisons_software_a_id_fkey(*), software_b:software!comparisons_software_b_id_fkey(*)")
```

Preserve the constraint names or these break.

### 3.7 `getComparisonRecord` — either direction

```ts
.or(`and(software_a_id.eq.${aId},software_b_id.eq.${bId}),and(software_a_id.eq.${bId},software_b_id.eq.${aId})`)
```

Finds `(A,B)` or `(B,A)`. Note this string interpolates ids into a PostgREST filter; they are UUIDs from a prior lookup, so it is safe **today**. Validate them as UUIDs before interpolating if the source ever changes.

---

## 4. Ranking, rating and scoring

There are **two distinct layers**. Do not confuse them.

### 4.1 Layer 1 — aggregate ratings (database, authoritative)

A plain average over published reviews, rounded to one decimal, maintained by `update_software_ratings()` (§2.11). Six values per product, recomputed on every review insert/update/delete.

```
software.overall_rating = round(avg(reviews.overall_rating) filter (status='published'), 1)
```

Null dimension scores are excluded by `avg()`. No published reviews → `0`.

**These numbers are what the site displays as "the rating".** They are never editable by hand, in the admin panel or otherwise. That is the product's core integrity guarantee.

### 4.2 Layer 2 — homepage ranking (application, presentational)

Sorting purely by star average is wrong for a review platform: a product with 30 reviews at 4.3 would outrank one with 296 reviews at 4.1, even though the second is far better evidenced. The homepage therefore ranks by a **Bayesian weighted score** (`app/(public)/page.tsx`):

```ts
/* Homepage ranking is review-weighted, not a raw star average. A product with
   hundreds of verified reviews at 4.1★ is a stronger "favourite" than one with
   30 reviews at 4.3★, so we blend each rating toward the platform mean by
   review volume (the Bayesian average that review marketplaces use).
   Scoped to the home page; category and directory pages keep their own sorts. */
const rated = directory.items.filter((s) => s.review_count > 0);
const meanRating = rated.length
  ? rated.reduce((sum, s) => sum + s.overall_rating, 0) / rated.length
  : 4.1;
const volumes = rated.map((s) => s.review_count).sort((a, b) => a - b);
const priorWeight = volumes.length ? volumes[Math.floor(volumes.length / 2)] : 50;

const weightedScore = (s) =>
  (s.review_count * s.overall_rating + priorWeight * meanRating) /
  (s.review_count + priorWeight);

const byScore = (a, b) => weightedScore(b) - weightedScore(a) || b.review_count - a.review_count;
```

The formula:

```
                 v · R  +  m · C
score(s)  =  ─────────────────────
                    v  +  m

  v = review_count
  R = overall_rating
  C = meanRating   (mean rating across all rated products)
  m = priorWeight  (median review count across all rated products)
```

Both `C` and `m` are **derived from the live data**, not hardcoded. A product with few reviews is pulled toward the platform mean; a product with many reviews keeps its own average. Tiebreak on raw review volume.

Applied in two places on the homepage:
- **Category tabs** — top 3 per category by `byScore`
- **Community favourites** — top 6 overall by `byScore`

Because the score is volume weighted, the section's honest label is "The best reviewed software", ranked "by verified reviews and ratings", **not** "highest rated". Keep the copy aligned with the maths.

> ⚠️ Two constraints to fix: `priorWeight` and `meanRating` are computed from `getSoftwareList({ perPage: 60 })`, so the ranking silently only sees **the first 60 published products**. And the whole calculation is inline in the page component with no tests. Extract to `lib/ranking.ts`, feed it the full published set (or compute `C`/`m` in SQL), and unit test it. See §16.

### 4.3 Layer 3 — comparison ordering

`HomepageCompare` orders matchups by combined review volume of the two products:

```ts
const reviewWeight = (c: Comparison) =>
  (c.software_a?.review_count ?? 0) + (c.software_b?.review_count ?? 0);
```

Which matches the section's claim: "The match ups buyers research most."

### 4.4 Sentiment

Derived from the star distribution, not stored: **5 and 4 = positive, 3 = neutral, 2 and 1 = negative.**

---

## 5. API routes and server actions

### 5.1 `GET /api/track-click` — affiliate redirect

`app/api/track-click/route.ts`

| | |
|---|---|
| Input | `?software={slug}` |
| Output | `302` to `affiliate_url \|\| vendor_website`, else to `siteUrl` |
| Side effect | One `affiliate_clicks` row |
| Client | Service role |

```ts
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("software")?.trim();
  if (!slug) return NextResponse.redirect(siteUrl);

  const admin = createAdminClient();
  if (!admin) {                                  // preview mode: redirect, no logging
    const software = placeholderSoftware.find((s) => s.slug === slug);
    return NextResponse.redirect(software?.affiliate_url || software?.vendor_website || siteUrl);
  }

  const { data: software } = await admin
    .from("software").select("id, name, affiliate_url, vendor_website")
    .eq("slug", slug).maybeSingle();

  const destination = software?.affiliate_url || software?.vendor_website;
  if (!software || !destination) return NextResponse.redirect(siteUrl);

  await admin.from("affiliate_clicks").insert({
    software_id: software.id,
    software_name: software.name,
    affiliate_url: destination,
    ip_hash: hashIp(request.headers.get("x-forwarded-for")?.split(",")[0]),
    user_agent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
    referrer:   request.headers.get("referer")?.slice(0, 500) ?? null,
    country_code: request.headers.get("x-vercel-ip-country") ?? null,
  });

  return NextResponse.redirect(destination);
}
```

**This is the only place outbound vendor URLs exist.** The frontend never hardcodes them, which means an affiliate URL change is a single database edit.

> ⚠️ Three issues: the insert is **awaited before the redirect**, so a slow write delays the user (fire and forget or use `waitUntil`); the destination is **not validated as an http(s) URL**, so a bad admin value could produce an open redirect to `javascript:` or an arbitrary host; and `country_code` reads a **Vercel specific header**, which silently becomes null on any other host.

### 5.2 `GET /api/newsletter/confirm` — double opt in

`app/api/newsletter/confirm/route.ts`

```ts
const { data: subscriber } = await admin
  .from("newsletter_subscribers").select("id, status")
  .eq("confirm_token", token).maybeSingle();

if (!subscriber) return NextResponse.redirect(`${siteUrl}/newsletter?confirmed=0`);

await admin.from("newsletter_subscribers").update({
  status: "confirmed",
  confirmed_at: new Date().toISOString(),
  confirm_token: null,          // single use
}).eq("id", subscriber.id);

return NextResponse.redirect(`${siteUrl}/newsletter?confirmed=1`);
```

Token is cleared on use, so the link is single use. Indexed by `newsletter_token_idx`.

> ⚠️ The token has **no expiry**. A pending row's token is valid forever. CASL expects express consent to be demonstrably current; add a 48 hour window (`created_at > now() - interval '48 hours'`).

### 5.3 `GET /admin/newsletter-export` — CSV

`app/(admin)/admin/newsletter-export/route.ts`. Uses the **session client**, so RLS applies and a non admin gets zero rows.

```ts
const { data: { user } } = await supabase.auth.getUser();
if (!user) return new NextResponse("Unauthorised", { status: 401 });
```

Exports `email, status, consent_source, created_at, confirmed_at, unsubscribed_at` with proper CSV quote escaping (`"" `doubling).

> ⚠️ The route checks **`user`, not `is_admin()`**. It is saved only by RLS returning no rows to a non allowlisted user. That is one policy edit away from a subscriber list leak. Add an explicit `is_admin()` check. Defense in depth.

### 5.4 Server Action — `subscribeNewsletter`

`app/(public)/newsletter/actions.ts`

```ts
export interface FormActionState { ok: boolean; message: string }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
```

Flow:
1. Normalize: `trim().toLowerCase()`.
2. Validate: regex + `length <= 254`.
3. No admin client → honest "Preview mode" message.
4. Look up existing row. Already `confirmed` → "You are already on the list." (idempotent, no re-email).
5. `upsert` on `email` with `status: "pending"`, a fresh `randomBytes(24).toString("hex")` token, and the consent trail (`consent_ip_hash`, `consent_source: "website form"`, `user_agent`).
6. Send the confirm email with `${siteUrl}/api/newsletter/confirm?token=${token}`.
7. Return "Almost there. Check your inbox and confirm your address."

`unsubscribeNewsletter` sets `status: "unsubscribed"` and `unsubscribed_at`, and **returns the same message whether or not the address existed**:

```ts
// The same message either way, so the form can't be used to probe addresses.
return { ok: true, message: "You are off the list. Sorry to see you go." };
```

That comment is the right instinct. Keep it.

> ⚠️ An **unsubscribed address that re-subscribes is upserted back to `pending`** and re-emailed. Under CASL, re-mailing someone who withdrew consent is exactly what you must not do without fresh express consent. Since the flow does require a fresh confirm click, it is defensible — but log the transition and never treat a resubscribe as automatically confirmed.

### 5.5 Server Action — `submitContact`

`app/(public)/contact/actions.ts`

```ts
const website = String(formData.get("website") ?? "");   // honeypot
if (website) return { ok: true, message: "Thanks — we'll be in touch." };  // silent success
```

Validation: name 2–120, email regex + ≤254, subject ≤200, message 10–5000. Then insert with `ip_hash` and truncated `user_agent`. Honeypot returns a **fake success** so bots learn nothing.

### 5.6 Server Actions — admin

`app/(admin)/admin/actions.ts`

```ts
export async function signIn(_prev, formData): Promise<AdminActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { ok: false, message: "Enter your email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, message: "Wrong email or password." };  // no enumeration
  redirect("/admin");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  return supabase;
}
```

Plus generic CRUD (`saveResource`, delete) driven by the resource registry, with a `parseField(type, raw)` coercer per field type and `revalidatePath` after writes.

"Wrong email or password" for both cases prevents account enumeration. Good.

> ⚠️ `requireAdmin()` checks **authentication, not allowlist membership**. Again, only RLS stops a non allowlisted authenticated user from writing. Make it check `is_admin()` too.

### 5.7 Review submission

`/software/[slug]/reviews/new` renders `ReviewForm`. The submission action must:
- validate `overall_rating` is an integer 1–5 (the DB check constraint enforces this, but validate first for a clean message),
- cap all text lengths,
- carry a honeypot,
- insert via service role with `status: 'published'` (per the schema default),
- and **rate limit** — this is the single most abusable endpoint on the site, since fake reviews directly move the ratings that the whole product's credibility rests on.

> 🚨 **There is no rate limiting anywhere in this codebase.** For a review platform this is the highest severity gap. See §16.

---

## 6. Authentication and authorization

### 6.1 Model

Supabase Auth, **email + password only**. No OAuth, no magic links, no public sign up. Sign ups are disabled in the Supabase dashboard; admin users are created out of band (`npm run create-admin` or the dashboard) and their email must exist in `admin_allowlist`.

Two independent gates:

| Gate | Where | Enforces |
|---|---|---|
| **Authentication** | `app/(admin)/admin/(panel)/layout.tsx` | Is there a session? |
| **Authorization** | Postgres RLS via `is_admin()` | Is that session's email allowlisted? |

```tsx
// app/(admin)/admin/(panel)/layout.tsx
export default async function AdminPanelLayout({ children }) {
  if (!isSupabaseConfigured()) redirect("/admin/login");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  …
}
```

`getUser()` (not `getSession()`) is correct — it validates the JWT with the auth server rather than trusting the cookie.

Admin metadata sets:

```ts
robots: { index: false, follow: false }
```

### 6.2 There is no middleware

**`middleware.ts` does not exist.** Consequences:

1. **The layout is the only route guard.** It covers `/admin/(panel)/*` because every panel page nests under it. `/admin/login` is correctly outside. This works.
2. **No session refresh.** The documented `@supabase/ssr` pattern uses middleware to refresh expiring tokens and write the rotated cookies. Without it, `server.ts` `setAll` is called from a Server Component, where cookie writes throw and are swallowed:
   ```ts
   } catch {
     // Called from a Server Component — safe to ignore when
     // middleware/proxy refreshes sessions.
   }
   ```
   The comment says "when middleware refreshes sessions" — but there is no middleware. **Long lived admin sessions will expire and force a re-login rather than refreshing.** Add the middleware. See §16.
3. **The `redirects` table can never work** without middleware to apply it.

### 6.3 Threat model summary

| Actor | Can |
|---|---|
| Anon | Read published software, reviews, articles, comparisons, pages, categories, settings. Write nothing directly. |
| Authenticated, not allowlisted | Log in. Read the same as anon. **Write nothing** (every admin policy calls `is_admin()`). Sees an empty admin panel. |
| Authenticated + allowlisted | Full CRUD on content; select on clicks/audit; select+update on subscribers/contact. |
| Service role | Everything, RLS bypassed. Only ever server side. |

---

## 7. Admin panel

### 7.1 The resource registry

`lib/admin/resources.ts` is a **whitelist**. One field map per table drives both the form renderer and the save action, so nothing outside it can be written from the panel.

```ts
export type FieldType =
  | "text" | "textarea" | "html" | "number"
  | "checkbox" | "select" | "date" | "color" | "json";

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
  labelColumn: string;   // column shown as the row label in lists
  fields: FieldSpec[];
}

export const RESOURCES: Record<string, ResourceSpec> = {
  software:    { … },
  reviews:     { … },
  categories:  { … },
  articles:    { … },
  comparisons: { … },
  pages:       { … },
};
```

**Six resources.** `/admin/[resource]` looks the key up; an unknown key must 404.

Crucially, the six trigger owned rating columns are **absent from the `software` field list**, so the admin panel physically cannot write a rating. The integrity promise is enforced twice: by the registry and by the trigger.

`software` fields (26): name, slug, tagline, description_short, description_full (html), logo_url, screenshots (json), category_id (select, options injected at runtime), starting_price, price_currency (select), billing_period, free_trial, free_version, pricing_plans (json), features (json), top_features (json), integrations (json), brand_color (color), affiliate_url, vendor_website, vendor_name, founded_year, support_types (json), countries_available (json), languages (json), meta_title, meta_description, status, featured.

> 🔁 `price_currency` options are `["ZAR", "USD", "EUR", "GBP"]` → **`["USD", "CAD"]`**. The `countries_available` hint reads "Lead with South Africa" → "Lead with United States".

### 7.2 CRUD

`saveResource` in `app/(admin)/admin/actions.ts`:

1. `requireAdmin()` → session client (RLS applies as the user).
2. `getResource(key)` → spec, else 404.
3. For each `FieldSpec`, `parseField(type, formData.get(name))`:
   - `checkbox` → `raw != null`
   - `number` → `""` → null, else `Number`, reject NaN
   - `json` → `JSON.parse`, reject invalid with a field level error
   - default → trimmed string, `""` → null
4. Reject if a `required` field is empty.
5. `insert` or `update` through the session client — **RLS is the real gate**.
6. `revalidatePath` the affected public routes.

Because it goes through the session client rather than the service role, an admin's writes are still subject to `is_admin()`. That is the right choice.

### 7.3 Panel surfaces

| Route | Purpose |
|---|---|
| `/admin` | Dashboard |
| `/admin/[resource]` `/new` `/[id]` | Generic CRUD over the six resources |
| `/admin/analytics` | Affiliate click analytics from `affiliate_clicks` |
| `/admin/contact` | `contact_messages`, toggle `handled` |
| `/admin/newsletter` | `newsletter_subscribers` + CSV export |
| `/admin/settings` | `site_settings` key/value editor |

Nav (11 items): Dashboard, Software, Reviews, Categories, Articles, Comparisons, Pages, Newsletter, Contact, Analytics, Settings.

---

## 8. Seeding and content pipeline

### 8.1 Scripts

All run through `tsx`. From `package.json`:

```
seed                    scripts/seed.ts               everything
seed:pages              scripts/seed-pages.ts         legal/policy pages
seed:articles           scripts/seed-articles.ts      blog
seed:comparisons        scripts/seed-comparisons.ts   comparisons + category count repair
seed:<vendor>           roster push per vendor wave
seed:<vendor>-reviews   review corpus per vendor wave
logos                   scripts/download-logos.mjs
create-admin            scripts/create-admin.ts
```

The vendor "waves" (`sage`, `quickbooks`, `expansion`, `wave2`, `newwave`) are an artifact of how the SA catalogue was built out incrementally. **A fresh build should collapse these into one `seed:catalogue` plus one `seed:reviews`.**

### 8.2 Idempotency: deterministic IDs

`scripts/review-generator.ts`:

```ts
export function stableId(kind: string, key: string): string {
  const hex = createHash("sha1").update(`stackmatch:${kind}:${key}`).digest("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    "5" + hex.slice(13, 16),                                     // version 5 nibble
    ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16) + hex.slice(17, 20), // variant
    hex.slice(20, 32),
  ].join("-");
}
```

A SHA-1 of `"{namespace}:{kind}:{key}"` shaped into a valid UUID v5. **The same logical row always gets the same UUID**, so every seed is an upsert and reruns change nothing. This is the backbone of the whole pipeline.

> 🔁 The namespace string is `"stackmatch:"`. Change it for the new brand — and understand that changing it **regenerates every ID**, so do it once, before the first production seed, never after.

The upsert helper:

```ts
async function upsertBySlug(table: string, slug: string, row: Record<string, unknown>): Promise<string> {
  const { data: existing } = await db.from(table).select("id").eq("slug", slug).maybeSingle();
  if (existing) {
    await db.from(table).update(row).eq("id", existing.id);
    return existing.id as string;
  }
  const id = stableId(table, slug);
  await db.from(table).insert({ id, slug, ...row });
  return id;
}
```

Select by slug → update if present, insert with a deterministic id if not. Note seeds **never write** the six rating columns; they are left to the trigger.

### 8.3 Reproducible review generation

The review corpus is synthetic but deterministic, built from per product content "banks":

```ts
export type Bank = {
  slug: string;
  count: number;
  ratingWeights?: Array<[number, number]>;   // [rating, weight]; default ≈4.1 mix
  posTitles: string[]; mixTitles: string[]; negTitles: string[];
  posOpeners: string[]; posBodies: string[]; posClosers: string[];
  mixOpeners: string[]; mixBodies: string[];
  negOpeners: string[]; negBodies: string[];
  pros: string[]; cons: string[]; negCons: string[];
  jobTitles: string[]; industries: string[];
  sizeWeights: Array<[string, number]>;
};
```

Randomness is a **seeded mulberry32 PRNG** keyed off a seed string, so the same bank always produces the same reviews:

```ts
function makeRng(seedText: string): () => number {
  const hash = createHash("sha1").update(seedText).digest();
  let a = hash.readUInt32LE(0);
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

Plus `pick()` and `pickWeighted()` helpers.

The engine's docstring states house rules it enforces **at build time**:

```
- no hyphens or dashes in any prose field
- no duplicate titles or summaries within a product
- headcount, tenure and industry stay consistent within one review
```

The "no dashes" rule matches the frontend copy standard (`FRONTEND.md` §10.2). The internal consistency rule is what stops a review saying "we are a 5 person shop" while `reviewer_company_size` says "201-500".

> ⚠️ **Ethics and law.** This generates *synthetic* reviews. The site publicly promises "verified reviews from real businesses" and the FTC's rule on fake reviews (16 CFR Part 465, effective 2024) makes publishing fabricated consumer reviews an enforcement matter in the US, with the Competition Bureau taking a similar line in Canada. **Seeded reviews must be confined to local development and demo environments and must never reach a production database that presents them as verified user reviews.** Add an environment guard that refuses to run review seeds against production. This is the single most consequential item in this document.

### 8.4 Env loading in scripts

```ts
export function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (!match) continue;
      const value = match[2].replace(/^["']|["']$/g, "");
      if (!process.env[match[1]]) process.env[match[1]] = value;
    }
  } catch { /* .env.local is optional when vars are already exported */ }
}
```

A dependency free `.env.local` parser. Existing env wins. Fine as is.

### 8.5 Order of operations

```
1. Run supabase/setup_complete.sql        schema, triggers, RLS, buckets, allowlist, base seed
2. npm run seed:catalogue                 products (categories upserted first)
3. npm run seed:reviews                   ⚠ non production only → trigger derives ratings
4. npm run seed:comparisons               comparisons + category count repair
5. npm run seed:articles
6. npm run seed:pages                     ⚠ REQUIRED or the legal suite 404s
7. npm run create-admin                   then sign in
```

---

## 9. Email

### 9.1 Transport

`lib/email.ts`:

```ts
import "server-only";

export async function sendEmail({ to, subject, html }: {
  to: string; subject: string; html: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? `${SITE_NAME} <${CONTACT_EMAIL}>`;

  if (!apiKey) {
    console.info(`[email] (no provider configured) to=${to} subject="${subject}"`);
    console.info(html);
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html }),
  });
  return response.ok;
}
```

**Resend over plain `fetch`, no SDK.** One function, one provider, swappable in one place. Without a key it logs to the console so local development works end to end. Returns a boolean and **never throws**, so a failing provider cannot break a signup.

> ⚠️ Because it never throws, a returned `false` is **ignored by the caller**. `subscribeNewsletter` tells the user "Check your inbox" even when the send failed. Surface the failure.

### 9.2 The only template

The confirm email, inline in `subscribeNewsletter`:

```html
<p>Thanks for signing up. Please confirm your address so we can start sending the monthly letter.</p>
<p><a href="{siteUrl}/api/newsletter/confirm?token={token}">Confirm my subscription</a></p>
<p>If you did not request this, ignore this email and nothing will happen. …</p>
```

### 9.3 Compliance — the rebuild must fix this

Design to **CASL**, the stricter standard. Building to CASL satisfies CAN-SPAM automatically.

| Requirement | CAN-SPAM (US) | CASL (Canada) | Status here |
|---|---|---|---|
| Express opt in before sending | Not required (opt out) | **Required** | ✅ double opt in already |
| Consent record | — | **Required** | ✅ ip hash, source, UA, timestamps |
| Sender identification (legal name) | Required | **Required** | ❌ **missing** |
| **Physical postal address in every commercial email** | **Required** | **Required** | ❌ **missing** |
| Working unsubscribe | Required | Required | ✅ |
| Unsubscribe honoured within | 10 business days | 10 business days | ✅ immediate |
| Unsubscribe valid for | 30 days | **60 days** | n/a (no expiry) |
| Accurate subject / no deceptive headers | Required | Required | ✅ |

**Action items:**
1. Add a footer partial to **every** commercial email carrying the legal entity name, a physical mailing address, and a one click unsubscribe link. This is a legal requirement in both countries and is currently absent.
2. Add a token expiry (48 hours) to the confirm link.
3. Build a shared email layout rather than inlining HTML in an action.
4. Configure SPF, DKIM and DMARC on the sending domain.

---

## 10. Affiliate tracking

### 10.1 Flow

```
Card CTA  →  /api/track-click?software={slug}
              rel="noopener noreferrer sponsored"  target="_blank"
          →  look up affiliate_url || vendor_website
          →  insert affiliate_clicks { software_id, software_name, affiliate_url,
                                       ip_hash, user_agent, referrer, country_code }
          →  302 to destination
```

### 10.2 Privacy safe IP handling — as built

```ts
// lib/supabase/admin.ts
/** SHA-256 of an IP address. We never store the raw address (POPIA). */
export function hashIp(ip: string | null | undefined): string {
  return createHash("sha256").update(ip?.trim() || "unknown").digest("hex");
}
```

The intent is right and the raw IP is never stored. **The implementation is not adequate.**

> 🚨 **Unsalted SHA-256 of an IP address is reversible.** The entire IPv4 space is 2^32 ≈ 4.3 billion values. A commodity GPU brute forces the whole space against a single hash in seconds, and a rainbow table for all of IPv4 is trivially precomputable. So `ip_hash` is, in practice, **personal data in both CCPA and PIPEDA terms**, not anonymized data.
>
> **Fix:** HMAC with a server side secret, and rotate it.
> ```ts
> import { createHmac } from "node:crypto";
> export function hashIp(ip: string | null | undefined): string {
>   const secret = process.env.IP_HASH_SECRET;
>   if (!secret) throw new Error("IP_HASH_SECRET is required");
>   return createHmac("sha256", secret).update(ip?.trim() || "unknown").digest("hex");
> }
> ```
> With a secret pepper the hash is no longer brute forceable. Rotating the secret on a schedule (say monthly) also caps how long any two clicks can be correlated, which is a real privacy win and costs nothing analytically.

Used identically for `newsletter_subscribers.consent_ip_hash` and `contact_messages.ip_hash`, so this one fix covers all three.

### 10.3 Attribution

Attribution is **click level only**. There is no conversion tracking, no postback, no vendor reconciliation. `affiliate_clicks` answers "how many people clicked through to X, when, roughly from where", nothing more. Revenue reconciliation happens in each vendor's own dashboard.

If conversion attribution matters later, add a `click_id` UUID, pass it as the vendor's subid/tracking parameter, and reconcile against their postback.

### 10.4 Disclosure

`rel="sponsored"` on every affiliate link is required and already implemented. Pair it with a visible disclosure near the CTA (`AffiliateDisclosureNote`) and the `/affiliate-disclosure` page. The FTC endorsement guides require the disclosure be **clear, conspicuous and near the link** — not buried in a footer page. The Canadian Competition Act expects the same.

---

## 11. Search

### 11.1 Implementation

Postgres full text via **generated stored `tsvector` columns** and GIN indexes.

```sql
-- software
search_vector tsvector generated always as (
  to_tsvector('english',
    coalesce(name, '') || ' ' || coalesce(tagline, '') || ' ' ||
    coalesce(description_short, '') || ' ' || coalesce(vendor_name, ''))
) stored;
create index software_search_idx on software using gin (search_vector);

-- articles
search_vector tsvector generated always as (
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(excerpt, ''))
) stored;
create index articles_search_idx on articles using gin (search_vector);
```

Query:

```ts
export async function searchContent(query: string): Promise<SearchResults> {
  const q = query.trim();
  if (!q) return { software: [], articles: [] };

  return safe(fallback, async () => {
    const [softwareRes, articleRes] = await Promise.all([
      sb().from("software").select(await cardColumns()).eq("status", "published")
        .textSearch("search_vector", q, { type: "plain", config: "english" }).limit(20),
      sb().from("articles").select("*").eq("status", "published")
        .textSearch("search_vector", q, { type: "plain", config: "english" }).limit(10),
    ]);
    if (softwareRes.error) throw softwareRes.error;
    if (articleRes.error)  throw articleRes.error;
    return { software: …, articles: … };
  });
}
```

`type: "plain"` (`plainto_tsquery`) ANDs the terms, so it is precise but unforgiving. The placeholder fallback is a naive `includes()` substring match, which behaves quite differently — a source of confusing local vs production divergence.

### 11.2 Gaps

| Gap | Impact | Fix |
|---|---|---|
| Article body not indexed | Searching a phrase from a post finds nothing | Add `content` to the `tsvector` |
| No fuzzy matching | "quickbook" finds nothing | `pg_trgm` + similarity, or `websearch_to_tsquery` |
| No ranking | Results are unordered, not relevance sorted | `ts_rank` |
| No weighting | A name match ranks equal to a description match | `setweight(to_tsvector(name), 'A')` etc. |
| No result limit paging | Hard 20/10 caps | Paginate |
| `'english'` config | Fine for North America | Keep |

The recommended upgrade, cheap and high value:

```sql
search_vector tsvector generated always as (
  setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(vendor_name, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(tagline, '')), 'C') ||
  setweight(to_tsvector('english', coalesce(description_short, '')), 'D')
) stored;
```

### 11.3 The command palette is not search

`app/(public)/layout.tsx` seeds the header palette with `getTopRatedSoftware(8)` and `getLatestArticles(5)` — 13 hardcoded items, filtered client side by cmdk. It never queries `searchContent`. Users will reasonably expect it to find everything. Wire it to a debounced server search.

---

## 12. Caching and revalidation

### 12.1 ISR

Every content page exports:

```ts
export const revalidate = 3600;   // one hour
```

Pages: `/`, `/software`, `/software/[slug]`, `/software/[slug]/reviews`, `/software/[slug]/alternatives`, `/categories`, `/category/[slug]`, `/compare`, `/compare/[pair]`, `/blog`, `/blog/[slug]`, `/about`, all legal pages.

Dynamic (no ISR): `/search`, form pages, all of `/admin`, all API routes.

This is why the site is fast and cheap: nearly every request is a static hit, and the database sees roughly one query burst per page per hour.

### 12.2 Revalidation on write

Admin `saveResource` calls `revalidatePath` after a mutation. Public writes do **not** revalidate — a new review will not appear, and ratings will not move, for up to an hour.

That is an acceptable trade for a review site, but it must be a **decision**, not an accident. If you want reviews live immediately, call `revalidatePath(\`/software/${slug}\`)` from the review action.

### 12.3 Client caching

- `createPublicClient()` and `createAdminClient()` cache their instance in module scope (one client per server process).
- `cardColumns()` caches its probe result in module scope for the process lifetime.
- No `unstable_cache` or React `cache()` wrapping the query layer, so two components in one render that both call `getCategories()` issue two queries. `app/(public)/layout.tsx` mitigates this by fetching once and passing down as props. Consider React `cache()` for request level dedupe.

### 12.4 Recommended additions

- **Tag based revalidation:** `revalidateTag('software')` beats path guessing.
- **`generateStaticParams`** for `/software/[slug]` and `/blog/[slug]` to prebuild the catalogue at build time.
- **`Cache-Control` on `/api/og`** — OG images are pure functions of their params and should be cached hard at the CDN.

---

## 13. Environment variables

| Variable | Required | Public | Used by | Notes |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | ✅ | all clients | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | ✅ | public + server clients | RLS constrained |
| `SUPABASE_SERVICE_ROLE_KEY` | yes (server) | ❌ **never** | `lib/supabase/admin.ts`, seeds | **Bypasses RLS.** Full database access. |
| `NEXT_PUBLIC_SITE_URL` | yes | ✅ | `lib/site.ts` | Canonicals, OG, email links. **Overrides the code default — see below.** |
| `RESEND_API_KEY` | no | ❌ | `lib/email.ts` | Unset → emails log to console |
| `EMAIL_FROM` | no | ❌ | `lib/email.ts` | Defaults to `${SITE_NAME} <${CONTACT_EMAIL}>` |
| `IP_HASH_SECRET` | **add** | ❌ | `hashIp()` | **New.** HMAC pepper, see §10.2 |

> 🚨 **`NEXT_PUBLIC_SITE_URL` wins over the code fallback.** In `lib/site.ts`:
> ```ts
> export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://…").replace(/\/+$/, "");
> ```
> A rebrand that changes only the code default leaves canonicals, OG URLs and **newsletter confirm links** pointing at the old domain. Confirm links breaking is a silent signup funnel failure. Set it per environment and verify the rendered canonical after any domain change.

### 13.1 `.env.example`

```bash
# ---------- Supabase ----------
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# Server only. Bypasses RLS. Never expose, never prefix with NEXT_PUBLIC_.
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# ---------- Site ----------
# Drives canonicals, OG image URLs and newsletter confirm links.
# MUST match the deployed domain per environment.
NEXT_PUBLIC_SITE_URL=https://yourbrand.com

# ---------- Email (optional in dev: unset logs to console) ----------
RESEND_API_KEY=re_xxxxxxxx
EMAIL_FROM="YourBrand <hello@yourbrand.com>"

# ---------- Privacy ----------
# HMAC pepper for IP hashing. Required. Rotate periodically.
# Generate: openssl rand -hex 32
IP_HASH_SECRET=
```

`.gitignore` already covers `.env*`. Verify before the first commit — the service role key is a full database credential.

---

## 14. Security and privacy posture

### 14.1 Done well

| Control | Implementation |
|---|---|
| Service role isolation | `import "server-only"` in `lib/supabase/admin.ts`; key never `NEXT_PUBLIC_` |
| No anon writes | Zero anon insert policies; every public write is server validated service role |
| Admin authorization in the database | `is_admin()` + RLS, not just app code |
| Allowlist unreadable | RLS on with no policies; only the `security definer` function reads it |
| `search_path` pinned | On every `security definer` function — blocks search path hijacking |
| Ratings not writable | Trigger owned and absent from the admin field registry |
| Field whitelist | `RESOURCES` bounds what the admin panel can write |
| Audit trail | Every mutation on 5 content tables, with actor |
| Append only logs | No delete policy on `audit_log` or `affiliate_clicks` |
| No account enumeration | "Wrong email or password"; unsubscribe returns the same message either way |
| Honeypot | Contact form, with fake success |
| Input caps | Length limits on every free text field |
| Raw IP never stored | Only hashes (but see below) |
| `rel="noopener noreferrer sponsored"` | Every outbound affiliate link |
| JWT validated | `getUser()` not `getSession()` |
| Admin de-indexed | `robots: { index: false, follow: false }` |

That is a genuinely strong baseline. The database, not the application, is the security boundary.

### 14.2 Must fix

| # | Severity | Issue |
|---|---|---|
| 1 | 🚨 **High** | **Unsalted SHA-256 IP hashes are reversible.** Not anonymization. Use HMAC with `IP_HASH_SECRET`. §10.2 |
| 2 | 🚨 **High** | **No rate limiting anywhere.** Review submission can move public ratings; newsletter and contact can be flooded. |
| 3 | 🚨 **High** | **Synthetic reviews must never reach production.** FTC 16 CFR Part 465. §8.3 |
| 4 | ⚠️ Med | **Commercial email lacks sender identification and a physical postal address.** Required by both CAN-SPAM and CASL. §9.3 |
| 5 | ⚠️ Med | **`requireAdmin()` and the CSV export check `user`, not `is_admin()`.** Saved only by RLS. Add explicit checks. |
| 6 | ⚠️ Med | **Affiliate destination is not validated as http(s).** Possible open redirect via a bad admin value. |
| 7 | ⚠️ Med | **No session refresh** without middleware; admin sessions expire hard. §6.2 |
| 8 | ⚠️ Med | **Confirm token never expires.** |
| 9 | ⚠️ Low | **`site_settings` is world readable** (`using (true)`). Do not put secrets there. |
| 10 | ⚠️ Low | **No CSP, HSTS or security headers** configured in `next.config.ts`. |
| 11 | ⚠️ Low | **No data retention policy.** `audit_log`, `affiliate_clicks` and `contact_messages` grow forever and contain personal data. |

### 14.3 Privacy obligations (CCPA/CPRA, PIPEDA, Law 25)

Personal data held:

| Data | Table | Basis |
|---|---|---|
| Reviewer name, job title, company | `reviews` | Published with consent |
| Email + consent trail | `newsletter_subscribers` | Express consent (CASL) |
| Name, email, message | `contact_messages` | Request handling |
| Hashed IP, UA, referrer | `affiliate_clicks` | Legitimate interest / analytics |

**Required capabilities, none of which exist yet:**

1. **Access / portability** — export everything held about a person on request (CCPA and PIPEDA both grant this).
2. **Deletion** — CCPA "right to delete", PIPEDA withdrawal of consent. Note `reviews` has no user account link, so deletion has to be by email or name lookup. **Design a subject request runbook.**
3. **Correction** — CPRA and PIPEDA both grant it.
4. **Do Not Sell/Share** — the site does not sell data, so state it plainly.
5. **Retention limits** — define and enforce. Suggested: `affiliate_clicks` 24 months, `contact_messages` 24 months, `audit_log` 12 months, unconfirmed `newsletter_subscribers` (`status='pending'`) **48 hours**, then purge.
6. **Quebec Law 25** — mandatory breach reporting and a designated privacy officer if you have Quebec users. You will.

Suggested retention job:

```sql
-- Purge unconfirmed signups after 48h (also enforces the token expiry)
delete from newsletter_subscribers
 where status = 'pending' and created_at < now() - interval '48 hours';

-- Trim click history
delete from affiliate_clicks where clicked_at < now() - interval '24 months';

-- Trim audit log
delete from audit_log where changed_at < now() - interval '12 months';
```

Run via `pg_cron` or a scheduled function. **The audit triggers will not fire on these** (they only cover the 5 content tables), so this is safe.

---

## 15. Deployment and infrastructure

### 15.1 Target

| Layer | Service |
|---|---|
| App | **Vercel** (`@vercel/analytics` is wired in; `/api/og` uses `runtime = "edge"`; the click route reads `x-vercel-ip-country`) |
| Database + Auth + Storage | **Supabase** |
| Email | **Resend** |

Nothing is Vercel specific except `x-vercel-ip-country`. Another host works if you replace that header.

### 15.2 First deploy

```
1. Create the Supabase project. Disable public sign ups in Auth settings.
2. SQL editor → paste supabase/setup_complete.sql → Run.
   (Change the seeded admin_allowlist email first.)
3. Set env vars in Vercel (§13). NEXT_PUBLIC_SITE_URL must match the domain.
4. Deploy.
5. npm run seed:catalogue && npm run seed:comparisons && npm run seed:articles
6. npm run seed:pages          ← REQUIRED. Skipping it 404s the legal suite.
7. npm run create-admin        → sign in at /admin
8. Verify: canonical URL, /terms returns 200, ratings render 4.4 not 4,4,
   a newsletter signup delivers a confirm email whose link resolves.
```

### 15.3 Ongoing

- **Backups:** Supabase point in time recovery. Verify a restore before launch, not after an incident.
- **Migrations:** `supabase/migrations/` exists. Move to migration files rather than editing `setup_complete.sql`, and keep the expand/contract discipline (add nullable/defaulted columns first, backfill, then constrain).
- **Monitoring:** because `safe()` swallows every error (§16 #2), you are blind by default. Add Sentry and log inside the catch.
- **Scheduled jobs:** the retention purges in §14.3 via `pg_cron`.

### 15.4 Headers to add

Not currently configured. Add to `next.config.ts`:

```ts
async headers() {
  return [{
    source: "/:path*",
    headers: [
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ],
  }];
}
```

A CSP needs care because the app renders vendor HTML via `dangerouslySetInnerHTML`.

### 15.5 The HTML injection surface

Three fields are rendered as raw HTML: `software.description_full` (`.prose-content`), `articles.content` (`.article-content`), `pages.content` (`.legal-content`).

Only allowlisted admins can write them, and RLS enforces that, so this is **not currently an XSS hole**. But it means **an admin account compromise is a full site XSS**. Sanitize server side on write with a strict allowlist, and do not rely on the admin boundary alone.

---

## 16. Known issues and improvements

### 16.1 Bugs

| # | Sev | Issue | Where | Fix |
|---|---|---|---|---|
| 1 | 🚨 | **Legal pages 404 on an empty `pages` table.** The placeholder fallback only fires when Supabase is *unconfigured* or the query *throws*, never when a row is simply missing (`maybeSingle()` returns `null` cleanly → `notFound()`). | `LegalPage` + `getPageBySlug` | Fall back to bundled content on `null`, and add a deploy smoke test |
| 2 | 🚨 | **`safe()` swallows every error silently.** `catch {}` with no log. A schema or RLS mistake serves demo data forever, undetected. | `lib/supabase/queries.ts` | `catch (e) { logger.error(e); return fallback; }` |
| 3 | 🚨 | **Unsalted SHA-256 IP hashing is reversible** and therefore not anonymization. | `lib/supabase/admin.ts` | HMAC with `IP_HASH_SECRET` (§10.2) |
| 4 | ⚠️ | **`getRatingDistribution` pulls every review row** to build 5 buckets, and the homepage calls it 6 times. | `queries.ts` | Grouped count or an RPC |
| 5 | ⚠️ | **Homepage ranking only sees 60 products.** `perPage: 60` bounds the whole Bayesian calculation. | `app/(public)/page.tsx` | Compute `C`/`m` in SQL, or fetch the full published set |
| 6 | ⚠️ | **`comparisons` has no unique pair constraint.** `(A,B)` and `(B,A)` can both exist → duplicate URLs → SEO cannibalisation. | schema | `unique (least(a,b), greatest(a,b))` |
| 7 | ⚠️ | **Article search misses the body.** Only `title` + `excerpt` are indexed. | schema | Add `content` and `setweight` |
| 8 | ⚠️ | **No session refresh** — the `setAll` catch comments "middleware refreshes sessions" but there is no middleware. | `lib/supabase/server.ts` | Add `middleware.ts` |
| 9 | ⚠️ | **`sendEmail` failure is ignored.** Returns `false`; the action still says "Check your inbox". | `newsletter/actions.ts` | Surface it |
| 10 | ⚠️ | **Click insert is awaited before redirect.** Slow write = slow redirect. | `track-click/route.ts` | Fire and forget / `waitUntil` |
| 11 | ⚠️ | **Affiliate destination not URL validated.** Open redirect risk. | `track-click/route.ts` | Assert `https?:` and a sane host |
| 12 | ⚠️ | **Confirm token never expires.** | `newsletter/actions.ts` | 48h window + purge job |

### 16.2 Weak patterns

| # | Issue |
|---|---|
| 13 | **No rate limiting anywhere.** Highest risk on review submission, which moves public ratings. |
| 14 | **Dead tables:** `redirects` and `media_library` are never read. Implement or drop. |
| 15 | **Dead settings:** 10 of 13 `site_settings` keys are unread (`ga_tracking_id`, `social_*`, `items_per_page`, `homepage_stats_*`). |
| 16 | **`interests text[]` is never written** despite existing in the schema and the type. |
| 17 | **Ratings trigger is 6 subqueries per review row.** Seeding is slow. Add a batch mode (`alter table reviews disable trigger`, bulk insert, recompute once, re-enable) or a statement level variant. |
| 18 | **Seed script sprawl.** Five vendor "waves" are an artifact of incremental catalogue building. Collapse to `seed:catalogue` + `seed:reviews`. |
| 19 | **`cardColumns()` probe is unnecessary in a fresh build.** The new schema has `brand_color` from day one. |
| 20 | **`stableId` namespace is `"stackmatch:"`.** Change once, before the first production seed, never after. |
| 21 | **No request level query dedupe.** Wrap readers in React `cache()`. |
| 22 | **Placeholder fallback and live search behave differently** (`includes()` vs `plainto_tsquery`), so local and production diverge confusingly. |
| 23 | **Public writes never revalidate.** New reviews take up to an hour to appear. Make it a decision. |
| 24 | **`site_settings` world readable.** |
| 25 | **Screenshots come from `/public` via a hand maintained slug map**, not the `screenshots` bucket that the schema and storage policies already provision. Two sources of truth. |

### 16.3 Gaps

- **No tests of any kind.** Minimum viable: the ranking formula, `parseField`, the rating trigger (SQL test), and a smoke test that every route returns 200 and the legal suite is seeded.
- **No `error.tsx` or `loading.tsx`** in any segment.
- **No monitoring / error reporting**, made worse by #2.
- **No security headers**, no CSP.
- **No retention jobs**; personal data accumulates indefinitely.
- **No subject access / deletion runbook** for CCPA and PIPEDA requests.
- **No conversion attribution** on affiliate links.
- **No `generateStaticParams`**, so the catalogue is not prebuilt.

### 16.4 Recommended build order for the rebuild

```
1.  Schema + triggers + RLS + allowlist        (§2, with the fixes: unique comparison pair,
                                                 weighted search vector, USD/US defaults)
2.  Three Supabase clients + hashIp with HMAC  (§1.2, §10.2)
3.  Query layer with LOGGED fallbacks          (§3, fix #2)
4.  lib/ranking.ts, extracted and unit tested  (§4.2, fix #5)
5.  Auth: middleware + layout guard + is_admin  (§6, fix #8)
6.  Admin registry + CRUD                      (§7)
7.  Public actions: newsletter, contact, review — all rate limited  (§5, fix #13)
8.  Email with a compliant CASL footer         (§9.3)
9.  Affiliate route, URL validated, non blocking (§10, fixes #10 #11)
10. Search with weights + ranking              (§11)
11. Seeds: catalogue + pages (REQUIRED) + articles.
    Reviews seed guarded to non production ONLY.  (§8.3)
12. Retention jobs + security headers + monitoring  (§14, §15)
```

---

## 17. Localization checklist

North America, single market. See `FRONTEND.md` §1.4.

### 17.1 Schema defaults

```sql
-- software
price_currency text not null default 'USD',      -- was 'ZAR'

-- reviews
reviewer_country text not null default 'United States',  -- was 'South Africa'
```

### 17.2 Base seed

- `site_settings`: `site_name`, `tagline`, `contact_email`, `footer_text`, `footer_tagline` — all currently South African. Rewrite. Prune the 10 dead keys.
- `categories`: keep all six slugs and `display_order`. **Rewrite every `description`** — they currently name VAT, SARS and UIF. Cover both regimes where the category is tax adjacent:
  - Accounting: "Bookkeeping, invoicing, sales tax and financial reporting for North American businesses."
  - Payroll: "Payroll processing, pay stubs, IRS and CRA filings, and compliance for US and Canadian employers."
- `admin_allowlist`: replace the seeded email.

### 17.3 Admin registry

```ts
{ name: "price_currency", label: "Currency", type: "select", options: ["USD", "CAD"] },  // was ZAR/USD/EUR/GBP
{ name: "countries_available", …, hint: "Lead with United States" },                      // was "Lead with South Africa"
```

### 17.4 Code

- `stableId` namespace `"stackmatch:"` → the new brand.
- `hashIp` comment cites POPIA → CCPA/PIPEDA. Also switch to HMAC.
- `subscribeNewsletter` confirm email mentions POPIA → CASL/CCPA, and **add the required sender identity and physical address**.
- `lib/scrub.ts` legacy `.uk` domain rewrites → delete.
- `track-click` `x-vercel-ip-country` → fine on Vercel; abstract if hosting elsewhere.

### 17.5 Content (database)

Every `software.description_full`, `articles.content`, and all six `pages.content` rows. Legal pages must be rebuilt for CCPA/CPRA, PIPEDA, Quebec Law 25, CAN-SPAM, CASL and the FTC endorsement guides. Delete the PAIA page entirely.

### 17.6 Verify

```bash
grep -rniE "sars|efiling|vat201|emp201|emp501|irp5|uif|popia|paia|information regulator|zar|cape town|co\.za|south africa" \
  supabase scripts lib app components
```

Then confirm in the running app:
- `select price_currency, count(*) from software group by 1;` → only `USD` (and `CAD` where a vendor genuinely lists in CAD)
- `select reviewer_country, count(*) from reviews group by 1;` → United States / Canada / Other
- `/terms` returns **200**, not 404
- a newsletter signup delivers a confirm email whose link resolves against `NEXT_PUBLIC_SITE_URL`
- ratings render `4.4`, prices render `$1,375`

---

## Appendix A — Schema quick reference

```
admin_allowlist(email pk, added_at)                     RLS on, no policies; only is_admin() reads

categories(id, name, slug uq, icon, description,
           software_count↺, display_order, created_at)

software(id, name, slug uq, tagline, description_short, description_full,
         logo_url, screenshots jsonb, category_id→categories,
         starting_price, price_currency='USD', billing_period='month',
         free_trial, free_version, pricing_plans jsonb,
         features jsonb, top_features jsonb, integrations jsonb, brand_color,
         affiliate_url, vendor_website, vendor_name, founded_year,
         support_types jsonb, countries_available jsonb, languages jsonb,
         overall_rating↺, ease_of_use_rating↺, value_for_money_rating↺,
         customer_service_rating↺, functionality_rating↺, review_count↺,
         meta_title, meta_description, og_image_url,
         status='draft', featured, created_at, updated_at↺,
         search_vector⚡ gin)

reviews(id, software_id→software CASCADE,
        reviewer_* , reviewer_country='United States',
        verified_linkedin, verified_badge, used_for_duration,
        overall_rating int 1..5 NOT NULL,
        ease_of_use/value_for_money/customer_service/functionality int 1..5 NULL,
        review_title, summary, pros, cons,
        vendor_response, vendor_response_date,
        review_date, helpful_count, status='published', created_at)

articles(id, title, slug uq, excerpt, content, featured_image_url, category_tag,
         related_software_id→software SET NULL, author_*, meta_*,
         read_time_minutes, status='draft', featured, published_date,
         created_at, updated_at↺, search_vector⚡ gin)

pages(id, slug uq, title, content, meta_*, status='published',
      created_at, updated_at↺)                          ← seed or the legal suite 404s

comparisons(id, software_a_id→software, software_b_id→software,
            custom_verdict, meta_*, status='published', created_at)
software_alternatives(id, software_id→software, alternative_id→software,
                      display_order, uq(software_id, alternative_id))

affiliate_clicks(id, software_id→software SET NULL, software_name, affiliate_url,
                 clicked_at, ip_hash, user_agent, referrer, country_code)
newsletter_subscribers(id, email uq, status='pending', interests[],
                       confirm_token, confirmed_at, unsubscribed_at,
                       consent_ip_hash, consent_source, user_agent, created_at)
contact_messages(id, name, email, subject, message, ip_hash, user_agent,
                 handled, created_at)

site_settings(id, key uq, value, updated_at)            anon readable
audit_log(id, table_name, row_id, action, actor, changed_at, old_data, new_data)
redirects(...)        ← dead
media_library(...)    ← dead

↺ = trigger owned, never write by hand     ⚡ = generated stored column
```

## Appendix B — Trigger map

| Table | Trigger | When | Does |
|---|---|---|---|
| `reviews` | `reviews_update_ratings` | AFTER I/U/D, row | Recomputes 6 aggregates on `software` |
| `software` | `software_update_category_counts` | AFTER I / U of (category_id,status) / D, row | Recounts `categories.software_count` both sides |
| `software` | `software_set_updated_at` | BEFORE U, row | `updated_at = now()` |
| `articles` | `articles_set_updated_at` | BEFORE U, row | `updated_at = now()` |
| `pages` | `pages_set_updated_at` | BEFORE U, row | `updated_at = now()` |
| `software` | `software_audit` | AFTER I/U/D, row | → `audit_log` |
| `articles` | `articles_audit` | AFTER I/U/D, row | → `audit_log` |
| `reviews` | `reviews_audit` | AFTER I/U/D, row | → `audit_log` |
| `pages` | `pages_audit` | AFTER I/U/D, row | → `audit_log` |
| `site_settings` | `settings_audit` | AFTER I/U/D, row | → `audit_log` |

---

*End of `BACKEND.md`. The design system, routes, components, layout and copy standards are specified in `FRONTEND.md`.*
