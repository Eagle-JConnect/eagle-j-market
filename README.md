# 🦅 EAGLE-J MARKET V1

**Find It • Promote It • Sell It**

EAGLE-J MARKET is a mobile-first local marketplace starter project for Nassau, Bahamas.

## V1 includes

- Homepage
- Business discovery
- Categories
- Products
- Deals
- Customer registration/login
- Business owner registration
- Customer dashboard
- Business dashboard starter
- Admin dashboard starter
- Pricing page
- Supabase schema + RLS policies
- Demo data when Supabase is not configured

## 1. Upload to GitHub

Create a new repository, for example:

`eagle-j-market`

Upload the contents of this folder to the repository root.

The repository should have `index.html` in the root.

## 2. Configure Supabase

Open:

`config.js`

Replace:

`YOUR_SUPABASE_URL`

and

`YOUR_SUPABASE_ANON_KEY`

with the Supabase project URL and the public anon key.

Never place a `service_role` key in this project.

## 3. Create the database

In Supabase:

SQL Editor → New Query

Copy/paste:

`schema.sql`

Run it.

## 4. Authentication

Supabase → Authentication → Providers → Email

Enable Email according to your preferred confirmation settings.

For production, configure your Site URL and Redirect URLs to your real GitHub Pages/domain URL.

## 5. Storage

Create these private/public buckets according to your final security design:

- business-images
- product-images
- deal-images
- profile-images
- advertisement-images

Storage policies should be added before production uploads are enabled.

## 6. GitHub Pages

Repository → Settings → Pages

- Source: Deploy from a branch
- Branch: main
- Folder: / (root)

Save.

Your site will normally be available at:

`https://YOUR-USERNAME.github.io/eagle-j-market/`

## Important V1 limitations

Payments are NOT activated. Pricing is display-only until a payment provider is connected.

Admin page is a UI starter. Production admin authorization must be enforced by Supabase RLS/server-side checks.

Demo listings appear when Supabase is not configured.

## Recommended next build

1. Business creation form
2. Product/deal creation forms
3. Admin approval workflow
4. Storage upload policies
5. Favorites/reviews
6. Analytics
7. Payment provider
8. Advertising/boost system
9. Final mobile QA


## GitHub upload version
All project files are intentionally in the repository root for easier upload from GitHub/mobile. Do not recreate css/js/sql folders for this version.
