import { createClient } from "@/lib/supabase/server";
import type { SelectOption } from "@/components/admin/ResourceForm";

/** Relational dropdown options for the admin forms, keyed by field name. */
export async function loadSelectOptions(
  resourceKey: string
): Promise<Record<string, SelectOption[]>> {
  const supabase = await createClient();
  const options: Record<string, SelectOption[]> = {};

  if (resourceKey === "software") {
    const { data } = await supabase
      .from("categories")
      .select("id, name")
      .order("display_order");
    options.category_id = (data ?? []).map((row) => ({ value: row.id, label: row.name }));
  }

  if (["reviews", "articles", "comparisons"].includes(resourceKey)) {
    const { data } = await supabase.from("software").select("id, name").order("name");
    const list = (data ?? []).map((row) => ({ value: row.id, label: row.name }));
    if (resourceKey === "reviews") options.software_id = list;
    if (resourceKey === "articles") options.related_software_id = list;
    if (resourceKey === "comparisons") {
      options.software_a_id = list;
      options.software_b_id = list;
    }
  }

  return options;
}
