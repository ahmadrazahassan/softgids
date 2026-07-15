-- ============================================================================
-- 003 — audit log, redirects, media library. Idempotent.
-- ============================================================================

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

-- Generic audit trigger: records every mutation with actor + before/after.
create or replace function write_audit_log()
returns trigger language plpgsql security definer as $$
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

alter table audit_log enable row level security;
alter table redirects enable row level security;
alter table media_library enable row level security;

drop policy if exists "admin read audit" on audit_log;
create policy "admin read audit" on audit_log for select to authenticated using (true);

drop policy if exists "anon read redirects" on redirects;
create policy "anon read redirects" on redirects for select using (true);

drop policy if exists "admin all redirects" on redirects;
create policy "admin all redirects" on redirects for all to authenticated using (true) with check (true);

drop policy if exists "admin all media" on media_library;
create policy "admin all media" on media_library for all to authenticated using (true) with check (true);
