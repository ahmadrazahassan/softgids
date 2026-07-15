import type { Metadata } from "next";
import Link from "next/link";
import {
  Ban,
  CalendarClock,
  Check,
  FileText,
  MailCheck,
  PiggyBank,
  Star,
} from "lucide-react";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { NewsletterForm } from "@/components/public/NewsletterForm";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Newsletter — Software Advice for SA Businesses",
  description:
    "Get monthly software reviews, ZAR price updates and SARS season checklists for South African businesses. Double opt-in, POPIA compliant, unsubscribe anytime.",
  alternates: { canonical: `${siteUrl}/newsletter` },
};

/** What lands in the inbox — bare icons, one per theme. */
const INSIDE = [
  {
    icon: Star,
    title: "New verified reviews",
    text: "The most useful reviews published that month, from businesses like yours.",
  },
  {
    icon: PiggyBank,
    title: "Rand price changes",
    text: "Every pricing move across the products we track, so renewals never surprise you.",
  },
  {
    icon: FileText,
    title: "Practical guides",
    text: "VAT201, EMP501 and IRP5 season prep, written by analysts who have run the deadlines.",
  },
  {
    icon: CalendarClock,
    title: "One email a month",
    text: "First Tuesday of the month, readable in five minutes, and that is the lot.",
  },
];

const NEVER = [
  "No vendor sponsorships dressed up as advice",
  "No selling or sharing your address, per POPIA",
  "No daily drip campaigns or surprise promotions",
];

export default function NewsletterPage() {
  return (
    <div className="container-site max-w-5xl space-y-14 py-10">
      <Breadcrumbs items={[{ name: "Newsletter" }]} />

      {/* ---------- Header ---------- */}
      <header className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
        <p className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground/80">
          <MailCheck className="size-4 text-muted-foreground" aria-hidden="true" />
          Newsletter
        </p>
        <h1 className="font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl sm:leading-[1.1]">
          Software intelligence,{" "}
          <span className="rounded-2xl bg-[var(--color-brand)] px-3 py-0.5 whitespace-nowrap text-[var(--color-brand-ink)]">
            once a month
          </span>
        </h1>
        <p className="text-lg leading-relaxed text-pretty text-muted-foreground">
          Written by our analysts for South African businesses. Never by vendors, never more
          than monthly.
        </p>
      </header>

      {/* ---------- Signup card ---------- */}
      <section
        aria-label="Subscribe"
        className="mx-auto flex max-w-2xl flex-col items-center gap-5 rounded-[2rem] border border-zinc-200 bg-card p-8 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.14)] sm:p-10 dark:border-zinc-800"
      >
        <h2 className="font-heading text-2xl font-bold tracking-tight">
          Join the next edition
        </h2>
        <NewsletterForm />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Double opt-in: we email you a confirmation link first. Unsubscribe in one click,{" "}
          <Link href="/newsletter/unsubscribe" className="underline underline-offset-2">
            anytime
          </Link>
          . Details handled under POPIA, per our{" "}
          <Link href="/privacy-policy" className="underline underline-offset-2">
            privacy policy
          </Link>
          .
        </p>
      </section>

      {/* ---------- What's inside ---------- */}
      <section aria-labelledby="inside-h" className="space-y-6">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-5 pb-2 text-center">
          <h2
            id="inside-h"
            className="font-heading text-3xl font-medium tracking-tight text-balance sm:text-[2.6rem] sm:leading-[1.18]"
          >
            What lands in{" "}
            <span className="rounded-2xl bg-[var(--color-brand)] px-3 py-0.5 whitespace-nowrap text-[var(--color-brand-ink)]">
              your inbox
            </span>
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {INSIDE.map(({ icon: Icon, title, text }) => (
            <article
              key={title}
              className="flex items-start gap-4 rounded-[2rem] border border-zinc-200 bg-card p-6 sm:p-7 dark:border-zinc-800"
            >
              <Icon
                className="mt-0.5 size-5 shrink-0 text-[var(--color-brand-dark)]"
                aria-hidden="true"
              />
              <div className="space-y-1">
                <h3 className="font-heading text-base font-bold">{title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ---------- What we never send ---------- */}
      <section
        aria-labelledby="never-h"
        className="mx-auto max-w-2xl space-y-5 rounded-[2rem] border border-zinc-200 bg-muted/40 p-8 dark:border-zinc-800"
      >
        <h2 id="never-h" className="text-center font-heading text-xl font-bold">
          And what we never send
        </h2>
        <ul className="space-y-3">
          {NEVER.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed">
              <Ban
                className="mt-0.5 size-4.5 shrink-0 text-[var(--color-error)]"
                aria-hidden="true"
              />
              {item}
            </li>
          ))}
        </ul>
        <p className="flex items-start gap-2.5 border-t border-zinc-200 pt-4 text-sm leading-relaxed text-muted-foreground dark:border-zinc-800">
          <Check
            className="mt-0.5 size-4.5 shrink-0 text-[var(--color-brand-dark)]"
            aria-hidden="true"
          />
          Just one useful email a month. If it ever stops being useful, the unsubscribe link is
          at the bottom of every edition.
        </p>
      </section>
    </div>
  );
}
