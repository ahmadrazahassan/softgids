import Link from "next/link";
import { ArrowLeftRight, ArrowRight } from "lucide-react";
import { ComparisonCard } from "@/components/public/ComparisonCard";
import type { Comparison } from "@/lib/types";

/** Trending head-to-heads strip on the home page. */
export function HomepageCompare({ comparisons }: { comparisons: Comparison[] }) {
  /* "The match-ups buyers research most" — lead with the pairings whose two
     products carry the most verified reviews, not whichever was inserted last. */
  const reviewWeight = (c: Comparison) =>
    (c.software_a?.review_count ?? 0) + (c.software_b?.review_count ?? 0);
  const usable = comparisons
    .filter((c) => c.software_a && c.software_b)
    .sort((a, b) => reviewWeight(b) - reviewWeight(a))
    .slice(0, 3);
  if (usable.length === 0) return null;

  return (
    <section aria-labelledby="compare-heading" className="container-site space-y-6">
      <div className="reveal-on-scroll mx-auto flex max-w-xl flex-col items-center gap-5 pb-2 text-center">
        <p className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground/80">
          <ArrowLeftRight className="size-4 text-muted-foreground" aria-hidden="true" />
          Head to head
        </p>
        <h2
          id="compare-heading"
          className="font-heading text-3xl font-medium tracking-tight text-balance sm:text-[2.6rem] sm:leading-[1.18]"
        >
          Popular comparisons,{" "}
          <span className="rounded-2xl bg-[var(--color-brand)] px-3 py-0.5 whitespace-nowrap text-[var(--color-brand-ink)]">
            side by side
          </span>
        </h2>
        <p className="text-base leading-relaxed text-muted-foreground">
          The match-ups South African buyers research most, with ratings, pricing in rand, and a
          clear verdict.
        </p>
      </div>
      <div className="reveal-on-scroll rounded-[1.75rem] bg-zinc-100/80 p-2 dark:bg-zinc-900/60">
        <div className="grid gap-2 md:grid-cols-3">
          {usable.map((comparison) => (
            <ComparisonCard
              key={comparison.id}
              a={comparison.software_a!}
              b={comparison.software_b!}
              className="rounded-[1.4rem] border-zinc-200/70"
            />
          ))}
        </div>
      </div>
      <div className="text-center">
        <Link
          href="/compare"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-brand-dark)] hover:underline"
        >
          All comparisons <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
