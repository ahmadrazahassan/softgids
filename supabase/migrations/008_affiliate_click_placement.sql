-- ---------------------------------------------------------------------------
-- 008 — affiliate click placement
--
-- Records WHICH button or banner was clicked, not just which product. The
-- value is the same placement ID sent to Impact as subId1 (see lib/affiliate.ts
-- placementId), e.g. "software-hero-sage-accounting" or
-- "software-billboard-sage-accounting", so first-party numbers can be lined up
-- against the network's own sub-ID report.
--
-- Nullable on purpose: rows written before this migration have no placement,
-- and a plain (unmonetised) vendor click has no placement to record.
-- ---------------------------------------------------------------------------

alter table affiliate_clicks
  add column if not exists placement text;

create index if not exists affiliate_clicks_placement_idx
  on affiliate_clicks (placement, clicked_at desc);
