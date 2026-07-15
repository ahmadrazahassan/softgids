"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { unsubscribeNewsletter, type FormActionState } from "@/app/(public)/newsletter/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function NewsletterUnsubscribeForm({ defaultEmail }: { defaultEmail?: string }) {
  const [state, formAction, pending] = useActionState<FormActionState | null, FormData>(
    unsubscribeNewsletter,
    null
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="unsubscribe-email">Email address</Label>
        <Input
          id="unsubscribe-email"
          type="email"
          name="email"
          required
          defaultValue={defaultEmail}
          placeholder="you@company.co.za"
        />
      </div>
      <Button type="submit" variant="destructive" disabled={pending} className="w-full">
        {pending && <Loader2 className="size-4 animate-spin" />}
        Unsubscribe
      </Button>
      {state && (
        <p
          role="status"
          className={cn(
            "text-sm",
            state.ok ? "text-[var(--color-brand-dark)]" : "text-amber-600 dark:text-amber-400"
          )}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
