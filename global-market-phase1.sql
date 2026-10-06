-- EAGLE-J MARKET — GLOBAL MARKET PHASE 1 MIGRATION
-- Run this once in Supabase SQL Editor for an existing EAGLE-J MARKET database.

alter table public.businesses add column if not exists region text;
alter table public.businesses add column if not exists postal_code text;
alter table public.businesses add column if not exists is_remote boolean not null default false;

create index if not exists businesses_country_idx on public.businesses(country);
create index if not exists businesses_region_idx on public.businesses(region);
create index if not exists businesses_city_idx on public.businesses(city);
create index if not exists businesses_postal_code_idx on public.businesses(postal_code);
create index if not exists businesses_remote_idx on public.businesses(is_remote);

-- Existing listings are intentionally NOT assigned to a fake country.
-- Update country/city/region/area/postal_code only when the real values are known.
