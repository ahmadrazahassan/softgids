/**
 * Stack Match (South Africa) — wave two review corpus push.
 *
 *   npx tsx scripts/seed-wave2-reviews.ts
 *
 * Generates 150 to 220 unique, human voiced South African reviews for each
 * wave two product from the content banks in wave2-review-content.ts and
 * upserts them into Supabase via the shared engine. Each product carries its
 * own star distribution. Deterministic and idempotent.
 */

import { runReviewSeed } from "./review-generator";
import { WAVE2_BANKS } from "./wave2-review-content";

runReviewSeed({
  banks: WAVE2_BANKS,
  idNamespace: "w2-review",
  seedPrefix: "w2-reviews:v1",
  rosterHint: 'Run "npx tsx scripts/seed-wave2.ts" first to push the wave two roster.',
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
