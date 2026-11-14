import { ExternalLink } from "lucide-react";
import { AdLabel } from "@/components/public/AdLabel";
import { AffiliateLink } from "@/components/public/AffiliateLink";
import { outboundLink, type AffiliateTarget } from "@/lib/affiliate";
import { withAlpha } from "@/lib/brandColors";
import { cn } from "@/lib/utils";

/**
 * Outbound vendor CTA. The destination, rel and referrer policy all come from
 * `outboundLink()` in lib/affiliate.ts — nothing about the link is decided
 * here. Wears the shared glossy shell, tinted to the vendor accent.
 *
 * Monetised links get the "Sponsored" mark underneath by default. Turn it off
 * with `showLabel={false}` only where the surrounding block already carries
 * one, as the comparison sticky bar does.
 */
export function AffiliateCTAButton({
  software,
  slot,
  accent,
  className,
  wrapperClassName,
  showLabel = true,
  children,
}: {
  software: AffiliateTarget & { name?: string | null };
  /** Slot name behind the placement ID, e.g. "compare-hero". */
  slot: string;
  accent?: string;
  className?: string;
  wrapperClassName?: string;
  showLabel?: boolean;
  children?: React.ReactNode;
}) {
  const link = outboundLink(software, slot);
  if (!link) return null;

  const vendor = software.vendor_name ?? software.name ?? "vendor";
  const fill = accent ?? "var(--color-brand)";

  const button = (
    <AffiliateLink
      link={link}
      action={`Visit ${vendor} website`}
      slug={software.slug}
      className={cn(
        "btn-glossy inline-flex w-full items-center justify-center gap-2 px-5 py-3 text-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
      style={
        {
          "--btn-bg": fill,
          "--btn-ink": "#ffffff",
          "--btn-glow": accent ? withAlpha(accent, 0.55) : undefined,
        } as React.CSSProperties
      }
    >
      {children ?? `Visit ${vendor} website`}
      <ExternalLink className="size-4" aria-hidden="true" />
    </AffiliateLink>
  );

  if (!showLabel || link.kind !== "affiliate") return button;

  return (
    <span className={cn("flex w-full flex-col items-center gap-1.5", wrapperClassName)}>
      {button}
      <AdLabel />
    </span>
  );
}
