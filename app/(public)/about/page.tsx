import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Compass,
  FileSearch,
  Landmark,
  ListChecks,
  MapPin,
  PenLine,
  Scale,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { ProfileNav } from "@/components/public/ProfileNav";
import { siteUrl } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "About SoftGids",
  description:
    "SoftGids is South Africa's independent business software review platform. Verified reviews, rand pricing and comparisons written for South African businesses.",
  alternates: { canonical: `${siteUrl}/about` },
};

const SECTIONS = [
  { id: "story", label: "Our story" },
  { id: "method", label: "How we work" },
  { id: "yardstick", label: "What we measure" },
  { id: "people", label: "Who writes this" },
];

/** The three commitments the platform stands on. Bare icons, per house style. */
const PRINCIPLES = [
  {
    icon: Scale,
    title: "Independence is not for sale",
    text: "Vendors cannot buy rankings, ratings or verdicts, and our analysts never see commercial terms. When a product wins on SoftGids, it won on merit alone.",
  },
  {
    icon: BadgeCheck,
    title: "Only verified voices count",
    text: "Every star rating is computed automatically from verified user reviews. There is no editorial thumb on the scale and no way to pay for a higher score.",
  },
  {
    icon: MapPin,
    title: "Written for South Africa",
    text: "We judge software against the reality of running a business here, not a translated checklist from another market. If it cannot produce what SARS expects, we say so.",
  },
];

/** The compliance yardstick — what every assessment is measured against. */
const YARDSTICK = [
  {
    icon: Landmark,
    term: "SARS eFiling",
    detail: "Returns must transfer cleanly, line by line, without rebuilding figures.",
  },
  {
    icon: FileSearch,
    term: "VAT201 at 15%",
    detail: "Native handling of standard, zero rated and exempt supplies.",
  },
  {
    icon: ListChecks,
    term: "EMP201 and EMP501",
    detail: "Monthly declarations and biannual reconciliations that balance by design.",
  },
  {
    icon: Users,
    term: "UIF and IRP5",
    detail: "Declarations for the Department of Employment and Labour, certificates at year end.",
  },
  {
    icon: ShieldCheck,
    term: "POPIA",
    detail: "How the product treats the personal information your business holds.",
  },
  {
    icon: Compass,
    term: "Rand pricing",
    detail: "What South African teams actually pay, including VAT, with no exchange rate guesswork.",
  },
];

export default function AboutPage() {
  return (
    <div className="container-site space-y-10 py-10">
      <Breadcrumbs items={[{ name: "About" }]} />

      {/* ---------- Hero — centered, review-page style ---------- */}
      <header className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
        <p className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground/80">
          <BookOpen className="size-4 text-muted-foreground" aria-hidden="true" />
          About SoftGids
        </p>
        <h1 className="font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl sm:leading-[1.1]">
          Software advice that speaks{" "}
          <span className="rounded-2xl bg-[var(--color-brand)] px-3 py-0.5 whitespace-nowrap text-[var(--color-brand-ink)]">
            fluent SARS
          </span>
        </h1>
        <p className="text-lg leading-relaxed text-pretty text-muted-foreground">
          SoftGids is South Africa&apos;s independent business software review platform.
          Verified reviews, rand pricing and comparisons written for the businesses that actually
          run here.
        </p>
      </header>

      <ProfileNav sections={SECTIONS} />

      <div className="mx-auto max-w-4xl">
        <div className="min-w-0 space-y-20">
          {/* ---------- Our story ---------- */}
          <section id="story" aria-labelledby="story-h" className="scroll-mt-32 space-y-6">
            <div className="mx-auto flex max-w-xl flex-col items-center gap-5 pb-2 text-center">
              <p className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground/80">
                <Compass className="size-4 text-muted-foreground" aria-hidden="true" />
                Our story
              </p>
              <h2
                id="story-h"
                className="font-heading text-3xl font-medium tracking-tight text-balance sm:text-[2.6rem] sm:leading-[1.18]"
              >
                Built because the reviews we found were{" "}
                <span className="rounded-2xl bg-[var(--color-brand)] px-3 py-0.5 whitespace-nowrap text-[var(--color-brand-ink)]">
                  written elsewhere
                </span>
              </h2>
            </div>
            <div className="prose-content mx-auto max-w-3xl space-y-4">
              <p className="leading-relaxed text-foreground/85">
                A South African business owner comparing accounting or payroll software used to
                land on page after page of glowing reviews that quietly assumed a different
                country. Prices in dollars. Tax advice about foreign revenue services. Payroll
                features that had never heard of an IRP5 or an EMP501 reconciliation.
              </p>
              <p className="leading-relaxed text-foreground/85">
                Acting on that advice costs real money. Software gets bought, implemented and
                paid for monthly before anyone discovers it cannot produce a VAT201 that
                satisfies SARS, or that its celebrated bank feed does not connect to a single
                South African bank.
              </p>
              <p className="leading-relaxed text-foreground/85">
                SoftGids exists to close that gap. Every product on the platform is assessed
                the way a local business actually uses it, priced in rand, and rated by verified
                users who run it every day. Nothing translated, nothing assumed, nothing
                borrowed from another market.
              </p>
            </div>
          </section>

          {/* ---------- How we work ---------- */}
          <section id="method" aria-labelledby="method-h" className="scroll-mt-32 space-y-6">
            <div className="mx-auto flex max-w-xl flex-col items-center gap-5 pb-2 text-center">
              <p className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground/80">
                <Scale className="size-4 text-muted-foreground" aria-hidden="true" />
                How we work
              </p>
              <h2
                id="method-h"
                className="font-heading text-3xl font-medium tracking-tight text-balance sm:text-[2.6rem] sm:leading-[1.18]"
              >
                Three rules hold{" "}
                <span className="rounded-2xl bg-[var(--color-brand)] px-3 py-0.5 whitespace-nowrap text-[var(--color-brand-ink)]">
                  everything together
                </span>
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground">
                Break any one of them and the reviews stop being worth trusting. So we don&apos;t.
              </p>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-zinc-200 dark:border-zinc-800">
              {PRINCIPLES.map(({ icon: Icon, title, text }, i) => (
                <article
                  key={title}
                  className="grid gap-4 bg-card p-7 sm:grid-cols-[auto_1fr] sm:gap-7 sm:p-9 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-zinc-200 dark:[&:not(:first-child)]:border-zinc-800"
                >
                  <div className="flex items-center gap-4 sm:flex-col sm:items-center sm:gap-3">
                    <span className="font-heading text-3xl font-bold tabular-nums text-zinc-300 dark:text-zinc-700">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <Icon
                      className="size-6 text-[var(--color-brand-dark)]"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-heading text-xl font-bold">{title}</h3>
                    <p className="max-w-2xl leading-relaxed text-muted-foreground">{text}</p>
                  </div>
                </article>
              ))}
            </div>

            <p className="text-center text-sm text-muted-foreground">
              The full detail lives in our{" "}
              <Link
                href="/editorial-policy"
                className="font-medium text-[var(--color-brand-dark)] underline underline-offset-2"
              >
                editorial policy
              </Link>{" "}
              and{" "}
              <Link
                href="/affiliate-disclosure"
                className="font-medium text-[var(--color-brand-dark)] underline underline-offset-2"
              >
                affiliate disclosure
              </Link>
              .
            </p>
          </section>

          {/* ---------- What we measure ---------- */}
          <section
            id="yardstick"
            aria-labelledby="yardstick-h"
            className="scroll-mt-32 space-y-6"
          >
            <div className="mx-auto flex max-w-xl flex-col items-center gap-5 pb-2 text-center">
              <p className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground/80">
                <ListChecks className="size-4 text-muted-foreground" aria-hidden="true" />
                What we measure
              </p>
              <h2
                id="yardstick-h"
                className="font-heading text-3xl font-medium tracking-tight text-balance sm:text-[2.6rem] sm:leading-[1.18]"
              >
                Every product meets{" "}
                <span className="rounded-2xl bg-[var(--color-brand)] px-3 py-0.5 whitespace-nowrap text-[var(--color-brand-ink)]">
                  the same yardstick
                </span>
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground">
                A tidy interface means little if the software cannot produce what SARS expects.
                This is the checklist behind every verdict on the platform.
              </p>
            </div>

            <dl className="grid gap-x-10 gap-y-7 rounded-[2rem] border border-zinc-200 bg-card p-8 sm:grid-cols-2 sm:p-10 dark:border-zinc-800">
              {YARDSTICK.map(({ icon: Icon, term, detail }) => (
                <div key={term} className="flex items-start gap-3.5">
                  <Icon
                    className="mt-0.5 size-5 shrink-0 text-[var(--color-brand-dark)]"
                    aria-hidden="true"
                  />
                  <div className="space-y-1">
                    <dt className="font-heading text-base font-bold">{term}</dt>
                    <dd className="text-sm leading-relaxed text-muted-foreground">{detail}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </section>

          {/* ---------- Who writes this ---------- */}
          <section id="people" aria-labelledby="people-h" className="scroll-mt-32 space-y-6">
            <div className="mx-auto flex max-w-xl flex-col items-center gap-5 pb-2 text-center">
              <p className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground/80">
                <PenLine className="size-4 text-muted-foreground" aria-hidden="true" />
                Who writes this
              </p>
              <h2
                id="people-h"
                className="font-heading text-3xl font-medium tracking-tight text-balance sm:text-[2.6rem] sm:leading-[1.18]"
              >
                Practitioners first,{" "}
                <span className="rounded-2xl bg-[var(--color-brand)] px-3 py-0.5 whitespace-nowrap text-[var(--color-brand-ink)]">
                  writers second
                </span>
              </h2>
            </div>

            <div className="rounded-[1.75rem] bg-zinc-100/80 p-2 dark:bg-zinc-900/60">
              <div className="grid gap-6 rounded-[1.4rem] border border-zinc-200/70 bg-card p-7 sm:grid-cols-[auto_1fr] sm:items-center sm:p-9 dark:border-zinc-800">
                <div className="grid size-20 place-items-center rounded-2xl bg-[var(--color-navy)] font-heading text-2xl font-bold text-[var(--color-brand)]">
                  AR
                </div>
                <div className="space-y-2">
                  <h3 className="font-heading text-xl font-bold">
                    Ahmad Raza
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      Founder and Lead Analyst
                    </span>
                  </h3>
                  <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    A CA(SA) who spent a decade implementing accounting and payroll systems for
                    SMEs from Cape Town to Johannesburg, Ahmad started SoftGids after one too
                    many clients was sold software that could not produce a VAT201, and still
                    reads every review published on the platform.
                  </p>
                </div>
              </div>
            </div>

            <p className="mx-auto max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
              The analysts behind our guides are payroll practitioners, bookkeepers and
              implementers who have run the month ends they write about. You&apos;ll meet them
              on every article they publish on{" "}
              <Link
                href="/blog"
                className="font-medium text-[var(--color-brand-dark)] underline underline-offset-2"
              >
                the blog
              </Link>
              .
            </p>
          </section>

          {/* ---------- CTA ---------- */}
          <section
            aria-label="Explore the platform"
            className="flex flex-col items-center gap-6 rounded-[2rem] border border-zinc-200 bg-muted/40 px-6 py-12 text-center dark:border-zinc-800"
          >
            <h2 className="font-heading text-3xl font-medium tracking-tight text-balance sm:text-[2.4rem] sm:leading-[1.15]">
              Find software that fits{" "}
              <span className="rounded-2xl bg-[var(--color-brand)] px-3 py-0.5 whitespace-nowrap text-[var(--color-brand-ink)]">
                your business
              </span>
            </h2>
            <p className="max-w-xl leading-relaxed text-muted-foreground">
              Browse the directory, compare the shortlist side by side, and read reviews from
              businesses that run the same tools you are weighing up.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/software"
                className="btn-glossy inline-flex items-center gap-2 px-6 py-3.5 text-sm"
              >
                Browse the directory
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/compare"
                className="btn-glossy btn-glossy-white inline-flex items-center gap-2 px-6 py-3.5 text-sm"
              >
                Compare software
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
