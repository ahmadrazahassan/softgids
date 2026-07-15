import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function pageHref(basePath: string, params: Record<string, string>, page: number): string {
  const search = new URLSearchParams(params);
  if (page <= 1) search.delete("page");
  else search.set("page", String(page));
  const qs = search.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function pageWindow(current: number, total: number): Array<number | "…"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, 2, total - 1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: Array<number | "…"> = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
}

export function Pagination({
  currentPage,
  totalPages,
  basePath,
  searchParams = {},
  className,
}: {
  currentPage: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string>;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  const linkClasses =
    "grid size-9 place-items-center rounded-xl border border-border text-sm transition-colors hover:bg-accent";

  return (
    <nav aria-label="Pagination" className={cn("flex items-center justify-center gap-1.5", className)}>
      {currentPage > 1 ? (
        <Link
          href={pageHref(basePath, searchParams, currentPage - 1)}
          className={linkClasses}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </Link>
      ) : (
        <span className={cn(linkClasses, "pointer-events-none opacity-40")} aria-hidden="true">
          <ChevronLeft className="size-4" />
        </span>
      )}

      {pageWindow(currentPage, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-1.5 text-sm text-muted-foreground">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={pageHref(basePath, searchParams, p)}
            aria-current={p === currentPage ? "page" : undefined}
            className={cn(
              linkClasses,
              "tabular-nums",
              p === currentPage &&
                "border-transparent bg-primary text-primary-foreground pointer-events-none"
            )}
          >
            {p.toLocaleString("en-ZA")}
          </Link>
        )
      )}

      {currentPage < totalPages ? (
        <Link
          href={pageHref(basePath, searchParams, currentPage + 1)}
          className={linkClasses}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span className={cn(linkClasses, "pointer-events-none opacity-40")} aria-hidden="true">
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
