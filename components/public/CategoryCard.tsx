import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CategoryIcon } from "@/components/public/CategoryIcon";
import { SoftwareLogo } from "@/components/public/SoftwareLogo";
import { formatNumber } from "@/lib/format";
import type { Category, Software } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Editorial index row for the categories page: an oversized ghost numeral, a
 * background-free line icon, the category name at display scale, and a raw-logo
 * peek at what's inside. No tiles behind the icon.
 */
export function CategoryCard({
  category,
  index,
  topSoftware = [],
  className,
}: {
  category: Category;
  index?: number;
  topSoftware?: Software[];
  className?: string;
}) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className={cn(
        "group grid grid-cols-[1fr_auto] items-center gap-x-5 gap-y-4 border-t border-zinc-200/80 py-7 transition-colors sm:grid-cols-[auto_1fr_auto] sm:gap-8 sm:py-9 dark:border-zinc-800",
        className
      )}
    >
      {/* Numeral + line icon (no background) */}
      <div className="col-span-2 flex items-center gap-4 sm:col-span-1 sm:gap-6">
        {typeof index === "number" && (
          <span className="font-heading text-3xl font-extrabold tabular-nums text-zinc-200 transition-colors group-hover:text-[var(--color-brand-dark)] sm:text-5xl dark:text-zinc-700">
            {String(index).padStart(2, "0")}
          </span>
        )}
        <CategoryIcon
          icon={category.icon}
          className="size-8 shrink-0 text-[var(--color-brand-dark)] transition-transform duration-200 group-hover:-translate-y-0.5 sm:size-10"
        />
      </div>

      {/* Name + description */}
      <div className="min-w-0">
        <h2 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">
          {category.name}
        </h2>
        <p className="mt-1 line-clamp-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {category.description}
        </p>
      </div>

      {/* Logo peek + count + arrow */}
      <div className="col-span-2 flex items-center justify-between gap-5 sm:col-span-1 sm:justify-end">
        {topSoftware.length > 0 && (
          <div className="flex items-center gap-3">
            {topSoftware.slice(0, 4).map((software) => (
              <SoftwareLogo key={software.id} software={software} size={26} />
            ))}
          </div>
        )}
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold tabular-nums whitespace-nowrap text-muted-foreground">
            {formatNumber(category.software_count)}{" "}
            {category.software_count === 1 ? "product" : "products"}
          </span>
          <span className="grid size-9 place-items-center rounded-xl border border-border text-muted-foreground transition-colors duration-200 group-hover:border-transparent group-hover:bg-[var(--color-brand)] group-hover:text-[var(--color-brand-ink)]">
            <ArrowUpRight className="size-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
