import {
  Banknote,
  Calculator,
  Factory,
  HeartHandshake,
  Kanban,
  LayoutGrid,
  Users,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  calculator: Calculator,
  banknote: Banknote,
  users: Users,
  "heart-handshake": HeartHandshake,
  factory: Factory,
  kanban: Kanban,
};

export function CategoryIcon({
  icon,
  className,
}: {
  icon: string | null;
  className?: string;
}) {
  const Icon = (icon && ICONS[icon]) || LayoutGrid;
  return <Icon className={className} aria-hidden="true" />;
}
