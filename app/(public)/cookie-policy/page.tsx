import type { Metadata } from "next";
import { LegalPage } from "@/components/public/LegalPage";
import { siteUrl } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How softgids.co.za uses cookies and similar technologies.",
  alternates: { canonical: `${siteUrl}/cookie-policy` },
};

export default function CookiePolicyPage() {
  return <LegalPage slug="cookie-policy" />;
}
