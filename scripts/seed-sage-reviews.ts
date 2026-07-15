/**
 * Stack Match (South Africa) — Sage review corpus push.
 *
 *   npx tsx scripts/seed-sage-reviews.ts
 *
 * Generates 220 to 300 unique, human voiced South African reviews for every
 * Sage program from the content banks in scripts/sage-review-content.ts and
 * upserts them into Supabase via the shared engine in review-generator.ts.
 * Deterministic and idempotent: reruns produce the exact same rows.
 */

import { runReviewSeed } from "./review-generator";
import { BANKS } from "./sage-review-content";

runReviewSeed({
  banks: BANKS,
  idNamespace: "sage-review",
  seedPrefix: "sage-reviews:v1",
  rosterHint: 'Run "npx tsx scripts/seed-sage.ts" first to push the Sage roster.',
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
