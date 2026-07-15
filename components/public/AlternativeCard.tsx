import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SoftwareLogo } from "@/components/public/SoftwareLogo";
import { StarRating } from "@/components/public/StarRating";
import { formatNumber, formatRating, startingPriceLabel } from "@/lib/format";
import type { Software } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Ranked alternative card — flat, plate-ready, with a compare shortcut. */
export function AlternativeCard({
  software,
  originalSlug,
  rank,
  className,
}: {
  software: Software;
  originalSlug: string;
  rank: number;
  className?: string;
}) {
  const price = startingPriceLabel(software);

  return (
    <article
      className={cn(
        "group relative flex flex-col gap-4 rounded-[1.4rem] border border-zinc-200/70 bg-card p-6 transition-colors duration-200 hover:border-zinc-300 sm:p-7 dark:border-zinc-800 dark:hover:border-zinc-700",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="font-heading text-3xl font-extrabold tabular-nums text-zinc-200 dark:text-zinc-700"
        >
          {String(rank).padStart(2, "0")}
        </span>
        <SoftwareLogo software={software} size={44} />
        <div className="min-w-0">
          <h3 className="truncate font-heading text-base font-bold tracking-tight">
            <Link href={`/software/${software.slug}`} className="after:absolute after:inset-0">
              {software.name}
            </Link>
          </h3>
          <div className="flex items-center gap-1.5 text-sm">
            <span className="font-semibold tabular-nums">
              {formatRating(software.overall_rating)}
            </span>
            <StarRating rating={software.overall_rating} size={13} />
            <span className="text-muted-foreground">
              ({formatNumber(software.review_count)})
            </span>
          </div>
        </div>
      </div>

      <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {software.tagline ?? software.description_short}
      </p>

      <div className="mt-auto flex items-end justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <div>
          <p className="text-[0.6rem] font-bold tracking-widest text-muted-foreground uppercase">
            Starting from
          </p>
          <p className="flex items-baseline gap-1">
            <span
              className={cn(
                "font-heading text-lg font-extrabold tabular-nums tracking-tight",
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
        <Link
          href={`/compare/${originalSlug}-vs-${software.slug}`}
          className="relative z-10 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-brand-dark)] hover:underline"
        >
          Compare <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </article>
  );
}
