-- AquaFizz e-commerce schema.
-- Run once in Supabase → SQL Editor (or `supabase db push`), then run supabase/seed.sql.

-- ── Roles / profiles ────────────────────────────────────────────────────────
create type public.app_role as enum ('user', 'admin');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '',
  name text not null default '',
  phone text not null default '',
  address text not null default '',
  area text not null default '',
  role public.app_role not null default 'user',
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Create a profile row for every new auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, phone)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users may edit their profile but never their own role or email.
-- (auth.uid() is null in the SQL editor, so you can promote the first admin there.)
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
  end if;
  if old.role = 'admin' and new.role <> 'admin'
     and (select count(*) from public.profiles where role = 'admin') <= 1 then
    raise exception 'At least one admin is required.';
  end if;
  return new;
end;
$$;

create trigger profiles_protect
  before update on public.profiles
  for each row execute function public.protect_profile();

-- ── Products ────────────────────────────────────────────────────────────────
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  brand text not null default '',
  size text not null default '',
  description text not null default '',
  price numeric(10, 2) not null check (price > 0),
  stock integer not null default 0 check (stock >= 0),
  images text[] not null default '{}',
  category text not null check (category in ('cold-drinks', 'mineral-water', 'fresh-juices', 'deal-boxes')),
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index products_category_idx on public.products (category);

-- ── Store settings (payment accounts shown at checkout, etc.) ──────────────
create table public.store_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ── Orders ──────────────────────────────────────────────────────────────────
create table public.orders (
  id text primary key, -- e.g. AF-123456
  user_id uuid references auth.users (id) on delete set null,
  items jsonb not null,
  totals jsonb not null,
  delivery jsonb not null,
  payment_method text not null,
  payment_status text not null,
  payment jsonb not null default '{}'::jsonb, -- { method, transactionId, proof, submittedAt, reviewNote, reviewedAt }
  status text not null default 'Placed'
    check (status in ('Placed', 'Confirmed', 'Out for delivery', 'Delivered', 'Cancelled')),
  estimated_delivery text,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index orders_user_idx on public.orders (user_id);

-- Places an order atomically: checks + decrements stock and recomputes totals
-- from database prices, so the browser can't tamper with them.
-- Keep DELIVERY_FEE / FREE_DELIVERY_MIN / PROMO_CODES in sync with src/lib/constants.js.
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
begin
  if jsonb_array_length(coalesce(p_order -> 'items', '[]'::jsonb)) = 0 then
    raise exception 'Your cart is empty.';
  end if;

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

  -- Payment: the database decides the label and status; customers can't mark themselves paid.
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
    coalesce(p_order -> 'delivery', '{}'::jsonb),
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

-- Admin-only: remove a user account (auth.users cascades to profiles).
create or replace function public.admin_delete_user(target uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can delete users.';
  end if;
  if exists (select 1 from public.profiles where id = target and role = 'admin') then
    raise exception 'Demote this admin before deleting the account.';
  end if;
  delete from auth.users where id = target;
end;
$$;

grant execute on function public.admin_delete_user(uuid) to authenticated;

-- ── Wishlist ────────────────────────────────────────────────────────────────
create table public.wishlist_items (
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- ── Row level security ──────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.store_settings enable row level security;

create policy "profiles: read own or admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles: update own or admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin());

create policy "products: public read" on public.products
  for select using (true);
create policy "products: admin insert" on public.products
  for insert with check (public.is_admin());
create policy "products: admin update" on public.products
  for update using (public.is_admin());
create policy "products: admin delete" on public.products
  for delete using (public.is_admin());

-- Orders are created only through place_order().
create policy "orders: read own or admin" on public.orders
  for select using (user_id = auth.uid() or public.is_admin());
create policy "orders: admin update" on public.orders
  for update using (public.is_admin());

-- Payment account details are meant to be seen by paying customers.
create policy "settings: public read" on public.store_settings
  for select using (true);
create policy "settings: admin insert" on public.store_settings
  for insert with check (public.is_admin());
create policy "settings: admin update" on public.store_settings
  for update using (public.is_admin());

create policy "wishlist: own rows" on public.wishlist_items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Product images bucket ───────────────────────────────────────────────────
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product images: public read" on storage.objects
  for select using (bucket_id = 'product-images');
create policy "product images: admin insert" on storage.objects
  for insert with check (bucket_id = 'product-images' and public.is_admin());
create policy "product images: admin update" on storage.objects
  for update using (bucket_id = 'product-images' and public.is_admin());
create policy "product images: admin delete" on storage.objects
  for delete using (bucket_id = 'product-images' and public.is_admin());

-- ── Payment proof screenshots (private) ─────────────────────────────────────
-- Anyone checking out can upload one image; only admins can view them (via signed URLs).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "payment proofs: anyone uploads" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'payment-proofs');
create policy "payment proofs: admin read" on storage.objects
  for select using (bucket_id = 'payment-proofs' and public.is_admin());
create policy "payment proofs: admin delete" on storage.objects
  for delete using (bucket_id = 'payment-proofs' and public.is_admin());

-- After signing up on the site, make yourself admin (run in SQL Editor):
--   update public.profiles set role = 'admin' where email = 'you@example.com';
