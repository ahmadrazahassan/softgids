-- ============================================================================
-- 007 — contact form storage. Idempotent.
-- ============================================================================

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

alter table contact_messages enable row level security;

-- Writes go through the service role; the admin panel reads and updates.
drop policy if exists "admin read contact" on contact_messages;
create policy "admin read contact" on contact_messages for select to authenticated using (true);

drop policy if exists "admin update contact" on contact_messages;
create policy "admin update contact" on contact_messages for update to authenticated using (true) with check (true);
