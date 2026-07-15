import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Primary CTA — glossy rounded rectangle driven by the shared .btn-glossy
 * shell (glass sheen, bezel, pillowed edges).
 * Renders an anchor when `href` is provided, otherwise a button.
 */
type GlossyButtonProps = {
  href?: string;
  className?: string;
  variant?: "brand" | "dark" | "white";
  children: React.ReactNode;
} & (
  | React.AnchorHTMLAttributes<HTMLAnchorElement>
  | React.ButtonHTMLAttributes<HTMLButtonElement>
);

const VARIANTS = {
  brand: "btn-glossy",
  dark: "btn-glossy btn-glossy-dark",
  white: "btn-glossy btn-glossy-white",
} as const;

export function GlossyButton({
  href,
  className,
  variant = "brand",
  children,
  ...props
}: GlossyButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 px-6 py-3 text-sm select-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    VARIANTS[variant],
    className
  );

  const inner = <span className="relative z-10 inline-flex items-center gap-2">{children}</span>;

  if (href) {
    return (
      <a href={href} className={classes} {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {inner}
      </a>
    );
  }
  return (
    <button className={classes} {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
      {inner}
    </button>
  );
}
