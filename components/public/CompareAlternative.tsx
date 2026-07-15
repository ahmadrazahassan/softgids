import Link from "next/link";
import { Check, X } from "lucide-react";
import { SoftwareLogo } from "@/components/public/SoftwareLogo";
import { StarRating } from "@/components/public/StarRating";
import { brandColorFor } from "@/lib/brandColors";
import { formatNumber, formatRating, startingPriceLabel } from "@/lib/format";
import type { Software } from "@/lib/types";

/**
 * Head to head strip against the product's most popular alternative:
 * starting price, pricing options and the per dimension rating bars, both
 * sides sourced from the same verified review aggregates as everywhere else.
 */

function PricingOption({ available, label }: { available: boolean; label: string }) {
  return (
    <span
      className={
        available
          ? "inline-flex items-center gap-1.5 text-sm font-medium"
          : "inline-flex items-center gap-1.5 text-sm text-muted-foreground/70"
      }
    >
      {available ? (
        <Check className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
      ) : (
        <X className="size-4 text-muted-foreground/50" aria-hidden="true" />
      )}
      {label}
    </span>
  );
}

function DimensionBar({
  rating,
  count,
  color,
  align,
}: {
  rating: number;
  count: number;
  color: string;
  align: "left" | "right";
}) {
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  const value = (
    <span className="shrink-0 text-sm tabular-nums">
      <span className="font-semibold">{formatRating(rating)}</span>{" "}
      <span className="text-muted-foreground">({formatNumber(count)})</span>
    </span>
  );
  const bar = (
    <span className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-200/80 dark:bg-zinc-800">
      <span
        className={`absolute inset-y-0 rounded-full ${align === "left" ? "right-0" : "left-0"}`}
        style={{ width: `${pct}%`, background: color }}
      />
    </span>
  );
  return (
    <div className="flex items-center gap-3">
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

export function CompareAlternative({
  software,
  alternative,
}: {
  software: Software;
  alternative: Software;
}) {
  const left = software;
  const right = alternative;
  const leftAccent = brandColorFor(left);
  const rightAccent = brandColorFor(right);
  const leftPrice = startingPriceLabel(left);
  const rightPrice = startingPriceLabel(right);

  const dimensions: Array<{
    label: string;
    key: "ease_of_use_rating" | "value_for_money_rating" | "customer_service_rating" | "functionality_rating";
  }> = [
    { label: "Ease of use", key: "ease_of_use_rating" },
    { label: "Value for money", key: "value_for_money_rating" },
    { label: "Customer service", key: "customer_service_rating" },
    { label: "Functionality", key: "functionality_rating" },
  ];

  const centerLabel = "hidden text-center text-sm font-medium text-muted-foreground sm:block";

  return (
    <div className="rounded-[1.75rem] bg-zinc-100/80 p-2 dark:bg-zinc-900/60">
      <div className="rounded-[1.4rem] border border-zinc-200/70 bg-card p-6 sm:p-8 dark:border-zinc-800">
        {/* Heads */}
        <div className="grid gap-6 sm:grid-cols-[1fr_84px_1fr] sm:items-start">
          <div className="flex flex-col items-center gap-3 text-center">
            <SoftwareLogo software={left} size={56} />
            <div>
              <p className="font-heading text-lg font-bold">{left.name}</p>
              <div className="mt-1 flex items-center justify-center gap-2 text-sm">
                <span className="font-semibold tabular-nums">{formatRating(left.overall_rating)}</span>
                <StarRating rating={left.overall_rating} size={14} />
                <span className="text-muted-foreground">({formatNumber(left.review_count)})</span>
              </div>
            </div>
          </div>

          <div className="hidden items-center justify-center sm:flex sm:h-full">
            <span className="grid size-12 place-items-center rounded-full bg-muted font-heading text-sm font-bold text-muted-foreground">
              VS.
            </span>
          </div>

          <div className="flex flex-col items-center gap-3 text-center">
            <SoftwareLogo software={right} size={56} />
            <div>
              <p className="font-heading text-lg font-bold">{right.name}</p>
              <div className="mt-1 flex items-center justify-center gap-2 text-sm">
                <span className="font-semibold tabular-nums">{formatRating(right.overall_rating)}</span>
                <StarRating rating={right.overall_rating} size={14} />
                <span className="text-muted-foreground">({formatNumber(right.review_count)})</span>
              </div>
            </div>
            <Link
              href={`/software/${right.slug}`}
              className="btn-glossy inline-flex items-center px-5 py-2.5 text-sm"
            >
              View profile
            </Link>
          </div>
        </div>

        {/* Starting price */}
        <div className="mt-8 grid items-center gap-2 border-t border-zinc-200/70 pt-6 sm:grid-cols-[1fr_84px_1fr] sm:gap-6 dark:border-zinc-800">
          <p className="text-center text-sm font-medium text-muted-foreground sm:hidden">Starting price</p>
          <div className="text-center">
            <p className="font-heading text-2xl font-bold tabular-nums">
              {leftPrice.amount}
              {leftPrice.note && (
                <span className="ml-1 text-sm font-normal text-muted-foreground">{leftPrice.note}</span>
              )}
            </p>
          </div>
          <p className={centerLabel}>Starting price</p>
          <div className="text-center">
            <p className="font-heading text-2xl font-bold tabular-nums">
              {rightPrice.amount}
              {rightPrice.note && (
                <span className="ml-1 text-sm font-normal text-muted-foreground">{rightPrice.note}</span>
              )}
            </p>
          </div>
        </div>

        {/* Pricing options */}
        <div className="mt-6 grid items-center gap-2 sm:grid-cols-[1fr_84px_1fr] sm:gap-6">
          <p className="text-center text-sm font-medium text-muted-foreground sm:hidden">Pricing options</p>
          <div className="flex items-center justify-center gap-5">
            <PricingOption available={left.free_version} label="Free version" />
            <PricingOption available={left.free_trial} label="Free trial" />
          </div>
          <p className={centerLabel}>Pricing options</p>
          <div className="flex items-center justify-center gap-5">
            <PricingOption available={right.free_version} label="Free version" />
            <PricingOption available={right.free_trial} label="Free trial" />
          </div>
        </div>

        {/* Dimension bars */}
        <div className="mt-8 space-y-5 border-t border-zinc-200/70 pt-6 dark:border-zinc-800">
          {dimensions.map(({ label, key }) => (
            <div key={key} className="grid items-center gap-2 sm:grid-cols-[1fr_84px_1fr] sm:gap-6">
              <p className="text-center text-sm font-medium text-muted-foreground sm:hidden">{label}</p>
              <DimensionBar
                rating={left[key]}
                count={left.review_count}
                color={leftAccent}
                align="left"
              />
              <p className={centerLabel}>{label}</p>
              <DimensionBar
                rating={right[key]}
                count={right.review_count}
                color={rightAccent}
                align="right"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
