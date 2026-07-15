import type { Metadata } from "next";
import { LegalPage } from "@/components/public/LegalPage";
import { siteUrl } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How SoftGids collects, uses and protects personal information under POPIA — the Protection of Personal Information Act, 2013.",
  alternates: { canonical: `${siteUrl}/privacy-policy` },
};

export default function PrivacyPolicyPage() {
  return <LegalPage slug="privacy-policy" />;
}
