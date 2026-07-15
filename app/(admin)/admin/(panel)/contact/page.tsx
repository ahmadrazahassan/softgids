import { createClient } from "@/lib/supabase/server";
import { setContactHandled } from "@/app/(admin)/admin/actions";
import { AdminHeader, AdminTable } from "@/components/admin/ui";

export default async function ContactAdminPage() {
  const supabase = await createClient();
  const { data: messages } = await supabase
    .from("contact_messages")
    .select("id, name, email, subject, message, handled, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <AdminHeader title="Contact messages" count={messages?.length ?? 0} />
      <AdminTable headers={["From", "Message", "Received", "Status"]}>
        {(messages ?? []).map((entry) => (
          <tr key={entry.id} className={entry.handled ? "opacity-60" : undefined}>
            <td className="px-4 py-3 align-top">
              <p className="font-medium">{entry.name}</p>
              <p className="text-xs text-muted-foreground">{entry.email}</p>
            </td>
            <td className="max-w-md px-4 py-3 align-top">
              {entry.subject && <p className="font-medium">{entry.subject}</p>}
              <p className="line-clamp-3 text-muted-foreground">{entry.message}</p>
            </td>
            <td className="px-4 py-3 align-top text-muted-foreground">
              {new Date(entry.created_at).toLocaleString("en-ZA")}
            </td>
            <td className="px-4 py-3 align-top">
              <form action={setContactHandled}>
                <input type="hidden" name="_id" value={entry.id} />
                <input type="hidden" name="_handled" value={String(!entry.handled)} />
                <button
                  type="submit"
                  className="cursor-pointer text-xs font-semibold text-[var(--color-brand-dark)] hover:underline"
                >
                  {entry.handled ? "Mark open" : "Mark handled"}
                </button>
              </form>
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
