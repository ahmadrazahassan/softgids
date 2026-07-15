/**
 * Shared review corpus engine for Stack Match (South Africa).
 *
 * Vendor seed scripts (seed-sage-reviews.ts, seed-quickbooks-reviews.ts) pass
 * their content banks to runReviewSeed(). The engine turns each bank into a
 * few hundred unique, human voiced reviews and upserts them into Supabase.
 *
 * Fully deterministic: a seeded PRNG plus deterministic row ids mean reruns
 * produce the exact same rows (idempotent). Aggregate ratings stay owned by
 * the database trigger.
 *
 * House rules enforced at build time:
 *   - no hyphens or dashes in any prose field
 *   - no duplicate titles or summaries within a product
 *   - headcount, tenure and industry stay consistent within one review
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

/* --------------------------- bank shape --------------------------- */

export type Bank = {
  slug: string;
  count: number;
  /** Star distribution as [rating, weight]; defaults to a 4.1ish mix. */
  ratingWeights?: Array<[number, number]>;
  posTitles: string[];
  mixTitles: string[];
  negTitles: string[];
  posOpeners: string[];
  posBodies: string[];
  posClosers: string[];
  mixOpeners: string[];
  mixBodies: string[];
  negOpeners: string[];
  negBodies: string[];
  pros: string[];
  cons: string[];
  negCons: string[];
  jobTitles: string[];
  industries: string[];
  sizeWeights: Array<[string, number]>;
};

/* ---------- tiny .env.local parser (no dotenv dependency) ---------- */

export function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (!match) continue;
      const value = match[2].replace(/^["']|["']$/g, "");
      if (!process.env[match[1]]) process.env[match[1]] = value;
    }
  } catch {
    /* .env.local is optional when vars are already exported */
  }
}

/* ---------- deterministic ids so reruns hit the same rows ---------- */

export function stableId(kind: string, key: string): string {
  const hex = createHash("sha1").update(`stackmatch:${kind}:${key}`).digest("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    "5" + hex.slice(13, 16),
    ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16) + hex.slice(17, 20),
    hex.slice(20, 32),
  ].join("-");
}

/* ---------- seeded PRNG (mulberry32) for reproducible output ---------- */

function makeRng(seedText: string): () => number {
  const hash = createHash("sha1").update(seedText).digest();
  let a = hash.readUInt32LE(0);
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rng = () => number;

function pick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function pickWeighted<T>(rng: Rng, entries: ReadonlyArray<readonly [T, number]>): T {
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = rng() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return entries[entries.length - 1][0];
}

/* ------------------------- shared pools ------------------------- */

const FIRST_NAMES = [
  "Thabo", "Sipho", "Lerato", "Nomvula", "Bongani", "Ayanda", "Zanele", "Kagiso",
  "Tumelo", "Karabo", "Mpho", "Naledi", "Palesa", "Tshepo", "Sibusiso", "Nkosinathi",
  "Thulani", "Andile", "Lwazi", "Anele", "Siyabonga", "Luyanda", "Xolani", "Vusi",
  "Musa", "Sello", "Katlego", "Refilwe", "Boitumelo", "Dineo", "Keabetswe", "Lindiwe",
  "Nomsa", "Gugu", "Zodwa", "Thandeka", "Nonhlanhla", "Simphiwe", "Sifiso", "Mandla",
  "Bheki", "Senzo", "Njabulo", "Thandiwe", "Busisiwe", "Nandi", "Khanyisile", "Zinhle",
  "Sanele", "Precious", "Pieter", "Johan", "Willem", "Hennie", "Kobus", "Danie",
  "Riaan", "Jaco", "Gerhard", "Francois", "Deon", "Marius", "Andre", "Christo",
  "Wynand", "Schalk", "Annelie", "Marlene", "Elmarie", "Ronel", "Susan", "Karin",
  "Estelle", "Ilse", "Anri", "Chantelle", "Marike", "Elna", "Petro", "Hannelie",
  "David", "Michael", "Sarah", "Emma", "Kate", "James", "Craig", "Gavin",
  "Wayne", "Shaun", "Bradley", "Candice", "Tracey", "Megan", "Robyn", "Lisa",
  "Mark", "Paul", "Brian", "Kevin", "Cheryl", "Denise", "Priya", "Anish",
  "Kavitha", "Rajesh", "Naadira", "Yusuf", "Fatima", "Zaid", "Aisha", "Ebrahim",
  "Rashida", "Imraan", "Nadia", "Feroza", "Devan", "Kiara", "Sanjay", "Meera",
  "Vinesh", "Shanice", "Ridwaan", "Tasneem", "Moegamat", "Shireen", "Grant", "Warren",
  "Charmaine", "Natasha", "Clinton", "Ashwin", "Leandra", "Jerome", "Chantal", "Byron",
] as const;

const LAST_NAMES = [
  "Nkosi", "Dlamini", "Khumalo", "Ndlovu", "Zulu", "Mokoena", "Molefe", "Mahlangu",
  "Sithole", "Mabaso", "Ngcobo", "Mthembu", "Cele", "Gumede", "Buthelezi", "Radebe",
  "Tshabalala", "Maseko", "Nxumalo", "Xaba", "Mnguni", "Zwane", "Shabalala", "Hadebe",
  "Mokgadi", "Sebola", "Baloyi", "Chauke", "Rikhotso", "Makhubela", "Van der Merwe",
  "Botha", "Pretorius", "Venter", "Du Plessis", "Fourie", "Nel", "Coetzee",
  "Steyn", "Kruger", "Le Roux", "Van Wyk", "Joubert", "Swanepoel", "Viljoen",
  "Erasmus", "Bezuidenhout", "Oosthuizen", "Van Zyl", "Du Toit", "Marais", "Ferreira",
  "Botes", "Lombard", "Vermeulen", "Barnard", "Grobler", "Naidoo", "Pillay",
  "Govender", "Moodley", "Reddy", "Chetty", "Padayachee", "Singh", "Maharaj",
  "Ramjee", "Naicker", "Perumal", "Khan", "Ismail", "Patel", "Cassim",
  "Adams", "Daniels", "Petersen", "Jacobs", "Williams", "Smith", "Brown",
  "Taylor", "Miller", "Johnson", "Abrahams", "Hendricks", "Fortuin", "September",
  "Arendse", "Cloete", "Damon", "Booysen", "Meyer", "Olivier", "Bester",
] as const;

const CITIES = [
  "Johannesburg", "Pretoria", "Cape Town", "Durban", "Gqeberha", "East London",
  "Bloemfontein", "Polokwane", "Mbombela", "Kimberley", "Rustenburg", "George",
  "Stellenbosch", "Paarl", "Pietermaritzburg", "Centurion", "Sandton", "Randburg",
  "Roodepoort", "Benoni", "Boksburg", "Springs", "Vereeniging", "Midrand",
  "Somerset West", "Knysna", "Ballito", "Umhlanga", "Richards Bay", "eMalahleni",
  "Klerksdorp", "Potchefstroom", "Upington", "Worcester", "Mossel Bay", "Vanderbijlpark",
] as const;

const SA_BANKS = ["FNB", "Absa", "Standard Bank", "Nedbank", "Capitec"] as const;

const MONTHS = [
  "January", "February", "March", "April", "May", "June", "July",
  "August", "September", "October", "November", "December",
] as const;

const COMPANY_LEADS = [
  "Highveld", "Karoo", "Atlas", "Umhlanga", "Kalahari", "Baobab", "Protea",
  "Southern Cross", "Golden City", "Table Bay", "Drakensberg", "Winelands",
  "Garden Route", "Zambezi", "Marula", "Acacia", "Impala", "Kudu", "Meridian",
  "Crossroads", "Milkwood", "Fynbos", "Bateleur", "Horizon", "Legacy", "Summit",
] as const;

const COMPANY_TRADES = [
  "Trading", "Logistics", "Engineering", "Auto", "Electrical", "Plumbing",
  "Construction", "Foods", "Packaging", "Distributors", "Manufacturing",
  "Properties", "Attorneys", "Consulting", "Motors", "Hardware", "Timber",
  "Freight", "Catering", "Security", "Cleaning", "Print", "Steel", "Agri",
  "Textiles", "Pharmacy", "Tours", "Couriers",
] as const;

const COMPANY_TAILS = [
  "", "", "", " Solutions", " Services", " Group", " Supplies", " Works",
  " Studio", " and Sons", " SA", " Holdings",
] as const;

/** Company trade word aligned to the reviewer's industry, so "Legal" firms
 *  are not called "Manufacturing". Falls back to neutral trades. */
const TRADES_BY_INDUSTRY: Record<string, string[]> = {
  "Retail": ["Trading", "Hardware", "Supplies"],
  "Construction": ["Construction", "Steel", "Timber"],
  "Construction & Trades": ["Plumbing", "Electrical", "Construction"],
  "Accounting": ["Accountants", "Consulting"],
  "Logistics": ["Logistics", "Freight", "Couriers"],
  "Hospitality": ["Catering", "Tours"],
  "Manufacturing": ["Manufacturing", "Packaging", "Textiles", "Steel"],
  "Technology": ["Systems", "Digital", "Consulting"],
  "Real Estate": ["Properties"],
  "Healthcare": ["Pharmacy", "Medical"],
  "Legal": ["Attorneys"],
  "Food & Beverage": ["Foods", "Catering"],
  "Wholesale": ["Distributors", "Trading", "Supplies"],
  "Media & Marketing": ["Media", "Print", "Studios"],
  "Travel & Tourism": ["Tours", "Travel"],
  "Agriculture": ["Agri", "Farming"],
  "Mining": ["Mining", "Drilling"],
  "Financial Services": ["Brokers", "Consulting"],
  "Nonprofit": ["Foundation", "Trust"],
};

const DURATIONS: Array<[string, number]> = [
  ["Less than 6 months", 13],
  ["6–12 months", 22],
  ["1–2 years", 30],
  ["2+ years", 35],
];

const COUNTRIES: Array<[string, number]> = [
  ["South Africa", 93],
  ["Namibia", 3],
  ["Botswana", 2],
  ["Zimbabwe", 1],
  ["Zambia", 1],
];

const DEFAULT_RATING_WEIGHTS: Array<[number, number]> = [
  [5, 48], [4, 31], [3, 12], [2, 5], [1, 4],
];

/** Phrases implying long tenure, excluded for reviewers under a year in. */
const LONG_TENURE = /\byears\b|\bdecade\b|since before|grew up alongside|habit/i;

/** Sentences that only make sense for a South African reviewer. */
const SA_ONLY =
  /SARS|VAT201|eFiling|EMP201|EMP501|IRP5|IT3a|e@syFile|UIF|SDL|ETI|BCEA|load shedding|SA calendar|employment equity|labour consultant|Department/i;

/**
 * Slotted generic titles blended into every product's pool. The slot tokens
 * ({city}, {n}, {yrs}) expand each template into dozens of variants, which is
 * what keeps 250+ titles per product unique without sounding templated.
 */
const GENERIC_TITLES = {
  pos: [
    "Solid choice for our {city} business",
    "Working well for our {n} person team",
    "{yrs} years in and still happy",
    "Happy customer in {city}",
    "Our accountant in {city} recommended it, good call",
    "No complaints after {yrs} years",
    "Doing the job for us in {city}",
    "Good decision for a {n} person company",
    "Still glad we chose it, {yrs} years later",
    "Serving our {city} operation well",
    "Exactly what our {n} person business needed",
    "A quiet workhorse for {yrs} years now",
  ],
  mix: [
    "Good but not perfect for our {city} team",
    "Mixed feelings after {yrs} years",
    "Decent fit for a {n} person company",
    "Mostly happy in {city}, a few gripes",
    "Gets us there, with some detours",
    "Doing okay for our {n} person setup",
    "Fine for now, watching the roadmap",
  ],
  neg: [
    "Disappointed after {yrs} years",
    "Not what we hoped for our {city} business",
    "Frustrating experience for our {n} person team",
    "Expected better, {city} customer",
    "Let us down when it counted",
    "Our {city} office gave up on it",
  ],
} as const;

/* --------------------------- generation --------------------------- */

const DASH_RE = /[-‐-―−]/;

function assertClean(field: string, text: string | null) {
  if (text && DASH_RE.test(text)) {
    throw new Error(`Dash found in ${field}: "${text}"`);
  }
}

/**
 * Facts that must stay consistent across every sentence of one review:
 * headcount matches the company size facet, years in use matches the
 * usage duration facet. yrs is null for reviewers under a year in.
 */
type SlotCtx = { n: number; yrs: number | null };

function headcountFor(rng: Rng, size: string | null): number {
  switch (size) {
    case "1–10 employees": return pick(rng, [4, 5, 6, 7, 8, 9] as const);
    case "11–50 employees": return pick(rng, [12, 14, 15, 18, 20, 22, 25, 28, 30, 35, 40, 45] as const);
    case "51–200 employees": return pick(rng, [55, 60, 70, 75, 80, 95, 110, 130, 160, 180] as const);
    case "201–500 employees": return pick(rng, [220, 260, 300, 350, 420] as const);
    case "500+ employees": return pick(rng, [520, 600, 750, 900] as const);
    default: return pick(rng, [8, 12, 15, 20, 25, 30] as const);
  }
}

function yearsFor(rng: Rng, duration: string): number | null {
  if (duration === "2+ years") return pick(rng, [2, 3, 3, 4, 4, 5, 5, 6, 7, 8, 10] as const);
  if (duration === "1–2 years") return 2;
  return null;
}

function fillSlots(rng: Rng, template: string, ctx: SlotCtx): string {
  return template
    /* "a {city}" needs the article corrected for vowel initial cities */
    .replace(/\b([Aa]) \{city\}/g, (_, article: string) => {
      const city = pick(rng, CITIES);
      const an = /^[AEIOUaeiou]/.test(city);
      return `${article === "A" ? (an ? "An" : "A") : an ? "an" : "a"} ${city}`;
    })
    .replaceAll("{city}", () => pick(rng, CITIES))
    .replaceAll("{bank}", () => pick(rng, SA_BANKS))
    .replaceAll("{month}", () => pick(rng, MONTHS.slice(0, 10)))
    .replaceAll("{n}", String(ctx.n))
    .replaceAll("{m}", () => String(pick(rng, [8, 10, 12, 15, 18, 20, 25, 30, 35, 40, 50, 60] as const)))
    .replaceAll("{yrs}", String(ctx.yrs ?? 2));
}

function subRating(rng: Rng, overall: number): number {
  const roll = rng();
  const jitter = roll < 0.55 ? 0 : roll < 0.8 ? 1 : -1;
  return Math.min(5, Math.max(1, overall + jitter));
}

/** Weighted toward recent; deterministic anchor (never Date.now). */
function reviewDate(rng: Rng): string {
  const anchor = Date.UTC(2026, 6, 8); // 8 July 2026
  const daysBack = Math.floor(Math.pow(rng(), 1.5) * 730);
  const d = new Date(anchor - daysBack * 86_400_000);
  return d.toISOString().slice(0, 10);
}

function helpfulCount(rng: Rng, dateIso: string): number {
  const ageDays = Math.max(0, (Date.UTC(2026, 6, 8) - Date.parse(dateIso)) / 86_400_000);
  const ageBoost = 0.4 + Math.min(1, ageDays / 540) * 0.6;
  const roll = rng();
  const base =
    roll < 0.55 ? rng() * 4 : roll < 0.85 ? 4 + rng() * 10 : roll < 0.97 ? 14 + rng() * 28 : 42 + rng() * 50;
  return Math.floor(base * ageBoost);
}

function companyName(rng: Rng, lastName: string, industry: string | null): string | null {
  const roll = rng();
  if (roll < 0.42) return null;
  const trades = (industry && TRADES_BY_INDUSTRY[industry]) || COMPANY_TRADES;
  const trade = pick(rng, trades);
  const tail = pick(rng, COMPANY_TAILS);
  if (roll < 0.52) {
    return `${lastName.replace(/^(Van der |Van |Du |Le )/, "")} ${trade}${tail}`;
  }
  if (roll < 0.72) return `${pick(rng, CITIES)} ${trade}${tail}`;
  return `${pick(rng, COMPANY_LEADS)} ${trade}${tail}`;
}

type ReviewRow = Record<string, unknown>;

function generateForProduct(
  bank: Bank,
  softwareId: string,
  usedNames: Set<string>,
  rngSeed: string,
  idNamespace: string
): ReviewRow[] {
  const rng = makeRng(rngSeed);
  const usedTitles = new Set<string>();
  const usedSummaries = new Set<string>();
  const rows: ReviewRow[] = [];

  const uniquePick = (pool: string[], used: Set<string>, saOnlyOk: boolean, ctx: SlotCtx): string => {
    for (let attempt = 0; attempt < 400; attempt++) {
      const template = pick(rng, pool);
      if (ctx.yrs === null && (template.includes("{yrs}") || LONG_TENURE.test(template))) continue;
      const filled = fillSlots(rng, template, ctx);
      if (!saOnlyOk && SA_ONLY.test(filled)) continue;
      if (!used.has(filled)) {
        used.add(filled);
        return filled;
      }
    }
    throw new Error(`Exhausted pool for ${bank.slug} (pool size ${pool.length})`);
  };

  for (let i = 0; i < bank.count; i++) {
    /* identity */
    let name = "";
    for (let attempt = 0; attempt < 200; attempt++) {
      name = `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`;
      if (!usedNames.has(name)) break;
    }
    usedNames.add(name);
    const lastName = name.split(" ").slice(-1)[0];

    const country = pickWeighted(rng, COUNTRIES);
    const isSA = country === "South Africa";

    /* facets first, so every sentence agrees with them */
    const size = rng() < 0.94 ? pickWeighted(rng, bank.sizeWeights) : null;
    const duration = pickWeighted(rng, DURATIONS);
    const ctx: SlotCtx = { n: headcountFor(rng, size), yrs: yearsFor(rng, duration) };

    /* rating and sentiment */
    const overall = pickWeighted<number>(rng, bank.ratingWeights ?? DEFAULT_RATING_WEIGHTS);
    const sentiment: "pos" | "mix" | "neg" =
      overall === 5 ? "pos" : overall >= 3 ? "mix" : "neg";

    /* title */
    const titlePool =
      sentiment === "pos"
        ? [...bank.posTitles, ...GENERIC_TITLES.pos]
        : sentiment === "mix"
          ? [...bank.mixTitles, ...GENERIC_TITLES.mix, ...(overall === 4 ? bank.posTitles : [])]
          : [...bank.negTitles, ...GENERIC_TITLES.neg];
    const title = uniquePick(titlePool, usedTitles, isSA, ctx);

    /* summary: opener + optional bodies + optional closer */
    let summary = "";
    for (let attempt = 0; attempt < 60; attempt++) {
      const parts: string[] = [];
      const takeFrom = (pool: string[]) => {
        for (let t = 0; t < 40; t++) {
          const template = pick(rng, pool);
          if (ctx.yrs === null && (template.includes("{yrs}") || LONG_TENURE.test(template))) continue;
          const s = fillSlots(rng, template, ctx);
          if (!isSA && SA_ONLY.test(s)) continue;
          if (!parts.includes(s)) return s;
        }
        return null;
      };
      if (sentiment === "pos") {
        const o = takeFrom(bank.posOpeners);
        if (o) parts.push(o);
        if (rng() < 0.78) { const b = takeFrom(bank.posBodies); if (b) parts.push(b); }
        if (rng() < 0.34) { const b = takeFrom(bank.posBodies); if (b) parts.push(b); }
        if (rng() < 0.5) { const c = takeFrom(bank.posClosers); if (c) parts.push(c); }
      } else if (sentiment === "mix") {
        const o = takeFrom(bank.mixOpeners);
        if (o) parts.push(o);
        if (rng() < 0.85) { const b = takeFrom(bank.mixBodies); if (b) parts.push(b); }
        if (overall === 4 && rng() < 0.6) { const b = takeFrom(bank.posBodies); if (b) parts.push(b); }
        if (overall === 3 && rng() < 0.35) { const b = takeFrom(bank.mixBodies); if (b) parts.push(b); }
      } else {
        const o = takeFrom(bank.negOpeners);
        if (o) parts.push(o);
        if (rng() < 0.85) { const b = takeFrom(bank.negBodies); if (b) parts.push(b); }
        if (rng() < 0.3) { const b = takeFrom(bank.negBodies); if (b) parts.push(b); }
      }
      const candidate = parts.join(" ");
      if (candidate && !usedSummaries.has(candidate)) {
        usedSummaries.add(candidate);
        summary = candidate;
        break;
      }
    }
    if (!summary) throw new Error(`Could not build unique summary for ${bank.slug} #${i}`);

    /* pros and cons */
    let pros: string | null = null;
    let cons: string | null = null;
    if (sentiment === "neg") {
      if (rng() < 0.35) pros = fillSlots(rng, pick(rng, bank.pros), ctx);
      cons = fillSlots(rng, pick(rng, bank.negCons), ctx);
      if (rng() < 0.4) {
        const extra = fillSlots(rng, pick(rng, bank.negCons), ctx);
        if (extra !== cons) cons = `${cons}. ${extra}`;
      }
    } else {
      if (rng() < 0.76) {
        pros = fillSlots(rng, pick(rng, bank.pros), ctx);
        if (rng() < 0.45) {
          const extra = fillSlots(rng, pick(rng, bank.pros), ctx);
          if (extra !== pros) pros = `${pros}; ${extra.charAt(0).toLowerCase()}${extra.slice(1)}`;
        }
      }
      const conChance = overall === 5 ? 0.5 : overall === 4 ? 0.78 : 0.95;
      if (rng() < conChance) cons = fillSlots(rng, pick(rng, bank.cons), ctx);
    }
    if (!isSA) {
      if (pros && SA_ONLY.test(pros)) pros = null;
      if (cons && SA_ONLY.test(cons)) cons = null;
    }

    /* metadata */
    const dateIso = reviewDate(rng);
    const jobTitlePool =
      size && size !== "1–10 employees"
        ? bank.jobTitles.filter((t) => t !== "Sole Proprietor")
        : bank.jobTitles;
    const jobTitle = rng() < 0.88 ? pick(rng, jobTitlePool) : null;
    const industry = rng() < 0.9 ? pick(rng, bank.industries) : null;
    const company = companyName(rng, lastName, industry);
    const verifiedLinkedin = rng() < 0.22;

    for (const [field, value] of Object.entries({ name, title, summary, pros, cons, company, jobTitle })) {
      assertClean(`${bank.slug}#${i}.${field}`, value as string | null);
    }

    rows.push({
      id: stableId(idNamespace, `${bank.slug}:${i}`),
      software_id: softwareId,
      reviewer_name: name,
      reviewer_job_title: jobTitle,
      reviewer_company: company,
      reviewer_industry: industry,
      reviewer_company_size: size,
      reviewer_country: country,
      reviewer_avatar_url: null,
      verified_linkedin: verifiedLinkedin,
      verified_badge: "Verified reviewer",
      used_for_duration: duration,
      overall_rating: overall,
      ease_of_use: subRating(rng, overall),
      value_for_money: subRating(rng, overall),
      customer_service: subRating(rng, overall),
      functionality: subRating(rng, overall),
      review_title: title,
      summary,
      pros,
      cons,
      vendor_response: null,
      vendor_response_date: null,
      review_date: dateIso,
      helpful_count: helpfulCount(rng, dateIso),
      status: "published",
    });
  }

  return rows;
}

/* ------------------------------ runner ------------------------------ */

export async function runReviewSeed(options: {
  banks: Bank[];
  /** Namespaces the deterministic row ids, e.g. "sage-review". */
  idNamespace: string;
  /** Seed prefix for the PRNG; keep stable so reruns are byte identical. */
  seedPrefix: string;
  /** Hint printed when a product row is missing from Supabase. */
  rosterHint: string;
}) {
  loadEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local first."
    );
    process.exit(1);
  }
  const db = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const slugs = options.banks.map((b) => b.slug);
  const { data: products, error } = await db
    .from("software")
    .select("id, slug, name")
    .in("slug", slugs);
  if (error) throw new Error(`software lookup: ${error.message}`);

  const bySlug = new Map((products ?? []).map((p) => [p.slug, p]));
  const missing = slugs.filter((s) => !bySlug.has(s));
  if (missing.length > 0) {
    console.error(`Missing software rows for: ${missing.join(", ")}.\n${options.rosterHint}`);
    process.exit(1);
  }

  /* clear old "(Demo)" placeholder reviews on these products */
  const productIds = [...bySlug.values()].map((p) => p.id);
  const { count: demoRemoved, error: delError } = await db
    .from("reviews")
    .delete({ count: "exact" })
    .in("software_id", productIds)
    .like("reviewer_name", "% (Demo)");
  if (delError) throw new Error(`demo cleanup: ${delError.message}`);
  console.log(`removed ${demoRemoved ?? 0} old (Demo) reviews on these products`);

  const usedNames = new Set<string>();
  let total = 0;

  for (const bank of options.banks) {
    const product = bySlug.get(bank.slug)!;
    const rows = generateForProduct(
      bank,
      product.id,
      usedNames,
      `${options.seedPrefix}:${bank.slug}`,
      options.idNamespace
    );

    for (let offset = 0; offset < rows.length; offset += 100) {
      const chunk = rows.slice(offset, offset + 100);
      const { error: upsertError } = await db
        .from("reviews")
        .upsert(chunk, { onConflict: "id" });
      if (upsertError) {
        throw new Error(`${bank.slug} chunk @${offset}: ${upsertError.message}`);
      }
    }

    const avg =
      rows.reduce((sum, r) => sum + (r.overall_rating as number), 0) / rows.length;
    const fiveStar = rows.filter((r) => r.overall_rating === 5).length;
    console.log(
      `  ${product.name}: ${rows.length} reviews pushed (avg ${avg.toFixed(1)}, ${fiveStar} five star)`
    );
    total += rows.length;
  }

  console.log(`done: ${total} unique reviews in Supabase. Aggregates recalculated by trigger.`);
}
