import { cn } from "@/lib/utils";
import { formatRating } from "@/lib/format";

export function CircularRating({
  rating,
  size = 72,
  strokeWidth = 6,
  className,
  color = "var(--color-brand)",
  label,
}: {
  rating: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  color?: string;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(5, rating));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (clamped / 5) * circumference;

  return (
    <div className={cn("relative inline-grid place-items-center", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={label ?? `Rated ${formatRating(clamped)} out of 5`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference - progress}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span
        className="absolute font-heading font-bold tabular-nums"
        style={{ fontSize: size * 0.28 }}
      >
        {formatRating(clamped)}
      </span>
    </div>
  );
}
