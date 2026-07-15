import { Check, Minus } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { PricingPlan } from "@/lib/types";
import { cn } from "@/lib/utils";

function planPriceLabel(plan: PricingPlan, currency: string): string {
  if (plan.price_label) return plan.price_label;
  if (plan.price == null) return "Custom";
  if (plan.price === 0) return "Free";
  const period = (plan.period ?? "month") === "month" ? "mo" : plan.period;
  return `${formatPrice(plan.price, plan.currency ?? currency)}/${period}`;
}

/**
 * Plan-by-plan feature matrix in the reference language: a white card on the
 * grey backplate, hairline rows, lime check chips for included features and a
 * softly tinted column for the featured plan.
 */
export function PricingTable({
  plans,
  currency,
}: {
  plans: PricingPlan[];
  currency: string;
}) {
  if (plans.length < 2) return null;

  const allFeatures = [...new Set(plans.flatMap((plan) => plan.features ?? []))];
  if (allFeatures.length === 0) return null;

  return (
    <div className="rounded-[1.75rem] bg-zinc-100/80 p-2 dark:bg-zinc-900/60">
      <div className="overflow-x-auto rounded-[1.4rem] border border-zinc-200/70 bg-card dark:border-zinc-800">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-zinc-800">
              <th className="min-w-44 px-6 py-5 text-left align-bottom sm:px-7">
                <span className="text-[0.65rem] font-bold tracking-widest text-muted-foreground uppercase">
                  Plan features
                </span>
              </th>
              {plans.map((plan) => (
                <th
                  key={plan.name}
                  className={cn(
                    "min-w-32 px-4 py-5 text-center align-bottom",
                    plan.highlighted && "bg-zinc-50 dark:bg-zinc-800/40"
                  )}
                >
                  <span className="block font-heading text-base font-semibold tracking-tight">
                    {plan.name}
                  </span>
                  <span className="mt-0.5 block text-xs font-normal text-muted-foreground tabular-nums">
                    {planPriceLabel(plan, currency)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {allFeatures.map((feature) => (
              <tr key={feature}>
                <td className="px-6 py-3.5 text-foreground/80 sm:px-7">{feature}</td>
                {plans.map((plan) => (
                  <td
                    key={plan.name}
                    className={cn(
                      "px-4 py-3.5 text-center",
                      plan.highlighted && "bg-zinc-50 dark:bg-zinc-800/40"
                    )}
                  >
                    {(plan.features ?? []).includes(feature) ? (
                      <span className="inline-grid size-6 place-items-center rounded-md bg-[var(--color-brand)]">
                        <Check
                          className="size-3.5 text-[var(--color-brand-ink)]"
                          aria-label="Included"
                        />
                      </span>
                    ) : (
                      <Minus
                        className="inline size-4 text-zinc-300 dark:text-zinc-600"
                        aria-label="Not included"
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
