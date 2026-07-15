/**
 * Stack Match (South Africa) — expansion roster review corpus push.
 *
 *   npx tsx scripts/seed-expansion-reviews.ts
 *
 * Generates 150 to 220 unique, human voiced reviews for each expansion
 * product from the content banks in expansion-review-content.ts and upserts
 * them into Supabase via the shared engine. Each product carries its own
 * star distribution. Deterministic and idempotent.
 */

import { runReviewSeed } from "./review-generator";
import { EXPANSION_BANKS } from "./expansion-review-content";

runReviewSeed({
  banks: EXPANSION_BANKS,
  idNamespace: "exp-review",
  seedPrefix: "exp-reviews:v1",
  rosterHint: 'Run "npx tsx scripts/seed-expansion.ts" first to push the expansion roster.',
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
