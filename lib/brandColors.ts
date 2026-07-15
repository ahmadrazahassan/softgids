/**
 * Per-product brand accents, keyed to the South African product roster.
 * Resolution precedence:
 *   1. admin-set `software.brand_color`
 *   2. this hardcoded slug → colour map
 *   3. the site brand green
 */
export const BRAND_GREEN = "#00a86b";

export const BRAND_COLORS: Record<string, string> = {
  // Accounting
  "sage-business-cloud-accounting": "#00d639",
  "xero": "#13b5ea",
  "quickbooks-online": "#2ca01c",
  "zoho-books": "#e42527",
  "sage-pastel-accounting": "#008849",
  // Payroll
  "simplepay": "#1e88e5",
  "payspace": "#e4002b",
  "sage-pastel-payroll": "#00754a",
  // HR
  "sage-hr": "#008849",
  "bamboohr": "#73c41d",
  // CRM
  "zoho-crm": "#e42527",
  "salesforce": "#00a1e0",
  "hubspot": "#ff7a59",
  // ERP
  "odoo": "#714b67",
  "sap-business-one": "#0faaff",
  // Project management
  "monday-com": "#ff3d57",
  "asana": "#f06a6a",
  "trello": "#0079bf",
};

export function brandColorFor(input: {
  slug: string;
  brand_color?: string | null;
}): string {
  if (input.brand_color && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(input.brand_color)) {
    return input.brand_color;
  }
  return BRAND_COLORS[input.slug] ?? BRAND_GREEN;
}

/** rgba() helper for tints of a product accent. */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
