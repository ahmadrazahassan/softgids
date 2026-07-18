/**
 * Sage affiliate link (Impact Radius — sagesouthafrica.pxf.io).
 *
 * One approved tracking link, used verbatim for every Sage product. Nothing is
 * appended to it: no deep-link parameters, no extra query string. Every Sage
 * "Visit website" CTA opens exactly this URL, which lands on the Sage South
 * Africa site with the affiliate attribution attached.
 *
 * Deliberate: keep this a single constant. If a future change needs product
 * level landing pages, take it up with the Sage programme first rather than
 * decorating this URL by hand.
 */
export const SAGE_AFFILIATE_URL = "https://sagesouthafrica.pxf.io/c/7483506/2932573/34654";
