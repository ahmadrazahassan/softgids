import type { Review } from "@/lib/types";

/**
 * New-wave review bank — verified-style South African reviews for the Sage
 * roster additions (Payroll Professional, 300 People, Intacct, X3, CRM) and
 * the SA specialists (CaseWare, Draftworx, Skynamo, QuickEasy BOS, Paymaster).
 *
 * Same approach as reviews-sage.ts: hand-written SA sentence pools assembled
 * with a fixed-seed PRNG so ids and prose are identical on every build and
 * every seed run. Prose deliberately avoids hyphens and dashes; company-size
 * bands and durations reuse the site-wide filter strings.
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

const rand = mulberry32(0x4e455741); // "NEWA"
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
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

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ------------------------------------------------------------------ */
/* Shared South African identity pools                                 */
/* ------------------------------------------------------------------ */

const FIRST = [
  "Sipho", "Thabo", "Nomvula", "Zanele", "Ayanda", "Lindiwe", "Themba", "Musa",
  "Kagiso", "Lerato", "Tebogo", "Palesa", "Tshepo", "Mpho", "Naledi", "Karabo",
  "Pieter", "Johan", "Annelie", "Riaan", "Elmarie", "Kobus", "Marius", "Sanet",
  "Christelle", "Hennie", "Marlize", "Ronel", "Jaco", "Francois", "Deon", "Karin",
  "Sarah", "David", "Megan", "Craig", "Kirsten", "Nicole", "Wayne", "Claire",
  "Priya", "Rajesh", "Kavitha", "Yusuf", "Fatima", "Imraan", "Nadia", "Rohan",
  "Chad", "Tasneem", "Byron", "Charlene", "Wesley", "Grant", "Melissa", "Bianca",
];

const LAST = [
  "Ndlovu", "Dlamini", "Khumalo", "Zulu", "Mkhize", "Ngcobo", "Mthembu", "Zwane",
  "Mokoena", "Molefe", "Motaung", "Mofokeng", "Phiri", "Baloyi", "Modise", "Kekana",
  "van der Merwe", "Botha", "du Plessis", "Venter", "Pretorius", "van Wyk", "Coetzee",
  "Fourie", "le Roux", "Steyn", "Kruger", "Nel", "Joubert", "Swanepoel", "Meyer",
  "Naidoo", "Pillay", "Govender", "Moodley", "Reddy", "Singh", "Khan", "Ismail",
  "Adams", "Jacobs", "Hendricks", "Petersen", "Daniels", "Davids", "Isaacs",
  "Smith", "Williams", "Clarke", "Walker", "Mitchell", "Cooper",
];

const CITIES: ReadonlyArray<{ c: string; p: string }> = [
  { c: "Johannesburg", p: "Gauteng" }, { c: "Sandton", p: "Gauteng" },
  { c: "Midrand", p: "Gauteng" }, { c: "Centurion", p: "Gauteng" },
  { c: "Pretoria", p: "Gauteng" }, { c: "Boksburg", p: "Gauteng" },
  { c: "Cape Town", p: "the Western Cape" }, { c: "Bellville", p: "the Western Cape" },
  { c: "Stellenbosch", p: "the Western Cape" }, { c: "Paarl", p: "the Western Cape" },
  { c: "George", p: "the Western Cape" }, { c: "Durban", p: "KZN" },
  { c: "Umhlanga", p: "KZN" }, { c: "Pietermaritzburg", p: "KZN" },
  { c: "Richards Bay", p: "KZN" }, { c: "Gqeberha", p: "the Eastern Cape" },
  { c: "East London", p: "the Eastern Cape" }, { c: "Bloemfontein", p: "the Free State" },
  { c: "Polokwane", p: "Limpopo" }, { c: "Nelspruit", p: "Mpumalanga" },
  { c: "Witbank", p: "Mpumalanga" }, { c: "Rustenburg", p: "North West" },
  { c: "Potchefstroom", p: "North West" }, { c: "Kimberley", p: "the Northern Cape" },
];

const BRANDS = [
  "Khula", "Mzansi", "Amandla", "Sizwe", "Protea", "Baobab", "Marula", "Jacaranda",
  "Karoo", "Highveld", "Bushveld", "Winelands", "Drakensberg", "Springbok", "Kudu",
  "Horizon", "Summit", "Ubuntu", "Cornerstone", "Legacy", "Heritage", "Meridian",
];

const DURATIONS: ReadonlyArray<readonly [string, number]> = [
  ["2+ years", 32], ["1–2 years", 30], ["6–12 months", 24], ["Less than 6 months", 14],
];

const SIZES_MID: ReadonlyArray<readonly [string, number]> = [
  ["11–50 employees", 30], ["51–200 employees", 40], ["201–500 employees", 22], ["500+ employees", 8],
];
const SIZES_SMB: ReadonlyArray<readonly [string, number]> = [
  ["1–10 employees", 40], ["11–50 employees", 40], ["51–200 employees", 18], ["201–500 employees", 2],
];

const usedNames = new Set<string>();
function makeName(): string {
  for (let i = 0; i < 80; i += 1) {
    const name = `${pick(FIRST)} ${pick(LAST)}`;
    if (!usedNames.has(name)) {
      usedNames.add(name);
      return name;
    }
  }
  return `${pick(FIRST)} ${pick(LAST)}`;
}

interface Persona {
  name: string;
  job: string;
  company: string | null;
  industry: string;
  size: string;
  city: string;
  province: string;
}

function makePersona(spec: ProgramSpec): Persona {
  const size = weighted(spec.sizes);
  const city = pick(CITIES);
  const trade = pick(spec.industries);
  const roll = rand();
  let company: string | null;
  if (roll < 0.12) company = null;
  else if (roll < 0.55) company = `${city.c} ${trade.co}`;
  else if (roll < 0.82) company = `${pick(BRANDS)} ${trade.co}`;
  else company = `${pick(LAST)} ${trade.co}`;
  if (company && size !== "1–10 employees" && chance(0.3)) {
    company += pick([" (Pty) Ltd", " Group", " Holdings"]);
  }
  return {
    name: makeName(),
    job: pick(spec.jobs),
    company,
    industry: trade.ind,
    size,
    city: city.c,
    province: city.p,
  };
}

const OPENERS: ReadonlyArray<(p: Persona) => string> = [
  (p) => `We run a ${p.industry.toLowerCase()} operation in ${p.city}.`,
  (p) => `I look after this for our team in ${p.city}.`,
  (p) => `Based in ${p.city}, serving clients across ${p.province}.`,
  (p) => `Our business works across ${p.province} from ${p.city}.`,
  (p) => `I am the ${p.job.toLowerCase()} for a company in ${p.city}.`,
  (p) => `We compared a few options before committing.`,
  (p) => `We moved across from our previous system last year.`,
  (p) => `Typical ${p.province} business, tight margins, no time to waste.`,
];

const CLOSERS_POS = [
  "No plans to change.", "Would recommend it to any serious SA business.", "Worth the investment.",
  "Happy overall.", "It does exactly what we needed.", "Renewed without hesitation.",
  "Saved us real time every month.", "Solid choice for a South African company.",
  "The whole team is used to it now.", "If you are on the fence, take the demo.",
];
const CLOSERS_MID = [
  "Good product, a few rough edges.", "Gets the job done, room to improve.",
  "We stay because switching is more effort than the niggles.", "Decent value if you keep it simple.",
  "I would pick it again, but with open eyes.", "Watching the annual price though.",
  "Four stars, support costs it the fifth.",
];
const CLOSERS_NEG = [
  "We are weighing up alternatives.", "Hoping the next update sorts it out.",
  "Support needs serious attention.", "Think carefully before you commit.",
  "The core is good, the execution frustrates.", "Disappointed given the price.",
];

const TITLES_MID = [
  "Good, with a few honest gripes", "Mostly smooth, occasionally frustrating",
  "Solid but the reporting holds it back", "Fine for the basics, thin at the edges",
  "Happy overall, watching the cost", "Four stars, support costs it the fifth",
];
const TITLES_NEG = [
  "Support let us down when it mattered", "Outgrew it faster than expected",
  "Too many small irritations", "Not quite the experience we were sold",
  "Price climbs, value does not", "Implementation was harder than promised",
];

/* ------------------------------------------------------------------ */
/* Program specs                                                       */
/* ------------------------------------------------------------------ */

type Sentence = string | (() => string);

interface Trade { co: string; ind: string }

interface ProgramSpec {
  softwareId: string;
  key: string;
  count: number;
  posBias: number; // added to the 5-star probability
  jobs: readonly string[];
  sizes: ReadonlyArray<readonly [string, number]>;
  industries: readonly Trade[];
  titlesPos: readonly string[];
  pos: readonly Sentence[];
  neg: readonly Sentence[];
  pros: readonly string[];
  cons: readonly string[];
  consStrong: readonly string[];
}

const FIN_JOBS = ["Financial Manager", "Financial Controller", "Accountant", "Finance Director", "Bookkeeper", "Managing Director", "Group Accountant"];
const HR_JOBS = ["HR Manager", "HR Business Partner", "Payroll Administrator", "People Operations Lead", "HR Director", "Reward Specialist"];
const PAY_JOBS = ["Payroll Administrator", "Payroll Manager", "Financial Manager", "HR Manager", "Bookkeeper", "Office Manager"];
const SALES_JOBS = ["Sales Manager", "Sales Director", "National Sales Manager", "Commercial Manager", "Managing Director", "Rep Team Lead"];
const OPS_JOBS = ["Operations Manager", "Managing Director", "Financial Manager", "Production Manager", "Systems Administrator", "Business Owner"];
const PRACTICE_JOBS = ["Audit Partner", "Audit Manager", "Accountant", "Practice Owner", "Audit Senior", "Compilation Manager"];

const IND_GENERAL: readonly Trade[] = [
  { co: "Manufacturing", ind: "Manufacturing" }, { co: "Distribution", ind: "Wholesale" },
  { co: "Logistics", ind: "Logistics" }, { co: "Retail Group", ind: "Retail" },
  { co: "Foods", ind: "Food & Beverage" }, { co: "Engineering", ind: "Manufacturing" },
  { co: "Properties", ind: "Real Estate" }, { co: "Construction", ind: "Construction" },
  { co: "Mining Supplies", ind: "Mining" }, { co: "Agri", ind: "Agriculture" },
  { co: "Healthcare", ind: "Healthcare" }, { co: "Services", ind: "Business Services" },
];
const IND_PRACTICE: readonly Trade[] = [
  { co: "Accountants", ind: "Accounting" }, { co: "Auditors", ind: "Accounting" },
  { co: "Chartered Accountants", ind: "Accounting" }, { co: "Advisory", ind: "Accounting" },
  { co: "Bookkeeping", ind: "Accounting" },
];
const IND_SALES: readonly Trade[] = [
  { co: "Foods", ind: "Food & Beverage" }, { co: "Beverages", ind: "Food & Beverage" },
  { co: "Distribution", ind: "Wholesale" }, { co: "Cash and Carry", ind: "Wholesale" },
  { co: "Pharmaceuticals", ind: "Healthcare" }, { co: "Building Supplies", ind: "Retail" },
  { co: "Hardware", ind: "Retail" }, { co: "Packaging", ind: "Manufacturing" },
];

const PROGRAMS: readonly ProgramSpec[] = [
  /* -------- Sage Payroll Professional (Sage VIP) -------- */
  {
    softwareId: "sw-sage-payroll-professional",
    key: "spp",
    count: 58,
    posBias: -0.02,
    jobs: PAY_JOBS,
    sizes: SIZES_MID,
    industries: IND_GENERAL,
    titlesPos: [
      "EMP501 season finally holds no fear", "The e@syFile export just works",
      "Handles our bargaining council rules", "Statutory updates land before I even ask",
      "ETI calculated without me lifting a finger", "The payroll everyone in the office already knew",
      "Twenty years of payroll and still trust it", "Runs 300 payslips without breaking a sweat",
      "Reconciles to the cent every month", "The backbone of our whole payroll",
      "Retrospective changes handled cleanly", "Our auditors never query the payroll numbers",
    ],
    pos: [
      "The IRP5 export drops straight into e@syFile and our EMP501 reconciled first time in August.",
      "PAYE, UIF and SDL all update the moment the budget changes, I never chase tables anymore.",
      "It handles our bargaining council deductions that every cloud tool we tried simply could not.",
      "ETI is calculated automatically and it has saved us real money we were leaving on the table.",
      "We run three pay frequencies across two companies and it never gets confused.",
      "The general ledger journal posts straight into our Sage books with no rekeying.",
      "Retrospective increases backdated two months calculated correctly without any manual patching.",
      "Every payroll administrator we interview already knows it, which makes hiring easier.",
      () => `Support on the ${pick(["Johannesburg", "Cape Town", "Durban"])} line actually understands SA payroll law.`,
      "Twenty odd years on it and the February and August SARS seasons are routine now.",
    ],
    neg: [
      "The interface feels dated next to the cloud tools, it is function over form.",
      "It is desktop at heart, so remote access needs a bit of IT setup.",
      "Pricing is quote only, which makes it hard to budget before you talk to a partner.",
      "The learning curve for a new administrator is real, you need the training.",
      "Report customisation beyond the standards means exporting to Excel.",
      "Annual licence increases arrive without much warning.",
    ],
    pros: [
      "e@syFile and EMP501 exports that reconcile", "statutory tables maintained automatically",
      "ETI and UIF handled properly", "bargaining council and provident fund support",
      "multiple companies and pay frequencies", "GL integration with Sage accounting",
      "administrators everywhere already know it", "local support that understands SA law",
    ],
    cons: [
      "dated interface", "quote only pricing", "steep learning curve for new staff",
      "rigid standard reports", "desktop roots show for remote work",
    ],
    consStrong: [
      "the annual price increases sting", "getting a straight price out of a partner took weeks",
      "training a replacement administrator took months",
    ],
  },

  /* -------- Sage 300 People -------- */
  {
    softwareId: "sw-sage-300-people",
    key: "s3p",
    count: 42,
    posBias: -0.01,
    jobs: HR_JOBS,
    sizes: SIZES_MID,
    industries: IND_GENERAL,
    titlesPos: [
      "Self service took the load off HR", "EE and skills reporting sorted",
      "One system for HR and payroll at last", "Workflow approvals ended the email chaos",
      "Handles our staff across the border", "Managers finally see their own teams",
      "Payslips on the app, no more queues at HR", "The reporting our exco actually wanted",
      "Onboarding is a workflow now, not a folder", "Scales with us as we grow",
    ],
    pos: [
      "Employee self service means staff pull their own payslips and IRP5s and HR stops being a photocopier.",
      "The Employment Equity reporting feeds our submission instead of us rebuilding it in Excel every year.",
      "Leave and claims route through the right manager automatically, the email chains are gone.",
      "We run payroll for staff in two other African countries from the same platform.",
      "Skills and training records are in one place when the SETA comes asking.",
      "Managers log in and see their own teams, which has cut the queries to HR right down.",
      "Payroll stays fully SARS aligned, EMP201 and EMP501 come out clean.",
      "Onboarding a new hire is a proper workflow now with tasks assigned across departments.",
    ],
    neg: [
      "Implementation is a project, budget for the partner time and the change management.",
      "The breadth means it takes a while before you use it to its potential.",
      "Some screens feel busy until you learn where everything lives.",
      "Pricing is quote based and it is not cheap for smaller teams.",
      "Building custom reports has a learning curve.",
    ],
    pros: [
      "employee and manager self service", "Employment Equity and skills reporting",
      "workflow driven leave and claims", "multi country African payroll",
      "SARS aligned payroll built in", "one system for HR and payroll", "onboarding workflows",
    ],
    cons: [
      "meaningful implementation effort", "busy screens at first", "quote based pricing",
      "custom reporting learning curve",
    ],
    consStrong: [
      "the rollout ran over our timeline", "it is overkill for a team under fifty",
      "we needed the partner far more than expected",
    ],
  },

  /* -------- Sage Intacct -------- */
  {
    softwareId: "sw-sage-intacct",
    key: "int",
    count: 34,
    posBias: 0.0,
    jobs: FIN_JOBS,
    sizes: SIZES_MID,
    industries: IND_GENERAL,
    titlesPos: [
      "Multi entity consolidation that just runs", "Dimensions changed how we report",
      "Month end shrank dramatically", "Real time board packs at last",
      "Outgrew our desktop books and never looked back", "The reporting sells itself",
      "Three entities, one clean consolidation", "Automation took the re keying away",
      "Finance finally has time to analyse", "The step up from small business tools we needed",
    ],
    pos: [
      "The dimensional ledger lets us report by branch, project and customer without a monster chart of accounts.",
      "Consolidating our three entities across currencies used to take a week, now it is continuous.",
      "AP automation killed most of the manual capture that ate our month end.",
      "Dashboards give the board real numbers on demand instead of a scramble before every meeting.",
      "Revenue recognition that used to live in a spreadsheet is now in the system and auditable.",
      "It connected to our Salesforce so the sales and finance numbers finally agree.",
      "Month end went from ten days to four once the automation settled in.",
    ],
    neg: [
      "It is a proper step up in price from small business accounting, you feel it.",
      "Implementation needs a good partner and real project discipline.",
      "It is more than a small single entity business will ever use.",
      "Some SA specific bits needed configuration rather than working out of the box.",
      "The depth means training your team properly is essential.",
    ],
    pros: [
      "dimensional general ledger", "continuous multi entity consolidation",
      "strong AP and order to cash automation", "board ready dashboards",
      "multi currency handled well", "open API integrations",
    ],
    cons: [
      "clear step up in cost", "needs a capable implementation partner",
      "overkill for a single small entity", "some SA config required",
    ],
    consStrong: [
      "the price jump from our old system was steep", "implementation took two quarters to bed down",
      "you must invest in training or you waste it",
    ],
  },

  /* -------- Sage X3 -------- */
  {
    softwareId: "sw-sage-x3",
    key: "x3",
    count: 30,
    posBias: -0.04,
    jobs: OPS_JOBS,
    sizes: SIZES_MID,
    industries: IND_GENERAL,
    titlesPos: [
      "One version of the truth across branches", "Landed costing on imports done right",
      "Runs our factory floor to the ledger", "Multi company, multi currency, no drama",
      "Finally retired the spreadsheet empire", "Handles our whole supply chain",
      "Bills of material tied to the books", "Scales with a complex operation",
    ],
    pos: [
      "Landed cost tracking on our imported stock is finally accurate instead of a monthly guess.",
      "Every branch works in one system now, management sees a single set of numbers.",
      "Bills of material and work orders tie straight back to the general ledger.",
      "Multi company and multi currency across our African operations is handled cleanly.",
      "Inventory across three warehouses reconciles without the month end panic.",
      "Once it was configured for our processes it models our supply chain properly.",
    ],
    neg: [
      "This is a serious implementation, choose your partner as carefully as the software.",
      "The rollout is measured in quarters, not weeks, and it costs real money.",
      "The interface is powerful rather than pretty.",
      "You need in house skills or a strong support contract to run it well.",
      "Smaller businesses will drown in capability they do not need.",
    ],
    pros: [
      "finance, supply chain and production in one", "accurate landed cost tracking",
      "multi company and multi currency", "bills of material and work orders",
      "single view across branches", "handles genuine complexity",
    ],
    cons: [
      "heavy implementation", "powerful not pretty interface",
      "needs in house or partner skills", "too much for small businesses",
    ],
    consStrong: [
      "the implementation ran long and over budget", "the wrong partner nearly sank the project",
      "without skilled admin it becomes a burden",
    ],
  },

  /* -------- Sage CRM -------- */
  {
    softwareId: "sw-sage-crm",
    key: "scrm",
    count: 28,
    posBias: -0.03,
    jobs: SALES_JOBS,
    sizes: SIZES_MID,
    industries: IND_GENERAL,
    titlesPos: [
      "Reps see the full trading history", "Pairs beautifully with our Evolution books",
      "Pipeline finally visible to management", "Quotes linked to real credit positions",
      "The service desk keeps cases from slipping", "Cloud or on prem, our choice",
      "Sales and finance on the same page", "Forecasting we can actually trust",
    ],
    pos: [
      "Reps see a customer's full trading history and credit position from Evolution without leaving the CRM.",
      "Quotes pull real pricing from the books so we stop promising numbers we cannot honour.",
      "The service desk logs and tracks customer cases so nothing slips through anymore.",
      "Management finally has a live read on the pipeline instead of asking reps for updates.",
      "We host it on premise, which suited our connectivity and data concerns.",
      "Forecasting improved once every opportunity lived in one place.",
    ],
    neg: [
      "The interface shows its age compared to the flashy cloud CRMs.",
      "The real value only lands if you already run Sage financials.",
      "Setup and customisation need a partner to do properly.",
      "Mobile is functional rather than slick.",
      "Reporting takes some configuration to get what you want.",
    ],
    pros: [
      "tight link to Sage 200 Evolution", "sales, service and marketing in one",
      "cloud or on premise choice", "pipeline dashboards", "quotes tied to accounting",
      "case management that works",
    ],
    cons: [
      "dated interface", "value depends on running Sage books",
      "needs a partner to customise", "basic mobile experience",
    ],
    consStrong: [
      "on its own, away from Sage financials, the case is weak",
      "customisation cost more than we planned", "it feels a generation behind cloud rivals",
    ],
  },

  /* -------- CaseWare -------- */
  {
    softwareId: "sw-caseware",
    key: "cw",
    count: 40,
    posBias: 0.03,
    jobs: PRACTICE_JOBS,
    sizes: SIZES_SMB,
    industries: IND_PRACTICE,
    titlesPos: [
      "The standard our whole practice runs on", "AFS that comply without the rewrite",
      "Disclosure updates land every year", "Our audit files are finally consistent",
      "Trial balance imports and just maps", "Every article clerk learns it here",
      "IFRS for SMEs done properly", "Review notes and sign off in one file",
      "Twenty years and still the backbone", "Standards changes handled for us",
    ],
    pos: [
      "The IFRS for SMEs templates keep our financial statements compliant and consistent across every client.",
      "When the standards change the disclosures update, we are not rewriting statements by hand each year.",
      "Trial balances import and map so we stop rekeying figures from the client's books.",
      "The audit methodology gives our juniors a proper structured process to follow.",
      "Every review note, every piece of evidence and the sign off all live in one engagement file.",
      "It integrates with the Pastel and Sage ledgers our clients already run.",
      "Consolidations that used to be a nightmare are structured and repeatable now.",
      "CaseWare Africa keeps the local content current, which is exactly what a small practice needs.",
    ],
    neg: [
      "The learning curve is steep, a new clerk needs weeks before they are productive.",
      "It is powerful but the interface is dense and not modern.",
      "Licensing is quote based and adds up across a growing team.",
      "Set up of custom templates takes real effort.",
      "It assumes a level of accounting knowledge, it is a professional tool not a shortcut.",
    ],
    pros: [
      "IFRS and IFRS for SMEs statements", "disclosure templates kept current",
      "trial balance import and mapping", "structured audit methodology",
      "everything in one engagement file", "local content from CaseWare Africa",
      "consolidations handled", "the profession already knows it",
    ],
    cons: [
      "steep learning curve", "dense interface", "quote based licensing",
      "template setup takes effort",
    ],
    consStrong: [
      "training new staff on it takes weeks", "the interface really shows its age",
      "the licence cost climbs as you add seats",
    ],
  },

  /* -------- Draftworx -------- */
  {
    softwareId: "sw-draftworx",
    key: "dw",
    count: 44,
    posBias: 0.05,
    jobs: PRACTICE_JOBS,
    sizes: SIZES_SMB,
    industries: IND_PRACTICE,
    titlesPos: [
      "Local software that gets our profession", "AFS that build themselves",
      "IFRS for SMEs disclosures automated", "Change a figure, the statements update",
      "Perfect for a small SA practice", "Support that actually answers",
      "Rand pricing, no per engagement surprises", "Compilations to audits in one tool",
      "Our juniors follow a proper process now", "Best value in the local market",
    ],
    pos: [
      "Change a number in the trial balance and it flows through to every disclosure, no rekeying.",
      "The IFRS for SMEs financial statements are automated and kept current with the standards.",
      "It covers compilations, reviews and audits in one package for our small practice.",
      "The working paper structure walks our juniors through a proper process step by step.",
      "Being built in South Africa, the support and templates speak our profession's language.",
      "Rand pricing billed annually with no per engagement charges makes it easy to budget.",
      () => `Support out of ${pick(["their office", "the local team"])} actually answers and knows the product.`,
      "We switched from a pricier tool and honestly have not missed anything.",
    ],
    neg: [
      "For very large or complex groups it can feel lighter than the enterprise tools.",
      "The occasional standards update needs you to refresh templates.",
      "Multi user setup across a bigger firm takes a little planning.",
      "A few advanced disclosures still need manual attention.",
    ],
    pros: [
      "automated IFRS for SMEs statements", "working papers linked to the trial balance",
      "compilation, review and audit in one", "built and supported in South Africa",
      "rand annual pricing", "great value for a small practice", "responsive local support",
    ],
    cons: [
      "lighter for very large groups", "occasional template refreshes",
      "some advanced disclosures need manual work",
    ],
    consStrong: [
      "a very complex consolidation stretched it", "we hit a disclosure it did not cover automatically",
    ],
  },

  /* -------- Skynamo -------- */
  {
    softwareId: "sw-skynamo",
    key: "sky",
    count: 38,
    posBias: 0.02,
    jobs: SALES_JOBS,
    sizes: SIZES_MID,
    industries: IND_SALES,
    titlesPos: [
      "Our reps stopped losing orders", "Visits are measurable now",
      "Orders sync straight to our books", "Paperless field sales at last",
      "Live pricing in the rep's hand", "GPS confirms the calls happened",
      "Built in SA, gets our market", "Reps sell more with less admin",
      "Managers can finally see the field", "Onboarding the team was quick",
    ],
    pos: [
      "Reps place orders on the customer's counter with live stock and pricing, no more paper and no more errors.",
      "Orders sync straight into our accounting so nobody rekeys them back at the office.",
      "GPS confirms which customers were actually visited, the field team is measurable now.",
      "The full catalogue and each customer's history sit in the rep's hand on every call.",
      "We can see who is slipping on their call cycle before the account goes quiet.",
      "It integrates with our Evolution books so sales and stock stay in step.",
      "Reps spend the drive selling, not writing up order forms afterwards.",
      "Onboarding the sales team was faster than we expected for a field tool.",
    ],
    neg: [
      "It is built for teams of reps, a solo salesperson will not get the value.",
      "Pricing is per user on a quote, so it is an investment for a bigger team.",
      "Offline areas need the sync to catch up when signal returns.",
      "The back office setup and catalogue load takes some upfront work.",
      "Reporting is good but we wanted a couple more custom views.",
    ],
    pros: [
      "mobile order taking with live pricing", "orders sync to accounting and ERP",
      "GPS confirmed visits", "customer history on every call", "route and call cycle tracking",
      "built in South Africa", "quick rep onboarding",
    ],
    cons: [
      "aimed at teams not solo reps", "per user quote pricing",
      "offline sync catch up", "upfront catalogue setup",
    ],
    consStrong: [
      "the per user cost adds up for a big team", "the initial catalogue load was a slog",
    ],
  },

  /* -------- QuickEasy BOS -------- */
  {
    softwareId: "sw-quickeasy-bos",
    key: "qe",
    count: 32,
    posBias: 0.0,
    jobs: OPS_JOBS,
    sizes: SIZES_SMB,
    industries: IND_GENERAL,
    titlesPos: [
      "One system instead of five", "Quote to invoice without rekeying",
      "Job costing our print shop needed", "The spreadsheets are finally gone",
      "Local support that picks up", "Production and accounting in step",
      "Everything in one place at last", "Grew with us module by module",
    ],
    pos: [
      "Quotes turn into sales orders that drive production and purchasing, all in one flow.",
      "Job costing is exactly what our print shop needed, we finally know what each job makes.",
      "Stock, invoicing and accounting update as work happens instead of days later.",
      "We replaced a quoting tool, a spreadsheet and a separate accounting package with this one system.",
      "Being local, the VAT and reporting are right and support actually picks up the phone.",
      "We switched on modules as we grew rather than paying for everything up front.",
    ],
    neg: [
      "It is an all in one, so it is a bigger commitment than a single point tool.",
      "The interface is practical rather than polished.",
      "Getting the initial setup right needs the onboarding help.",
      "Pricing is modular and quote based, plan for the parts you need.",
      "Reporting covers the basics well, power users will want more.",
    ],
    pros: [
      "quoting, production and accounting in one", "strong job costing",
      "built and supported in South Africa", "modular, grows with you",
      "replaced several separate tools", "responsive local support",
    ],
    cons: [
      "all in one is a bigger commitment", "practical not polished interface",
      "needs onboarding to set up", "quote based modular pricing",
    ],
    consStrong: [
      "the initial setup needed real hand holding", "power users outgrew the standard reports",
    ],
  },

  /* -------- Paymaster -------- */
  {
    softwareId: "sw-paymaster",
    key: "pm",
    count: 36,
    posBias: 0.03,
    jobs: PAY_JOBS,
    sizes: SIZES_SMB,
    industries: IND_GENERAL,
    titlesPos: [
      "Payroll off my plate at last", "SARS submissions just handled",
      "Cheap, simple and it works", "Payslips out in minutes",
      "Local support when I get stuck", "Perfect for a small employer",
      "The bureau option saved us", "EMP501 season is a non event now",
    ],
    pos: [
      "PAYE, UIF and SDL are calculated correctly and the EMP201 figures are ready every month.",
      "Payslips email out in minutes and staff can pull their own history.",
      "The EMP501 output made the February reconciliation a non event for the first time.",
      "We started running it ourselves then handed it to the bureau when we got busy, same system.",
      "For a small employer the monthly price is genuinely affordable.",
      "Support is local and actually helpful when a payroll question comes up.",
      "Leave tracking and loans are handled without a separate spreadsheet.",
    ],
    neg: [
      "It covers the essentials well but very complex payrolls may need something heavier.",
      "The interface is simple, which is good, but power users may want more depth.",
      "A few advanced report layouts are not there out of the box.",
      "Bureau pricing is a separate quote on top of the software.",
    ],
    pros: [
      "SARS statutory compliance", "EMP201 and EMP501 output", "affordable monthly pricing",
      "emailed payslips and self service", "run it yourself or use the bureau",
      "local South African support", "leave and loan tracking",
    ],
    cons: [
      "lighter for very complex payrolls", "simple reporting",
      "bureau service is a separate quote",
    ],
    consStrong: [
      "a complex payroll pushed its limits", "we wanted report layouts it did not have",
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Assembly                                                            */
/* ------------------------------------------------------------------ */

function resolve(s: Sentence): string {
  return typeof s === "function" ? s() : s;
}

function pickRating(bias: number): number {
  const r = rand();
  const five = 0.44 + bias;
  if (r < five) return 5;
  if (r < five + 0.36) return 4;
  if (r < five + 0.49) return 3;
  if (r < five + 0.54) return 2;
  return 1;
}

function subRating(overall: number): number {
  const drift = chance(0.28) ? (chance(0.5) ? 1 : -1) : 0;
  return Math.min(5, Math.max(1, overall + drift));
}

function pickDate(): string {
  const r = rand();
  let year: number;
  let month: number;
  if (r < 0.2) {
    year = 2024;
    month = between(7, 12);
  } else if (r < 0.62) {
    year = 2025;
    month = between(1, 12);
  } else {
    year = 2026;
    month = between(1, 6);
  }
  const mm = String(month).padStart(2, "0");
  const dd = String(between(1, 28)).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
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
    parts.push(...distinct(spec.pos, chance(0.38) ? 2 : 1).map(resolve));
    if (rating === 5 && chance(0.45)) parts.push(pick(CLOSERS_POS));
    if (rating === 4 && chance(0.5)) parts.push(chance(0.5) ? pick(CLOSERS_POS) : pick(CLOSERS_MID));
  } else if (rating === 3) {
    if (chance(0.4)) parts.push(pick(OPENERS)(p));
    parts.push(resolve(pick(spec.pos)));
    parts.push(resolve(pick(spec.neg)));
    if (chance(0.5)) parts.push(pick(CLOSERS_MID));
  } else {
    if (chance(0.35)) parts.push(pick(OPENERS)(p));
    parts.push(...distinct(spec.neg, chance(0.4) ? 2 : 1).map(resolve));
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
    const rating = pickRating(spec.posBias);
    const duration = weighted(DURATIONS);
    const date = pickDate();
    const p = makePersona(spec);

    let title: string;
    if (rating === 5 || (rating === 4 && chance(0.7))) {
      title = titleCycle[titleIndex % titleCycle.length];
      titleIndex += 1;
    } else if (rating >= 3) {
      title = pick(TITLES_MID);
    } else {
      title = pick(TITLES_NEG);
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
    if (!chance(0.2)) {
      if (rating >= 4) {
        pros = joinFragments(distinct(spec.pros, between(2, 3)));
        if (chance(0.75)) cons = joinFragments(distinct(spec.cons, 1));
      } else if (rating === 3) {
        if (chance(0.75)) pros = joinFragments(distinct(spec.pros, between(1, 2)));
        cons = joinFragments(distinct(chance(0.5) ? spec.cons : [...spec.cons, ...spec.consStrong], between(1, 2)));
      } else {
        if (chance(0.3)) pros = joinFragments(distinct(spec.pros, 1));
        cons = joinFragments([pick(spec.consStrong), ...(chance(0.5) ? [pick(spec.cons)] : [])]);
      }
    }

    const year = Number(date.slice(0, 4));
    let helpful = between(0, 5) + (2026 - year) * between(0, 7) + (rating >= 4 ? between(0, 6) : between(0, 3));
    if (chance(0.12)) helpful += between(10, 30);

    reviews.push({
      id: `rev-nw-${spec.key}-${String(n).padStart(3, "0")}`,
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

export const newReviewBank: Review[] = PROGRAMS.flatMap(buildReviews);
