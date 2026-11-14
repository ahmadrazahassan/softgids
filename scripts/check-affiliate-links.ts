/**
 * Post-build affiliate link audit. Wired into `npm run build`, so a link that
 * would lose us commission stops the deploy.
 *
 *   npm run check:affiliate                  # boot `next start`, crawl, report
 *   npm run check:affiliate -- --limit 20    # quick local pass
 *   npm run check:affiliate -- --base-url https://softgids.co.za
 *   npm run check:affiliate -- --file some.html
 *
 * Why it crawls instead of reading `.next`: the pages that carry affiliate
 * links — /software/[slug], /compare/[pair], /category/[slug] — are all
 * dynamic, so almost none of them exist as prerendered HTML. Reading build
 * output would audit the handful of static pages and declare victory. So this
 * starts the production server, walks the sitemap and reads what a visitor
 * actually receives.
 *
 * For every link to a tracking domain, or any link disclosing itself as
 * `sponsored`, it insists on:
 *   - `sponsored` in rel            (disclosure)
 *   - no `noreferrer` in rel        (or Impact sees "No referring domain")
 *   - referrerpolicy=strict-origin-when-cross-origin
 *   - a valid subId1 placement      (so reporting shows which slot converted)
 *
 * It also fails on anything that would strip the referrer for a whole page, on
 * a prefetch of a tracking URL (every request to one counts as a click), and
 * on finding zero affiliate links at all — that last one means the audit
 * itself has broken, which is worse than a bad link.
 */

import { spawn, type ChildProcess } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  AFFILIATE_REFERRER_POLICY,
  SUB_ID_PARAM,
  isTrackingUrl,
  isValidPlacement,
} from "../lib/affiliate";

/* -------------------------------------------------------------------------- */
/*  Arguments                                                                 */
/* -------------------------------------------------------------------------- */

const argv = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};

const singleFile = flag("file");
const givenBaseUrl = flag("base-url");
const port = Number(flag("port") ?? 4319);
const limit = Number(flag("limit") ?? Infinity);
const concurrency = Number(flag("concurrency") ?? 8);

/* -------------------------------------------------------------------------- */
/*  Findings                                                                  */
/* -------------------------------------------------------------------------- */

type Problem = { page: string; detail: string; snippet?: string };

const problems: Problem[] = [];
let affiliateLinkCount = 0;
let pagesChecked = 0;

const fail = (page: string, detail: string, snippet?: string) =>
  problems.push({ page, detail, snippet });

/* -------------------------------------------------------------------------- */
/*  HTML auditing                                                             */
/* -------------------------------------------------------------------------- */

const attr = (tag: string, name: string): string | null => {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, "i"));
  return match ? match[1] : null;
};

/** Collapses a tag to something readable in a build log. */
const brief = (tag: string) => tag.replace(/\s+/g, " ").slice(0, 220);

function auditHtml(page: string, html: string) {
  pagesChecked += 1;

  /* ---- Page-level referrer killers ------------------------------------- */

  for (const meta of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = meta[0];
    if (attr(tag, "name")?.toLowerCase() !== "referrer") continue;
    const content = attr(tag, "content")?.toLowerCase() ?? "";
    if (content === "no-referrer" || content === "same-origin") {
      fail(page, `<meta name="referrer"> set to "${content}" strips the referrer site-wide`, brief(tag));
    }
  }

  // <meta http-equiv="refresh"> to a tracking URL: an interstitial hop that
  // can replace or drop the referrer before the network ever sees it.
  for (const meta of html.matchAll(/<meta\b[^>]*http-equiv\s*=\s*"refresh"[^>]*>/gi)) {
    const tag = meta[0];
    if (/pxf\.io|sjv\.io|impactradius/i.test(tag)) {
      fail(page, "meta refresh pointing at a tracking URL", brief(tag));
    }
  }

  /* ---- Prefetched / preloaded tracking URLs ---------------------------- */

  for (const linkTag of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = linkTag[0];
    const rel = (attr(tag, "rel") ?? "").toLowerCase();
    const href = attr(tag, "href") ?? "";
    if (!/prefetch|preload|preconnect|dns-prefetch/.test(rel)) continue;
    if (href && isTrackingUrl(href)) {
      fail(page, `<link rel="${rel}"> on a tracking URL — every request counts as a click`, brief(tag));
    }
  }

  /* ---- Anchors ---------------------------------------------------------- */

  for (const anchor of html.matchAll(/<a\b[^>]*>/gi)) {
    const tag = anchor[0];
    const href = attr(tag, "href") ?? "";
    const rel = (attr(tag, "rel") ?? "").toLowerCase();
    const relTokens = rel.split(/\s+/).filter(Boolean);

    const tracking = href !== "" && isTrackingUrl(href);
    const disclosed = relTokens.includes("sponsored");
    if (!tracking && !disclosed) continue;

    affiliateLinkCount += 1;

    if (!disclosed) {
      fail(page, `affiliate link missing "sponsored" in rel (rel="${rel}")`, brief(tag));
    }

    if (relTokens.includes("noreferrer")) {
      fail(
        page,
        `affiliate link carries "noreferrer" — the network will report this click ` +
          `under "No referring domain"`,
        brief(tag)
      );
    }

    const policy = (attr(tag, "referrerpolicy") ?? "").toLowerCase();
    if (policy !== AFFILIATE_REFERRER_POLICY) {
      fail(
        page,
        `affiliate link referrerpolicy is "${policy || "(absent)"}", expected ` +
          `"${AFFILIATE_REFERRER_POLICY}"`,
        brief(tag)
      );
    }

    // Placement only makes sense on a real tracking URL.
    if (tracking) {
      let placement: string | null = null;
      try {
        placement = new URL(href).searchParams.get(SUB_ID_PARAM);
      } catch {
        fail(page, `affiliate href is not a valid URL: ${href}`, brief(tag));
        continue;
      }

      if (!placement) {
        fail(page, `affiliate link has no ${SUB_ID_PARAM} placement: ${href}`, brief(tag));
      } else if (!isValidPlacement(placement)) {
        fail(page, `invalid ${SUB_ID_PARAM} placement "${placement}": ${href}`, brief(tag));
      }
    }
  }
}

/* -------------------------------------------------------------------------- */
/*  Crawling                                                                  */
/* -------------------------------------------------------------------------- */

function auditHeaders(page: string, headers: Headers) {
  const policy = headers.get("referrer-policy")?.toLowerCase();
  if (policy === "no-referrer" || policy === "same-origin") {
    fail(page, `response header Referrer-Policy: ${policy} strips the referrer for this page`);
  }
}

async function sitemapUrls(baseUrl: string): Promise<string[]> {
  const response = await fetch(new URL("/sitemap.xml", baseUrl));
  if (!response.ok) {
    throw new Error(`sitemap.xml returned ${response.status}`);
  }
  const xml = await response.text();
  const paths = new Set<string>(["/"]);

  for (const loc of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    try {
      // The sitemap is written with the public origin; crawl the local one.
      paths.add(new URL(loc[1].trim()).pathname);
    } catch {
      /* ignore a malformed entry rather than abort the audit */
    }
  }

  return [...paths].sort().slice(0, limit).map((p) => new URL(p, baseUrl).toString());
}

async function crawl(baseUrl: string) {
  const urls = await sitemapUrls(baseUrl);
  if (urls.length === 0) throw new Error("sitemap listed no pages to crawl");

  console.log(`Crawling ${urls.length} page(s) at ${baseUrl}`);

  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, urls.length) }, async () => {
    while (cursor < urls.length) {
      const url = urls[cursor++];
      const page = new URL(url).pathname;
      try {
        const response = await fetch(url, { redirect: "follow" });
        if (!response.ok) {
          fail(page, `page returned HTTP ${response.status}`);
          continue;
        }
        auditHeaders(page, response.headers);
        auditHtml(page, await response.text());
      } catch (error) {
        fail(page, `could not be fetched: ${(error as Error).message}`);
      }
    }
  });

  await Promise.all(workers);
}

/* -------------------------------------------------------------------------- */
/*  Production server                                                         */
/* -------------------------------------------------------------------------- */

async function waitForServer(baseUrl: string, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl, { redirect: "manual" });
      if (response.status < 500) return;
    } catch {
      /* not up yet */
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error(`server at ${baseUrl} did not become ready within ${timeoutMs}ms`);
}

async function startServer(): Promise<{ baseUrl: string; stop: () => void }> {
  const baseUrl = `http://127.0.0.1:${port}`;

  // Run the Next CLI through node itself rather than the npx shim. Node 24 on
  // Windows refuses to spawn a .cmd without a shell (EINVAL), and going via a
  // shell just to work around that invites quoting bugs.
  const nextBin = join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
  const child: ChildProcess = spawn(
    process.execPath,
    [nextBin, "start", "--port", String(port)],
    { cwd: process.cwd(), stdio: ["ignore", "pipe", "pipe"], shell: false }
  );

  let log = "";
  child.stdout?.on("data", (chunk) => (log += chunk));
  child.stderr?.on("data", (chunk) => (log += chunk));

  const stop = () => {
    if (child.pid && !child.killed) child.kill();
  };

  try {
    await waitForServer(baseUrl);
  } catch (error) {
    stop();
    console.error(log.slice(-2000));
    throw error;
  }

  return { baseUrl, stop };
}

/* -------------------------------------------------------------------------- */
/*  Report                                                                    */
/* -------------------------------------------------------------------------- */

function report(): number {
  console.log("");

  if (problems.length > 0) {
    const byPage = new Map<string, Problem[]>();
    for (const problem of problems) {
      const list = byPage.get(problem.page) ?? [];
      list.push(problem);
      byPage.set(problem.page, list);
    }

    console.error("Affiliate link audit FAILED\n");
    for (const [page, list] of [...byPage.entries()].sort()) {
      console.error(`  ${page}`);
      for (const problem of list) {
        console.error(`    - ${problem.detail}`);
        if (problem.snippet) console.error(`      ${problem.snippet}`);
      }
      console.error("");
    }
    console.error(
      `${problems.length} problem(s) across ${byPage.size} page(s). ` +
        `Fix them in lib/affiliate.ts / AffiliateLink, not at the call site.`
    );
    return 1;
  }

  // Zero affiliate links means the audit stopped auditing. Treat the broken
  // check as a failure: a silently passing guard is worse than none.
  if (affiliateLinkCount === 0) {
    console.error(
      "Affiliate link audit FAILED\n\n" +
        `  Checked ${pagesChecked} page(s) and found no affiliate links at all.\n` +
        "  Either every monetised link has disappeared from the site, or this\n" +
        "  check is no longer looking in the right place. Both need a human."
    );
    return 1;
  }

  console.log(
    `Affiliate link audit passed: ${affiliateLinkCount} affiliate link(s) ` +
      `across ${pagesChecked} page(s), all disclosed, all keeping the referrer.`
  );
  return 0;
}

/* -------------------------------------------------------------------------- */
/*  Entry                                                                     */
/* -------------------------------------------------------------------------- */

async function main(): Promise<number> {
  if (singleFile) {
    auditHtml(singleFile, readFileSync(singleFile, "utf8"));
    return report();
  }

  if (givenBaseUrl) {
    await crawl(givenBaseUrl.replace(/\/+$/, ""));
    return report();
  }

  const { baseUrl, stop } = await startServer();
  try {
    await crawl(baseUrl);
  } finally {
    stop();
  }
  return report();
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error(`Affiliate link audit could not run: ${error.message}`);
    process.exit(1);
  });
