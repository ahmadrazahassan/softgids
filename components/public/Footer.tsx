import Link from "next/link";
import { Mail, MailCheck, MapPin, Phone } from "lucide-react";
import { BrandLogo } from "@/components/public/BrandLogo";
import { NewsletterForm } from "@/components/public/NewsletterForm";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE,
  SITE_LOCATION,
  SITE_TAGLINE,
} from "@/lib/site";
import type { Category, Software } from "@/lib/types";

const EXPLORE_LINKS = [
  { label: "Software Reviews", href: "/software" },
  { label: "Categories", href: "/categories" },
  { label: "Compare Software", href: "/compare" },
  { label: "Blog", href: "/blog" },
  { label: "Search", href: "/search" },
];

const COMPANY_LINKS = [
  { label: "About us", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Editorial policy", href: "/editorial-policy" },
  { label: "Affiliate disclosure", href: "/affiliate-disclosure" },
  { label: "Newsletter", href: "/newsletter" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Cookie Policy", href: "/cookie-policy" },
  { label: "Terms of Use", href: "/terms" },
  { label: "PAIA Manual", href: "/paia-manual" },
  { label: "Accessibility", href: "/accessibility" },
];

function ColumnHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[0.65rem] font-bold tracking-[0.18em] text-zinc-500 uppercase">
      {children}
    </h3>
  );
}

export function Footer({
  categories,
  popularSoftware,
  settings,
}: {
  categories: Category[];
  popularSoftware: Software[];
  settings: Record<string, string>;
}) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 overflow-hidden rounded-t-[2.5rem] bg-[#141517] text-zinc-400">
      {/* Newsletter band */}
      <div className="container-site border-b border-white/[0.06] py-14">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-16">
          <div className="space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/[0.07] px-4 py-1.5 text-sm font-medium text-zinc-300">
              <MailCheck className="size-4 text-[var(--color-brand)]" aria-hidden="true" />
              The monthly letter
            </p>
            <h2 className="font-heading text-2xl font-medium tracking-tight text-white sm:text-3xl">
              Software advice for South African businesses,{" "}
              <span className="rounded-xl bg-[var(--color-brand)] px-2.5 py-0.5 whitespace-nowrap text-[var(--color-brand-ink)]">
                once a month
              </span>
            </h2>
            <p className="max-w-lg text-sm leading-relaxed text-zinc-500">
              New reviews, rand price moves and a checklist for every SARS season. No spam and
              you can leave in one click. We handle your details in line with POPIA.
            </p>
          </div>
          <NewsletterForm variant="footer" className="lg:justify-self-end" />
        </div>
      </div>

      {/* Link columns */}
      <div className="container-site grid gap-x-8 gap-y-12 py-16 md:grid-cols-2 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-4">
          <BrandLogo invert />
          <p className="max-w-xs text-sm leading-relaxed text-zinc-500">
            {settings.footer_text ?? SITE_TAGLINE}
          </p>
          <ul className="space-y-3 pt-1 text-sm">
            <li>
              <a
                href={`mailto:${settings.contact_email ?? CONTACT_EMAIL}`}
                className="inline-flex items-start gap-2.5 transition-colors hover:text-white"
              >
                <Mail className="mt-0.5 size-4 shrink-0 text-[var(--color-brand)]" />
                <span className="break-all">{settings.contact_email ?? CONTACT_EMAIL}</span>
              </a>
            </li>
            <li>
              <a
                href={`tel:${CONTACT_PHONE.replace(/\s/g, "")}`}
                className="inline-flex items-center gap-2.5 transition-colors hover:text-white"
              >
                <Phone className="size-4 shrink-0 text-[var(--color-brand)]" />
                {CONTACT_PHONE}
              </a>
            </li>
            <li className="inline-flex items-center gap-2.5">
              <MapPin className="size-4 shrink-0 text-[var(--color-brand)]" />
              {SITE_LOCATION}
            </li>
          </ul>
        </div>

        <nav aria-label="Explore" className="space-y-5 lg:col-span-2">
          <ColumnHeading>Explore</ColumnHeading>
          <ul className="space-y-3 text-sm">
            {EXPLORE_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Categories" className="space-y-5 lg:col-span-2">
          <ColumnHeading>Categories</ColumnHeading>
          <ul className="space-y-3 text-sm">
            {categories.slice(0, 5).map((category) => (
              <li key={category.id}>
                <Link
                  href={`/category/${category.slug}`}
                  className="transition-colors hover:text-white"
                >
                  {category.name.replace(" Software", "")}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Company" className="space-y-5 lg:col-span-2">
          <ColumnHeading>Company</ColumnHeading>
          <ul className="space-y-3 text-sm">
            {COMPANY_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Popular reviews" className="space-y-5 lg:col-span-2">
          <ColumnHeading>Popular reviews</ColumnHeading>
          <ul className="space-y-3 text-sm">
            {popularSoftware.slice(0, 5).map((software) => (
              <li key={software.id}>
                <Link
                  href={`/software/${software.slug}`}
                  className="transition-colors hover:text-white"
                >
                  {software.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Legal bar */}
      <div className="border-t border-white/[0.06]">
        <div className="container-site flex flex-col items-center justify-between gap-4 py-6 text-xs text-zinc-600 md:flex-row">
          <p>
            © {year.toLocaleString("en-ZA", { useGrouping: false })} SoftGids. {SITE_TAGLINE}.
          </p>
          <nav aria-label="Legal">
            <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Ghost wordmark — oversized, clipped at the bottom edge */}
      <div aria-hidden="true" className="container-site select-none">
        <p className="-mb-[0.26em] text-center font-heading text-[clamp(4rem,14vw,13rem)] leading-none font-semibold tracking-tight whitespace-nowrap text-white/[0.045]">
          SoftGids
        </p>
      </div>
    </footer>
  );
}
