import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BadgeCheck, Trophy } from "lucide-react";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { CategoryIcon } from "@/components/public/CategoryIcon";
import { SoftwareListRow } from "@/components/public/SoftwareListRow";
import { formatNumber } from "@/lib/format";
import { breadcrumbJsonLd, JsonLd } from "@/lib/jsonld";
import { siteUrl } from "@/lib/site";
import { getCategoryBySlug, getSoftwareList } from "@/lib/supabase/queries";

export const revalidate = 3600;

export async function generateMetadata(
  props: PageProps<"/category/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category not found" };
  const year = new Date().getFullYear();
  return {
    title: `Best ${category.name} in South Africa ${year}`,
    description: `${category.description ?? ""} Compare the top options with verified reviews and ZAR pricing.`,
    alternates: { canonical: `${siteUrl}/category/${category.slug}` },
  };
}

export default async function CategoryPage(props: PageProps<"/category/[slug]">) {
  const { slug } = await props.params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const list = await getSoftwareList({ category: slug, sort: "rating", perPage: 50 });
  const year = new Date().getFullYear();

  return (
    <div className="container-site space-y-14 py-10">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Categories", href: "/categories" },
          { name: category.name, href: `/category/${category.slug}` },
        ])}
      />
      <Breadcrumbs
        items={[{ name: "Categories", href: "/categories" }, { name: category.name }]}
      />

      {/* ---------- Category hero — centered ---------- */}
      <header className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
        <span className="grid size-16 shrink-0 place-items-center rounded-3xl bg-[var(--color-brand-light)] text-[var(--color-brand-dark)] dark:bg-[color-mix(in_srgb,var(--color-brand)_16%,transparent)] dark:text-[var(--color-brand-dark)]">
          <CategoryIcon icon={category.icon} className="size-8" />
        </span>
        <h1 className="font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl sm:leading-[1.12]">
          Best {category.name.toLowerCase()} in{" "}
          <span className="rounded-2xl bg-[var(--color-brand)] px-3 py-0.5 whitespace-nowrap text-[var(--color-brand-ink)]">
            South Africa {year.toLocaleString("en-ZA", { useGrouping: false })}
          </span>
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-pretty text-muted-foreground">
          {category.description}
        </p>
        <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <BadgeCheck className="size-4 text-[var(--color-brand-dark)]" aria-hidden="true" />
          {formatNumber(list.total)} {list.total === 1 ? "product" : "products"}, ranked by
          verified user ratings — vendors can&apos;t pay for position.
        </p>
      </header>

      {/* ---------- Ranked list ---------- */}
      {list.items.length === 0 ? (
        <div className="rounded-[1.75rem] bg-zinc-100/80 p-2 dark:bg-zinc-900/60">
          <div className="rounded-[1.4rem] border border-zinc-200/70 bg-card p-12 text-center text-muted-foreground dark:border-zinc-800">
            No published software in this category yet.
          </div>
        </div>
      ) : (
        <section aria-labelledby="ranking-h" className="space-y-6">
          <div className="mx-auto flex max-w-xl flex-col items-center gap-5 pb-2 text-center">
            <p className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground/80">
              <Trophy className="size-4 text-muted-foreground" aria-hidden="true" />
              The ranking
            </p>
            <h2
              id="ranking-h"
              className="font-heading text-3xl font-medium tracking-tight text-balance sm:text-[2.6rem] sm:leading-[1.18]"
            >
              Every option,{" "}
              <span className="rounded-2xl bg-[var(--color-brand)] px-3 py-0.5 whitespace-nowrap text-[var(--color-brand-ink)]">
                ranked by users
              </span>
            </h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Ordered purely by verified ratings from South African businesses. Pricing shown in
              rand, as billed.
            </p>
          </div>
          <div className="rounded-[1.75rem] bg-zinc-100/80 p-2 dark:bg-zinc-900/60">
            <div className="space-y-2">
              {list.items.map((software, index) => (
                <SoftwareListRow
                  key={software.id}
                  software={software}
                  rank={index + 1}
                  className="rounded-[1.4rem] border-zinc-200/70"
                />
              ))}

              {/* Closing band — build a comparison */}
              <div className="flex flex-col gap-6 px-6 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <div className="max-w-lg space-y-1.5">
                  <h3 className="font-heading text-xl font-medium tracking-tight sm:text-2xl">
                    Torn between two of these?
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Put any two products side by side — ratings, features and rand pricing in one
                    view.
                  </p>
                </div>
                <Link
                  href="/compare"
                  className="btn-glossy btn-glossy-dark group/cta relative inline-flex h-12 shrink-0 items-center overflow-hidden px-14 text-sm"
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-1.5 left-1.5 grid w-10 place-items-center rounded-[0.55rem] bg-[var(--color-brand)] text-[var(--color-brand-ink)] transition-[left,background-color] duration-300 ease-out group-hover/cta:left-[calc(100%-2.875rem)] group-hover/cta:bg-transparent"
                  >
                    <ArrowRight className="size-4" />
                  </span>
                  Build a comparison
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
