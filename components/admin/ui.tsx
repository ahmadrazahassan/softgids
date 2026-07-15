import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/** Page header with an optional "new" action. */
export function AdminHeader({
  title,
  count,
  newHref,
}: {
  title: string;
  count?: number;
  newHref?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="font-heading text-2xl font-medium tracking-tight">
        {title}
        {typeof count === "number" && (
          <span className="ml-2 text-base text-muted-foreground">({count})</span>
        )}
      </h1>
      {newHref && (
        <Link href={newHref} className="btn-glossy inline-flex items-center gap-1.5 px-4 py-2 text-sm">
          <Plus className="size-4" /> New
        </Link>
      )}
    </div>
  );
}

/** Simple data table shell. */
export function AdminTable({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-[1.4rem] border border-zinc-200/70 bg-card dark:border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-100 bg-muted/50 text-left dark:border-zinc-800">
            {headers.map((header) => (
              <th
                key={header}
                className="px-4 py-3 text-[0.65rem] font-bold tracking-widest text-muted-foreground uppercase"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">{children}</tbody>
      </table>
    </div>
  );
}

export function StatusPill({ value }: { value: string }) {
  const positive = value === "published" || value === "confirmed";
  const negative = value === "hidden" || value === "unsubscribed";
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
        positive &&
          "bg-[var(--color-brand-light)] text-[var(--color-brand-dark)] dark:bg-[color-mix(in_srgb,var(--color-brand)_16%,transparent)]",
        negative && "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
        !positive && !negative && "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
      )}
    >
      {value}
    </span>
  );
}
