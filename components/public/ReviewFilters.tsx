"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { REVIEWER_COUNTRIES } from "@/lib/site";

const ALL = "__all__";

const INDUSTRIES = [
  "Accounting",
  "Agriculture",
  "Construction",
  "Construction & Trades",
  "Financial Services",
  "Food & Beverage",
  "Healthcare",
  "Hospitality",
  "Legal",
  "Logistics",
  "Manufacturing",
  "Media & Marketing",
  "Mining",
  "Nonprofit",
  "Real Estate",
  "Retail",
  "Technology",
  "Travel & Tourism",
  "Wholesale",
];

const COMPANY_SIZES = [
  "1–10 employees",
  "11–50 employees",
  "51–200 employees",
  "201–500 employees",
  "500+ employees",
];

const DURATIONS = ["Less than 6 months", "6–12 months", "1–2 years", "2+ years"];

function FilterSelect({
  param,
  placeholder,
  options,
  value,
  onChange,
}: {
  param: string;
  placeholder: string;
  options: string[];
  value: string;
  onChange: (param: string, value: string) => void;
}) {
  return (
    <Select value={value || ALL} onValueChange={(v) => onChange(param, v === ALL ? "" : v)}>
      <SelectTrigger size="sm" aria-label={placeholder} className="min-w-36">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{placeholder}: all</SelectItem>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ReviewFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParam = React.useCallback(
    (param: string, value: string) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value) next.set(param, value);
      else next.delete(param);
      next.delete("page");
      router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const hasFilters = ["country", "industry", "size", "duration"].some((p) =>
    searchParams.has(p)
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterSelect
        param="country"
        placeholder="Country"
        options={[...REVIEWER_COUNTRIES]}
        value={searchParams.get("country") ?? ""}
        onChange={setParam}
      />
      <FilterSelect
        param="industry"
        placeholder="Industry"
        options={INDUSTRIES}
        value={searchParams.get("industry") ?? ""}
        onChange={setParam}
      />
      <FilterSelect
        param="size"
        placeholder="Company size"
        options={COMPANY_SIZES}
        value={searchParams.get("size") ?? ""}
        onChange={setParam}
      />
      <FilterSelect
        param="duration"
        placeholder="Usage"
        options={DURATIONS}
        value={searchParams.get("duration") ?? ""}
        onChange={setParam}
      />
      <Select
        value={searchParams.get("sort") ?? "helpful"}
        onValueChange={(v) => setParam("sort", v === "helpful" ? "" : v)}
      >
        <SelectTrigger size="sm" aria-label="Sort reviews" className="min-w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="helpful">Most helpful</SelectItem>
          <SelectItem value="recent">Most recent</SelectItem>
        </SelectContent>
      </Select>
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={() => router.replace(pathname)}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
