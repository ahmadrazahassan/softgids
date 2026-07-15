/**
 * Stack Match (South Africa) — QuickBooks review corpus push.
 *
 *   npx tsx scripts/seed-quickbooks-reviews.ts
 *
 * Generates 150 to 250 unique, human voiced South African reviews for every
 * QuickBooks program from the content banks in quickbooks-review-content.ts
 * and upserts them into Supabase via the shared engine. Each program carries
 * its own star distribution. Deterministic and idempotent.
 */

import { runReviewSeed } from "./review-generator";
import { QB_BANKS } from "./quickbooks-review-content";

runReviewSeed({
  banks: QB_BANKS,
  idNamespace: "qb-review",
  seedPrefix: "qb-reviews:v1",
  rosterHint: 'Run "npx tsx scripts/seed-quickbooks.ts" first to push the QuickBooks roster.',
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
