import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftRight,
  ArrowRight,
  BarChart3,
  BookOpen,
  Camera,
  CircleHelp,
  ListChecks,
  PenLine,
  PiggyBank,
  Scale,
  Star,
} from "lucide-react";
import { AlternativeCard } from "@/components/public/AlternativeCard";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { CircularRating } from "@/components/public/CircularRating";
import { CompareAlternative } from "@/components/public/CompareAlternative";
import { CompanySizeChart } from "@/components/public/CompanySizeChart";
import { FaqAccordion, type FaqItem } from "@/components/public/FaqAccordion";
import { FeaturesSection } from "@/components/public/FeaturesSection";
import { PricingCards } from "@/components/public/PricingCards";
import { PricingTable } from "@/components/public/PricingTable";
import { ProfileNav } from "@/components/public/ProfileNav";
import { RatingBar } from "@/components/public/RatingBar";
import { ReviewCard } from "@/components/public/ReviewCard";
import { ScreenshotCarousel } from "@/components/public/ScreenshotCarousel";
import { SentimentBar } from "@/components/public/SentimentBar";
import { SoftwareLogo } from "@/components/public/SoftwareLogo";
import { SoftwareRatingsChart } from "@/components/public/SoftwareRatingsChart";
import { SoftwareSidebar } from "@/components/public/SoftwareSidebar";
import { StarRating } from "@/components/public/StarRating";
import { VerifiedBadges } from "@/components/public/VerifiedBadges";
import { Badge } from "@/components/ui/badge";
import { brandColorFor } from "@/lib/brandColors";
import { formatNumber, formatPricePerPeriod, formatRating } from "@/lib/format";
import { breadcrumbJsonLd, JsonLd, productJsonLd, reviewsJsonLd } from "@/lib/jsonld";
import { screenshotsFor } from "@/lib/screenshots";
import { siteUrl } from "@/lib/site";
import {
  getAlternatives,
  getCategoryPeers,
  getRatingDistribution,
  getReviewsForSoftware,
  getSoftwareBySlug,
} from "@/lib/supabase/queries";
import type { Software } from "@/lib/types";

export const revalidate = 3600;

export async function generateMetadata(
  props: PageProps<"/software/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const software = await getSoftwareBySlug(slug);
  if (!software) return { title: "Software not found" };

  const title =
    software.meta_title ??
    `${software.name} Review ${new Date().getFullYear()} — Pricing, Features & Ratings`;
  const description =
    software.meta_description ??
    `${software.description_short} Read ${formatNumber(software.review_count)} verified reviews from South African businesses.`;

  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/software/${software.slug}` },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/software/${software.slug}`,
      images: [
        software.og_image_url ??
          `/api/og?title=${encodeURIComponent(software.name)}&rating=${software.overall_rating}&type=software`,
      ],
    },
  };
}

function buildFaqs(software: Software): FaqItem[] {
  const faqs: FaqItem[] = [];
  if (software.starting_price != null || software.pricing_plans.length > 0) {
    faqs.push({
      topic: "Pricing",
      question: `How much does ${software.name} cost in South Africa?`,
      answer:
        software.starting_price === 0 && software.free_version
          ? `${software.name} offers a free plan. Paid plans start at ${formatPricePerPeriod(software.pricing_plans.find((p) => (p.price ?? 0) > 0)?.price ?? null, software.price_currency, software.pricing_plans.find((p) => (p.price ?? 0) > 0)?.period ?? software.billing_period)}.`
          : software.starting_price == null
            ? `${software.name} uses custom pricing. Contact ${software.vendor_name ?? "the vendor"} or an accredited partner for a quote in rand.`
            : `${software.name} pricing starts at ${formatPricePerPeriod(software.starting_price, software.price_currency, software.billing_period)}.`,
    });
  }
  faqs.push({
    topic: "Pricing",
    question: `Does ${software.name} offer a free trial?`,
    answer: software.free_trial
      ? `Yes. ${software.name} offers a free trial, so you can test it against your own workflows before paying.`
      : software.free_version
        ? `${software.name} has no time-limited trial, but its free plan lets you start without paying.`
        : `No free trial is currently advertised. Ask ${software.vendor_name ?? "the vendor"} for a demo instead.`,
  });
  if (software.integrations.length > 0) {
    faqs.push({
      topic: "Integrations",
      question: `What does ${software.name} integrate with?`,
      answer: `Key integrations include ${software.integrations.slice(0, 6).join(", ")}${software.integrations.length > 6 ? " and more" : ""}.`,
    });
  }
  faqs.push({
    topic: "Local fit",
    question: `Is ${software.name} suitable for South African businesses?`,
    answer: `${software.name} is available in ${software.countries_available.join(", ")}. ${software.description_short}`,
  });
  if (software.review_count > 0) {
    faqs.push({
      topic: "Reviews",
      question: `What do users say about ${software.name}?`,
      answer: `${software.name} holds an overall rating of ${formatRating(software.overall_rating)}/5 from ${formatNumber(software.review_count)} verified reviews, scoring ${formatRating(software.ease_of_use_rating)} for ease of use and ${formatRating(software.value_for_money_rating)} for value for money.`,
    });
  }
  return faqs;
}

export default async function SoftwareProfilePage(props: PageProps<"/software/[slug]">) {
  const { slug } = await props.params;
  const software = await getSoftwareBySlug(slug);
  if (!software) notFound();

  const [reviews, distribution, alternativesRaw, peers] = await Promise.all([
    getReviewsForSoftware(software.id, { sort: "helpful" }),
    getRatingDistribution(software.id),
    getAlternatives(software.id),
    getCategoryPeers(software.id, software.category_id ?? null),
  ]);

  const alternatives = (alternativesRaw.length > 0 ? alternativesRaw : peers).slice(0, 3);
  const accent = brandColorFor(software);
  const screenshots = screenshotsFor({
    slug: software.slug,
    screenshots: software.screenshots,
  });
  const hasScreenshots = screenshots.length > 0;
  const faqs = buildFaqs(software);
  const categoryName = software.category?.name ?? "Software";
  const categorySlug = software.category?.slug;
  const totalRatings = Object.values(distribution).reduce((a, b) => a + b, 0);

  const sections = [
    { id: "overview", label: "Overview" },
    ...(software.pricing_plans.length > 0 ? [{ id: "pricing", label: "Pricing" }] : []),
    { id: "features", label: "Features" },
    ...(hasScreenshots ? [{ id: "screenshots", label: "Screenshots" }] : []),
    { id: "ratings", label: "Ratings" },
    ...(alternatives.length > 0 ? [{ id: "compare", label: "Compare" }] : []),
    { id: "reviews", label: `Reviews (${formatNumber(software.review_count)})` },
    ...(alternatives.length > 0 ? [{ id: "alternatives", label: "Alternatives" }] : []),
    { id: "faqs", label: "FAQs" },
  ];

  return (
    <div className="container-site space-y-10 py-10">
      <JsonLd
        data={[
          productJsonLd(software),
          ...reviewsJsonLd(software, reviews),
          breadcrumbJsonLd([
            { name: "Software", href: "/software" },
            ...(categorySlug
              ? [{ name: categoryName, href: `/category/${categorySlug}` }]
              : []),
            { name: software.name, href: `/software/${software.slug}` },
          ]),
        ]}
      />

      <Breadcrumbs
        items={[
          { name: "Software Reviews", href: "/software" },
          ...(categorySlug ? [{ name: categoryName, href: `/category/${categorySlug}` }] : []),
          { name: software.name },
        ]}
      />

      {/* ---------- Profile header — centered ---------- */}
      <header className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
        <SoftwareLogo software={software} size={84} />
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <h1 className="font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              {software.name}
            </h1>
            {software.featured && <Badge variant="amber">Featured</Badge>}
          </div>
          {software.tagline && (
            <p className="text-lg leading-relaxed text-pretty text-muted-foreground">
              {software.tagline}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
          <span className="font-heading text-lg font-bold tabular-nums">
            {formatRating(software.overall_rating)}
          </span>
          <StarRating rating={software.overall_rating} size={16} />
          <Link
            href={`/software/${software.slug}/reviews`}
            className="text-[var(--color-brand-dark)] hover:underline"
          >
            {formatNumber(software.review_count)} verified{" "}
            {software.review_count === 1 ? "review" : "reviews"}
          </Link>
        </div>
        <Link
          href={`/software/${software.slug}/reviews/new`}
          className="btn-glossy inline-flex items-center gap-2 px-5 py-3 text-sm"
        >
          <PenLine className="size-4" /> Write a review
        </Link>
      </header>

      <ProfileNav sections={sections} />

      <div className="mx-auto max-w-4xl">
        <div className="min-w-0 space-y-20">
          {/* Vendor spec sheet */}
          <SoftwareSidebar software={software} />

          {/* Overview */}
          <section id="overview" aria-labelledby="overview-h" className="scroll-mt-32 space-y-6">
            <div className="mx-auto flex max-w-xl flex-col items-center gap-5 pb-2 text-center">
              <p className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground/80">
                <BookOpen className="size-4 text-muted-foreground" aria-hidden="true" />
                Overview
              </p>
              <h2
                id="overview-h"
                className="font-heading text-3xl font-medium tracking-tight text-balance sm:text-[2.6rem] sm:leading-[1.18]"
              >
                What is {software.name}?
              </h2>
            </div>
            <div
              className="prose-content mx-auto max-w-3xl"
              dangerouslySetInnerHTML={{ __html: software.description_full }}
            />
          </section>

          {/* Pricing */}
          {software.pricing_plans.length > 0 && (
            <section id="pricing" aria-labelledby="pricing-h" className="scroll-mt-32 space-y-6">
              <div className="mx-auto flex max-w-xl flex-col items-center gap-5 pb-2 text-center">
                <p className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground/80">
                  <PiggyBank className="size-4 text-muted-foreground" aria-hidden="true" />
                  Pricing
                </p>
                <h2
                  id="pricing-h"
                  className="font-heading text-3xl font-medium tracking-tight text-balance sm:text-[2.6rem] sm:leading-[1.18]"
                >
                  {software.name} plans,{" "}
                  <span className="rounded-2xl bg-[var(--color-brand)] px-3 py-0.5 whitespace-nowrap text-[var(--color-brand-ink)]">
                    priced in rand
                  </span>
                </h2>
                <p className="text-base leading-relaxed text-muted-foreground">
                  What South African teams actually pay each month. Every plan is listed below, and
                  the feature table shows exactly where they differ.
                </p>
              </div>
              <PricingCards
                plans={software.pricing_plans}
                currency={software.price_currency}
                ctaHref={`/api/track-click?software=${encodeURIComponent(software.slug)}`}
                freeTrial={software.free_trial}
                vendorName={software.vendor_name ?? software.name}
              />
              <PricingTable plans={software.pricing_plans} currency={software.price_currency} />
            </section>
          )}

          {/* Features */}
          <section id="features" aria-labelledby="features-h" className="scroll-mt-32 space-y-6">
            <div className="mx-auto flex max-w-xl flex-col items-center gap-5 pb-2 text-center">
              <p className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground/80">
                <ListChecks className="size-4 text-muted-foreground" aria-hidden="true" />
                Features
              </p>
              <h2
                id="features-h"
                className="font-heading text-3xl font-medium tracking-tight text-balance sm:text-[2.6rem] sm:leading-[1.18]"
              >
                What {software.name} can{" "}
                <span className="rounded-2xl bg-[var(--color-brand)] px-3 py-0.5 whitespace-nowrap text-[var(--color-brand-ink)]">
                  actually do
                </span>
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground">
                The headline features first, then the full list as the vendor states it.
              </p>
            </div>
            <FeaturesSection software={software} />
          </section>

          {/* Screenshots — only when the product has real, uploaded screenshots */}
          {hasScreenshots && (
            <section
              id="screenshots"
              aria-labelledby="screenshots-h"
              className="scroll-mt-32 space-y-6"
            >
              <div className="mx-auto flex max-w-xl flex-col items-center gap-5 pb-2 text-center">
                <p className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground/80">
                  <Camera className="size-4 text-muted-foreground" aria-hidden="true" />
                  Screenshots
                </p>
                <h2
                  id="screenshots-h"
                  className="font-heading text-3xl font-medium tracking-tight text-balance sm:text-[2.6rem] sm:leading-[1.18]"
                >
                  See {software.name}{" "}
                  <span className="rounded-2xl bg-[var(--color-brand)] px-3 py-0.5 whitespace-nowrap text-[var(--color-brand-ink)]">
                    up close
                  </span>
                </h2>
                <p className="text-base leading-relaxed text-muted-foreground">
                  A look at the screens you&apos;ll spend your day in.
                </p>
              </div>
              <div className="rounded-[1.75rem] bg-zinc-100/80 p-2 dark:bg-zinc-900/60">
                <div className="rounded-[1.4rem] border border-zinc-200/70 bg-card p-3 sm:p-4 dark:border-zinc-800">
                  <ScreenshotCarousel screenshots={screenshots} productName={software.name} />
                </div>
              </div>
            </section>
          )}

          {/* Ratings breakdown */}
          <section id="ratings" aria-labelledby="ratings-h" className="scroll-mt-32 space-y-6">
            <div className="mx-auto flex max-w-xl flex-col items-center gap-5 pb-2 text-center">
              <p className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground/80">
                <BarChart3 className="size-4 text-muted-foreground" aria-hidden="true" />
                Ratings
              </p>
              <h2
                id="ratings-h"
                className="font-heading text-3xl font-medium tracking-tight text-balance sm:text-[2.6rem] sm:leading-[1.18]"
              >
                The rating,{" "}
                <span className="rounded-2xl bg-[var(--color-brand)] px-3 py-0.5 whitespace-nowrap text-[var(--color-brand-ink)]">
                  broken down
                </span>
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground">
                Every score below comes from verified reviews. Nothing is weighted or edited.
              </p>
            </div>
            <div className="space-y-2 rounded-[1.75rem] bg-zinc-100/80 p-2 dark:bg-zinc-900/60">
              <div className="grid gap-2 md:grid-cols-[280px_1fr]">
                <div className="flex flex-col items-center justify-center gap-3 rounded-[1.4rem] border border-zinc-200/70 bg-card p-8 dark:border-zinc-800">
                  <CircularRating rating={software.overall_rating} size={104} color={accent} />
                  <StarRating rating={software.overall_rating} size={16} />
                  <p className="text-sm text-muted-foreground">
                    {formatNumber(software.review_count)} verified{" "}
                    {software.review_count === 1 ? "review" : "reviews"}
                  </p>
                </div>
                <div className="space-y-2.5 rounded-[1.4rem] border border-zinc-200/70 bg-card p-6 sm:p-7 dark:border-zinc-800">
                  {([5, 4, 3, 2, 1] as const).map((star) => (
                    <RatingBar
                      key={star}
                      label={`${star} star${star > 1 ? "s" : ""}`}
                      value={distribution[star]}
                      max={Math.max(1, totalRatings)}
                      color={accent}
                      suffix={formatNumber(distribution[star])}
                    />
                  ))}
                  <SentimentBar distribution={distribution} className="pt-3" />
                </div>
              </div>
              <div className="grid gap-2 lg:grid-cols-2">
                <div className="rounded-[1.4rem] border border-zinc-200/70 bg-card p-6 sm:p-7 dark:border-zinc-800">
                  <h3 className="mb-4 font-heading text-base font-bold">Ratings by dimension</h3>
                  <SoftwareRatingsChart software={software} accent={accent} />
                </div>
                <div className="rounded-[1.4rem] border border-zinc-200/70 bg-card p-6 sm:p-7 dark:border-zinc-800">
                  <h3 className="mb-4 font-heading text-base font-bold">Reviewer company size</h3>
                  <CompanySizeChart reviews={reviews} />
                </div>
              </div>
            </div>
          </section>

          {/* Compare with a popular alternative */}
          {alternatives.length > 0 && (
            <section id="compare" aria-labelledby="compare-h" className="scroll-mt-32 space-y-6">
              <div className="mx-auto flex max-w-xl flex-col items-center gap-5 pb-2 text-center">
                <p className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground/80">
                  <Scale className="size-4 text-muted-foreground" aria-hidden="true" />
                  Head to head
                </p>
                <h2
                  id="compare-h"
                  className="font-heading text-3xl font-medium tracking-tight text-balance sm:text-[2.6rem] sm:leading-[1.18]"
                >
                  Compare with a{" "}
                  <span className="rounded-2xl bg-[var(--color-brand)] px-3 py-0.5 whitespace-nowrap text-[var(--color-brand-ink)]">
                    popular alternative
                  </span>
                </h2>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {software.name} against {alternatives[0].name}, side by side. Same verified
                  review data, no weighting.
                </p>
              </div>
              <CompareAlternative software={software} alternative={alternatives[0]} />
            </section>
          )}

          {/* Reviews preview */}
          <section id="reviews" aria-labelledby="reviews-h" className="scroll-mt-32 space-y-6">
            <div className="mx-auto flex max-w-xl flex-col items-center gap-5 pb-2 text-center">
              <p className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground/80">
                <Star className="size-4 text-muted-foreground" aria-hidden="true" />
                Reviews
              </p>
              <h2
                id="reviews-h"
                className="font-heading text-3xl font-medium tracking-tight text-balance sm:text-[2.6rem] sm:leading-[1.18]"
              >
                What users{" "}
                <span className="rounded-2xl bg-[var(--color-brand)] px-3 py-0.5 whitespace-nowrap text-[var(--color-brand-ink)]">
                  really think
                </span>
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground">
                {formatNumber(software.review_count)} verified reviews from people who use{" "}
                {software.name} in their own business.
              </p>
              <VerifiedBadges />
            </div>
            <div className="rounded-[1.75rem] bg-zinc-100/80 p-2 dark:bg-zinc-900/60">
              {reviews.length === 0 ? (
                <div className="space-y-4 rounded-[1.4rem] border border-zinc-200/70 bg-card p-10 text-center dark:border-zinc-800">
                  <p className="text-muted-foreground">
                    No reviews yet. Be the first to share your experience.
                  </p>
                  <Link
                    href={`/software/${software.slug}/reviews/new`}
                    className="btn-glossy inline-flex items-center gap-2 px-5 py-2.5 text-sm"
                  >
                    <PenLine className="size-4" /> Write a review
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {reviews.slice(0, 3).map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                  {/* Closing band — read all reviews */}
                  <div className="flex flex-col gap-6 px-6 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                    <div className="max-w-lg space-y-1.5">
                      <h3 className="font-heading text-xl font-medium tracking-tight sm:text-2xl">
                        Read every review before you decide
                      </h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        The full archive, unedited. Or add your own and help the next buyer.
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-3">
                      <Link
                        href={`/software/${software.slug}/reviews`}
                        className="btn-glossy btn-glossy-dark group/cta relative inline-flex h-12 items-center overflow-hidden px-14 text-sm"
                      >
                        <span
                          aria-hidden="true"
                          className="absolute inset-y-1.5 left-1.5 grid w-10 place-items-center rounded-[0.55rem] bg-[var(--color-brand)] text-[var(--color-brand-ink)] transition-[left,background-color] duration-300 ease-out group-hover/cta:left-[calc(100%-2.875rem)] group-hover/cta:bg-transparent"
                        >
                          <ArrowRight className="size-4" />
                        </span>
                        All {formatNumber(software.review_count)} reviews
                      </Link>
                      <Link
                        href={`/software/${software.slug}/reviews/new`}
                        className="btn-glossy btn-glossy-white inline-flex h-12 items-center gap-2 px-5 text-sm"
                      >
                        <PenLine className="size-4" /> Write a review
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Alternatives */}
          {alternatives.length > 0 && (
            <section
              id="alternatives"
              aria-labelledby="alternatives-h"
              className="scroll-mt-32 space-y-6"
            >
              <div className="mx-auto flex max-w-xl flex-col items-center gap-5 pb-2 text-center">
                <p className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground/80">
                  <ArrowLeftRight className="size-4 text-muted-foreground" aria-hidden="true" />
                  Alternatives
                </p>
                <h2
                  id="alternatives-h"
                  className="font-heading text-3xl font-medium tracking-tight text-balance sm:text-[2.6rem] sm:leading-[1.18]"
                >
                  If {software.name} isn&apos;t{" "}
                  <span className="rounded-2xl bg-[var(--color-brand)] px-3 py-0.5 whitespace-nowrap text-[var(--color-brand-ink)]">
                    the right fit
                  </span>
                </h2>
                <p className="text-base leading-relaxed text-muted-foreground">
                  The closest competitors South African buyers weigh up, ranked by rating.
                </p>
              </div>
              <div className="rounded-[1.75rem] bg-zinc-100/80 p-2 dark:bg-zinc-900/60">
                <div className="grid gap-2 md:grid-cols-3">
                  {alternatives.map((alternative, index) => (
                    <AlternativeCard
                      key={alternative.id}
                      software={alternative}
                      originalSlug={software.slug}
                      rank={index + 1}
                    />
                  ))}
                </div>
              </div>
              <div className="text-center">
                <Link
                  href={`/software/${software.slug}/alternatives`}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-brand-dark)] hover:underline"
                >
                  See all alternatives <ArrowRight className="size-4" />
                </Link>
              </div>
            </section>
          )}

          {/* FAQs */}
          <section id="faqs" aria-labelledby="faqs-h" className="scroll-mt-32 space-y-6">
            <div className="mx-auto flex max-w-xl flex-col items-center gap-5 pb-2 text-center">
              <p className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground/80">
                <CircleHelp className="size-4 text-muted-foreground" aria-hidden="true" />
                FAQ
              </p>
              <h2
                id="faqs-h"
                className="font-heading text-3xl font-medium tracking-tight text-balance sm:text-[2.6rem] sm:leading-[1.18]"
              >
                We have the{" "}
                <span className="rounded-2xl bg-[var(--color-brand)] px-3 py-0.5 text-[var(--color-brand-ink)]">
                  answers
                </span>
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground">
                The questions South African buyers ask most about {software.name}, answered from
                the data on this page.
              </p>
            </div>
            <FaqAccordion items={faqs} />
          </section>
        </div>
      </div>
    </div>
  );
}
