# AquaFizz – Drinks On Demand

Mobile-first React storefront for beverage delivery.

## Stack

- React + Vite
- Tailwind CSS
- React Router
- Lucide React
- PWA via `vite-plugin-pwa`

## Scripts

```bash
npm install
npm run dev
npm run build
```

## Supabase

Without keys the app runs in demo mode (browser storage, demo admin `admin@aquafizz.pk` / `Admin@123`).

To connect Supabase:

1. Create a project at https://supabase.com, then open **Project Settings → API**.
2. Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (the public anon key, never the service-role key).
3. In **SQL Editor**, run `supabase/migrations/20261019000000_ecommerce.sql`, then `supabase/seed.sql` (starter products; regenerate with `npm run db:seed-sql`).
4. In **Authentication → URL Configuration**, add your site URL (e.g. `http://localhost:5173`) and `<site>/reset-password` to the redirect URLs.
5. Sign up on the site, then promote yourself in SQL Editor:
   `update public.profiles set role = 'admin' where email = 'you@example.com';`
6. Restart `npm run dev`.
