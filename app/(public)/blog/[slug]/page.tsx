import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight, BookOpen, Boxes } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { SoftwareCard } from "@/components/public/SoftwareCard";
import { formatDate, formatNumber } from "@/lib/format";
import { articleJsonLd, breadcrumbJsonLd, JsonLd } from "@/lib/jsonld";
import { siteUrl } from "@/lib/site";
import { getArticleBySlug, getLatestArticles } from "@/lib/supabase/queries";

export const revalidate = 3600;

export async function generateMetadata(props: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Article not found" };
  return {
    title: article.meta_title ?? article.title,
    description: article.meta_description ?? article.excerpt ?? undefined,
    alternates: { canonical: `${siteUrl}/blog/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt ?? undefined,
      url: `${siteUrl}/blog/${article.slug}`,
      publishedTime: article.published_date,
      authors: [article.author_name],
      images: [`/api/og?title=${encodeURIComponent(article.title)}&type=article`],
    },
  };
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export default async function ArticlePage(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const latest = (await getLatestArticles(4)).filter((a) => a.id !== article.id).slice(0, 3);

  return (
    <div className="container-site max-w-4xl space-y-14 py-10">
      <JsonLd
        data={[
          articleJsonLd(article),
          breadcrumbJsonLd([
            { name: "Blog", href: "/blog" },
            { name: article.title, href: `/blog/${article.slug}` },
          ]),
        ]}
      />
      <Breadcrumbs items={[{ name: "Blog", href: "/blog" }, { name: article.title }]} />

      {/* ---------- Article header — centered ---------- */}
      <header className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
        <p className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground/80">
          <BookOpen className="size-4 text-muted-foreground" aria-hidden="true" />
          {article.category_tag ?? "Guide"}
        </p>
        <h1 className="font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl sm:leading-[1.12]">
          {article.title}
        </h1>
        {article.excerpt && (
          <p className="max-w-xl text-lg leading-relaxed text-pretty text-muted-foreground">
            {article.excerpt}
          </p>
        )}
        <div className="flex items-center gap-3 text-left">
          <Avatar className="size-11 border border-border">
            <AvatarFallback className="bg-[var(--color-brand-light)] text-[var(--color-brand-dark)] dark:bg-[color-mix(in_srgb,var(--color-brand)_18%,transparent)] dark:text-[var(--color-brand-dark)]">
              {initials(article.author_name)}
            </AvatarFallback>
          </Avatar>
          <div className="text-sm">
            <p className="font-semibold">{article.author_name}</p>
            <p className="text-muted-foreground">
              {article.author_title ? `${article.author_title} · ` : ""}
              {formatDate(article.published_date)} ·{" "}
              {formatNumber(article.read_time_minutes)} min read
            </p>
          </div>
        </div>
      </header>

      {/* ---------- Article body ---------- */}
      <div
        className="article-content mx-auto max-w-3xl"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      {/* ---------- Author box ---------- */}
      <aside className="rounded-[1.75rem] bg-zinc-100/80 p-2 dark:bg-zinc-900/60">
        <div className="flex flex-col gap-4 rounded-[1.4rem] border border-zinc-200/70 bg-card p-6 sm:flex-row sm:items-center sm:p-7 dark:border-zinc-800">
          <Avatar className="size-14 border border-border">
            <AvatarFallback className="bg-[var(--color-brand-light)] text-lg text-[var(--color-brand-dark)] dark:bg-[color-mix(in_srgb,var(--color-brand)_18%,transparent)] dark:text-[var(--color-brand-dark)]">
              {initials(article.author_name)}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="font-heading font-bold">
              {article.author_name}
              {article.author_title && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {article.author_title}
                </span>
              )}
            </p>
            {article.author_bio && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {article.author_bio}
              </p>
            )}
          </div>
        </div>
      </aside>

      {/* ---------- Related software ---------- */}
      {article.related_software && (
        <section aria-labelledby="related-software-h" className="space-y-6">
          <div className="mx-auto flex max-w-xl flex-col items-center gap-5 pb-2 text-center">
            <p className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground/80">
              <Boxes className="size-4 text-muted-foreground" aria-hidden="true" />
              Mentioned here
            </p>
            <h2
              id="related-software-h"
              className="font-heading text-3xl font-medium tracking-tight text-balance sm:text-[2.6rem] sm:leading-[1.18]"
            >
              Covered in{" "}
              <span className="rounded-2xl bg-[var(--color-brand)] px-3 py-0.5 whitespace-nowrap text-[var(--color-brand-ink)]">
                this article
              </span>
            </h2>
          </div>
          <div className="mx-auto max-w-sm">
            <SoftwareCard software={article.related_software} slot="blog-card" />
          </div>
        </section>
      )}

      {/* ---------- More articles ---------- */}
      {latest.length > 0 && (
        <section aria-labelledby="more-articles-h" className="space-y-6">
          <div className="mx-auto flex max-w-xl flex-col items-center gap-5 pb-2 text-center">
            <p className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground/80">
              <BookOpen className="size-4 text-muted-foreground" aria-hidden="true" />
              Keep reading
            </p>
            <h2
              id="more-articles-h"
              className="font-heading text-3xl font-medium tracking-tight text-balance sm:text-[2.6rem] sm:leading-[1.18]"
            >
              More guides{" "}
              <span className="rounded-2xl bg-[var(--color-brand)] px-3 py-0.5 whitespace-nowrap text-[var(--color-brand-ink)]">
                worth your time
              </span>
            </h2>
          </div>
          <div className="rounded-[1.75rem] bg-zinc-100/80 p-2 dark:bg-zinc-900/60">
            <ul className="grid gap-2 sm:grid-cols-3">
              {latest.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/blog/${item.slug}`}
                    className="group flex h-full flex-col gap-4 rounded-[1.4rem] border border-zinc-200/70 bg-card p-6 transition-colors duration-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                  >
                    {item.category_tag && (
                      <span className="w-fit rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                        {item.category_tag}
                      </span>
                    )}
                    <span className="font-heading font-bold leading-snug tracking-tight">
                      {item.title}
                    </span>
                    <span
                      aria-hidden="true"
                      className="mt-auto grid size-9 place-items-center rounded-xl bg-zinc-100 text-muted-foreground transition-colors duration-200 group-hover:bg-[var(--color-brand)] group-hover:text-[var(--color-brand-ink)] dark:bg-zinc-800"
                    >
                      <ArrowUpRight className="size-4" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="text-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-brand-dark)] hover:underline"
            >
              All articles <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
