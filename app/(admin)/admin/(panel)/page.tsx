import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminTable, StatusPill } from "@/components/admin/ui";
import { formatNumber } from "@/lib/format";

async function count(table: string, filter?: { column: string; value: string }) {
  const supabase = await createClient();
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  if (filter) query = query.eq(filter.column, filter.value);
  const { count: total } = await query;
  return total ?? 0;
}

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [software, reviews, articles, subscribers, clicks] = await Promise.all([
    count("software"),
    count("reviews"),
    count("articles"),
    count("newsletter_subscribers", { column: "status", value: "confirmed" }),
    count("affiliate_clicks"),
  ]);

  const { data: recentReviews } = await supabase
    .from("reviews")
    .select("id, review_title, reviewer_name, overall_rating, status, review_date")
    .order("created_at", { ascending: false })
    .limit(6);

  const { data: recentClicks } = await supabase
    .from("affiliate_clicks")
    .select("id, software_name, clicked_at, country_code")
    .order("clicked_at", { ascending: false })
    .limit(6);

  const tiles = [
    { label: "Software", value: software, href: "/admin/software" },
    { label: "Reviews", value: reviews, href: "/admin/reviews" },
    { label: "Articles", value: articles, href: "/admin/articles" },
    { label: "Confirmed subscribers", value: subscribers, href: "/admin/newsletter" },
    { label: "Affiliate clicks", value: clicks, href: "/admin/analytics" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-2xl font-medium tracking-tight">Dashboard</h1>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {tiles.map((tile) => (
          <Link
            key={tile.label}
            href={tile.href}
            className="rounded-[1.4rem] border border-zinc-200/70 bg-card p-5 transition-colors hover:border-zinc-300 dark:border-zinc-800"
          >
            <p className="text-[0.6rem] font-bold tracking-widest text-muted-foreground uppercase">
              {tile.label}
            </p>
            <p className="mt-1.5 font-heading text-3xl font-bold tracking-tight">
              {formatNumber(tile.value)}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-medium">Latest reviews</h2>
          <AdminTable headers={["Review", "Reviewer", "Rating", "Status"]}>
            {(recentReviews ?? []).map((review) => (
              <tr key={review.id}>
                <td className="px-4 py-3">
                  <Link href={`/admin/reviews/${review.id}`} className="font-medium hover:underline">
                    {review.review_title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{review.reviewer_name}</td>
                <td className="px-4 py-3 tabular-nums">{review.overall_rating}/5</td>
                <td className="px-4 py-3">
                  <StatusPill value={review.status} />
                </td>
              </tr>
            ))}
          </AdminTable>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-lg font-medium">Latest affiliate clicks</h2>
          <AdminTable headers={["Software", "When", "Country"]}>
            {(recentClicks ?? []).map((click) => (
              <tr key={click.id}>
                <td className="px-4 py-3 font-medium">{click.software_name ?? "Unknown"}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(click.clicked_at).toLocaleString("en-ZA")}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{click.country_code ?? "?"}</td>
              </tr>
            ))}
          </AdminTable>
        </section>
      </div>
    </div>
  );
}
