/**
 * Real product screenshots live in /public/screenshots and are mapped to a
 * software slug below. A product that is absent from this map (and has no
 * screenshots stored on its record) shows no Screenshots section at all —
 * we never fabricate placeholder previews.
 *
 * Filenames are listed exactly as they sit in /public/screenshots. To add a
 * product, drop its images in that folder and add one entry here.
 */
const UPLOADED_SCREENSHOTS: Record<string, string[]> = {
  paymaster: ["paymaster-1.png", "paymaster-2.png", "paymaster-3.png"],
  "quickbooks-online": [
    "quickbooks-online-1.png",
    "quickbooks-online-2.png",
    "quickbooks-online-3.png",
  ],
  "sage-business-cloud-accounting": [
    "sage-accounting-1.png",
    "sage-accounting-2.png",
    "sage-accounting-3.png",
  ],
  "sage-evolution": [
    "sage-200-evolution-1.png",
    "sage-200-evolution-2.png",
    "sage-200-evolution-3.png",
  ],
  "sage-300-people": ["sage-300-1.png", "sage-300-2.png", "sage-300-3.png"],
  "sage-business-cloud-payroll": ["sage-cloud-business-payroll-1.png"],
  "sage-pastel-payroll": ["sage-payroll-1.png", "sage-payroll-2.png", "sage-payroll-3.png"],
  "sage-crm": ["sage-crm-1.png", "sage-crm-2.png", "sage-crm-3.png"],
  "sage-hr": ["sage-hr-1.png", "sage-hr-2.png", "sage-hr-3.png"],
  "sage-intacct": ["sage-intacct-1.png", "sage-intacct-2.png", "sage-intacct-3.png"],
  "sage-x3": ["sage-x3-1.png", "sage-x3-2.png", "sage-x3-3.png"],
};

/**
 * Resolve the screenshots to show for a product. Prefers screenshots stored on
 * the software record, then falls back to uploaded files mapped by slug.
 * Returns an empty array when there is nothing real to show — the caller then
 * hides the Screenshots section entirely.
 */
export function screenshotsFor(product: {
  slug: string;
  screenshots: string[];
}): string[] {
  if (product.screenshots.length > 0) return product.screenshots;
  const files = UPLOADED_SCREENSHOTS[product.slug] ?? [];
  return files.map((file) => `/screenshots/${file}`);
}
