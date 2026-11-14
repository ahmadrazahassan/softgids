import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftRight,
  ArrowRight,
  BarChart3,
  ListChecks,
  PiggyBank,
  Scale,
  type LucideIcon,
} from "lucide-react";
import { AffiliateCTAButton } from "@/components/public/AffiliateCTAButton";
import { AffiliateDisclosureNote } from "@/components/public/AffiliateDisclosureNote";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { CompareDashboard } from "@/components/public/CompareDashboard";
import { CompareStickyBar } from "@/components/public/CompareStickyBar";
import { ComparisonMatrix } from "@/components/public/ComparisonMatrix";
import { ComparisonTable } from "@/components/public/ComparisonTable";
import { PricingCards } from "@/components/public/PricingCards";
import { ProfileNav } from "@/components/public/ProfileNav";
import { SoftwareLogo } from "@/components/public/SoftwareLogo";
import { StarRating } from "@/components/public/StarRating";
import { brandColorFor } from "@/lib/brandColors";
import { formatNumber, formatRating } from "@/lib/format";
import { breadcrumbJsonLd, JsonLd, productJsonLd } from "@/lib/jsonld";
import { siteUrl } from "@/lib/site";
import { getComparisonRecord, getSoftwareBySlug } from "@/lib/supabase/queries";
import type { Software } from "@/lib/types";

export const revalidate = 3600;

function parsePair(pair: string): [string, string] | null {
  const index = pair.indexOf("-vs-");
  if (index <= 0) return null;
  const a = pair.slice(0, index);
  const b = pair.slice(index + 4);
  if (!a || !b || a === b) return null;
  return [a, b];
}

async function loadPair(pair: string): Promise<[Software, Software] | null> {
  const slugs = parsePair(pair);
  if (!slugs) return null;
  const [a, b] = await Promise.all([getSoftwareBySlug(slugs[0]), getSoftwareBySlug(slugs[1])]);
  if (!a || !b) return null;
  return [a, b];
}

export async function generateMetadata(
  props: PageProps<"/compare/[pair]">
): Promise<Metadata> {
  const { pair } = await props.params;
  const loaded = await loadPair(pair);
  if (!loaded) return { title: "Comparison not found" };
  const [a, b] = loaded;
  const year = new Date().getFullYear();
  return {
    title: `${a.name} vs ${b.name} (${year}) — Which Is Better for SA Businesses?`,
    description: `${a.name} vs ${b.name} compared on verified ratings, features and ZAR pricing — with a clear verdict for South African businesses.`,
    alternates: { canonical: `${siteUrl}/compare/${a.slug}-vs-${b.slug}` },
  };
}

function generatedVerdict(a: Software, b: Software): string {
  const [leader, runner] =
    a.overall_rating === b.overall_rating
      ? a.review_count >= b.review_count
        ? [a, b]
        : [b, a]
      : a.overall_rating > b.overall_rating
        ? [a, b]
        : [b, a];
  return `${leader.name} edges this comparison on verified user ratings (${formatRating(leader.overall_rating)} vs ${formatRating(runner.overall_rating)}), but the right choice depends on your workflows: ${runner.name} remains a strong pick where its strengths — ${runner.top_features.slice(0, 2).join(" and ") || "its core feature set"} — match your priorities. Shortlist both, take the free trials where offered, and test against a real month of your own data.`;
}

/** Centered section header in the profile-page style: icon pill, highlight, subtitle. */
function SectionHeading({
  id,
  icon: Icon,
  eyebrow,
  title,
  highlight,
  subtitle,
}: {
  id: string;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  highlight: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-5 pb-2 text-center">
      <p className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground/80">
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
        {eyebrow}
      </p>
      <h2
        id={id}
        className="font-heading text-3xl font-medium tracking-tight text-balance sm:text-[2.6rem] sm:leading-[1.18]"
      >
        {title}{" "}
        <span className="rounded-2xl bg-[var(--color-brand)] px-3 py-0.5 whitespace-nowrap text-[var(--color-brand-ink)]">
          {highlight}
        </span>
      </h2>
      {subtitle && <p className="text-base leading-relaxed text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

export default async function ComparisonPage(props: PageProps<"/compare/[pair]">) {
  const { pair } = await props.params;
  const loaded = await loadPair(pair);
  if (!loaded) notFound();
  const [a, b] = loaded;

  const record = await getComparisonRecord(a.id, b.id);
  const verdict = record?.custom_verdict ?? generatedVerdict(a, b);

  const hasFeatures = a.features.length > 0 || b.features.length > 0;
  const hasPricing = a.pricing_plans.length > 0 || b.pricing_plans.length > 0;

  const sections = [
    { id: "contenders", label: "Overview" },
    { id: "ratings", label: "Ratings" },
    { id: "head-to-head", label: "Head to head" },
    ...(hasFeatures ? [{ id: "features", label: "Features" }] : []),
    ...(hasPricing ? [{ id: "pricing", label: "Pricing" }] : []),
    { id: "verdict", label: "Verdict" },
  ];

  return (
    <div className="container-site space-y-16 py-10 pb-28">
      <JsonLd
        data={[
          productJsonLd(a),
          productJsonLd(b),
          breadcrumbJsonLd([
            { name: "Compare", href: "/compare" },
            { name: `${a.name} vs ${b.name}`, href: `/compare/${a.slug}-vs-${b.slug}` },
          ]),
        ]}
      />
      <Breadcrumbs
        items={[{ name: "Compare", href: "/compare" }, { name: `${a.name} vs ${b.name}` }]}
      />

      {/* ---------- Header ---------- */}
      <header id="contenders" className="scroll-mt-32 space-y-8">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
          <h1 className="font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl sm:leading-[1.12]">
            {a.name}{" "}
            <span className="rounded-2xl bg-[var(--color-brand)] px-3.5 py-0.5 text-[var(--color-brand-ink)]">
              vs
            </span>{" "}
            {b.name}
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-pretty text-muted-foreground">
            Verified ratings, feature-by-feature comparison and rand pricing — everything a South
            African business needs to pick between these two.
          </p>
        </div>
        <div className="rounded-[1.75rem] bg-zinc-100/80 p-2 dark:bg-zinc-900/60">
          <div className="grid gap-2 sm:grid-cols-2">
            {[a, b].map((software) => (
              <div
                key={software.id}
                className="flex flex-col items-center gap-4 rounded-[1.4rem] border border-zinc-200/70 bg-card p-8 text-center dark:border-zinc-800"
              >
                <SoftwareLogo software={software} size={64} />
                <div className="space-y-1">
                  <h2 className="font-heading text-xl font-bold">
                    <Link href={`/software/${software.slug}`} className="hover:underline">
                      {software.name}
                    </Link>
                  </h2>
                  <p className="text-sm text-muted-foreground">{software.tagline}</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-heading text-lg font-bold tabular-nums">
                    {formatRating(software.overall_rating)}
                  </span>
                  <StarRating rating={software.overall_rating} size={15} />
                  <span className="text-muted-foreground">
                    ({formatNumber(software.review_count)})
                  </span>
                </div>
                <div className="w-full max-w-60 space-y-2">
                  <AffiliateCTAButton
                    software={software}
                    slot="compare-hero"
                    accent={brandColorFor(software)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <AffiliateDisclosureNote className="justify-center text-center" />
      </header>

      <ProfileNav sections={sections} />

      {/* ---------- Ratings dashboard ---------- */}
      <section id="ratings" aria-labelledby="ratings-h" className="scroll-mt-32 space-y-6">
        <SectionHeading
          id="ratings-h"
          icon={BarChart3}
          eyebrow="Ratings"
          title="Every score,"
          highlight="at a glance"
          subtitle={`Verified user ratings across every dimension — ${a.name} against ${b.name}, nothing weighted.`}
        />
        <CompareDashboard a={a} b={b} />
      </section>

      {/* ---------- Comparison table ---------- */}
      <section id="head-to-head" aria-labelledby="table-h" className="scroll-mt-32 space-y-6">
        <SectionHeading
          id="table-h"
          icon={ArrowLeftRight}
          eyebrow="Head to head"
          title="Where each one"
          highlight="wins"
          subtitle="Row by row, with the stronger score highlighted. Straight from verified reviews."
        />
        <div className="rounded-[1.75rem] bg-zinc-100/80 p-2 dark:bg-zinc-900/60">
          <ComparisonTable a={a} b={b} />
        </div>
      </section>

      {/* ---------- Feature matrix ---------- */}
      {hasFeatures && (
        <section id="features" aria-labelledby="matrix-h" className="scroll-mt-32 space-y-6">
          <SectionHeading
            id="matrix-h"
            icon={ListChecks}
            eyebrow="Features"
            title="Feature by feature,"
            highlight="checked off"
            subtitle="Everything each product ships, side by side. No marketing gloss."
          />
          <div className="rounded-[1.75rem] bg-zinc-100/80 p-2 dark:bg-zinc-900/60">
            <ComparisonMatrix a={a} b={b} />
          </div>
        </section>
      )}

      {/* ---------- Pricing ---------- */}
      {hasPricing && (
      <section id="pricing" aria-labelledby="pricing-h" className="scroll-mt-32 space-y-10">
        <SectionHeading
          id="pricing-h"
          icon={PiggyBank}
          eyebrow="Pricing"
          title="Both price lists,"
          highlight="in rand"
          subtitle="Every plan from both vendors, priced as South African teams actually pay."
        />
        {[a, b].map((software) => (
          <div key={software.id} className="space-y-4">
            <h3 className="text-center font-heading text-lg font-bold">
              {software.name} plans
            </h3>
            <PricingCards
              plans={software.pricing_plans}
              currency={software.price_currency}
              software={software}
              slotPrefix="compare-pricing"
              freeTrial={software.free_trial}
              vendorName={software.vendor_name ?? software.name}
            />
          </div>
        ))}
      </section>
      )}

      {/* ---------- Verdict ---------- */}
      <section id="verdict" aria-labelledby="verdict-h" className="scroll-mt-32 space-y-6">
        <SectionHeading
          id="verdict-h"
          icon={Scale}
          eyebrow="Verdict"
          title="Our"
          highlight="verdict"
        />
        <div className="rounded-[1.75rem] bg-zinc-100/80 p-2 dark:bg-zinc-900/60">
          <div className="flex flex-col items-center gap-6 rounded-[1.4rem] border border-zinc-200/70 bg-card px-6 py-10 text-center sm:px-10 dark:border-zinc-800">
            <p className="max-w-2xl leading-relaxed text-foreground/85">{verdict}</p>
            <div className="flex flex-wrap justify-center gap-4 text-sm font-semibold">
              <Link
                href={`/software/${a.slug}`}
                className="inline-flex items-center gap-1 text-[var(--color-brand-dark)] hover:underline"
              >
                Full {a.name} review <ArrowRight className="size-4" />
              </Link>
              <Link
                href={`/software/${b.slug}`}
                className="inline-flex items-center gap-1 text-[var(--color-brand-dark)] hover:underline"
              >
                Full {b.name} review <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <CompareStickyBar a={a} b={b} />
    </div>
  );
}
