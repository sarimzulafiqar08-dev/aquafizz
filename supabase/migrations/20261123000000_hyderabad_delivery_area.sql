-- AquaFizz: deliver in Hyderabad only (the shop is in Hyderabad).
-- Customers choose one of Hyderabad's main areas and pin a location within 50 km of the shop.
-- Replaces the "anywhere in Sindh" rule from 20261024000000_sindh_delivery_area.sql.
-- Cash on Delivery only for orders up to Rs 10,000; bigger orders must be paid in advance.
-- Safe to re-run.
-- Keep in sync with src/lib/hyderabad.js (AREAS, SHOP_LOCATION, DELIVERY_RADIUS_KM).

begin;

-- Hyderabad's main areas plus nearby towns, as shown in the "Area" list at checkout, signup and profile.
create or replace function public.hyderabad_areas()
returns text[]
language sql
immutable
as $$
  select array['Latifabad', 'Qasimabad', 'Hirabad', 'Saddar', 'Cantonment', 'Hyderabad City (Old City)', 'Gari Khata', 'Paretabad', 'Hussainabad', 'Liaquat Colony', 'Citizen Colony', 'Wadhu Wah', 'Autobhan Road', 'GOR Colony', 'Hala Naka', 'Kohsar', 'Jamshoro', 'Kotri', 'Tando Muhammad Khan', 'Tando Allahyar']::text[];
$$;

-- True when (lat, lng) is within 50 km of the shop in Saddar, Hyderabad (25.385, 68.36).
create or replace function public.in_delivery_area(p_lat double precision, p_lng double precision)
returns boolean
language sql
immutable
as $$
  select p_lat is not null and p_lng is not null and
    2 * 6371 * asin(sqrt(
      power(sin(radians(p_lat - 25.385) / 2), 2) +
      cos(radians(25.385)) * cos(radians(p_lat)) * power(sin(radians(p_lng - 68.36) / 2), 2)
    )) <= 50;
$$;

-- Orders: same checks as before, but the area must be a Hyderabad area and the pin inside the zone.
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
  if coalesce(trim(d ->> 'address'), '') = '' then
    raise exception 'Please enter your address.';
  end if;
  if not (coalesce(d ->> 'area', '') = any (public.hyderabad_areas())) then
    raise exception 'Please choose your area in Hyderabad.';
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
  if not public.in_delivery_area(v_lat, v_lng) then
    raise exception 'Sorry, your location is outside our Hyderabad delivery area.';
  end if;
  d := d || jsonb_build_object('name', v_name, 'phone', v_phone, 'city', 'Hyderabad', 'location', jsonb_build_object('lat', v_lat, 'lng', v_lng));

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
  -- Keep the limit in sync with COD_MAX_TOTAL in src/lib/constants.js.
  if pay_method = 'cod' and greatest(0, subtotal + delivery - discount) > 10000 then
    raise exception 'Cash on Delivery is available for orders up to Rs 10,000. Please pay in advance with JazzCash, Easypaisa or bank transfer.';
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

-- New users: keep the chosen area only if it is a Hyderabad area.
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
  if v_area <> '' and not (v_area = any (public.hyderabad_areas())) then
    v_area := '';
  end if;
  insert into public.profiles (id, email, name, phone, cnic, area, address)
  values (new.id, coalesce(new.email, ''), v_name, v_phone, v_cnic, v_area, left(v_address, 300))
  on conflict (id) do nothing;
  return new;
end;
$$;


commit;

-- Check: Saddar, Latifabad, Qasimabad, Kotri, Tando Allahyar → true; Karachi → false.
select
  public.in_delivery_area(25.385, 68.370) as saddar,
  public.in_delivery_area(25.3633, 68.378) as latifabad,
  public.in_delivery_area(25.3925, 68.326) as qasimabad,
  public.in_delivery_area(25.3700, 68.310) as kotri,
  public.in_delivery_area(24.8607, 67.0011) as karachi,
  public.in_delivery_area(25.4600, 68.7200) as tando_allahyar;
