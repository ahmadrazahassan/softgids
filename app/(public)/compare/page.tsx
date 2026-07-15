import type { Metadata } from "next";
import { ArrowLeftRight, Swords } from "lucide-react";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { CompareSelector } from "@/components/public/CompareSelector";
import { ComparisonCard } from "@/components/public/ComparisonCard";
import { siteUrl } from "@/lib/site";
import {
  getCategories,
  getPublishedComparisons,
  getSoftwareList,
} from "@/lib/supabase/queries";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Compare Business Software Side by Side",
  description:
    "Head-to-head comparisons of accounting, payroll, HR, CRM and project management software for South African businesses, with ratings, rand pricing and clear verdicts.",
  alternates: { canonical: `${siteUrl}/compare` },
};

export default async function ComparePage() {
  const [comparisons, list, categories] = await Promise.all([
    getPublishedComparisons(),
    getSoftwareList({ perPage: 100 }),
    getCategories(),
  ]);

  const options = list.items.map((software) => ({
    name: software.name,
    slug: software.slug,
    category: categories.find((c) => c.id === software.category_id)?.name ?? null,
  }));

  const trending = comparisons.filter((c) => c.software_a && c.software_b);

  return (
    <div className="container-site space-y-14 py-10">
      <Breadcrumbs items={[{ name: "Compare" }]} />

      {/* ---------- Page hero — centered ---------- */}
      <header className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
        <p className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground/80">
          <ArrowLeftRight className="size-4 text-muted-foreground" aria-hidden="true" />
          Compare
        </p>
        <h1 className="font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl sm:leading-[1.12]">
          Compare software,{" "}
          <span className="rounded-2xl bg-[var(--color-brand)] px-3 py-0.5 whitespace-nowrap text-[var(--color-brand-ink)]">
            side by side
          </span>
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground">
          Put any two products next to each other and see how they stack up on ratings, features
          and rand pricing. Not sure where to start? Take one of the popular match-ups below.
        </p>
      </header>

      {/* ---------- Build your own ---------- */}
      <section
        aria-label="Build your own comparison"
        className="mx-auto w-full max-w-3xl rounded-[1.75rem] bg-zinc-100/80 p-2 dark:bg-zinc-900/60"
      >
        <div className="rounded-[1.4rem] border border-zinc-200/70 bg-card p-6 sm:p-8 dark:border-zinc-800">
          <p className="mb-4 text-center text-xs font-bold tracking-[0.2em] text-[var(--color-brand-dark)] uppercase">
            Build your own comparison
          </p>
          <CompareSelector options={options} />
        </div>
      </section>

      {/* ---------- Popular head-to-heads ---------- */}
      {trending.length > 0 && (
        <section aria-labelledby="trending-h" className="space-y-6">
          <div className="mx-auto flex max-w-xl flex-col items-center gap-5 pb-2 text-center">
            <p className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground/80">
              <Swords className="size-4 text-muted-foreground" aria-hidden="true" />
              Head to head
            </p>
            <h2
              id="trending-h"
              className="font-heading text-3xl font-medium tracking-tight text-balance sm:text-[2.6rem] sm:leading-[1.18]"
            >
              The match-ups buyers{" "}
              <span className="rounded-2xl bg-[var(--color-brand)] px-3 py-0.5 whitespace-nowrap text-[var(--color-brand-ink)]">
                research most
              </span>
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Every comparison comes with verified ratings, rand pricing and a clear verdict.
            </p>
          </div>
          <div className="rounded-[1.75rem] bg-zinc-100/80 p-2 dark:bg-zinc-900/60">
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {trending.map((comparison) => (
                <ComparisonCard
                  key={comparison.id}
                  a={comparison.software_a!}
                  b={comparison.software_b!}
                  className="rounded-[1.4rem] border-zinc-200/70"
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
