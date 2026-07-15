"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getResource } from "@/lib/admin/resources";

export interface AdminActionState {
  ok: boolean;
  message: string;
}

/* ------------------------------ auth ------------------------------ */

export async function signIn(
  _prev: AdminActionState | null,
  formData: FormData
): Promise<AdminActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { ok: false, message: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { ok: false, message: "Wrong email or password." };
  }
  redirect("/admin");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  return supabase;
}

/* --------------------------- generic CRUD -------------------------- */

function parseField(
  type: string,
  raw: FormDataEntryValue | null
): { value: unknown; error?: string } {
  const text = raw == null ? "" : String(raw).trim();
  switch (type) {
    case "checkbox":
      return { value: raw != null };
    case "number":
      if (text === "") return { value: null };
      return Number.isNaN(Number(text))
        ? { value: null, error: "not a number" }
        : { value: Number(text) };
    case "json": {
      if (text === "") return { value: [] };
      try {
        return { value: JSON.parse(text) };
      } catch {
        return { value: null, error: "invalid JSON" };
      }
    }
    case "date":
      return { value: text === "" ? null : text };
    default:
      return { value: text === "" ? null : text };
  }
}

/**
 * Save one row of a whitelisted resource. Only fields declared in the
 * resource registry are read from the form; everything else is ignored.
 */
export async function saveResource(
  _prev: AdminActionState | null,
  formData: FormData
): Promise<AdminActionState> {
  const supabase = await requireAdmin();

  const resourceKey = String(formData.get("_resource") ?? "");
  const id = String(formData.get("_id") ?? "").trim();
  const resource = getResource(resourceKey);
  if (!resource) return { ok: false, message: "Unknown resource." };

  const row: Record<string, unknown> = {};
  for (const field of resource.fields) {
    const { value, error } = parseField(field.type, formData.get(field.name));
    if (error) {
      return { ok: false, message: `${field.label}: ${error}.` };
    }
    if (field.required && (value === null || value === "")) {
      return { ok: false, message: `${field.label} is required.` };
    }
    row[field.name] = value;
  }

  const query = supabase.from(resource.table);
  const { error } = id
    ? await query.update(row).eq("id", id)
    : await query.insert(row);
  if (error) {
    return { ok: false, message: `Save failed: ${error.message}` };
  }

  revalidatePath("/", "layout");
  return { ok: true, message: "Saved." };
}

export async function deleteResource(formData: FormData): Promise<void> {
  const supabase = await requireAdmin();
  const resource = getResource(String(formData.get("_resource") ?? ""));
  const id = String(formData.get("_id") ?? "").trim();
  if (!resource || !id) return;

  await supabase.from(resource.table).delete().eq("id", id);
  revalidatePath("/", "layout");
  redirect(`/admin/${String(formData.get("_resource"))}`);
}

/** Flip a status style column on a whitelisted table (publish/hide etc.). */
export async function setResourceStatus(formData: FormData): Promise<void> {
  const supabase = await requireAdmin();
  const resource = getResource(String(formData.get("_resource") ?? ""));
  const id = String(formData.get("_id") ?? "").trim();
  const value = String(formData.get("_status") ?? "").trim();
  if (!resource || !id || !value) return;

  const statusField = resource.fields.find((f) => f.name === "status");
  if (!statusField || !statusField.options?.includes(value)) return;

  await supabase.from(resource.table).update({ status: value }).eq("id", id);
  revalidatePath("/", "layout");
}

/* ------------------------------ settings --------------------------- */

export async function saveSettings(
  _prev: AdminActionState | null,
  formData: FormData
): Promise<AdminActionState> {
  const supabase = await requireAdmin();

  for (const [key, value] of formData.entries()) {
    if (key.startsWith("_") || typeof value !== "string") continue;
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) return { ok: false, message: `Save failed: ${error.message}` };
  }

  revalidatePath("/", "layout");
  return { ok: true, message: "Settings saved." };
}

/* ----------------------------- newsletter -------------------------- */

export async function setSubscriberStatus(formData: FormData): Promise<void> {
  const supabase = await requireAdmin();
  const id = String(formData.get("_id") ?? "").trim();
  const value = String(formData.get("_status") ?? "").trim();
  if (!id || !["pending", "confirmed", "unsubscribed"].includes(value)) return;

  await supabase
    .from("newsletter_subscribers")
    .update({
      status: value,
      unsubscribed_at: value === "unsubscribed" ? new Date().toISOString() : null,
    })
    .eq("id", id);
  revalidatePath("/admin/newsletter");
}

/* ------------------------------ contact ---------------------------- */

export async function setContactHandled(formData: FormData): Promise<void> {
  const supabase = await requireAdmin();
  const id = String(formData.get("_id") ?? "").trim();
  if (!id) return;

  await supabase
    .from("contact_messages")
    .update({ handled: String(formData.get("_handled")) === "true" })
    .eq("id", id);
  revalidatePath("/admin/contact");
}
