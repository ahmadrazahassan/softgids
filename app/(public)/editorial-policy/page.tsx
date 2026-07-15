import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  Ban,
  Check,
  FileSearch,
  MessageCircle,
  RefreshCw,
  Scale,
  Star,
} from "lucide-react";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { ProfileNav } from "@/components/public/ProfileNav";
import { CONTACT_EMAIL, siteUrl } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Editorial Policy",
  description:
    "How SoftGids researches, reviews and maintains its software assessments for the South African market.",
  alternates: { canonical: `${siteUrl}/editorial-policy` },
};

const SECTIONS = [
  { id: "ratings", label: "Ratings" },
  { id: "research", label: "Research" },
  { id: "vendors", label: "Vendors" },
  { id: "corrections", label: "Corrections" },
];

/** Rules of engagement — what vendors can and cannot do. */
const VENDOR_CAN = [
  "Claim and update their product listing with factual corrections",
  "Submit current ZAR pricing, plans and feature lists for verification",
  "Respond publicly to user reviews of their product",
  "Report a review they believe breaches our guidelines",
];

const VENDOR_CANNOT = [
  "Pay to change a rating, ranking or verdict",
  "Pay to remove or bury a negative review",
  "Preview, edit or approve our assessments before publication",
  "Buy placement that is not clearly labelled as such",
];

/** How a review earns the verified badge. */
const VERIFICATION_STEPS = [
  {
    title: "Identity check",
    text: "Every reviewer confirms a working email address before anything is published. Disposable and role free addresses are rejected.",
  },
  {
    title: "Usage screening",
    text: "Reviews must describe first hand, current or recent use of the product in a real business. Vague or promotional submissions are declined.",
  },
  {
    title: "Guideline review",
    text: "A human moderator checks each submission against our guidelines before it goes live. We publish critical reviews as readily as glowing ones.",
  },
  {
    title: "Ongoing monitoring",
    text: "Patterns that suggest coordinated or incentivised reviewing trigger reinvestigation, and confirmed manipulation is removed and disclosed.",
  },
];

export default function EditorialPolicyPage() {
  return (
    <div className="container-site space-y-10 py-10">
      <Breadcrumbs items={[{ name: "Editorial policy" }]} />

      {/* ---------- Header ---------- */}
      <header className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
        <p className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground/80">
          <Scale className="size-4 text-muted-foreground" aria-hidden="true" />
          Editorial policy
        </p>
        <h1 className="font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl sm:leading-[1.1]">
          How every verdict{" "}
          <span className="rounded-2xl bg-[var(--color-brand)] px-3 py-0.5 whitespace-nowrap text-[var(--color-brand-ink)]">
            earns its place
          </span>
        </h1>
        <p className="text-lg leading-relaxed text-pretty text-muted-foreground">
          The rules that govern everything published on SoftGids. They are not negotiable,
          not for sale, and they apply to every product equally.
        </p>
      </header>

      <ProfileNav sections={SECTIONS} />

      <div className="mx-auto max-w-4xl">
        <div className="min-w-0 space-y-20">
          {/* ---------- Ratings ---------- */}
          <section id="ratings" aria-labelledby="ratings-h" className="scroll-mt-32 space-y-6">
            <div className="mx-auto flex max-w-xl flex-col items-center gap-5 pb-2 text-center">
              <p className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground/80">
                <Star className="size-4 text-muted-foreground" aria-hidden="true" />
                Ratings
              </p>
              <h2
                id="ratings-h"
                className="font-heading text-3xl font-medium tracking-tight text-balance sm:text-[2.6rem] sm:leading-[1.18]"
              >
                Scores are computed,{" "}
                <span className="rounded-2xl bg-[var(--color-brand)] px-3 py-0.5 whitespace-nowrap text-[var(--color-brand-ink)]">
                  never assigned
                </span>
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground">
                No analyst sets a star rating. Every score on the platform is calculated
                automatically from the verified reviews behind it.
              </p>
            </div>

            <div className="prose-content mx-auto max-w-3xl space-y-4">
              <p className="leading-relaxed text-foreground/85">
                A product&apos;s overall rating is the average of its verified user reviews,
                recalculated the moment a new review is published or removed. Category rankings
                follow from those computed scores together with review volume, so a product
                cannot rank above another by any mechanism except earning better reviews from
                more businesses.
              </p>
              <p className="leading-relaxed text-foreground/85">
                Editorial content, our guides, comparisons and analyses, is written separately
                by named analysts and never feeds the score. Where an analyst expresses a view,
                it is labelled as analysis and signed. Where a number appears, it came from
                verified users, not from us.
              </p>
            </div>

            {/* Verification pipeline */}
            <div className="overflow-hidden rounded-[2rem] border border-zinc-200 dark:border-zinc-800">
              {VERIFICATION_STEPS.map(({ title, text }, i) => (
                <article
                  key={title}
                  className="grid gap-4 bg-card p-7 sm:grid-cols-[auto_1fr] sm:gap-7 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-zinc-200 dark:[&:not(:first-child)]:border-zinc-800"
                >
                  <span className="font-heading text-3xl font-bold tabular-nums text-zinc-300 dark:text-zinc-700">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="space-y-1.5">
                    <h3 className="flex items-center gap-2 font-heading text-lg font-bold">
                      <BadgeCheck
                        className="size-5 text-[var(--color-brand-dark)]"
                        aria-hidden="true"
                      />
                      {title}
                    </h3>
                    <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                      {text}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* ---------- Research ---------- */}
          <section id="research" aria-labelledby="research-h" className="scroll-mt-32 space-y-6">
            <div className="mx-auto flex max-w-xl flex-col items-center gap-5 pb-2 text-center">
              <p className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground/80">
                <FileSearch className="size-4 text-muted-foreground" aria-hidden="true" />
                Research
              </p>
              <h2
                id="research-h"
                className="font-heading text-3xl font-medium tracking-tight text-balance sm:text-[2.6rem] sm:leading-[1.18]"
              >
                Facts checked at{" "}
                <span className="rounded-2xl bg-[var(--color-brand)] px-3 py-0.5 whitespace-nowrap text-[var(--color-brand-ink)]">
                  the source
                </span>
              </h2>
            </div>
            <div className="prose-content mx-auto max-w-3xl space-y-4">
              <p className="leading-relaxed text-foreground/85">
                Product facts on SoftGids, pricing, plans, features, integrations and support
                channels, are verified against the vendor&apos;s official South African pricing
                and documentation before publication. Pricing is captured in rand as a South
                African business would actually pay it, and we state whether figures include
                VAT.
              </p>
              <p className="leading-relaxed text-foreground/85">
                Local fit is assessed against the compliance realities of running a business
                here: VAT201 preparation for SARS eFiling, EMP201 and EMP501 handling, UIF
                declarations, IRP5 certificates, bank feed coverage for South African banks and
                POPIA obligations. A product that excels abroad but fails these tests will read
                that way on our pages.
              </p>
              <p className="leading-relaxed text-foreground/85">
                Listings are reviewed on a rolling cycle and whenever a vendor announces a
                pricing or packaging change. Every product page shows when it was last updated,
                and anything we cannot verify is either removed or clearly marked as unverified.
              </p>
            </div>
          </section>

          {/* ---------- Vendors ---------- */}
          <section id="vendors" aria-labelledby="vendors-h" className="scroll-mt-32 space-y-6">
            <div className="mx-auto flex max-w-xl flex-col items-center gap-5 pb-2 text-center">
              <p className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground/80">
                <Scale className="size-4 text-muted-foreground" aria-hidden="true" />
                Vendors
              </p>
              <h2
                id="vendors-h"
                className="font-heading text-3xl font-medium tracking-tight text-balance sm:text-[2.6rem] sm:leading-[1.18]"
              >
                The rules of{" "}
                <span className="rounded-2xl bg-[var(--color-brand)] px-3 py-0.5 whitespace-nowrap text-[var(--color-brand-ink)]">
                  engagement
                </span>
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground">
                We work with vendors on facts. We never work with vendors on verdicts.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-4 rounded-[2rem] border border-zinc-200 bg-card p-7 sm:p-8 dark:border-zinc-800">
                <h3 className="font-heading text-lg font-bold">Vendors can</h3>
                <ul className="space-y-3">
                  {VENDOR_CAN.map((item) => (
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
                <h3 className="font-heading text-lg font-bold">Vendors cannot</h3>
                <ul className="space-y-3">
                  {VENDOR_CANNOT.map((item) => (
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

            <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
              Some outbound links earn us a commission. How that works, and why it cannot touch
              a ranking, is set out in our{" "}
              <Link
                href="/affiliate-disclosure"
                className="font-medium text-[var(--color-brand-dark)] underline underline-offset-2"
              >
                affiliate disclosure
              </Link>
              .
            </p>
          </section>

          {/* ---------- Corrections ---------- */}
          <section
            id="corrections"
            aria-labelledby="corrections-h"
            className="scroll-mt-32 space-y-6"
          >
            <div className="mx-auto flex max-w-xl flex-col items-center gap-5 pb-2 text-center">
              <p className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground/80">
                <RefreshCw className="size-4 text-muted-foreground" aria-hidden="true" />
                Corrections
              </p>
              <h2
                id="corrections-h"
                className="font-heading text-3xl font-medium tracking-tight text-balance sm:text-[2.6rem] sm:leading-[1.18]"
              >
                When we are wrong,{" "}
                <span className="rounded-2xl bg-[var(--color-brand)] px-3 py-0.5 whitespace-nowrap text-[var(--color-brand-ink)]">
                  we fix it
                </span>
              </h2>
            </div>
            <div className="prose-content mx-auto max-w-3xl space-y-4">
              <p className="leading-relaxed text-foreground/85">
                Pricing changes, products get renamed, features ship and sunset. If you spot
                something wrong on any page, tell us. Factual corrections are verified against
                the source and fixed promptly, and material corrections are noted on the page
                they concern.
              </p>
              <p className="leading-relaxed text-foreground/85">
                Review disputes follow the same discipline. A vendor or user who believes a
                review breaches our guidelines can flag it with reasons. We reinvestigate the
                verification, keep the review up if it stands, and remove it with a note if it
                does not. What we never do is remove a review simply because it is negative.
              </p>
            </div>
            <div className="flex justify-center">
              <Link
                href="/contact"
                className="btn-glossy inline-flex items-center gap-2 px-6 py-3.5 text-sm"
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                Report a correction
              </Link>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Or email us directly at{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-medium text-[var(--color-brand-dark)] underline underline-offset-2"
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
