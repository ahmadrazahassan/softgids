import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient, hashIp } from "@/lib/supabase/admin";
import { placeholderSoftware } from "@/lib/placeholder";
import { siteUrl } from "@/lib/site";

/**
 * Affiliate click tracking + redirect. The single source for outbound vendor
 * URLs — the frontend never hardcodes them. Logs a HASHED IP (never raw),
 * then redirects the visitor to `affiliate_url || vendor_website`.
 *
 * Phase 1: full redirect behaviour with placeholder data when Supabase is
 * unset; click logging activates with the database in Phase 2.
 */
/**
 * Redirect with caching disabled. A cached hop would let later clicks skip the
 * server entirely — undercounting clicks, and pinning visitors to a stale
 * destination after an affiliate link changes.
 */
function redirect(destination: string) {
  const response = NextResponse.redirect(destination);
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("software")?.trim();
  if (!slug) return redirect(siteUrl);

  // Preview mode — resolve the destination from placeholder data, no logging.
  const admin = createAdminClient();
  if (!admin) {
    const software = placeholderSoftware.find((s) => s.slug === slug);
    const destination = software?.affiliate_url || software?.vendor_website;
    return redirect(destination || siteUrl);
  }

  const { data: software } = await admin
    .from("software")
    .select("id, name, affiliate_url, vendor_website")
    .eq("slug", slug)
    .maybeSingle();

  const destination = software?.affiliate_url || software?.vendor_website;
  if (!software || !destination) return redirect(siteUrl);

  const ipHash = hashIp(request.headers.get("x-forwarded-for")?.split(",")[0]);

  // Analytics must never cost us the click. A throwing insert (Supabase
  // unreachable, schema drift, RLS change) would 500 the route and strand the
  // visitor short of the vendor, losing the commission to save a log row.
  // Swallow it and still redirect — an undercounted click beats a lost one.
  try {
    const { error } = await admin.from("affiliate_clicks").insert({
      software_id: software.id,
      software_name: software.name,
      affiliate_url: destination,
      ip_hash: ipHash,
      user_agent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
      referrer: request.headers.get("referer")?.slice(0, 500) ?? null,
      country_code: request.headers.get("x-vercel-ip-country") ?? null,
    });
    if (error) console.error(`track-click: log failed for ${slug}: ${error.message}`);
  } catch (err) {
    console.error(`track-click: log threw for ${slug}:`, err);
  }

  return redirect(destination);
}
