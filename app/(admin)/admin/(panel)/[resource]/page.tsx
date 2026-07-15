import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getResource } from "@/lib/admin/resources";
import { AdminHeader, AdminTable, StatusPill } from "@/components/admin/ui";

export default async function ResourceListPage(props: {
  params: Promise<{ resource: string }>;
}) {
  const { resource: resourceKey } = await props.params;
  const resource = getResource(resourceKey);
  if (!resource) notFound();

  const supabase = await createClient();
  const { data: rows, count } = await supabase
    .from(resource.table)
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(200);

  const hasStatus = resource.fields.some((field) => field.name === "status");

  return (
    <div>
      <AdminHeader
        title={resource.title}
        count={count ?? 0}
        newHref={`/admin/${resourceKey}/new`}
      />
      <AdminTable headers={[resource.title.replace(/s$/, ""), ...(hasStatus ? ["Status"] : []), "Created"]}>
        {(rows ?? []).map((row) => (
          <tr key={row.id}>
            <td className="px-4 py-3">
              <Link href={`/admin/${resourceKey}/${row.id}`} className="font-medium hover:underline">
                {String(row[resource.labelColumn] ?? row.id)}
              </Link>
            </td>
            {hasStatus && (
              <td className="px-4 py-3">
                <StatusPill value={String(row.status)} />
              </td>
            )}
            <td className="px-4 py-3 text-muted-foreground">
              {row.created_at ? new Date(row.created_at).toLocaleDateString("en-ZA") : ""}
            </td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
