import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getResource } from "@/lib/admin/resources";
import { loadSelectOptions } from "@/lib/admin/options";
import { ResourceForm } from "@/components/admin/ResourceForm";
import { AdminHeader } from "@/components/admin/ui";

export default async function EditResourcePage(props: {
  params: Promise<{ resource: string; id: string }>;
}) {
  const { resource: resourceKey, id } = await props.params;
  const resource = getResource(resourceKey);
  if (!resource) notFound();

  const supabase = await createClient();
  const { data: record } = await supabase
    .from(resource.table)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!record) notFound();

  const selectOptions = await loadSelectOptions(resourceKey);

  return (
    <div>
      <AdminHeader
        title={String(record[resource.labelColumn] ?? resource.title)}
      />
      <ResourceForm
        resourceKey={resourceKey}
        fields={resource.fields}
        record={record}
        selectOptions={selectOptions}
      />
    </div>
  );
}
