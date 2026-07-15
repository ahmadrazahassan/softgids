import type { Metadata } from "next";
import { LegalPage } from "@/components/public/LegalPage";
import { siteUrl } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Accessibility Statement",
  description: "SoftGids's commitment to WCAG 2.2 AA accessibility, and how to report barriers.",
  alternates: { canonical: `${siteUrl}/accessibility` },
};

export default function AccessibilityPage() {
  return <LegalPage slug="accessibility" />;
}
