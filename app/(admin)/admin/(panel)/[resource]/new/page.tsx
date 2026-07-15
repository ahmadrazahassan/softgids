import { notFound } from "next/navigation";
import { getResource } from "@/lib/admin/resources";
import { loadSelectOptions } from "@/lib/admin/options";
import { ResourceForm } from "@/components/admin/ResourceForm";
import { AdminHeader } from "@/components/admin/ui";

export default async function NewResourcePage(props: {
  params: Promise<{ resource: string }>;
}) {
  const { resource: resourceKey } = await props.params;
  const resource = getResource(resourceKey);
  if (!resource) notFound();

  const selectOptions = await loadSelectOptions(resourceKey);

  return (
    <div>
      <AdminHeader title={`New ${resource.title.replace(/s$/, "").toLowerCase()}`} />
      <ResourceForm
        resourceKey={resourceKey}
        fields={resource.fields}
        record={null}
        selectOptions={selectOptions}
      />
    </div>
  );
}
