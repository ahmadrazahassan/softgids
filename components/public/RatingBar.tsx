import { cn } from "@/lib/utils";
import { formatRating } from "@/lib/format";

/** Labelled horizontal rating bar (0–5), fills on load via .animate-fill-bar. */
export function RatingBar({
  label,
  value,
  max = 5,
  color = "var(--color-brand)",
  className,
  suffix,
}: {
  label: string;
  value: number;
  max?: number;
  color?: string;
  className?: string;
  suffix?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="w-36 shrink-0 text-sm text-muted-foreground">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted" role="presentation">
        <div
          className="animate-fill-bar h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-sm font-semibold tabular-nums">
        {suffix ?? formatRating(value)}
      </span>
    </div>
  );
}
