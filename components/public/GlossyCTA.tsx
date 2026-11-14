import Link from "next/link";
import { withAlpha } from "@/lib/brandColors";
import { cn } from "@/lib/utils";

/**
 * Signature product CTA — a glossy, lit button tinted to the product's brand
 * accent: a top-light gradient, an inner sheen highlight, and a soft coloured
 * glow.
 *
 * Internal navigation only. It used to carry an `external` branch that
 * hand-wrote a sponsored rel including noreferrer, which was both unused and
 * referrer-destroying. Outbound vendor links belong to AffiliateCTAButton or
 * AffiliateLink, which get their attributes from lib/affiliate.ts.
 */
export function GlossyCTA({
  href,
  accent,
  className,
  children,
}: {
  href: string;
  accent: string;
  className?: string;
  children: React.ReactNode;
}) {
  const classes = cn(
    "group/cta relative inline-flex h-11 items-center justify-center gap-1.5 overflow-hidden rounded-[0.875rem] px-5 text-sm font-semibold text-white",
    "transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    className
  );

  const style: React.CSSProperties = {
    backgroundImage: `linear-gradient(180deg, color-mix(in srgb, ${accent}, #ffffff 28%) 0%, ${accent} 52%, color-mix(in srgb, ${accent}, #000000 22%) 100%)`,
    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -6px 12px ${withAlpha(accent, 0.35)}, 0 10px 22px -8px ${withAlpha(accent, 0.65)}`,
    // @ts-expect-error custom prop consumed by focus ring
    "--tw-ring-color": withAlpha(accent, 0.55),
  };

  const inner = (
    <>
      {/* top-half sheen */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-1 top-0.5 h-[45%] rounded-t-[0.55rem] bg-gradient-to-b from-white/45 to-transparent transition-opacity duration-200 group-hover/cta:from-white/60"
      />
      {/* travelling shine on hover */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-y-2 -left-3 w-6 -skew-x-12 bg-white/25 opacity-0 blur-[3px] transition-all duration-500 group-hover/cta:left-[110%] group-hover/cta:opacity-100"
      />
      <span className="relative z-10 inline-flex items-center gap-1.5">{children}</span>
    </>
  );

  return (
    <Link href={href} className={classes} style={style}>
      {inner}
    </Link>
  );
}
