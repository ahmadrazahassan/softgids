import type { Comparison, Software } from "@/lib/types";
import { placeholderCategories } from "./categories";
import { placeholderSoftware as roster } from "./software";
import { placeholderReviews } from "./reviews";
import { placeholderArticles } from "./articles";
import { placeholderPages } from "./pages";
import {
  SITE_TAGLINE,
  CONTACT_EMAIL,
} from "@/lib/site";

export { placeholderCategories, placeholderReviews, placeholderArticles, placeholderPages };

/* ------------------------------------------------------------------ */
/* Aggregates — mirror the database triggers, never hardcoded.         */
/* ------------------------------------------------------------------ */

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function avg(values: Array<number | null>): number {
  const nums = values.filter((v): v is number => typeof v === "number" && v > 0);
  if (nums.length === 0) return 0;
  return round1(nums.reduce((a, b) => a + b, 0) / nums.length);
}

/** update_software_ratings() equivalent for the demo dataset. */
export const placeholderSoftware: Software[] = roster.map((product) => {
  const reviews = placeholderReviews.filter(
    (r) => r.software_id === product.id && r.status === "published"
  );
  return {
    ...product,
    // Real vendor marks downloaded to /public/logos, keyed by slug.
    logo_url: product.logo_url ?? `/logos/${product.slug}.png`,
    overall_rating: avg(reviews.map((r) => r.overall_rating)),
    ease_of_use_rating: avg(reviews.map((r) => r.ease_of_use)),
    value_for_money_rating: avg(reviews.map((r) => r.value_for_money)),
    customer_service_rating: avg(reviews.map((r) => r.customer_service)),
    functionality_rating: avg(reviews.map((r) => r.functionality)),
    review_count: reviews.length,
    category:
      placeholderCategories.find((c) => c.id === product.category_id) ?? null,
  };
});

/** update_category_counts() equivalent. */
placeholderCategories.forEach((category) => {
  category.software_count = placeholderSoftware.filter(
    (s) => s.category_id === category.id && s.status === "published"
  ).length;
});

/* ------------------------------------------------------------------ */
/* Alternatives — ranked competitor slugs per product slug.            */
/* ------------------------------------------------------------------ */

export const placeholderAlternatives: Record<string, string[]> = {
  "sage-business-cloud-accounting": ["xero", "quickbooks-online", "zoho-books", "sage-pastel-accounting"],
  "xero": ["sage-business-cloud-accounting", "quickbooks-online", "zoho-books"],
  "quickbooks-online": ["xero", "sage-business-cloud-accounting", "zoho-books"],
  "quickbooks-online-simple-start": ["quickbooks-online-essentials", "sage-business-cloud-accounting", "zoho-books"],
  "quickbooks-online-essentials": ["quickbooks-online-plus", "quickbooks-online-simple-start", "xero"],
  "quickbooks-online-plus": ["quickbooks-online-advanced", "quickbooks-online-essentials", "xero"],
  "quickbooks-online-advanced": ["quickbooks-online-plus", "sage-evolution", "odoo"],
  "quickbooks-online-accountant": ["quickbooks-online", "xero", "sage-business-cloud-accounting"],
  "zoho-books": ["xero", "sage-business-cloud-accounting", "quickbooks-online"],
  "sage-pastel-accounting": ["sage-business-cloud-accounting", "sage-evolution", "xero"],
  "simplepay": ["payspace", "sage-pastel-payroll"],
  "payspace": ["simplepay", "sage-pastel-payroll"],
  "sage-pastel-payroll": ["simplepay", "payspace"],
  "sage-hr": ["bamboohr", "payspace"],
  "bamboohr": ["sage-hr", "payspace"],
  "zoho-crm": ["hubspot", "salesforce"],
  "salesforce": ["zoho-crm", "hubspot"],
  "hubspot": ["zoho-crm", "salesforce"],
  "odoo": ["sap-business-one", "sage-evolution"],
  "sap-business-one": ["odoo", "sage-evolution"],
  "sage-evolution": ["odoo", "sap-business-one", "sage-pastel-accounting"],
  "monday-com": ["asana", "trello"],
  "dynamics-365-business-central": ["sage-evolution", "sap-business-one", "odoo"],
  "capsule-crm": ["zoho-crm", "hubspot", "salesforce"],
  "freeagent": ["quickfile", "xero", "quickbooks-online"],
  "quickfile": ["freeagent", "xero", "zoho-books"],
  "breathe-hr": ["charliehr", "sage-hr", "bamboohr"],
  "charliehr": ["breathe-hr", "sage-hr", "bamboohr"],
  "brightpay": ["simplepay", "payspace", "sage-pastel-payroll"],
  "pipedrive": ["capsule-crm", "zoho-crm", "hubspot"],
  "freshsales": ["pipedrive", "zoho-crm", "hubspot"],
  "zoho-people": ["sage-hr", "bamboohr", "breathe-hr"],
  "deel": ["payspace", "simplepay", "zoho-people"],
  "netsuite": ["dynamics-365-business-central", "sage-evolution", "sap-business-one"],
  "syspro": ["sage-evolution", "dynamics-365-business-central", "sap-business-one"],
  "palladium-accounting": ["sage-pastel-accounting", "omni-accounts", "sage-business-cloud-accounting"],
  "omni-accounts": ["palladium-accounting", "sage-pastel-accounting", "quickbooks-online"],
  "clickup": ["monday-com", "asana", "jira"],
  "jira": ["clickup", "monday-com", "asana"],
  "asana": ["monday-com", "trello"],
  "trello": ["monday-com", "asana"],
  "sage-payroll-professional": ["sage-pastel-payroll", "sage-business-cloud-payroll", "payspace", "paymaster"],
  "sage-300-people": ["sage-hr", "payspace", "zoho-people", "bamboohr"],
  "sage-intacct": ["sage-evolution", "netsuite", "xero", "sage-business-cloud-accounting"],
  "sage-x3": ["sage-evolution", "sap-business-one", "syspro", "netsuite"],
  "sage-crm": ["zoho-crm", "salesforce", "hubspot", "sage-evolution"],
  "caseware": ["draftworx", "sage-business-cloud-accounting", "sage-pastel-accounting"],
  "draftworx": ["caseware", "sage-business-cloud-accounting", "xero"],
  "skynamo": ["zoho-crm", "pipedrive", "sage-crm", "salesforce"],
  "quickeasy-bos": ["sage-evolution", "odoo", "syspro", "palladium-accounting"],
  "paymaster": ["simplepay", "payspace", "sage-pastel-payroll", "sage-payroll-professional"],
};

/* ------------------------------------------------------------------ */
/* Curated comparisons.                                                */
/* ------------------------------------------------------------------ */

function bySlug(slug: string): Software {
  const found = placeholderSoftware.find((s) => s.slug === slug);
  if (!found) throw new Error(`Unknown placeholder slug: ${slug}`);
  return found;
}

function cmp(id: string, a: string, b: string, verdict: string): Comparison {
  return {
    id,
    software_a_id: bySlug(a).id,
    software_b_id: bySlug(b).id,
    software_a: bySlug(a),
    software_b: bySlug(b),
    custom_verdict: verdict,
    status: "published",
  };
}

export const placeholderComparisons: Comparison[] = [
  cmp(
    "cmp-1",
    "sage-business-cloud-accounting",
    "xero",
    "Both are superb cloud accounting platforms for South African SMBs. Sage wins on local depth — VAT201 reports that mirror eFiling, SA support lines and rand pricing across the board — while Xero wins on reconciliation speed and its 1 000+ app ecosystem. Practices standardising client books tend to pick Xero; owner-managed businesses that want SARS-native workflows and local support tend to pick Sage."
  ),
  cmp(
    "cmp-2",
    "xero",
    "quickbooks-online",
    "Xero and QuickBooks Online split the honours: Xero's bank reconciliation and unlimited-user pricing suit collaborative bookkeeping, while QuickBooks' project profitability and custom reports give managers more insight per rand. For most SA service businesses billing by project, QuickBooks edges it; for practice-led bookkeeping, Xero remains the favourite."
  ),
  cmp(
    "cmp-3",
    "simplepay",
    "payspace",
    "The classic SA payroll decision. SimplePay is the value pick for businesses up to a few hundred employees — per-payslip pricing, automatic UIF declarations and flawless e@syFile exports with next to no learning curve. PaySpace justifies its higher per-employee cost the moment you need multi-country African payroll, complex pay structures or deeper HR workflows."
  ),
  cmp(
    "cmp-4",
    "zoho-crm",
    "hubspot",
    "HubSpot's free tier and marketing suite make it the natural start for inbound-led teams, but costs climb steeply into the Professional tiers. Zoho CRM delivers comparable sales automation at rand-billed prices that stay SMB-friendly all the way to Enterprise. Marketing-led? HubSpot. Sales-process-led on a budget? Zoho."
  ),
  cmp(
    "cmp-5",
    "monday-com",
    "asana",
    "monday.com is the more visual, flexible Work OS — boards bend to any process and automations are effortless. Asana is the more disciplined project tracker — one owner per task, goals wired to work. Creative and ops teams tend to prefer monday.com; product and strategy-driven organisations tend to prefer Asana."
  ),
  cmp(
    "cmp-6",
    "sage-business-cloud-accounting",
    "quickbooks-online",
    "Sage brings the strongest South African localisation in the category; QuickBooks brings the deepest reporting. If your priority is a VAT201 that captures straight onto eFiling and support in your time zone, choose Sage. If you need project-level profitability and a powerful custom report writer, QuickBooks rewards the setup effort."
  ),
  cmp(
    "cmp-7",
    "quickbooks-online-simple-start",
    "sage-business-cloud-accounting",
    "The entry level shootout. Simple Start at R322 undercuts Sage's Standard tier and its mobile app and AI categorisation are a class ahead, but it locks you to one user and its VAT setup needs configuring for SARS. Sage Accounting costs more once you need bookkeeping depth, yet the VAT201 alignment, local support line and accountant familiarity make it the safer first system for most SA owners. Solo operators pick Simple Start; anyone whose accountant runs the books picks Sage."
  ),
  cmp(
    "cmp-8",
    "quickbooks-online-essentials",
    "quickbooks-online-plus",
    "The upgrade question inside the QuickBooks lineup. Essentials at R508 covers bills, three users and multiple currencies, which is enough for pure service businesses. Plus at R708 adds inventory, project profitability and class tracking, and that R200 gap is the cheapest meaningful upgrade in the range. If you hold stock or quote jobs, skip straight to Plus; if you sell time and pay suppliers, Essentials is all you need."
  ),
  cmp(
    "cmp-9",
    "quickbooks-online-plus",
    "xero",
    "The favourite tiers of two heavyweight platforms. QuickBooks Plus wins on reporting depth, project profitability and inventory for the price. Xero wins on bank reconciliation speed, unlimited users on every plan and the bigger app ecosystem SA practices standardise on. Product businesses that watch margins lean QuickBooks; collaborative teams with a Xero practice behind them stay with Xero."
  ),
  cmp(
    "cmp-10",
    "quickbooks-online-advanced",
    "sage-evolution",
    "Two answers to outgrowing SME accounting. QuickBooks Advanced stays in the cloud at R1,144 per month with workflow automation, custom reporting and 25 seats, no implementation project required. Sage 200 Evolution is a real ERP with deeper stock, job costing and a huge SA reseller channel, but it arrives with consultants and a project plan. If your complexity is reporting and controls, Advanced is dramatically cheaper; if it is warehouses and manufacturing, Evolution earns its quote."
  ),
  cmp(
    "cmp-11",
    "sage-pastel-accounting",
    "quickbooks-online",
    "Desktop heritage against cloud momentum. Sage 50cloud Pastel keeps working when the fibre does not, every bookkeeper in the country knows it, and its processing speed on big files is still unmatched. QuickBooks Online wins everywhere else: anywhere access, automatic updates, bank feeds and a modern app. Businesses with stable offices and Pastel trained staff stay put; anyone starting fresh in 2026 starts in the cloud."
  ),
  cmp(
    "cmp-12",
    "sage-pastel-accounting",
    "palladium-accounting",
    "The local desktop derby. Pastel has the brand, the training colleges and a consultant on every corner. Palladium answers with a proper SQL database, warehouse grade inventory with serial tracking, and Enterprise pricing that undercuts the equivalent Sage tier. Stock light businesses choose Pastel for the ecosystem; stock heavy businesses that evaluate both usually walk away surprised by Palladium."
  ),
  cmp(
    "cmp-13",
    "sage-business-cloud-payroll",
    "simplepay",
    "Two clean answers to SA cloud payroll. Sage Business Cloud Payroll wins inside the Sage ecosystem, posting journals straight into Sage Accounting with tiered pricing that suits bookkeepers running many small clients. SimplePay counters with the friendliest interface in SA payroll, per payslip pricing and flawless e@syFile exports. Sage shops pick Sage; everyone else tends to find SimplePay quicker to love."
  ),
  cmp(
    "cmp-14",
    "sage-pastel-payroll",
    "sage-business-cloud-payroll",
    "Sage against Sage: the desktop stalwart versus the cloud successor. Pastel Payroll handles complexity the cloud version cannot yet touch, up to 500 employees with deep statutory depth, but you install updates every year and live on one machine. Business Cloud Payroll updates itself, runs anywhere and costs less at small headcounts. Under 25 employees with simple needs, go cloud; complex or larger payrolls stay on desktop for now."
  ),
  cmp(
    "cmp-16",
    "sage-business-cloud-accounting",
    "sage-pastel-accounting",
    "Sage against Sage: cloud convenience versus desktop muscle. Sage Accounting wins on price, bank feeds, anywhere access and zero maintenance, and it is where Sage points new small businesses. Sage 50cloud Pastel wins on processing speed, deep stock, multi company work and the enormous base of bookkeepers trained on it. Simple books go cloud; established accounts departments with volume stay on Pastel until the cloud version catches up on depth."
  ),
  cmp(
    "cmp-17",
    "quickbooks-online-plus",
    "quickbooks-online-advanced",
    "The top of the QuickBooks ladder. Plus at R708 covers inventory, projects and five users, which is genuinely enough for most SMBs. Advanced at R1,144 buys twenty five seats, workflow automation, the custom report builder with Excel sync and backup and restore. The rule of thumb: upgrade when approvals live in email or the reports you need do not exist, and not before."
  ),
  cmp(
    "cmp-18",
    "quickbooks-online",
    "freeagent",
    "A mainstream heavyweight against a beloved specialist. QuickBooks Online is the broader product with deeper reporting, inventory options and rand pricing for South African books. FreeAgent is the friendlier product, but it is UK tax software: superb for SA freelancers and outsourcing firms serving British clients, wrong for SARS books. Choose by jurisdiction first and preference second."
  ),
  cmp(
    "cmp-19",
    "sage-evolution",
    "syspro",
    "The South African ERP derby. Sage 200 Evolution is the natural step up for Pastel shops: familiar concepts, a huge reseller channel and strong distribution features. SYSPRO is the manufacturing specialist, with MRP, shop floor control and traceability that Evolution cannot match, at implementation budgets to match. Distributors and service groups lean Evolution; factories lean SYSPRO."
  ),
  cmp(
    "cmp-20",
    "dynamics-365-business-central",
    "netsuite",
    "The two global cloud ERPs SA mid market shortlists always contain. Business Central wins on Microsoft ecosystem gravity, Excel and Teams integration, and materially lower per user pricing through local partners. NetSuite wins on multi entity consolidation, revenue recognition and reporting depth for groups with investors. Single entity operations pick Business Central; multi entity groups justify NetSuite."
  ),
  cmp(
    "cmp-21",
    "pipedrive",
    "capsule-crm",
    "Two CRMs that respect small teams. Pipedrive is the sales machine: activity discipline, automation and forecasting that measurably lift close rates, at roughly double the price. Capsule is the simpler relationship keeper with a genuinely useful free tier and effortless adoption. Dedicated sales teams earn Pipedrive's premium; owner led businesses that just need organised follow ups are happier on Capsule."
  ),
  cmp(
    "cmp-22",
    "clickup",
    "jira",
    "The generalist against the specialist. ClickUp consolidates tasks, docs, goals and chat for every department at unbeatable per user value. Jira remains the deeper tool for software delivery, with sprints, velocity and audit trails engineering teams rely on. Dev shops stay on Jira; mixed companies consolidating tool spend move everything else into ClickUp, and plenty run both."
  ),
  cmp(
    "cmp-15",
    "sage-hr",
    "zoho-people",
    "Modular SA friendly HR against unbeatable global value. Sage HR publishes rand pricing, pairs naturally with Sage payroll and keeps setup simple. Zoho People costs a fraction per employee, goes deeper on attendance and shift tracking, and rewards companies already in the Zoho ecosystem, at the price of a clunkier interface and offshore support. Sage payroll customers pick Sage HR; cost driven teams with field staff pick Zoho."
  ),
];

/* ------------------------------------------------------------------ */
/* Site settings + stats.                                              */
/* ------------------------------------------------------------------ */

export const placeholderSettings: Record<string, string> = {
  site_name: "SoftGids",
  tagline: SITE_TAGLINE,
  contact_email: CONTACT_EMAIL,
  footer_text:
    "SoftGids helps South African businesses find the right software through verified reviews and expert comparisons.",
  social_twitter: "",
  social_linkedin: "",
  social_facebook: "",
  ga_tracking_id: "",
  items_per_page: "10",
};

export function placeholderStats() {
  return {
    reviews: placeholderReviews.filter((r) => r.status === "published").length,
    software: placeholderSoftware.filter((s) => s.status === "published").length,
    categories: placeholderCategories.length,
  };
}
