/**
 * UK → South Africa text scrub. Mirror of the backend's `scrubSA`, running in
 * the opposite direction: if any UK-market copy ever enters the system (e.g.
 * imported vendor descriptions), this normalises it to South African
 * terminology. Order matters — longer phrases replace first.
 */
const REPLACEMENTS: Array<[RegExp, string]> = [
  [/HM Revenue and Customs \(HMRC\)/g, "South African Revenue Service (SARS)"],
  [/HM Revenue and Customs/g, "South African Revenue Service"],
  [/\bHMRC\b/g, "SARS"],
  [/Making Tax Digital for VAT/g, "SARS eFiling for VAT201"],
  [/Making Tax Digital/g, "SARS eFiling"],
  [/\bMTD-ready\b/gi, "VAT201-ready"],
  [/\bMTD\b/g, "eFiling"],
  [/VAT returns/g, "VAT201 returns"],
  [/VAT return/g, "VAT201 return"],
  [/VAT at 20%/g, "VAT at 15%"],
  [/20% VAT/g, "15% VAT"],
  [/RTI submissions and year end/g, "EMP201 submissions and EMP501 reconciliations"],
  [/RTI submissions/g, "EMP201 submissions"],
  [/RTI-ready/g, "e@syFile-ready"],
  [/\bRTI\b/g, "EMP201"],
  [/National Insurance contributions/g, "UIF contributions"],
  [/National Insurance/g, "UIF"],
  [/the Apprenticeship Levy/g, "SDL (Skills Development Levy)"],
  [/Apprenticeship Levy/g, "SDL"],
  [/pension auto-enrolment/gi, "retirement and provident fund contributions"],
  [/auto-enrolment/gi, "retirement fund contributions"],
  [/\bP60s\b/g, "IRP5s"],
  [/\bP60\b/g, "IRP5"],
  [/\bP45s\b/g, "IRP5s"],
  [/\bP45\b/g, "IRP5"],
  [/Companies House/g, "CIPC"],
  [/Information Commissioner's Office \(ICO\)/g, "Information Regulator (South Africa)"],
  [/\bICO\b/g, "Information Regulator (South Africa)"],
  [/UK GDPR and PECR/g, "POPIA"],
  [/UK GDPR/g, "POPIA"],
  [/\bPECR\b/g, "POPIA"],
  [/Data Protection Act 2018/g, "Protection of Personal Information Act, 2013 (POPIA)"],
  [/across the United Kingdom/g, "across South Africa"],
  [/in the United Kingdom/g, "in South Africa"],
  [/the United Kingdom/g, "South Africa"],
  [/United Kingdom/g, "South Africa"],
  [/based in the UK/g, "based in South Africa"],
  [/across the UK/g, "across South Africa"],
  [/in the UK/g, "in South Africa"],
  [/\bUK-based\b/g, "South African"],
  [/\bUK\b/g, "SA"],
  [/\bBritish\b/g, "South African"],
  [/pound-based/g, "rand-based"],
  [/in GBP/g, "in ZAR"],
  [/\bGBP\b/g, "ZAR"],
  [/the pound\b/g, "the rand"],
  [/London, United Kingdom/g, "Cape Town, South Africa"],
  [/\bLondon\b/g, "Cape Town"],
  [/hello@stackmatch\.uk/g, "hello@softgids.co.za"],
  [/stackmatch\.uk/g, "softgids.co.za"],
  [/en-GB/g, "en-ZA"],
  [/en_GB/g, "en_ZA"],
];

export function scrubUKtoSA(text: string): string {
  let out = text;
  for (const [pattern, replacement] of REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}
