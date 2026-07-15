import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { SearchBar } from "@/components/public/SearchBar";
import { SoftwareListRow } from "@/components/public/SoftwareListRow";
import { formatDate, formatNumber } from "@/lib/format";
import { siteUrl } from "@/lib/site";
import { searchContent } from "@/lib/supabase/queries";

export const metadata: Metadata = {
  title: "Search",
  description: "Search software reviews, comparisons and articles on SoftGids.",
  alternates: { canonical: `${siteUrl}/search` },
  robots: { index: false },
};

export default async function SearchPage(props: PageProps<"/search">) {
  const searchParams = await props.searchParams;
  const raw = searchParams.q;
  const query = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";
  const results = query ? await searchContent(query) : { software: [], articles: [] };
  const totalResults = results.software.length + results.articles.length;

  return (
    <div className="container-site space-y-8 py-10">
      <Breadcrumbs items={[{ name: "Search" }]} />
      <header className="space-y-5">
        <h1 className="font-heading text-4xl font-bold tracking-tight">
          {query ? `Results for “${query}”` : "Search"}
        </h1>
        <SearchBar defaultValue={query} className="max-w-xl" autoFocus={!query} />
        {query && (
          <p className="text-sm text-muted-foreground">
            {formatNumber(totalResults)} {totalResults === 1 ? "result" : "results"} across
            software and articles
          </p>
        )}
      </header>

      {query && totalResults === 0 && (
        <div className="rounded-3xl border border-zinc-200 p-12 text-center text-muted-foreground dark:border-zinc-800">
          Nothing found for “{query}”. Try a product name (e.g. “Xero”) or a category
          (e.g. “payroll”).
        </div>
      )}

      {results.software.length > 0 && (
        <section aria-labelledby="software-results-h" className="space-y-5">
          <h2 id="software-results-h" className="font-heading text-2xl font-bold">
            Software ({formatNumber(results.software.length)})
          </h2>
          <div className="space-y-5">
            {results.software.map((software) => (
              <SoftwareListRow key={software.id} software={software} />
            ))}
          </div>
        </section>
      )}

      {results.articles.length > 0 && (
        <section aria-labelledby="article-results-h" className="space-y-5">
          <h2 id="article-results-h" className="font-heading text-2xl font-bold">
            Articles ({formatNumber(results.articles.length)})
          </h2>
          <ul className="space-y-3">
            {results.articles.map((article) => (
              <li key={article.id}>
                <Link
                  href={`/blog/${article.slug}`}
                  className="flex items-start gap-3 rounded-2xl border border-zinc-200 p-5 transition-colors hover:border-[var(--color-brand)] dark:border-zinc-800"
                >
                  <FileText className="mt-0.5 size-5 shrink-0 text-[var(--color-brand-dark)]" />
                  <span>
                    <span className="block font-heading font-bold">{article.title}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {article.excerpt} · {formatDate(article.published_date)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
