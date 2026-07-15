import type { Metadata } from "next";
import { Suspense } from "react";
import { BadgeCheck, Layers } from "lucide-react";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { DirectorySort } from "@/components/public/DirectorySort";
import { FilterSidebar } from "@/components/public/FilterSidebar";
import { Pagination } from "@/components/public/Pagination";
import { SoftwareListRow } from "@/components/public/SoftwareListRow";
import { formatNumber } from "@/lib/format";
import { siteUrl } from "@/lib/site";
import { getCategories, getSoftwareList } from "@/lib/supabase/queries";
import type { SoftwareSort } from "@/lib/types";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Business Software Reviews & Ratings",
  description:
    "Browse independent reviews of accounting, payroll, HR, CRM, ERP and project management software for South African businesses, with verified ratings and pricing in rand.",
  alternates: { canonical: `${siteUrl}/software` },
};

const PER_PAGE = 10;

export default async function SoftwareDirectoryPage(props: PageProps<"/software">) {
  const searchParams = await props.searchParams;

  const single = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const page = Math.max(1, Number(single(searchParams.page)) || 1);
  const sort = (single(searchParams.sort) as SoftwareSort) || "reviews";
  const category = single(searchParams.category);
  const rating = Number(single(searchParams.rating)) || undefined;

  const [categories, list] = await Promise.all([
    getCategories(),
    getSoftwareList({
      category,
      minRating: rating,
      freeTrial: searchParams.trial != null,
      freeVersion: searchParams.free != null,
      paidOnly: searchParams.paid != null,
      sort,
      page,
      perPage: PER_PAGE,
    }),
  ]);

  const totalPages = Math.ceil(list.total / PER_PAGE);
  const activeCategory = categories.find((c) => c.slug === category);
  const categoryNameById = new Map(
    categories.map((c) => [c.id, c.name.replace(" Software", "")])
  );

  const paginationParams: Record<string, string> = {};
  for (const key of ["category", "rating", "trial", "free", "paid", "sort"]) {
    const value = single(searchParams[key]);
    if (value != null) paginationParams[key] = value;
  }

  return (
    <div className="container-site space-y-12 py-10">
      <Breadcrumbs items={[{ name: "Software Reviews" }]} />

      {/* ---------- Page hero — centered ---------- */}
      <header className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
        <p className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground/80">
          <Layers className="size-4 text-muted-foreground" aria-hidden="true" />
          The directory
        </p>
        <h1 className="font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl sm:leading-[1.12]">
          {activeCategory ? activeCategory.name : "Business software"}{" "}
          <span className="rounded-2xl bg-[var(--color-brand)] px-3 py-0.5 whitespace-nowrap text-[var(--color-brand-ink)]">
            reviews
          </span>
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground">
          {activeCategory?.description ??
            "Every product here is reviewed by real South African business owners and managers. Compare ratings, features and pricing in rand, then decide with confidence."}
        </p>
        <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <BadgeCheck className="size-4 text-[var(--color-brand-dark)]" aria-hidden="true" />
          {formatNumber(list.total)} {list.total === 1 ? "product" : "products"}
          {activeCategory ? ` in ${activeCategory.name}` : ""}, ranked by verified ratings.
        </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[300px_1fr]">
        {/* Filters — plate-wrapped, sticky */}
        <Suspense>
          <div className="rounded-[1.75rem] bg-zinc-100/80 p-2 lg:sticky lg:top-24 dark:bg-zinc-900/60">
            <FilterSidebar categories={categories} />
          </div>
        </Suspense>

        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <p className="text-sm text-muted-foreground">
              {formatNumber(list.total)} {list.total === 1 ? "result" : "results"}
              {activeCategory ? ` in ${activeCategory.name}` : ""}
            </p>
            <Suspense>
              <DirectorySort />
            </Suspense>
          </div>

          {/* Results — flat rows on the grey plate */}
          <div className="rounded-[1.75rem] bg-zinc-100/80 p-2 dark:bg-zinc-900/60">
            {list.items.length === 0 ? (
              <div className="rounded-[1.4rem] border border-zinc-200/70 bg-card p-12 text-center text-muted-foreground dark:border-zinc-800">
                No software matches these filters yet. Try removing a filter or two.
              </div>
            ) : (
              <div className="space-y-2">
                {list.items.map((software, index) => (
                  <SoftwareListRow
                    key={software.id}
                    software={software}
                    rank={(page - 1) * PER_PAGE + index + 1}
                    categoryName={
                      software.category_id
                        ? categoryNameById.get(software.category_id)
                        : undefined
                    }
                    className="rounded-[1.4rem] border-zinc-200/70"
                  />
                ))}
              </div>
            )}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            basePath="/software"
            searchParams={paginationParams}
            className="pt-2"
          />
        </div>
      </div>
    </div>
  );
}
