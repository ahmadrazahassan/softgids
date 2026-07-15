import { Badge } from "@/components/ui/badge";

const styles: Record<string, { variant: "success" | "muted" | "amber" | "destructive"; label: string }> = {
  published: { variant: "success", label: "Published" },
  draft: { variant: "muted", label: "Draft" },
  hidden: { variant: "amber", label: "Hidden" },
  pending: { variant: "amber", label: "Pending" },
  confirmed: { variant: "success", label: "Confirmed" },
  unsubscribed: { variant: "muted", label: "Unsubscribed" },
};

export function StatusBadge({ status }: { status: string }) {
  const style = styles[status] ?? { variant: "muted" as const, label: status };
  return <Badge variant={style.variant}>{style.label}</Badge>;
}
