import { cn } from "@/lib/utils";

function Star({ fill, size }: { fill: number; size: number }) {
  const id = `star-${Math.round(fill * 100)}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="shrink-0"
    >
      <defs>
        <linearGradient id={id}>
          <stop offset={`${fill * 100}%`} stopColor="var(--color-star)" />
          <stop offset={`${fill * 100}%`} stopColor="transparent" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.5l2.95 5.98 6.6.96-4.78 4.66 1.13 6.58L12 17.57l-5.9 3.11 1.13-6.58L2.45 9.44l6.6-.96L12 2.5z"
        fill={fill >= 1 ? "var(--color-star)" : fill <= 0 ? "transparent" : `url(#${id})`}
        stroke="var(--color-star)"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StarRating({
  rating,
  size = 16,
  className,
  showValue = false,
}: {
  rating: number;
  size?: number;
  className?: string;
  showValue?: boolean;
}) {
  const clamped = Math.max(0, Math.min(5, rating));
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      role="img"
      aria-label={`Rated ${clamped.toLocaleString("en-ZA", { maximumFractionDigits: 1 })} out of 5`}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} fill={Math.max(0, Math.min(1, clamped - i))} size={size} />
      ))}
      {showValue && (
        <span className="ml-1.5 text-sm font-semibold tabular-nums">
          {clamped.toLocaleString("en-ZA", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
        </span>
      )}
    </span>
  );
}
