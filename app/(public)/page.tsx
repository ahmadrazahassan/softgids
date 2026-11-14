import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Clock3 } from "lucide-react";
import { SearchBar } from "@/components/public/SearchBar";
import { HomepageExplore } from "@/components/public/HomepageExplore";
import { HomepageCompare } from "@/components/public/HomepageCompare";
import { NewsletterSection } from "@/components/public/NewsletterSection";
import { RecentSoftwareCard } from "@/components/public/RecentSoftwareCard";
import { SoftwareCard } from "@/components/public/SoftwareCard";
import { formatDate, formatNumber } from "@/lib/format";
import { SITE_NAME, SITE_TAGLINE, siteUrl } from "@/lib/site";
import {
  getCategories,
  getLatestArticles,
  getPublishedComparisons,
  getRecentlyUpdatedSoftware,
  getSiteStats,
  getRatingDistribution,
  getSoftwareList,
} from "@/lib/supabase/queries";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: `${SITE_NAME} — ${SITE_TAGLINE}`,
  description:
    "Compare accounting, payroll, HR, CRM, ERP and project management software with verified reviews from South African businesses. ZAR pricing, SARS-ready recommendations.",
  alternates: { canonical: siteUrl },
};

const POPULAR_TAGS = [
  { label: "Accounting Software", href: "/category/accounting-software" },
  { label: "Payroll", href: "/category/payroll-software" },
  { label: "HR Software", href: "/category/hr-software" },
  { label: "CRM", href: "/category/crm-software" },
  { label: "ERP", href: "/category/erp-software" },
];

/** Centered section header used across the home page. */
function SectionHeader({
  eyebrow,
  title,
  subtitle,
  id,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  id: string;
}) {
  return (
    <div className="reveal-on-scroll mx-auto max-w-2xl space-y-4 text-center">
      <p className="mx-auto inline-flex w-fit items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground/80">
        <span aria-hidden="true" className="size-2 rounded-full bg-[var(--color-brand)]" />
        {eyebrow}
      </p>
      <h2
        id={id}
        className="font-heading text-3xl font-bold tracking-tight text-balance sm:text-[2.75rem] sm:leading-[1.05]"
      >
        {title}
      </h2>
      {subtitle && (
        <p className="mx-auto max-w-xl text-base leading-relaxed text-pretty text-muted-foreground">
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default async function HomePage() {
  const [categories, comparisons, recent, articles, stats, directory] =
    await Promise.all([
      getCategories(),
      getPublishedComparisons(),
      getRecentlyUpdatedSoftware(3),
      getLatestArticles(3),
      getSiteStats(),
      getSoftwareList({ perPage: 60 }),
    ]);

  /* Homepage ranking is review-weighted, not a raw star average. A product
     with hundreds of verified reviews at 4.1★ is a stronger "favourite" than
     one with 30 reviews at 4.3★, so we blend each rating toward the platform
     mean by review volume (the Bayesian average that review marketplaces use).
     Scoped to the home page; category and directory pages keep their own sorts. */
  const rated = directory.items.filter((s) => s.review_count > 0);
  const meanRating = rated.length
    ? rated.reduce((sum, s) => sum + s.overall_rating, 0) / rated.length
    : 4.1;
  const volumes = rated.map((s) => s.review_count).sort((a, b) => a - b);
  const priorWeight = volumes.length ? volumes[Math.floor(volumes.length / 2)] : 50;
  const weightedScore = (s: (typeof directory.items)[number]) =>
    (s.review_count * s.overall_rating + priorWeight * meanRating) /
    (s.review_count + priorWeight);
  const byScore = (a: (typeof directory.items)[number], b: (typeof directory.items)[number]) =>
    weightedScore(b) - weightedScore(a) || b.review_count - a.review_count;

  const topRated = [...directory.items].sort(byScore).slice(0, 6);

  /* live star distributions for the top rated cards' sentiment strips */
  const distributions = await Promise.all(
    topRated.map((s) => getRatingDistribution(s.id))
  );
  const distributionById = new Map(topRated.map((s, i) => [s.id, distributions[i]]));

  const softwareByCategory: Record<string, typeof directory.items> = {};
  for (const category of categories) {
    softwareByCategory[category.slug] = directory.items
      .filter((s) => s.category_id === category.id)
      .sort(byScore);
  }

  const categoryNameById = new Map(
    categories.map((c) => [c.id, c.name.replace(" Software", "")])
  );

  const heroStats = [
    {
      icon: "/assets/shape-cube-pink.png",
      value: formatNumber(stats.reviews),
      label: "Verified reviews",
    },
    {
      icon: "/assets/shape-cylinder.png",
      value: `${formatNumber(stats.software)}+`,
      label: "Software listed",
    },
    {
      icon: "/assets/shape-cube-blue.png",
      value: formatNumber(stats.categories),
      label: "Categories covered",
    },
  ];

  return (
    <div className="space-y-16 pb-16 sm:space-y-24 sm:pb-24">
      {/* ---------- Hero ---------- */}
      <section aria-label="Hero" className="container-site pt-4 sm:pt-6 lg:pt-10">
        <div className="relative">
          {/* Photo card */}
          <div className="relative overflow-hidden rounded-[1.75rem] shadow-[0_40px_80px_-40px_rgba(15,23,42,0.35)] sm:rounded-[2.5rem]">
            <Image
              src="/hero-section.jpg"
              alt=""
              fill
              priority
              sizes="(min-width: 1440px) 1344px, 100vw"
              className="object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-white/25 [background:radial-gradient(70%_60%_at_50%_45%,rgba(255,255,255,0.55),rgba(255,255,255,0.12))]"
            />

            {/* Floating 3D shapes */}
            <Image
              src="/assets/shape-donut.png"
              alt=""
              width={110}
              height={110}
              aria-hidden="true"
              className="pointer-events-none absolute top-10 left-[6%] hidden w-16 [animation:var(--animate-float)] sm:block lg:w-24"
            />
            <Image
              src="/assets/shape-star.png"
              alt=""
              width={120}
              height={120}
              aria-hidden="true"
              className="pointer-events-none absolute top-8 right-[5%] hidden w-16 [animation:var(--animate-float-delayed)] sm:block lg:w-24"
            />
            <Image
              src="/assets/shape-spring.png"
              alt=""
              width={140}
              height={140}
              aria-hidden="true"
              className="pointer-events-none absolute right-[7%] bottom-10 hidden w-20 [animation:var(--animate-float)] sm:block lg:w-28"
            />
            <Image
              src="/assets/shape-cube-blue.png"
              alt=""
              width={90}
              height={90}
              aria-hidden="true"
              className="pointer-events-none absolute bottom-12 left-[9%] hidden w-14 [animation:var(--animate-float-delayed)] sm:block lg:w-20"
            />

            {/* Centered hero content */}
            <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-5 px-5 py-14 text-center sm:gap-6 sm:px-6 sm:py-28 lg:py-32">
              <h1 className="font-heading text-[2rem] leading-[1.1] font-extrabold tracking-tight text-balance text-zinc-900 sm:text-6xl lg:text-7xl">
                Find the right software
              </h1>
              <p className="max-w-xl text-base text-zinc-700 sm:text-lg">
                Explore, compare and choose the best fit for your South African business. Verified
                reviews, pricing in rand, and recommendations built for SARS compliance.
              </p>
              <SearchBar className="max-w-xl" />
              <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
                <span className="text-xs font-bold tracking-widest text-zinc-600 uppercase">
                  Popular:
                </span>
                {POPULAR_TAGS.map((tag) => (
                  <Link
                    key={tag.href}
                    href={tag.href}
                    className="rounded-full bg-white/90 px-4 py-1.5 text-sm font-semibold text-zinc-800 shadow-[0_4px_12px_-4px_rgba(15,23,42,0.25)] backdrop-blur transition-all hover:-translate-y-0.5 hover:bg-white"
                  >
                    {tag.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <dl className="card-modern relative z-10 mx-auto -mt-8 grid w-[min(100%,64rem)] grid-cols-1 divide-y divide-zinc-100 rounded-[1.5rem] bg-card px-5 py-4 sm:-mt-10 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:rounded-[2rem] sm:px-8 sm:py-7 dark:divide-zinc-800">
            {heroStats.map(({ icon, value, label }) => (
              <div key={label} className="flex items-center justify-center gap-4 py-3.5 sm:gap-5 sm:py-0">
                <Image
                  src={icon}
                  alt=""
                  width={64}
                  height={64}
                  aria-hidden="true"
                  className="size-12 shrink-0 object-contain drop-shadow-[0_10px_15px_rgba(15,23,42,0.2)] sm:size-14"
                />
                <div className="text-left">
                  <dd className="font-heading text-2xl font-extrabold tabular-nums tracking-tight sm:text-3xl">
                    {value}
                  </dd>
                  <dt className="text-[0.7rem] font-bold tracking-widest text-muted-foreground uppercase sm:text-xs">
                    {label}
                  </dt>
                </div>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ---------- Category explorer ---------- */}
      <section aria-labelledby="explore-heading" className="container-site space-y-10">
        <SectionHeader
          id="explore-heading"
          eyebrow="Explore by category"
          title="Find the right tool for the job"
          subtitle="Every product is assessed against real South African requirements, from VAT201 returns and eFiling to EMP201 payroll submissions."
        />
        <div className="reveal-on-scroll">
          <HomepageExplore categories={categories} softwareByCategory={softwareByCategory} />
        </div>
      </section>

      {/* ---------- Comparisons strip ---------- */}
      <HomepageCompare comparisons={comparisons} />

      {/* ---------- Top rated ---------- */}
      <section aria-labelledby="top-rated-heading" className="container-site space-y-10">
        <SectionHeader
          id="top-rated-heading"
          eyebrow="Community favourites"
          title="The best reviewed software"
          subtitle="Ranked by verified reviews and ratings from South African businesses. Vendors cannot pay their way to the top."
        />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {topRated.map((software) => (
            <div key={software.id} className="reveal-on-scroll min-w-0">
              <SoftwareCard
                software={software}
                categoryName={
                  software.category_id ? categoryNameById.get(software.category_id) : undefined
                }
                distribution={distributionById.get(software.id)}
                slot="home-card"
              />
            </div>
          ))}
        </div>
        <div className="text-center">
          <Link
            href="/software"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--color-brand-dark)] hover:underline"
          >
            Browse the full directory <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* ---------- Newsletter ---------- */}
      <NewsletterSection />

      {/* ---------- Recently reviewed ---------- */}
      <section aria-labelledby="recent-heading" className="container-site space-y-6">
        <div className="reveal-on-scroll mx-auto flex max-w-xl flex-col items-center gap-5 pb-2 text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground/80">
            <Clock3 className="size-4 text-muted-foreground" aria-hidden="true" />
            Fresh on the platform
          </p>
          <h2
            id="recent-heading"
            className="font-heading text-3xl font-medium tracking-tight text-balance sm:text-[2.6rem] sm:leading-[1.18]"
          >
            Recently{" "}
            <span className="rounded-2xl bg-[var(--color-brand)] px-3 py-0.5 whitespace-nowrap text-[var(--color-brand-ink)]">
              reviewed
            </span>
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            The latest software to earn verified reviews from South African teams.
          </p>
        </div>
        <div className="reveal-on-scroll rounded-[1.75rem] bg-zinc-100/80 p-2 dark:bg-zinc-900/60">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            {recent.map((software, index) => (
              <RecentSoftwareCard key={software.id} software={software} rank={index + 1} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Blog preview ---------- */}
      <section aria-labelledby="blog-heading" className="container-site space-y-10">
        <SectionHeader
          id="blog-heading"
          eyebrow="From the blog"
          title="Guides for South African buyers"
        />
        <div className="mx-auto max-w-3xl">
          {articles.map((article, index) => (
            <article
              key={article.id}
              className="group reveal-on-scroll relative flex gap-5 border-t border-border py-7 first:border-t-0 sm:gap-8"
            >
              <span
                aria-hidden="true"
                className="pt-1 font-heading text-2xl font-extrabold tabular-nums text-zinc-200 transition-colors duration-200 group-hover:text-[var(--color-brand-dark)] sm:text-3xl dark:text-zinc-700"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1 space-y-2">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-muted-foreground">
                  {article.category_tag && (
                    <span className="rounded-md bg-[var(--color-brand-light)] px-2 py-0.5 font-bold text-[var(--color-brand-dark)] dark:bg-[color-mix(in_srgb,var(--color-brand)_20%,transparent)] dark:text-[var(--color-brand-dark)]">
                      {article.category_tag}
                    </span>
                  )}
                  <span>{formatDate(article.published_date)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{formatNumber(article.read_time_minutes)} min read</span>
                </p>
                <h3 className="font-heading text-xl font-bold leading-snug tracking-tight sm:text-2xl">
                  <Link
                    href={`/blog/${article.slug}`}
                    className="transition-colors duration-200 after:absolute after:inset-0 group-hover:text-[var(--color-brand-dark)]"
                  >
                    {article.title}
                  </Link>
                </h3>
                <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {article.excerpt}
                </p>
                <p className="text-xs text-muted-foreground">By {article.author_name}</p>
              </div>
              <span className="hidden size-10 shrink-0 place-items-center self-center rounded-xl border border-border text-muted-foreground transition-all duration-200 group-hover:border-transparent group-hover:bg-[var(--color-brand)] group-hover:text-[var(--color-brand-ink)] sm:grid">
                <ArrowUpRight className="size-4" />
              </span>
            </article>
          ))}
        </div>
        <div className="text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--color-brand-dark)] hover:underline"
          >
            All articles <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
