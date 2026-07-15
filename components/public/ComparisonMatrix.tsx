import { Check, Minus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Software } from "@/lib/types";

/** Feature-by-feature yes/no matrix across both products. */
export function ComparisonMatrix({ a, b }: { a: Software; b: Software }) {
  const allFeatures = [...new Set([...a.features, ...b.features])];
  if (allFeatures.length === 0) return null;

  const has = (software: Software, feature: string) => software.features.includes(feature);

  return (
    <div className="overflow-hidden rounded-[1.4rem] border border-zinc-200/70 bg-card dark:border-zinc-800">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/60">
            <TableHead className="min-w-52">Feature</TableHead>
            <TableHead className="text-center font-heading font-bold text-foreground">
              {a.name}
            </TableHead>
            <TableHead className="text-center font-heading font-bold text-foreground">
              {b.name}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allFeatures.map((feature) => (
            <TableRow key={feature}>
              <TableCell className="text-sm text-muted-foreground">{feature}</TableCell>
              {[a, b].map((software) => (
                <TableCell key={software.id} className="text-center">
                  {has(software, feature) ? (
                    <Check
                      className="inline size-4 text-[var(--color-brand-dark)]"
                      aria-label={`${software.name}: included`}
                    />
                  ) : (
                    <Minus
                      className="inline size-4 text-zinc-300 dark:text-zinc-700"
                      aria-label={`${software.name}: not included`}
                    />
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
