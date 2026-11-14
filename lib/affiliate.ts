/**
 * Every affiliate link on this site is defined here. Nowhere else.
 *
 * Three things have to stay true for a click to earn us anything, and all
 * three are decided in this file:
 *
 *   1. The click reaches the network. Real <a href> elements rendered into the
 *      HTML, pointing at the tracking link the network issued. No JavaScript
 *      URL building, no interstitial, no redirect hop.
 *   2. The network sees softgids.co.za as the referring domain. That means
 *      `sponsored noopener` and NEVER `noreferrer` — see AFFILIATE_REL.
 *   3. The click carries a placement ID, so Impact reporting shows which
 *      button or banner converted — see SUB_ID_PARAM.
 *
 * Guarded by tests/affiliate.test.ts and scripts/check-affiliate-links.ts,
 * the latter wired into `npm run build`. If you are about to hand-write an
 * affiliate anchor somewhere else, those two will stop you, and they are right.
 */

/**
 * A software row, structurally. Kept local so scripts and the post-build
 * scanner can import this module without pulling in the app's type graph.
 */
export type AffiliateTarget = {
  slug: string;
  vendor_name?: string | null;
  affiliate_url?: string | null;
  vendor_website?: string | null;
};

/* -------------------------------------------------------------------------- */
/*  Link attributes — the referrer lives or dies here                         */
/* -------------------------------------------------------------------------- */

/**
 * `rel` for every affiliate link.
 *
 * `sponsored` discloses the paid relationship to search engines; `noopener`
 * stops the opened tab reaching back into `window.opener`.
 *
 * `noreferrer` is deliberately absent and must never be added. It deletes the
 * Referer header, the network then reports the click under "No referring
 * domain", and it may not be credited at all. That single keyword is what was
 * wrong with this site before. `noopener` already covers the security reason
 * people reach for `noreferrer`.
 */
export const AFFILIATE_REL = "sponsored noopener";

/**
 * Sends only our origin (https://softgids.co.za/) to the network, never the
 * page path or query string, so a visitor's search terms stay private. The
 * page-level detail the network needs comes from the placement ID instead.
 *
 * Set per link on purpose: a per-link `referrerpolicy` overrides a stricter
 * document or header policy, so private areas can stay locked down (see the
 * `Referrer-Policy: no-referrer` header on /admin in next.config.ts) without
 * costing us attribution here.
 */
export const AFFILIATE_REFERRER_POLICY = "strict-origin-when-cross-origin";

/**
 * `rel` for an outbound vendor link we are NOT paid for. `sponsored` would be
 * a false disclosure, so plain vendor links get `nofollow` instead.
 */
export const PLAIN_OUTBOUND_REL = "nofollow noopener";

/** The word that visibly marks advertising, in the site's language (en-ZA). */
export const AD_LABEL = "Sponsored";

/* -------------------------------------------------------------------------- */
/*  Network identity                                                          */
/* -------------------------------------------------------------------------- */

/** Impact media partner ID (ours) and the Sage campaign ID. */
export const IMPACT_PARTNER_ID = "7483506";
export const SAGE_CAMPAIGN_ID = "34654";

/**
 * Impact's sub-ID parameter for partner-side reporting.
 *
 * Documented at help.impact.com, "Sub ID and Shared ID Parameters Explained
 * for Partners": `https://trackingdomain.net/c/1234567/654321/4321?subId1=test`,
 * and "All impact.com tracking links support Sub IDs and a Shared ID —
 * including vanity links", which is what lets us put a placement on the short
 * link below. SubId1 is typed Alphanumeric with a 255 character limit; the
 * stricter "letters and numbers only, no special characters" rule on that page
 * applies to SharedId, which we do not use.
 */
export const SUB_ID_PARAM = "subId1";

/**
 * Hostnames that belong to an affiliate network. The post-build scanner treats
 * any link to one of these as an affiliate link and audits it, so adding a new
 * programme means adding its host here.
 */
export const TRACKING_HOSTS = [
  "sagesouthafrica.pxf.io",
  "pxf.io",
  "sjv.io",
  "impactradius-go.com",
  "impactradius.com",
] as const;

/** True when `url` points at an affiliate network's tracking domain. */
export function isTrackingUrl(url: string): boolean {
  let host: string;
  try {
    host = new URL(url, "https://softgids.co.za").hostname.toLowerCase();
  } catch {
    return false;
  }
  return TRACKING_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

/* -------------------------------------------------------------------------- */
/*  Programmes                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Tracking links exactly as Impact issued them. Never edit a URL here by hand:
 * no added path, no deep-link `u=` parameter, no shortener. A product-specific
 * landing page needs a new link built in Impact's link builder, pasted in
 * whole.
 *
 * `sage` is a vanity (short) link. Impact documents that vanity links accept
 * sub IDs, so `?subId1=<placement>` is appended for reporting and nothing else.
 */
export const AFFILIATE_PROGRAMS = {
  sage: {
    brand: "Sage",
    network: "Impact",
    /**
     * Vanity tracking link, issued 2026-11 — replaces the earlier
     * /c/7483506/2932573/34654 long link.
     */
    url: "https://sagesouthafrica.pxf.io/KBY30A",
  },
} as const;

export type AffiliateProgram = keyof typeof AFFILIATE_PROGRAMS;

/**
 * Kept for the seed script and placeholder roster, which write the raw URL into
 * the `software.affiliate_url` column. Rendering never reads that column for
 * the href — `outboundLink()` resolves the programme instead — but the column
 * is what marks a row as monetised.
 */
export const SAGE_AFFILIATE_URL = AFFILIATE_PROGRAMS.sage.url;

/** Vendor names we hold a contract with, mapped to their programme. */
const PROGRAM_BY_VENDOR: Record<string, AffiliateProgram> = {
  Sage: "sage",
};

/* -------------------------------------------------------------------------- */
/*  Placement IDs                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Lowercase letters, digits and hyphens, up to 64 characters. Short enough to
 * read in an Impact report, well inside the 255 character limit.
 *
 * Never put personal data in a placement ID — no email, user ID, IP address or
 * search term. These values reach a third party on every click and are stored
 * by them. A placement names a slot on a page; that is all.
 */
export const PLACEMENT_PATTERN = /^[a-z0-9][a-z0-9-]{1,63}$/;

export function isValidPlacement(id: string): boolean {
  return PLACEMENT_PATTERN.test(id) && !id.includes("--") && !id.endsWith("-");
}

/**
 * Builds a placement ID from a slot name and an optional product slug, e.g.
 * ("software-hero", "sage-accounting") gives "software-hero-sage-accounting".
 * Throws on an invalid result rather than quietly shipping a broken sub ID.
 */
export function placementId(slot: string, slug?: string | null): string {
  const id = (slug ? `${slot}-${slug}` : slot).toLowerCase();
  if (!isValidPlacement(id)) {
    throw new Error(
      `Invalid affiliate placement ID "${id}". Expected lowercase letters, ` +
        `digits and single hyphens, 2-64 characters.`
    );
  }
  return id;
}

/* -------------------------------------------------------------------------- */
/*  Link building                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Appends the placement ID to a tracking link, preserving everything the
 * network already put in the URL.
 */
function withPlacement(trackingUrl: string, placement: string): string {
  const url = new URL(trackingUrl);
  url.searchParams.set(SUB_ID_PARAM, placement);
  return url.toString();
}

/**
 * The tracking URL for a programme, carrying its placement ID. `placement` is
 * validated — an invalid one throws at render time rather than silently
 * shipping a click the network cannot attribute to a slot.
 */
export function affiliateHref(program: AffiliateProgram, placement: string): string {
  if (!isValidPlacement(placement)) {
    throw new Error(`Invalid affiliate placement ID "${placement}".`);
  }
  return withPlacement(AFFILIATE_PROGRAMS[program].url, placement);
}

export type OutboundLink =
  | {
      kind: "affiliate";
      href: string;
      rel: typeof AFFILIATE_REL;
      referrerPolicy: typeof AFFILIATE_REFERRER_POLICY;
      program: AffiliateProgram;
      brand: string;
      placement: string;
      /** The product this link sells, when it is tied to one. Carried through
       *  to first-party click logging; banners have no single product. */
      slug: string | null;
    }
  | {
      kind: "plain";
      href: string;
      rel: typeof PLAIN_OUTBOUND_REL;
      referrerPolicy: typeof AFFILIATE_REFERRER_POLICY;
    };

/**
 * Resolves the outbound link for a product in a given slot.
 *
 * A product whose vendor we have a contract with, or whose `affiliate_url`
 * already points at a tracking domain, gets the monetised link with a
 * placement ID and a `sponsored` rel. Everything else gets the vendor's own
 * website with `nofollow` — marking an unpaid link `sponsored` would be a
 * false disclosure.
 *
 * Returns null when there is no destination at all, so callers can skip the
 * CTA rather than render a dead button.
 */
export function outboundLink(
  software: AffiliateTarget,
  slot: string
): OutboundLink | null {
  const program: AffiliateProgram | null =
    PROGRAM_BY_VENDOR[software.vendor_name ?? ""] ??
    (software.affiliate_url && isTrackingUrl(software.affiliate_url) ? "sage" : null);

  if (program) {
    const placement = placementId(slot, software.slug);
    return {
      kind: "affiliate",
      href: affiliateHref(program, placement),
      rel: AFFILIATE_REL,
      referrerPolicy: AFFILIATE_REFERRER_POLICY,
      program,
      brand: AFFILIATE_PROGRAMS[program].brand,
      placement,
      slug: software.slug,
    };
  }

  const website = software.vendor_website?.trim();
  if (!website) return null;
  return {
    kind: "plain",
    href: website,
    rel: PLAIN_OUTBOUND_REL,
    referrerPolicy: AFFILIATE_REFERRER_POLICY,
  };
}

/* -------------------------------------------------------------------------- */
/*  Banner creatives                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Impact ad creatives, keyed by IAB ad unit. Every ad ID, width, height and
 * creative filename below is transcribed from the programme's own ad export,
 * kept in the repo at docs/affiliate/impact-sage-ads-export.csv, and
 * tests/affiliate.test.ts asserts this table still matches that file. So a
 * mistyped ad ID fails the test rather than quietly serving a dead banner.
 *
 * Each creative uses its own official click link and its own hosted image,
 * both unchanged — no cropping, no overlay, no edited text.
 *
 * `alt` is ours: the export's ImageAlternativeTag column is empty for every
 * creative, so the text is written from each ad's own Name rather than left
 * blank.
 *
 * The export marks every one of these AllowDeepLinking=true, so per-landing-page
 * links can be built in Impact's link builder if a slot ever needs one. Nothing
 * here deep-links today.
 *
 * The images are served from Impact's CDN, which means the visitor's browser
 * sends their IP address to Impact on page load. That is disclosed in the
 * privacy policy; self-hosting would avoid it but the programme does not
 * permit re-hosting creatives.
 */
export const AFFILIATE_BANNERS = {
  /** 320x50 — mobile strip. */
  mobileLeaderboard: {
    adId: "3997319",
    w: 320,
    h: 50,
    alt: "Sage Accounting: see your cash flow clearly",
    creative: "CashFlow-320x50.gif",
  },
  /** 728x90 — classic leaderboard, above or below content on desktop. */
  leaderboard: {
    adId: "3997317",
    w: 728,
    h: 90,
    alt: "Sage Accounting: see your cash flow clearly",
    creative: "CashFlow-728x90.gif",
  },
  /** 970x250 — billboard, in-content, scales down responsively. */
  billboard: {
    adId: "3067398",
    w: 970,
    h: 250,
    alt: "Sage Accounting: run your business with confidence",
    creative: "24_ACG_GB_SMA_DDV_BOFU_Suites2_970x250.jpg",
  },
  /** 300x250 — medium rectangle, fits a sidebar or an in-content break. */
  mediumRectangle: {
    adId: "3067401",
    w: 300,
    h: 250,
    alt: "Sage Accounting: run your business with confidence",
    creative: "24_ACG_GB_SMA_DDV_BOFU_Suites2_300x250.jpg",
  },
  /** 300x600 — half page, sidebar. */
  halfpage: {
    adId: "3997318",
    w: 300,
    h: 600,
    alt: "Sage Accounting: see your cash flow clearly",
    creative: "CashFlow-300x600.gif",
  },
  /** 160x600 — wide skyscraper. */
  wideSkyscraper: {
    adId: "3067400",
    w: 160,
    h: 600,
    alt: "Sage Accounting: run your business with confidence",
    creative: "24_ACG_GB_SMA_DDV_BOFU_Suites2_160x600.jpg",
  },
  /** 120x600 — skyscraper, narrow rails. */
  skyscraper: {
    adId: "3067399",
    w: 120,
    h: 600,
    alt: "Sage Accounting: run your business with confidence",
    creative: "24_ACG_GB_SMA_DDV_BOFU_Suites2_120x600.jpg",
  },
} as const;

export type BannerFormat = keyof typeof AFFILIATE_BANNERS;

/**
 * The vertical video creatives, served as Impact's own ad-code iframe. They
 * carry no anchor of ours, so no placement ID can be attached: conversions
 * land under the campaign rather than a sub ID.
 */
export const AFFILIATE_VIDEO_ADS = {
  accountingOffer: { adId: "3997706", w: 1080, h: 1920, title: "Run your Accounting online" },
  taxCompliance: { adId: "3997674", w: 1080, h: 1920, title: "Tax Compliance" },
} as const;

export type VideoAdName = keyof typeof AFFILIATE_VIDEO_ADS;

/** The video used when a slot does not name one. */
export const DEFAULT_VIDEO_AD: VideoAdName = "accountingOffer";

/** A creative's own click link, from the Impact asset library, plus placement. */
export function bannerHref(format: BannerFormat, placement: string): string {
  if (!isValidPlacement(placement)) {
    throw new Error(`Invalid affiliate placement ID "${placement}".`);
  }
  const { adId } = AFFILIATE_BANNERS[format];
  return withPlacement(
    `https://sagesouthafrica.pxf.io/c/${IMPACT_PARTNER_ID}/${adId}/${SAGE_CAMPAIGN_ID}`,
    placement
  );
}

/**
 * A banner creative as an outbound link, so banners render through the same
 * AffiliateLink component as text CTAs and inherit the same rel and referrer
 * policy. There is no single product behind a banner, hence `slug: null`.
 */
export function bannerLink(format: BannerFormat, placement: string): OutboundLink {
  return {
    kind: "affiliate",
    href: bannerHref(format, placement),
    rel: AFFILIATE_REL,
    referrerPolicy: AFFILIATE_REFERRER_POLICY,
    program: "sage",
    brand: AFFILIATE_PROGRAMS.sage.brand,
    placement,
    slug: null,
  };
}

/** A creative's own hosted image, from Impact's CDN. */
export function bannerImageSrc(format: BannerFormat): string {
  const { adId } = AFFILIATE_BANNERS[format];
  return `https://a.impactradius-go.com/display-ad/${SAGE_CAMPAIGN_ID}-${adId}`;
}

/** Impact's ad-code iframe for a video creative. */
export function videoAdSrc(name: VideoAdName = DEFAULT_VIDEO_AD): string {
  const { adId } = AFFILIATE_VIDEO_ADS[name];
  return `https://a.impactradius-go.com/gen-ad-code/${IMPACT_PARTNER_ID}/${adId}/${SAGE_CAMPAIGN_ID}/`;
}

/**
 * Accessible name for an affiliate link. Starts with the same word that marks
 * the placement visibly, and says where the link opens, because every one of
 * these opens in a new tab.
 */
export function affiliateAriaLabel(action: string): string {
  return `${AD_LABEL}: ${action} (opens in a new tab)`;
}
