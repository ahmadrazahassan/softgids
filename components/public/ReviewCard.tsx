import { BadgeCheck, Building2, Clock, ThumbsDown, ThumbsUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CountryFlag } from "@/components/public/CountryFlag";
import { StarRating } from "@/components/public/StarRating";
import { formatDate, formatNumber } from "@/lib/format";
import type { Review } from "@/lib/types";
import { cn } from "@/lib/utils";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function ReviewCard({ review, className }: { review: Review; className?: string }) {
  return (
    <article
      className={cn(
        "space-y-4 rounded-[1.4rem] border border-zinc-200/70 bg-card p-6 sm:p-7 dark:border-zinc-800",
        className
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-11 border border-border">
            {review.reviewer_avatar_url && (
              <AvatarImage src={review.reviewer_avatar_url} alt="" />
            )}
            <AvatarFallback className="bg-[var(--color-brand-light)] text-[var(--color-brand-dark)] dark:bg-[color-mix(in_srgb,var(--color-brand)_18%,transparent)] dark:text-[var(--color-brand-dark)]">
              {initials(review.reviewer_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="flex items-center gap-1.5 font-semibold">
              {review.reviewer_name}
              {(review.verified_badge || review.verified_linkedin) && (
                <BadgeCheck
                  className="size-4 text-[var(--color-brand-dark)]"
                  aria-label={review.verified_badge ?? "Verified reviewer"}
                />
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {[review.reviewer_job_title, review.reviewer_company].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
        <div className="text-right">
          <StarRating rating={review.overall_rating} size={15} />
          <p className="mt-1 text-xs text-muted-foreground">{formatDate(review.review_date)}</p>
        </div>
      </header>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {review.reviewer_industry && (
          <span className="inline-flex items-center gap-1">
            <Building2 className="size-3.5" /> {review.reviewer_industry}
            {review.reviewer_company_size ? ` · ${review.reviewer_company_size}` : ""}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <CountryFlag country={review.reviewer_country} size={14} /> {review.reviewer_country}
        </span>
        {review.used_for_duration && (
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" /> Used for {review.used_for_duration}
          </span>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="font-heading text-base font-bold">{review.review_title}</h3>
        {review.summary && (
          <p className="text-sm leading-relaxed text-muted-foreground">{review.summary}</p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {review.pros && (
            <div className="rounded-2xl bg-[var(--color-brand-light)] p-4 dark:bg-[color-mix(in_srgb,var(--color-brand)_10%,transparent)]">
              <p className="mb-1 inline-flex items-center gap-1.5 text-xs font-bold tracking-wide text-[var(--color-brand-dark)] uppercase dark:text-[var(--color-brand-dark)]">
                <ThumbsUp className="size-3.5" /> Pros
              </p>
              <p className="text-sm text-foreground/85">{review.pros}</p>
            </div>
          )}
          {review.cons && (
            <div className="rounded-2xl bg-amber-50 p-4 dark:bg-amber-500/10">
              <p className="mb-1 inline-flex items-center gap-1.5 text-xs font-bold tracking-wide text-amber-700 uppercase dark:text-amber-400">
                <ThumbsDown className="size-3.5" /> Cons
              </p>
              <p className="text-sm text-foreground/85">{review.cons}</p>
            </div>
          )}
        </div>
      </div>

      {review.vendor_response && (
        <div className="rounded-2xl border-l-2 border-[var(--color-brand)] bg-muted p-4">
          <p className="mb-1 text-xs font-bold tracking-wide text-muted-foreground uppercase">
            Vendor response
            {review.vendor_response_date ? ` · ${formatDate(review.vendor_response_date)}` : ""}
          </p>
          <p className="text-sm">{review.vendor_response}</p>
        </div>
      )}

      {review.helpful_count > 0 && (
        <footer className="text-xs text-muted-foreground">
          {formatNumber(review.helpful_count)} people found this review helpful
        </footer>
      )}
    </article>
  );
}
