import { ArrowRight, Check, Plus } from "lucide-react";
import { AdLabel } from "@/components/public/AdLabel";
import { AffiliateLink } from "@/components/public/AffiliateLink";
import { outboundLink, type AffiliateTarget, type OutboundLink } from "@/lib/affiliate";
import { formatPrice } from "@/lib/format";
import type { PricingPlan } from "@/lib/types";
import { cn } from "@/lib/utils";

function planPrice(plan: PricingPlan, currency: string): string {
  if (plan.price_label) return plan.price_label;
  if (plan.price == null) return "Custom";
  if (plan.price === 0) return "Free";
  return formatPrice(plan.price, plan.currency ?? currency);
}

/** "user/month" → "per user, per month"; "month" → "per month". */
function planPeriod(plan: PricingPlan): string {
  if (plan.price == null && !plan.price_label) return "pricing on request";
  if (plan.price === 0 || plan.price_label) return "no card needed";
  const period = plan.period ?? "month";
  return `per ${period.split("/").join(", per ")}`;
}

function ctaLabel(plan: PricingPlan, freeTrial?: boolean): string {
  if (plan.price == null && !plan.price_label) return "Talk to sales";
  if (freeTrial) return "Try it free";
  return "Get started";
}

/** Inheritance rows ("Everything in Standard") get a check, additions get a plus. */
function FeatureIcon({ feature }: { feature: string }) {
  if (/^everything in/i.test(feature)) {
    return <Check className="size-4 shrink-0 text-zinc-500 dark:text-zinc-400" aria-hidden="true" />;
  }
  return <Plus className="size-4 shrink-0 text-zinc-400 dark:text-zinc-500" aria-hidden="true" />;
}

/**
 * Plan CTA — full-width bar with the arrow chip docked on the left. On hover
 * the chip slides across to the right end; the featured plan flips from dark
 * to lime with a dark ring, exactly like the reference hover state.
 */
function PlanCTA({
  link,
  action,
  slug,
  label,
  featured,
}: {
  link: OutboundLink;
  action: string;
  slug?: string | null;
  label: string;
  featured?: boolean;
}) {
  return (
    <AffiliateLink
      link={link}
      action={action}
      slug={slug}
      className={cn(
        "group/cta relative flex h-12 w-full items-center overflow-hidden",
        featured ? "btn-glossy btn-glossy-dark" : "btn-glossy btn-glossy-white"
      )}
    >
      {/* Arrow chip — slides from the left edge to the right on hover */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-y-1.5 left-1.5 grid w-10 place-items-center rounded-[0.55rem]",
          "transition-[left,background-color,color,border-color] duration-300 ease-out group-hover/cta:left-[calc(100%-2.875rem)]",
          featured
            ? "bg-[var(--color-brand)] text-[var(--color-brand-ink)] group-hover/cta:bg-transparent"
            : "border border-zinc-200/80 bg-white text-zinc-500 group-hover/cta:border-transparent group-hover/cta:bg-transparent group-hover/cta:text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-300 dark:group-hover/cta:text-zinc-100"
        )}
      >
        <ArrowRight className="size-4" />
      </span>
      <span className="w-full px-12 text-center text-sm font-semibold">{label}</span>
    </AffiliateLink>
  );
}

/**
 * Pricing block modelled on the reference composition: white plan cards
 * sitting on a shared soft-grey backplate, uniform hairline borders, the
 * featured plan signalled purely by its dark CTA, a ledger-style feature
 * list, and a vendor band closing the plate.
 */
export function PricingCards({
  plans,
  currency,
  software,
  slotPrefix,
  freeTrial,
  vendorName,
}: {
  plans: PricingPlan[];
  currency: string;
  /**
   * The product these plans belong to. Supplying it renders the plan CTAs and
   * the vendor band as outbound links, resolved through lib/affiliate.ts.
   */
  software?: AffiliateTarget & { name?: string | null };
  /**
   * Prefix for the placement IDs, naming where this block sits — e.g.
   * "software-pricing" gives "software-pricing-plan-<slug>" on the plan CTAs
   * and "software-pricing-band-<slug>" on the closing band, so Impact
   * reporting tells the two apart.
   */
  slotPrefix?: string;
  freeTrial?: boolean;
  vendorName?: string | null;
}) {
  if (plans.length === 0) return null;

  const prefix = slotPrefix ?? "pricing";
  const planLink = software ? outboundLink(software, `${prefix}-plan`) : null;
  const bandLink = software ? outboundLink(software, `${prefix}-band`) : null;
  const vendor = vendorName ?? software?.name ?? "vendor";

  return (
    <div className="rounded-[1.75rem] bg-zinc-100/80 p-2 dark:bg-zinc-900/60">
      {/* Plan cards */}
      <div
        className={cn(
          "grid gap-2",
          plans.length === 1
            ? "max-w-md"
            : plans.length === 2
              ? "sm:grid-cols-2"
              : "sm:grid-cols-2 lg:grid-cols-3"
        )}
      >
        {plans.map((plan) => (
          <article
            key={plan.name}
            className="flex flex-col rounded-[1.4rem] border border-zinc-200/70 bg-card p-7 dark:border-zinc-800"
          >
            {/* Name + description */}
            <header className="min-h-[5.5rem] space-y-2">
              <h3 className="font-heading text-lg font-semibold tracking-tight">{plan.name}</h3>
              {plan.description && (
                <p className="max-w-[16rem] text-sm leading-relaxed text-muted-foreground">
                  {plan.description}
                </p>
              )}
            </header>

            {/* Price — the "/mo" belongs to the number, one piece */}
            <div className="pt-4 pb-8">
              <p className="font-heading text-[2.6rem] leading-none font-bold tabular-nums tracking-tight">
                {planPrice(plan, currency)}
                {plan.price != null && plan.price > 0 && !plan.price_label && (
                  <span>/mo</span>
                )}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">{planPeriod(plan)}</p>
            </div>

            {planLink && (
              <>
                <PlanCTA
                  link={planLink}
                  action={`${ctaLabel(plan, freeTrial)} with ${vendor}, ${plan.name} plan`}
                  slug={software?.slug}
                  label={ctaLabel(plan, freeTrial)}
                  featured={plan.highlighted}
                />
                {planLink.kind === "affiliate" && (
                  <AdLabel className="mt-1.5 block text-center" />
                )}
              </>
            )}

            {/* Feature ledger — hairlines between rows, + adds, ✓ inherits */}
            {plan.features && plan.features.length > 0 && (
              <ul className="mt-4 divide-y divide-zinc-100 text-sm dark:divide-zinc-800">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3.5 py-3.5">
                    <FeatureIcon feature={feature} />
                    <span className="text-foreground/80">{feature}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>

      {/* Vendor band — lives on the backplate itself, like the reference */}
      {bandLink && (
        <div className="flex flex-col gap-6 px-6 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div className="max-w-lg space-y-2">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200/90 bg-card px-3 py-1 text-[0.65rem] font-bold tracking-widest text-muted-foreground uppercase dark:border-zinc-700">
              Straight from the vendor
            </p>
            <h3 className="font-heading text-2xl font-bold tracking-tight">Get current pricing</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              These are list prices in rand and vendors adjust them from time to time. Check with{" "}
              {vendor}{" "}for the figure you&apos;ll actually pay.
            </p>
          </div>
          <span className="flex shrink-0 flex-col items-center gap-1.5">
            <AffiliateLink
              link={bandLink}
              action={`Visit ${vendor}`}
              slug={software?.slug}
              className="btn-glossy btn-glossy-dark group/cta relative inline-flex h-12 shrink-0 items-center overflow-hidden px-14 text-sm"
            >
              <span
                aria-hidden="true"
                className="absolute inset-y-1.5 left-1.5 grid w-10 place-items-center rounded-[0.55rem] bg-[var(--color-brand)] text-[var(--color-brand-ink)] transition-[left,background-color] duration-300 ease-out group-hover/cta:left-[calc(100%-2.875rem)] group-hover/cta:bg-transparent"
              >
                <ArrowRight className="size-4" />
              </span>
              Visit {vendor}
            </AffiliateLink>
            {bandLink.kind === "affiliate" && <AdLabel />}
          </span>
        </div>
      )}
    </div>
  );
}
