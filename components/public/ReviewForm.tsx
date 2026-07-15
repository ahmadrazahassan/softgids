"use client";

import { useActionState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { submitReview } from "@/app/(public)/software/[slug]/reviews/new/actions";
import type { FormActionState } from "@/app/(public)/newsletter/actions";
import { StarSelector } from "@/components/public/StarSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEFAULT_REVIEWER_COUNTRY, REVIEWER_COUNTRIES } from "@/lib/site";
import { cn } from "@/lib/utils";

const INDUSTRIES = [
  "Accounting",
  "Agriculture",
  "Construction & Trades",
  "Education",
  "Energy",
  "Financial Services",
  "Food & Beverage",
  "Healthcare",
  "Hospitality",
  "Legal",
  "Logistics",
  "Manufacturing",
  "Media & Marketing",
  "Mining",
  "Nonprofit",
  "Real Estate",
  "Retail",
  "Technology",
  "Travel & Tourism",
  "Wholesale",
  "Other",
];

const COMPANY_SIZES = [
  "1–10 employees",
  "11–50 employees",
  "51–200 employees",
  "201–500 employees",
  "500+ employees",
];

const DURATIONS = ["Less than 6 months", "6–12 months", "1–2 years", "2+ years"];

export function ReviewForm({
  softwareId,
  softwareName,
}: {
  softwareId: string;
  softwareName: string;
}) {
  const [state, formAction, pending] = useActionState<FormActionState | null, FormData>(
    submitReview,
    null
  );

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="software_id" value={softwareId} />

      {/* Ratings */}
      <section className="space-y-4 rounded-3xl border border-zinc-200 p-6 dark:border-zinc-800">
        <h2 className="font-heading text-lg font-bold">Your ratings</h2>
        <StarSelector name="overall_rating" label="Overall rating" required />
        <StarSelector name="ease_of_use" label="Ease of use" />
        <StarSelector name="value_for_money" label="Value for money" />
        <StarSelector name="customer_service" label="Customer service" />
        <StarSelector name="functionality" label="Functionality" />
      </section>

      {/* Review */}
      <section className="space-y-5 rounded-3xl border border-zinc-200 p-6 dark:border-zinc-800">
        <h2 className="font-heading text-lg font-bold">Your experience with {softwareName}</h2>
        <div className="space-y-2">
          <Label htmlFor="review_title">Review title *</Label>
          <Input
            id="review_title"
            name="review_title"
            required
            maxLength={160}
            placeholder="Sum up your experience in one line"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="summary">Your review *</Label>
          <Textarea
            id="summary"
            name="summary"
            required
            rows={5}
            minLength={30}
            placeholder="What do you use it for? How has it worked out — VAT201 season, payroll runs, day-to-day?"
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pros">What do you like most?</Label>
            <Textarea id="pros" name="pros" rows={3} placeholder="The highlights…" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cons">What could be better?</Label>
            <Textarea id="cons" name="cons" rows={3} placeholder="The frustrations…" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="used_for_duration">How long have you used it?</Label>
          <Select name="used_for_duration">
            <SelectTrigger id="used_for_duration" className="w-full">
              <SelectValue placeholder="Select duration" />
            </SelectTrigger>
            <SelectContent>
              {DURATIONS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* About you */}
      <section className="space-y-5 rounded-3xl border border-zinc-200 p-6 dark:border-zinc-800">
        <h2 className="font-heading text-lg font-bold">About you</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="reviewer_name">Your name *</Label>
            <Input id="reviewer_name" name="reviewer_name" required placeholder="Full name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reviewer_job_title">Job title</Label>
            <Input
              id="reviewer_job_title"
              name="reviewer_job_title"
              placeholder="e.g. Financial Manager"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reviewer_company">Company</Label>
            <Input id="reviewer_company" name="reviewer_company" placeholder="Company name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reviewer_country">Country</Label>
            <Select name="reviewer_country" defaultValue={DEFAULT_REVIEWER_COUNTRY}>
              <SelectTrigger id="reviewer_country" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REVIEWER_COUNTRIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reviewer_industry">Industry</Label>
            <Select name="reviewer_industry">
              <SelectTrigger id="reviewer_industry" className="w-full">
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((i) => (
                  <SelectItem key={i} value={i}>
                    {i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reviewer_company_size">Company size</Label>
            <Select name="reviewer_company_size">
              <SelectTrigger id="reviewer_company_size" className="w-full">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_SIZES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--color-brand-dark)]" />
          Your review is moderated before publication. We handle your details in line with POPIA
          — see our privacy policy.
        </p>
      </section>

      <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
        {pending && <Loader2 className="size-4 animate-spin" />}
        Submit review
      </Button>
      {state && (
        <p
          role="status"
          className={cn(
            "text-sm font-medium",
            state.ok ? "text-[var(--color-brand-dark)]" : "text-amber-600 dark:text-amber-400"
          )}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
