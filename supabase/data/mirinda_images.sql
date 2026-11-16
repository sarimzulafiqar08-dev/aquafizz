-- AquaFizz: Mirinda product photos (public/images/products/mirinda-*.jpg). Safe to re-run.
-- Run in Supabase → SQL Editor (project xrgcryiyqgavojrfugqh) after the site is deployed.

begin;

with pics(slug, path) as (
  values
    ('mirinda-1',   '/images/products/mirinda-345ml.jpg'),
    ('mirinda-2', '/images/products/mirinda-500ml.jpg'),
    ('mirinda-3', '/images/products/mirinda-1l.jpg'),
    ('mirinda-4', '/images/products/mirinda-1500ml.jpg'),
    ('mirinda-5', '/images/products/mirinda-2500ml.jpg')
)
update public.products p
set images = array_prepend(pics.path, array_remove(coalesce(p.images, '{}'), pics.path)),
    updated_at = now()
from pics
where p.slug = pics.slug;

commit;

-- Check: each Mirinda size should show its own photo first.
select name, size, images[1] as cover
from public.products
where brand ilike 'mirinda'
order by size;
