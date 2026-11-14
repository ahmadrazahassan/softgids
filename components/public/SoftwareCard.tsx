import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { AdLabel } from "@/components/public/AdLabel";
import { AffiliateLink } from "@/components/public/AffiliateLink";
import { outboundLink } from "@/lib/affiliate";
import { ReviewSentiment } from "@/components/public/ReviewSentiment";
import { StarRating } from "@/components/public/StarRating";
import { SoftwareLogo } from "@/components/public/SoftwareLogo";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatRating, startingPriceLabel } from "@/lib/format";
import { brandColorFor } from "@/lib/brandColors";
import type { RatingDistribution, Software } from "@/lib/types";
import { cn } from "@/lib/utils";

/** The rating dimension a product scores highest on, for the highlight line. */
function topDimension(software: Software) {
  const dims = [
    { label: "ease of use", value: software.ease_of_use_rating },
    { label: "value for money", value: software.value_for_money_rating },
    { label: "functionality", value: software.functionality_rating },
    { label: "customer service", value: software.customer_service_rating },
  ];
  return dims.reduce((best, d) => (d.value > best.value ? d : best));
}

export function SoftwareCard({
  software,
  categoryName,
  distribution,
  slot = "card",
  className,
}: {
  software: Software;
  categoryName?: string;
  /** Live star distribution; when provided the card shows review sentiment. */
  distribution?: RatingDistribution;
  /**
   * Where this card sits, for the affiliate placement ID — "home-card",
   * "explore-card", "blog-card". Defaults to a generic "card" so a new
   * surface still reports something rather than nothing.
   */
  slot?: string;
  className?: string;
}) {
  const accent = brandColorFor(software);
  const price = startingPriceLabel(software);
  const best = topDimension(software);
  const profileHref = `/software/${software.slug}`;
  const link = outboundLink(software, slot);

  return (
    <article
      style={{ ["--accent" as string]: accent }}
      className={cn(
        "group flex flex-col gap-5 rounded-3xl border border-zinc-200/80 bg-card p-6 transition-colors duration-200",
        "hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700",
        className
      )}
    >
      {/* Header — raw logo, no background tile */}
      <div className="flex items-start gap-4">
        <SoftwareLogo software={software} size={44} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-heading text-lg font-bold tracking-tight">
            <Link
              href={profileHref}
              className="outline-none transition-colors hover:text-[var(--accent)] focus-visible:underline"
            >
              {software.name}
            </Link>
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <StarRating rating={software.overall_rating} size={14} />
            <span className="font-bold tabular-nums">{formatRating(software.overall_rating)}</span>
            <span className="text-muted-foreground">
              ({formatNumber(software.review_count)})
            </span>
          </div>
        </div>
        {categoryName && (
          <span className="shrink-0 rounded-md bg-muted px-2.5 py-1 text-[0.65rem] font-bold tracking-wide text-muted-foreground uppercase">
            {categoryName}
          </span>
        )}
      </div>

      {/* Rating highlight + live review sentiment */}
      <div className="space-y-3 rounded-2xl border border-zinc-100 bg-muted/50 px-4 py-3.5 dark:border-zinc-800">
        <div>
          <p className="text-sm font-bold leading-snug">
            Highly rated for {best.label}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Based on {formatNumber(software.review_count)} verified user reviews
          </p>
        </div>
        {distribution && <ReviewSentiment distribution={distribution} slug={software.slug} />}
      </div>

      {/* Tagline */}
      <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {software.tagline ?? software.description_short}
      </p>

      {/* Price */}
      <div className="flex items-end justify-between gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <div className="min-w-0">
          <p className="text-[0.65rem] font-bold tracking-widest text-muted-foreground uppercase">
            Starting from
          </p>
          <p className="flex items-baseline gap-1">
            <span
              className={cn(
                "font-heading text-2xl font-extrabold tabular-nums tracking-tight",
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
        {software.free_trial && (
          <Badge variant="success" className="shrink-0">
            Free trial
          </Badge>
        )}
      </div>

      {/* Actions — glossy rounded rectangles from the shared shell */}
      <div className="mt-auto space-y-2">
        <div className={cn("grid gap-3", link ? "grid-cols-2" : "grid-cols-1")}>
          <Link
            href={profileHref}
            className="btn-glossy btn-glossy-white inline-flex h-11 items-center justify-center text-sm"
          >
            View profile
          </Link>
          {link && (
            <AffiliateLink
              link={link}
              action={`Visit ${software.vendor_name ?? software.name} website`}
              slug={software.slug}
              className="btn-glossy inline-flex h-11 items-center justify-center gap-1.5 px-4 text-sm"
              style={
                {
                  "--btn-bg": accent,
                  "--btn-ink": "#ffffff",
                  "--btn-glow": `color-mix(in srgb, ${accent} 55%, transparent)`,
                } as React.CSSProperties
              }
            >
              Visit website
              <ExternalLink className="size-4" aria-hidden="true" />
            </AffiliateLink>
          )}
        </div>
        {link?.kind === "affiliate" && <AdLabel className="block text-center" />}
      </div>
    </article>
  );
}
