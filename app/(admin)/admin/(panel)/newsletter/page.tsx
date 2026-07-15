import { createClient } from "@/lib/supabase/server";
import { setSubscriberStatus } from "@/app/(admin)/admin/actions";
import { AdminHeader, AdminTable, StatusPill } from "@/components/admin/ui";
import { formatNumber } from "@/lib/format";

export default async function NewsletterAdminPage() {
  const supabase = await createClient();
  const { data: subscribers } = await supabase
    .from("newsletter_subscribers")
    .select("id, email, status, consent_source, created_at, confirmed_at")
    .order("created_at", { ascending: false })
    .limit(500);

  const list = subscribers ?? [];
  const totals = {
    confirmed: list.filter((s) => s.status === "confirmed").length,
    pending: list.filter((s) => s.status === "pending").length,
    unsubscribed: list.filter((s) => s.status === "unsubscribed").length,
  };

  return (
    <div>
      <AdminHeader title="Newsletter" count={list.length} />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {Object.entries(totals).map(([label, value]) => (
          <div
            key={label}
            className="rounded-[1.4rem] border border-zinc-200/70 bg-card p-5 dark:border-zinc-800"
          >
            <p className="text-[0.6rem] font-bold tracking-widest text-muted-foreground uppercase">
              {label}
            </p>
            <p className="mt-1.5 font-heading text-3xl font-bold tracking-tight">
              {formatNumber(value)}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-4">
        {/* Route handler download, not a page — a plain anchor is correct here. */}
        <a
          href="/admin/newsletter-export"
          download
          className="btn-glossy btn-glossy-white inline-flex items-center px-4 py-2 text-sm"
        >
          Export CSV
        </a>
      </div>

      <AdminTable headers={["Email", "Status", "Source", "Signed up", "Actions"]}>
        {list.map((subscriber) => (
          <tr key={subscriber.id}>
            <td className="px-4 py-3 font-medium">{subscriber.email}</td>
            <td className="px-4 py-3">
              <StatusPill value={subscriber.status} />
            </td>
            <td className="px-4 py-3 text-muted-foreground">
              {subscriber.consent_source ?? ""}
            </td>
            <td className="px-4 py-3 text-muted-foreground">
              {new Date(subscriber.created_at).toLocaleDateString("en-ZA")}
            </td>
            <td className="px-4 py-3">
              <form action={setSubscriberStatus} className="flex gap-2">
                <input type="hidden" name="_id" value={subscriber.id} />
                {subscriber.status !== "confirmed" && (
                  <button
                    type="submit"
                    name="_status"
                    value="confirmed"
                    className="cursor-pointer text-xs font-semibold text-[var(--color-brand-dark)] hover:underline"
                  >
                    Confirm
                  </button>
                )}
                {subscriber.status !== "unsubscribed" && (
                  <button
                    type="submit"
                    name="_status"
                    value="unsubscribed"
                    className="cursor-pointer text-xs font-semibold text-muted-foreground hover:underline"
                  >
                    Unsubscribe
                  </button>
                )}
              </form>
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
