import { BadgeCheck, ShieldCheck, Sparkles } from "lucide-react";

/** Trust markers displayed near review sections. */
export function VerifiedBadges() {
  const badges = [
    { icon: BadgeCheck, label: "Verified reviewers" },
    { icon: ShieldCheck, label: "No vendor-paid rankings" },
    { icon: Sparkles, label: "Independent editorial" },
  ];
  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {badges.map(({ icon: Icon, label }) => (
        <li
          key={label}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
        >
          <Icon className="size-4 text-[var(--color-brand-dark)]" />
          {label}
        </li>
      ))}
    </ul>
  );
}
