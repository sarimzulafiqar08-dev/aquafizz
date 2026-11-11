-- AquaFizz: deliver anywhere in Sindh (replaces the 15 km radius) and require a Sindh district.
-- Run once in Supabase → SQL Editor (after 20261022000000_validation_otp_map.sql). Safe to re-run.
-- Boundary: geoBoundaries gbHumanitarian PAK ADM1 (WFP SDI / HDX 2022, CC BY 3.0 IGO), simplified.
-- Keep in sync with src/lib/sindh.js.

begin;

-- The 30 districts of Sindh, as shown in the checkout "District" list.
create or replace function public.sindh_districts()
returns text[]
language sql
immutable
as $$
  select array['Karachi Central', 'Karachi East', 'Karachi South', 'Karachi West', 'Keamari', 'Korangi', 'Malir', 'Badin', 'Dadu', 'Ghotki', 'Hyderabad', 'Jacobabad', 'Jamshoro', 'Kambar Shahdadkot', 'Kashmore', 'Khairpur', 'Larkana', 'Matiari', 'Mirpurkhas', 'Naushahro Feroze', 'Sanghar', 'Shaheed Benazirabad', 'Shikarpur', 'Sujawal', 'Sukkur', 'Tando Allahyar', 'Tando Muhammad Khan', 'Tharparkar', 'Thatta', 'Umerkot']::text[];
$$;

-- True when (lat, lng) is inside Sindh's outer boundary (ray casting).
create or replace function public.in_sindh(p_lat double precision, p_lng double precision)
returns boolean
language plpgsql
immutable
as $$
declare
  ring double precision[] := '{66.703,24.8927,66.722,24.8918,66.7118,24.8801,66.6843,24.8757,66.6596,24.8508,66.6514,24.8294,66.6575,24.825,66.6833,24.8214,66.7514,24.8436,66.8191,24.8344,66.8346,24.8496,66.862,24.8569,66.9199,24.8308,66.9792,24.7918,66.9578,24.8259,66.9122,24.8447,66.919,24.855,66.9538,24.861,66.9691,24.8509,66.9784,24.8585,66.9831,24.8547,66.9654,24.8414,66.9627,24.825,66.9736,24.8306,66.9758,24.8108,66.9923,24.8167,67.0217,24.8083,67.0567,24.7755,67.0931,24.7569,67.101,24.7645,67.0899,24.7742,67.0907,24.7921,67.1023,24.7781,67.1049,24.7976,67.1224,24.7788,67.1547,24.7937,67.174,24.781,67.2199,24.8141,67.245,24.7941,67.2456,24.7849,67.2746,24.7903,67.3296,24.7712,67.3755,24.7834,67.4237,24.7731,67.4439,24.7819,67.4637,24.7775,67.4597,24.7694,67.4681,24.7538,67.4528,24.7761,67.4266,24.769,67.3744,24.776,67.3493,24.7629,67.3515,24.7423,67.3714,24.7242,67.3852,24.7234,67.3932,24.7046,67.4325,24.6982,67.4344,24.6857,67.4203,24.6727,67.4416,24.648,67.4523,24.6596,67.4532,24.6538,67.4405,24.6404,67.4143,24.6494,67.4069,24.6358,67.3837,24.6377,67.371,24.6081,67.3498,24.6072,67.3368,24.5888,67.3231,24.5906,67.3202,24.5757,67.299,24.5815,67.3152,24.5589,67.304,24.5533,67.3233,24.5491,67.3521,24.5551,67.4071,24.5894,67.4396,24.5746,67.4136,24.5857,67.3807,24.571,67.3571,24.5504,67.3684,24.536,67.3739,24.5449,67.3987,24.5468,67.3975,24.5246,67.3702,24.5304,67.3523,24.4797,67.3396,24.4728,67.3282,24.4852,67.3258,24.4653,67.3094,24.4589,67.3424,24.4591,67.3743,24.4721,67.3887,24.4893,67.4022,24.493,67.3919,24.5161,67.412,24.5215,67.4039,24.5065,67.4177,24.4758,67.4213,24.4707,67.436,24.4797,67.4407,24.4655,67.454,24.4622,67.4218,24.4645,67.4078,24.484,67.395,24.4834,67.3604,24.4608,67.3834,24.4544,67.3707,24.4367,67.3882,24.4423,67.3902,24.4501,67.3984,24.4395,67.4345,24.4423,67.4727,24.4269,67.4169,24.4367,67.3735,24.4063,67.3491,24.4005,67.3506,24.3897,67.3605,24.3877,67.3756,24.3978,67.4063,24.3944,67.4158,24.4014,67.4175,24.3915,67.4278,24.3918,67.4283,24.3609,67.4229,24.3603,67.4177,24.3865,67.3874,24.3928,67.369,24.3857,67.362,24.3727,67.3665,24.351,67.4034,24.3288,67.4259,24.3341,67.4246,24.3272,67.4344,24.3227,67.4566,24.3422,67.4757,24.3257,67.4872,24.3263,67.5124,24.3526,67.5291,24.3345,67.5251,24.3298,67.5146,24.3424,67.4906,24.3218,67.449,24.3322,67.4421,24.3161,67.4201,24.3193,67.4109,24.3113,67.3737,24.3358,67.3466,24.3428,67.3386,24.3323,67.3596,24.2906,67.3431,24.3041,67.3299,24.3339,67.3164,24.3297,67.3218,24.3199,67.3018,24.3121,67.2954,24.301,67.3063,24.3018,67.2999,24.2855,67.3259,24.2449,67.3585,24.2837,67.379,24.2777,67.3934,24.2874,67.3981,24.2827,67.3814,24.2732,67.3613,24.2757,67.3501,24.2542,67.4143,24.234,67.4212,24.2167,67.4317,24.2472,67.4281,24.2125,67.4168,24.2109,67.4125,24.2296,67.3625,24.2386,67.3612,24.2314,67.342,24.2352,67.3371,24.2265,67.3457,24.2161,67.3363,24.2164,67.3344,24.2088,67.3545,24.1828,67.3347,24.1763,67.3453,24.1558,67.3828,24.1326,67.4245,24.1302,67.4118,24.1233,67.3626,24.1324,67.371,24.0874,67.395,24.0662,67.378,24.0657,67.3921,24.0478,67.4014,24.0464,67.4088,24.084,67.4431,24.1202,67.4489,24.1168,67.4184,24.0883,67.438,24.0636,67.4243,24.0586,67.4092,24.0392,67.4218,24.0024,67.4083,24.0,67.4365,23.9907,67.4212,23.961,67.4225,23.9449,67.4864,23.9741,67.5008,23.9698,67.5015,23.9625,67.4661,23.9454,67.4855,23.9374,67.491,23.9139,67.48,23.907,67.4661,23.9215,67.4655,23.9066,67.4936,23.9,67.5335,23.8746,67.5355,23.893,67.5546,23.877,67.5488,23.8734,67.5651,23.8683,67.5726,23.8696,67.5762,23.889,67.5834,23.8394,67.5979,23.8381,67.6011,23.8492,67.6254,23.8429,67.6327,23.8337,67.6269,23.8088,67.652,23.7945,67.6769,23.797,67.6851,23.8052,67.707,23.7984,67.7502,23.8015,67.7173,23.8367,67.709,23.8562,67.735,23.8378,67.7907,23.8164,67.8274,23.8136,67.836,23.8246,67.8456,23.9092,67.8636,23.9463,67.8939,23.9751,67.9027,23.9647,67.873,23.9295,67.8653,23.9016,67.872,23.8587,67.9243,23.8296,67.9298,23.829,67.9202,23.8517,67.952,23.8121,67.9702,23.8114,67.9963,23.7867,68.0446,23.7949,68.0422,23.8302,68.0277,23.8693,68.0298,23.9032,68.042,23.9119,68.0553,23.903,68.0471,23.8814,68.053,23.8538,68.076,23.8332,68.1044,23.8432,68.1035,23.8555,68.1421,23.8397,68.136,23.8695,68.1599,23.8547,68.1889,23.8501,68.1929,23.8715,68.1856,23.8863,68.2378,23.9002,68.2789,23.9386,68.3259,23.922,68.3349,23.9654,68.3742,23.9832,68.3849,23.9642,68.7492,23.962,68.7596,24.0358,68.7642,24.2843,68.7727,24.2941,68.8264,24.3084,68.8403,24.2282,68.8525,24.2057,68.8675,24.2062,68.8736,24.2143,68.8973,24.2769,68.9267,24.2939,68.939,24.2909,68.9706,24.2375,69.0005,24.2259,69.0929,24.2691,69.1998,24.2352,69.2749,24.2688,69.3103,24.2767,69.3619,24.2662,69.4316,24.2737,69.5042,24.263,69.5901,24.2868,69.7246,24.1751,69.9787,24.165,70.0241,24.1694,70.0593,24.1928,70.119,24.2907,70.2371,24.3173,70.3256,24.3474,70.3703,24.3535,70.5601,24.4186,70.5932,24.4117,70.5961,24.4003,70.5816,24.3683,70.5614,24.3584,70.5874,24.3101,70.5723,24.2936,70.5878,24.2854,70.5724,24.2649,70.5742,24.2523,70.5936,24.2403,70.6553,24.2251,70.7258,24.2209,70.8058,24.2227,70.8537,24.2474,70.8941,24.2571,70.9041,24.2651,70.8658,24.2843,70.8727,24.3049,70.9809,24.3634,71.0139,24.3524,71.0382,24.3561,71.0807,24.3914,71.1244,24.4094,71.1234,24.4206,71.1074,24.4332,71.0203,24.4333,71.0007,24.4489,70.9894,24.6032,71.0081,24.6357,71.065,24.6626,71.0793,24.6743,71.0861,24.6934,70.9556,24.9017,70.9179,24.9864,70.8812,25.1459,70.7525,25.2717,70.7372,25.3257,70.6659,25.396,70.6654,25.6063,70.6724,25.6715,70.6593,25.7015,70.64,25.7154,70.6048,25.7185,70.5265,25.6885,70.3746,25.6813,70.2754,25.7113,70.2425,25.7699,70.145,25.8685,70.0961,25.9443,70.0826,26.0739,70.1452,26.1662,70.1727,26.2451,70.1646,26.2909,70.1783,26.3498,70.176,26.4333,70.1839,26.4868,70.1677,26.5507,70.1389,26.5744,70.0662,26.5993,69.8793,26.5811,69.8154,26.5922,69.7719,26.6137,69.7219,26.6538,69.5154,26.7401,69.4875,26.7937,69.4855,26.8235,69.5132,27.0169,69.5781,27.1655,69.6659,27.2514,69.862,27.4028,69.9362,27.5021,70.0163,27.556,70.1078,27.7669,70.1805,27.8549,70.1236,27.882,70.0692,27.8954,70.0351,27.9271,70.0008,27.9374,69.8788,28.0802,69.8446,28.1343,69.8477,28.1526,69.8439,28.1698,69.8377,28.1697,69.8576,28.1971,69.8316,28.2411,69.8367,28.2688,69.8155,28.2772,69.8102,28.3025,69.8207,28.3396,69.8129,28.3619,69.7913,28.3687,69.7943,28.3799,69.7619,28.3847,69.7514,28.4029,69.7261,28.4216,69.6059,28.4395,69.6245,28.4675,69.5213,28.4845,69.4467,28.4778,69.431,28.4725,69.4165,28.4492,69.3941,28.4464,68.9295,28.4295,68.4671,28.4312,68.4052,28.3876,68.3534,28.2848,68.209,28.2425,68.0178,28.092,67.9644,28.0696,67.913,27.9943,67.8773,28.0002,67.8124,27.9855,67.7944,27.9762,67.7886,27.9516,67.7749,27.9433,67.5947,27.9221,67.5494,27.9015,67.5332,27.9068,67.42,27.8927,67.4091,27.908,67.3942,27.9097,67.3849,27.8649,67.3547,27.7959,67.3515,27.7492,67.3099,27.6989,67.2542,27.6585,67.2291,27.5749,67.1829,27.5323,67.1611,27.3545,67.1299,27.314,67.1269,27.27,67.1519,27.1559,67.1606,27.066,67.1389,26.9962,67.146,26.9564,67.1334,26.9404,67.1466,26.7684,67.1265,26.7383,67.1331,26.6632,67.1238,26.6531,67.1776,26.4715,67.2037,26.446,67.2656,26.347,67.3379,26.208,67.3595,26.15,67.3877,26.1361,67.4264,26.073,67.4053,25.9625,67.399,25.8828,67.4146,25.8282,67.411,25.8085,67.3371,25.7061,67.3161,25.6242,67.3,25.5918,67.257,25.5657,67.244,25.5234,67.2011,25.4996,67.1882,25.4748,67.1633,25.4525,67.1622,25.3954,67.1391,25.3573,67.1378,25.3152,67.1209,25.3,67.1102,25.2671,67.0897,25.2412,67.0355,25.2055,67.0083,25.1623,67.0078,25.1009,66.9231,25.0177,66.8574,25.0025,66.7841,24.9653,66.703,24.8927}';
  n integer := array_length(ring, 1) / 2;
  inside boolean := false;
  i integer;
  j integer := n;
  xi double precision; yi double precision;
  xj double precision; yj double precision;
begin
  if p_lat is null or p_lng is null then
    return false;
  end if;
  for i in 1..n loop
    xi := ring[2 * i - 1]; yi := ring[2 * i];
    xj := ring[2 * j - 1]; yj := ring[2 * j];
    if ((yi > p_lat) <> (yj > p_lat)) and (p_lng < (xj - xi) * (p_lat - yi) / (yj - yi) + xi) then
      inside := not inside;
    end if;
    j := i;
  end loop;
  return inside;
end;
$$;

-- Orders: same checks as before, but the pin must be inside Sindh and the district must be a Sindh district.
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
  if not (coalesce(d ->> 'area', '') = any (public.sindh_districts())) then
    raise exception 'Please choose your district in Sindh.';
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
  if not public.in_sindh(v_lat, v_lng) then
    raise exception 'Sorry, your location is outside Sindh. We only deliver within Sindh.';
  end if;
  d := d || jsonb_build_object('name', v_name, 'phone', v_phone, 'city', 'Sindh', 'location', jsonb_build_object('lat', v_lat, 'lng', v_lng));

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

-- The old radius setting is no longer used.
delete from public.store_settings where key = 'delivery';

commit;

-- Check: Karachi, Hyderabad, Sukkur → true; Hub, Rahim Yar Khan, Quetta → false.
select
  public.in_sindh(24.9216, 67.0943) as karachi,
  public.in_sindh(25.3960, 68.3578) as hyderabad,
  public.in_sindh(27.7052, 68.8574) as sukkur,
  public.in_sindh(25.0500, 66.8900) as hub,
  public.in_sindh(28.4202, 70.2952) as rahim_yar_khan,
  public.in_sindh(30.1798, 66.9750) as quetta;
