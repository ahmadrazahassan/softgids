import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient, hashIp } from "@/lib/supabase/admin";
import { placeholderSoftware } from "@/lib/placeholder";
import { siteUrl } from "@/lib/site";

/**
 * Affiliate click tracking + redirect. The single source for outbound vendor
 * URLs — the frontend never hardcodes them. Logs a HASHED IP (never raw),
 * then 302s the visitor to `affiliate_url || vendor_website`.
 *
 * Phase 1: full redirect behaviour with placeholder data when Supabase is
 * unset; click logging activates with the database in Phase 2.
 */
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("software")?.trim();
  if (!slug) return NextResponse.redirect(siteUrl);

  // Preview mode — resolve the destination from placeholder data, no logging.
  const admin = createAdminClient();
  if (!admin) {
    const software = placeholderSoftware.find((s) => s.slug === slug);
    const destination = software?.affiliate_url || software?.vendor_website;
    return NextResponse.redirect(destination || siteUrl);
  }

  const { data: software } = await admin
    .from("software")
    .select("id, name, affiliate_url, vendor_website")
    .eq("slug", slug)
    .maybeSingle();

  const destination = software?.affiliate_url || software?.vendor_website;
  if (!software || !destination) return NextResponse.redirect(siteUrl);

  const ipHash = hashIp(request.headers.get("x-forwarded-for")?.split(",")[0]);

  await admin.from("affiliate_clicks").insert({
    software_id: software.id,
    software_name: software.name,
    affiliate_url: destination,
    ip_hash: ipHash,
    user_agent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
    referrer: request.headers.get("referer")?.slice(0, 500) ?? null,
    country_code: request.headers.get("x-vercel-ip-country") ?? null,
  });

  return NextResponse.redirect(destination);
}
