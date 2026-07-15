"use client";

import * as React from "react";
import { useActionState } from "react";
import { Loader2, Send } from "lucide-react";
import { subscribeNewsletter, type FormActionState } from "@/app/(public)/newsletter/actions";
import { cn } from "@/lib/utils";

export function NewsletterForm({
  variant = "page",
  className,
}: {
  variant?: "page" | "footer";
  className?: string;
}) {
  const [state, formAction, pending] = useActionState<FormActionState | null, FormData>(
    subscribeNewsletter,
    null
  );
  const footer = variant === "footer";

  return (
    <div className={cn("w-full max-w-md", className)}>
      <form action={formAction} className="flex w-full gap-2">
        <label htmlFor={`newsletter-email-${variant}`} className="sr-only">
          Email address
        </label>
        <input
          id={`newsletter-email-${variant}`}
          type="email"
          name="email"
          required
          placeholder="you@company.co.za"
          className={cn(
            "h-11 flex-1 rounded-[0.875rem] border px-4 text-sm outline-none transition-colors",
            footer
              ? "border-white/15 bg-white/10 text-white placeholder:text-zinc-400 focus-visible:border-[var(--color-brand)] focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]/40"
              : "border-border bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          )}
        />
        <button
          type="submit"
          disabled={pending}
          className="btn-glossy inline-flex h-11 items-center gap-2 px-5 text-sm disabled:opacity-60"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          Subscribe
        </button>
      </form>
      {state && (
        <p
          role="status"
          className={cn(
            "mt-2 text-sm",
            state.ok
              ? "text-[var(--color-brand-dark)]"
              : footer
                ? "text-amber-300"
                : "text-amber-600 dark:text-amber-400"
          )}
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
