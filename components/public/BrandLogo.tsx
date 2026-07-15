import Link from "next/link";
import { cn } from "@/lib/utils";
import { SITE_NAME } from "@/lib/site";

/**
 * The SoftGids brand mark: a rating gauge. The dial and needle read as a
 * review score at a glance, which is the heart of what the platform does.
 * The lime arc is the "score", the olive needle and hub anchor it on a light
 * surface, and the whole thing works with no background tile.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-8", className)}
      aria-hidden="true"
    >
      {/* dial track */}
      <path
        d="M10 40 A22 22 0 0 1 54 40"
        stroke="var(--color-brand-dark)"
        strokeOpacity="0.2"
        strokeWidth="7.5"
        strokeLinecap="round"
      />
      {/* score arc */}
      <path
        d="M10 40 A22 22 0 0 1 44.93 22.2"
        stroke="var(--color-brand)"
        strokeWidth="7.5"
        strokeLinecap="round"
      />
      {/* needle + hub */}
      <line
        x1="32"
        y1="40"
        x2="40.2"
        y2="28.7"
        stroke="var(--color-brand-dark)"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <circle cx="32" cy="40" r="4.5" fill="var(--color-brand-dark)" />
    </svg>
  );
}

export function BrandLogo({
  className,
  invert = false,
}: {
  className?: string;
  invert?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2.5 shrink-0", className)}
      aria-label={`${SITE_NAME} — home`}
    >
      <LogoMark />
      <span
        className={cn(
          "font-heading text-[1.35rem] font-medium tracking-tight",
          invert ? "text-white" : "text-foreground"
        )}
      >
        Soft
        <span
          className={cn(
            "font-semibold",
            invert ? "text-[var(--color-brand)]" : "text-[var(--color-brand-dark)]"
          )}
        >
          Gids
        </span>
      </span>
    </Link>
  );
}
