/**
 * Download the full country flag set (SVG) from flagcdn.com into
 * public/flags/, and write lib/flags.generated.json mapping lowercase
 * English country names to ISO codes. Rerunnable; skips existing files.
 */

import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const OUT_DIR = resolve(process.cwd(), "public/flags");
mkdirSync(OUT_DIR, { recursive: true });

const codesResponse = await fetch("https://flagcdn.com/en/codes.json");
if (!codesResponse.ok) throw new Error(`codes.json failed: ${codesResponse.status}`);
const codes = await codesResponse.json();

// Country codes only (two letters); flagcdn also lists US states like us-al.
const entries = Object.entries(codes).filter(([code]) => /^[a-z]{2}$/.test(code));
console.log(`Downloading ${entries.length} flags…`);

const nameToCode = {};
let downloaded = 0;
let skipped = 0;

const queue = [...entries];
async function worker() {
  while (queue.length > 0) {
    const [code, name] = queue.shift();
    nameToCode[String(name).toLowerCase()] = code;
    const file = resolve(OUT_DIR, `${code}.svg`);
    if (existsSync(file)) {
      skipped += 1;
      continue;
    }
    const response = await fetch(`https://flagcdn.com/${code}.svg`);
    if (!response.ok) {
      console.warn(`skip ${code}: ${response.status}`);
      continue;
    }
    writeFileSync(file, Buffer.from(await response.arrayBuffer()));
    downloaded += 1;
  }
}

await Promise.all(Array.from({ length: 12 }, worker));

writeFileSync(
  resolve(process.cwd(), "lib/flags.generated.json"),
  JSON.stringify(nameToCode, null, 2) + "\n"
);

console.log(`Done: ${downloaded} downloaded, ${skipped} already present.`);
