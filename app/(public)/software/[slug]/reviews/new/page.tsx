import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { ReviewForm } from "@/components/public/ReviewForm";
import { SoftwareLogo } from "@/components/public/SoftwareLogo";
import { VerifiedBadges } from "@/components/public/VerifiedBadges";
import { siteUrl } from "@/lib/site";
import { getSoftwareBySlug } from "@/lib/supabase/queries";

export async function generateMetadata(
  props: PageProps<"/software/[slug]/reviews/new">
): Promise<Metadata> {
  const { slug } = await props.params;
  const software = await getSoftwareBySlug(slug);
  if (!software) return { title: "Write a review" };
  return {
    title: `Review ${software.name} — Share Your Experience`,
    description: `Help other South African businesses choose: write a verified review of ${software.name}.`,
    alternates: { canonical: `${siteUrl}/software/${software.slug}/reviews/new` },
    robots: { index: false },
  };
}

export default async function NewReviewPage(
  props: PageProps<"/software/[slug]/reviews/new">
) {
  const { slug } = await props.params;
  const software = await getSoftwareBySlug(slug);
  if (!software) notFound();

  return (
    <div className="container-site max-w-3xl space-y-8 py-10">
      <Breadcrumbs
        items={[
          { name: "Software Reviews", href: "/software" },
          { name: software.name, href: `/software/${software.slug}` },
          { name: "Write a review" },
        ]}
      />

      <header className="flex items-center gap-4">
        <SoftwareLogo software={software} size={60} />
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Review {software.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Your honest experience helps thousands of South African businesses choose better
            software.
          </p>
        </div>
      </header>

      <VerifiedBadges />

      <ReviewForm softwareId={software.id} softwareName={software.name} />
    </div>
  );
}
