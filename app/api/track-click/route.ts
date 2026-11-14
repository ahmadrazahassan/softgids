import { NextResponse, type NextRequest } from "next/server";
import { affiliateHref, isValidPlacement } from "@/lib/affiliate";
import { createAdminClient, hashIp } from "@/lib/supabase/admin";

/**
 * First-party click log. Receives a `navigator.sendBeacon` POST from
 * AffiliateClickBeacon and records the click for the admin analytics.
 *
 * This route used to be the href itself: a GET that logged, then 307'd to the
 * vendor. It no longer redirects anything. Affiliate anchors now point straight
 * at the Impact tracking link, so the click never waits on this route, never
 * loses the referrer to an extra hop, and still works with JavaScript off.
 * Logging is bookkeeping that happens alongside the navigation, not in front
 * of it. Removing the redirect also means a crawler can no longer manufacture
 * a click by following a link on our own domain.
 *
 * Every path returns 204. A beacon has no UI to surface an error to, and a
 * failed log must never be mistaken for a failed click. Nothing here is
 * trusted from the client beyond a slug and a placement ID, both validated;
 * the destination URL is rebuilt server-side from lib/affiliate.ts rather than
 * accepted from the request.
 */

type Beacon = {
  kind?: unknown;
  placement?: unknown;
  slug?: unknown;
  path?: unknown;
};

const noContent = () => new NextResponse(null, { status: 204 });

export async function POST(request: NextRequest) {
  let body: Beacon;
  try {
    body = (await request.json()) as Beacon;
  } catch {
    return noContent();
  }

  const kind =
    body.kind === "affiliate" || body.kind === "plain" ? body.kind : null;
  if (!kind) return noContent();

  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  if (!slug) return noContent();

  // An affiliate click without a valid placement is a bug upstream, not
  // something to guess at. Drop it rather than log a row we cannot attribute.
  const placement =
    typeof body.placement === "string" && isValidPlacement(body.placement)
      ? body.placement
      : null;
  if (kind === "affiliate" && !placement) return noContent();

  const admin = createAdminClient();
  if (!admin) return noContent(); // Preview mode: no database to log to.

  const { data: software } = await admin
    .from("software")
    .select("id, name, vendor_website")
    .eq("slug", slug)
    .maybeSingle();
  if (!software) return noContent();

  // Rebuilt here, never taken from the beacon, so a tampered payload cannot
  // write an arbitrary URL into our own reporting.
  const destination = placement
    ? affiliateHref("sage", placement)
    : software.vendor_website;
  if (!destination) return noContent();

  const row = {
    software_id: software.id,
    software_name: software.name,
    affiliate_url: destination,
    ip_hash: hashIp(request.headers.get("x-forwarded-for")?.split(",")[0]),
    user_agent: request.headers.get("user-agent")?.slice(0, 500) ?? null,
    referrer: request.headers.get("referer")?.slice(0, 500) ?? null,
    country_code: request.headers.get("x-vercel-ip-country") ?? null,
  };

  try {
    const { error } = await admin
      .from("affiliate_clicks")
      .insert({ ...row, placement });

    // The `placement` column arrives with migration 008. Until that has been
    // applied, insert the row without it rather than lose the click entirely.
    if (error?.code === "PGRST204" || /placement/i.test(error?.message ?? "")) {
      const retry = await admin.from("affiliate_clicks").insert(row);
      if (retry.error) {
        console.error(`track-click: log failed for ${slug}: ${retry.error.message}`);
      }
    } else if (error) {
      console.error(`track-click: log failed for ${slug}: ${error.message}`);
    }
  } catch (err) {
    console.error(`track-click: log threw for ${slug}:`, err);
  }

  return noContent();
}
