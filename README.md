# EAGLE-J MARKET — Final GitHub/Supabase Edition

A global marketplace: **Find It • Promote It • Sell It**.

## Included
- Customer registration/login/profile
- Business owner registration and dashboard
- Business approval workflow
- Products and deals
- Search, categories, business pages
- WhatsApp, phone and Google Maps links
- Favorites and reviews data model
- Admin dashboard for users, businesses and payment requests
- Free/Starter/Business/VIP plan request flow
- Supabase RLS database schema
- GitHub Pages flat-file deployment

## Supabase setup
1. Open Supabase SQL Editor.
2. Run `schema.sql` once.
3. If this is a fresh project, run `admin-bootstrap.sql` after creating your first account and replace the placeholder email with your admin email.
4. Authentication → URL Configuration: set Site URL to your GitHub Pages URL, e.g. `https://eagle-jconnect.github.io/eagle-j-market/`.
5. If email confirmation is enabled, users must confirm before login.

## GitHub setup
Upload all files to the root of the `eagle-j-market` repository. GitHub Pages should use branch `main` and folder `/ (root)`.

## Security
`config.js` contains only the public Publishable key. Never put a `sb_secret_...`, service-role, database password or other privileged credential in GitHub.

## Payments
The included plan buttons create a payment request record. A real Stripe/PayPal checkout requires provider credentials and a secure backend/webhook; do not put those secret credentials in GitHub Pages.


## Global Market Phase 1
- The language selector now works reversibly across static and dynamically rendered UI.
- English, Français and Kreyòl preferences persist in local storage.
- Presence status is displayed globally and updates through Supabase Realtime.
- Business location supports country, region/state, city, area/neighborhood, postal code and Remote/Online.
- Businesses search supports global location filters.
- `global-market-phase1.sql` is provided for existing Supabase databases.
- No fake country is assigned to existing listings.
