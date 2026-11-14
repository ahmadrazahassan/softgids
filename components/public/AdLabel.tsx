import { AD_LABEL } from "@/lib/affiliate";
import { cn } from "@/lib/utils";

/**
 * The visible advertising mark that sits with every affiliate link and banner.
 *
 * The word matches the one that opens the link's `aria-label`, so a screen
 * reader and a sighted visitor are told the same thing. Styled to the same
 * small-caps eyebrow used elsewhere on the site rather than shouting.
 */
export function AdLabel({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "text-[0.65rem] font-semibold tracking-widest text-muted-foreground/70 uppercase",
        className
      )}
    >
      {AD_LABEL}
    </span>
  );
}
