/**
 * Fetch real vendor logos for the new-wave roster into public/logos/<slug>.png.
 *
 *   node scripts/download-logos.mjs
 *
 * For each product we try several public logo/favicon endpoints across the
 * vendor's domains and keep the highest-resolution PNG returned. Products
 * whose best result is still too small are printed at the end so a crisp
 * branded SVG fallback can be authored instead. Rerunnable; overwrites.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const OUT_DIR = resolve(process.cwd(), "public/logos");
mkdirSync(OUT_DIR, { recursive: true });

/* slug -> ordered list of candidate domains (most specific first) */
const TARGETS = {
  "sage-payroll-professional": ["sage.com"],
  "sage-300-people": ["sage.com"],
  "sage-intacct": ["sageintacct.com", "sage.com"],
  "sage-x3": ["sage.com"],
  "sage-crm": ["sagecrm.com", "sage.com"],
  caseware: ["casewareafrica.com", "caseware.com"],
  draftworx: ["draftworx.com"],
  skynamo: ["skynamo.com", "skynamo.co.za"],
  "quickeasy-bos": ["quickeasy.co.za", "quickeasysoftware.com"],
  paymaster: ["paymaster.co.za"],
};

/** Candidate URLs for a domain, best-quality endpoints first. */
function urlsFor(domain) {
  return [
    `https://www.google.com/s2/favicons?domain=${domain}&sz=256`,
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
  ];
}

/** Read width/height from a PNG's IHDR chunk; 0 for non-PNG. */
function pngDims(buf) {
  if (buf.length > 24 && buf.toString("ascii", 1, 4) === "PNG") {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }
  return { w: 0, h: 0 };
}

const weak = [];

for (const [slug, domains] of Object.entries(TARGETS)) {
  let best = null; // { buf, score, w, h }
  for (const domain of domains) {
    for (const url of urlsFor(domain)) {
      try {
        const r = await fetch(url);
        if (!r.ok) continue;
        const buf = Buffer.from(await r.arrayBuffer());
        const { w, h } = pngDims(buf);
        const score = w && h ? Math.min(w, h) : 1; // prefer square, high-res PNGs
        if (!best || score > best.score) best = { buf, score, w, h, url };
      } catch {
        /* try next source */
      }
    }
  }
  if (!best) {
    console.warn(`  ${slug}: NO logo fetched`);
    weak.push(slug);
    continue;
  }
  writeFileSync(resolve(OUT_DIR, `${slug}.png`), best.buf);
  const tag = best.score < 64 ? " (low-res — consider SVG fallback)" : "";
  if (best.score < 64) weak.push(slug);
  console.log(`  ${slug}: ${best.w}x${best.h}, ${best.buf.length}b${tag}`);
}

console.log(`\nDone. ${Object.keys(TARGETS).length} logos written to public/logos.`);
if (weak.length) console.log(`Low-res / missing: ${weak.join(", ")}`);
