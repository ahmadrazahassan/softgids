-- ============================================================================
-- STACK MATCH (SOUTH AFRICA) — COMPLETE DATABASE SETUP
-- ============================================================================
-- One file, everything: schema, triggers, row level security, storage
-- buckets, the admin allowlist and the base seed rows (SA settings and
-- categories). Fully idempotent: run it once or ten times, the result is
-- identical. Paste it into the Supabase SQL editor and press Run.
--
-- Admin model: sign ups are disabled in the dashboard; only accounts on the
-- admin_allowlist below get write access. zaidumar422cg@gmail.com is seeded
-- as the admin.
--
-- After this file: run `npm run seed` for the SA product roster, reviews,
-- articles, comparisons and pages, then create the admin auth user
-- (`npm run create-admin` or the dashboard).
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ============================================================================
-- 1. ADMIN ALLOWLIST
-- Any authenticated user whose email is in this table is the admin. RLS is
-- enabled with no policies, so only the security definer function below can
-- read it. Add a row to grant another person access.
-- ============================================================================

create table if not exists admin_allowlist (
  email text primary key,
  added_at timestamptz not null default now()
);

alter table admin_allowlist enable row level security;

insert into admin_allowlist (email) values ('zaidumar422cg@gmail.com')
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

-- ============================================================================
-- 2. TABLES  (South African defaults: ZAR currency, South Africa reviewers)
-- ============================================================================

create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  icon text,
  description text,
  software_count int not null default 0,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists software (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  tagline text,
  description_short text not null,
  description_full text not null,
  logo_url text,
  screenshots jsonb not null default '[]',
  category_id uuid references categories(id),

  starting_price numeric,
  price_currency text not null default 'ZAR',
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

-- Columns that arrived by migration on older installs; harmless on new ones.
alter table software add column if not exists integrations jsonb not null default '[]';
alter table software add column if not exists brand_color text;

create index if not exists software_search_idx on software using gin (search_vector);
create index if not exists software_category_published_idx on software (category_id) where status = 'published';
create index if not exists software_status_idx on software (status);

create table if not exists reviews (
  id uuid primary key default uuid_generate_v4(),
  software_id uuid not null references software(id) on delete cascade,

  reviewer_name text not null,
  reviewer_job_title text,
  reviewer_company text,
  reviewer_industry text,
  reviewer_company_size text,
  reviewer_country text not null default 'South Africa',
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

create table if not exists articles (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null,
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

create table if not exists affiliate_clicks (
  id uuid primary key default uuid_generate_v4(),
  software_id uuid references software(id) on delete set null,
  software_name text,
  affiliate_url text,
  clicked_at timestamptz not null default now(),
  ip_hash text,
  user_agent text,
  referrer text,
  country_code text,
  -- Which button or banner was clicked. Same value we send Impact as subId1.
  placement text
);

create index if not exists affiliate_clicks_software_idx on affiliate_clicks (software_id, clicked_at desc);
create index if not exists affiliate_clicks_placement_idx on affiliate_clicks (placement, clicked_at desc);
create index if not exists affiliate_clicks_time_idx on affiliate_clicks (clicked_at desc);

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
  content text not null,
  meta_title text,
  meta_description text,
  status text not null default 'published' check (status in ('published','draft')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

-- ============================================================================
-- 3. TRIGGERS
-- ============================================================================

-- Ratings and review counts are derived, never stored by hand. Runs on
-- insert, update and delete so hiding or removing a review recomputes too.
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

create or replace function update_category_counts()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  if old is not null and old.category_id is not null then
    update categories c set software_count =
      (select count(*) from software s where s.category_id = c.id and s.status = 'published')
    where c.id = old.category_id;
  end if;
  if new is not null and new.category_id is not null then
    update categories c set software_count =
      (select count(*) from software s where s.category_id = c.id and s.status = 'published')
    where c.id = new.category_id;
  end if;
  return coalesce(new, old);
end $$;

drop trigger if exists software_update_category_counts on software;
create trigger software_update_category_counts
  after insert or update of category_id, status or delete on software
  for each row execute function update_category_counts();

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists software_set_updated_at on software;
create trigger software_set_updated_at
  before update on software for each row execute function set_updated_at();

drop trigger if exists articles_set_updated_at on articles;
create trigger articles_set_updated_at
  before update on articles for each row execute function set_updated_at();

drop trigger if exists pages_set_updated_at on pages;
create trigger pages_set_updated_at
  before update on pages for each row execute function set_updated_at();

-- Every mutation on the content tables lands in the audit log with the actor.
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

drop trigger if exists software_audit on software;
create trigger software_audit after insert or update or delete on software
  for each row execute function write_audit_log();

drop trigger if exists articles_audit on articles;
create trigger articles_audit after insert or update or delete on articles
  for each row execute function write_audit_log();

drop trigger if exists reviews_audit on reviews;
create trigger reviews_audit after insert or update or delete on reviews
  for each row execute function write_audit_log();

drop trigger if exists pages_audit on pages;
create trigger pages_audit after insert or update or delete on pages
  for each row execute function write_audit_log();

drop trigger if exists settings_audit on site_settings;
create trigger settings_audit after insert or update or delete on site_settings
  for each row execute function write_audit_log();

-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- Anon: published content only. Admin: allowlisted email only. The service
-- role bypasses RLS by design and handles public form writes server side.
-- ============================================================================

alter table categories enable row level security;
alter table software enable row level security;
alter table reviews enable row level security;
alter table articles enable row level security;
alter table software_alternatives enable row level security;
alter table comparisons enable row level security;
alter table affiliate_clicks enable row level security;
alter table site_settings enable row level security;
alter table pages enable row level security;
alter table audit_log enable row level security;
alter table redirects enable row level security;
alter table media_library enable row level security;
alter table newsletter_subscribers enable row level security;
alter table contact_messages enable row level security;

-- Public reads
drop policy if exists "anon read categories" on categories;
create policy "anon read categories" on categories for select using (true);

drop policy if exists "anon read published software" on software;
create policy "anon read published software" on software for select using (status = 'published');

drop policy if exists "anon read published reviews" on reviews;
create policy "anon read published reviews" on reviews for select using (status = 'published');

drop policy if exists "anon read published articles" on articles;
create policy "anon read published articles" on articles for select using (status = 'published');

drop policy if exists "anon read alternatives" on software_alternatives;
create policy "anon read alternatives" on software_alternatives for select using (true);

drop policy if exists "anon read published comparisons" on comparisons;
create policy "anon read published comparisons" on comparisons for select using (status = 'published');

drop policy if exists "anon read settings" on site_settings;
create policy "anon read settings" on site_settings for select using (true);

drop policy if exists "anon read published pages" on pages;
create policy "anon read published pages" on pages for select using (status = 'published');

drop policy if exists "anon read redirects" on redirects;
create policy "anon read redirects" on redirects for select using (true);

-- Admin (allowlisted email) — full control of content tables
drop policy if exists "admin all categories" on categories;
create policy "admin all categories" on categories for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "admin all software" on software;
create policy "admin all software" on software for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "admin all reviews" on reviews;
create policy "admin all reviews" on reviews for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "admin all articles" on articles;
create policy "admin all articles" on articles for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "admin all alternatives" on software_alternatives;
create policy "admin all alternatives" on software_alternatives for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "admin all comparisons" on comparisons;
create policy "admin all comparisons" on comparisons for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "admin all settings" on site_settings;
create policy "admin all settings" on site_settings for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "admin all pages" on pages;
create policy "admin all pages" on pages for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "admin all redirects" on redirects;
create policy "admin all redirects" on redirects for all to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "admin all media" on media_library;
create policy "admin all media" on media_library for all to authenticated using (is_admin()) with check (is_admin());

-- Read only or restricted admin surfaces
drop policy if exists "admin read clicks" on affiliate_clicks;
create policy "admin read clicks" on affiliate_clicks for select to authenticated using (is_admin());

drop policy if exists "admin read audit" on audit_log;
create policy "admin read audit" on audit_log for select to authenticated using (is_admin());

drop policy if exists "admin read subscribers" on newsletter_subscribers;
create policy "admin read subscribers" on newsletter_subscribers for select to authenticated using (is_admin());

drop policy if exists "admin update subscribers" on newsletter_subscribers;
create policy "admin update subscribers" on newsletter_subscribers for update to authenticated using (is_admin()) with check (is_admin());

drop policy if exists "admin read contact" on contact_messages;
create policy "admin read contact" on contact_messages for select to authenticated using (is_admin());

drop policy if exists "admin update contact" on contact_messages;
create policy "admin update contact" on contact_messages for update to authenticated using (is_admin()) with check (is_admin());

-- ============================================================================
-- 5. STORAGE  (public read, admin write)
-- ============================================================================

insert into storage.buckets (id, name, public) values
  ('logos', 'logos', true),
  ('screenshots', 'screenshots', true),
  ('avatars', 'avatars', true),
  ('articles', 'articles', true)
on conflict (id) do nothing;

drop policy if exists "public read site assets" on storage.objects;
create policy "public read site assets" on storage.objects
  for select using (bucket_id in ('logos','screenshots','avatars','articles'));

drop policy if exists "admin insert site assets" on storage.objects;
create policy "admin insert site assets" on storage.objects
  for insert to authenticated with check (is_admin() and bucket_id in ('logos','screenshots','avatars','articles'));

drop policy if exists "admin update site assets" on storage.objects;
create policy "admin update site assets" on storage.objects
  for update to authenticated using (is_admin() and bucket_id in ('logos','screenshots','avatars','articles'));

drop policy if exists "admin delete site assets" on storage.objects;
create policy "admin delete site assets" on storage.objects
  for delete to authenticated using (is_admin() and bucket_id in ('logos','screenshots','avatars','articles'));

-- ============================================================================
-- 6. SEED — settings and categories (South African values)
-- The full SA roster (products, reviews, articles, comparisons, pages) is
-- seeded by `npm run seed`, which derives ratings through the trigger.
-- ============================================================================

insert into site_settings (key, value) values
  ('site_name', 'Stackmatch'),
  ('tagline', 'South Africa''s #1 Business Software Reviews Platform'),
  ('contact_email', 'hello@stackmatch.co.za'),
  ('footer_text', 'Stackmatch helps South African businesses find the right software through verified reviews and expert comparisons.'),
  ('social_twitter', ''),
  ('social_linkedin', ''),
  ('social_facebook', ''),
  ('ga_tracking_id', ''),
  ('items_per_page', '10'),
  ('homepage_stats_reviews', ''),
  ('homepage_stats_software', ''),
  ('homepage_stats_categories', ''),
  ('footer_tagline', 'Verified reviews and rand pricing for South African teams.')
on conflict (key) do nothing;

insert into categories (name, slug, icon, description, display_order) values
  ('Accounting Software', 'accounting-software', 'calculator', 'Bookkeeping, invoicing, VAT and financial reporting tools for South African businesses.', 1),
  ('Payroll Software', 'payroll-software', 'banknote', 'Payroll processing, payslips, SARS submissions, UIF and compliance for SA employers.', 2),
  ('HR Software', 'hr-software', 'users', 'Leave, onboarding, performance and employee records for growing teams.', 3),
  ('CRM Software', 'crm-software', 'heart-handshake', 'Pipeline, contact management and sales automation to win and keep customers.', 4),
  ('ERP Software', 'erp-software', 'factory', 'Integrated finance, inventory, operations and manufacturing management.', 5),
  ('Project Management', 'project-management', 'kanban', 'Plan work, track projects and collaborate across teams of any size.', 6)
on conflict (slug) do nothing;

-- Done. Run `npm run seed`, then create the admin auth user and sign in.
