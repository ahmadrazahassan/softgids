"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Repeat } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export interface CompareOption {
  name: string;
  slug: string;
  category: string | null;
}

/** Build-your-own comparison: pick two products, jump to /compare/a-vs-b. */
export function CompareSelector({
  options,
  initialA,
  initialB,
}: {
  options: CompareOption[];
  initialA?: string;
  initialB?: string;
}) {
  const router = useRouter();
  const [a, setA] = React.useState(initialA ?? "");
  const [b, setB] = React.useState(initialB ?? "");

  const grouped = React.useMemo(() => {
    const map = new Map<string, CompareOption[]>();
    for (const option of options) {
      const key = option.category ?? "Other";
      map.set(key, [...(map.get(key) ?? []), option]);
    }
    return [...map.entries()];
  }, [options]);

  const renderSelect = (
    value: string,
    onChange: (v: string) => void,
    exclude: string,
    label: string
  ) => (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="h-12 w-full rounded-2xl">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        {grouped.map(([category, items]) => (
          <SelectGroup key={category}>
            <SelectLabel>{category}</SelectLabel>
            {items.map((option) => (
              <SelectItem
                key={option.slug}
                value={option.slug}
                disabled={option.slug === exclude}
              >
                {option.name}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
      <div className="flex-1">{renderSelect(a, setA, b, "Choose first product")}</div>
      <span className="grid size-10 shrink-0 place-items-center self-center rounded-full bg-[var(--color-navy)] font-heading text-xs font-bold text-white dark:bg-secondary">
        VS
      </span>
      <div className="flex-1">{renderSelect(b, setB, a, "Choose second product")}</div>
      <Button
        size="lg"
        disabled={!a || !b || a === b}
        onClick={() => router.push(`/compare/${a}-vs-${b}`)}
      >
        Compare <ArrowRight className="size-4" />
      </Button>
      {a && b && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Swap products"
          onClick={() => {
            setA(b);
            setB(a);
          }}
        >
          <Repeat className="size-4" />
        </Button>
      )}
    </div>
  );
}
