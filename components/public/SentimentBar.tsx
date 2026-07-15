import { formatNumber } from "@/lib/format";
import type { RatingDistribution } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Positive / neutral / negative sentiment split derived from star counts. */
export function SentimentBar({
  distribution,
  className,
}: {
  distribution: RatingDistribution;
  className?: string;
}) {
  const positive = distribution[5] + distribution[4];
  const neutral = distribution[3];
  const negative = distribution[2] + distribution[1];
  const total = positive + neutral + negative;
  if (total === 0) return null;

  const pct = (n: number) => (n / total) * 100;
  const segments = [
    { label: "Positive", value: positive, color: "var(--color-brand)" },
    { label: "Neutral", value: neutral, color: "var(--color-amber)" },
    { label: "Negative", value: negative, color: "var(--color-error)" },
  ];

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted"
        role="img"
        aria-label={`${formatNumber(positive)} positive, ${formatNumber(neutral)} neutral, ${formatNumber(negative)} negative reviews`}
      >
        {segments.map(
          (segment) =>
            segment.value > 0 && (
              <span
                key={segment.label}
                className="h-full"
                style={{ width: `${pct(segment.value)}%`, backgroundColor: segment.color }}
              />
            )
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {segments.map((segment) => (
          <span key={segment.label} className="inline-flex items-center gap-1.5">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: segment.color }}
              aria-hidden="true"
            />
            {segment.label} ({formatNumber(segment.value)})
          </span>
        ))}
      </div>
    </div>
  );
}
