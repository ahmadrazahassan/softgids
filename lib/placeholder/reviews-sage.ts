import type { Review } from "@/lib/types";

/**
 * Sage review bank — 220+ reviews per Sage product, assembled from hand
 * written South African sentence pools with a fixed seed PRNG so ids and
 * content are identical on every build and every seed run. Review prose
 * deliberately contains no hyphens or dashes; structural values (company
 * size bands, usage durations) reuse the site wide filter strings.
 */

/* ------------------------------------------------------------------ */
/* Deterministic randomness                                            */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(0x53414745);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const chance = (p: number): boolean => rand() < p;
const between = (min: number, max: number): number =>
  min + Math.floor(rand() * (max - min + 1));

function shuffled<T>(arr: readonly T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function weighted(pairs: ReadonlyArray<readonly [string, number]>): string {
  const total = pairs.reduce((sum, [, w]) => sum + w, 0);
  let roll = rand() * total;
  for (const [value, w] of pairs) {
    roll -= w;
    if (roll <= 0) return value;
  }
  return pairs[pairs.length - 1][0];
}

/* ------------------------------------------------------------------ */
/* Identity pools                                                      */
/* ------------------------------------------------------------------ */

const NAME_GROUPS: ReadonlyArray<{ first: readonly string[]; last: readonly string[] }> = [
  {
    first: ["Sipho", "Thabo", "Bongani", "Nomvula", "Zanele", "Ayanda", "Sibusiso", "Nokuthula", "Mandla", "Lindiwe", "Themba", "Ntombi", "Sifiso", "Zodwa", "Musa", "Thulani", "Nonhlanhla", "Sandile", "Busisiwe", "Vusi", "Khanyisile", "Mbali", "Siyabonga", "Nomsa", "Lwazi", "Zinhle", "Bheki", "Thandeka", "Menzi", "Gugu", "Sanele", "Philani", "Nosipho", "Njabulo", "Anele"],
    last: ["Ndlovu", "Dlamini", "Khumalo", "Zulu", "Mkhize", "Ngcobo", "Cele", "Mthembu", "Buthelezi", "Zwane", "Sithole", "Nxumalo", "Shabalala", "Mabaso", "Gumede", "Hadebe", "Maseko", "Radebe", "Mazibuko", "Xulu", "Majola", "Ntuli", "Mhlongo", "Dube", "Khoza", "Mnguni", "Ngwenya"],
  },
  {
    first: ["Kagiso", "Lerato", "Tebogo", "Katlego", "Palesa", "Tshepo", "Boitumelo", "Kefilwe", "Mpho", "Neo", "Refilwe", "Karabo", "Thato", "Dikeledi", "Gomolemo", "Keabetswe", "Lesego", "Puleng", "Tumelo", "Naledi", "Itumeleng", "Kgomotso", "Motheo", "Reabetswe", "Bontle", "Ofentse"],
    last: ["Mokoena", "Molefe", "Motaung", "Moloi", "Mofokeng", "Tladi", "Phiri", "Mashaba", "Baloyi", "Nkuna", "Chauke", "Maluleke", "Modise", "Kekana", "Mnisi", "Malatji", "Ledwaba", "Mathebula", "Sekgobela", "Rakgotho"],
  },
  {
    first: ["Pieter", "Johan", "Annelie", "Riaan", "Elmarie", "Kobus", "Marius", "Sanet", "Danie", "Christelle", "Hennie", "Marlize", "Gert", "Ronel", "Wian", "Anri", "Jaco", "Lizelle", "Francois", "Este", "Deon", "Werner", "Karin", "Schalk", "Mariska", "Divan", "Ilse", "Ruan", "Zelda", "Corné"],
    last: ["van der Merwe", "Botha", "du Plessis", "Venter", "Pretorius", "van Wyk", "Coetzee", "Fourie", "le Roux", "Steyn", "Kruger", "Nel", "Erasmus", "Joubert", "Swanepoel", "Bezuidenhout", "Oosthuizen", "Meyer", "Vermeulen", "Lombard", "Barnard", "Marais", "Grobler", "Strydom", "van Zyl"],
  },
  {
    first: ["Sarah", "David", "Megan", "Craig", "Kirsten", "Brandon", "Tracy", "Gareth", "Nicole", "Wayne", "Claire", "Ryan", "Bronwyn", "Kyle", "Lauren", "Sean", "Candice", "Dylan", "Robyn", "Gavin", "Jenna", "Warren", "Keegan", "Shannon", "Justin"],
    last: ["Smith", "Turner", "Williams", "Bennett", "Harrison", "Clarke", "Edwards", "Foster", "Marsh", "Phillips", "Reid", "Walker", "Hughes", "Mitchell", "Barnes", "Cooper", "Dawson", "Ellis"],
  },
  {
    first: ["Priya", "Rajesh", "Anisha", "Vikash", "Kavitha", "Sanjay", "Reshma", "Deepak", "Meera", "Ashwin", "Shalini", "Pravin", "Yusuf", "Fatima", "Aadil", "Zaakirah", "Rehana", "Imraan", "Suhail", "Aaliyah", "Kamal", "Devi", "Rohan", "Trisha", "Nadia"],
    last: ["Naidoo", "Pillay", "Govender", "Moodley", "Reddy", "Naicker", "Padayachee", "Chetty", "Singh", "Maharaj", "Khan", "Ismail", "Ebrahim", "Cassim", "Patel", "Desai", "Osman", "Dawood", "Sewpersad", "Ramdass"],
  },
  {
    first: ["Chad", "Tasneem", "Byron", "Charlene", "Wesley", "Roxanne", "Grant", "Melissa", "Clint", "Natasha", "Bradley", "Cindy", "Angelo", "Bianca", "Ricardo", "Simone", "Denver", "Chantelle"],
    last: ["Adams", "Jacobs", "Hendricks", "Fortuin", "Petersen", "Daniels", "Booysen", "Arendse", "Damon", "Isaacs", "Cupido", "Abrahams", "Davids", "Solomons", "Willemse", "September", "Julies"],
  },
];

const CITIES: ReadonlyArray<{ c: string; p: string }> = [
  { c: "Johannesburg", p: "Gauteng" },
  { c: "Sandton", p: "Gauteng" },
  { c: "Randburg", p: "Gauteng" },
  { c: "Roodepoort", p: "Gauteng" },
  { c: "Midrand", p: "Gauteng" },
  { c: "Centurion", p: "Gauteng" },
  { c: "Pretoria", p: "Gauteng" },
  { c: "Soweto", p: "Gauteng" },
  { c: "Boksburg", p: "Gauteng" },
  { c: "Benoni", p: "Gauteng" },
  { c: "Kempton Park", p: "Gauteng" },
  { c: "Springs", p: "Gauteng" },
  { c: "Alberton", p: "Gauteng" },
  { c: "Vereeniging", p: "Gauteng" },
  { c: "Cape Town", p: "the Western Cape" },
  { c: "Bellville", p: "the Western Cape" },
  { c: "Durbanville", p: "the Western Cape" },
  { c: "Brackenfell", p: "the Western Cape" },
  { c: "Somerset West", p: "the Western Cape" },
  { c: "Stellenbosch", p: "the Western Cape" },
  { c: "Paarl", p: "the Western Cape" },
  { c: "Worcester", p: "the Western Cape" },
  { c: "George", p: "the Western Cape" },
  { c: "Mossel Bay", p: "the Western Cape" },
  { c: "Knysna", p: "the Western Cape" },
  { c: "Hermanus", p: "the Western Cape" },
  { c: "Durban", p: "KZN" },
  { c: "Umhlanga", p: "KZN" },
  { c: "Ballito", p: "KZN" },
  { c: "Pinetown", p: "KZN" },
  { c: "Pietermaritzburg", p: "KZN" },
  { c: "Richards Bay", p: "KZN" },
  { c: "Newcastle", p: "KZN" },
  { c: "Gqeberha", p: "the Eastern Cape" },
  { c: "East London", p: "the Eastern Cape" },
  { c: "Mthatha", p: "the Eastern Cape" },
  { c: "Bloemfontein", p: "the Free State" },
  { c: "Welkom", p: "the Free State" },
  { c: "Polokwane", p: "Limpopo" },
  { c: "Tzaneen", p: "Limpopo" },
  { c: "Nelspruit", p: "Mpumalanga" },
  { c: "Witbank", p: "Mpumalanga" },
  { c: "Middelburg", p: "Mpumalanga" },
  { c: "Rustenburg", p: "North West" },
  { c: "Potchefstroom", p: "North West" },
  { c: "Klerksdorp", p: "North West" },
  { c: "Kimberley", p: "the Northern Cape" },
  { c: "Upington", p: "the Northern Cape" },
];

const BRANDS = [
  "Khula", "Mzansi", "Amandla", "Phambili", "Sizwe", "Vuka", "Protea", "Aloe",
  "Baobab", "Marula", "Jacaranda", "Fynbos", "Karoo", "Kalahari", "Highveld",
  "Lowveld", "Bushveld", "Winelands", "Drakensberg", "Waterberg", "Springbok",
  "Kudu", "Impala", "Eland", "Horizon", "Summit", "Coastal", "Southern Cross",
  "Golden", "Ubuntu", "Khanya", "Zenzele", "Masakhane", "Atlas", "Beacon",
  "Cornerstone", "Legacy", "Heritage", "Frontier", "Meridian",
];

const TRADES: ReadonlyArray<{ co: string; prose: string; ind: string }> = [
  { co: "Plumbing", prose: "plumbing business", ind: "Construction & Trades" },
  { co: "Electrical", prose: "electrical contracting business", ind: "Construction & Trades" },
  { co: "Roofing", prose: "roofing business", ind: "Construction & Trades" },
  { co: "Paving", prose: "paving company", ind: "Construction & Trades" },
  { co: "Construction", prose: "construction company", ind: "Construction" },
  { co: "Builders", prose: "building contractor", ind: "Construction" },
  { co: "Auto Spares", prose: "auto spares shop", ind: "Retail" },
  { co: "Motors", prose: "vehicle workshop", ind: "Retail" },
  { co: "Hardware", prose: "hardware store", ind: "Retail" },
  { co: "Paints", prose: "paint shop", ind: "Retail" },
  { co: "Furniture", prose: "furniture store", ind: "Retail" },
  { co: "Workwear", prose: "workwear supplier", ind: "Retail" },
  { co: "Stationers", prose: "stationery shop", ind: "Retail" },
  { co: "Catering", prose: "catering company", ind: "Food & Beverage" },
  { co: "Bakery", prose: "bakery", ind: "Food & Beverage" },
  { co: "Foods", prose: "food distribution business", ind: "Food & Beverage" },
  { co: "Guest House", prose: "guest house", ind: "Hospitality" },
  { co: "Lodge", prose: "safari lodge", ind: "Hospitality" },
  { co: "Tours", prose: "tour operator", ind: "Travel & Tourism" },
  { co: "Travel", prose: "travel agency", ind: "Travel & Tourism" },
  { co: "Attorneys", prose: "law firm", ind: "Legal" },
  { co: "Accountants", prose: "accounting practice", ind: "Accounting" },
  { co: "Bookkeeping", prose: "bookkeeping practice", ind: "Accounting" },
  { co: "Engineering", prose: "engineering works", ind: "Manufacturing" },
  { co: "Packaging", prose: "packaging factory", ind: "Manufacturing" },
  { co: "Plastics", prose: "plastics factory", ind: "Manufacturing" },
  { co: "Steel", prose: "steel fabrication shop", ind: "Manufacturing" },
  { co: "Timber", prose: "timber yard", ind: "Manufacturing" },
  { co: "Textiles", prose: "textile factory", ind: "Manufacturing" },
  { co: "Glass and Aluminium", prose: "glass and aluminium business", ind: "Manufacturing" },
  { co: "Logistics", prose: "logistics company", ind: "Logistics" },
  { co: "Transport", prose: "transport company", ind: "Logistics" },
  { co: "Couriers", prose: "courier business", ind: "Logistics" },
  { co: "Freight", prose: "freight forwarding business", ind: "Logistics" },
  { co: "IT Solutions", prose: "IT services company", ind: "Technology" },
  { co: "Web Studio", prose: "web agency", ind: "Technology" },
  { co: "Media", prose: "media agency", ind: "Media & Marketing" },
  { co: "Printing", prose: "printing business", ind: "Media & Marketing" },
  { co: "Signs", prose: "signage company", ind: "Media & Marketing" },
  { co: "Events", prose: "events company", ind: "Media & Marketing" },
  { co: "Pharmacy", prose: "pharmacy", ind: "Healthcare" },
  { co: "Dental Studio", prose: "dental practice", ind: "Healthcare" },
  { co: "Physio", prose: "physiotherapy practice", ind: "Healthcare" },
  { co: "Vet Clinic", prose: "veterinary practice", ind: "Healthcare" },
  { co: "Properties", prose: "estate agency", ind: "Real Estate" },
  { co: "Lettings", prose: "property management company", ind: "Real Estate" },
  { co: "Farm Supplies", prose: "farm supplies store", ind: "Agriculture" },
  { co: "Agri Services", prose: "agri services business", ind: "Agriculture" },
  { co: "Citrus", prose: "citrus farm", ind: "Agriculture" },
  { co: "Boerdery", prose: "mixed farming operation", ind: "Agriculture" },
  { co: "Brokers", prose: "insurance brokerage", ind: "Financial Services" },
  { co: "Wealth", prose: "wealth advisory firm", ind: "Financial Services" },
  { co: "Cash and Carry", prose: "wholesale cash and carry", ind: "Wholesale" },
  { co: "Wholesalers", prose: "wholesale business", ind: "Wholesale" },
  { co: "Mining Supplies", prose: "mining supplies company", ind: "Mining" },
  { co: "Drilling", prose: "drilling contractor", ind: "Mining" },
  { co: "Care Centre", prose: "community care centre", ind: "Nonprofit" },
  { co: "Foundation", prose: "community foundation", ind: "Nonprofit" },
];

const STAFF_BY_SIZE: Record<string, readonly string[]> = {
  "1–10 employees": ["six of us", "eight staff", "a team of five", "nine people", "seven staff", "four of us"],
  "11–50 employees": ["about twenty staff", "a team of thirty", "forty odd employees", "25 people", "sixteen staff", "a crew of 35"],
  "51–200 employees": ["just over 80 staff", "120 employees", "a payroll of 150", "95 people", "roughly 70 staff"],
  "201–500 employees": ["around 300 staff", "260 employees", "a headcount of 400", "230 people"],
  "500+ employees": ["over 600 staff", "a group headcount past 800", "more than 550 employees"],
};

const DURATIONS: ReadonlyArray<readonly [string, number]> = [
  ["2+ years", 30],
  ["1–2 years", 30],
  ["6–12 months", 25],
  ["Less than 6 months", 15],
];

const BANKS = ["FNB", "Absa", "Standard Bank", "Nedbank", "Capitec"] as const;
const BUSY_MONTHS = ["January", "February", "March", "August", "November"] as const;

/* ------------------------------------------------------------------ */
/* Persona                                                             */
/* ------------------------------------------------------------------ */

interface Persona {
  name: string;
  job: string;
  company: string | null;
  industry: string;
  size: string;
  city: string;
  province: string;
  prose: string;
  staff: string;
  startYear: number;
}

const usedNames = new Set<string>();

function makeName(): string {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const group = pick(NAME_GROUPS);
    const name = `${pick(group.first)} ${pick(group.last)}`;
    if (!usedNames.has(name)) {
      usedNames.add(name);
      return name;
    }
  }
  // Pool exhausted (never happens at current volumes) — reuse is acceptable.
  const group = pick(NAME_GROUPS);
  return `${pick(group.first)} ${pick(group.last)}`;
}

function makeCompany(trade: { co: string }, bigBusiness: boolean): string | null {
  const roll = rand();
  if (roll < 0.1) return null;
  let name: string;
  if (roll < 0.5) name = `${pick(CITIES).c} ${trade.co}`;
  else if (roll < 0.8) name = `${pick(BRANDS)} ${trade.co}`;
  else name = `${pick(NAME_GROUPS[Math.floor(rand() * NAME_GROUPS.length)].last)} ${trade.co}`;
  if (bigBusiness && chance(0.25)) name += pick([" (Pty) Ltd", " Group", " Holdings"] as const);
  return name;
}

function makePersona(
  jobs: readonly string[],
  sizes: ReadonlyArray<readonly [string, number]>,
  reviewYear: number,
  duration: string
): Persona {
  const trade = pick(TRADES);
  const size = weighted(sizes);
  const city = pick(CITIES);
  const bigBusiness = size !== "1–10 employees" && size !== "11–50 employees";
  const yearsBack =
    duration === "Less than 6 months" ? 0 : duration === "6–12 months" ? 1 : duration === "1–2 years" ? 2 : 2 + between(0, 4);
  return {
    name: makeName(),
    job: pick(jobs),
    company: makeCompany(trade, bigBusiness),
    industry: trade.ind,
    size,
    city: city.c,
    province: city.p,
    prose: trade.prose,
    staff: pick(STAFF_BY_SIZE[size]),
    startYear: Math.max(2015, reviewYear - yearsBack),
  };
}

/* ------------------------------------------------------------------ */
/* Shared sentence pools                                               */
/* ------------------------------------------------------------------ */

const OPENERS: ReadonlyArray<(p: Persona) => string> = [
  (p) => `We run a ${p.prose} in ${p.city} with ${p.staff}.`,
  (p) => `I look after the admin for a ${p.prose} in ${p.city}.`,
  (p) => `Family owned ${p.prose} in ${p.city}, ${p.staff}.`,
  (p) => `We are based in ${p.city} with ${p.staff}.`,
  (p) => `Our ${p.prose} runs out of ${p.city}.`,
  (p) => `Small team, ${p.staff}, working from ${p.city}.`,
  (p) => `We moved over from our old system in ${p.startYear}.`,
  (p) => `Been on it since ${p.startYear}.`,
  (p) => `We compared a few options before settling on this in ${p.startYear}.`,
  (p) => `I run the office for a ${p.prose} in ${p.city}.`,
  (p) => `Our company does work across ${p.province} from ${p.city}.`,
  (p) => `We service clients across ${p.province} from our base in ${p.city}.`,
  (p) => `Second generation ${p.prose} in ${p.city}.`,
  (p) => `I am the one person finance team for ${p.staff} in ${p.city}.`,
  (p) => `We picked it on our accountant's advice in ${p.startYear}.`,
  (p) => `After years on spreadsheets we finally made the jump in ${p.startYear}.`,
  (p) => `Our ${p.prose} has ${p.staff} spread over two sites.`,
  (p) => `Typical ${p.province} business, ${p.staff}, tight margins.`,
];

const CLOSERS_POS = [
  "No plans to change.",
  "Would recommend it to any small business here.",
  "It just works.",
  "Worth every rand.",
  "Happy customer overall.",
  "Does exactly what we need, nothing fancy.",
  "My accountant is happy, so I am happy.",
  "Renewed without thinking twice.",
  "For the price I cannot complain.",
  "Saved us hours every month.",
  "Solid choice for a South African business.",
  "So far so good.",
  "It has made month end boring, which is exactly what you want.",
  "The whole team is used to it now.",
  "Cannot fault it on the basics.",
  "If you are on the fence, just take the trial.",
  "Five years from now we will probably still be on it.",
  "Long may it continue.",
] as const;

const CLOSERS_MID = [
  "Good product, a few rough edges.",
  "Gets the job done but there is room to improve.",
  "We stay because moving is more effort than the niggles.",
  "It is fine, not exciting, just fine.",
  "Decent value if you keep your setup simple.",
  "Works well most days.",
  "I would still pick it again, but with open eyes.",
  "Does the basics well, the extras less so.",
  "Keeping an eye on the price increases though.",
  "Three and a half stars if I could give halves.",
] as const;

const CLOSERS_NEG = [
  "We are looking at alternatives.",
  "Hoping the next update sorts this out.",
  "Support needs serious attention.",
  "Would not recommend at this price.",
  "It caused more admin than it saved.",
  "Frustrating, because the core idea is good.",
  "Only staying until we finish the tax year.",
  "Think carefully before you commit.",
  "Disappointed after everything we heard about it.",
  "We deserve better for what we pay.",
] as const;

/* ------------------------------------------------------------------ */
/* Program specs                                                       */
/* ------------------------------------------------------------------ */

type Sentence = string | (() => string);

interface ProgramSpec {
  softwareId: string;
  key: string;
  count: number;
  jobs: readonly string[];
  sizes: ReadonlyArray<readonly [string, number]>;
  titlesPos: readonly string[];
  titlesMid: readonly string[];
  titlesNeg: readonly string[];
  pos: readonly Sentence[];
  neg: readonly Sentence[];
  pros: readonly string[];
  cons: readonly string[];
  consStrong: readonly string[];
}

const PROGRAMS: readonly ProgramSpec[] = [
  /* ---------------- Sage Accounting (cloud) ---------------- */
  {
    softwareId: "sw-sage-accounting",
    key: "acc",
    count: 265,
    jobs: ["Owner", "Bookkeeper", "Financial Manager", "Accountant", "Office Manager", "Practice Owner", "Director", "Admin Manager", "Financial Controller", "Managing Director"],
    sizes: [["1–10 employees", 45], ["11–50 employees", 40], ["51–200 employees", 12], ["201–500 employees", 3]],
    titlesPos: [
      "VAT season stopped being a crisis",
      "My Saturday mornings belong to me again",
      "The books finally match the bank",
      "Best move we made since registering for VAT",
      "From shoebox to sorted in a month",
      "Our accountant recommended it and she was right",
      "Does the boring stuff without drama",
      "Invoices out, money in, faster",
      "Exactly what a small SA business needs",
      "Debtors days down, stress down",
      "Load shedding proof bookkeeping",
      "The bank feed alone is worth it",
      "Simple enough that I actually use it",
      "Every bookkeeper here knows it, which helps",
      "Quoting from the bakkie won us work",
      "Month end went from a week to a morning",
      "SARS verification was almost painless",
      "Good honest software at a fair rand price",
      "Two years in and no regrets",
      "It runs our whole admin now",
      "Statements on autopilot changed our cash flow",
      "Set up over a weekend, invoicing by Monday",
      "The trial sold itself",
      "My bookkeeper and I finally see the same numbers",
      "Solid choice for owner managed businesses",
      "Everything in one place at last",
      "The dashboard tells me the truth every morning",
      "Recon in twenty minutes flat",
      "Made VAT registration far less scary",
      "Our cash flow has never been this visible",
    ],
    titlesMid: [
      "Good, with a few honest gripes",
      "Mostly smooth, occasionally frustrating",
      "Decent but the reports hold it back",
      "Fine for basics, thin at the edges",
      "Happy overall, watching the price though",
      "Four stars, support costs it the fifth",
    ],
    titlesNeg: [
      "Bank feed problems soured it for us",
      "Support let us down when it mattered",
      "Outgrew it faster than expected",
      "Too many small irritations",
      "Not the experience we were promised",
      "Price keeps climbing, value does not",
    ],
    pos: [
      "The VAT201 report agrees with what we capture on eFiling to the cent, which has ended the quarterly panic in our office.",
      () => `The ${pick(BANKS)} feed pulls in every transaction overnight and recon is basically confirming matches.`,
      "Quotes turn into invoices with two clicks and customers get them by email straight away.",
      "Our accountant logs in herself at month end instead of asking me to email backups.",
      "Statements go out automatically on the 25th and our debtors days have visibly dropped.",
      "I capture petrol slips on my phone in the parking lot and they are waiting in the books when I get back.",
      "Setup took a weekend and we invoiced from it on the Monday.",
      "The 15% VAT is handled everywhere without me ever thinking about it.",
      "During load shedding I just carry on from my phone on data, nothing sits on a server in the office.",
      "Support answered in under ten minutes and the person actually knew the product.",
      "Pricing in rand with no exchange rate surprises makes budgeting simple.",
      "Recurring invoices for our service contracts run themselves on the 1st.",
      "Bank recon that used to eat my Saturday now takes twenty minutes with coffee.",
      "My bookkeeper in another town works in the same file at the same time as me.",
      "The audit trail saved us in a SARS verification, we pulled every document they asked for in an afternoon.",
      "Customer statements, age analysis and VAT reports cover everything my accountant asks for.",
      "Moving from Excel was less painful than I feared, opening balances took one evening with the import templates.",
      "AutoEntry reads supplier invoices better than I expected, even the scruffy ones.",
      "It reminds me which customers are overdue before they become a problem.",
      "We linked Yoco and card payments show up against the right invoices.",
      "Quoting on site from the app has won us jobs because we get the number to the client first.",
      "The dashboard tells me who owes us and what we owe before my first coffee.",
      "I picked it because every bookkeeper I interviewed already knew it.",
      "Year end handover to the auditors was the smoothest we have had.",
      "Multi user access means my admin lady captures and I approve, with a clean separation.",
      "Cash flow view has stopped two nasty surprises this year already.",
      "The price of the Standard plan is less than one hour of my accountant's time each month.",
      "Emailed invoices show when the customer opened them, which ends the I never got it story.",
      "We added the stock module and counts now match the shelf most months.",
      "Supplier bills get captured the day they arrive and nothing slips to 30 days overdue anymore.",
    ],
    neg: [
      () => `The ${pick(BANKS)} feed dropped for almost two weeks in ${pick(BUSY_MONTHS)} and support kept blaming the bank.`,
      "Report customisation is thin, anything beyond the standard layouts means exporting to Excel.",
      "The annual price increase came without much warning and stung for a two person shop.",
      "The mobile app logs me out constantly and photo capture fails on slow connections.",
      "Support in February is a queue, we waited three days for a VAT question.",
      "Inventory is too basic once you carry more than a few hundred lines.",
      "No proper job costing on this tier, we track projects in a spreadsheet next to it.",
      "Speed dips some afternoons and pages take a few seconds to save.",
      "The import tool rejected our opening balances four times with vague error messages.",
      "Foreign currency costs extra, which feels mean when you only invoice one client abroad.",
      "You cannot customise the invoice template much beyond the logo and colours.",
      "Once the debtors book grew past a few thousand customers the age analysis takes ages to load.",
    ],
    pros: [
      "VAT201 that matches eFiling",
      "bank feeds from all the major banks",
      "accountant access included",
      "rand pricing with a proper local support line",
      "statements and payment reminders run themselves",
      "quick quoting from the mobile app",
      "clean audit trail",
      "easy enough for a non financial owner",
      "receipt capture through AutoEntry",
      "recurring invoices",
      "unaffected by load shedding since it lives in the browser",
      "debtors age analysis my accountant trusts",
      "30 day trial with no card needed",
      "Yoco and card payment integration",
      "simple supplier bill capture",
      "fast setup with import templates",
      "multi user on the Standard plan",
      "good knowledge base",
      "invoice open tracking",
      "clear month end reports",
    ],
    cons: [
      "reports need Excel for anything custom",
      "mobile app can be slow on bad signal",
      "stock module is basic",
      "annual price increases",
      "invoice templates are rigid",
      "no job costing on this tier",
      "foreign currency is a paid extra",
      "support queues in filing season",
      "dashboard is not customisable",
      "search can be clumsy in long lists",
    ],
    consStrong: [
      "bank feed outages with slow answers from support",
      "support tickets went unanswered for days",
      "gets slow once your books grow big",
      "price has climbed every year we have been on it",
      "import errors are vague and eat hours",
    ],
  },

  /* ---------------- Sage 50cloud Pastel (desktop) ---------------- */
  {
    softwareId: "sw-sage-pastel",
    key: "pastel",
    count: 246,
    jobs: ["Bookkeeper", "Financial Manager", "Accountant", "Practice Owner", "Financial Controller", "Office Manager", "Owner", "Finance Director", "Senior Bookkeeper", "Audit Manager"],
    sizes: [["1–10 employees", 15], ["11–50 employees", 45], ["51–200 employees", 30], ["201–500 employees", 8], ["500+ employees", 2]],
    titlesPos: [
      "The workhorse of SA bookkeeping",
      "Old faithful, still earning its keep",
      "Fast fingers, faster capturing",
      "Our auditors never complain",
      "Five companies, one system, no drama",
      "Desktop and proud of it",
      "It just keeps balancing",
      "Twenty years on Pastel and counting",
      "Volume capturing without the lag",
      "The whole industry speaks Pastel",
      "Stock control that actually controls stock",
      "Internet down, books still open",
      "Batch processing done right",
      "Still the practice standard around here",
      "Upgraded from Partner without losing a cent of history",
      "Our clerk captures circles around cloud apps",
      "Month end machine",
      "Reliable as a Hilux",
      "Deep, structured and dependable",
      "Everything drills down to source",
      "The GL never lies here",
      "Trained staff are everywhere, that matters",
      "Serious software for serious volumes",
      "Multi store stock finally under control",
    ],
    titlesMid: [
      "Powerful but showing its age",
      "Great engine, tired dashboard",
      "Solid books, clumsy everything else",
      "Depends how modern you need to feel",
      "Would pick it again, with a better server",
      "Strong core, stubborn edges",
    ],
    titlesNeg: [
      "Stuck in the desktop era",
      "The licence lockout burned us",
      "Backups nearly ended us",
      "Support queues test your patience",
      "Remote work is an afterthought",
      "Costs crept past the value",
    ],
    pos: [
      "Every accountant in the country knows Pastel, hiring a bookkeeper who can drive it takes one phone call.",
      "Processing is fast, our clerk captures a few hundred cashbook lines an hour without the screen fighting her.",
      "We run five companies on the Plus tier and switching between them takes seconds.",
      "The GL structure is old school in the best way, everything reconciles and nothing hides.",
      "Month end runs are quick even with our transaction volumes.",
      "It has run on the same office server for years with barely a hiccup.",
      "The reports our auditors want come standard, trial balance to detailed ledger in a few clicks.",
      "Inventory with serial numbers and multiple stores actually works properly here.",
      "Because it sits on our own machine, the internet going down does not stop capturing.",
      "Supplier and customer ageing is exact and drills down to the source document.",
      "User permissions let us separate capturing from approving, our auditors love that.",
      "Twenty years of habit means my fingers know the shortcuts before my brain does.",
      "The upgrade from Partner carried all our history across cleanly.",
      "Cash book processing with recurring entries saves us hours on the monthly debit orders.",
      "It handles our multi store stock counts without breaking a sweat.",
      "Year end procedures are well documented and we have done them ourselves every year.",
      "Batch processing means a junior can capture all day and I review in one sitting.",
      "Data integrity has been rock solid, we have never lost a batch.",
      "Reports export straight to Excel with the numbers still behaving as numbers.",
      "For a business our size the price per user works out cheaper than the cloud options we compared.",
      "Our ISP can do whatever it likes, Pastel keeps working on the LAN.",
      "Job costing per contract keeps our project margins honest.",
      "The audit trail goes back years and has settled more than one argument.",
      "Support knew the product deeply when we did phone, no script reading.",
      "Runs fine on modest hardware, we only upgraded the server out of caution.",
      "New staff learn the capturing screens in a day because half of them used it at their last job.",
    ],
    neg: [
      "Remote work is clumsy, we ended up paying for remote desktop just to capture from home.",
      "Backups are on us, and the one time we got lazy we nearly paid dearly.",
      "The interface looks and feels its age.",
      "When the licence renewal lapsed we were locked out mid month until accounts sorted it.",
      "Support hold times can be brutal at month end and year end.",
      "Rebuilding a corrupted data file cost us a nervous weekend.",
      "It needs a Windows machine and a decent server, laptops on wifi cause grief.",
      "The move to subscription pricing pushed our annual cost up sharply.",
      "Getting data out into anything modern takes exports and patience.",
      "Updates occasionally break the printer setups and document layouts.",
      "There is no sensible mobile story at all.",
      "Two users capturing in the same batch type can still step on each other.",
    ],
    pros: [
      "every SA bookkeeper knows it",
      "fast batch capturing",
      "multi company on the higher tiers",
      "proper inventory with multiple stores",
      "reports auditors ask for out of the box",
      "works without internet",
      "strong user permissions",
      "reliable GL that always balances",
      "job costing module",
      "exports cleanly to Excel",
      "decades of local track record",
      "handles high transaction volumes",
      "solid audit trail",
      "cheaper per user than cloud rivals at our size",
      "recurring cash book entries",
    ],
    cons: [
      "dated interface",
      "no real mobile access",
      "remote access needs workarounds",
      "backups are your own problem",
      "needs proper Windows hardware",
      "subscription pricing crept up",
      "updates sometimes upset printing",
      "learning curve for the extra modules",
    ],
    consStrong: [
      "a data file corruption scare",
      "locked out over a licence renewal",
      "support hold times at month end",
      "moving data out is painful",
    ],
  },

  /* ---------------- Sage Pastel Payroll (desktop) ---------------- */
  {
    softwareId: "sw-sage-pastel-payroll",
    key: "ppay",
    count: 237,
    jobs: ["Payroll Administrator", "Payroll Manager", "HR Manager", "Bookkeeper", "Owner", "HR Administrator", "Practice Manager", "Finance Manager", "Payroll Consultant", "Office Manager"],
    sizes: [["1–10 employees", 20], ["11–50 employees", 45], ["51–200 employees", 27], ["201–500 employees", 6], ["500+ employees", 2]],
    titlesPos: [
      "February recon done before lunch",
      "EMP501 season without the sweat",
      "IRP5s out in an afternoon",
      "SARS compliant without thinking about it",
      "The bureau workhorse",
      "Payday runs itself now",
      "The e@syFile export just works",
      "Fourteen client payrolls, zero penalties",
      "Leave admin finally under control",
      "ETI alone pays for it",
      "Weekly wages and salaries in harmony",
      "Our labour inspector left satisfied",
      "Payroll you can defend in an audit",
      "Old school and unbeatable at compliance",
      "Directives, backpay, pro rata, all handled",
      "The safest pair of hands in SA payroll",
      "Tax year end held no surprises",
      "Minimum wage increase applied in minutes",
      "Every payslip correct, every month",
      "Twenty years of Augusts survived",
    ],
    titlesMid: [
      "Compliance gold, usability bronze",
      "Trustworthy but tired looking",
      "Does the job, fights you a little",
      "Solid payroll behind a dated screen",
      "Reliable, just not modern",
    ],
    titlesNeg: [
      "Renewal admin drives me mad",
      "Tier pricing punished our growth",
      "Filing season support queues",
      "Year end tripped us badly",
      "Updates became a monthly chore",
    ],
    pos: [
      "The statutory tables update before SARS changes kick in and I have never had a wrong PAYE number.",
      "EMP201 figures come out ready to capture and they agree with eFiling every single month.",
      "The e@syFile export for EMP501 season works first time, February and August hold no fear anymore.",
      "IRP5s for all our staff printed and emailed in one afternoon.",
      "ETI calculations are handled properly, which paid for the licence by itself.",
      "Leave administration finally matches the BCEA rules instead of my spreadsheet guesses.",
      "Payslips email out at 6am on payday and the queue at my office door is gone.",
      "We run weekly wages and monthly salaries side by side without confusion.",
      "UIF declarations generate automatically and the fund has never bounced one back.",
      "Year end rollover took twenty minutes with the guide open next to me.",
      "The bank file exports straight into our business banking profile for bulk payments.",
      "Support during filing season knew exactly which screen I was on and fixed my recon in one call.",
      "Backpay and pro rata calculations that used to take me a morning are automatic.",
      "The GL journal posts into our Pastel accounting without recapturing.",
      "Everyone at the payroll seminars knows this product, help is never far away.",
      "Loan and savings deductions run themselves month after month.",
      "It handled a retrenchment process with the correct tax directives without drama.",
      "The reports pack covers everything the Department of Labour inspector asked for.",
      "Medical aid and retirement annuity calculations track the tax credits correctly.",
      "Running a bureau, I process fourteen client payrolls on it and the multi company handling holds up.",
      "Rate changes for the national minimum wage took minutes to apply across all staff.",
      "Audit queries about payroll get answered from the system, not from memory.",
    ],
    neg: [
      "Filing season support queues are long, I waited ninety minutes in February.",
      "The annual licence renewal process is clumsy and the price climbs every year.",
      "Updates must be installed on every machine and one missed update blocks the whole team.",
      "The interface is ancient, new staff take a while to find their way.",
      "It only runs on Windows desktops, processing from home means remote desktop.",
      "Reports are rigid, anything custom means exporting and rebuilding in Excel.",
      "The year end procedure punishes you if you skip a step, we learned the hard way.",
      "Adding one employee over the tier limit forces a whole tier upgrade.",
      "Backups are manual and the responsibility sits squarely on you.",
      "Error messages assume you speak fluent payroll jargon.",
    ],
    pros: [
      "SARS tax tables always current",
      "EMP201 figures that match eFiling",
      "clean e@syFile exports",
      "IRP5 printing and emailing",
      "proper ETI handling",
      "BCEA compliant leave",
      "bulk payment bank files",
      "weekly and monthly runs together",
      "GL journals into Pastel accounting",
      "handles bureau volumes",
      "solid filing season support",
      "UIF declarations automatic",
    ],
    cons: [
      "dated Windows interface",
      "tier jumps when headcount grows",
      "updates on every machine",
      "rigid reports",
      "manual backups",
      "desktop only",
      "renewal admin every year",
    ],
    consStrong: [
      "filing season phone queues",
      "year end rollover mistakes are unforgiving",
      "price rises at every renewal",
    ],
  },

  /* ---------------- Sage Business Cloud Payroll ---------------- */
  {
    softwareId: "sw-sage-payroll",
    key: "bcpay",
    count: 232,
    jobs: ["Owner", "Bookkeeper", "Office Manager", "Payroll Administrator", "Admin Manager", "Director", "HR Administrator", "Practice Owner", "Operations Manager", "Financial Manager"],
    sizes: [["1–10 employees", 60], ["11–50 employees", 35], ["51–200 employees", 5]],
    titlesPos: [
      "Two employees, R90, sorted",
      "Payroll from my phone during stage 6",
      "The UIF just handles itself",
      "Small payroll without the small mistakes",
      "Compliance on autopilot for tiny teams",
      "March tax changes arrived before I did",
      "Ten minute pay runs, honestly",
      "Perfect for a startup headcount",
      "Cheapest peace of mind in my business",
      "Payslips out while I sleep",
      "Grew with us from three to eleven staff",
      "The accountant approves before we pay",
      "13th cheque tax done right",
      "Browser payroll that respects your evening",
      "Finally retired the payroll spreadsheet",
      "No installs, no drama",
      "Payday without the admin hangover",
      "Exactly enough payroll for a small shop",
    ],
    titlesMid: [
      "Great for small, thin for medium",
      "Good bones, light reports",
      "Fine until you grow past fifty",
      "Cheap and mostly cheerful",
      "Simple, sometimes too simple",
    ],
    titlesNeg: [
      "Month end slowdowns test you",
      "Support pace does not match payday pressure",
      "Outgrew it in eighteen months",
      "One stuck pay run was one too many",
      "Fine product, frustrating moments",
    ],
    pos: [
      "R90 a month for our two staff members is the cheapest compliance I buy.",
      "Legislative updates just appear, the March tax changes were live before our first run.",
      "Payslips email themselves and the UIF declaration goes off without me touching it.",
      "I run payroll from the couch on a Sunday evening in about ten minutes.",
      "It posts the journals straight into Sage Accounting so the books always agree with payroll.",
      "Load shedding means nothing, I have processed a pay run from my phone in a coffee shop.",
      "Setup asked me plain questions instead of payroll jargon.",
      "The EMP201 figures are ready on the dashboard when I open eFiling.",
      "Adding our first weekly wage worker took five minutes.",
      "Leave balances calculate themselves and staff stopped asking me to check.",
      "We grew from three staff to eleven and it scaled without starting over.",
      "No installs, no updates, no server, it is just there every month.",
      "The price tiers are printed on the website, what you see is what you pay.",
      "IRP5 season was two clicks and a download.",
      "My accountant checks the run remotely before I pay anyone.",
      "Unlimited companies on one subscription is quietly generous.",
      "Switching from a spreadsheet took one evening and found two UIF mistakes we had been making.",
      "The audit trail shows who changed what, handy with two of us processing.",
      "Support chat sorted my ETI question the same morning.",
      "It calculates the correct PAYE on the 13th cheque without me googling formulas.",
    ],
    neg: [
      "Reports are thin compared to the desktop product, I export to Excel for anything beyond the standards.",
      "The screen crawls on the last day of the month when everyone in the country is processing.",
      "There is no proper employee self service portal at this price.",
      "Support is email first and answers can take a day.",
      "You feel the limits past about fifty employees.",
      "The leave setup confused me for casual workers on rotating shifts.",
      "A pay run once stuck at processing and I had to phone before month end.",
      "Custom deductions need a workaround if they change month to month.",
    ],
    pros: [
      "genuinely cheap for tiny teams",
      "automatic legislative updates",
      "runs in any browser",
      "UIF declarations submitted for you",
      "journals post into Sage Accounting",
      "clear rand pricing on the website",
      "unlimited companies and users",
      "email payslips",
      "quick setup in plain language",
      "EMP201 figures ready for eFiling",
      "works fine on a phone",
      "leave balances staff can trust",
    ],
    cons: [
      "thin reporting",
      "no real self service",
      "email support can be slow",
      "month end slowdowns",
      "casual worker leave setup is fiddly",
      "feels stretched past fifty staff",
    ],
    consStrong: [
      "a pay run stuck at the worst moment",
      "support response times near deadline",
    ],
  },

  /* ---------------- Sage HR ---------------- */
  {
    softwareId: "sw-sage-hr",
    key: "hr",
    count: 227,
    jobs: ["HR Manager", "HR Business Partner", "People Manager", "Operations Manager", "HR Administrator", "Office Manager", "Managing Director", "HR Officer", "Talent Manager", "General Manager"],
    sizes: [["1–10 employees", 8], ["11–50 employees", 40], ["51–200 employees", 40], ["201–500 employees", 10], ["500+ employees", 2]],
    titlesPos: [
      "Leave requests left WhatsApp at last",
      "HR admin for humans",
      "The filing cabinet is finally empty",
      "My December actually felt like leave",
      "Five branches, one org chart",
      "Staff answer their own questions now",
      "Onboarding that runs itself",
      "The reminders are worth the fee alone",
      "From shared inbox chaos to a real pipeline",
      "Field teams clock in from site",
      "Small HR team, big system energy",
      "Probation reviews stopped slipping",
      "EE reporting in minutes",
      "Leave balances staff can see and trust",
      "Every contract, one click away",
      "Approvals flow while I sleep",
      "New hires feel it from day one",
      "The org chart maintains itself",
    ],
    titlesMid: [
      "Lovely core, average edges",
      "Good HR basics, light analytics",
      "Adds up per module, budget carefully",
      "Solid, with a few workarounds",
      "Nearly great, reporting says no",
    ],
    titlesNeg: [
      "Support answers arrive tomorrow",
      "Reporting boxed us in",
      "Module pricing crept past the budget",
      "Not built with SA holidays in mind",
      "Promise exceeded the polish",
    ],
    pos: [
      "Leave requests moved from WhatsApp messages to an app with an approval trail.",
      "The December leave rush approved itself through the workflow while I was on leave myself.",
      "Every employee document now lives in one profile instead of seven folders and a filing cabinet.",
      "Staff check their own leave balances on the phone app and the questions to HR have basically stopped.",
      "Onboarding checklists mean a new hire has equipment, contracts and inductions sorted before day one.",
      "The org chart updates itself when we move people, which sounds small until you have five branches.",
      "Timesheets with overtime rules ended the monthly argument with the factory floor.",
      "Performance reviews actually happen now because the system chases people, not me.",
      "We set the BCEA leave rules once and the accruals have been right ever since.",
      "The recruitment pipeline replaced a shared inbox and my sanity returned.",
      "The reminders for probation reviews and contract expiries alone justify the fee.",
      "Reports for the employment equity committee took minutes instead of a weekend.",
      "Announcements reach the drivers on their phones, not just the office staff on email.",
      "Approval flows respect our levels, my supervisors filter before anything reaches me.",
      "Per employee pricing let us start with just the core module and add the rest later.",
      "Integration with our Sage payroll means approved leave lands on the payslip correctly.",
      "The mobile app is genuinely usable, our field teams clock in with GPS from site.",
      "Surveys gave the branch staff a voice and we caught a resignation wave before it happened.",
      "Setup took days, not the months the consultants quoted for the big systems.",
      "Expense claims with photos ended the crumpled slip envelope era.",
    ],
    neg: [
      "Reporting is rigid, anything beyond the standard exports means CSV surgery in Excel.",
      "Support is email based and the time zone gap shows, answers land the next morning.",
      "The performance module feels bolted on compared to the core.",
      "Pricing per employee per module adds up quicker than the website suggests.",
      "There is no SA public holiday calendar out of the box, we captured them manually.",
      "The recruitment module is priced for bigger teams than ours.",
      "Bulk changes to leave policies mean editing employee by employee.",
      "The occasional slow morning, presumably when Europe wakes up.",
    ],
    pros: [
      "leave management staff actually use",
      "clean mobile app",
      "document storage per employee",
      "onboarding checklists",
      "automatic reminders for contracts and probation",
      "modular pricing",
      "approval workflows that match our structure",
      "org chart that maintains itself",
      "timesheets with overtime rules",
      "works with Sage payroll",
      "quick setup",
      "GPS clock in for field teams",
    ],
    cons: [
      "rigid reports",
      "modules add up in price",
      "email only support",
      "public holidays captured manually",
      "performance module less polished",
      "bulk policy edits are tedious",
    ],
    consStrong: [
      "support time zone lag",
      "recruitment module overpriced for small teams",
    ],
  },

  /* ---------------- Sage 200 Evolution (ERP) ---------------- */
  {
    softwareId: "sw-sage-evolution",
    key: "evo",
    count: 223,
    jobs: ["Financial Director", "IT Manager", "Operations Director", "Systems Administrator", "Group Accountant", "Supply Chain Manager", "Financial Manager", "Managing Director", "Warehouse Manager", "Group Financial Manager"],
    sizes: [["1–10 employees", 2], ["11–50 employees", 20], ["51–200 employees", 45], ["201–500 employees", 25], ["500+ employees", 8]],
    titlesPos: [
      "Three branches, one version of the truth",
      "The stock finally matches the shelves",
      "Month end in three days, not ten",
      "An ERP that respects a mid size budget",
      "Eight years, zero database drama",
      "Job costing that pays for itself",
      "Grew with us through an acquisition",
      "SQL access sets it apart",
      "Our auditors get answers in minutes",
      "Warehouse control worth the licence",
      "Consolidation stopped being a nightmare",
      "Trade counter to trial balance, connected",
      "Partner on site, not a call centre",
      "Built for real South African distributors",
      "Every branch on the same page at last",
      "The GL holds the whole group together",
      "Serial tracking settles every warranty fight",
      "Procurement finally has guardrails",
    ],
    titlesMid: [
      "Powerful, priced accordingly",
      "Great system, choose your partner wisely",
      "Strong core, dated shell",
      "Worth it once you survive implementation",
      "Capable, with consulting invoices attached",
    ],
    titlesNeg: [
      "Partner roulette nearly sank us",
      "Every change costs consulting hours",
      "Upgrades feel like surgery",
      "Licence maths gets ugly at scale",
      "Big promises, heavy overheads",
    ],
    pos: [
      "We run three branches and two warehouses on it and the stock figures agree with the shelves.",
      "The SQL backend means our BI dashboards read live data straight from the database.",
      "Job costing tracks every contract to the cent and killed our margin leaks.",
      "Month end consolidation across our companies dropped from ten days to three.",
      "Our Sage business partner customised the sales order screens to match how our floor actually works.",
      "It has processed our volumes for eight years without a corrupt database.",
      "User security is granular enough to satisfy the auditors and the fraud consultants.",
      "The fixed assets register finally agrees with the GL every month.",
      "Procurement approvals stopped the maverick buying at branch level.",
      "Point of sale at our trade counters posts straight into the ledger.",
      "Credit control workflows put a polite squeeze on debtors and it shows in the age analysis.",
      "We pull custom reports with SQL views, nothing is locked away.",
      "Serial number tracking rescues us weekly in warranty disputes.",
      "It absorbed our acquisition of a competitor, new company live in six weeks.",
      "Pricing matrices per customer group run our contract pricing automatically.",
      "The GL never argues, every module posts through cleanly.",
      "Local partner support means a consultant on site the same week, not a call centre abroad.",
      "Bill of materials handles our light manufacturing without needing a bigger ERP.",
      "Intercompany journals post both sides in one capture.",
      "Ten years of history stays queryable, auditors get answers in minutes.",
    ],
    neg: [
      "Everything goes through the business partner, small changes carry consulting invoices.",
      "Upgrades are projects, we schedule them like minor surgery.",
      "User licences are pricey, we ration logins between the branch admins.",
      "The interface is functional but firmly stuck in the past.",
      "Quality depends heavily on which partner you get, our first one was a disaster.",
      "Training new staff takes weeks, it assumes you think like an accountant.",
      "The server and SQL licences add a hidden layer of cost.",
      "Remote branches on weak lines suffer, it wants a solid network.",
      "Some modules feel like separate products bolted together.",
      "The report writer has a learning curve that defeated two of my staff.",
    ],
    pros: [
      "handles multi branch and multi warehouse properly",
      "SQL database open for reporting",
      "strong job costing",
      "granular user security",
      "solid GL that all modules post through",
      "local partner network",
      "fixed assets module",
      "serial number tracking",
      "intercompany processing",
      "scales well past fifty users",
      "point of sale option",
      "bill of materials for light manufacturing",
    ],
    cons: [
      "dated interface",
      "training takes weeks",
      "needs proper server infrastructure",
      "modules vary in polish",
      "report writer learning curve",
    ],
    consStrong: [
      "partner dependency for every change",
      "upgrade projects cost real money",
      "licence costs mount as you grow",
      "our first implementation partner failed us",
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Review assembly                                                     */
/* ------------------------------------------------------------------ */

const resolve = (s: Sentence): string => (typeof s === "function" ? s() : s);
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

function pickRating(): number {
  const r = rand();
  if (r < 0.44) return 5;
  if (r < 0.8) return 4;
  if (r < 0.93) return 3;
  if (r < 0.98) return 2;
  return 1;
}

function subRating(overall: number): number {
  const drift = chance(0.28) ? (chance(0.5) ? 1 : -1) : 0;
  return Math.min(5, Math.max(1, overall + drift));
}

function pickDate(): { date: string; year: number } {
  const r = rand();
  let year: number;
  let month: number;
  if (r < 0.18) {
    year = 2024;
    month = between(7, 12);
  } else if (r < 0.6) {
    year = 2025;
    month = between(1, 12);
  } else {
    year = 2026;
    month = between(1, 6);
  }
  const day = between(1, 28);
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return { date: `${year}-${mm}-${dd}`, year };
}

function distinct<T>(arr: readonly T[], n: number): T[] {
  const out: T[] = [];
  let guard = 0;
  while (out.length < n && guard < 40) {
    guard += 1;
    const item = pick(arr);
    if (!out.includes(item)) out.push(item);
  }
  return out;
}

function joinFragments(fragments: string[]): string {
  return `${cap(fragments.join("; "))}.`;
}

function buildSummary(spec: ProgramSpec, p: Persona, rating: number): string {
  const parts: string[] = [];
  if (rating >= 4) {
    if (chance(0.5)) parts.push(pick(OPENERS)(p));
    const meats = distinct(spec.pos, chance(0.38) ? 2 : 1).map(resolve);
    parts.push(...meats);
    if (rating === 5 && chance(0.45)) parts.push(pick(CLOSERS_POS));
    if (rating === 4 && chance(0.5)) parts.push(chance(0.5) ? pick(CLOSERS_POS) : pick(CLOSERS_MID));
  } else if (rating === 3) {
    if (chance(0.4)) parts.push(pick(OPENERS)(p));
    parts.push(resolve(pick(spec.pos)));
    parts.push(resolve(pick(spec.neg)));
    if (chance(0.5)) parts.push(pick(CLOSERS_MID));
  } else {
    if (chance(0.35)) parts.push(pick(OPENERS)(p));
    const meats = distinct(spec.neg, chance(0.4) ? 2 : 1).map(resolve);
    parts.push(...meats);
    if (chance(0.6)) parts.push(pick(CLOSERS_NEG));
  }
  return parts.join(" ");
}

function buildReviews(spec: ProgramSpec): Review[] {
  const reviews: Review[] = [];
  const seen = new Set<string>();
  const titleCycle = shuffled(spec.titlesPos);
  let titleIndex = 0;

  for (let n = 1; n <= spec.count; n += 1) {
    const rating = pickRating();
    const duration = weighted(DURATIONS);
    const { date, year } = pickDate();
    const p = makePersona(spec.jobs, spec.sizes, year, duration);

    let title: string;
    if (rating === 5 || (rating === 4 && chance(0.7))) {
      title = titleCycle[titleIndex % titleCycle.length];
      titleIndex += 1;
    } else if (rating >= 3) {
      title = pick(spec.titlesMid);
    } else {
      title = pick(spec.titlesNeg);
    }

    let summary = buildSummary(spec, p, rating);
    let guard = 0;
    while (seen.has(`${title}|${summary}`) && guard < 60) {
      guard += 1;
      summary = buildSummary(spec, p, rating);
    }
    seen.add(`${title}|${summary}`);

    let pros: string | null = null;
    let cons: string | null = null;
    const bareBones = chance(0.2);
    if (!bareBones) {
      if (rating >= 4) {
        pros = joinFragments(distinct(spec.pros, between(2, 3)));
        if (chance(0.75)) cons = joinFragments(distinct(spec.cons, 1));
      } else if (rating === 3) {
        if (chance(0.75)) pros = joinFragments(distinct(spec.pros, between(1, 2)));
        cons = joinFragments(
          distinct(chance(0.5) ? spec.cons : [...spec.cons, ...spec.consStrong], between(1, 2))
        );
      } else {
        if (chance(0.3)) pros = joinFragments(distinct(spec.pros, 1));
        cons = joinFragments([
          pick(spec.consStrong),
          ...(chance(0.5) ? [pick(spec.cons)] : []),
        ]);
      }
    }

    let helpful =
      between(0, 5) + (2026 - year) * between(0, 8) + (rating >= 4 ? between(0, 6) : between(0, 3));
    if (chance(0.12)) helpful += between(10, 35);

    reviews.push({
      id: `rev-sage-${spec.key}-${String(n).padStart(3, "0")}`,
      software_id: spec.softwareId,
      reviewer_name: p.name,
      reviewer_job_title: p.job,
      reviewer_company: p.company,
      reviewer_industry: p.industry,
      reviewer_company_size: p.size,
      reviewer_country: "South Africa",
      reviewer_avatar_url: null,
      verified_linkedin: chance(0.22),
      verified_badge: "Verified reviewer",
      used_for_duration: duration,
      overall_rating: rating,
      ease_of_use: subRating(rating),
      value_for_money: subRating(rating),
      customer_service: subRating(rating),
      functionality: subRating(rating),
      review_title: title,
      summary,
      pros,
      cons,
      vendor_response: null,
      vendor_response_date: null,
      review_date: date,
      helpful_count: helpful,
      status: "published",
    });
  }
  return reviews;
}

export const sageReviewBank: Review[] = PROGRAMS.flatMap(buildReviews);
