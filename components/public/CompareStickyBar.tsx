"use client";

import * as React from "react";
import { SoftwareLogo } from "@/components/public/SoftwareLogo";
import { AffiliateCTAButton } from "@/components/public/AffiliateCTAButton";
import { brandColorFor } from "@/lib/brandColors";
import type { Software } from "@/lib/types";
import { formatRating } from "@/lib/format";

/** Appears once the comparison page scrolls past the header. */
export function CompareStickyBar({ a, b }: { a: Software; b: Software }) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-xl">
      <div className="container-site flex items-center gap-3 py-3">
        {[a, b].map((software, index) => (
          <React.Fragment key={software.id}>
            {index === 1 && (
              <span className="hidden shrink-0 font-heading text-xs font-bold text-muted-foreground sm:block">
                VS
              </span>
            )}
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <SoftwareLogo software={software} size={36} />
              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-sm font-semibold">{software.name}</p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {formatRating(software.overall_rating)} ★
                </p>
              </div>
              <AffiliateCTAButton
                slug={software.slug}
                accent={brandColorFor(software)}
                className="w-auto flex-1 rounded-xl px-3 py-2 text-xs sm:flex-none"
              >
                Visit site
              </AffiliateCTAButton>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
