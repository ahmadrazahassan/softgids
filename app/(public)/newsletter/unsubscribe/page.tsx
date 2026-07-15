import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { NewsletterUnsubscribeForm } from "@/components/public/NewsletterUnsubscribeForm";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Unsubscribe from the Newsletter",
  description: "One-click unsubscribe from the SoftGids newsletter.",
  alternates: { canonical: `${siteUrl}/newsletter/unsubscribe` },
  robots: { index: false },
};

export default async function UnsubscribePage(
  props: PageProps<"/newsletter/unsubscribe">
) {
  const searchParams = await props.searchParams;
  const raw = searchParams.email;
  const email = (Array.isArray(raw) ? raw[0] : raw) ?? "";

  return (
    <div className="container-site max-w-md space-y-8 py-16">
      <Breadcrumbs
        items={[{ name: "Newsletter", href: "/newsletter" }, { name: "Unsubscribe" }]}
      />
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Unsubscribe</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email address and we&apos;ll remove you from the newsletter immediately —
          no questions, no dark patterns.
        </p>
      </header>
      <NewsletterUnsubscribeForm defaultEmail={email} />
    </div>
  );
}
