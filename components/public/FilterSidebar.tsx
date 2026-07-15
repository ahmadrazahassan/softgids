"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Star } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/public/StarRating";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

/** URL-driven directory filters: category, min rating, pricing options. */
export function FilterSidebar({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParams = React.useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      }
      next.delete("page");
      router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const currentCategory = searchParams.get("category") ?? "";
  const currentRating = Number(searchParams.get("rating") ?? 0);
  const hasFilters =
    Boolean(currentCategory) ||
    currentRating > 0 ||
    searchParams.has("trial") ||
    searchParams.has("free") ||
    searchParams.has("paid");

  return (
    <div className="space-y-7 rounded-[1.4rem] border border-zinc-200/70 bg-card p-6 dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-base font-bold">Filters</h2>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => router.replace(pathname)}>
            Clear all
          </Button>
        )}
      </div>

      {/* Category */}
      <fieldset className="space-y-2.5">
        <legend className="mb-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">
          Category
        </legend>
        <button
          type="button"
          onClick={() => setParams({ category: null })}
          className={cn(
            "block w-full rounded-xl px-3 py-2 text-left text-sm transition-colors cursor-pointer",
            !currentCategory
              ? "bg-primary/10 font-semibold text-[var(--color-brand-dark)] dark:text-[var(--color-brand-dark)]"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          All categories
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() =>
              setParams({
                category: currentCategory === category.slug ? null : category.slug,
              })
            }
            className={cn(
              "block w-full rounded-xl px-3 py-2 text-left text-sm transition-colors cursor-pointer",
              currentCategory === category.slug
                ? "bg-primary/10 font-semibold text-[var(--color-brand-dark)] dark:text-[var(--color-brand-dark)]"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            {category.name}
            <span className="float-right tabular-nums">
              {category.software_count.toLocaleString("en-ZA")}
            </span>
          </button>
        ))}
      </fieldset>

      {/* Minimum rating */}
      <fieldset className="space-y-1.5">
        <legend className="mb-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">
          Minimum rating
        </legend>
        {[4.5, 4, 3.5, 3].map((rating) => (
          <button
            key={rating}
            type="button"
            aria-pressed={currentRating === rating}
            onClick={() =>
              setParams({ rating: currentRating === rating ? null : String(rating) })
            }
            className={cn(
              "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors cursor-pointer",
              currentRating === rating
                ? "bg-primary/10 font-semibold"
                : "text-muted-foreground hover:bg-accent"
            )}
          >
            <StarRating rating={rating} size={13} />
            <span>
              {rating.toLocaleString("en-ZA", { minimumFractionDigits: 1 })}
              {" & up"}
            </span>
          </button>
        ))}
      </fieldset>

      {/* Pricing */}
      <fieldset className="space-y-3">
        <legend className="mb-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">
          Pricing
        </legend>
        {(
          [
            { key: "trial", label: "Free trial" },
            { key: "free", label: "Free version" },
            { key: "paid", label: "Paid plans" },
          ] as const
        ).map(({ key, label }) => (
          <label key={key} className="flex cursor-pointer items-center gap-2.5 text-sm">
            <Checkbox
              checked={searchParams.has(key)}
              onCheckedChange={(checked) => setParams({ [key]: checked ? "1" : null })}
            />
            {label}
          </label>
        ))}
      </fieldset>

      <p className="flex items-center gap-1.5 border-t border-zinc-200 pt-4 text-xs text-muted-foreground dark:border-zinc-800">
        <Star className="size-3.5 text-[var(--color-star)]" aria-hidden="true" />
        Ratings come from verified user reviews only.
      </p>
    </div>
  );
}
