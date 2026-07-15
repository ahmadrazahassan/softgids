import Link from "next/link";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function AffiliateDisclosureNote({ className }: { className?: string }) {
  return (
    <p className={cn("flex items-start gap-1.5 text-xs text-muted-foreground", className)}>
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <span>
        We may earn a commission when you buy via this link — at no extra cost to you. It never
        affects our ratings.{" "}
        <Link href="/affiliate-disclosure" className="underline underline-offset-2 hover:text-foreground">
          How we make money
        </Link>
      </span>
    </p>
  );
}
