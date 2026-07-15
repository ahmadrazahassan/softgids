import Image from "next/image";
import { cn } from "@/lib/utils";
import { brandColorFor, withAlpha } from "@/lib/brandColors";
import type { Software } from "@/lib/types";

/**
 * Product logo, rendered raw — no background tile, border or padding, per the
 * design direction. Falls back to a branded initial only when no logo exists.
 */
export function SoftwareLogo({
  software,
  size = 48,
  className,
}: {
  software: Pick<Software, "name" | "slug" | "logo_url" | "brand_color">;
  size?: number;
  className?: string;
}) {
  if (software.logo_url) {
    return (
      <span
        className={cn("relative inline-block shrink-0", className)}
        style={{ width: size, height: size }}
      >
        <Image
          src={software.logo_url}
          alt={`${software.name} logo`}
          fill
          sizes={`${size}px`}
          className="rounded-xl object-contain"
        />
      </span>
    );
  }

  const accent = brandColorFor(software);
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-2xl font-heading font-bold",
        className
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        color: accent,
        background: `linear-gradient(135deg, ${withAlpha(accent, 0.16)}, ${withAlpha(accent, 0.06)})`,
      }}
    >
      {software.name.charAt(0).toUpperCase()}
    </span>
  );
}
