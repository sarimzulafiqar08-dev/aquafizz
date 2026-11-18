-- AquaFizz: Sting product photos (public/images/products/sting-*.jpg). Safe to re-run.
-- Photos uploaded earlier from the admin panel are kept after it.
-- Run in Supabase → SQL Editor (project xrgcryiyqgavojrfugqh) after the site is deployed.
-- Add rows here as more Sting sizes get photos.

begin;

with pics(slug, path) as (
  values
    ('sting-red', '/images/products/sting-red-500ml.jpg')
)
update public.products p
set images = array_prepend(pics.path, array_remove(coalesce(p.images, '{}'), pics.path)),
    updated_at = now()
from pics
where p.slug = pics.slug;

commit;

select name, size, images[1] as cover
from public.products
where brand ilike 'sting'
order by name, size;
