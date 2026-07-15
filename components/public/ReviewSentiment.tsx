import Image from "next/image";
import type { RatingDistribution } from "@/lib/types";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Review sentiment strip for product cards: a segmented positive / neutral /
 * negative bar derived from the live star distribution, with a cluster of
 * reviewer avatars. Avatars are picked deterministically per product slug so
 * every card shows a different, stable trio of faces.
 */

const AVATAR_POOL = 18;

function avatarsFor(slug: string): string[] {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  const picks = new Set<number>();
  while (picks.size < 3) {
    picks.add((hash % AVATAR_POOL) + 1);
    hash = (hash * 2654435761 + 1) >>> 0;
  }
  return [...picks].map((n) => `/avatars/r${n}.jpg`);
}

export function sentimentSplit(distribution: RatingDistribution) {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  if (total === 0) return null;
  const positive = Math.round(((distribution[5] + distribution[4]) / total) * 100);
  const negative = Math.round(((distribution[1] + distribution[2]) / total) * 100);
  const neutral = Math.max(0, 100 - positive - negative);
  return { positive, neutral, negative, total };
}

export function ReviewSentiment({
  distribution,
  slug,
  className,
}: {
  distribution: RatingDistribution;
  slug: string;
  className?: string;
}) {
  const split = sentimentSplit(distribution);
  if (!split) return null;
  const avatars = avatarsFor(slug);

  const segments = [
    { key: "positive", label: "Positive", value: split.positive, bar: "bg-emerald-500" },
    { key: "neutral", label: "Neutral", value: split.neutral, bar: "bg-amber-400" },
    { key: "negative", label: "Negative", value: split.negative, bar: "bg-red-500" },
  ];

  return (
    <div className={cn("space-y-2.5", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.65rem] font-bold tracking-widest text-muted-foreground uppercase">
          Review sentiment
        </p>
        <div className="flex -space-x-2.5" aria-hidden="true">
          {avatars.map((src) => (
            <Image
              key={src}
              src={src}
              alt=""
              width={26}
              height={26}
              className="size-[26px] rounded-full border-2 border-card object-cover"
            />
          ))}
        </div>
      </div>

      <div className="flex h-2 w-full gap-1" role="img" aria-label={`${split.positive}% positive, ${split.neutral}% neutral, ${split.negative}% negative`}>
        {segments.map(({ key, value, bar }) => (
          <span
            key={key}
            className={cn("h-full rounded-full", bar)}
            style={{ width: `${Math.max(value, 2)}%` }}
          />
        ))}
      </div>

      <div className="flex items-baseline justify-between text-xs">
        {segments.map(({ key, label, value }) => (
          <span
            key={key}
            className={cn("flex flex-col gap-0.5", key === "neutral" && "items-center", key === "negative" && "items-end")}
          >
            <span className="text-muted-foreground">{label}</span>
            <span className="font-bold tabular-nums">{value}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function sentimentReviewLine(count: number): string {
  return `Based on ${formatNumber(count)} verified user reviews`;
}
