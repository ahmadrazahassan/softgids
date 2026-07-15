import type { Metadata } from "next";
import Link from "next/link";
import {
  Ban,
  Check,
  CircleDollarSign,
  Handshake,
  MousePointerClick,
  ShieldCheck,
} from "lucide-react";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { siteUrl } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Affiliate Disclosure",
  description:
    "How SoftGids makes money, and why commissions never influence our ratings or rankings.",
  alternates: { canonical: `${siteUrl}/affiliate-disclosure` },
};

/** The firewall — what money can and cannot reach. */
const MONEY_CAN = [
  "Fund the analysts, moderation and research behind the platform",
  "Keep every review, comparison and guide free for readers",
  "Pay for the verification work that keeps ratings trustworthy",
];

const MONEY_CANNOT = [
  "Change a star rating, which is computed from verified reviews",
  "Move a product up or down any ranking or comparison",
  "Soften a verdict, hide a weakness or remove a negative review",
  "Decide which products we cover or how we describe them",
];

/** Plain-English walkthrough of how a commission happens. */
const HOW_IT_WORKS = [
  {
    title: "You research for free",
    text: "Every review, rating, comparison and guide on SoftGids is free to read. No paywall, no account required.",
  },
  {
    title: "You click through to a vendor",
    text: "Some buttons and links that take you to a vendor's site are affiliate links. They are the same links you could find yourself, with a tracking reference added.",
  },
  {
    title: "The vendor may pay us",
    text: "If you go on to buy or subscribe, the vendor may pay us a commission. It comes out of their marketing budget, never out of your price.",
  },
  {
    title: "The verdict stays untouched",
    text: "The analysts who write assessments never see which vendors pay or how much. Commercial terms live on the other side of a wall they cannot look over.",
  },
];

export default function AffiliateDisclosurePage() {
  return (
    <div className="container-site space-y-16 py-10">
      <Breadcrumbs items={[{ name: "Affiliate disclosure" }]} />

      {/* ---------- Header ---------- */}
      <header className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
        <p className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground/80">
          <Handshake className="size-4 text-muted-foreground" aria-hidden="true" />
          Affiliate disclosure
        </p>
        <h1 className="font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl sm:leading-[1.1]">
          How we make money,{" "}
          <span className="rounded-2xl bg-[var(--color-brand)] px-3 py-0.5 whitespace-nowrap text-[var(--color-brand-ink)]">
            in plain English
          </span>
        </h1>
        <p className="text-lg leading-relaxed text-pretty text-muted-foreground">
          SoftGids is free because some vendors pay us a commission when readers click
          through and buy. Here is exactly how that works, and the wall that keeps it away from
          our verdicts.
        </p>
      </header>

      <div className="mx-auto max-w-4xl space-y-20">
        {/* ---------- How it works ---------- */}
        <section aria-labelledby="how-h" className="space-y-6">
          <div className="mx-auto flex max-w-xl flex-col items-center gap-5 pb-2 text-center">
            <p className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground/80">
              <MousePointerClick className="size-4 text-muted-foreground" aria-hidden="true" />
              How it works
            </p>
            <h2
              id="how-h"
              className="font-heading text-3xl font-medium tracking-tight text-balance sm:text-[2.6rem] sm:leading-[1.18]"
            >
              From click to commission,{" "}
              <span className="rounded-2xl bg-[var(--color-brand)] px-3 py-0.5 whitespace-nowrap text-[var(--color-brand-ink)]">
                step by step
              </span>
            </h2>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-zinc-200 dark:border-zinc-800">
            {HOW_IT_WORKS.map(({ title, text }, i) => (
              <article
                key={title}
                className="grid gap-4 bg-card p-7 sm:grid-cols-[auto_1fr] sm:gap-7 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-zinc-200 dark:[&:not(:first-child)]:border-zinc-800"
              >
                <span className="font-heading text-3xl font-bold tabular-nums text-zinc-300 dark:text-zinc-700">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="space-y-1.5">
                  <h3 className="font-heading text-lg font-bold">{title}</h3>
                  <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {text}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
            You never pay more by using our links. Vendors pay the commission from their own
            marketing budgets, and prices are identical either way.
          </p>
        </section>

        {/* ---------- The firewall ---------- */}
        <section aria-labelledby="firewall-h" className="space-y-6">
          <div className="mx-auto flex max-w-xl flex-col items-center gap-5 pb-2 text-center">
            <p className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground/80">
              <ShieldCheck className="size-4 text-muted-foreground" aria-hidden="true" />
              The firewall
            </p>
            <h2
              id="firewall-h"
              className="font-heading text-3xl font-medium tracking-tight text-balance sm:text-[2.6rem] sm:leading-[1.18]"
            >
              What commissions can and{" "}
              <span className="rounded-2xl bg-[var(--color-brand)] px-3 py-0.5 whitespace-nowrap text-[var(--color-brand-ink)]">
                cannot touch
              </span>
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-4 rounded-[2rem] border border-zinc-200 bg-card p-7 sm:p-8 dark:border-zinc-800">
              <h3 className="flex items-center gap-2 font-heading text-lg font-bold">
                <CircleDollarSign
                  className="size-5 text-[var(--color-brand-dark)]"
                  aria-hidden="true"
                />
                Commissions do
              </h3>
              <ul className="space-y-3">
                {MONEY_CAN.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed">
                    <Check
                      className="mt-0.5 size-4.5 shrink-0 text-[var(--color-brand-dark)]"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4 rounded-[2rem] border border-zinc-200 bg-card p-7 sm:p-8 dark:border-zinc-800">
              <h3 className="flex items-center gap-2 font-heading text-lg font-bold">
                <Ban className="size-5 text-[var(--color-error)]" aria-hidden="true" />
                Commissions never
              </h3>
              <ul className="space-y-3">
                {MONEY_CANNOT.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed">
                    <Ban
                      className="mt-0.5 size-4.5 shrink-0 text-[var(--color-error)]"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="prose-content mx-auto max-w-3xl space-y-4 pt-2">
            <p className="leading-relaxed text-foreground/85">
              The mechanics make manipulation impossible rather than merely discouraged. Star
              ratings are computed automatically from verified user reviews, so there is no
              editorial rating for money to influence. Rankings follow from those computed
              scores. And the analysts who write our assessments never see commercial terms,
              which vendors pay, or how much.
            </p>
            <p className="leading-relaxed text-foreground/85">
              Plenty of products we recommend pay us nothing at all. Where a page contains
              affiliate links, the buttons behave identically whether a commission exists or
              not, and a product without an affiliate programme is listed, rated and ranked on
              exactly the same terms as one with.
            </p>
          </div>
        </section>

        {/* ---------- Related reading ---------- */}
        <section aria-label="Related reading" className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/editorial-policy"
            className="card-modern card-modern-hover group flex flex-col gap-2 p-6"
          >
            <h3 className="font-heading text-base font-bold">Editorial policy</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              How reviews are verified, how scores are computed, and the rules vendors play by.
            </p>
            <span className="mt-auto pt-3 text-sm font-semibold text-[var(--color-brand-dark)] group-hover:underline">
              Read the policy
            </span>
          </Link>
          <Link
            href="/contact"
            className="card-modern card-modern-hover group flex flex-col gap-2 p-6"
          >
            <h3 className="font-heading text-base font-bold">Questions about a link?</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Ask us directly. We will tell you plainly whether a relationship exists with any
              vendor on the platform.
            </p>
            <span className="mt-auto pt-3 text-sm font-semibold text-[var(--color-brand-dark)] group-hover:underline">
              Contact us
            </span>
          </Link>
        </section>
      </div>
    </div>
  );
}
