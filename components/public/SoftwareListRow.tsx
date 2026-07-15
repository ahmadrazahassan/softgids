import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { StarRating } from "@/components/public/StarRating";
import { SoftwareLogo } from "@/components/public/SoftwareLogo";
import { GlossyCTA } from "@/components/public/GlossyCTA";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatRating, startingPriceLabel } from "@/lib/format";
import { brandColorFor } from "@/lib/brandColors";
import type { Software } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Directory list row — flat, data-forward, no logo tile. Used on /software. */
export function SoftwareListRow({
  software,
  rank,
  categoryName,
  className,
}: {
  software: Software;
  rank?: number;
  categoryName?: string;
  className?: string;
}) {
  const accent = brandColorFor(software);
  const price = startingPriceLabel(software);

  return (
    <article
      style={{ ["--accent" as string]: accent }}
      className={cn(
        "group relative flex flex-col gap-4 rounded-2xl border border-zinc-200/80 bg-card p-5 transition-colors duration-200",
        "hover:border-zinc-300 sm:flex-row sm:items-center sm:gap-5 sm:p-6 dark:border-zinc-800 dark:hover:border-zinc-700",
        className
      )}
    >
      {typeof rank === "number" && (
        <span className="hidden w-6 shrink-0 text-center font-heading text-base font-extrabold tabular-nums text-zinc-300 transition-colors group-hover:text-[var(--accent)] sm:block dark:text-zinc-600">
          {formatNumber(rank)}
        </span>
      )}

      {/* Raw logo, no background */}
      <SoftwareLogo software={software} size={52} />

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <h3 className="font-heading text-lg font-bold tracking-tight">
            <Link
              href={`/software/${software.slug}`}
              className="transition-colors hover:text-[var(--accent)]"
            >
              {software.name}
            </Link>
          </h3>
          {categoryName && (
            <span className="rounded-md bg-muted px-2 py-0.5 text-[0.65rem] font-bold tracking-wide text-muted-foreground uppercase">
              {categoryName}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-bold tabular-nums">{formatRating(software.overall_rating)}</span>
          <StarRating rating={software.overall_rating} size={14} />
          <span className="text-muted-foreground">
            {formatNumber(software.review_count)}{" "}
            {software.review_count === 1 ? "review" : "reviews"}
          </span>
        </div>
        <p className="line-clamp-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {software.tagline ?? software.description_short}
        </p>
      </div>

      {/* Price + glossy CTA */}
      <div className="flex shrink-0 flex-col gap-3 border-t border-zinc-100 pt-4 sm:w-52 sm:border-t-0 sm:pt-0 dark:border-zinc-800">
        <div className="flex items-end justify-between gap-2 sm:flex-col sm:items-end">
          <div className="sm:text-right">
            <p className="text-[0.6rem] font-bold tracking-widest text-muted-foreground uppercase">
              Starting from
            </p>
            <p className="flex items-baseline gap-1">
              <span
                className={cn(
                  "font-heading text-xl font-extrabold tabular-nums tracking-tight",
                  price.custom && "text-muted-foreground"
                )}
              >
                {price.amount}
              </span>
              {price.note && (
                <span className="text-xs font-medium text-muted-foreground">{price.note}</span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-1.5">
            {software.free_trial && <Badge variant="success">Free trial</Badge>}
            {software.free_version && <Badge variant="muted">Free version</Badge>}
          </div>
        </div>
        <GlossyCTA
          href={`/software/${software.slug}`}
          accent={accent}
          className="w-full sm:w-auto"
        >
          View profile
          <ArrowRight className="size-4" />
        </GlossyCTA>
      </div>
    </article>
  );
}
