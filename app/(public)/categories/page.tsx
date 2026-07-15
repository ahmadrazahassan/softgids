import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, LayoutGrid } from "lucide-react";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { CategoryCard } from "@/components/public/CategoryCard";
import { siteUrl } from "@/lib/site";
import { getCategories, getSoftwareList } from "@/lib/supabase/queries";
import type { Software } from "@/lib/types";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Software Categories",
  description:
    "Browse business software by category: accounting, payroll, HR, CRM, ERP and project management tools reviewed for South African businesses.",
  alternates: { canonical: `${siteUrl}/categories` },
};

export default async function CategoriesPage() {
  const [categories, list] = await Promise.all([
    getCategories(),
    getSoftwareList({ perPage: 100 }),
  ]);

  const topByCategory = new Map<string, Software[]>();
  for (const category of categories) {
    const items = list.items
      .filter((s) => s.category_id === category.id)
      .sort((a, b) => b.overall_rating - a.overall_rating);
    topByCategory.set(category.id, items);
  }

  return (
    <div className="container-site space-y-14 py-10">
      <Breadcrumbs items={[{ name: "Categories" }]} />

      {/* ---------- Page hero — centered ---------- */}
      <header className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
        <p className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground/80">
          <LayoutGrid className="size-4 text-muted-foreground" aria-hidden="true" />
          Categories
        </p>
        <h1 className="font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl sm:leading-[1.12]">
          Software, sorted by{" "}
          <span className="rounded-2xl bg-[var(--color-brand)] px-3 py-0.5 whitespace-nowrap text-[var(--color-brand-ink)]">
            the job to do
          </span>
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground">
          Pick the job you need done. Every category is curated for South African businesses, from
          VAT201-ready accounting to payroll that keeps you square with SARS.
        </p>
      </header>

      {/* ---------- Category list ---------- */}
      <div className="rounded-[1.75rem] bg-zinc-100/80 p-2 dark:bg-zinc-900/60">
        <div className="space-y-2">
          {categories.map((category, index) => (
            <div
              key={category.id}
              className="rounded-[1.4rem] border border-zinc-200/70 bg-card px-6 transition-colors duration-200 hover:border-zinc-300 sm:px-8 dark:border-zinc-800 dark:hover:border-zinc-700"
            >
              <CategoryCard
                category={category}
                index={index + 1}
                topSoftware={topByCategory.get(category.id) ?? []}
                className="border-t-0"
              />
            </div>
          ))}

          {/* Closing band — full directory */}
          <div className="flex flex-col gap-6 px-6 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div className="max-w-lg space-y-1.5">
              <h3 className="font-heading text-xl font-medium tracking-tight sm:text-2xl">
                Rather see everything at once?
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                The full directory — every product, every category, ranked by verified ratings.
              </p>
            </div>
            <Link
              href="/software"
              className="btn-glossy btn-glossy-dark group/cta relative inline-flex h-12 shrink-0 items-center overflow-hidden px-14 text-sm"
            >
              <span
                aria-hidden="true"
                className="absolute inset-y-1.5 left-1.5 grid w-10 place-items-center rounded-[0.55rem] bg-[var(--color-brand)] text-[var(--color-brand-ink)] transition-[left,background-color] duration-300 ease-out group-hover/cta:left-[calc(100%-2.875rem)] group-hover/cta:bg-transparent"
              >
                <ArrowRight className="size-4" />
              </span>
              Browse the directory
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
