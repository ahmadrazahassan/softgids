import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import {
  getArticles,
  getCategories,
  getPublishedComparisons,
  getSoftwareList,
} from "@/lib/supabase/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, software, articles, comparisons] = await Promise.all([
    getCategories(),
    getSoftwareList({ perPage: 500 }),
    getArticles(1, 500),
    getPublishedComparisons(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/software",
    "/categories",
    "/compare",
    "/blog",
    "/newsletter",
    "/contact",
    "/about",
    "/privacy-policy",
    "/cookie-policy",
    "/terms",
    "/affiliate-disclosure",
    "/editorial-policy",
    "/paia-manual",
    "/accessibility",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  const softwareRoutes: MetadataRoute.Sitemap = software.items.flatMap((item) => [
    {
      url: `${siteUrl}/software/${item.slug}`,
      lastModified: item.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    {
      url: `${siteUrl}/software/${item.slug}/reviews`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    },
    {
      url: `${siteUrl}/software/${item.slug}/alternatives`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    },
  ]);

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${siteUrl}/category/${category.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const articleRoutes: MetadataRoute.Sitemap = articles.items.map((article) => ({
    url: `${siteUrl}/blog/${article.slug}`,
    lastModified: article.updated_at ?? article.published_date,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const comparisonRoutes: MetadataRoute.Sitemap = comparisons
    .filter((c) => c.software_a && c.software_b)
    .map((c) => ({
      url: `${siteUrl}/compare/${c.software_a!.slug}-vs-${c.software_b!.slug}`,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  return [
    ...staticRoutes,
    ...softwareRoutes,
    ...categoryRoutes,
    ...articleRoutes,
    ...comparisonRoutes,
  ];
}
