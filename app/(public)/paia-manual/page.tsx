import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Landmark, Mail, MapPin, Phone, ScrollText } from "lucide-react";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE,
  SITE_LOCATION,
  SITE_NAME,
  siteUrl,
} from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "PAIA Manual",
  description:
    "The SoftGids manual published under section 51 of the Promotion of Access to Information Act 2 of 2000 (PAIA), including how to request access to records.",
  alternates: { canonical: `${siteUrl}/paia-manual` },
};

/** Categories of records held — the heart of a section 51 manual. */
const RECORD_CATEGORIES = [
  {
    subject: "Company records",
    examples: "Founding documents, statutory registers, policies and procedures",
  },
  {
    subject: "Financial records",
    examples: "Accounting records, banking details, invoices, tax and SARS correspondence",
  },
  {
    subject: "Personnel records",
    examples: "Employment contracts, remuneration records, statutory employee submissions",
  },
  {
    subject: "Platform records",
    examples: "Published reviews and ratings, editorial content, moderation decisions",
  },
  {
    subject: "Subscriber and user records",
    examples: "Newsletter subscriptions, contact form messages, review verification data",
  },
  {
    subject: "Commercial records",
    examples: "Vendor and affiliate agreements, correspondence with partners and suppliers",
  },
];

/** How to lodge a request — plain steps. */
const REQUEST_STEPS = [
  {
    title: "Use the prescribed form",
    text: "Complete PAIA Form C (request for access to a record of a private body), available from the Information Regulator's website.",
  },
  {
    title: "Identify the record",
    text: "Describe the record clearly enough for us to locate it, state which right you are exercising or protecting, and explain why the record is required for that right.",
  },
  {
    title: "Send it to the Information Officer",
    text: "Submit the completed form to the contact details below. Proof of identity accompanies every request.",
  },
  {
    title: "We respond within 30 days",
    text: "We acknowledge the request and respond within the 30 day period PAIA allows, granting access, or refusing with reasons under the grounds in the Act.",
  },
];

export default function PaiaManualPage() {
  return (
    <div className="container-site max-w-4xl space-y-14 py-10">
      <Breadcrumbs items={[{ name: "PAIA manual" }]} />

      {/* ---------- Header ---------- */}
      <header className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
        <p className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground/80">
          <ScrollText className="size-4 text-muted-foreground" aria-hidden="true" />
          PAIA manual
        </p>
        <h1 className="font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl sm:leading-[1.1]">
          Access to information,{" "}
          <span className="rounded-2xl bg-[var(--color-brand)] px-3 py-0.5 whitespace-nowrap text-[var(--color-brand-ink)]">
            as the law provides
          </span>
        </h1>
        <p className="text-lg leading-relaxed text-pretty text-muted-foreground">
          This manual is published under section 51 of the Promotion of Access to Information
          Act 2 of 2000 (PAIA), read with the Protection of Personal Information Act 4 of 2013
          (POPIA).
        </p>
      </header>

      {/* ---------- About the body ---------- */}
      <section aria-labelledby="body-h" className="space-y-5">
        <h2 id="body-h" className="font-heading text-2xl font-bold tracking-tight">
          1. The private body
        </h2>
        <p className="leading-relaxed text-foreground/85">
          {SITE_NAME} operates an independent business software review platform for the South
          African market. This manual tells you what records we hold and how to request access
          to them under PAIA.
        </p>
        <div className="grid gap-x-10 gap-y-5 rounded-[2rem] border border-zinc-200 bg-card p-7 sm:grid-cols-2 sm:p-8 dark:border-zinc-800">
          {[
            { icon: Landmark, label: "Private body", value: SITE_NAME },
            { icon: MapPin, label: "Location", value: SITE_LOCATION },
            { icon: Mail, label: "Information Officer", value: CONTACT_EMAIL },
            { icon: Phone, label: "Phone", value: CONTACT_PHONE },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3.5">
              <Icon
                className="mt-0.5 size-5 shrink-0 text-[var(--color-brand-dark)]"
                aria-hidden="true"
              />
              <div>
                <p className="text-[0.65rem] font-bold tracking-[0.18em] text-muted-foreground uppercase">
                  {label}
                </p>
                <p className="text-sm font-semibold">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- The regulator's guide ---------- */}
      <section aria-labelledby="guide-h" className="space-y-5">
        <h2 id="guide-h" className="font-heading text-2xl font-bold tracking-tight">
          2. The Information Regulator&apos;s guide
        </h2>
        <p className="leading-relaxed text-foreground/85">
          The Information Regulator has published a guide, in each official language, on how to
          use PAIA. It explains the objects of the Act, the manner and form of requests, the
          assistance available from Information Officers and the remedies available when a
          request is refused. The guide is available from the Information Regulator at{" "}
          <a
            href="https://inforegulator.org.za"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[var(--color-brand-dark)] underline underline-offset-2"
          >
            inforegulator.org.za
          </a>{" "}
          or by email to the Regulator&apos;s offices in Johannesburg.
        </p>
      </section>

      {/* ---------- Records held ---------- */}
      <section aria-labelledby="records-h" className="space-y-5">
        <h2 id="records-h" className="font-heading text-2xl font-bold tracking-tight">
          3. Categories of records we hold
        </h2>
        <p className="leading-relaxed text-foreground/85">
          The following categories of records are held by {SITE_NAME}. Listing a category does
          not mean a record within it is automatically available; every request is assessed
          under the grounds for access and refusal in PAIA.
        </p>
        <div className="overflow-hidden rounded-[2rem] border border-zinc-200 dark:border-zinc-800">
          {RECORD_CATEGORIES.map(({ subject, examples }) => (
            <div
              key={subject}
              className="grid gap-1 bg-card p-5 sm:grid-cols-[220px_1fr] sm:gap-6 sm:p-6 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-zinc-200 dark:[&:not(:first-child)]:border-zinc-800"
            >
              <p className="font-heading text-sm font-bold">{subject}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{examples}</p>
            </div>
          ))}
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Records automatically available without a PAIA request include everything published on
          this website: software listings, verified reviews, comparisons, guides and our public
          policies.
        </p>
      </section>

      {/* ---------- How to request ---------- */}
      <section aria-labelledby="request-h" className="space-y-5">
        <h2 id="request-h" className="font-heading text-2xl font-bold tracking-tight">
          4. How to request access to a record
        </h2>
        <div className="overflow-hidden rounded-[2rem] border border-zinc-200 dark:border-zinc-800">
          {REQUEST_STEPS.map(({ title, text }, i) => (
            <article
              key={title}
              className="grid gap-4 bg-card p-6 sm:grid-cols-[auto_1fr] sm:gap-6 sm:p-7 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-zinc-200 dark:[&:not(:first-child)]:border-zinc-800"
            >
              <span className="font-heading text-2xl font-bold tabular-nums text-zinc-300 dark:text-zinc-700">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="space-y-1">
                <h3 className="font-heading text-base font-bold">{title}</h3>
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{text}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The fees prescribed under PAIA apply to requests, including a request fee and access
          fees for search, preparation and reproduction where applicable. We advise the fee
          before processing so there are no surprises.
        </p>
      </section>

      {/* ---------- POPIA ---------- */}
      <section aria-labelledby="popia-h" className="space-y-5">
        <h2 id="popia-h" className="font-heading text-2xl font-bold tracking-tight">
          5. Personal information and POPIA
        </h2>
        <p className="leading-relaxed text-foreground/85">
          {SITE_NAME} processes personal information, reviewer verification details, newsletter
          subscriptions and contact messages, under POPIA. The purposes of processing, the
          categories of data subjects and the security measures we apply are set out in our{" "}
          <Link
            href="/privacy-policy"
            className="font-medium text-[var(--color-brand-dark)] underline underline-offset-2"
          >
            privacy policy
          </Link>
          . Data subjects may request access to, correction of, or deletion of their personal
          information by contacting the Information Officer at{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="font-medium text-[var(--color-brand-dark)] underline underline-offset-2"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>

      {/* ---------- Availability ---------- */}
      <section
        aria-labelledby="availability-h"
        className="space-y-4 rounded-[2rem] border border-zinc-200 bg-muted/40 p-8 dark:border-zinc-800"
      >
        <h2
          id="availability-h"
          className="flex items-center gap-2 font-heading text-xl font-bold"
        >
          <FileText className="size-5 text-[var(--color-brand-dark)]" aria-hidden="true" />
          Availability of this manual
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          This manual is available free of charge on this page, and on request from the
          Information Officer by email. It is reviewed and updated whenever our details or
          record categories change materially.
        </p>
      </section>
    </div>
  );
}
