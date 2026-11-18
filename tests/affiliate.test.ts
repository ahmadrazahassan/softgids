/**
 * Guard rails for affiliate tracking.
 *
 *   npm test
 *
 * These exist because the failure they catch is silent. A stray `noreferrer`
 * costs real commission and nothing on the site looks broken: the button still
 * works, the vendor page still loads, and the only symptom is "No referring
 * domain" in a dashboard nobody checks daily. So the attributes, the tracking
 * URLs and the placement IDs are all asserted here, and the last block walks
 * the source tree to make sure nobody has hand-written an affiliate anchor
 * outside lib/affiliate.ts.
 */

import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, test } from "node:test";

import {
  AFFILIATE_BANNERS,
  AFFILIATE_PROGRAMS,
  AFFILIATE_REFERRER_POLICY,
  AFFILIATE_REL,
  AFFILIATE_VIDEO_ADS,
  DEFAULT_VIDEO_AD,
  IMPACT_PARTNER_ID,
  PLAIN_OUTBOUND_REL,
  SAGE_CAMPAIGN_ID,
  SUB_ID_PARAM,
  affiliateAriaLabel,
  affiliateHref,
  bannerHref,
  bannerImageSrc,
  bannerLink,
  isTrackingUrl,
  isValidPlacement,
  outboundLink,
  placementId,
  programForSlug,
} from "../lib/affiliate";
import { placeholderSoftware } from "../lib/placeholder/software";

const REPO_ROOT = join(import.meta.dirname, "..");

/* ========================================================================== */
/*  Link attributes                                                           */
/* ========================================================================== */

describe("affiliate link attributes", () => {
  test("rel discloses the link and isolates the new tab", () => {
    const tokens = AFFILIATE_REL.split(/\s+/);
    assert.ok(tokens.includes("sponsored"), "rel must contain `sponsored`");
    assert.ok(tokens.includes("noopener"), "rel must contain `noopener`");
  });

  test("rel never contains noreferrer", () => {
    // The whole point. `noreferrer` strips the Referer header, Impact reports
    // the click under "No referring domain", and it may not be credited.
    assert.ok(
      !AFFILIATE_REL.includes("noreferrer"),
      `AFFILIATE_REL must never contain noreferrer, got "${AFFILIATE_REL}"`
    );
    assert.ok(!PLAIN_OUTBOUND_REL.includes("noreferrer"));
  });

  test("referrer policy sends our origin and nothing more", () => {
    assert.equal(AFFILIATE_REFERRER_POLICY, "strict-origin-when-cross-origin");
  });

  test("an unpaid vendor link is not disclosed as sponsored", () => {
    assert.ok(!PLAIN_OUTBOUND_REL.includes("sponsored"));
    assert.ok(PLAIN_OUTBOUND_REL.split(/\s+/).includes("nofollow"));
  });

  test("accessible name opens with the ad word and names the new tab", () => {
    const label = affiliateAriaLabel("Visit Sage website");
    assert.ok(/^Sponsored/.test(label), `aria-label must start with the ad word: ${label}`);
    assert.ok(label.includes("opens in a new tab"), label);
  });
});

/* ========================================================================== */
/*  Tracking URLs                                                             */
/* ========================================================================== */

describe("tracking URLs", () => {
  test("the Sage programme link is the one Impact issued", () => {
    assert.equal(AFFILIATE_PROGRAMS.sage.url, "https://sagesouthafrica.pxf.io/KBY30A");
  });

  test("building a link adds the placement and changes nothing else", () => {
    const href = affiliateHref("sage", "home-card-sage-accounting");
    const url = new URL(href);
    const issued = new URL(AFFILIATE_PROGRAMS.sage.url);

    assert.equal(url.origin, issued.origin, "origin must not change");
    assert.equal(url.pathname, issued.pathname, "path must not change");
    assert.equal(url.searchParams.get(SUB_ID_PARAM), "home-card-sage-accounting");
    assert.equal([...url.searchParams.keys()].length, 1, "only the sub ID is added");
  });

  test("no deep-link parameter is bolted onto the short link", () => {
    // Impact documents `u=` for full tracking links only. On a vanity link a
    // per-landing-page link has to be created in the link builder instead.
    const href = affiliateHref("sage", "software-hero-sage-accounting");
    assert.ok(!href.includes("u="), href);
  });

  test("tracking hosts are recognised, our own domain is not", () => {
    assert.ok(isTrackingUrl("https://sagesouthafrica.pxf.io/KBY30A"));
    assert.ok(isTrackingUrl("https://a.impactradius-go.com/display-ad/34654-3067398"));
    assert.ok(!isTrackingUrl("https://softgids.co.za/software/sage-accounting"));
    assert.ok(!isTrackingUrl("/software/sage-accounting"));
    // A lookalike host must not pass as a tracking domain.
    assert.ok(!isTrackingUrl("https://pxf.io.evil.example/KBY30A"));
  });

  test("every tracking URL is https", () => {
    for (const [name, program] of Object.entries(AFFILIATE_PROGRAMS)) {
      assert.equal(new URL(program.url).protocol, "https:", `${name} must be https`);
    }
  });
});

/* ========================================================================== */
/*  Placement IDs                                                             */
/* ========================================================================== */

describe("placement IDs", () => {
  test("accepts the shapes we use", () => {
    for (const id of [
      "home-card-sage-accounting",
      "software-hero-sage-accounting",
      "software-billboard-sage-accounting",
      "compare-sticky-sage-payroll",
      "explore-card",
    ]) {
      assert.ok(isValidPlacement(id), `expected valid: ${id}`);
    }
  });

  test("rejects anything that would break a sub ID or leak data", () => {
    for (const id of [
      "",
      "a",
      "Home-Hero", // uppercase
      "home hero", // space
      "home_hero", // underscore
      "home--hero", // doubled separator
      "home-hero-", // trailing separator
      "-home-hero", // leading separator
      "user@example.com", // personal data
      "home-hero?x=1", // query injection
      "a".repeat(65), // too long
    ]) {
      assert.ok(!isValidPlacement(id), `expected invalid: ${JSON.stringify(id)}`);
    }
  });

  test("placementId composes a slot and a slug", () => {
    assert.equal(
      placementId("software-hero", "sage-accounting"),
      "software-hero-sage-accounting"
    );
    assert.equal(placementId("explore-card"), "explore-card");
  });

  test("an invalid placement throws rather than shipping a broken sub ID", () => {
    assert.throws(() => placementId("software hero", "sage"), /Invalid affiliate placement/);
    assert.throws(() => affiliateHref("sage", "Bad Placement"), /Invalid affiliate placement/);
    assert.throws(() => bannerHref("billboard", "bad placement"), /Invalid affiliate placement/);
  });

  test("placement IDs stay well inside Impact's 255 character limit", () => {
    const longest = placementId(
      "software-billboard",
      placeholderSoftware
        .map((s) => s.slug)
        .reduce((a, b) => (a.length > b.length ? a : b))
    );
    assert.ok(longest.length <= 64, `${longest} is ${longest.length} chars`);
  });
});

/* ========================================================================== */
/*  Resolving a product to its link                                           */
/* ========================================================================== */

describe("outboundLink", () => {
  test("every product in the roster resolves to a usable link", () => {
    assert.ok(placeholderSoftware.length > 0, "roster must not be empty");

    for (const software of placeholderSoftware) {
      const link = outboundLink(software, "home-card");
      assert.ok(link, `${software.slug} resolved to no link at all`);

      assert.equal(link.referrerPolicy, AFFILIATE_REFERRER_POLICY, software.slug);
      assert.ok(!link.rel.includes("noreferrer"), software.slug);

      if (programForSlug(software.slug)) {
        assert.equal(link.kind, "affiliate", `${software.slug} must be monetised`);
        if (link.kind !== "affiliate") return;
        assert.equal(link.rel, AFFILIATE_REL);
        assert.equal(
          new URL(link.href).origin,
          new URL(AFFILIATE_PROGRAMS.sage.url).origin,
          software.slug
        );
        assert.equal(
          new URL(link.href).searchParams.get(SUB_ID_PARAM),
          `home-card-${software.slug}`
        );
        assert.equal(link.slug, software.slug);
      } else {
        assert.equal(link.kind, "plain", `${software.slug} is not a paid placement`);
        assert.equal(link.rel, PLAIN_OUTBOUND_REL);
        assert.ok(!isTrackingUrl(link.href), `${software.slug} must not be a tracking URL`);
      }
    }
  });

  test("a covered product carries a tracking URL on every slot we render", () => {
    const sage = placeholderSoftware.find((s) => programForSlug(s.slug));
    assert.ok(sage, "roster must include a product the programme covers");

    const slots = [
      "home-card",
      "explore-card",
      "blog-card",
      "software-hero",
      "software-pricing-plan",
      "software-pricing-band",
      "compare-hero",
      "compare-sticky",
      "compare-pricing-plan",
      "compare-pricing-band",
    ];

    const placements = new Set<string>();
    for (const slot of slots) {
      const link = outboundLink(sage, slot);
      assert.ok(link && link.kind === "affiliate", slot);
      if (link.kind !== "affiliate") return;
      assert.ok(isTrackingUrl(link.href), slot);
      assert.ok(isValidPlacement(link.placement), `${slot} -> ${link.placement}`);
      placements.add(link.placement);
    }
    assert.equal(placements.size, slots.length, "each slot must report distinctly");
  });

  test("a vendor's other products are NOT sent to the covered product's offer", () => {
    // The affiliate manager's complaint, as a guard. The Impact campaign sells
    // Sage Accounting; every creative lands on an accounting page. Someone
    // reading about Sage X3 or Sage CRM must not be clicked through to a small
    // business accounting offer.
    const sageProducts = placeholderSoftware.filter((s) => s.vendor_name === "Sage");
    assert.ok(sageProducts.length > 1, "roster must carry several Sage products");

    const uncovered = sageProducts.filter((s) => !programForSlug(s.slug));
    assert.ok(uncovered.length > 0, "expected Sage products outside the programme");

    for (const software of uncovered) {
      const link = outboundLink(software, "software-hero");
      assert.ok(link, software.slug);
      assert.equal(link.kind, "plain", `${software.slug} is not sold by this programme`);
      assert.ok(
        !isTrackingUrl(link.href),
        `${software.slug} must link to its own vendor page, not a tracking URL`
      );
      assert.ok(!link.rel.includes("sponsored"), software.slug);
      // And it must point at a page about THAT product.
      assert.ok(
        /^https:\/\//.test(link.href),
        `${software.slug} needs a real vendor URL, got "${link.href}"`
      );
    }
  });

  test("a stale affiliate_url in the data cannot widen the programme", () => {
    // Rows in Supabase still carry affiliate_url from before the scope was
    // narrowed. The allowlist, not the column, decides what is monetised.
    const link = outboundLink(
      {
        slug: "sage-x3",
        vendor_name: "Sage",
        affiliate_url: "https://sagesouthafrica.pxf.io/KBY30A",
        vendor_website: "https://www.sage.com/en-za/sage-business-cloud/sage-x3/",
      },
      "software-hero"
    );
    assert.ok(link);
    assert.equal(link.kind, "plain");
    assert.ok(!isTrackingUrl(link.href), link.href);
  });

  test("no destination at all yields no link, rather than a dead button", () => {
    assert.equal(
      outboundLink({ slug: "x", vendor_name: "Nobody", vendor_website: null }, "home-card"),
      null
    );
  });
});

/* ========================================================================== */
/*  Banner creatives                                                          */
/* ========================================================================== */

describe("banner creatives", () => {
  test("each creative has its own click link, image and dimensions", () => {
    const adIds = new Set<string>();
    const hrefs = new Set<string>();

    for (const [format, creative] of Object.entries(AFFILIATE_BANNERS)) {
      assert.match(creative.adId, /^\d+$/, format);
      assert.ok(creative.w > 0 && creative.h > 0, `${format} needs width and height`);
      assert.ok(creative.alt.length > 0, `${format} needs real alt text`);

      const href = bannerHref(format as keyof typeof AFFILIATE_BANNERS, "software-billboard");
      assert.ok(isTrackingUrl(href), format);
      assert.ok(href.includes(`/${creative.adId}/`), `${format} must use its own ad ID`);

      assert.ok(bannerImageSrc(format as keyof typeof AFFILIATE_BANNERS).includes(creative.adId));

      adIds.add(creative.adId);
      hrefs.add(href);
    }

    assert.equal(adIds.size, Object.keys(AFFILIATE_BANNERS).length, "ad IDs must be distinct");
    assert.equal(hrefs.size, Object.keys(AFFILIATE_BANNERS).length, "click links must be distinct");

    for (const [name, video] of Object.entries(AFFILIATE_VIDEO_ADS)) {
      assert.ok(!adIds.has(video.adId), `video "${name}" must be its own ad`);
    }
  });

  test("the default video creative exists", () => {
    assert.ok(AFFILIATE_VIDEO_ADS[DEFAULT_VIDEO_AD], DEFAULT_VIDEO_AD);
  });

  test("a banner renders through the same attributes as a text link", () => {
    const link = bannerLink("halfpage", "reviews-halfpage-sage-accounting");
    assert.equal(link.kind, "affiliate");
    assert.equal(link.rel, AFFILIATE_REL);
    assert.equal(link.referrerPolicy, AFFILIATE_REFERRER_POLICY);
    assert.ok(!link.rel.includes("noreferrer"));
  });
});

/* ========================================================================== */
/*  The creative catalogue matches the programme's own ad export              */
/* ========================================================================== */

/** Minimal RFC 4180 reader: the export quotes fields that contain commas. */
function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if (quoted) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 1;
        } else quoted = false;
      } else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") field += ch;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

type AdRow = Record<string, string>;

function adExport(): Map<string, AdRow> {
  const csv = readFileSync(
    join(REPO_ROOT, "docs", "affiliate", "impact-sage-ads-export.csv"),
    "utf8"
  ).replace(/^﻿/, "");

  const [header, ...body] = parseCsv(csv);
  const ads = new Map<string, AdRow>();

  for (const cells of body) {
    const row: AdRow = {};
    header.forEach((name, i) => (row[name.trim()] = (cells[i] ?? "").trim()));
    if (row.AdId) ads.set(row.AdId, row);
  }
  return ads;
}

describe("creative catalogue vs the Impact ad export", () => {
  test("the export is present and readable", () => {
    const ads = adExport();
    assert.ok(ads.size > 0, "docs/affiliate/impact-sage-ads-export.csv parsed to nothing");
  });

  test("every banner matches its row in the export", () => {
    const ads = adExport();

    for (const [name, creative] of Object.entries(AFFILIATE_BANNERS)) {
      const row = ads.get(creative.adId);
      assert.ok(row, `${name}: ad ID ${creative.adId} is not in the export`);
      if (!row) continue;

      assert.equal(row.State, "ACTIVE", `${name} (${creative.adId}) is not ACTIVE`);
      assert.equal(row.AdType, "IMAGE", `${name} (${creative.adId}) is not an image ad`);
      assert.equal(
        row.ThirdPartyServableAdCreativeWidth,
        String(creative.w),
        `${name} width disagrees with the export`
      );
      assert.equal(
        row.ThirdPartyServableAdCreativeHeight,
        String(creative.h),
        `${name} height disagrees with the export`
      );
      assert.equal(row.Creative, creative.creative, `${name} creative filename drifted`);

      // The click link we build must be the one Impact issued, bar the sub ID.
      const built = new URL(bannerHref(name as keyof typeof AFFILIATE_BANNERS, "test-slot"));
      built.searchParams.delete(SUB_ID_PARAM);
      assert.equal(
        built.toString().replace(/\?$/, ""),
        row.TrackingLink,
        `${name} click link does not match the export's TrackingLink`
      );
    }
  });

  test("every video creative matches its row in the export", () => {
    const ads = adExport();

    for (const [name, video] of Object.entries(AFFILIATE_VIDEO_ADS)) {
      const row = ads.get(video.adId);
      assert.ok(row, `${name}: ad ID ${video.adId} is not in the export`);
      if (!row) continue;

      assert.equal(row.State, "ACTIVE", `${name} is not ACTIVE`);
      assert.equal(row.AdType, "VIDEO", `${name} is not a video ad`);
      assert.equal(row.ThirdPartyServableAdCreativeWidth, String(video.w), name);
      assert.equal(row.ThirdPartyServableAdCreativeHeight, String(video.h), name);
      assert.equal(row.Name, video.title, `${name} title drifted from the export`);
    }
  });

  test("every creative we use belongs to our partner and campaign", () => {
    const ads = adExport();
    const ourIds = [
      ...Object.values(AFFILIATE_BANNERS).map((b) => b.adId),
      ...Object.values(AFFILIATE_VIDEO_ADS).map((v) => v.adId),
    ];

    for (const adId of ourIds) {
      const row = ads.get(adId);
      assert.ok(row, adId);
      assert.ok(
        row?.TrackingLink.includes(`/c/${IMPACT_PARTNER_ID}/${adId}/${SAGE_CAMPAIGN_ID}`),
        `${adId}: export TrackingLink is not ours — ${row?.TrackingLink}`
      );
    }
  });

  test("alt text is written for every creative, since the export has none", () => {
    const ads = adExport();
    for (const [name, creative] of Object.entries(AFFILIATE_BANNERS)) {
      assert.ok(
        creative.alt.trim().length > 3,
        `${name} needs real alt text; the export's ImageAlternativeTag is empty`
      );
      assert.equal(ads.get(creative.adId)?.ImageAlternativeTag ?? "", "");
    }
  });
});

/* ========================================================================== */
/*  Nobody hand-writes an affiliate link                                      */
/* ========================================================================== */

const SCAN_DIRS = ["app", "components", "lib", "scripts"];
const CENTRAL = join("lib", "affiliate.ts");

function sourceFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
        walk(full);
      } else if (/\.(ts|tsx|mts|js|mjs|jsx)$/.test(entry.name)) {
        out.push(full);
      }
    }
  };
  for (const dir of SCAN_DIRS) walk(join(REPO_ROOT, dir));
  return out;
}

describe("source tree", () => {
  test("no file outside lib/affiliate.ts hard-codes a sponsored rel", () => {
    const offenders: string[] = [];

    for (const file of sourceFiles()) {
      const rel = relative(REPO_ROOT, file);
      const source = readFileSync(file, "utf8");

      // Literal rel attributes only. `rel={link.rel}` is the approved route.
      for (const match of source.matchAll(/\brel\s*=\s*["']([^"']*)["']/g)) {
        if (match[1].includes("sponsored")) {
          offenders.push(`${rel}: rel="${match[1]}"`);
        }
      }
    }

    assert.deepEqual(
      offenders,
      [],
      `Affiliate attributes belong to lib/affiliate.ts via AffiliateLink:\n  ${offenders.join("\n  ")}`
    );
  });

  test("no affiliate link anywhere carries noreferrer", () => {
    const offenders: string[] = [];

    for (const file of sourceFiles()) {
      const rel = relative(REPO_ROOT, file);
      const source = readFileSync(file, "utf8");

      for (const match of source.matchAll(/\brel\s*=\s*["']([^"']*)["']/g)) {
        const value = match[1];
        if (value.includes("noreferrer") && value.includes("sponsored")) {
          offenders.push(`${rel}: rel="${value}"`);
        }
      }

      // window.open(..., "noreferrer") strips the referrer just as hard.
      if (/window\.open\([^)]*noreferrer/.test(source)) {
        offenders.push(`${rel}: window.open(..., "noreferrer")`);
      }
    }

    assert.deepEqual(offenders, [], offenders.join("\n  "));
  });

  test("no file outside lib/affiliate.ts contains a tracking URL literal", () => {
    const offenders: string[] = [];

    for (const file of sourceFiles()) {
      const rel = relative(REPO_ROOT, file);
      if (rel === CENTRAL || rel === CENTRAL.split(sep).join("/")) continue;

      const source = readFileSync(file, "utf8");
      for (const match of source.matchAll(
        /https?:\/\/[^\s"'`)]*(?:pxf\.io|sjv\.io|impactradius)[^\s"'`)]*/g
      )) {
        offenders.push(`${rel}: ${match[0]}`);
      }
    }

    assert.deepEqual(
      offenders,
      [],
      `Tracking URLs belong in AFFILIATE_PROGRAMS / AFFILIATE_BANNERS:\n  ${offenders.join("\n  ")}`
    );
  });

  test("no tracking URL is prefetched, preloaded or fetched server-side", () => {
    // Every request to a tracking URL counts as a click. Fabricated clicks are
    // what gets an affiliate account closed.
    const offenders: string[] = [];

    for (const file of sourceFiles()) {
      const rel = relative(REPO_ROOT, file);
      const source = readFileSync(file, "utf8");

      for (const pattern of [
        /rel\s*=\s*["'](?:prefetch|preload|dns-prefetch|preconnect)["']/g,
        /<link[^>]+(?:pxf\.io|sjv\.io|impactradius)/g,
      ]) {
        for (const match of source.matchAll(pattern)) {
          // Only a problem when it points at a network. A prefetch of our own
          // routes is ordinary Next.js behaviour.
          if (/pxf\.io|sjv\.io|impactradius/.test(match[0])) {
            offenders.push(`${rel}: ${match[0]}`);
          }
        }
      }
    }

    assert.deepEqual(offenders, [], offenders.join("\n  "));
  });
});
