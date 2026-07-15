-- ============================================================================
-- Stack Match (South Africa) — 001 core schema
-- Tables, triggers, RLS, storage buckets, SA defaults and base seed rows.
-- Idempotent: safe to run more than once.
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- software  (South African defaults: price_currency ZAR)
-- ---------------------------------------------------------------------------
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

create index if not exists software_search_idx on software using gin (search_vector);
create index if not exists software_category_published_idx on software (category_id) where status = 'published';
create index if not exists software_status_idx on software (status);

-- ---------------------------------------------------------------------------
-- reviews  (South African default reviewer_country)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- articles
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- software_alternatives
-- ---------------------------------------------------------------------------
create table if not exists software_alternatives (
  id uuid primary key default uuid_generate_v4(),
  software_id uuid not null references software(id) on delete cascade,
  alternative_id uuid not null references software(id) on delete cascade,
  display_order int not null default 0,
  unique (software_id, alternative_id)
);

-- ---------------------------------------------------------------------------
-- comparisons
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- affiliate_clicks  (service role writes only; see RLS below)
-- ---------------------------------------------------------------------------
create table if not exists affiliate_clicks (
  id uuid primary key default uuid_generate_v4(),
  software_id uuid references software(id) on delete set null,
  software_name text,
  affiliate_url text,
  clicked_at timestamptz not null default now(),
  ip_hash text,
  user_agent text,
  referrer text,
  country_code text
);

create index if not exists affiliate_clicks_software_idx on affiliate_clicks (software_id, clicked_at desc);
create index if not exists affiliate_clicks_time_idx on affiliate_clicks (clicked_at desc);

-- ---------------------------------------------------------------------------
-- site_settings
-- ---------------------------------------------------------------------------
create table if not exists site_settings (
  id uuid primary key default uuid_generate_v4(),
  key text not null unique,
  value text,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- Recompute the five averaged ratings + review_count for the affected product.
create or replace function update_software_ratings()
returns trigger language plpgsql security definer as $$
declare
  target uuid := coalesce(new.software_id, old.software_id);
begin
  update software s set
    overall_rating          = coalesce((select round(avg(r.overall_rating)::numeric, 1)  from reviews r where r.software_id = target and r.status = 'published'), 0),
    ease_of_use_rating      = coalesce((select round(avg(r.ease_of_use)::numeric, 1)     from reviews r where r.software_id = target and r.status = 'published'), 0),
    value_for_money_rating  = coalesce((select round(avg(r.value_for_money)::numeric, 1) from reviews r where r.software_id = target and r.status = 'published'), 0),
    customer_service_rating = coalesce((select round(avg(r.customer_service)::numeric, 1) from reviews r where r.software_id = target and r.status = 'published'), 0),
    functionality_rating    = coalesce((select round(avg(r.functionality)::numeric, 1)   from reviews r where r.software_id = target and r.status = 'published'), 0),
    review_count            = (select count(*) from reviews r where r.software_id = target and r.status = 'published'),
    updated_at              = now()
  where s.id = target;
  return coalesce(new, old);
end $$;

drop trigger if exists reviews_update_ratings on reviews;
create trigger reviews_update_ratings
  after insert or update or delete on reviews
  for each row execute function update_software_ratings();

-- Keep categories.software_count in sync with published software.
create or replace function update_category_counts()
returns trigger language plpgsql security definer as $$
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

-- Stamp updated_at on every update.
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists software_set_updated_at on software;
create trigger software_set_updated_at
  before update on software
  for each row execute function set_updated_at();

drop trigger if exists articles_set_updated_at on articles;
create trigger articles_set_updated_at
  before update on articles
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table categories enable row level security;
alter table software enable row level security;
alter table reviews enable row level security;
alter table articles enable row level security;
alter table software_alternatives enable row level security;
alter table comparisons enable row level security;
alter table affiliate_clicks enable row level security;
alter table site_settings enable row level security;

-- Public (anon) reads
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

-- Admin (any authenticated user is the single admin)
drop policy if exists "admin all categories" on categories;
create policy "admin all categories" on categories for all to authenticated using (true) with check (true);

drop policy if exists "admin all software" on software;
create policy "admin all software" on software for all to authenticated using (true) with check (true);

drop policy if exists "admin all reviews" on reviews;
create policy "admin all reviews" on reviews for all to authenticated using (true) with check (true);

drop policy if exists "admin all articles" on articles;
create policy "admin all articles" on articles for all to authenticated using (true) with check (true);

drop policy if exists "admin all alternatives" on software_alternatives;
create policy "admin all alternatives" on software_alternatives for all to authenticated using (true) with check (true);

drop policy if exists "admin all comparisons" on comparisons;
create policy "admin all comparisons" on comparisons for all to authenticated using (true) with check (true);

drop policy if exists "admin all settings" on site_settings;
create policy "admin all settings" on site_settings for all to authenticated using (true) with check (true);

-- Affiliate clicks: admin may read; only the service role writes.
drop policy if exists "admin read clicks" on affiliate_clicks;
create policy "admin read clicks" on affiliate_clicks for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- Storage buckets (public read, authenticated write)
-- ---------------------------------------------------------------------------
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
  for insert to authenticated with check (bucket_id in ('logos','screenshots','avatars','articles'));

drop policy if exists "admin update site assets" on storage.objects;
create policy "admin update site assets" on storage.objects
  for update to authenticated using (bucket_id in ('logos','screenshots','avatars','articles'));

drop policy if exists "admin delete site assets" on storage.objects;
create policy "admin delete site assets" on storage.objects
  for delete to authenticated using (bucket_id in ('logos','screenshots','avatars','articles'));

-- ---------------------------------------------------------------------------
-- Seed: site settings (South African values)
-- ---------------------------------------------------------------------------
insert into site_settings (key, value) values
  ('site_name', 'Stackmatch'),
  ('tagline', 'South Africa''s #1 Business Software Reviews Platform'),
  ('contact_email', 'hello@stackmatch.co.za'),
  ('footer_text', 'Stackmatch helps South African businesses find the right software through verified reviews and expert comparisons.'),
  ('social_twitter', ''),
  ('social_linkedin', ''),
  ('social_facebook', ''),
  ('ga_tracking_id', ''),
  ('items_per_page', '10')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Seed: categories (SA descriptions)
-- ---------------------------------------------------------------------------
insert into categories (name, slug, icon, description, display_order) values
  ('Accounting Software', 'accounting-software', 'calculator', 'Bookkeeping, invoicing, VAT and financial reporting tools for South African businesses.', 1),
  ('Payroll Software', 'payroll-software', 'banknote', 'Payroll processing, payslips, SARS submissions, UIF and compliance for SA employers.', 2),
  ('HR Software', 'hr-software', 'users', 'Leave, onboarding, performance and employee records for growing teams.', 3),
  ('CRM Software', 'crm-software', 'heart-handshake', 'Pipeline, contact management and sales automation to win and keep customers.', 4),
  ('ERP Software', 'erp-software', 'factory', 'Integrated finance, inventory, operations and manufacturing management.', 5),
  ('Project Management', 'project-management', 'kanban', 'Plan work, track projects and collaborate across teams of any size.', 6)
on conflict (slug) do nothing;
