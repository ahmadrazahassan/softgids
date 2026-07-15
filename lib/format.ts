import { SITE_LOCALE } from "@/lib/site";

/** ZAR first and default — the platform's home market is South Africa. */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  ZAR: "R",
  USD: "US$",
  EUR: "€",
  GBP: "£",
};

export function currencySymbol(code?: string | null): string {
  return CURRENCY_SYMBOLS[code ?? "ZAR"] ?? "R";
}

/** `R299` / `R1 249` — symbol prefixed, en-ZA digit grouping, no decimals for whole rand. */
export function formatPrice(
  amount: number | null | undefined,
  currency: string = "ZAR"
): string {
  if (amount == null) return "Custom";
  const hasCents = Math.round(amount * 100) % 100 !== 0;
  const value = amount.toLocaleString(SITE_LOCALE, {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  });
  return `${currencySymbol(currency)}${value}`;
}

export function formatPricePerPeriod(
  amount: number | null | undefined,
  currency: string = "ZAR",
  period: string = "month"
): string {
  if (amount == null) return "Custom pricing";
  const suffix = period === "month" ? "/mo" : period === "year" ? "/yr" : `/${period}`;
  return `${formatPrice(amount, currency)}${suffix}`;
}

/** Starting-price split into a headline amount and a short note, for compact display. */
export function startingPriceLabel(software: {
  free_version: boolean;
  starting_price: number | null;
  price_currency: string;
  billing_period: string;
}): { amount: string; note: string; custom: boolean } {
  if (software.free_version && (software.starting_price ?? 0) === 0) {
    return { amount: "Free", note: "plan", custom: false };
  }
  if (software.starting_price == null) {
    return { amount: "Custom", note: "", custom: true };
  }
  const note =
    software.billing_period === "month"
      ? "/mo"
      : software.billing_period === "year"
        ? "/yr"
        : `/${software.billing_period}`;
  return { amount: formatPrice(software.starting_price, software.price_currency), note, custom: false };
}

export function formatNumber(n: number): string {
  return n.toLocaleString(SITE_LOCALE);
}

export function formatDate(
  input: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }
): string {
  if (!input) return "";
  const date = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(SITE_LOCALE, options);
}

export function formatRating(rating: number | null | undefined): string {
  return (rating ?? 0).toLocaleString(SITE_LOCALE, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}
