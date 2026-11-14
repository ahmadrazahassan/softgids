/**
 * What the browser actually sends when someone clicks an affiliate link.
 *
 *   npx playwright test
 *
 * The unit tests assert what we render. These assert what Chromium does with
 * it, which is the only thing Impact ever sees. Specifically: that the
 * `Referer` header on the outbound request is our own origin, and nothing more
 * than our origin.
 *
 * NO REAL CLICK IS EVER SENT. Every request to a tracking domain is aborted
 * before it leaves the browser, including the banner images, so running this
 * suite cannot register a click or an impression on the account. The headers
 * are read off the intercepted request.
 *
 * The last test is the regression proof: it takes the same real page, puts
 * `noreferrer` back on the link exactly as the old code had it, clicks it, and
 * shows the referrer vanish.
 */

import { expect, test, type APIRequestContext, type BrowserContext } from "@playwright/test";

/** Anything belonging to the affiliate network. Matched against the full URL. */
const TRACKING = /^https?:\/\/[^/]*(?:pxf\.io|sjv\.io|impactradius-go\.com|impactradius\.com)/;

type Navigation = { url: string; referer: string | null };

/**
 * Aborts every request to a tracking domain and records the ones that were
 * top-level navigations, i.e. actual clicks.
 */
async function interceptTracking(context: BrowserContext) {
  const navigations: Navigation[] = [];
  const aborted: string[] = [];

  await context.route(TRACKING, async (route) => {
    const request = route.request();
    const headers = await request.allHeaders();
    aborted.push(request.url());
    if (request.resourceType() === "document") {
      navigations.push({ url: request.url(), referer: headers["referer"] ?? null });
    }
    await route.abort();
  });

  return { navigations, aborted };
}

/**
 * Finds a product page that actually carries affiliate links, rather than
 * hard-coding a slug that a content change could retire.
 */
async function findAffiliatePage(request: APIRequestContext): Promise<string> {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();

  const paths = [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => new URL(match[1].trim()).pathname)
    .filter((path) => /^\/software\/[^/]+$/.test(path))
    // Only one vendor is monetised today, so try the likely pages first rather
    // than fetching the whole directory. Still falls through to the rest, so a
    // second programme does not break this.
    .sort((a, b) => Number(b.includes("sage")) - Number(a.includes("sage")));

  expect(paths.length, "sitemap listed no product pages").toBeGreaterThan(0);

  for (const path of paths) {
    const response = await request.get(path);
    if (!response.ok()) continue;
    if ((await response.text()).includes('data-outbound="affiliate"')) return path;
  }

  throw new Error("no product page carries an affiliate link");
}

let productPath: string;

test.beforeAll(async ({ request }) => {
  productPath = await findAffiliatePage(request);
  console.log(`  affiliate page under test: ${productPath}`);
});

test("a text CTA sends our origin as the referrer, and only the origin", async ({
  context,
  page,
  baseURL,
}) => {
  const captured = await interceptTracking(context);
  await page.goto(productPath);

  const link = page.locator('a[data-placement^="software-hero"]').first();
  await expect(link).toHaveAttribute("rel", "sponsored noopener");
  await expect(link).toHaveAttribute("referrerpolicy", "strict-origin-when-cross-origin");

  await link.click();
  await expect.poll(() => captured.navigations.length, { timeout: 15_000 }).toBeGreaterThan(0);

  const navigation = captured.navigations[0];
  const origin = `${new URL(baseURL!).origin}/`;

  console.log(`  AFTER  text CTA -> Referer: ${JSON.stringify(navigation.referer)}`);

  expect(navigation.referer, "Impact must see our domain, not nothing").toBe(origin);
  // The origin alone: no path, no query string, so a visitor's reading history
  // and any search terms stay out of the network's logs.
  expect(navigation.referer).not.toContain(productPath);
  expect(navigation.url).toContain("subId1=software-hero");
});

test("a banner sends our origin too, and uses its own creative link", async ({
  context,
  page,
  baseURL,
}) => {
  const captured = await interceptTracking(context);
  await page.goto(productPath);

  const banner = page.locator('a[data-placement^="software-billboard"]').first();
  await expect(banner).toHaveAttribute("rel", "sponsored noopener");
  await expect(banner).toHaveAttribute("referrerpolicy", "strict-origin-when-cross-origin");

  await banner.scrollIntoViewIfNeeded();
  await banner.click();
  await expect.poll(() => captured.navigations.length, { timeout: 15_000 }).toBeGreaterThan(0);

  const navigation = captured.navigations[0];
  console.log(`  AFTER  banner   -> Referer: ${JSON.stringify(navigation.referer)}`);

  expect(navigation.referer).toBe(`${new URL(baseURL!).origin}/`);
  // Its own creative click link, not the shared vanity link.
  expect(navigation.url).toMatch(/\/c\/\d+\/\d+\/\d+/);
  expect(navigation.url).toContain("subId1=software-billboard");
});

test("nothing we render leaks a request to the network before a click", async ({
  context,
  page,
}) => {
  const captured = await interceptTracking(context);
  await page.goto(productPath);
  await page.waitForLoadState("networkidle");

  // Banner images legitimately load from the network's CDN; a *navigation*
  // before anyone clicks would mean a fabricated click, which gets accounts
  // closed. There must be none.
  expect(captured.navigations, "a tracking URL was requested without a click").toEqual([]);
  for (const url of captured.aborted) {
    expect(url, "only banner creatives may be fetched").toMatch(
      /display-ad|gen-ad-code/
    );
  }
});

test("every affiliate link on the page carries disclosure and the referrer policy", async ({
  context,
  page,
}) => {
  await interceptTracking(context);
  await page.goto(productPath);

  const links = page.locator('a[data-outbound="affiliate"]');
  const count = await links.count();
  expect(count, "page under test must have affiliate links").toBeGreaterThan(0);

  for (let i = 0; i < count; i += 1) {
    const link = links.nth(i);
    const rel = (await link.getAttribute("rel")) ?? "";
    expect(rel, `link ${i}`).toContain("sponsored");
    expect(rel, `link ${i} must keep the referrer`).not.toContain("noreferrer");
    expect(await link.getAttribute("referrerpolicy"), `link ${i}`).toBe(
      "strict-origin-when-cross-origin"
    );
    expect(await link.getAttribute("aria-label"), `link ${i}`).toMatch(/^Sponsored/);
    expect(await link.getAttribute("href"), `link ${i}`).toContain("subId1=");
  }
});

test("REGRESSION: putting noreferrer back, as the old code had it, destroys the referrer", async ({
  context,
  page,
}) => {
  const captured = await interceptTracking(context);
  await page.goto(productPath);

  const selector = 'a[data-placement^="software-hero"]';

  // Exactly what this site shipped before: rel="noopener noreferrer sponsored".
  await page.evaluate((sel) => {
    const anchor = document.querySelector(sel);
    anchor?.setAttribute("rel", "noopener noreferrer sponsored");
    anchor?.removeAttribute("referrerpolicy");
  }, selector);

  await page.locator(selector).first().click();
  await expect.poll(() => captured.navigations.length, { timeout: 15_000 }).toBeGreaterThan(0);

  console.log(
    `  BEFORE noreferrer -> Referer: ${JSON.stringify(captured.navigations[0].referer)}`
  );

  // This is the bug, reproduced: no Referer header at all, which is what Impact
  // reports as "No referring domain".
  expect(
    captured.navigations[0].referer,
    "noreferrer should have stripped the referrer — if this fails the demonstration is broken"
  ).toBeNull();
});
