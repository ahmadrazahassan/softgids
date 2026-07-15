import { createClient } from "@/lib/supabase/server";
import { AdminHeader, AdminTable } from "@/components/admin/ui";
import { formatNumber } from "@/lib/format";

export default async function AnalyticsAdminPage() {
  const supabase = await createClient();
  const { data: clicks } = await supabase
    .from("affiliate_clicks")
    .select("id, software_name, clicked_at, referrer, country_code")
    .order("clicked_at", { ascending: false })
    .limit(1000);

  const list = clicks ?? [];
  const bySoftware = new Map<string, number>();
  for (const click of list) {
    const key = click.software_name ?? "Unknown";
    bySoftware.set(key, (bySoftware.get(key) ?? 0) + 1);
  }
  const ranked = [...bySoftware.entries()].sort((a, b) => b[1] - a[1]);
  const max = ranked[0]?.[1] ?? 1;

  return (
    <div className="space-y-8">
      <AdminHeader title="Affiliate analytics" count={list.length} />

      <section className="max-w-2xl space-y-3 rounded-[1.4rem] border border-zinc-200/70 bg-card p-6 dark:border-zinc-800">
        <h2 className="font-heading text-lg font-medium">Clicks by product</h2>
        {ranked.length === 0 && (
          <p className="text-sm text-muted-foreground">No outbound clicks logged yet.</p>
        )}
        <div className="space-y-2.5">
          {ranked.slice(0, 15).map(([name, total]) => (
            <div key={name} className="flex items-center gap-3">
              <span className="w-56 shrink-0 truncate text-sm">{name}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-r-[4px] bg-muted">
                <div
                  className="h-full rounded-r-[4px] bg-[var(--color-brand)]"
                  style={{ width: `${(total / max) * 100}%` }}
                />
              </div>
              <span className="w-12 shrink-0 text-right text-sm font-semibold tabular-nums">
                {formatNumber(total)}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-medium">Recent clicks</h2>
        <AdminTable headers={["Software", "When", "Referrer", "Country"]}>
          {list.slice(0, 50).map((click) => (
            <tr key={click.id}>
              <td className="px-4 py-3 font-medium">{click.software_name ?? "Unknown"}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(click.clicked_at).toLocaleString("en-ZA")}
              </td>
              <td className="max-w-60 truncate px-4 py-3 text-muted-foreground">
                {click.referrer ?? ""}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{click.country_code ?? "?"}</td>
            </tr>
          ))}
        </AdminTable>
      </section>
    </div>
  );
}
