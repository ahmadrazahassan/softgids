import { createClient } from "@/lib/supabase/server";
import { AdminHeader } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function SettingsAdminPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("site_settings")
    .select("key, value")
    .order("key");

  return (
    <div>
      <AdminHeader title="Site settings" />
      <SettingsForm settings={settings ?? []} />
    </div>
  );
}
