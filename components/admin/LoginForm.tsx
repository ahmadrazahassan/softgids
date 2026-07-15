"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { signIn, type AdminActionState } from "@/app/(admin)/admin/actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<AdminActionState | null, FormData>(
    signIn,
    null
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="admin-email" className="text-xs font-semibold text-zinc-400">
          Email
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          required
          autoComplete="username"
          className="h-11 w-full rounded-[0.875rem] border border-white/10 bg-white/[0.06] px-4 text-sm text-white outline-none placeholder:text-zinc-600 focus-visible:border-[var(--color-brand)]"
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="admin-password" className="text-xs font-semibold text-zinc-400">
          Password
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="h-11 w-full rounded-[0.875rem] border border-white/10 bg-white/[0.06] px-4 text-sm text-white outline-none placeholder:text-zinc-600 focus-visible:border-[var(--color-brand)]"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="btn-glossy inline-flex h-11 w-full items-center justify-center gap-2 text-sm disabled:opacity-60"
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        Sign in
      </button>
      {state && !state.ok && <p className="text-sm text-amber-400">{state.message}</p>}
    </form>
  );
}
