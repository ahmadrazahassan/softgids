import Link from "next/link";
import { LogoMark } from "@/components/public/BrandLogo";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="space-y-6 text-center">
        <LogoMark className="mx-auto size-14" />
        <p className="font-heading text-7xl font-extrabold tracking-tight">404</p>
        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-bold">Page not found</h1>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            The page you&apos;re after has moved, been unpublished, or never existed. Let&apos;s
            get you back to the good stuff.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="btn-glossy inline-flex items-center px-5 py-2.5 text-sm"
          >
            Back home
          </Link>
          <Link
            href="/software"
            className="rounded-2xl border border-border px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-accent"
          >
            Browse software
          </Link>
        </div>
      </div>
    </div>
  );
}
