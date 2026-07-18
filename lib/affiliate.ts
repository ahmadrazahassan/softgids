/**
 * Sage affiliate links (Impact Radius — sagesouthafrica.pxf.io).
 *
 * The programme issues one tracking link per publisher, not one per product.
 * Both links Impact hands out for this account resolve to the SAME creative:
 *
 *   https://sagesouthafrica.pxf.io/c/7483506/2932573/34654   (long form)
 *   https://sagesouthafrica.pxf.io/xJXm6v                    (vanity alias)
 *
 * Landing on the sage.com/en-za homepage for every product would waste the
 * click, so we deep-link with Impact's `?u=` parameter. Verified behaviour:
 * the redirect keeps the full attribution payload (irpid, iradid, the
 * ImpactAffiliateProgramme_ZA campaign) and lands on the requested page.
 *
 * IMPORTANT: Impact validates `u=` against the programme's approved domains.
 * Only www.sage.com is approved — a shop.sage.co.za destination makes the
 * tracking link itself return 404, losing both the click and the commission.
 * The Pastel products live on that shop domain, so they intentionally fall
 * back to the plain link and land on the tracked homepage. Do not "fix" this
 * by deep-linking them; re-test against Impact first.
 */

/** Canonical creative. Deep-linking is verified against this long form. */
const SAGE_TRACKING_LINK = "https://sagesouthafrica.pxf.io/c/7483506/2932573/34654";

/**
 * Same destination as SAGE_TRACKING_LINK, short enough to read aloud. For
 * places a human copies the URL by hand — newsletters, social, print.
 */
export const SAGE_TRACKING_LINK_SHORT = "https://sagesouthafrica.pxf.io/xJXm6v";

/** Hosts Impact will accept as a `u=` deep-link target. */
const DEEP_LINKABLE_HOSTS = new Set(["www.sage.com"]);

/**
 * Build the tracked URL for a Sage product page. Falls back to the untargeted
 * link whenever the destination is missing, unparseable, or off-programme —
 * a homepage landing still pays, a rejected link does not.
 */
export function sageAffiliateUrl(destination?: string | null): string {
  if (!destination) return SAGE_TRACKING_LINK;

  let host: string;
  try {
    host = new URL(destination).hostname;
  } catch {
    return SAGE_TRACKING_LINK;
  }

  if (!DEEP_LINKABLE_HOSTS.has(host)) return SAGE_TRACKING_LINK;
  return `${SAGE_TRACKING_LINK}?u=${encodeURIComponent(destination)}`;
}
