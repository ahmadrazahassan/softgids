import { Check, MailCheck } from "lucide-react";
import { NewsletterForm } from "@/components/public/NewsletterForm";

const PROMISES = [
  "No spam and your address is never sold",
  "POPIA compliant, you confirm by email first",
  "Unsubscribe in one click, no hard feelings",
];

/** Newsletter band on the home page: navy panel, copy left, form right. */
export function NewsletterSection() {
  return (
    <section aria-labelledby="newsletter-heading" className="container-site">
      <div className="reveal-on-scroll overflow-hidden rounded-[2.5rem] bg-[var(--color-navy)] text-white dark:bg-secondary">
        <div className="grid gap-10 px-7 py-12 sm:px-12 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-16 lg:py-16">
          {/* Copy */}
          <div className="space-y-5">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-zinc-200">
              <MailCheck className="size-4 text-[var(--color-brand)]" aria-hidden="true" />
              The monthly letter
            </p>
            <h2
              id="newsletter-heading"
              className="font-heading text-3xl font-medium tracking-tight text-balance sm:text-[2.6rem] sm:leading-[1.18]"
            >
              One good email{" "}
              <span className="rounded-2xl bg-[var(--color-brand)] px-3 py-0.5 whitespace-nowrap text-[var(--color-brand-ink)]">
                a month
              </span>
            </h2>
            <p className="max-w-lg text-base leading-relaxed text-zinc-300">
              Each issue rounds up the newest verified reviews, any rand pricing that moved, and
              one guide matched to the season. When VAT deadlines loom, you will hear about it
              early. We write it ourselves and we keep it short.
            </p>
          </div>

          {/* Form + promises */}
          <div className="space-y-6">
            <NewsletterForm variant="footer" />
            <ul className="space-y-2.5">
              {PROMISES.map((promise) => (
                <li key={promise} className="flex items-start gap-2.5 text-sm text-zinc-300">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md bg-[color-mix(in_srgb,var(--color-brand)_18%,transparent)]"
                  >
                    <Check className="size-3.5 text-[var(--color-brand)]" />
                  </span>
                  {promise}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
