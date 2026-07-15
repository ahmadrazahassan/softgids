"use client";

import { DonutChart, type DonutDatum } from "@/components/public/DonutChart";
import type { Review } from "@/lib/types";

const SIZE_ORDER = [
  "1–10 employees",
  "11–50 employees",
  "51–200 employees",
  "201–500 employees",
  "500+ employees",
];

/** Donut of reviewer company sizes — "who actually uses this product". */
export function CompanySizeChart({ reviews }: { reviews: Review[] }) {
  const counts = new Map<string, number>();
  for (const review of reviews) {
    if (!review.reviewer_company_size) continue;
    counts.set(
      review.reviewer_company_size,
      (counts.get(review.reviewer_company_size) ?? 0) + 1
    );
  }

  const data: DonutDatum[] = SIZE_ORDER.filter((size) => counts.has(size)).map((size) => ({
    name: size,
    value: counts.get(size)!,
  }));

  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Not enough review data yet to chart company sizes.
      </p>
    );
  }

  return <DonutChart data={data} centerLabel="reviewers" size={200} />;
}
