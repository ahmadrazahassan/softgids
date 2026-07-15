"use server";

import { headers } from "next/headers";
import { createAdminClient, hashIp } from "@/lib/supabase/admin";
import type { FormActionState } from "@/app/(public)/newsletter/actions";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Contact form — length caps + basic anti-abuse; storage arrives in Phase 2. */
export async function submitContact(
  _prev: FormActionState | null,
  formData: FormData
): Promise<FormActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  // Honeypot: bots fill every field.
  const website = String(formData.get("website") ?? "");

  if (website) return { ok: true, message: "Thanks — we'll be in touch." };
  if (name.length < 2 || name.length > 120) {
    return { ok: false, message: "Please tell us your name." };
  }
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return { ok: false, message: "Please enter a valid email address." };
  }
  if (subject.length > 200) {
    return { ok: false, message: "Please keep the subject under 200 characters." };
  }
  if (message.length < 10 || message.length > 5000) {
    return {
      ok: false,
      message: "Please write a message between 10 and 5 000 characters.",
    };
  }

  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: false,
      message:
        "Preview mode: the database isn't connected yet, so your message wasn't sent. Email us directly at hello@softgids.co.za.",
    };
  }

  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0] ?? null;

  const { error } = await admin.from("contact_messages").insert({
    name,
    email,
    subject: subject || null,
    message,
    ip_hash: hashIp(ip),
    user_agent: requestHeaders.get("user-agent")?.slice(0, 500) ?? null,
  });
  if (error) {
    return { ok: false, message: "Something went wrong on our side. Please try again." };
  }

  return { ok: true, message: "Thanks — we'll get back to you within two business days." };
}
