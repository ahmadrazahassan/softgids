"use client";

import { useActionState, useState } from "react";
import { ArrowRight, CircleCheck, Loader2 } from "lucide-react";
import { submitContact } from "@/app/(public)/contact/actions";
import type { FormActionState } from "@/app/(public)/newsletter/actions";
import { cn } from "@/lib/utils";

/** Reasons people reach out — the first thing they pick, which routes the message. */
const TOPICS = [
  { value: "General enquiry", label: "General enquiry" },
  { value: "Review correction", label: "Correct a review" },
  { value: "Vendor listing", label: "List our software" },
  { value: "Press & media", label: "Press & media" },
] as const;

const MESSAGE_MAX = 5000;

/** Floating-label field — the label rides up when the field is focused or filled. */
function Field({
  id,
  name,
  label,
  type = "text",
  required,
  autoComplete,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <div className="group relative">
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        placeholder=" "
        className={cn(
          "peer h-14 w-full rounded-2xl border border-input bg-background/60 px-4 pt-5 pb-1.5 text-[0.95rem] text-foreground outline-none transition-all",
          "focus:border-[var(--color-brand-dark)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--color-brand)_28%,transparent)]",
          "hover:border-foreground/25"
        )}
      />
      <label
        htmlFor={id}
        className={cn(
          "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[0.95rem] text-muted-foreground transition-all",
          "peer-focus:top-3.5 peer-focus:translate-y-0 peer-focus:text-[0.7rem] peer-focus:font-semibold peer-focus:tracking-wide peer-focus:text-[var(--color-brand-dark)]",
          "peer-[:not(:placeholder-shown)]:top-3.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[0.7rem] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:tracking-wide"
        )}
      >
        {label}
        {required && <span className="ml-0.5 text-[var(--color-brand-dark)]">*</span>}
      </label>
    </div>
  );
}

export function ContactForm() {
  const [state, formAction, pending] = useActionState<FormActionState | null, FormData>(
    submitContact,
    null
  );
  const [topic, setTopic] = useState<string>(TOPICS[0].value);
  const [count, setCount] = useState(0);

  if (state?.ok) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-[color-mix(in_srgb,var(--color-brand)_45%,var(--border))] bg-[var(--color-brand-light)] px-6 py-14 text-center dark:bg-[color-mix(in_srgb,var(--color-brand)_12%,transparent)]">
        <CircleCheck className="size-12 text-[var(--color-brand-dark)]" aria-hidden="true" />
        <h3 className="font-heading text-xl font-bold">Message on its way</h3>
        <p className="max-w-sm text-sm text-muted-foreground">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      {/* Topic selector — pick the reason first */}
      <fieldset>
        <legend className="mb-3 text-[0.7rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
          What is this about?
        </legend>
        <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Reason for contact">
          {TOPICS.map((t) => {
            const active = topic === t.value;
            return (
              <button
                key={t.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setTopic(t.value)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                  active
                    ? "border-[color-mix(in_srgb,var(--color-brand),#000_22%)] bg-[var(--color-brand)] text-[var(--color-brand-ink)] shadow-[0_6px_16px_-8px_rgba(163,197,33,0.6)]"
                    : "border-border bg-transparent text-foreground/70 hover:border-foreground/25 hover:text-foreground"
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <input type="hidden" name="subject" value={topic} />
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="contact-name" name="name" label="Your name" required autoComplete="name" />
        <Field
          id="contact-email"
          name="email"
          type="email"
          label="Email address"
          required
          autoComplete="email"
        />
      </div>

      {/* Message with floating label + live counter */}
      <div className="group relative">
        <textarea
          id="contact-message"
          name="message"
          required
          rows={6}
          maxLength={MESSAGE_MAX}
          onChange={(e) => setCount(e.target.value.length)}
          placeholder=" "
          className={cn(
            "peer w-full resize-none rounded-2xl border border-input bg-background/60 px-4 pt-6 pb-3 text-[0.95rem] text-foreground outline-none transition-all",
            "focus:border-[var(--color-brand-dark)] focus:ring-4 focus:ring-[color-mix(in_srgb,var(--color-brand)_28%,transparent)]",
            "hover:border-foreground/25"
          )}
        />
        <label
          htmlFor="contact-message"
          className={cn(
            "pointer-events-none absolute left-4 top-5 text-[0.95rem] text-muted-foreground transition-all",
            "peer-focus:top-3 peer-focus:text-[0.7rem] peer-focus:font-semibold peer-focus:tracking-wide peer-focus:text-[var(--color-brand-dark)]",
            "peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:text-[0.7rem] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:tracking-wide"
          )}
        >
          Your message<span className="ml-0.5 text-[var(--color-brand-dark)]">*</span>
        </label>
        <span className="pointer-events-none absolute right-4 bottom-3 text-[0.7rem] tabular-nums text-muted-foreground">
          {count.toLocaleString("en-ZA")} / {MESSAGE_MAX.toLocaleString("en-ZA")}
        </span>
      </div>

      {/* Honeypot — hidden from humans, catnip for bots */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          disabled={pending}
          className="btn-glossy btn-glossy-dark inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowRight className="size-4" />
          )}
          Send message
        </button>
        <p className="text-xs text-muted-foreground">
          Typical reply within two business days.
        </p>
      </div>

      {state && !state.ok && (
        <p role="status" className="text-sm text-amber-600 dark:text-amber-400">
          {state.message}
        </p>
      )}
    </form>
  );
}
