# Stack Match — connecting the database (Phase 2 runbook)

The site runs in preview mode with SA placeholder data until Supabase is
configured. Follow these steps once and the whole platform goes live: real
reads, review submission, newsletter double opt in, contact storage,
affiliate click logging and the admin panel.

## 1. Create the Supabase project

1. Create a project at supabase.com (region close to South Africa if offered).
2. In Authentication settings, turn OFF public sign ups. This platform uses a
   single admin model: any authenticated user is the admin.
3. In Authentication, add exactly one user (your admin email and password).

## 2. Environment

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=        project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   anon public key
SUPABASE_SERVICE_ROLE_KEY=       service role key, server only
NEXT_PUBLIC_SITE_URL=            your deployed URL
RESEND_API_KEY=                  optional, for the newsletter confirm email
```

Never expose the service role key with a NEXT_PUBLIC_ prefix.

## 3. Database setup

The quick way: paste `supabase/setup_complete.sql` into the Supabase SQL
editor and run it once. It contains the entire schema, triggers, RLS, storage
buckets, the admin allowlist and the base seeds, and it is idempotent.

The incremental alternative: run the files in `supabase/migrations/` in order
(001 through 007), or `supabase db push` with the CLI.

Create the admin account after the SQL has run:

```
npm run create-admin -- zaidumar422cg@gmail.com "YourStrongPassword"
```

Every file is idempotent, so rerunning is safe. 001 creates the schema,
triggers, RLS and storage buckets and seeds the categories and site settings
with the South African values.

## 4. Seed the SA roster

```
npm run seed
```

This upserts the 19 product SA roster with rand pricing, the reviewer pool,
articles, comparisons, alternatives and legal pages. It is idempotent and it
never writes aggregate ratings; the `update_software_ratings()` trigger
derives those from the seeded reviews. Reviewer names carry a "(Demo)" suffix
so you can tell seed content from real submissions. Set `SEED_NO_DEMO_SUFFIX=1`
before running if you prefer clean names.

## 5. Verify end to end

1. `npm run dev`, open the home page: counts now come from the database.
2. Sign in at `/admin/login`. Create a product, publish it, and confirm it
   appears on `/software`.
3. Submit a review through the public form on any product page, then check
   the product rating changed (the trigger recomputed it).
4. Click "Visit website" on any product and confirm a row lands in
   `affiliate_clicks` with a hashed IP (visible under Admin, Analytics).
5. Subscribe on the newsletter form. Without a RESEND_API_KEY the confirm
   link is printed in the server console; open it and confirm the subscriber
   flips to confirmed under Admin, Newsletter.

## 6. What lives where

- `supabase/migrations/` — schema, triggers, RLS, storage, base seeds
- `scripts/seed.ts` — SA content seed (idempotent)
- `lib/supabase/admin.ts` — service role client, server only
- `app/(admin)/admin` — login plus the panel (dashboard, software, reviews,
  categories, articles, comparisons, pages, newsletter, contact, analytics,
  settings)
- `app/api/track-click` — affiliate redirect and click logging
- `app/api/newsletter/confirm` — double opt in confirmation
