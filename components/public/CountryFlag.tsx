import Image from "next/image";
import { Globe2 } from "lucide-react";
import { flagSrcFor } from "@/lib/flags";
import { cn } from "@/lib/utils";

/**
 * Real country flag rendered from the local /public/flags set, with a globe
 * fallback for "Global" or anything unmapped. Decorative: the country name
 * is always shown as text beside it.
 */
export function CountryFlag({
  country,
  size = 16,
  className,
}: {
  country: string;
  size?: number;
  className?: string;
}) {
  const src = flagSrcFor(country);
  const height = Math.round(size * 0.75);

  if (!src) {
    return (
      <Globe2
        aria-hidden="true"
        className={cn("shrink-0 text-muted-foreground", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <Image
      src={src}
      alt=""
      aria-hidden="true"
      width={size}
      height={height}
      unoptimized
      className={cn(
        "inline-block shrink-0 rounded-[2px] object-cover ring-1 ring-black/10 dark:ring-white/10",
        className
      )}
      style={{ width: size, height }}
    />
  );
}
