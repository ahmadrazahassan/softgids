import {
  affiliateAriaLabel,
  type OutboundLink,
} from "@/lib/affiliate";

/**
 * The only component that renders an outbound vendor link.
 *
 * Deliberately a server component with no click handler: the href is a real
 * tracking URL sitting in the HTML, so the browser handles the click itself and
 * the referrer, middle-click and "copy link address" all behave normally. If
 * JavaScript never loads, the link still earns.
 *
 * First-party click logging is a separate concern, handled by one delegated
 * listener in AffiliateClickBeacon, which keys off the `data-outbound`
 * attribute set here. Nothing about the navigation depends on it.
 *
 * `link` comes from `outboundLink()` — resolve it on the server and pass it in.
 * Never hand-write the href, rel or referrerPolicy at a call site.
 */
export function AffiliateLink({
  link,
  action,
  slug,
  className,
  style,
  children,
}: {
  /** Resolved by `outboundLink(software, slot)` on the server. */
  link: OutboundLink;
  /** What the link does, for the accessible name: "Visit Sage website". */
  action: string;
  /** Product slug, for click logging on links that carry no placement. */
  slug?: string | null;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const affiliate = link.kind === "affiliate";
  return (
    <a
      href={link.href}
      target="_blank"
      rel={link.rel}
      referrerPolicy={link.referrerPolicy}
      aria-label={
        affiliate ? affiliateAriaLabel(action) : `${action} (opens in a new tab)`
      }
      data-outbound={link.kind}
      data-placement={affiliate ? link.placement : undefined}
      data-slug={affiliate ? (link.slug ?? undefined) : (slug ?? undefined)}
      className={className}
      style={style}
    >
      {children}
    </a>
  );
}
