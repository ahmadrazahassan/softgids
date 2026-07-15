"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProfileSection {
  id: string;
  label: string;
}

/**
 * Floating dark section nav for product profiles — a rounded pill bar that
 * stays pinned while the site header hides on scroll. The active section
 * gets a green-tinted pill, tracked via IntersectionObserver.
 */
export function ProfileNav({ sections }: { sections: ProfileSection[] }) {
  const [active, setActive] = React.useState(sections[0]?.id);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    for (const section of sections) {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav
      aria-label="Page sections"
      className="sticky top-20 z-40 transition-[top] duration-300 [[data-header-hidden]_&]:top-3"
    >
      <div className="scrollbar-none mx-auto flex w-fit max-w-full gap-1 overflow-x-auto rounded-full bg-[#232428]/95 p-1.5 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.5)] backdrop-blur dark:bg-zinc-900/95 dark:ring-1 dark:ring-zinc-700/60">
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            aria-current={active === section.id ? "true" : undefined}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-200",
              active === section.id
                ? "bg-[color-mix(in_srgb,var(--color-brand)_16%,transparent)] text-[var(--color-brand)] ring-1 ring-inset ring-[color-mix(in_srgb,var(--color-brand)_30%,transparent)]"
                : "text-zinc-400 hover:text-white"
            )}
          >
            {section.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
