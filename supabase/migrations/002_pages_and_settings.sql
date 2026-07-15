-- ============================================================================
-- 002 — editable static pages + extra settings keys. Idempotent.
-- ============================================================================

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

drop trigger if exists pages_set_updated_at on pages;
create trigger pages_set_updated_at
  before update on pages
  for each row execute function set_updated_at();

alter table pages enable row level security;

drop policy if exists "anon read published pages" on pages;
create policy "anon read published pages" on pages for select using (status = 'published');

drop policy if exists "admin all pages" on pages;
create policy "admin all pages" on pages for all to authenticated using (true) with check (true);

insert into site_settings (key, value) values
  ('homepage_stats_reviews', ''),
  ('homepage_stats_software', ''),
  ('homepage_stats_categories', ''),
  ('footer_tagline', 'Verified reviews and rand pricing for South African teams.')
on conflict (key) do nothing;
