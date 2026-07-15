"use client";

import { useActionState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import {
  deleteResource,
  saveResource,
  type AdminActionState,
} from "@/app/(admin)/admin/actions";
import type { FieldSpec } from "@/lib/admin/resources";

export interface SelectOption {
  value: string;
  label: string;
}

const inputClass =
  "w-full rounded-[0.875rem] border border-zinc-200/80 bg-background px-3.5 py-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:border-zinc-700";

function FieldControl({
  field,
  value,
  options,
}: {
  field: FieldSpec;
  value: unknown;
  options?: SelectOption[];
}) {
  const common = { id: field.name, name: field.name, required: field.required };

  switch (field.type) {
    case "checkbox":
      return (
        <input
          type="checkbox"
          id={field.name}
          name={field.name}
          defaultChecked={Boolean(value)}
          className="size-4 accent-[var(--color-brand-dark)]"
        />
      );
    case "textarea":
    case "html":
    case "json": {
      const text =
        field.type === "json"
          ? JSON.stringify(value ?? [], null, 2)
          : ((value as string) ?? "");
      return (
        <textarea
          {...common}
          rows={field.rows ?? 4}
          defaultValue={text}
          className={`${inputClass} ${field.type !== "textarea" ? "font-mono text-xs" : ""}`}
        />
      );
    }
    case "select": {
      const list =
        options ?? (field.options ?? []).map((option) => ({ value: option, label: option }));
      return (
        <select {...common} defaultValue={(value as string) ?? ""} className={inputClass}>
          {!field.required && <option value="">None</option>}
          {list.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }
    case "number":
      return (
        <input
          {...common}
          type="number"
          step="any"
          defaultValue={value == null ? "" : String(value)}
          className={inputClass}
        />
      );
    case "date":
      return (
        <input
          {...common}
          type="date"
          defaultValue={value ? String(value).slice(0, 10) : ""}
          className={inputClass}
        />
      );
    case "color":
      return (
        <input
          {...common}
          type="text"
          placeholder="#1ab4d7"
          defaultValue={(value as string) ?? ""}
          className={inputClass}
        />
      );
    default:
      return (
        <input
          {...common}
          type="text"
          defaultValue={(value as string) ?? ""}
          className={inputClass}
        />
      );
  }
}

/**
 * Generic admin form driven by the resource registry. `selectOptions` lets a
 * page inject relational choices (e.g. category or software dropdowns).
 */
export function ResourceForm({
  resourceKey,
  fields,
  record,
  selectOptions = {},
}: {
  resourceKey: string;
  fields: FieldSpec[];
  record: Record<string, unknown> | null;
  selectOptions?: Record<string, SelectOption[]>;
}) {
  const [state, formAction, pending] = useActionState<AdminActionState | null, FormData>(
    saveResource,
    null
  );
  const id = (record?.id as string) ?? "";

  return (
    <form action={formAction} className="max-w-3xl space-y-5">
      <input type="hidden" name="_resource" value={resourceKey} />
      <input type="hidden" name="_id" value={id} />

      {fields.map((field) => (
        <div key={field.name} className="space-y-1.5">
          <label htmlFor={field.name} className="block text-xs font-semibold text-muted-foreground">
            {field.label}
            {field.required && <span className="text-[var(--color-error)]"> *</span>}
          </label>
          <FieldControl
            field={field}
            value={record?.[field.name]}
            options={selectOptions[field.name]}
          />
          {field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>}
        </div>
      ))}

      <div className="flex items-center gap-3 border-t border-zinc-200/70 pt-5 dark:border-zinc-800">
        <button
          type="submit"
          disabled={pending}
          className="btn-glossy inline-flex items-center gap-2 px-6 py-2.5 text-sm disabled:opacity-60"
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          Save
        </button>
        {id && (
          <button
            type="submit"
            formAction={deleteResource}
            formNoValidate
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-[0.875rem] px-4 py-2.5 text-sm font-semibold text-[var(--color-error)] transition-colors hover:bg-red-50 dark:hover:bg-red-950/40"
            onClick={(event) => {
              if (!confirm("Delete this record? This cannot be undone.")) {
                event.preventDefault();
              }
            }}
          >
            <Trash2 className="size-4" /> Delete
          </button>
        )}
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
