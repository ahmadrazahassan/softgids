import {
  ArrowRight,
  Building2,
  CalendarDays,
  Globe2,
  Headphones,
  Languages,
  Tag,
} from "lucide-react";
import { AdLabel } from "@/components/public/AdLabel";
import { AffiliateDisclosureNote } from "@/components/public/AffiliateDisclosureNote";
import { AffiliateLink } from "@/components/public/AffiliateLink";
import { CountryFlag } from "@/components/public/CountryFlag";
import { Badge } from "@/components/ui/badge";
import { outboundLink } from "@/lib/affiliate";
import { startingPriceLabel } from "@/lib/format";
import type { Software } from "@/lib/types";

function FactTile({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Building2;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.4rem] border border-zinc-200/70 bg-card px-5 py-4 dark:border-zinc-800">
      <p className="flex items-center gap-2 text-[0.65rem] font-bold tracking-widest text-muted-foreground uppercase">
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </p>
      <div className="mt-1.5 text-sm font-medium">{children}</div>
    </div>
  );
}

/**
 * Full-width vendor spec sheet: fact tiles on the grey backplate with the
 * tracked vendor CTA band closing the plate. Replaces the old right rail.
 */
export function SoftwareSidebar({ software }: { software: Software }) {
  const price = startingPriceLabel(software);
  const link = outboundLink(software, "software-hero");

  return (
    <div className="rounded-[1.75rem] bg-zinc-100/80 p-2 dark:bg-zinc-900/60">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <FactTile icon={Tag} label="Starting price">
          <span className="font-heading text-lg font-extrabold tabular-nums tracking-tight">
            {price.amount}
          </span>
          {price.note && (
            <span className="ml-1 text-xs font-medium text-muted-foreground">{price.note}</span>
          )}
        </FactTile>
        {software.vendor_name && (
          <FactTile icon={Building2} label="Vendor">
            {software.vendor_name}
          </FactTile>
        )}
        {software.founded_year && (
          <FactTile icon={CalendarDays} label="Founded">
            {software.founded_year.toLocaleString("en-ZA", { useGrouping: false })}
          </FactTile>
        )}
        {software.countries_available.length > 0 && (
          <FactTile icon={Globe2} label="Available in">
            <span className="flex flex-wrap gap-x-3 gap-y-1.5 pt-0.5">
              {software.countries_available.map((country) => (
                <span key={country} className="inline-flex items-center gap-1.5">
                  <CountryFlag country={country} size={16} />
                  {country}
                </span>
              ))}
            </span>
          </FactTile>
        )}
        {software.languages.length > 0 && (
          <FactTile icon={Languages} label="Languages">
            {software.languages.join(", ")}
          </FactTile>
        )}
        {software.support_types.length > 0 && (
          <FactTile icon={Headphones} label="Support">
            <span className="flex flex-wrap gap-1.5 pt-0.5">
              {software.support_types.map((type) => (
                <Badge key={type} variant="muted">
                  {type}
                </Badge>
              ))}
            </span>
          </FactTile>
        )}
      </div>

      {/* Vendor CTA band on the plate */}
      <div className="flex flex-col gap-5 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="max-w-lg space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {software.free_trial && <Badge variant="success">Free trial</Badge>}
            {software.free_version && <Badge variant="muted">Free version</Badge>}
          </div>
          <AffiliateDisclosureNote />
        </div>
        {link && (
          <span className="flex shrink-0 flex-col items-center gap-1.5">
            <AffiliateLink
              link={link}
              action={`Visit ${software.vendor_name ?? software.name} website`}
              slug={software.slug}
              className="btn-glossy btn-glossy-dark group/cta relative inline-flex h-12 shrink-0 items-center overflow-hidden px-14 text-sm"
            >
              <span
                aria-hidden="true"
                className="absolute inset-y-1.5 left-1.5 grid w-10 place-items-center rounded-[0.55rem] bg-[var(--color-brand)] text-[var(--color-brand-ink)] transition-[left,background-color] duration-300 ease-out group-hover/cta:left-[calc(100%-2.875rem)] group-hover/cta:bg-transparent"
              >
                <ArrowRight className="size-4" />
              </span>
              Visit {software.vendor_name ?? software.name} website
            </AffiliateLink>
            {link.kind === "affiliate" && <AdLabel />}
          </span>
        )}
      </div>
    </div>
  );
}
