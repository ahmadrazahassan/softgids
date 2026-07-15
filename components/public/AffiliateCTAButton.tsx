import { ExternalLink } from "lucide-react";
import { withAlpha } from "@/lib/brandColors";
import { cn } from "@/lib/utils";

/**
 * Outbound vendor CTA. Always routes through /api/track-click so the click is
 * counted server-side and the affiliate URL stays in the database — never
 * hardcoded in JSX. Wears the shared glossy shell, tinted to the vendor accent.
 */
export function AffiliateCTAButton({
  slug,
  vendorName,
  accent,
  className,
  children,
}: {
  slug: string;
  vendorName?: string | null;
  accent?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const fill = accent ?? "var(--color-brand)";
  return (
    <a
      href={`/api/track-click?software=${encodeURIComponent(slug)}`}
      target="_blank"
      rel="noopener noreferrer sponsored"
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
      {children ?? `Visit ${vendorName ?? "vendor"} website`}
      <ExternalLink className="size-4" aria-hidden="true" />
    </a>
  );
}
