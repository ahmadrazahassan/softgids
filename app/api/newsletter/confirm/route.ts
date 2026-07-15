import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/site";

/**
 * Double opt in confirmation. The reader lands here from the email link;
 * we flip their row to confirmed and clear the token so the link is single
 * use, then send them to the newsletter page with a status flag.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim();
  const admin = createAdminClient();
  if (!token || !admin) {
    return NextResponse.redirect(`${siteUrl}/newsletter?confirmed=0`);
  }

  const { data: subscriber } = await admin
    .from("newsletter_subscribers")
    .select("id, status")
    .eq("confirm_token", token)
    .maybeSingle();

  if (!subscriber) {
    return NextResponse.redirect(`${siteUrl}/newsletter?confirmed=0`);
  }

  await admin
    .from("newsletter_subscribers")
    .update({
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
      confirm_token: null,
    })
    .eq("id", subscriber.id);

  return NextResponse.redirect(`${siteUrl}/newsletter?confirmed=1`);
}
