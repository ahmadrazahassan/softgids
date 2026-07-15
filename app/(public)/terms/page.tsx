import type { Metadata } from "next";
import { LegalPage } from "@/components/public/LegalPage";
import { siteUrl } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "The terms governing your use of SoftGids, under South African law.",
  alternates: { canonical: `${siteUrl}/terms` },
};

export default function TermsPage() {
  return <LegalPage slug="terms" />;
}
