-- AquaFizz: put the Bravo Juice photos (public/images/products/bravo-*.jpg) first on each size.
-- Photos uploaded earlier from the admin panel are kept after it. Safe to re-run.
-- Run in Supabase → SQL Editor (project xrgcryiyqgavojrfugqh) after the site is deployed.

begin;

with pics(slug, path) as (
  values
    ('bravo-tetra', '/images/products/bravo-tetra-200ml.jpg'),
    ('bravo',   '/images/products/bravo-300ml.jpg'),
    ('bravo-2', '/images/products/bravo-500ml.jpg'),
    ('bravo-3', '/images/products/bravo-1000ml.jpg'),
    ('bravo-4', '/images/products/bravo-1500ml.jpg'),
    ('bravo-5', '/images/products/bravo-2000ml.jpg')
)
update public.products p
set images = array_prepend(pics.path, array_remove(coalesce(p.images, '{}'), pics.path)),
    updated_at = now()
from pics
where p.slug = pics.slug;

commit;

-- Check: each Bravo size should show its own photo first.
select name, size, images[1] as cover
from public.products
where brand ilike 'bravo%'
order by size;
