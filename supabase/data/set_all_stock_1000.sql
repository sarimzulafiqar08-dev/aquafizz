-- AquaFizz: set the stock of EVERY product (drinks, water, juices and deal boxes) to 1000.
-- Run in Supabase → SQL Editor (project xrgcryiyqgavojrfugqh). Safe to re-run.

begin;

update public.products
set stock = 1000,
    updated_at = now();

commit;

-- Check: every product should now show 1000.
select count(*) as products, min(stock) as lowest_stock, max(stock) as highest_stock
from public.products;
