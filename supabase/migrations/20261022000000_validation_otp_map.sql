-- AquaFizz: signup validation, unique phone numbers, phone OTP sync, delivery pin + range.
-- Run once in Supabase → SQL Editor (after 20261019000000_ecommerce.sql). Safe to re-run.

begin;

-- ── Phone helpers ───────────────────────────────────────────────────────────
-- '+92 300-1234567' / '923001234567' / '03001234567' → '03001234567'
create or replace function public.normalize_pk_phone(p text)
returns text
language sql
immutable
as $$
  select case
    when regexp_replace(coalesce(p, ''), '\D', '', 'g') ~ '^923\d{9}$'
      then '0' || substr(regexp_replace(p, '\D', '', 'g'), 3)
    else regexp_replace(coalesce(p, ''), '\D', '', 'g')
  end;
$$;

-- ── Profiles: verified phone + saved map pin ────────────────────────────────
alter table public.profiles add column if not exists phone_verified boolean not null default false;
alter table public.profiles add column if not exists lat double precision;
alter table public.profiles add column if not exists lng double precision;

-- Clean existing numbers, blank anything invalid, and keep only the first owner of a duplicate.
update public.profiles set phone = public.normalize_pk_phone(phone) where phone <> '';
update public.profiles set phone = '' where phone <> '' and phone !~ '^03\d{9}$';
update public.profiles p set phone = ''
where phone <> '' and exists (
  select 1 from public.profiles q where q.phone = p.phone and q.created_at < p.created_at
);

alter table public.profiles drop constraint if exists profiles_phone_format;
alter table public.profiles add constraint profiles_phone_format check (phone = '' or phone ~ '^03\d{9}$');
alter table public.profiles drop constraint if exists profiles_name_format;
alter table public.profiles add constraint profiles_name_format check (name = '' or name ~ '^[A-Za-z]+( [A-Za-z]+)*$') not valid;
create unique index if not exists profiles_phone_unique on public.profiles (phone) where phone <> '';

-- ── Duplicate check before signup (used by the signup form) ─────────────────
create or replace function public.check_signup_available(p_email text, p_phone text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'email', not exists (select 1 from auth.users where lower(email) = lower(trim(coalesce(p_email, '')))),
    'phone', not exists (
      select 1 from public.profiles
      where phone <> '' and phone = public.normalize_pk_phone(p_phone)
    )
  );
$$;

grant execute on function public.check_signup_available(text, text) to anon, authenticated;

-- ── New users: validate name + phone, reject duplicate phone ────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := regexp_replace(trim(coalesce(new.raw_user_meta_data ->> 'name', '')), '\s+', ' ', 'g');
  v_phone text := public.normalize_pk_phone(new.raw_user_meta_data ->> 'phone');
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
  insert into public.profiles (id, email, name, phone)
  values (new.id, coalesce(new.email, ''), v_name, v_phone)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ── Phone OTP: when Supabase confirms a phone, copy it to the profile ───────
create or replace function public.sync_phone_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text := public.normalize_pk_phone(new.phone);
begin
  if new.phone_confirmed_at is not null and v_phone ~ '^03\d{9}$'
     and (old.phone_confirmed_at is distinct from new.phone_confirmed_at or old.phone is distinct from new.phone) then
    -- The verified owner wins over any unverified account that typed the same number.
    update public.profiles set phone = '', phone_verified = false
      where phone = v_phone and id <> new.id and not phone_verified;
    update public.profiles set phone = v_phone, phone_verified = true where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_phone_verified on auth.users;
create trigger on_auth_user_phone_verified
  after update of phone, phone_confirmed_at on auth.users
  for each row execute function public.sync_phone_verification();

-- Users can't change their role/email or mark their own phone verified.
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

-- ── Orders: validate name, phone and map pin inside the delivery range ──────
-- Delivery zone lives in store_settings key 'delivery' = { lat, lng, radiusKm } (Admin → Settings).
create or replace function public.place_order(p_order jsonb)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  line jsonb;
  prod public.products;
  qty integer;
  clean_items jsonb := '[]'::jsonb;
  subtotal numeric := 0;
  delivery numeric;
  discount numeric := 0;
  promo text := upper(coalesce(p_order -> 'totals' ->> 'promoCode', ''));
  pay_method text := coalesce(p_order -> 'payment' ->> 'method', 'cod');
  pay_label text;
  pay jsonb;
  new_id text;
  result public.orders;
  d jsonb := coalesce(p_order -> 'delivery', '{}'::jsonb);
  v_name text := regexp_replace(trim(coalesce(d ->> 'name', '')), '\s+', ' ', 'g');
  v_phone text := public.normalize_pk_phone(d ->> 'phone');
  v_lat double precision;
  v_lng double precision;
  zone jsonb;
  z_lat double precision;
  z_lng double precision;
  z_radius double precision;
  dist_km double precision;
begin
  if jsonb_array_length(coalesce(p_order -> 'items', '[]'::jsonb)) = 0 then
    raise exception 'Your cart is empty.';
  end if;

  -- Delivery details
  if v_name !~ '^[A-Za-z]+( [A-Za-z]+)*$' then
    raise exception 'Name can only contain letters and spaces.';
  end if;
  if v_phone !~ '^03\d{9}$' then
    raise exception 'Mobile number must start with 03 and be exactly 11 digits.';
  end if;
  if coalesce(trim(d ->> 'address'), '') = '' or coalesce(trim(d ->> 'area'), '') = '' then
    raise exception 'Please enter your address and area.';
  end if;
  begin
    v_lat := (d -> 'location' ->> 'lat')::double precision;
    v_lng := (d -> 'location' ->> 'lng')::double precision;
  exception when others then
    v_lat := null;
  end;
  if v_lat is null or v_lng is null then
    raise exception 'Please pin your delivery location on the map.';
  end if;
  select value into zone from public.store_settings where key = 'delivery';
  z_lat := coalesce((zone ->> 'lat')::double precision, 24.9216);
  z_lng := coalesce((zone ->> 'lng')::double precision, 67.0943);
  z_radius := coalesce((zone ->> 'radiusKm')::double precision, 15);
  dist_km := 2 * 6371 * asin(sqrt(
    power(sin(radians(v_lat - z_lat) / 2), 2) +
    cos(radians(z_lat)) * cos(radians(v_lat)) * power(sin(radians(v_lng - z_lng) / 2), 2)
  ));
  if dist_km > z_radius then
    raise exception 'Sorry, your location is % km away — outside our % km delivery range.', round(dist_km::numeric, 1), z_radius;
  end if;
  d := d || jsonb_build_object('name', v_name, 'phone', v_phone, 'location', jsonb_build_object('lat', v_lat, 'lng', v_lng), 'distanceKm', round(dist_km::numeric, 2));

  for line in select * from jsonb_array_elements(p_order -> 'items') loop
    qty := greatest(1, (line ->> 'quantity')::integer);
    select * into prod from public.products where id::text = line ->> 'id' for update;
    if not found then
      raise exception '% is no longer available. Remove it from your cart.', line ->> 'name';
    end if;
    if prod.stock < qty then
      if prod.stock = 0 then
        raise exception '% is out of stock.', prod.name;
      end if;
      raise exception 'Only % × % left. Update your cart.', prod.stock, prod.name;
    end if;
    update public.products set stock = stock - qty where id = prod.id;
    subtotal := subtotal + prod.price * qty;
    clean_items := clean_items || jsonb_build_object(
      'id', prod.id, 'slug', prod.slug, 'name', prod.name, 'brand', prod.brand,
      'size', prod.size, 'price', prod.price, 'image', prod.images[1], 'quantity', qty
    );
  end loop;

  delivery := case when subtotal >= 2500 then 0 else 149 end;
  if promo = 'WELCOME10' then
    discount := round(subtotal * 0.10);
  else
    promo := '';
  end if;

  pay_label := case pay_method
    when 'cod' then 'Cash on Delivery'
    when 'jazzcash' then 'JazzCash'
    when 'easypaisa' then 'Easypaisa'
    when 'bank' then 'Bank Transfer'
  end;
  if pay_label is null then
    raise exception 'Unknown payment method.';
  end if;
  if not coalesce((select (value -> pay_method ->> 'enabled')::boolean from public.store_settings where key = 'payment'), true) then
    raise exception '% is not available right now. Please choose another payment method.', pay_label;
  end if;
  if pay_method = 'cod' then
    pay := jsonb_build_object('method', 'cod');
  else
    if length(coalesce(p_order -> 'payment' ->> 'transactionId', '')) < 4
       or coalesce(p_order -> 'payment' ->> 'proof', '') = '' then
      raise exception 'Please add your transaction ID and payment screenshot.';
    end if;
    pay := jsonb_build_object(
      'method', pay_method,
      'transactionId', left(p_order -> 'payment' ->> 'transactionId', 64),
      'proof', left(p_order -> 'payment' ->> 'proof', 300),
      'submittedAt', now()
    );
  end if;

  loop
    new_id := 'AF-' || (floor(random() * 900000) + 100000)::integer::text;
    exit when not exists (select 1 from public.orders where id = new_id);
  end loop;

  insert into public.orders (id, user_id, items, totals, delivery, payment_method, payment_status, payment, estimated_delivery)
  values (
    new_id,
    auth.uid(),
    clean_items,
    jsonb_build_object(
      'count', (select sum((i ->> 'quantity')::integer) from jsonb_array_elements(clean_items) i),
      'subtotal', subtotal, 'discount', discount, 'delivery', delivery,
      'total', greatest(0, subtotal + delivery - discount),
      'promoValid', promo <> '', 'promoCode', promo
    ),
    d,
    pay_label,
    case when pay_method = 'cod' then 'Pending (COD)' else 'Pending verification' end,
    pay,
    p_order ->> 'estimatedDelivery'
  )
  returning * into result;

  return result;
end;
$$;

grant execute on function public.place_order(jsonb) to anon, authenticated;

-- Default delivery zone (admins can change it in Admin → Settings).
insert into public.store_settings (key, value)
values ('delivery', '{"lat": 24.9216, "lng": 67.0943, "radiusKm": 15}'::jsonb)
on conflict (key) do nothing;

commit;

-- Check: should list your accounts.
select email, name, phone, phone_verified, role from public.profiles order by created_at;
