-- ============================================================================
-- 005 — newsletter subscribers with a POPIA consent trail. Idempotent.
-- Double opt in: rows start 'pending' and flip to 'confirmed' only when the
-- reader clicks the link we email them. One click unsubscribe keeps the row
-- with status 'unsubscribed' so consent history survives.
-- ============================================================================

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

alter table newsletter_subscribers enable row level security;

-- No anon access at all; the service role handles signup, confirm and
-- unsubscribe server side. The admin panel may read and update.
drop policy if exists "admin read subscribers" on newsletter_subscribers;
create policy "admin read subscribers" on newsletter_subscribers for select to authenticated using (true);

drop policy if exists "admin update subscribers" on newsletter_subscribers;
create policy "admin update subscribers" on newsletter_subscribers for update to authenticated using (true) with check (true);
