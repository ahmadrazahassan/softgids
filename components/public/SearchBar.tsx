import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

/** GET form targeting /search — works without JavaScript. */
export function SearchBar({
  placeholder = "Search accounting, payroll, CRM software…",
  defaultValue,
  className,
  autoFocus,
}: {
  placeholder?: string;
  defaultValue?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  return (
    <form action="/search" role="search" className={cn("relative w-full", className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        autoFocus={autoFocus}
        aria-label="Search software and articles"
        className="h-16 w-full rounded-2xl border border-zinc-200 bg-white pr-32 pl-12 text-base text-zinc-900 shadow-[0_18px_40px_-18px_rgba(15,23,42,0.35)] outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 [&::-webkit-search-cancel-button]:appearance-none"
      />
      <button
        type="submit"
        className="btn-glossy absolute top-1/2 right-2.5 flex h-11 -translate-y-1/2 items-center px-6 text-sm"
      >
        Search
      </button>
    </form>
  );
}
