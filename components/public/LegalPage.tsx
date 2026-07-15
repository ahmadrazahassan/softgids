import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { formatDate } from "@/lib/format";
import { getPageBySlug } from "@/lib/supabase/queries";

/** Shared renderer for the legal/policy suite — content is editable via the CMS. */
export async function LegalPage({ slug }: { slug: string }) {
  const page = await getPageBySlug(slug);
  if (!page) notFound();

  return (
    <div className="container-site max-w-3xl space-y-8 py-10">
      <Breadcrumbs items={[{ name: page.title }]} />
      <header className="space-y-2 border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <h1 className="font-heading text-4xl font-bold tracking-tight">{page.title}</h1>
        {page.updated_at && (
          <p className="text-sm text-muted-foreground">
            Last updated {formatDate(page.updated_at)}
          </p>
        )}
      </header>
      <div className="legal-content" dangerouslySetInnerHTML={{ __html: page.content }} />
    </div>
  );
}
