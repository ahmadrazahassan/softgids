-- ============================================================================
-- 006 — South African product roster, reviews, articles and comparisons.
--
-- This step is implemented by the typed seed script rather than raw SQL so
-- the seed reuses the exact objects the frontend already renders (19 SA
-- products with real rand pricing, SA reviewer identities, SA articles).
--
--   npm run seed
--
-- The script upserts by slug with deterministic ids, so it is idempotent and
-- safe to run repeatedly. See scripts/seed.ts. Aggregate ratings are NOT
-- seeded; the update_software_ratings() trigger derives them from reviews.
-- ============================================================================

select 1;
