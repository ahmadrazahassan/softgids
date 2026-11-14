# Affiliate tracking

Everything about affiliate links lives in **[`lib/affiliate.ts`](../../lib/affiliate.ts)**.
Tracking links, banner creatives, placement IDs and the link attributes are all
defined there, and every affiliate link and banner on the site renders through
**[`AffiliateLink`](../../components/public/AffiliateLink.tsx)**. There are no
hand-written affiliate anchors anywhere else, and three guards keep it that way.

Network: **Impact** (`sagesouthafrica.pxf.io`), partner `7483506`, campaign `34654`.
Domain as it must be registered in Impact: **`softgids.co.za`**.

## The three things that have to stay true

1. **The click reaches the network.** Links are real `<a href>` elements with
   the issued tracking URL, server-rendered into the HTML. No JavaScript URL
   building, no interstitial, no redirect hop. They work with JS disabled.
2. **The network sees our domain.** `rel="sponsored noopener"` and
   `referrerpolicy="strict-origin-when-cross-origin"`.
   **Never add `noreferrer`.** It deletes the `Referer` header, Impact reports
   the click under "No referring domain", and it may not be credited. That one
   keyword was the original bug on this site.
3. **Every click carries a placement ID** in Impact's `subId1` parameter, so
   reporting shows which button or banner converted.

## Placement IDs

Built by `placementId(slot, slug)` — lowercase letters, digits and single
hyphens, max 64 characters, e.g. `software-hero-sage-business-cloud-accounting`.

Never put personal data in one (no email, user ID, IP address or search term):
the value reaches Impact on every click and is stored by them. A placement
names a slot on a page, nothing else.

| Slot | Where |
| --- | --- |
| `home-card` | Top-rated cards on the homepage |
| `explore-card` | Category tabs on the homepage |
| `blog-card` | Related-product card on an article |
| `software-hero` | Vendor CTA band on a product page |
| `software-pricing-plan` / `software-pricing-band` | Pricing block on a product page |
| `software-billboard` | 970x250 banner on a product page |
| `reviews-halfpage` | 300x600 banner on a reviews page |
| `compare-hero` / `compare-sticky` | Comparison header and sticky bar |
| `compare-pricing-plan` / `compare-pricing-band` | Pricing blocks on a comparison |

## Creatives

`AFFILIATE_BANNERS` and `AFFILIATE_VIDEO_ADS` are transcribed from the
programme's own ad export, kept here as
[`impact-sage-ads-export.csv`](./impact-sage-ads-export.csv). A test asserts
the code still matches that file — ad ID, dimensions, creative filename and
click link — so a mistyped ID fails the build instead of serving a dead banner.

Available units: 320x50, 728x90, 970x250, 300x250, 300x600, 160x600, 120x600,
plus two 9:16 video creatives. Drop one in with
`<SponsoredAd format="mediumRectangle" slot="..." slug={...} />`.

Banner images are served from Impact's CDN, so a visitor's IP reaches Impact
when a page carrying one loads. That is disclosed in the privacy policy. The
programme does not permit re-hosting creatives, so self-hosting is not an option.

There are **no impression pixels**. The previous version loaded a hidden 0x0
image at `imp.pxf.io` inside the anchor; it was redundant and looked exactly
like the hidden-tracker pattern networks treat as cookie stuffing.

## Guards

| Guard | Command | What it catches |
| --- | --- | --- |
| Unit tests | `npm test` | Attributes, tracking URLs, placement validation, catalogue vs CSV, and any hand-written affiliate `rel` or tracking URL in `app/`, `components/`, `lib/`, `scripts/` |
| Post-build scan | `npm run check:affiliate` (runs as part of `npm run build`) | Crawls the running production server and audits every rendered affiliate link |
| Browser test | `npx playwright test` | What Chromium actually sends: the `Referer` header on a real click |

The post-build scan **crawls** rather than reading `.next`, because the pages
that carry affiliate links (`/software/[slug]`, `/compare/[pair]`,
`/category/[slug]`) are all dynamic and barely exist as prerendered HTML.

It fails the build if any affiliate link is missing `sponsored`, carries
`noreferrer`, has the wrong `referrerpolicy` or lacks a valid `subId1` — and
also if it finds **zero** affiliate links, since that means the check itself
has broken.

The Playwright suite aborts every request to a tracking domain before it leaves
the browser, so running it never registers a real click or impression.

## Clicks in our own database

Affiliate anchors point straight at Impact. A separate delegated listener,
[`AffiliateClickBeacon`](../../components/public/AffiliateClickBeacon.tsx),
posts a `navigator.sendBeacon` to `/api/track-click` purely so `/admin/analytics`
keeps a count of our own, including the placement.

That route no longer redirects anything. If the beacon is blocked, throws, or
never loads, the click still reaches Impact and still earns — which is the whole
reason it is arranged this way round.

Migration `008_affiliate_click_placement.sql` adds the `placement` column. Until
it is applied the route falls back to inserting without it.

## Things only a human can do

- **Register `softgids.co.za` as a property in Impact.** Without it, Impact may
  still report clicks under "No referring domain" no matter what we send.
- **Create per-landing-page links** in Impact's link builder if a slot should
  deep-link. The export marks every creative `AllowDeepLinking=true`.
  Do **not** append `u=` to the short link `KBY30A` — Impact documents `u=` for
  full tracking links only.
- **Test on the live site by clicking a link.** Pasting a tracking URL into the
  address bar always shows "No referring domain": a typed URL has no referrer.
- **Wait for Impact's reporting delay** (a few hours) before judging the result.
