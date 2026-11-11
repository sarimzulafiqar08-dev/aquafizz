-- AquaFizz: CNIC + district + address at signup.
-- Run after 20261024000000_sindh_delivery_area.sql (uses public.sindh_districts()). Safe to re-run.

begin;

-- ── CNIC on profiles: 12345-1234567-1, one account per CNIC ────────────────
alter table public.profiles add column if not exists cnic text not null default '';

create or replace function public.format_cnic(p text)
returns text
language sql
immutable
as $$
  select case
    when regexp_replace(coalesce(p, ''), '\D', '', 'g') ~ '^\d{13}$' then
      substr(regexp_replace(p, '\D', '', 'g'), 1, 5) || '-' ||
      substr(regexp_replace(p, '\D', '', 'g'), 6, 7) || '-' ||
      substr(regexp_replace(p, '\D', '', 'g'), 13, 1)
    else ''
  end;
$$;

-- Accounts created before this migration: copy CNIC / district / address from signup metadata.
update public.profiles p
set cnic = public.format_cnic(u.raw_user_meta_data ->> 'cnic')
from auth.users u
where u.id = p.id and p.cnic = '' and public.format_cnic(u.raw_user_meta_data ->> 'cnic') <> ''
  and not exists (
    select 1 from public.profiles q where q.cnic = public.format_cnic(u.raw_user_meta_data ->> 'cnic')
  );
update public.profiles p
set address = trim(u.raw_user_meta_data ->> 'address')
from auth.users u
where u.id = p.id and p.address = '' and coalesce(trim(u.raw_user_meta_data ->> 'address'), '') <> '';
update public.profiles p
set area = u.raw_user_meta_data ->> 'area'
from auth.users u
where u.id = p.id and p.area = '' and (u.raw_user_meta_data ->> 'area') = any (public.sindh_districts());

alter table public.profiles drop constraint if exists profiles_cnic_format;
alter table public.profiles add constraint profiles_cnic_format check (cnic = '' or cnic ~ '^\d{5}-\d{7}-\d$');
create unique index if not exists profiles_cnic_unique on public.profiles (cnic) where cnic <> '';

-- ── Duplicate check before signup: email, phone and CNIC ───────────────────
drop function if exists public.check_signup_available(text, text);
create or replace function public.check_signup_available(p_email text, p_phone text, p_cnic text default '')
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'email', not exists (select 1 from auth.users where lower(email) = lower(trim(coalesce(p_email, '')))),
    'phone', not exists (
      select 1 from public.profiles where phone <> '' and phone = public.normalize_pk_phone(p_phone)
    ),
    'cnic', not exists (
      select 1 from public.profiles where cnic <> '' and cnic = public.format_cnic(p_cnic)
    )
  );
$$;

grant execute on function public.check_signup_available(text, text, text) to anon, authenticated;

-- ── New users: validate and save name, phone, CNIC, district, address ──────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := regexp_replace(trim(coalesce(new.raw_user_meta_data ->> 'name', '')), '\s+', ' ', 'g');
  v_phone text := public.normalize_pk_phone(new.raw_user_meta_data ->> 'phone');
  v_cnic_raw text := coalesce(new.raw_user_meta_data ->> 'cnic', '');
  v_cnic text := public.format_cnic(new.raw_user_meta_data ->> 'cnic');
  v_area text := coalesce(new.raw_user_meta_data ->> 'area', '');
  v_address text := regexp_replace(trim(coalesce(new.raw_user_meta_data ->> 'address', '')), '\s+', ' ', 'g');
begin
  if v_name <> '' and v_name !~ '^[A-Za-z]+( [A-Za-z]+)*$' then
    raise exception 'Name can only contain letters and spaces.';
  end if;
  if v_phone <> '' and v_phone !~ '^03\d{9}$' then
    raise exception 'Mobile number must start with 03 and be exactly 11 digits.';
  end if;
  if v_phone <> '' and exists (select 1 from public.profiles where phone = v_phone) then
    raise exception 'This phone number is already registered with another account.';
  end if;
  if v_cnic_raw <> '' and v_cnic = '' then
    raise exception 'CNIC must be exactly 13 digits.';
  end if;
  if v_cnic <> '' and exists (select 1 from public.profiles where cnic = v_cnic) then
    raise exception 'This CNIC is already registered with another account.';
  end if;
  if v_area <> '' and not (v_area = any (public.sindh_districts())) then
    v_area := '';
  end if;
  insert into public.profiles (id, email, name, phone, cnic, area, address)
  values (new.id, coalesce(new.email, ''), v_name, v_phone, v_cnic, v_area, left(v_address, 300))
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Users can't change their role, email, CNIC or mark their own phone verified.
create or replace function public.protect_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.role := old.role;
    new.email := old.email;
    new.cnic := old.cnic;
    if new.phone is distinct from old.phone then
      new.phone_verified := false;
    else
      new.phone_verified := old.phone_verified;
    end if;
  end if;
  if old.role = 'admin' and new.role <> 'admin'
     and (select count(*) from public.profiles where role = 'admin') <= 1 then
    raise exception 'At least one admin is required.';
  end if;
  return new;
end;
$$;

commit;

-- Check: should list your accounts (CNIC is empty for accounts made before this change).
select email, name, phone, cnic, area, role from public.profiles order by created_at;
