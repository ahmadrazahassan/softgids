"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, MessagesSquare, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FaqItem {
  question: string;
  answer: string;
  topic?: string;
}

/**
 * FAQ block modelled on the reference composition: a grey backplate holding a
 * left topic rail (active topic on a white card), white question cards with
 * +/× toggles on the right, and a "still have questions" band closing the
 * plate with the signature slider CTA.
 */
export function FaqAccordion({
  items,
  contactHref = "/contact",
  className,
}: {
  items: FaqItem[];
  contactHref?: string;
  className?: string;
}) {
  const topics = React.useMemo(() => {
    const unique = [...new Set(items.map((item) => item.topic).filter(Boolean))] as string[];
    return unique.length > 1 ? ["All questions", ...unique] : [];
  }, [items]);

  const [activeTopic, setActiveTopic] = React.useState("All questions");
  const [open, setOpen] = React.useState(0);

  const visible =
    activeTopic === "All questions" ? items : items.filter((i) => i.topic === activeTopic);

  const selectTopic = (topic: string) => {
    setActiveTopic(topic);
    setOpen(0);
  };

  return (
    <div className={cn("rounded-[1.75rem] bg-zinc-100/80 p-2 dark:bg-zinc-900/60", className)}>
      <div className={cn("gap-2", topics.length > 0 && "grid lg:grid-cols-[230px_1fr]")}>
        {/* Topic rail — active topic sits on a white card */}
        {topics.length > 0 && (
          <div
            role="tablist"
            aria-label="Question topics"
            aria-orientation="vertical"
            className="flex gap-1 overflow-x-auto p-1 lg:flex-col lg:self-start lg:overflow-visible"
          >
            {topics.map((topic) => {
              const active = topic === activeTopic;
              return (
                <button
                  key={topic}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => selectTopic(topic)}
                  className={cn(
                    "shrink-0 cursor-pointer rounded-[1.1rem] px-5 py-3.5 text-left text-sm transition-colors lg:w-full",
                    active
                      ? "bg-card font-medium text-foreground shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {topic}
                </button>
              );
            })}
          </div>
        )}

        {/* Question cards */}
        <div className="space-y-2">
          {visible.map((item, index) => {
            const isOpen = index === open;
            return (
              <div
                key={item.question}
                className="rounded-[1.4rem] border border-zinc-200/70 bg-card px-6 py-5 sm:px-7 dark:border-zinc-800"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? -1 : index)}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 text-left"
                >
                  <span className="font-heading text-base font-medium tracking-tight sm:text-lg">
                    {item.question}
                  </span>
                  {isOpen ? (
                    <X className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  ) : (
                    <Plus className="size-4 shrink-0 text-zinc-400 dark:text-zinc-500" aria-hidden="true" />
                  )}
                </button>
                {isOpen && (
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {item.answer}
                  </p>
                )}
              </div>
            );
          })}

          {/* Still have questions band */}
          <div className="rounded-[1.4rem] border border-zinc-200/70 bg-card px-6 py-7 sm:px-7 dark:border-zinc-800">
            <div className="flex max-w-lg flex-col items-start gap-3">
              <p className="inline-flex items-center gap-2 rounded-full bg-muted px-3.5 py-1.5 text-xs font-medium text-foreground/80">
                <MessagesSquare className="size-3.5 text-muted-foreground" aria-hidden="true" />
                Let&apos;s connect
              </p>
              <h3 className="font-heading text-xl font-medium tracking-tight sm:text-2xl">
                Still have questions? We&apos;re here to help.
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Ask us anything about this product, from pricing in rand to how it handles SARS
                requirements, and we&apos;ll point you in the right direction.
              </p>
              <Link
                href={contactHref}
                className="group/cta relative mt-2 inline-flex h-12 items-center overflow-hidden rounded-xl bg-[#232428] px-14 text-sm font-semibold text-white transition-all duration-300 hover:bg-[var(--color-brand)] hover:text-[var(--color-brand-ink)] hover:ring-2 hover:ring-[#232428] hover:ring-inset"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-y-1.5 left-1.5 grid w-10 place-items-center rounded-[0.55rem] bg-[var(--color-brand)] text-[var(--color-brand-ink)] transition-[left,background-color] duration-300 ease-out group-hover/cta:left-[calc(100%-2.875rem)] group-hover/cta:bg-transparent"
                >
                  <ArrowRight className="size-4" />
                </span>
                Contact us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
