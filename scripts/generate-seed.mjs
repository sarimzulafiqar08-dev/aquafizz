// Builds supabase/seed.sql from src/lib/catalog.js:  npm run db:seed-sql
import { writeFileSync } from 'node:fs'
import { products } from '../src/lib/catalog.js'

const q = (v) => `'${String(v ?? '').replace(/'/g, "''")}'`
const arr = (list) => `array[${list.map(q).join(', ')}]::text[]`

const rows = products.map((p) => {
  const images = p.images?.length ? p.images : p.image ? [p.image] : []
  return `  (${[q(p.slug), q(p.name), q(p.brand), q(p.size), q(p.description), p.price, p.stock, arr(images), q(p.categorySlug), p.featured ? 'true' : 'false'].join(', ')})`
})

const sql = `-- Starter catalog. Generated from src/lib/catalog.js by scripts/generate-seed.mjs.
-- Safe to re-run: existing slugs are left untouched.
insert into public.products (slug, name, brand, size, description, price, stock, images, category, featured)
values
${rows.join(',\n')}
on conflict (slug) do nothing;
`
writeFileSync(new URL('../supabase/seed.sql', import.meta.url), sql)
console.log(`Wrote supabase/seed.sql with ${rows.length} products`)
