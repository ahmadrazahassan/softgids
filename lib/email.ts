import "server-only";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

/**
 * Transactional email. Uses Resend when RESEND_API_KEY is set; otherwise the
 * message is logged so local development and previews still work end to end.
 * Swap the transport here if you prefer another provider.
 */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? `${SITE_NAME} <${CONTACT_EMAIL}>`;

  if (!apiKey) {
    console.info(`[email] (no provider configured) to=${to} subject="${subject}"`);
    console.info(html);
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });
  return response.ok;
}
