import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SoftwareLogo } from "@/components/public/SoftwareLogo";
import { StarRating } from "@/components/public/StarRating";
import { formatNumber, formatPricePerPeriod, formatRating } from "@/lib/format";
import { brandColorFor } from "@/lib/brandColors";
import type { Software } from "@/lib/types";
import { cn } from "@/lib/utils";

function sidePrice(software: Software): string {
  if (software.free_version && (software.starting_price ?? 0) === 0) return "Free plan";
  if (software.starting_price == null) return "Custom pricing";
  return `From ${formatPricePerPeriod(software.starting_price, software.price_currency, software.billing_period)}`;
}

function Side({ software }: { software: Software }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-2.5 text-center">
      <SoftwareLogo software={software} size={44} />
      <span className="font-heading text-sm leading-tight font-bold">{software.name}</span>
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground tabular-nums">
          {formatRating(software.overall_rating)}
        </span>
        <StarRating rating={software.overall_rating} size={11} />
        <span className="tabular-nums">({formatNumber(software.review_count)})</span>
      </span>
      <span className="text-xs font-semibold tabular-nums">{sidePrice(software)}</span>
    </div>
  );
}

/** Compact score + fill bar for one side of a dimension row. */
function DimensionScore({
  rating,
  color,
  align,
}: {
  rating: number;
  color: string;
  align: "left" | "right";
}) {
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  const bar = (
    <span className="relative h-1.5 w-full max-w-16 overflow-hidden rounded-full bg-zinc-200/80 dark:bg-zinc-800">
      <span
        className={cn("absolute inset-y-0 rounded-full", align === "left" ? "right-0" : "left-0")}
        style={{ width: `${pct}%`, background: color }}
      />
    </span>
  );
  const value = (
    <span className="w-7 shrink-0 text-xs font-bold tabular-nums">{formatRating(rating)}</span>
  );
  return (
    <div className={cn("flex flex-1 items-center gap-2", align === "left" ? "justify-start" : "justify-end")}>
      {align === "left" ? (
        <>
          {value}
          {bar}
        </>
      ) : (
        <>
          {bar}
          {value}
        </>
      )}
    </div>
  );
}

const DIMENSIONS: Array<{
  label: string;
  key: "value_for_money_rating" | "functionality_rating" | "ease_of_use_rating" | "customer_service_rating";
}> = [
  { label: "Value for money", key: "value_for_money_rating" },
  { label: "Functionality", key: "functionality_rating" },
  { label: "Ease of use", key: "ease_of_use_rating" },
  { label: "Service", key: "customer_service_rating" },
];

/**
 * Head-to-head matchup tile: two contenders split by a centre seam and a
 * rectangular VS marker, with ratings, starting prices and the per dimension
 * scores from verified reviews mirrored across both sides.
 */
export function ComparisonCard({
  a,
  b,
  className,
}: {
  a: Software;
  b: Software;
  className?: string;
}) {
  const accentA = brandColorFor(a);
  const accentB = brandColorFor(b);

  return (
    <Link
      href={`/compare/${a.slug}-vs-${b.slug}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-zinc-200/80 bg-card transition-colors duration-200",
        "hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700",
        className
      )}
    >
      <div className="relative flex items-stretch gap-4 p-6 pb-5">
        <Side software={a} />
        {/* Centre seam + VS marker */}
        <div className="relative flex shrink-0 items-center justify-center">
          <span
            aria-hidden="true"
            className="absolute inset-y-2 left-1/2 w-px -translate-x-1/2 bg-zinc-200 dark:bg-zinc-700"
          />
          <span className="relative grid size-9 place-items-center rounded-lg bg-[var(--color-navy)] font-heading text-xs font-bold text-white shadow-sm dark:bg-secondary">
            VS
          </span>
        </div>
        <Side software={b} />
      </div>

      {/* Dimension scores from verified reviews, mirrored per side */}
      <div className="space-y-2 border-t border-zinc-100 px-6 py-4 dark:border-zinc-800">
        {DIMENSIONS.map(({ label, key }) => (
          <div key={key} className="flex items-center gap-2">
            <DimensionScore rating={a[key]} color={accentA} align="left" />
            <span className="w-28 shrink-0 text-center text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase">
              {label}
            </span>
            <DimensionScore rating={b[key]} color={accentB} align="right" />
          </div>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-center gap-1.5 border-t border-zinc-100 bg-muted/40 py-3 text-sm font-bold text-[var(--color-brand-dark)] transition-colors duration-200 group-hover:bg-[var(--color-brand)] group-hover:text-[var(--color-brand-ink)] dark:border-zinc-800">
        See full comparison
        <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
