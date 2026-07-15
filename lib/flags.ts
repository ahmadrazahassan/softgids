import generated from "./flags.generated.json";

/**
 * Country name → local flag asset. The full flag set lives in public/flags/
 * (downloaded from flagcdn, one SVG per ISO code); the generated JSON maps
 * every English country name to its code. Aliases cover the informal
 * spellings an admin might type.
 */

const NAME_TO_CODE = generated as Record<string, string>;

const ALIASES: Record<string, string> = {
  usa: "us",
  "united states of america": "us",
  america: "us",
  uk: "gb",
  england: "gb",
  britain: "gb",
  "great britain": "gb",
  uae: "ae",
  "ivory coast": "ci",
  "cape verde": "cv",
  "czech republic": "cz",
  swaziland: "sz",
  "the netherlands": "nl",
  holland: "nl",
  "south korea": "kr",
  "north korea": "kp",
  russia: "ru",
  vietnam: "vn",
  laos: "la",
  syria: "sy",
  iran: "ir",
  moldova: "md",
  tanzania: "tz",
  "democratic republic of congo": "cd",
  "drc": "cd",
  "republic of congo": "cg",
  palestine: "ps",
  "east timor": "tl",
  brunei: "bn",
  "vatican city": "va",
  micronesia: "fm",
  "saint kitts": "kn",
  "saint lucia": "lc",
  "saint vincent": "vc",
  bolivia: "bo",
  venezuela: "ve",
  taiwan: "tw",
  macau: "mo",
  "hong kong": "hk",
};

/** Returns the local SVG path for a country name, or null (e.g. "Global"). */
export function flagSrcFor(country: string): string | null {
  const key = country.trim().toLowerCase();
  const code = NAME_TO_CODE[key] ?? ALIASES[key] ?? null;
  return code ? `/flags/${code}.svg` : null;
}
