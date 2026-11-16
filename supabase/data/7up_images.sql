-- AquaFizz: put the new 7up photos (public/images/products/7up-*.jpg) first on each 7up product.
-- Any photo a product already had is kept after it. Safe to re-run.
-- Run in Supabase → SQL Editor (project xrgcryiyqgavojrfugqh) after the site is deployed.

begin;

with pics(slug, path) as (
  values
    ('7up',   '/images/products/7up-345ml.jpg'),
    ('7up-5', '/images/products/7up-500ml.jpg'),
    ('7up-2', '/images/products/7up-1l.jpg'),
    ('7up-3', '/images/products/7up-1500ml.jpg'),
    ('7up-4', '/images/products/7up-2500ml.jpg')
)
update public.products p
set images = array_prepend(pics.path, array_remove(coalesce(p.images, '{}'), pics.path)),
    updated_at = now()
from pics
where p.slug = pics.slug;

commit;

-- Check: each 7up size should show its own photo first.
select name, size, images[1] as cover
from public.products
where brand ilike '7up'
order by size;
