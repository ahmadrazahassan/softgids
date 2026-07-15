import { siteUrl, SITE_NAME } from "@/lib/site";
import type { Article, Review, Software } from "@/lib/types";

/** JSON-LD builders. Rendered via <script type="application/ld+json">. */

export function productJsonLd(software: Software) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: software.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: `${siteUrl}/software/${software.slug}`,
    description: software.description_short,
    ...(software.starting_price != null
      ? {
          offers: {
            "@type": "Offer",
            price: software.starting_price,
            priceCurrency: software.price_currency || "ZAR",
          },
        }
      : {}),
    ...(software.review_count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: software.overall_rating,
            reviewCount: software.review_count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
}

export function reviewsJsonLd(software: Software, reviews: Review[]) {
  return reviews.slice(0, 5).map((review) => ({
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: {
      "@type": "SoftwareApplication",
      name: software.name,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
    },
    author: { "@type": "Person", name: review.reviewer_name },
    reviewRating: {
      "@type": "Rating",
      ratingValue: review.overall_rating,
      bestRating: 5,
      worstRating: 1,
    },
    name: review.review_title,
    reviewBody: review.summary ?? undefined,
    datePublished: review.review_date,
  }));
}

export function breadcrumbJsonLd(items: Array<{ name: string; href: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.href}`,
    })),
  };
}

export function articleJsonLd(article: Article) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt ?? undefined,
    datePublished: article.published_date,
    dateModified: article.updated_at ?? article.published_date,
    author: { "@type": "Person", name: article.author_name },
    publisher: { "@type": "Organization", name: SITE_NAME, url: siteUrl },
    mainEntityOfPage: `${siteUrl}/blog/${article.slug}`,
  };
}

export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
