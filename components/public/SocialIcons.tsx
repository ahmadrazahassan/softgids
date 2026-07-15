import { cn } from "@/lib/utils";

const icons = {
  facebook: (
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.026 1.792-4.697 4.533-4.697 1.313 0 2.686.235 2.686.235v2.971h-1.513c-1.491 0-1.956.93-1.956 1.886v2.265h3.328l-.532 3.49h-2.796V24C18.612 23.094 24 18.1 24 12.073Z" />
  ),
  linkedin: (
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125ZM7.119 20.452H3.555V9h3.564v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z" />
  ),
  x: (
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932Zm-1.291 19.491h2.039L6.486 3.24H4.298l13.312 17.404Z" />
  ),
};

export function SocialIcons({
  className,
  invert = false,
  links,
}: {
  className?: string;
  invert?: boolean;
  links?: Partial<Record<keyof typeof icons, string>>;
}) {
  const entries: Array<{ key: keyof typeof icons; label: string; href: string }> = [
    { key: "facebook", label: "Facebook", href: links?.facebook || "https://facebook.com" },
    { key: "linkedin", label: "LinkedIn", href: links?.linkedin || "https://linkedin.com" },
    { key: "x", label: "X (Twitter)", href: links?.x || "https://x.com" },
  ];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {entries.map(({ key, label, href }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className={cn(
            "grid size-9 place-items-center rounded-full border transition-colors",
            invert
              ? "border-white/15 text-zinc-300 hover:bg-white/10 hover:text-white"
              : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
          )}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
            {icons[key]}
          </svg>
        </a>
      ))}
    </div>
  );
}
