import Image from "next/image";
import { Plus } from "lucide-react";
import { integrationLogo } from "@/lib/integrationLogos";
import type { Software } from "@/lib/types";

/** Splits a list into two balanced columns so hairline dividers stay clean. */
function splitColumns(items: string[]): [string[], string[]] {
  const mid = Math.ceil(items.length / 2);
  return [items.slice(0, mid), items.slice(mid)];
}

/**
 * Features block in the reference language: a grey backplate holding
 * editorial top-feature cards (ghost numerals, no tinted tiles), a
 * two-column hairline ledger of every feature, and an integrations card.
 */
export function FeaturesSection({ software }: { software: Software }) {
  const [left, right] = splitColumns(software.features);

  return (
    <div className="space-y-2 rounded-[1.75rem] bg-zinc-100/80 p-2 dark:bg-zinc-900/60">
      {/* Headline features — editorial cards with ghost numerals */}
      {software.top_features.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {software.top_features.map((feature, index) => (
            <div
              key={feature}
              className="flex items-center gap-5 rounded-[1.4rem] border border-zinc-200/70 bg-card px-6 py-6 sm:px-7 dark:border-zinc-800"
            >
              <span
                aria-hidden="true"
                className="font-heading text-3xl font-extrabold tabular-nums text-zinc-200 dark:text-zinc-700"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="font-heading text-base font-medium tracking-tight sm:text-lg">
                {feature}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Full feature ledger — two hairline columns */}
      {software.features.length > 0 && (
        <div className="rounded-[1.4rem] border border-zinc-200/70 bg-card px-6 py-3 sm:px-7 dark:border-zinc-800">
          <div className="grid sm:grid-cols-2 sm:gap-x-12">
            {[left, right].map((column, columnIndex) => (
              <ul
                key={columnIndex}
                className="divide-y divide-zinc-100 dark:divide-zinc-800"
              >
                {column.map((feature) => (
                  <li key={feature} className="flex items-center gap-3.5 py-3.5 text-sm">
                    <Plus
                      className="size-4 shrink-0 text-zinc-400 dark:text-zinc-500"
                      aria-hidden="true"
                    />
                    <span className="text-foreground/80">{feature}</span>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      )}

      {/* Integrations */}
      {software.integrations.length > 0 && (
        <div className="space-y-5 rounded-[1.4rem] border border-zinc-200/70 bg-card px-6 py-7 sm:px-7 dark:border-zinc-800">
          <div className="space-y-1.5">
            <h3 className="font-heading text-xl font-medium tracking-tight sm:text-2xl">
              Works with the tools you already use
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Integrations the vendor lists for {software.name}. Check the fine print for plan
              limits before you rely on one.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {software.integrations.map((integration) => {
              const logo = integrationLogo(integration);
              return (
                <span
                  key={integration}
                  className="inline-flex items-center gap-2.5 rounded-xl border border-zinc-200/80 bg-card px-3.5 py-2 text-sm font-medium transition-colors hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                >
                  {logo ? (
                    <Image
                      src={logo}
                      alt=""
                      width={18}
                      height={18}
                      className="size-[18px] rounded-[4px] object-contain"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="size-1.5 rounded-full bg-[var(--color-brand)]"
                    />
                  )}
                  {integration}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
