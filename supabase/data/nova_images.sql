-- AquaFizz: put the D-Nova Water photos (public/images/products/d-nova-water-*.jpg) first on each size.
-- Photos uploaded earlier from the admin panel are kept after it. Safe to re-run.
-- Run in Supabase → SQL Editor (project xrgcryiyqgavojrfugqh) after the site is deployed.

begin;

with pics(slug, path) as (
  values
    ('d-nova-water',   '/images/products/d-nova-water-500ml.jpg'),
    ('d-nova-water-2', '/images/products/d-nova-water-1500ml.jpg')
)
update public.products p
set images = array_prepend(pics.path, array_remove(coalesce(p.images, '{}'), pics.path)),
    updated_at = now()
from pics
where p.slug = pics.slug;

commit;

select name, size, images[1] as cover
from public.products
where name ilike '%nova%'
order by size;
