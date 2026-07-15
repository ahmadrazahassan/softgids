import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { ContactForm } from "@/components/public/ContactForm";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE,
  SITE_LOCATION,
  siteUrl,
} from "@/lib/site";
import { getSiteSettings } from "@/lib/supabase/queries";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Questions, corrections or partnership ideas? Get in touch with the SoftGids team in Cape Town, South Africa.",
  alternates: { canonical: `${siteUrl}/contact` },
};

/** What happens after you press send — the promise, in three beats. */
const NEXT_STEPS = [
  {
    title: "A person reads it",
    text: "Every message lands with the team that builds and edits SoftGids. No ticket bots, no scripts.",
  },
  {
    title: "It goes to the right desk",
    text: "Corrections reach the analyst who wrote the page. Listings reach partnerships. Press reaches the founder.",
  },
  {
    title: "You hear back",
    text: "A reply within two business days, usually sooner. If it needs digging, we say so and keep you posted.",
  },
];

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const email = settings.contact_email ?? CONTACT_EMAIL;

  const channels = [
    {
      label: "Email",
      value: email,
      note: "Best for corrections and anything with attachments",
      href: `mailto:${email}`,
    },
    {
      label: "Phone",
      value: CONTACT_PHONE,
      note: "Mon to Fri, 08:30 to 17:00 SAST",
      href: `tel:${CONTACT_PHONE.replace(/\s/g, "")}`,
    },
    {
      label: "Office",
      value: SITE_LOCATION,
      note: "Where the platform is researched, written and built",
      href: undefined,
    },
  ];

  return (
    <div className="container-site max-w-6xl space-y-20 py-10">
      <Breadcrumbs items={[{ name: "Contact" }]} />

      {/* ---------- Hero ---------- */}
      <header className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
        <p className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground/80">
          <MessageCircle className="size-4 text-muted-foreground" aria-hidden="true" />
          Contact
        </p>
        <h1 className="font-heading text-5xl font-bold tracking-tight text-balance sm:text-6xl sm:leading-[1.04]">
          Say hello.{" "}
          <span className="rounded-2xl bg-[var(--color-brand)] px-3 py-0.5 whitespace-nowrap text-[var(--color-brand-ink)]">
            We answer.
          </span>
        </h1>
        <p className="text-lg leading-relaxed text-pretty text-muted-foreground">
          Corrections, review disputes, vendor listings or press. Our Cape Town team reads
          every message and replies within two business days.
        </p>
      </header>

      {/* ---------- Channel index — big editorial rows ---------- */}
      <section aria-label="Contact channels">
        <ul className="border-t border-zinc-200 dark:border-zinc-800">
          {channels.map(({ label, value, note, href }, i) => {
            const row = (
              <div className="grid items-center gap-x-8 gap-y-1 py-8 sm:grid-cols-[3.5rem_10rem_1fr_auto] sm:py-10">
                <span className="hidden font-heading text-sm font-bold tabular-nums text-zinc-300 sm:block dark:text-zinc-700">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[0.7rem] font-bold tracking-[0.18em] text-muted-foreground uppercase">
                  {label}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-heading text-2xl font-bold tracking-tight transition-colors sm:text-[2rem] sm:leading-tight">
                    {value}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{note}</p>
                </div>
                {href && (
                  <ArrowUpRight
                    className="hidden size-7 text-zinc-300 transition-all group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-[var(--color-brand-dark)] sm:block dark:text-zinc-700"
                    aria-hidden="true"
                  />
                )}
              </div>
            );
            return (
              <li
                key={label}
                className="border-b border-zinc-200 dark:border-zinc-800"
              >
                {href ? (
                  <a
                    href={href}
                    className="group block transition-colors hover:bg-muted/50"
                  >
                    {row}
                  </a>
                ) : (
                  row
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* ---------- Message section — sticky rail + form ---------- */}
      <section
        aria-labelledby="form-h"
        className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16"
      >
        {/* Left rail — sticky on desktop */}
        <div className="space-y-10 self-start lg:sticky lg:top-32">
          <div className="space-y-4">
            <h2
              id="form-h"
              className="font-heading text-3xl font-medium tracking-tight text-balance sm:text-[2.6rem] sm:leading-[1.15]"
            >
              Or write it all{" "}
              <span className="rounded-2xl bg-[var(--color-brand)] px-3 py-0.5 whitespace-nowrap text-[var(--color-brand-ink)]">
                down here
              </span>
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              Pick a topic so it lands on the right desk, tell us what is going on, and press
              send. Here is what happens next.
            </p>
          </div>

          <ol className="space-y-7">
            {NEXT_STEPS.map(({ title, text }, i) => (
              <li key={title} className="grid grid-cols-[auto_1fr] gap-4">
                <span className="font-heading text-2xl font-bold tabular-nums text-zinc-300 dark:text-zinc-700">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="space-y-1 pt-0.5">
                  <h3 className="font-heading text-base font-bold">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
                </div>
              </li>
            ))}
          </ol>

          <p className="border-t border-zinc-200 pt-6 text-xs leading-relaxed text-muted-foreground dark:border-zinc-800">
            We handle contact messages under POPIA. Your details are used only to reply to you,
            never shared or sold. The fine print lives in our{" "}
            <Link
              href="/privacy-policy"
              className="font-medium text-[var(--color-brand-dark)] underline underline-offset-2"
            >
              privacy policy
            </Link>
            .
          </p>
        </div>

        {/* Right — the form on a clean card */}
        <div className="rounded-[1.75rem] bg-zinc-100/80 p-2 dark:bg-zinc-900/60">
          <div className="rounded-[1.4rem] border border-zinc-200/70 bg-card p-7 sm:p-9 dark:border-zinc-800">
            <ContactForm />
          </div>
        </div>
      </section>

      {/* ---------- Quiet self-serve strip ---------- */}
      <section
        aria-label="Before you write"
        className="flex flex-col items-start justify-between gap-6 rounded-[2rem] border border-zinc-200 bg-muted/40 p-8 sm:flex-row sm:items-center sm:p-10 dark:border-zinc-800"
      >
        <div className="space-y-1.5">
          <h2 className="font-heading text-xl font-bold">Asking how we rate software?</h2>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            The two questions we get most are already answered in depth: how scores are computed,
            and how we make money without selling verdicts.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <Link
            href="/editorial-policy"
            className="btn-glossy btn-glossy-white inline-flex items-center gap-2 px-5 py-3 text-sm"
          >
            Editorial policy
          </Link>
          <Link
            href="/affiliate-disclosure"
            className="btn-glossy btn-glossy-white inline-flex items-center gap-2 px-5 py-3 text-sm"
          >
            Affiliate disclosure
          </Link>
        </div>
      </section>
    </div>
  );
}
