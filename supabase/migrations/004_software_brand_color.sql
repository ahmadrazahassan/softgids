-- ============================================================================
-- 004 — per product accent colour + integrations column. Idempotent.
-- The read layer probes for these columns (Postgres 42703) and degrades to
-- the base column set when this migration has not run yet.
-- ============================================================================

alter table software add column if not exists brand_color text;
alter table software add column if not exists integrations jsonb not null default '[]';
