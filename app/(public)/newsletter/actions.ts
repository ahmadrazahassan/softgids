"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient, hashIp } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { siteUrl } from "@/lib/site";

export interface FormActionState {
  ok: boolean;
  message: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Newsletter signup with double opt in and a POPIA consent trail. The row is
 * stored as pending with a confirm token; the reader becomes confirmed only
 * when they click the link we email them.
 */
export async function subscribeNewsletter(
  _prev: FormActionState | null,
  formData: FormData
): Promise<FormActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return { ok: false, message: "Please enter a valid email address." };
  }

  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: false,
      message:
        "Preview mode: the database isn't connected yet, so your subscription wasn't saved.",
    };
  }

  const requestHeaders = await headers();
  const ip = requestHeaders.get("x-forwarded-for")?.split(",")[0] ?? null;
  const token = randomBytes(24).toString("hex");

  const { data: existing } = await admin
    .from("newsletter_subscribers")
    .select("id, status")
    .eq("email", email)
    .maybeSingle();

  if (existing?.status === "confirmed") {
    return { ok: true, message: "You are already on the list. Nothing more to do." };
  }

  const { error } = await admin.from("newsletter_subscribers").upsert(
    {
      email,
      status: "pending",
      confirm_token: token,
      consent_ip_hash: hashIp(ip),
      consent_source: "website form",
      user_agent: requestHeaders.get("user-agent")?.slice(0, 500) ?? null,
    },
    { onConflict: "email" }
  );
  if (error) {
    return { ok: false, message: "Something went wrong on our side. Please try again." };
  }

  const confirmUrl = `${siteUrl}/api/newsletter/confirm?token=${token}`;
  await sendEmail({
    to: email,
    subject: "Confirm your SoftGids subscription",
    html: `<p>Thanks for signing up. Please confirm your address so we can start sending the monthly letter.</p><p><a href="${confirmUrl}">Confirm my subscription</a></p><p>If you did not request this, ignore this email and nothing will happen. We handle your details in line with POPIA.</p>`,
  });

  return {
    ok: true,
    message: "Almost there. Check your inbox and confirm your address.",
  };
}

export async function unsubscribeNewsletter(
  _prev: FormActionState | null,
  formData: FormData
): Promise<FormActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return { ok: false, message: "Please enter a valid email address." };
  }

  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: false,
      message:
        "Preview mode: the database isn't connected yet, so nothing was changed.",
    };
  }

  await admin
    .from("newsletter_subscribers")
    .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
    .eq("email", email);

  // The same message either way, so the form can't be used to probe addresses.
  return { ok: true, message: "You are off the list. Sorry to see you go." };
}
