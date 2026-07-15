"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DirectorySort() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <Select
      value={searchParams.get("sort") ?? "reviews"}
      onValueChange={(value) => {
        const next = new URLSearchParams(searchParams.toString());
        if (value === "reviews") next.delete("sort");
        else next.set("sort", value);
        next.delete("page");
        router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
      }}
    >
      <SelectTrigger size="sm" aria-label="Sort software" className="min-w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="reviews">Most reviewed</SelectItem>
        <SelectItem value="rating">Highest rated</SelectItem>
        <SelectItem value="recent">Recently updated</SelectItem>
      </SelectContent>
    </Select>
  );
}
