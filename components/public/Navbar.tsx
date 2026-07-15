"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { FileText, Layers, Menu, Search, X } from "lucide-react";
import { BrandLogo } from "@/components/public/BrandLogo";
import { GlossyButton } from "@/components/public/GlossyButton";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { CONTACT_EMAIL } from "@/lib/site";
import { cn } from "@/lib/utils";

export interface NavSearchIndex {
  software: Array<{ name: string; slug: string; category: string | null }>;
  articles: Array<{ title: string; slug: string }>;
}

const LINKS = [
  { label: "Software Reviews", href: "/software" },
  { label: "Categories", href: "/categories" },
  { label: "Compare", href: "/compare" },
  { label: "Blog", href: "/blog" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/software") {
    return pathname.startsWith("/software") || pathname.startsWith("/search");
  }
  if (href === "/categories") {
    return pathname.startsWith("/categories") || pathname.startsWith("/category");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar({ searchIndex }: { searchIndex: NavSearchIndex }) {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = React.useState(false);
  const [hidden, setHidden] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [pill, setPill] = React.useState<{ left: number; width: number } | null>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  /* Frosted background once the page scrolls; hide on scroll-down, show on scroll-up */
  React.useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      setHidden(y > 120 && y > lastY);
      lastY = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Animated active-route pill: measure the active link and slide */
  const measure = React.useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const active = list.querySelector<HTMLAnchorElement>("[data-active='true']");
    if (!active) {
      setPill(null);
      return;
    }
    const listRect = list.getBoundingClientRect();
    const rect = active.getBoundingClientRect();
    setPill({ left: rect.left - listRect.left, width: rect.width });
  }, []);

  React.useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure, pathname]);

  /* Let sticky page elements (e.g. ProfileNav) react to the header hiding */
  React.useEffect(() => {
    document.documentElement.toggleAttribute("data-header-hidden", hidden && !mobileOpen);
  }, [hidden, mobileOpen]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 pt-3 transition-transform duration-300",
          hidden && !mobileOpen ? "-translate-y-[130%]" : "translate-y-0"
        )}
      >
        <div className="container-site">
          {/* Floating capsule — frosted card once the page scrolls */}
          <div
            className={cn(
              "flex h-14 items-center justify-between gap-4 rounded-2xl border px-3 transition-all duration-300 sm:px-4",
              scrolled || mobileOpen
                ? "border-zinc-200/70 bg-background/85 shadow-[0_16px_40px_-20px_rgba(15,23,42,0.25)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/70 dark:border-zinc-800"
                : "border-transparent bg-transparent"
            )}
          >
            <BrandLogo />

            <nav aria-label="Primary" className="hidden lg:block">
              <div ref={listRef} className="relative flex items-center gap-1">
                {pill && (
                  <span
                    aria-hidden="true"
                    className="absolute top-1/2 h-9 -translate-y-1/2 rounded-full bg-accent transition-all duration-300 ease-out"
                    style={{ left: pill.left, width: pill.width }}
                  />
                )}
                {LINKS.map((link) => {
                  const active = isActive(pathname, link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      data-active={active}
                      className={cn(
                        "relative z-10 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                        active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </nav>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Search"
                onClick={() => setSearchOpen(true)}
                className="grid size-9 cursor-pointer place-items-center rounded-xl bg-zinc-100 text-muted-foreground transition-colors hover:bg-[var(--color-brand)] hover:text-[var(--color-brand-ink)] dark:bg-zinc-800"
              >
                <Search className="size-4" />
              </button>
              <GlossyButton
                href={`mailto:${CONTACT_EMAIL}?subject=List%20our%20software%20on%20Stack%20Match`}
                className="hidden h-9 px-4 py-0 sm:inline-flex"
              >
                List your software
              </GlossyButton>
              <button
                type="button"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen((v) => !v)}
                className="grid size-9 cursor-pointer place-items-center rounded-xl bg-zinc-100 text-muted-foreground transition-colors hover:bg-[var(--color-brand)] hover:text-[var(--color-brand-ink)] lg:hidden dark:bg-zinc-800"
              >
                {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
              </button>
            </div>
          </div>

          {/* Mobile drawer — floating card under the capsule */}
          {mobileOpen && (
            <nav
              aria-label="Mobile"
              className="mt-2 rounded-2xl border border-zinc-200/70 bg-background/95 p-3 shadow-[0_24px_48px_-20px_rgba(15,23,42,0.3)] backdrop-blur-xl lg:hidden dark:border-zinc-800"
            >
              <div className="flex flex-col gap-1">
                {LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                      isActive(pathname, link.href)
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                <GlossyButton
                  href={`mailto:${CONTACT_EMAIL}?subject=List%20our%20software%20on%20Stack%20Match`}
                  className="mt-2 justify-center"
                >
                  List your software
                </GlossyButton>
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Command-style search overlay */}
      <CommandDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        title="Search SoftGids"
        description="Search software and articles"
      >
        <CommandInput placeholder="Search software, categories, articles…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Software">
            {searchIndex.software.map((item) => (
              <CommandItem
                key={item.slug}
                value={`${item.name} ${item.category ?? ""}`}
                onSelect={() => {
                  setSearchOpen(false);
                  router.push(`/software/${item.slug}`);
                }}
              >
                <Layers className="text-muted-foreground" />
                <span>{item.name}</span>
                {item.category && (
                  <span className="ml-auto text-xs text-muted-foreground">{item.category}</span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Articles">
            {searchIndex.articles.map((item) => (
              <CommandItem
                key={item.slug}
                value={item.title}
                onSelect={() => {
                  setSearchOpen(false);
                  router.push(`/blog/${item.slug}`);
                }}
              >
                <FileText className="text-muted-foreground" />
                <span className="line-clamp-1">{item.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
