-- AquaFizz: Contact page messages, kept for admins (the form also opens WhatsApp).
-- Run once in Supabase → SQL Editor. Safe to re-run.

begin;

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null default auth.uid(),
  name text not null check (char_length(trim(name)) between 1 and 80),
  phone text not null default '' check (phone = '' or phone ~ '^03\d{9}$'),
  message text not null check (char_length(trim(message)) between 5 and 2000),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_created_idx on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;

-- Anyone can send a message (new, unread, as themselves); only admins can read, mark or delete.
drop policy if exists "contact messages: anyone sends" on public.contact_messages;
create policy "contact messages: anyone sends" on public.contact_messages
  for insert to anon, authenticated
  with check (is_read = false and (user_id is null or user_id = auth.uid()));

drop policy if exists "contact messages: admin read" on public.contact_messages;
create policy "contact messages: admin read" on public.contact_messages
  for select using (public.is_admin());

drop policy if exists "contact messages: admin update" on public.contact_messages;
create policy "contact messages: admin update" on public.contact_messages
  for update using (public.is_admin());

drop policy if exists "contact messages: admin delete" on public.contact_messages;
create policy "contact messages: admin delete" on public.contact_messages
  for delete using (public.is_admin());

grant insert on public.contact_messages to anon, authenticated;
grant select, update, delete on public.contact_messages to authenticated;

commit;
