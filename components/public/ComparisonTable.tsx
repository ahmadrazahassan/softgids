import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StarRating } from "@/components/public/StarRating";
import { formatNumber, formatPricePerPeriod, formatRating } from "@/lib/format";
import type { Software } from "@/lib/types";
import { cn } from "@/lib/utils";

function winner(aValue: number, bValue: number): "a" | "b" | null {
  if (aValue === bValue) return null;
  return aValue > bValue ? "a" : "b";
}

/** Head-to-head ratings & facts table with winner highlighting. */
export function ComparisonTable({ a, b }: { a: Software; b: Software }) {
  const rows: Array<{
    label: string;
    aDisplay: React.ReactNode;
    bDisplay: React.ReactNode;
    win: "a" | "b" | null;
  }> = [
    {
      label: "Overall rating",
      aDisplay: (
        <span className="inline-flex items-center gap-2">
          <span className="font-semibold tabular-nums">{formatRating(a.overall_rating)}</span>
          <StarRating rating={a.overall_rating} size={13} />
        </span>
      ),
      bDisplay: (
        <span className="inline-flex items-center gap-2">
          <span className="font-semibold tabular-nums">{formatRating(b.overall_rating)}</span>
          <StarRating rating={b.overall_rating} size={13} />
        </span>
      ),
      win: winner(a.overall_rating, b.overall_rating),
    },
    {
      label: "Reviews",
      aDisplay: formatNumber(a.review_count),
      bDisplay: formatNumber(b.review_count),
      win: winner(a.review_count, b.review_count),
    },
    {
      label: "Ease of use",
      aDisplay: formatRating(a.ease_of_use_rating),
      bDisplay: formatRating(b.ease_of_use_rating),
      win: winner(a.ease_of_use_rating, b.ease_of_use_rating),
    },
    {
      label: "Value for money",
      aDisplay: formatRating(a.value_for_money_rating),
      bDisplay: formatRating(b.value_for_money_rating),
      win: winner(a.value_for_money_rating, b.value_for_money_rating),
    },
    {
      label: "Customer service",
      aDisplay: formatRating(a.customer_service_rating),
      bDisplay: formatRating(b.customer_service_rating),
      win: winner(a.customer_service_rating, b.customer_service_rating),
    },
    {
      label: "Functionality",
      aDisplay: formatRating(a.functionality_rating),
      bDisplay: formatRating(b.functionality_rating),
      win: winner(a.functionality_rating, b.functionality_rating),
    },
    {
      label: "Starting price",
      aDisplay:
        a.free_version && (a.starting_price ?? 0) === 0
          ? "Free plan"
          : formatPricePerPeriod(a.starting_price, a.price_currency, a.billing_period),
      bDisplay:
        b.free_version && (b.starting_price ?? 0) === 0
          ? "Free plan"
          : formatPricePerPeriod(b.starting_price, b.price_currency, b.billing_period),
      win: null,
    },
    {
      label: "Free trial",
      aDisplay: a.free_trial ? "Yes" : "No",
      bDisplay: b.free_trial ? "Yes" : "No",
      win: null,
    },
  ];

  const winCell = "font-semibold text-[var(--color-brand-dark)] dark:text-[var(--color-brand-dark)]";

  return (
    <div className="overflow-hidden rounded-[1.4rem] border border-zinc-200/70 bg-card dark:border-zinc-800">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/60">
            <TableHead className="min-w-40" />
            <TableHead className="font-heading font-bold text-foreground">{a.name}</TableHead>
            <TableHead className="font-heading font-bold text-foreground">{b.name}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.label}>
              <TableCell className="text-sm text-muted-foreground">{row.label}</TableCell>
              <TableCell className={cn("text-sm", row.win === "a" && winCell)}>
                {row.aDisplay}
              </TableCell>
              <TableCell className={cn("text-sm", row.win === "b" && winCell)}>
                {row.bDisplay}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
