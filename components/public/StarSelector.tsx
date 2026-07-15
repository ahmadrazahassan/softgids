"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Interactive per-dimension star picker used in review forms. */
export function StarSelector({
  name,
  label,
  required = false,
  defaultValue = 0,
}: {
  name: string;
  label: string;
  required?: boolean;
  defaultValue?: number;
}) {
  const [value, setValue] = React.useState(defaultValue);
  const [hovered, setHovered] = React.useState(0);

  return (
    <fieldset className="flex items-center justify-between gap-4">
      <legend className="sr-only">{label}</legend>
      <span className="text-sm text-muted-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </span>
      <div
        className="flex items-center gap-0.5"
        onMouseLeave={() => setHovered(0)}
        role="radiogroup"
        aria-label={label}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const active = star <= (hovered || value);
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={value === star}
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
              onMouseEnter={() => setHovered(star)}
              onFocus={() => setHovered(star)}
              onBlur={() => setHovered(0)}
              onClick={() => setValue(star === value && !required ? 0 : star)}
              className="rounded-md p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            >
              <Star
                className={cn(
                  "size-6 transition-colors",
                  active
                    ? "fill-[var(--color-star)] text-[var(--color-star)]"
                    : "text-zinc-300 dark:text-zinc-600"
                )}
              />
            </button>
          );
        })}
      </div>
      <input type="hidden" name={name} value={value || ""} />
    </fieldset>
  );
}
