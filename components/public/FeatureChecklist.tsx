import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function FeatureChecklist({
  features,
  accent = "var(--color-brand)",
  columns = 2,
  className,
}: {
  features: string[];
  accent?: string;
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  if (features.length === 0) return null;
  return (
    <ul
      className={cn(
        "grid gap-x-8 gap-y-3",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {features.map((feature) => (
        <li key={feature} className="flex items-start gap-2.5 text-sm">
          <CheckCircle2 className="mt-0.5 size-4.5 shrink-0" style={{ color: accent }} />
          <span className="text-foreground/85">{feature}</span>
        </li>
      ))}
    </ul>
  );
}
