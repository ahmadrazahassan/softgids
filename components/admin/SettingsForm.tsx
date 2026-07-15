"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { saveSettings, type AdminActionState } from "@/app/(admin)/admin/actions";

export function SettingsForm({
  settings,
}: {
  settings: Array<{ key: string; value: string | null }>;
}) {
  const [state, formAction, pending] = useActionState<AdminActionState | null, FormData>(
    saveSettings,
    null
  );

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      {settings.map((setting) => (
        <div key={setting.key} className="space-y-1.5">
          <label
            htmlFor={`setting-${setting.key}`}
            className="block text-xs font-semibold text-muted-foreground"
          >
            {setting.key}
          </label>
          <input
            id={`setting-${setting.key}`}
            name={setting.key}
            type="text"
            defaultValue={setting.value ?? ""}
            className="w-full rounded-[0.875rem] border border-zinc-200/80 bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:border-zinc-700"
          />
        </div>
      ))}
      <div className="flex items-center gap-3 border-t border-zinc-200/70 pt-5 dark:border-zinc-800">
        <button
          type="submit"
          disabled={pending}
          className="btn-glossy inline-flex items-center gap-2 px-6 py-2.5 text-sm disabled:opacity-60"
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          Save settings
        </button>
        {state && (
          <p
            role="status"
            className={`text-sm ${state.ok ? "text-[var(--color-brand-dark)]" : "text-[var(--color-error)]"}`}
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
