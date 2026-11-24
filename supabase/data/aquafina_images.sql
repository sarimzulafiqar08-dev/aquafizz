-- AquaFizz: put the Aquafina photos (public/images/products/aquafina-*.jpg) first on each size.
-- Photos uploaded earlier from the admin panel are kept after it. Safe to re-run.
-- Run in Supabase → SQL Editor (project xrgcryiyqgavojrfugqh) after the site is deployed.

begin;

with pics(slug, path) as (
  values
    ('aquafina-2', '/images/products/aquafina-340ml.jpg'),
    ('aquafina',   '/images/products/aquafina-1500ml.jpg'),
    ('aquafina-3', '/images/products/aquafina-5l.jpg'),
    ('aquafina-4', '/images/products/aquafina-15l.jpg')
)
update public.products p
set images = array_prepend(pics.path, array_remove(coalesce(p.images, '{}'), pics.path)),
    updated_at = now()
from pics
where p.slug = pics.slug;

commit;

select name, size, images[1] as cover
from public.products
where brand ilike 'aquafina'
order by size;
