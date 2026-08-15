import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PenLine } from "lucide-react";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { CircularRating } from "@/components/public/CircularRating";
import { Pagination } from "@/components/public/Pagination";
import { RatingBar } from "@/components/public/RatingBar";
import { ReviewCard } from "@/components/public/ReviewCard";
import { ReviewFilters } from "@/components/public/ReviewFilters";
import { SentimentBar } from "@/components/public/SentimentBar";
import { SponsoredAd } from "@/components/public/SponsoredAd";
import { SoftwareLogo } from "@/components/public/SoftwareLogo";
import { StarRating } from "@/components/public/StarRating";
import { VerifiedBadges } from "@/components/public/VerifiedBadges";
import { brandColorFor } from "@/lib/brandColors";
import { formatNumber, formatRating } from "@/lib/format";
import { siteUrl } from "@/lib/site";
import {
  getRatingDistribution,
  getReviewsForSoftware,
  getSoftwareBySlug,
} from "@/lib/supabase/queries";
import type { ReviewSort } from "@/lib/types";

export const revalidate = 3600;

export async function generateMetadata(
  props: PageProps<"/software/[slug]/reviews">
): Promise<Metadata> {
  const { slug } = await props.params;
  const software = await getSoftwareBySlug(slug);
  if (!software) return { title: "Reviews not found" };
  return {
    title: `${software.name} Reviews — ${formatNumber(software.review_count)} Verified User Ratings`,
    description: `Read verified ${software.name} reviews from businesses in South Africa and the region. Filter by industry, company size and usage duration.`,
    alternates: { canonical: `${siteUrl}/software/${software.slug}/reviews` },
  };
}

export default async function SoftwareReviewsPage(
  props: PageProps<"/software/[slug]/reviews">
) {
  const { slug } = await props.params;
  const searchParams = await props.searchParams;
  const software = await getSoftwareBySlug(slug);
  if (!software) notFound();

  const single = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const filters = {
    country: single(searchParams.country),
    industry: single(searchParams.industry),
    companySize: single(searchParams.size),
    duration: single(searchParams.duration),
    sort: (single(searchParams.sort) as ReviewSort) || "helpful",
  };
  const [allReviews, distribution] = await Promise.all([
    getReviewsForSoftware(software.id, filters),
    getRatingDistribution(software.id),
  ]);

  const PAGE_SIZE = 20;
  const totalPages = Math.max(1, Math.ceil(allReviews.length / PAGE_SIZE));
  const currentPage = Math.min(
    totalPages,
    Math.max(1, Number.parseInt(single(searchParams.page) ?? "1", 10) || 1)
  );
  const reviews = allReviews.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const paginationParams = Object.fromEntries(
    Object.entries({
      country: filters.country,
      industry: filters.industry,
      size: filters.companySize,
      duration: filters.duration,
      sort: single(searchParams.sort),
    }).filter(([, v]) => v)
  ) as Record<string, string>;

  const accent = brandColorFor(software);
  const totalRatings = Object.values(distribution).reduce((a, b) => a + b, 0);

  return (
    <div className="container-site space-y-8 py-10">
      <Breadcrumbs
        items={[
          { name: "Software Reviews", href: "/software" },
          { name: software.name, href: `/software/${software.slug}` },
          { name: "Reviews" },
        ]}
      />

      <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <SoftwareLogo software={software} size={64} />
          <div className="space-y-1.5">
            <h1 className="font-heading text-3xl font-bold tracking-tight">
              {software.name} reviews
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-heading text-lg font-bold tabular-nums">
                {formatRating(software.overall_rating)}
              </span>
              <StarRating rating={software.overall_rating} size={15} />
              <span className="text-muted-foreground">
                {formatNumber(software.review_count)} verified{" "}
                {software.review_count === 1 ? "review" : "reviews"}
              </span>
            </div>
          </div>
        </div>
        <Link
          href={`/software/${software.slug}/reviews/new`}
          className="btn-glossy inline-flex shrink-0 items-center gap-2 px-5 py-3 text-sm"
        >
          <PenLine className="size-4" /> Write a review
        </Link>
      </header>

      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        {/* Ratings summary rail */}
        <aside className="space-y-6 self-start rounded-3xl border border-zinc-200 bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.14)] lg:sticky lg:top-24 dark:border-zinc-800">
          <div className="flex flex-col items-center gap-2">
            <CircularRating rating={software.overall_rating} size={96} color={accent} />
            <StarRating rating={software.overall_rating} size={15} />
            <p className="text-sm text-muted-foreground">
              {formatNumber(totalRatings)} ratings
            </p>
          </div>
          <div className="space-y-2">
            {([5, 4, 3, 2, 1] as const).map((star) => (
              <RatingBar
                key={star}
                label={`${star} ★`}
                value={distribution[star]}
                max={Math.max(1, totalRatings)}
                color={accent}
                suffix={formatNumber(distribution[star])}
                className="[&>span:first-child]:w-10"
              />
            ))}
          </div>
          <SentimentBar distribution={distribution} />
          <VerifiedBadges />
          <SponsoredAd format="halfpage" className="pt-2" />
        </aside>

        {/* Reviews + filters */}
        <div className="space-y-5">
          <Suspense>
            <ReviewFilters />
          </Suspense>
          <p className="text-sm text-muted-foreground">
            {allReviews.length === 0
              ? "Showing 0 reviews"
              : `Showing ${formatNumber((currentPage - 1) * PAGE_SIZE + 1)} to ${formatNumber(
                  Math.min(currentPage * PAGE_SIZE, allReviews.length)
                )} of ${formatNumber(allReviews.length)} ${allReviews.length === 1 ? "review" : "reviews"}`}
          </p>
          {reviews.length === 0 ? (
            <div className="rounded-3xl border border-zinc-200 p-12 text-center text-muted-foreground dark:border-zinc-800">
              No reviews match these filters. Try broadening your selection.
            </div>
          ) : (
            <div className="space-y-5">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath={`/software/${software.slug}/reviews`}
            searchParams={paginationParams}
            className="pt-2"
          />
        </div>
      </div>
    </div>
  );
}
