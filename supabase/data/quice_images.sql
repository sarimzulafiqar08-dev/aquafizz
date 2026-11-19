-- AquaFizz: put the Quice photos (public/images/products/quice-*.jpg) first on each product.
-- Photos uploaded earlier from the admin panel are kept after it. Safe to re-run.
-- Run in Supabase → SQL Editor (project xrgcryiyqgavojrfugqh) after the site is deployed.

begin;

with pics(slug, path) as (
  values
    ('quice-lichi',  '/images/products/quice-lichi-1500ml.jpg'),
    ('quice-apple',  '/images/products/quice-apple-1500ml.jpg'),
    ('quice-anar',   '/images/products/quice-anar-1500ml.jpg'),
    ('quice-cola',   '/images/products/quice-cola-1l.jpg'),
    ('quice-cola-2', '/images/products/quice-cola-1500ml.jpg')
)
update public.products p
set images = array_prepend(pics.path, array_remove(coalesce(p.images, '{}'), pics.path)),
    updated_at = now()
from pics
where p.slug = pics.slug;

commit;

-- Check: each Quice product should show its own photo first.
select name, size, images[1] as cover
from public.products
where brand ilike 'quice'
order by name, size;
