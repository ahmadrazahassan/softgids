import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import {
  getCategories,
  getLatestArticles,
  getSiteSettings,
  getTopRatedSoftware,
} from "@/lib/supabase/queries";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [categories, popularSoftware, articles, settings] = await Promise.all([
    getCategories(),
    getTopRatedSoftware(8),
    getLatestArticles(5),
    getSiteSettings(),
  ]);

  const searchIndex = {
    software: popularSoftware.map((s) => ({
      name: s.name,
      slug: s.slug,
      category: categories.find((c) => c.id === s.category_id)?.name ?? null,
    })),
    articles: articles.map((a) => ({ title: a.title, slug: a.slug })),
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar searchIndex={searchIndex} />
      <main className="flex-1">{children}</main>
      <Footer categories={categories} popularSoftware={popularSoftware} settings={settings} />
    </div>
  );
}
