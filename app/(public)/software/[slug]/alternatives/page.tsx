import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlternativeCard } from "@/components/public/AlternativeCard";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { SoftwareLogo } from "@/components/public/SoftwareLogo";
import { siteUrl } from "@/lib/site";
import {
  getAlternatives,
  getCategoryPeers,
  getSoftwareBySlug,
} from "@/lib/supabase/queries";

export const revalidate = 3600;

export async function generateMetadata(
  props: PageProps<"/software/[slug]/alternatives">
): Promise<Metadata> {
  const { slug } = await props.params;
  const software = await getSoftwareBySlug(slug);
  if (!software) return { title: "Alternatives not found" };
  return {
    title: `Best ${software.name} Alternatives in South Africa ${new Date().getFullYear()}`,
    description: `Top competitors to ${software.name}, ranked by verified user ratings — with ZAR pricing and side-by-side comparisons.`,
    alternates: { canonical: `${siteUrl}/software/${software.slug}/alternatives` },
  };
}

export default async function AlternativesPage(
  props: PageProps<"/software/[slug]/alternatives">
) {
  const { slug } = await props.params;
  const software = await getSoftwareBySlug(slug);
  if (!software) notFound();

  const [curated, peers] = await Promise.all([
    getAlternatives(software.id),
    getCategoryPeers(software.id, software.category_id ?? null, 8),
  ]);

  const seen = new Set(curated.map((s) => s.id));
  const alternatives = [...curated, ...peers.filter((p) => !seen.has(p.id))];

  return (
    <div className="container-site space-y-8 py-10">
      <Breadcrumbs
        items={[
          { name: "Software Reviews", href: "/software" },
          { name: software.name, href: `/software/${software.slug}` },
          { name: "Alternatives" },
        ]}
      />

      <header className="flex items-center gap-4">
        <SoftwareLogo software={software} size={64} />
        <div className="space-y-1.5">
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Best {software.name} alternatives
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Ranked by verified user ratings from South African businesses. Every alternative
            links to a full review and a head-to-head comparison.
          </p>
        </div>
      </header>

      {alternatives.length === 0 ? (
        <div className="rounded-3xl border border-zinc-200 p-12 text-center text-muted-foreground dark:border-zinc-800">
          No alternatives listed yet — check back soon.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {alternatives.map((alternative, index) => (
            <AlternativeCard
              key={alternative.id}
              software={alternative}
              originalSlug={software.slug}
              rank={index + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
