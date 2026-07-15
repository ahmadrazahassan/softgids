/**
 * Canonical site identity. Every hardcoded market signal lives here so the
 * South African localisation has a single source of truth.
 */
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://softgids.co.za"
).replace(/\/+$/, "");

export const SITE_NAME = "SoftGids";
export const SITE_DOMAIN = "softgids.co.za";
export const SITE_TAGLINE = "South Africa's #1 Business Software Reviews Platform";
export const CONTACT_EMAIL = "hello@softgids.co.za";
export const CONTACT_PHONE = "+27 21 300 4820";
export const SITE_LOCATION = "Cape Town, South Africa";
export const SITE_LOCALE = "en-ZA";
export const OG_LOCALE = "en_ZA";

export const REVIEWER_COUNTRIES = [
  "South Africa",
  "Namibia",
  "Botswana",
  "Zambia",
  "Kenya",
  "Nigeria",
  "Zimbabwe",
  "Other",
] as const;

export const DEFAULT_REVIEWER_COUNTRY = "South Africa";

export const CURRENCIES = ["ZAR", "USD", "EUR", "GBP"] as const;
export const DEFAULT_CURRENCY = "ZAR";
