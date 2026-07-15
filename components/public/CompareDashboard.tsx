import { CircularRating } from "@/components/public/CircularRating";
import { DonutChart } from "@/components/public/DonutChart";
import { SoftwareLogo } from "@/components/public/SoftwareLogo";
import { StarRating } from "@/components/public/StarRating";
import { brandColorFor } from "@/lib/brandColors";
import { formatNumber, formatPrice, formatRating } from "@/lib/format";
import type { Software } from "@/lib/types";
import { cn } from "@/lib/utils";

const DIMENSIONS = [
  { key: "overall_rating", label: "Overall" },
  { key: "ease_of_use_rating", label: "Ease of use" },
  { key: "value_for_money_rating", label: "Value for money" },
  { key: "customer_service_rating", label: "Customer service" },
  { key: "functionality_rating", label: "Functionality" },
] as const;

type DimensionKey = (typeof DIMENSIONS)[number]["key"];

function accentPair(a: Software, b: Software): [string, string] {
  const colorA = brandColorFor(a);
  let colorB = brandColorFor(b);
  if (colorB.toLowerCase() === colorA.toLowerCase()) colorB = "var(--color-amber)";
  return [colorA, colorB];
}

/** Monthly-equivalent starting price, for a like-for-like cost bar. */
function monthlyPrice(software: Software): number | null {
  if (software.starting_price == null) return null;
  if (software.billing_period === "year") return software.starting_price / 12;
  return software.starting_price;
}

function SwatchLegend({
  entries,
}: {
  entries: Array<{ name: string; color: string }>;
}) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
      {entries.map((entry) => (
        <li key={entry.name} className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="size-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          {entry.name}
        </li>
      ))}
    </ul>
  );
}

/** One thin horizontal bar: rounded data-end, square at the baseline, value at the tip. */
function DataBar({
  value,
  max,
  color,
  display,
}: {
  value: number;
  max: number;
  color: string;
  display: string;
}) {
  const pct = max <= 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="flex items-center gap-3">
      <div className="h-2.5 flex-1 overflow-hidden rounded-r-[4px] bg-muted" role="presentation">
        <div
          className="animate-fill-bar h-full rounded-r-[4px]"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-14 shrink-0 text-right text-sm font-semibold tabular-nums">
        {display}
      </span>
    </div>
  );
}

/**
 * Data dashboard for the comparison page: KPI tiles, per-product score cards,
 * dimension-by-dimension bars, review share donut and a cost-to-start chart —
 * all plate-ready flat cards in the profile-page design language.
 */
export function CompareDashboard({ a, b }: { a: Software; b: Software }) {
  const [colorA, colorB] = accentPair(a, b);
  const legend = [
    { name: a.name, color: colorA },
    { name: b.name, color: colorB },
  ];

  // Dimension wins & the widest gap
  let winsA = 0;
  let winsB = 0;
  let biggest: { label: string; leader: string; gap: number } | null = null;
  for (const dimension of DIMENSIONS) {
    const valueA = a[dimension.key as DimensionKey];
    const valueB = b[dimension.key as DimensionKey];
    if (valueA > valueB) winsA += 1;
    if (valueB > valueA) winsB += 1;
    const gap = Math.abs(valueA - valueB);
    if (gap > 0 && (!biggest || gap > biggest.gap)) {
      biggest = {
        label: dimension.label,
        leader: valueA > valueB ? a.name : b.name,
        gap,
      };
    }
  }

  const totalReviews = a.review_count + b.review_count;
  const priceA = monthlyPrice(a);
  const priceB = monthlyPrice(b);
  const priceMax = Math.max(priceA ?? 0, priceB ?? 0);
  const cheaper =
    priceA != null && priceB != null && priceA !== priceB
      ? priceA < priceB
        ? a.name
        : b.name
      : null;

  const tiles = [
    {
      label: "Dimensions won",
      value: `${winsA} – ${winsB}`,
      note: `${a.name} vs ${b.name}, across ${DIMENSIONS.length} rating dimensions`,
    },
    {
      label: "Widest rating gap",
      value: biggest ? `+${formatRating(biggest.gap)}` : "Dead heat",
      note: biggest
        ? `${biggest.leader} leads on ${biggest.label.toLowerCase()}`
        : "Every dimension is tied",
    },
    {
      label: "Verified reviews",
      value: formatNumber(totalReviews),
      note: `${formatNumber(a.review_count)} for ${a.name}, ${formatNumber(b.review_count)} for ${b.name}`,
    },
  ];

  return (
    <div className="space-y-2 rounded-[1.75rem] bg-zinc-100/80 p-2 dark:bg-zinc-900/60">
      {/* KPI row */}
      <div className="grid gap-2 sm:grid-cols-3">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="rounded-[1.4rem] border border-zinc-200/70 bg-card p-6 dark:border-zinc-800"
          >
            <p className="text-[0.6rem] font-bold tracking-widest text-muted-foreground uppercase">
              {tile.label}
            </p>
            <p className="mt-2 font-heading text-3xl font-bold tracking-tight">{tile.value}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{tile.note}</p>
          </div>
        ))}
      </div>

      {/* Score cards */}
      <div className="grid gap-2 md:grid-cols-2">
        {(
          [
            [a, colorA],
            [b, colorB],
          ] as const
        ).map(([software, color]) => (
          <div
            key={software.id}
            className="flex flex-col items-center justify-center gap-3 rounded-[1.4rem] border border-zinc-200/70 bg-card p-8 text-center dark:border-zinc-800"
          >
            <div className="flex items-center gap-2.5">
              <SoftwareLogo software={software} size={28} />
              <h3 className="font-heading text-base font-bold tracking-tight">
                {software.name}
              </h3>
            </div>
            <CircularRating rating={software.overall_rating} size={104} color={color} />
            <StarRating rating={software.overall_rating} size={16} />
            <p className="text-sm text-muted-foreground">
              {formatNumber(software.review_count)} verified{" "}
              {software.review_count === 1 ? "review" : "reviews"}
            </p>
          </div>
        ))}
      </div>

      {/* Dimension bars */}
      <div className="rounded-[1.4rem] border border-zinc-200/70 bg-card p-6 sm:p-7 dark:border-zinc-800">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-heading text-base font-bold">Ratings by dimension</h3>
          <SwatchLegend entries={legend} />
        </div>
        <div className="space-y-5">
          {DIMENSIONS.map((dimension) => {
            const valueA = a[dimension.key as DimensionKey];
            const valueB = b[dimension.key as DimensionKey];
            return (
              <div key={dimension.key} className="grid items-center gap-x-4 gap-y-1.5 sm:grid-cols-[9rem_1fr]">
                <p className="text-sm text-muted-foreground">{dimension.label}</p>
                <div className="space-y-1.5">
                  <DataBar value={valueA} max={5} color={colorA} display={formatRating(valueA)} />
                  <DataBar value={valueB} max={5} color={colorB} display={formatRating(valueB)} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review share + cost to start */}
      <div className="grid gap-2 lg:grid-cols-2">
        <div className="rounded-[1.4rem] border border-zinc-200/70 bg-card p-6 sm:p-7 dark:border-zinc-800">
          <h3 className="mb-1 font-heading text-base font-bold">Share of verified reviews</h3>
          <p className="mb-5 text-xs leading-relaxed text-muted-foreground">
            Who South African reviewers actually write about.
          </p>
          {totalReviews > 0 ? (
            <DonutChart
              centerLabel="verified reviews"
              data={[
                { name: a.name, value: a.review_count, color: colorA },
                { name: b.name, value: b.review_count, color: colorB },
              ]}
            />
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">No reviews yet.</p>
          )}
        </div>

        <div className="flex flex-col rounded-[1.4rem] border border-zinc-200/70 bg-card p-6 sm:p-7 dark:border-zinc-800">
          <h3 className="mb-1 font-heading text-base font-bold">Cost to get started</h3>
          <p className="mb-6 text-xs leading-relaxed text-muted-foreground">
            Cheapest paid plan, shown per month
            {(a.billing_period === "year" || b.billing_period === "year") &&
              " (annual plans divided by 12)"}
            .
          </p>
          <div className="my-auto space-y-6">
            {(
              [
                [a, priceA, colorA],
                [b, priceB, colorB],
              ] as const
            ).map(([software, price, color]) => (
              <div key={software.id} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm text-muted-foreground">{software.name}</p>
                  <p
                    className={cn(
                      "font-heading text-lg font-extrabold tabular-nums tracking-tight",
                      price == null && "text-base font-semibold text-muted-foreground"
                    )}
                  >
                    {price == null
                      ? software.free_version
                        ? "Free plan"
                        : "Custom pricing"
                      : price === 0 && software.free_version
                        ? "Free plan"
                        : `${formatPrice(Math.round(price), software.price_currency)}/mo`}
                  </p>
                </div>
                <div className="h-2.5 overflow-hidden rounded-r-[4px] bg-muted" role="presentation">
                  <div
                    className="animate-fill-bar h-full rounded-r-[4px]"
                    style={{
                      width: `${priceMax > 0 && price != null ? (price / priceMax) * 100 : 0}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          {cheaper && (
            <p className="mt-6 border-t border-zinc-100 pt-4 text-xs leading-relaxed text-muted-foreground dark:border-zinc-800">
              <span className="font-semibold text-foreground">{cheaper}</span>
              {" is the cheaper way in. Lower isn't automatically better — weigh it against the ratings above."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
