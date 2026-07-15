/**
 * Real company logos for integration chips. Icons live in
 * public/integrations/<domain>.png (64px favicons fetched from each vendor).
 * Resolution: exact name match first, then brand-family prefix rules.
 * Returns null when we don't have the logo — the chip falls back to a dot.
 */

const EXACT: Record<string, string> = {
  "simplepay": "simplepay.co.za",
  "stripe": "stripe.com",
  "paypal": "paypal.com",
  "yoco": "yoco.com",
  "shopify": "shopify.com",
  "shopify (connector)": "shopify.com",
  "hubdoc": "hubdoc.com",
  "cin7": "cin7.com",
  "deputy": "deputy.com",
  "fathom": "fathomhq.com",
  "dext": "dext.com",
  "gusto": "gusto.com",
  "hubspot": "hubspot.com",
  "slack": "slack.com",
  "xero": "xero.com",
  "quickbooks online": "quickbooks.intuit.com",
  "oracle": "oracle.com",
  "greenhouse": "greenhouse.io",
  "zapier": "zapier.com",
  "mailchimp": "mailchimp.com",
  "docusign": "docusign.com",
  "tableau": "tableau.com",
  "gmail": "gmail.com",
  "outlook": "outlook.com",
  "zoom": "zoom.us",
  "wordpress": "wordpress.org",
  "woocommerce": "woocommerce.com",
  "dropbox": "dropbox.com",
  "jira": "atlassian.com",
  "confluence": "atlassian.com",
  "figma": "figma.com",
  "github": "github.com",
  "google drive": "google.com",
  "google workspace": "google.com",
};

const PREFIXES: Array<[string, string]> = [
  ["zoho", "zoho.com"],
  ["sage", "sage.com"],
  ["microsoft", "microsoft.com"],
  ["google", "google.com"],
  ["sap", "sap.com"],
  ["quickbooks", "quickbooks.intuit.com"],
];

export function integrationLogo(name: string): string | null {
  const key = name.trim().toLowerCase();
  const exact = EXACT[key];
  if (exact) return `/integrations/${exact}.png`;
  for (const [prefix, domain] of PREFIXES) {
    if (key.startsWith(prefix)) return `/integrations/${domain}.png`;
  }
  return null;
}
