-- AquaFizz: put the Pepsi photos (public/images/products/pepsi-*.jpg) first on each size.
-- Photos uploaded earlier from the admin panel are kept after it. Safe to re-run.
-- Run in Supabase → SQL Editor (project xrgcryiyqgavojrfugqh) after the site is deployed.

begin;

with pics(slug, path) as (
  values
    ('pepsi-345ml',  '/images/products/pepsi-345ml.jpg'),
    ('pepsi-500ml',  '/images/products/pepsi-500ml.jpg'),
    ('pepsi-1l',     '/images/products/pepsi-1l.jpg'),
    ('pepsi-1500ml', '/images/products/pepsi-1500ml.jpg'),
    ('pepsi-2500ml', '/images/products/pepsi-2500ml.jpg'),
    ('pepsi-tenpack',      '/images/products/pepsi-tenpack.jpg'),
    ('pepsi-tenpack-diet', '/images/products/pepsi-tenpack-diet.jpg')
)
update public.products p
set images = array_prepend(pics.path, array_remove(coalesce(p.images, '{}'), pics.path)),
    updated_at = now()
from pics
where p.slug = pics.slug;

commit;

-- Check: each Pepsi size should show its .jpg first.
select name, size, images[1] as cover, cardinality(images) as image_count
from public.products
where brand ilike 'pepsi'
order by size;
