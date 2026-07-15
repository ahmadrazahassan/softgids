import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { Pagination } from "@/components/public/Pagination";
import { formatDate, formatNumber } from "@/lib/format";
import { siteUrl } from "@/lib/site";
import { getArticles } from "@/lib/supabase/queries";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Blog — Software Guides for South African Businesses",
  description:
    "Buying guides, comparisons and compliance explainers — SARS, VAT201, payroll and POPIA — written for South African SMBs.",
  alternates: { canonical: `${siteUrl}/blog` },
};

const PER_PAGE = 9;

export default async function BlogPage(props: PageProps<"/blog">) {
  const searchParams = await props.searchParams;
  const single = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const page = Math.max(1, Number(single(searchParams.page)) || 1);

  const { items, total } = await getArticles(page, PER_PAGE);
  const totalPages = Math.ceil(total / PER_PAGE);
  const [featured, ...rest] = page === 1 ? items : [null, ...items];

  return (
    <div className="container-site space-y-14 py-10">
      <Breadcrumbs items={[{ name: "Blog" }]} />

      {/* ---------- Page hero — centered ---------- */}
      <header className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
        <p className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground/80">
          <BookOpen className="size-4 text-muted-foreground" aria-hidden="true" />
          The blog
        </p>
        <h1 className="font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl sm:leading-[1.12]">
          Guides for{" "}
          <span className="rounded-2xl bg-[var(--color-brand)] px-3 py-0.5 whitespace-nowrap text-[var(--color-brand-ink)]">
            South African buyers
          </span>
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground">
          Practical software guidance for South African businesses — from choosing accounting
          tools to surviving EMP501 season.
        </p>
      </header>

      {/* ---------- Articles ---------- */}
      <div className="rounded-[1.75rem] bg-zinc-100/80 p-2 dark:bg-zinc-900/60">
        <div className="space-y-2">
          {featured && (
            <article className="group relative flex flex-col gap-5 rounded-[1.4rem] border border-zinc-200/70 bg-card p-7 transition-colors duration-200 hover:border-zinc-300 sm:p-9 dark:border-zinc-800 dark:hover:border-zinc-700">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--color-brand)] px-3 py-1 text-xs font-bold text-[var(--color-brand-ink)]">
                  Latest
                </span>
                {featured.category_tag && (
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                    {featured.category_tag}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-2xl space-y-3">
                  <h2 className="font-heading text-2xl font-bold leading-snug tracking-tight text-balance sm:text-3xl">
                    <Link
                      href={`/blog/${featured.slug}`}
                      className="after:absolute after:inset-0"
                    >
                      {featured.title}
                    </Link>
                  </h2>
                  <p className="leading-relaxed text-muted-foreground">{featured.excerpt}</p>
                  <p className="text-sm text-muted-foreground">
                    {featured.author_name} · {formatDate(featured.published_date)} ·{" "}
                    {formatNumber(featured.read_time_minutes)} min read
                  </p>
                </div>
                <span
                  aria-hidden="true"
                  className="grid size-11 shrink-0 place-items-center rounded-xl bg-zinc-100 text-muted-foreground transition-colors duration-200 group-hover:bg-[var(--color-brand)] group-hover:text-[var(--color-brand-ink)] dark:bg-zinc-800"
                >
                  <ArrowUpRight className="size-5" />
                </span>
              </div>
            </article>
          )}

          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {rest.filter(Boolean).map((article) => (
              <article
                key={article!.id}
                className="group relative flex flex-col gap-4 rounded-[1.4rem] border border-zinc-200/70 bg-card p-6 transition-colors duration-200 hover:border-zinc-300 sm:p-7 dark:border-zinc-800 dark:hover:border-zinc-700"
              >
                {article!.category_tag && (
                  <span className="w-fit rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                    {article!.category_tag}
                  </span>
                )}
                <h2 className="font-heading text-lg font-bold leading-snug tracking-tight">
                  <Link href={`/blog/${article!.slug}`} className="after:absolute after:inset-0">
                    {article!.title}
                  </Link>
                </h2>
                <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {article!.excerpt}
                </p>
                <div className="mt-auto flex items-end justify-between gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                  <p className="text-xs text-muted-foreground">
                    {article!.author_name}
                    <br />
                    {formatDate(article!.published_date)} ·{" "}
                    {formatNumber(article!.read_time_minutes)} min read
                  </p>
                  <span
                    aria-hidden="true"
                    className="grid size-9 shrink-0 place-items-center rounded-xl bg-zinc-100 text-muted-foreground transition-colors duration-200 group-hover:bg-[var(--color-brand)] group-hover:text-[var(--color-brand-ink)] dark:bg-zinc-800"
                  >
                    <ArrowUpRight className="size-4" />
                  </span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <Pagination currentPage={page} totalPages={totalPages} basePath="/blog" />
    </div>
  );
}
