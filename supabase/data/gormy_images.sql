-- AquaFizz: put the Gormy Cola photos (public/images/products/gormy-cola-*.jpg) first on each size.
-- Photos uploaded earlier from the admin panel are kept after it. Safe to re-run.
-- The Ten Pack has no new photo yet and is left alone.
-- Run in Supabase → SQL Editor (project xrgcryiyqgavojrfugqh) after the site is deployed.

begin;

with pics(slug, path) as (
  values
    ('gormy-cola-5', '/images/products/gormy-cola-300ml.jpg'),
    ('gormy-cola',   '/images/products/gormy-cola-500ml.jpg'),
    ('gormy-cola-2', '/images/products/gormy-cola-1l.jpg'),
    ('gormy-cola-3', '/images/products/gormy-cola-1500ml.jpg'),
    ('gormy-cola-4', '/images/products/gormy-cola-2500ml.jpg')
)
update public.products p
set images = array_prepend(pics.path, array_remove(coalesce(p.images, '{}'), pics.path)),
    updated_at = now()
from pics
where p.slug = pics.slug;

commit;

-- Check: each Gormy Cola size should show its own photo first.
select name, size, images[1] as cover
from public.products
where brand ilike 'gormy%'
order by size;
