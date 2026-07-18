# FRONTEND SPECIFICATION
## Independent Business Software Review & Comparison Platform — United States & Canada

> **Purpose of this document.** This is a complete, implementation ready frontend specification derived by reading a live production codebase (a South African software review platform, brand "SoftGids"). A developer or AI agent should be able to rebuild the entire frontend from an empty folder using only this file.
>
> **The visual system is fixed.** Clone the design 1:1. Every hex value, radius, font weight and layout rule below is taken from the real source, not invented.
>
> **The market is not fixed.** Every South African signal (SARS, VAT201, POPIA, ZAR, `en-ZA`, `.co.za`, Afrikaans branding) is replaced with the correct US and Canada equivalent. Localization rules are called out inline and summarized in §12.

---

## Table of contents

1. [Product overview and target audience](#1-product-overview-and-target-audience)
2. [Tech stack](#2-tech-stack)
3. [Design system](#3-design-system)
4. [Route map](#4-route-map)
5. [Page by page layout breakdown](#5-page-by-page-layout-breakdown)
6. [Component library](#6-component-library)
7. [Responsive behavior](#7-responsive-behavior)
8. [Accessibility](#8-accessibility)
9. [SEO and metadata](#9-seo-and-metadata)
10. [Copywriting voice and tone](#10-copywriting-voice-and-tone)
11. [Known issues and improvements](#11-known-issues-and-improvements)
12. [Localization checklist](#12-localization-checklist)

---

## 1. Product overview and target audience

### 1.1 What the product is

An **independent, editorially neutral software review and comparison platform**. It is the G2 / Capterra pattern, but narrow and opinionated: a curated directory of business software, every product carrying verified user reviews, transparent pricing in local currency, side by side comparisons, and long form buying guides.

Revenue is affiliate based. The platform's entire credibility rests on one promise, stated on the page itself: **vendors cannot buy rankings, ratings or verdicts.** Ratings are computed automatically from verified reviews. This is a product constraint, not marketing copy, and it must survive the rebuild.

### 1.2 Core jobs the site does

| Job | Where it lives |
|---|---|
| Discover software by category | `/`, `/categories`, `/category/[slug]` |
| Browse and filter the full directory | `/software` |
| Evaluate one product deeply | `/software/[slug]` |
| Read the unfiltered review archive | `/software/[slug]/reviews` |
| Contribute a review | `/software/[slug]/reviews/new` |
| Compare two products head to head | `/compare`, `/compare/[pair]` |
| Find alternatives | `/software/[slug]/alternatives` |
| Learn via guides | `/blog`, `/blog/[slug]` |
| Trust the platform | `/about`, `/editorial-policy`, `/affiliate-disclosure` |

### 1.3 Target audience (US and Canada)

**Primary:** owners, operators, office managers, controllers and bookkeepers at small and mid sized businesses (roughly 1 to 200 employees) in the United States and Canada, choosing business software they will pay for monthly and live in daily.

**Secondary:** accountants, bookkeepers and fractional CFOs who recommend or implement software for a book of clients. This audience is disproportionately influential and should be addressed directly in accounting and payroll content.

**The core pain the site solves.** The original South African product existed because buyers kept landing on glowing reviews that quietly assumed a different country: prices in the wrong currency, tax advice about a foreign revenue service, payroll features that had never heard of the local filings. The rebuild must not reintroduce that gap for a North American reader.

### 1.4 The market decision: North America (DECIDED)

**The product serves North America as a single market.** One site, one voice, one currency, no region switcher. This decision is made and the rest of this document assumes it.

| Setting | Value |
|---|---|
| Market framing | North America (United States and Canada) |
| Locale | `en-US` (single) |
| Currency | `USD` (single display currency) |
| Spelling | US English throughout |
| Region switcher | **None.** Do not build one. |
| Audience phrase | "North American businesses" / "North American teams" |

**Why this holds up.** Nearly all B2B SaaS in this category lists in USD for both US and Canadian customers, so a single USD price is the vendor's real list price for a Canadian buyer too, not a conversion. `en-US` formatting (`4.4`, `$1,375`) is the correct and expected format across both countries.

**Where a single voice is still not an excuse for being vague.** Two things genuinely differ between the US and Canada, and the platform must handle both. This is not a positioning question:

1. **Compliance and legal pages are governed by where the *user* is, not by how you market.** If a Canadian subscribes, CASL applies. If a Californian visits, CCPA/CPRA applies. So:
   - **Email: design to CASL.** It is the stricter of the two (express opt in, identification, unsubscribe honoured within 10 business days). Building to CASL keeps the existing double opt in flow and satisfies CAN-SPAM automatically. Do not build to CAN-SPAM alone.
   - **Privacy pages must cover both** CCPA/CPRA (and other US state laws), PIPEDA, and Quebec Law 25. Name both regulators: the FTC and the Office of the Privacy Commissioner of Canada.
   - **Affiliate disclosure follows the FTC endorsement guides**, and the Canadian Competition Act says substantially the same thing. One disclosure satisfies both.

2. **Product content in tax adjacent categories must name both regimes.** In accounting and payroll especially, a review that only mentions the IRS is useless to a Canadian reader and reads as exactly the "written elsewhere" problem this product exists to fix. Where it matters, name both:

| Topic | United States | Canada |
|---|---|---|
| Tax authority | IRS, IRS e-file | CRA, My Business Account |
| Sales tax | State and local sales tax, economic nexus | GST / HST / PST, per province |
| Payroll filings | Form 941, W-2, 1099-NEC | T4, ROE, CPP, EI |
| Year end | W-2 / 1099 season | T4 season |

**The practical rule:** a single `en-US`, USD, North America voice for all chrome, navigation, marketing and general copy. Where a fact is country specific (a filing, a regulator, a tax form), state both. Never blur them into a fake "North American tax return" that does not exist.

**Out of scope for v1:** `fr-CA` for Quebec, CAD display pricing, per province tax detail pages. If a vendor genuinely lists in CAD, label the price explicitly rather than converting it.

---

## 2. Tech stack

Exact versions from the source `package.json`. Pin these.

### 2.1 Runtime and framework

| Package | Version | Why it is here |
|---|---|---|
| `next` | `16.2.10` | App Router, React Server Components, ISR via `revalidate`, route handlers, `next/og`, metadata API, `next/font`. **Note: this is a recent Next major. Read the docs in `node_modules/next/dist/docs/` before assuming API shapes from older versions.** |
| `react` / `react-dom` | `19.2.4` | Server Components, `use client` boundaries, async components |
| `typescript` | `^5` | Strict typing across the domain model |

### 2.2 Styling

| Package | Version | Why |
|---|---|---|
| `tailwindcss` | `^4` | **Tailwind v4**, CSS first config. There is no `tailwind.config.js`. All tokens are declared in `app/globals.css` via `@theme inline`. |
| `@tailwindcss/postcss` | `^4` | PostCSS plugin, the only build wiring |
| `tw-animate-css` | `^1.4.0` | Animation utility layer, imported at the top of `globals.css` |
| `tailwind-merge` | `^3.6.0` | Conflict safe class merging inside `cn()` |
| `clsx` | `^2.1.1` | Conditional classes inside `cn()` |
| `class-variance-authority` | `^0.7.1` | Typed variant APIs for `Button`, `Badge` |

### 2.3 UI primitives and interaction

| Package | Version | Why |
|---|---|---|
| `radix-ui` | `^1.6.2` | Unified Radix package (not the per primitive `@radix-ui/react-*` packages). Supplies Dialog, Popover, Select, Tabs, Dropdown, Tooltip, Switch, Checkbox, Separator, ScrollArea, Avatar, Progress, NavigationMenu, AlertDialog, Slot. |
| `lucide-react` | `^1.24.0` | The only icon set. |
| `cmdk` | `^1.1.1` | Command palette powering the header search overlay |
| `embla-carousel-react` | `^8.6.0` | Screenshot carousel |
| `recharts` | `^3.9.2` | Rating dimension chart, company size chart |
| `sonner` | `^2.0.7` | Toasts |
| `next-themes` | `^0.4.6` | Theme provider. **Currently pinned to light via `forcedTheme`.** |

### 2.4 Data and platform

| Package | Version | Why |
|---|---|---|
| `@supabase/supabase-js` | `^2.110.2` | Database client |
| `@supabase/ssr` | `^0.12.0` | Cookie aware server/browser clients |
| `server-only` | `^0.0.1` | Poisons server modules if imported client side |
| `@vercel/analytics` | `^2.0.1` | Page analytics, mounted in the root layout |
| `tsx` | `^4.23.0` | Runs the TypeScript seed scripts |

### 2.5 Build config

`next.config.ts` is deliberately minimal:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage (logos, screenshots, avatars, article images)
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
};

export default nextConfig;
```

Add remote patterns for any new asset host. Keep it this small.

### 2.6 Icon policy (hard rule)

Icons must be **literal and content matched**. Pick the icon that names the thing: `Camera` for screenshots, `PiggyBank` for pricing, `ListChecks` for features, `BarChart3` for ratings, `Scale` for head to head, `CircleHelp` for FAQ, `MailCheck` for newsletter, `Clock3` for recent, `BadgeCheck` for verified.

**Never use `Sparkles`, `Zap`, `Rocket`, `Lightbulb` or `Wand`.** They read as AI generated filler and are banned from this design system.

---

## 3. Design system

Everything in this section lives in **`app/globals.css`**. There is no Tailwind config file. Reproduce this file close to verbatim.

### 3.1 File preamble

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));
```

### 3.2 Brand palette

The brand is **lime on white**, not the green most people assume. The critical rule, written in the source as a comment: *lime is a light colour, use it for FILLS with dark ink on top; `brand-dark` is the readable olive ink for text on white.*

```css
:root {
  --color-brand:        #d9f65f; /* lime — fills only */
  --color-brand-strong: #c9ec3e; /* hover fill */
  --color-brand-ink:    #1a2008; /* text ON lime */
  --color-brand-dark:   #4c5f0a; /* olive — brand text on white */
  --color-brand-light:  #f3fbd3; /* tint surface */
  --color-navy:         #1b1f3b;
  --color-amber:        #f5a623;
  --color-amber-dark:   #e0941a;
  --color-success:      #10b981;
  --color-warning:      #f59e0b;
  --color-error:        #ef4444;
  --color-star:         #f5a623;
}
```

**Contrast discipline (do not violate):**
- Lime `#d9f65f` on white is roughly 1.2:1. It is **never** a text colour and **never** a lone icon colour on a light surface.
- Brand text on white is always `--color-brand-dark` (`#4c5f0a`).
- Text on a lime fill is always `--color-brand-ink` (`#1a2008`).
- Stars use `--color-star` (`#f5a623`), never lime.

### 3.3 Semantic tokens — light (authoritative)

```css
--background: #ffffff;
--foreground: #111827;
--card: #ffffff;
--card-foreground: #111827;
--popover: #ffffff;
--popover-foreground: #111827;
--primary: #d9f65f;
--primary-foreground: #1a2008;
--secondary: #1b1f3b;
--secondary-foreground: #ffffff;
--muted: #f9fafb;
--muted-foreground: #6b7280;
--accent: #f3f4f6;
--accent-foreground: #111827;
--destructive: #ef4444;
--destructive-foreground: #ffffff;
--border: #e5e7eb;
--input: #e5e7eb;
--ring: #b6d43a;
--radius: 0.5rem;
```

### 3.4 Semantic tokens — dark (present but dormant)

A full dark palette exists under `.dark`. Two brand tokens intentionally **flip** so brand text stays legible on dark:

```css
.dark {
  --color-brand-dark:  #d9f65f; /* olive ink flips to lime */
  --color-brand-light: #2c3512;

  --background: #0c0e14;
  --foreground: #f4f4f5;
  --card: #12141d;
  --popover: #12141d;
  --primary: #d9f65f;
  --primary-foreground: #1a2008;
  --secondary: #262b4d;
  --muted: #181b26;
  --muted-foreground: #9ca3af;
  --accent: #1d2130;
  --border: #262a38;
  --input: #262a38;
  --ring: #d9f65f;
}
```

**Theme authority:** the root layout hard pins light:

```tsx
<ThemeProvider attribute="class" forcedTheme="light" enableSystem={false}>
```

So **light is the only shipped theme.** Every `dark:` utility in the codebase is currently dead code. See §11 — decide deliberately whether to finish dark mode or delete it.

### 3.5 Charts and admin sidebar tokens

```css
/* Charts — light */
--chart-1: #a4c521;  --chart-2: #1b1f3b;  --chart-3: #f5a623;
--chart-4: #10b981;  --chart-5: #6b7280;

/* Admin sidebar — light */
--sidebar: #1b1f3b;            --sidebar-foreground: #e5e7eb;
--sidebar-primary: #d9f65f;    --sidebar-primary-foreground: #1a2008;
--sidebar-accent: #262b4d;     --sidebar-accent-foreground: #ffffff;
--sidebar-border: #2c3157;     --sidebar-ring: #b6d43a;
```

### 3.6 Typography

Three Google fonts loaded via `next/font/google` in `app/layout.tsx`, exposed as CSS variables on `<html>`:

```ts
const dmSans     = DM_Sans({    variable: "--font-dm-sans",     subsets: ["latin"], weight: ["400","500","700"] });
const inter      = Inter({      variable: "--font-inter",       subsets: ["latin"], weight: ["400","500","600","700"] });
const interTight = Inter_Tight({variable: "--font-inter-tight", subsets: ["latin"], weight: ["400","500","600","700","800","900"] });
```

Mapped in `@theme inline`:

```css
--font-sans:    var(--font-dm-sans), var(--font-inter), sans-serif;
--font-heading: var(--font-inter-tight), var(--font-inter), sans-serif;
--font-outfit:  var(--font-inter-tight), var(--font-inter), sans-serif; /* legacy alias */
--font-mono:    ui-monospace, monospace;
```

Global element defaults:

```css
body { font-family: var(--font-sans); }
h1,h2,h3,h4,h5,h6 { font-family: var(--font-heading); }
```

**Rule: body copy is DM Sans, every heading is Inter Tight.** Headings use `tracking-tight`, and long headings use `text-balance`; long paragraphs use `text-pretty`.

#### Observed type scale

| Role | Classes | Renders |
|---|---|---|
| Hero H1 (home) | `text-[2rem] leading-[1.1] font-extrabold sm:text-6xl lg:text-7xl` | 32px → 60px → 72px |
| Page H1 | `text-4xl font-bold sm:text-5xl sm:leading-[1.12]` | 36px → 48px |
| Section H2 (centered) | `text-3xl font-medium sm:text-[2.6rem] sm:leading-[1.18]` | 30px → 41.6px |
| Section H2 (bold variant) | `text-3xl font-bold sm:text-[2.75rem] sm:leading-[1.05]` | 30px → 44px |
| Card H3 | `font-heading text-lg font-bold tracking-tight` | 18px |
| Stat value | `font-heading text-2xl font-extrabold tabular-nums sm:text-3xl` | 24px → 30px |
| Body | `text-base leading-relaxed` | 16px / 1.625 |
| Small body | `text-sm leading-relaxed` | 14px |
| Eyebrow pill | `text-sm font-medium` | 14px |
| Micro label | `text-[0.65rem] font-bold tracking-widest uppercase` | 10.4px |
| Column heading (footer) | `text-[0.65rem] font-bold tracking-[0.18em] uppercase` | 10.4px |

**All numerals that can change (ratings, prices, counts, stats) use `tabular-nums`.** This is consistent across the codebase and prevents layout jitter.

### 3.7 The signature heading treatment

The most recognizable typographic device on the site: a **lime highlight chip** wrapping the final phrase of a section heading.

```tsx
<h2 className="font-heading text-3xl font-medium tracking-tight text-balance sm:text-[2.6rem] sm:leading-[1.18]">
  Popular comparisons,{" "}
  <span className="rounded-2xl bg-[var(--color-brand)] px-3 py-0.5 whitespace-nowrap text-[var(--color-brand-ink)]">
    side by side
  </span>
</h2>
```

Rules: `rounded-2xl`, `px-3 py-0.5`, `whitespace-nowrap`, lime fill, ink text. Used on the homepage, directory, about, compare, product profile and more. Reuse it verbatim.

### 3.8 The eyebrow pill

Every centered section opens with a pill above the heading:

```tsx
<p className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-foreground/80">
  <Camera className="size-4 text-muted-foreground" aria-hidden="true" />
  Screenshots
</p>
```

Homepage variant swaps the icon for a lime dot:

```tsx
<span aria-hidden="true" className="size-2 rounded-full bg-[var(--color-brand)]" />
```

### 3.9 Radius scale

```css
--radius: 0.5rem;
--radius-sm:  calc(var(--radius) * 0.6);  /* 0.30rem */
--radius-md:  calc(var(--radius) * 0.8);  /* 0.40rem */
--radius-lg:  var(--radius);              /* 0.50rem */
--radius-xl:  calc(var(--radius) * 1.4);  /* 0.70rem */
--radius-2xl: calc(var(--radius) * 1.8);  /* 0.90rem */
--radius-3xl: calc(var(--radius) * 2.2);  /* 1.10rem */
--radius-4xl: calc(var(--radius) * 2.6);  /* 1.30rem */
```

In practice the layout leans on **hardcoded large radii** for the "plate and card" look:

| Value | Usage |
|---|---|
| `rounded-[2.5rem]` | Footer top corners, hero photo card (sm+) |
| `rounded-[2rem]` | Stat bar (sm+), About principle/yardstick plates |
| `rounded-[1.75rem]` | Grey "plate" wrappers around content groups |
| `rounded-[1.4rem]` | Cards sitting **inside** a plate |
| `rounded-3xl` | Software cards, screenshot images |
| `rounded-2xl` | Nav capsule, heading highlight chip, inner card sections |
| `rounded-xl` | Icon buttons, mobile drawer links |
| `0.875rem` | `.btn-glossy` (hardcoded in the class) |
| `rounded-full` | Eyebrow pills, badges, ProfileNav, avatars |

### 3.10 The plate pattern (structural motif)

Grouped content sits on a light grey **plate** with `p-2`, and individual cards sit inside at a slightly smaller radius. This produces the signature inset framing.

```tsx
<div className="rounded-[1.75rem] bg-zinc-100/80 p-2 dark:bg-zinc-900/60">
  <div className="grid gap-2 md:grid-cols-3">
    <Card className="rounded-[1.4rem] border-zinc-200/70" />
  </div>
</div>
```

Plate: `bg-zinc-100/80`, `p-2`, `rounded-[1.75rem]`. Gap between plated cards is always `gap-2`. Used for: homepage comparisons, recently reviewed, community favourites region, directory results, filter sidebar, screenshots, ratings, alternatives, reviews.

### 3.11 Shadows

```css
/* .card-modern */
box-shadow: 0 1px 2px rgba(15,23,42,0.04), 0 12px 32px -16px rgba(15,23,42,0.14);

/* .card-modern-hover:hover */
box-shadow: 0 1px 2px rgba(15,23,42,0.04), 0 24px 48px -20px rgba(15,23,42,0.22);
```

Other observed one offs:

| Context | Shadow |
|---|---|
| Hero photo card | `0_40px_80px_-40px_rgba(15,23,42,0.35)` |
| Nav capsule (scrolled) | `0_16px_40px_-20px_rgba(15,23,42,0.25)` |
| Mobile drawer | `0_24px_48px_-20px_rgba(15,23,42,0.3)` |
| ProfileNav pill bar | `0_16px_40px_-16px_rgba(0,0,0,0.5)` |
| Reviews summary rail | `0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.14)` |
| Hero popular tags | `0_4px_12px_-4px_rgba(15,23,42,0.25)` |

Shadows are **soft, large radius, low opacity, heavily negative spread**. Never a hard drop shadow.

### 3.12 The container

```css
.container-site {
  margin-inline: auto;
  width: 100%;
  max-width: 1440px;
  padding-inline: 1rem;
}
@media (min-width: 768px)  { .container-site { padding-inline: 2rem; } }
@media (min-width: 1024px) { .container-site { padding-inline: 3rem; } }
```

Max width 1440px. Gutters 16 → 32 → 48px. **Every** page section uses `container-site`.

### 3.13 The glossy button system (the brand's signature control)

This is the most distinctive component. It is a **rounded rectangle, never a pill**, with a glass sheen across the top half, a 1px bezel, pillowed inner edges and a fill tinted glow.

Recolor by setting three custom properties: `--btn-bg`, `--btn-ink`, `--btn-glow`.

```css
.btn-glossy {
  --btn-bg:   var(--color-brand);
  --btn-ink:  var(--color-brand-ink);
  --btn-glow: rgba(163, 197, 33, 0.5);
  border-radius: 0.875rem;
  color: var(--btn-ink);
  font-weight: 600;
  border: 1px solid color-mix(in srgb, var(--btn-bg), #000 22%);
  background-image:
    linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.14) 36%, rgba(255,255,255,0) 52%),
    linear-gradient(180deg,
      color-mix(in srgb, var(--btn-bg), #fff 14%) 0%,
      var(--btn-bg) 55%,
      color-mix(in srgb, var(--btn-bg), #000 14%) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.5),
    inset 0 -1px 0 rgba(255,255,255,0.14),
    inset 0 -5px 9px color-mix(in srgb, var(--btn-bg), #000 18%),
    0 12px 24px -10px var(--btn-glow);
  transition: transform .2s ease, filter .2s ease, box-shadow .2s ease;
  cursor: pointer;
}
.btn-glossy:hover {
  transform: translateY(-1px);
  filter: brightness(1.06) saturate(1.04);
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.55),
    inset 0 -1px 0 rgba(255,255,255,0.14),
    inset 0 -5px 9px color-mix(in srgb, var(--btn-bg), #000 18%),
    0 16px 30px -10px var(--btn-glow);
}
.btn-glossy:active {
  transform: translateY(0) scale(0.98);
  filter: brightness(0.97);
  box-shadow:
    inset 0 1px 2px color-mix(in srgb, var(--btn-bg), #000 30%),
    inset 0 -1px 0 rgba(255,255,255,0.1),
    0 6px 14px -8px var(--btn-glow);
}
.btn-glossy-dark  { --btn-bg: #232428; --btn-ink: #ffffff;            --btn-glow: rgba(10,12,16,0.55); }
.btn-glossy-white { --btn-bg: #ffffff; --btn-ink: var(--color-navy);  --btn-glow: rgba(15,23,42,0.22);
                    border-color: color-mix(in srgb, #ffffff, #000 14%); }
```

**Variant matrix**

| Variant | Class | Fill | Ink | Used for |
|---|---|---|---|---|
| Brand (default) | `.btn-glossy` | lime `#d9f65f` | `#1a2008` | Primary CTA, "List your software", Search, Subscribe |
| Dark | `.btn-glossy .btn-glossy-dark` | `#232428` | white | "All N reviews" |
| White | `.btn-glossy .btn-glossy-white` | white | navy | Secondary on cards, "View profile" |
| Per product accent | `.btn-glossy` + inline vars | vendor colour | white | "Visit website" (affiliate) |

The per product accent is set inline, which is how each vendor's own brand colour reaches the CTA:

```tsx
style={{
  "--btn-bg": accent,
  "--btn-ink": "#ffffff",
  "--btn-glow": `color-mix(in srgb, ${accent} 55%, transparent)`,
} as React.CSSProperties}
```

**Every primary and dark CTA on the site must use this shell.** Do not hand roll a button.

#### The travelling arrow CTA

A signature composite used for "All N reviews": a lime square holds an arrow and slides to the right edge on hover.

```tsx
<Link className="btn-glossy btn-glossy-dark group/cta relative inline-flex h-12 items-center overflow-hidden px-14 text-sm">
  <span aria-hidden="true"
    className="absolute inset-y-1.5 left-1.5 grid w-10 place-items-center rounded-[0.55rem]
               bg-[var(--color-brand)] text-[var(--color-brand-ink)]
               transition-[left,background-color] duration-300 ease-out
               group-hover/cta:left-[calc(100%-2.875rem)] group-hover/cta:bg-transparent">
    <ArrowRight className="size-4" />
  </span>
  All {formatNumber(count)} reviews
</Link>
```

### 3.14 Card surface

```css
.card-modern {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 1.5rem;
  box-shadow: 0 1px 2px rgba(15,23,42,.04), 0 12px 32px -16px rgba(15,23,42,.14);
  transition: transform .25s cubic-bezier(.16,1,.3,1),
              box-shadow .25s cubic-bezier(.16,1,.3,1),
              border-color .25s ease;
}
.card-modern-hover:hover {
  transform: translateY(-4px);
  border-color: color-mix(in srgb, var(--foreground) 12%, var(--border));
  box-shadow: 0 1px 2px rgba(15,23,42,.04), 0 24px 48px -20px rgba(15,23,42,.22);
}
```

**The house easing is `cubic-bezier(0.16, 1, 0.3, 1)`** (an expo out). Use it for anything that should feel expensive.

### 3.15 Motion

#### Scroll reveal (no JavaScript)

Progressive enhancement using scroll driven animations. If the browser lacks support or the user prefers reduced motion, content simply renders.

```css
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .reveal-on-scroll {
      animation: reveal-rise linear both;
      animation-timeline: view();
      animation-range: entry 0% entry 42%;
    }
    @keyframes reveal-rise {
      from { opacity: 0; transform: translateY(28px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  }
}
```

Applied to section headers, cards and grid items. **This is the only reveal mechanism. Do not add an IntersectionObserver library.**

#### Bar fill

```css
@media (prefers-reduced-motion: no-preference) {
  .animate-fill-bar { animation: fill-bar 1.1s cubic-bezier(.16,1,.3,1) both; }
  @keyframes fill-bar { from { width: 0%; } }
}
```

#### Floating hero shapes

```css
--animate-float:         float 7s ease-in-out infinite;
--animate-float-delayed: float 8s ease-in-out 1.5s infinite;

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50%      { transform: translateY(-18px) rotate(3deg); }
}
```

Applied as `[animation:var(--animate-float)]`. Shapes are decorative PNGs, `hidden sm:block`, `pointer-events-none`, `aria-hidden`.

#### Global reduced motion kill switch

```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
}
```

#### Duration conventions

| Duration | Use |
|---|---|
| `.2s` | Button hover, colour transitions |
| `.25s` | Card lift |
| `.3s` | Nav hide/show, active pill slide, travelling arrow |
| `1.1s` | Rating bar fill |
| `7s` / `8s` | Floating shapes |

`html { scroll-behavior: smooth; }` is global; anchored sections use `scroll-mt-32`.

### 3.16 Prose systems

Three separate rich text renderers. **Do not merge them.**

| Class | Applied to | Base | Distinctive detail |
|---|---|---|---|
| `.prose-content` | Product `description_full`, About body | `1rem` / `1.75` | Disc bullets, lime blockquote rule |
| `.legal-content` | Legal + policy pages | `.975rem` / `1.8` | Lime **dot** bullets (7px round, positioned), dashed table borders, `scroll-margin-top: 6rem` on h2 |
| `.article-content` | Blog posts | `1.075rem` / `1.85` | **Lead paragraph** at `1.25rem` and 78% opacity, lime **diamond** bullets (8px, `rotate(45deg)`), **numbered circles** for `ol` using counters, blockquote with muted fill and asymmetric radius |

The `.article-content ol` counter treatment is worth reproducing exactly:

```css
.article-content ol { counter-reset: article-ol; margin-left: 0; }
.article-content ol li { position: relative; padding-left: 2.25rem; counter-increment: article-ol; }
.article-content ol li::before {
  content: counter(article-ol);
  position: absolute; left: 0; top: .2em;
  width: 1.5rem; height: 1.5rem; border-radius: 9999px;
  background: var(--color-brand-light);
  color: var(--color-brand-dark);
  font-size: .8rem; font-weight: 700;
  display: grid; place-items: center;
}
```

> ⚠️ **Bug to fix, do not clone.** All three prose systems set links to `color: var(--color-brand)` — lime on white, about **1.2:1 contrast**. Links inside body copy are effectively invisible. Change to `var(--color-brand-dark)`. See §11.

### 3.17 Per product accent colours

`lib/brandColors.ts` gives every vendor its own accent, used for the "Visit website" CTA, the circular rating and chart series.

```ts
export const BRAND_GREEN = "#00a86b"; // fallback

export function brandColorFor(input: { slug: string; brand_color?: string | null }): string {
  if (input.brand_color && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(input.brand_color)) {
    return input.brand_color;
  }
  return BRAND_COLORS[input.slug] ?? BRAND_GREEN;
}

export function withAlpha(hex: string, alpha: number): string { /* hex → rgba() */ }
```

**Precedence:** admin set `software.brand_color` → hardcoded slug map → `BRAND_GREEN`.

> 🔁 **Localization.** The existing `BRAND_COLORS` map is keyed to South African products (Sage Pastel, PaySpace, SimplePay). **Replace the whole map** with the US and Canada roster and their real brand hexes, for example: QuickBooks `#2ca01c`, Xero `#13b5ea`, FreshBooks, Wave, Gusto, ADP, Paychex, Rippling, NetSuite, Salesforce `#00a1e0`, HubSpot `#ff7a59`, Zoho `#e42527`, monday.com `#ff3d57`, Asana `#f06a6a`, Trello `#0079bf`, Odoo `#714b67`.
>
> Also note `BRAND_GREEN` (`#00a86b`) is **off palette** — it exists nowhere else in the design system. Prefer `--color-brand-dark` as the fallback, or keep a deliberate neutral accent.

---

## 4. Route map

Two route groups: `(public)` and `(admin)`. The group folders do not appear in URLs.

### 4.1 Public routes

| Route | File | Rendering | Notes |
|---|---|---|---|
| `/` | `app/(public)/page.tsx` | ISR `revalidate = 3600` | Homepage |
| `/software` | `app/(public)/software/page.tsx` | ISR 3600 | Directory, filters + sort + pagination via `searchParams` |
| `/software/[slug]` | `.../[slug]/page.tsx` | ISR 3600 | Product profile, `generateMetadata`, `notFound()` |
| `/software/[slug]/reviews` | `.../reviews/page.tsx` | ISR 3600 | Full archive, filters + pagination (20/page) |
| `/software/[slug]/reviews/new` | `.../reviews/new/page.tsx` | Client form | Submit a review |
| `/software/[slug]/alternatives` | `.../alternatives/page.tsx` | ISR 3600 | Alternatives listing |
| `/categories` | `app/(public)/categories/page.tsx` | ISR 3600 | Category index |
| `/category/[slug]` | `app/(public)/category/[slug]/page.tsx` | ISR 3600 | Category landing |
| `/compare` | `app/(public)/compare/page.tsx` | ISR 3600 | Comparison hub + selector |
| `/compare/[pair]` | `app/(public)/compare/[pair]/page.tsx` | ISR 3600 | `slug-a-vs-slug-b` |
| `/blog` | `app/(public)/blog/page.tsx` | ISR 3600 | Featured + list |
| `/blog/[slug]` | `app/(public)/blog/[slug]/page.tsx` | ISR 3600 | Article, author box |
| `/search` | `app/(public)/search/page.tsx` | Dynamic | Full text results |
| `/about` | `app/(public)/about/page.tsx` | ISR 3600 | Static content page |
| `/contact` | `app/(public)/contact/page.tsx` | Server + client form | Server action |
| `/newsletter` | `app/(public)/newsletter/page.tsx` | ISR | Signup landing |
| `/newsletter/unsubscribe` | `.../unsubscribe/page.tsx` | Client | One click unsubscribe |
| `/privacy-policy` | `app/(public)/privacy-policy/page.tsx` | ISR 3600 | CMS driven via `LegalPage` |
| `/cookie-policy` | `app/(public)/cookie-policy/page.tsx` | ISR 3600 | CMS driven |
| `/terms` | `app/(public)/terms/page.tsx` | ISR 3600 | CMS driven |
| `/affiliate-disclosure` | `app/(public)/affiliate-disclosure/page.tsx` | ISR 3600 | Hand built page |
| `/editorial-policy` | `app/(public)/editorial-policy/page.tsx` | ISR 3600 | Hand built page |
| `/accessibility` | `app/(public)/accessibility/page.tsx` | ISR 3600 | CMS driven |
| ~~`/paia-manual`~~ | `app/(public)/paia-manual/page.tsx` | — | ❌ **DELETE.** South Africa only (Promotion of Access to Information Act). No US or Canada equivalent. Remove the route, the sitemap entry and the footer link. |

### 4.2 Admin routes

| Route | File | Notes |
|---|---|---|
| `/admin/login` | `app/(admin)/admin/login/page.tsx` | Supabase auth |
| `/admin` | `app/(admin)/admin/(panel)/page.tsx` | Dashboard |
| `/admin/[resource]` | `.../[resource]/page.tsx` | Generic CRUD list |
| `/admin/[resource]/new` | `.../[resource]/new/page.tsx` | Create |
| `/admin/[resource]/[id]` | `.../[resource]/[id]/page.tsx` | Edit |
| `/admin/analytics` | `.../analytics/page.tsx` | Click analytics |
| `/admin/contact` | `.../contact/page.tsx` | Messages |
| `/admin/newsletter` | `.../newsletter/page.tsx` | Subscribers |
| `/admin/settings` | `.../settings/page.tsx` | Site settings |
| `/admin/newsletter-export` | `.../newsletter-export/route.ts` | CSV export |

### 4.3 API and metadata routes

| Route | File | Purpose |
|---|---|---|
| `/api/og` | `app/api/og/route.tsx` | Dynamic OG image, `runtime = "edge"`, 1200×630 |
| `/api/track-click` | `app/api/track-click/route.ts` | Affiliate click logger + redirect |
| `/api/newsletter/confirm` | `app/api/newsletter/confirm/route.ts` | Double opt in confirmation |
| `/sitemap.xml` | `app/sitemap.ts` | Generated from live data |
| `/robots.txt` | `app/robots.ts` | Generated |
| `/icon.svg` | `app/icon.svg` | Favicon, auto discovered by App Router |
| 404 | `app/not-found.tsx` | Branded not found |

### 4.4 Caching

**Every content page exports `export const revalidate = 3600;`** (one hour ISR). Only `/search` and interactive forms are dynamic. Keep this. It is why the site is fast and cheap.

---

## 5. Page by page layout breakdown

### 5.0 Shell — `app/layout.tsx` (root)

```tsx
<html lang="en-ZA" data-scroll-behavior="smooth" suppressHydrationWarning
      className={`${dmSans.variable} ${inter.variable} ${interTight.variable} h-full antialiased`}>
  <body className="min-h-full flex flex-col">
    <ThemeProvider attribute="class" forcedTheme="light" enableSystem={false}>
      {children}
      <Toaster position="top-right" richColors />
      <Analytics />
    </ThemeProvider>
  </body>
</html>
```

Root metadata:

```ts
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${SITE_NAME} — ${SITE_TAGLINE}`, template: `%s | ${SITE_NAME}` },
  description: "...",
  openGraph: { type: "website", locale: "en_ZA", siteName: SITE_NAME, url: siteUrl },
  twitter: { card: "summary_large_image" },
};
```

> 🔁 **Localize:** `lang="en-ZA"` → `lang="en-US"`; `locale: "en_ZA"` → `"en_US"` (add `alternateLocale: ["en_CA"]`).

### 5.1 Public shell — `app/(public)/layout.tsx`

Server Component. Fetches four things in parallel and builds the header search index:

```tsx
const [categories, popularSoftware, articles, settings] = await Promise.all([
  getCategories(),
  getTopRatedSoftware(8),
  getLatestArticles(5),
  getSiteSettings(),
]);

const searchIndex = {
  software: popularSoftware.map((s) => ({ name: s.name, slug: s.slug,
    category: categories.find((c) => c.id === s.category_id)?.name ?? null })),
  articles: articles.map((a) => ({ title: a.title, slug: a.slug })),
};

return (
  <div className="flex min-h-dvh flex-col">
    <Navbar searchIndex={searchIndex} />
    <main className="flex-1">{children}</main>
    <Footer categories={categories} popularSoftware={popularSoftware} settings={settings} />
  </div>
);
```

> ⚠️ The command palette is seeded with only **8 products and 5 articles**. It is a shortcut list, not a search index. See §11.

### 5.2 Homepage — `app/(public)/page.tsx`

Page container: `space-y-16 pb-16 sm:space-y-24 sm:pb-24`.

Data fetched in parallel: `getCategories`, `getPublishedComparisons`, `getRecentlyUpdatedSoftware(3)`, `getLatestArticles(3)`, `getSiteStats`, `getSoftwareList({ perPage: 60 })`.

**Section order, top to bottom:**

#### 1. Hero
- `container-site pt-4 sm:pt-6 lg:pt-10`.
- A photo card: `relative overflow-hidden rounded-[1.75rem] sm:rounded-[2.5rem]`, shadow `0_40px_80px_-40px_rgba(15,23,42,0.35)`, `next/image` `fill` `priority`, `sizes="(min-width: 1440px) 1344px, 100vw"`.
- A wash overlay: `bg-white/25` plus `radial-gradient(70% 60% at 50% 45%, rgba(255,255,255,0.55), rgba(255,255,255,0.12))`.
- Four floating decorative PNGs at the corners (`shape-donut`, `shape-star`, `shape-spring`, `shape-cube-blue`), `hidden sm:block`, `pointer-events-none`, float animation.
- Centered content: `mx-auto flex max-w-3xl flex-col items-center gap-5 px-5 py-14 text-center sm:gap-6 sm:py-28 lg:py-32`.
  - H1 "Find the right software" — `text-[2rem] leading-[1.1] font-extrabold sm:text-6xl lg:text-7xl text-zinc-900`.
  - Subhead, `max-w-xl text-base text-zinc-700 sm:text-lg`.
  - `<SearchBar className="max-w-xl" />`.
  - Popular tag row: label `POPULAR:` then 5 pills linking to category pages, `rounded-full bg-white/90 px-4 py-1.5 text-sm font-semibold shadow-[0_4px_12px_-4px_rgba(15,23,42,0.25)] backdrop-blur hover:-translate-y-0.5 hover:bg-white`.

#### 2. Stats bar (overlaps the hero)
`card-modern relative z-10 mx-auto -mt-8 grid w-[min(100%,64rem)] grid-cols-1 divide-y divide-zinc-100 rounded-[1.5rem] bg-card px-5 py-4 sm:-mt-10 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:rounded-[2rem] sm:px-8 sm:py-7`

Three stats, each a 3D PNG icon (`size-12 sm:size-14`, `drop-shadow-[0_10px_15px_rgba(15,23,42,0.2)]`) beside a value/label pair:
- Verified reviews, Software listed (`{n}+`), Categories covered.

#### 3. Category explorer
- `SectionHeader`: eyebrow "Explore by category", H2 "Find the right tool for the job", subtitle naming the local compliance work.
- `<HomepageExplore categories softwareByCategory />` — tabbed, **top 3 products per category**.

> 🔁 The subtitle currently reads "…from VAT201 returns and eFiling to EMP201 payroll submissions." Rewrite for the target market, for example: "…from sales tax and IRS e-file to Form 941 payroll filings" (US) / "…GST/HST returns and T4 slips" (CA).

#### 4. Head to head strip
`<HomepageCompare comparisons />` — renders nothing when there are no published comparisons. Shows **3** matchups on a plate, ordered by combined review volume.

#### 5. Community favourites
- `SectionHeader`: eyebrow "Community favourites", H2 "The best reviewed software", subtitle "Ranked by verified reviews and ratings … Vendors cannot pay their way to the top."
- Grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6` of 6 `SoftwareCard`s **with** `distribution` (so the sentiment strip renders).
- Trailing centered link "Browse the full directory →".

#### 6. Newsletter
`<NewsletterSection />`.

#### 7. Recently reviewed
- Centered header with a `Clock3` eyebrow "Fresh on the platform", H2 "Recently **reviewed**" (highlight chip).
- Plate holding `grid-cols-1 md:grid-cols-3 gap-2` of 3 `RecentSoftwareCard` with `rank`.

#### 8. Blog preview
- `SectionHeader`: eyebrow "From the blog", H2 "Guides for South African buyers" → **retitle for the target market**.
- `mx-auto max-w-3xl`; each article is a row: a big ghost index number (`01`, `02`, …) in `text-zinc-200` that turns brand on group hover, then tag chip + date + read time, H3 title with a **full card overlay link** (`after:absolute after:inset-0`), 2 line excerpt, byline, and a trailing arrow tile (`hidden sm:grid`).
- Trailing centered "All articles →".

**Ranking logic on this page (important).** The homepage does **not** sort by raw star average. It computes a **Bayesian weighted score** so a product with hundreds of reviews at 4.1 outranks one with 30 reviews at 4.3:

```ts
const rated = directory.items.filter((s) => s.review_count > 0);
const meanRating = rated.reduce((sum, s) => sum + s.overall_rating, 0) / rated.length;
const volumes = rated.map((s) => s.review_count).sort((a, b) => a - b);
const priorWeight = volumes[Math.floor(volumes.length / 2)]; // median review count
const weightedScore = (s) =>
  (s.review_count * s.overall_rating + priorWeight * meanRating) / (s.review_count + priorWeight);
const byScore = (a, b) => weightedScore(b) - weightedScore(a) || b.review_count - a.review_count;
```

Applied to both the category tabs and Community favourites. Scoped to the homepage only; the directory keeps its own explicit sorts. **Keep this.** Full detail belongs in `BACKEND.md`.

### 5.3 Software directory — `/software`

- `container-site space-y-12 py-10`, `Breadcrumbs`.
- Centered hero: `Layers` eyebrow "The directory", H1 `{Category name or "Business software"}` + lime chip "**reviews**", description, then a `BadgeCheck` line: "{n} products…, ranked by verified ratings."
- Body grid: `grid items-start gap-6 lg:grid-cols-[300px_1fr]`.
  - **Left:** plate wrapped `FilterSidebar`, `lg:sticky lg:top-24`, inside `<Suspense>`.
  - **Right:** a result count + `DirectorySort` row, then a plate holding `space-y-2` of `SoftwareListRow` (each `rounded-[1.4rem] border-zinc-200/70`) with an absolute `rank`, then `Pagination`.
- Empty state inside the plate: `rounded-[1.4rem] … p-12 text-center` "No software matches these filters yet. Try removing a filter or two."
- `PER_PAGE = 10`. URL state: `page`, `sort`, `category`, `rating`, `trial`, `free`, `paid`.

### 5.4 Product profile — `/software/[slug]`

The deepest page. Wrapper `container-site space-y-10 py-10`; inner column `mx-auto max-w-4xl` with `space-y-20` between sections.

1. `JsonLd` — Product schema, Review schema, Breadcrumb schema.
2. `Breadcrumbs` — Software Reviews → Category → Name.
3. **Header**, centered `max-w-2xl`: `SoftwareLogo size={84}`, H1 `text-4xl sm:text-5xl`, optional `Featured` amber badge, tagline, then rating row (bold number + `StarRating` + link to reviews), then a `btn-glossy` "Write a review".
4. `<ProfileNav sections={…} />` — sticky pill bar.
5. `<SoftwareSidebar software />` — the vendor spec sheet.
6. **Overview** (`#overview`) — `BookOpen` eyebrow, H2 "What is {name}?", `.prose-content` from `description_full`.
7. **Pricing** (`#pricing`, only if `pricing_plans.length > 0`) — `PiggyBank` eyebrow, H2 "{name} plans, **priced in rand**" → **relabel per market**, `PricingCards` + `PricingTable`.
8. **Features** (`#features`) — `ListChecks` eyebrow, H2 "What {name} can **actually do**", `FeaturesSection`.
9. **Screenshots** (`#screenshots`, **only if real screenshots exist**) — `Camera` eyebrow, H2 "See {name} **up close**", plate → card → `ScreenshotCarousel`.
10. **Ratings** (`#ratings`) — `BarChart3` eyebrow, H2 "The rating, **broken down**". Plate containing:
    - `grid md:grid-cols-[280px_1fr]`: a `CircularRating size={104}` card, and a card with five `RatingBar`s (5→1) plus `SentimentBar`.
    - `grid lg:grid-cols-2`: "Ratings by dimension" (`SoftwareRatingsChart`) and "Reviewer company size" (`CompanySizeChart`).
11. **Compare** (`#compare`, only if alternatives exist) — `Scale` eyebrow, H2 "Compare with a **popular alternative**", `CompareAlternative`.
12. **Reviews** (`#reviews`) — `Star` eyebrow, H2 "What users **really think**", `VerifiedBadges`, then a plate with 3 `ReviewCard`s and a closing band containing the travelling arrow "All N reviews" plus a white "Write a review".
13. **Alternatives** (`#alternatives`) — `ArrowLeftRight` eyebrow, H2 "If {name} isn't **the right fit**", plate → `md:grid-cols-3` of `AlternativeCard` with rank, then "See all alternatives →".
14. **FAQs** (`#faqs`) — `CircleHelp` eyebrow, H2 "We have the **answers**", `FaqAccordion`.

**Conditional nav.** The section list is built before render and drives `ProfileNav`, so nav items appear only when their section does:

```ts
const screenshots = screenshotsFor({ slug: software.slug, screenshots: software.screenshots });
const hasScreenshots = screenshots.length > 0;

const sections = [
  { id: "overview", label: "Overview" },
  ...(software.pricing_plans.length > 0 ? [{ id: "pricing", label: "Pricing" }] : []),
  { id: "features", label: "Features" },
  ...(hasScreenshots ? [{ id: "screenshots", label: "Screenshots" }] : []),
  { id: "ratings", label: "Ratings" },
  ...(alternatives.length > 0 ? [{ id: "compare", label: "Compare" }] : []),
  { id: "reviews", label: `Reviews (${formatNumber(software.review_count)})` },
  ...(alternatives.length > 0 ? [{ id: "alternatives", label: "Alternatives" }] : []),
  { id: "faqs", label: "FAQs" },
];
```

**FAQ generation** (`buildFaqs()`) derives questions from the record itself — cost, free trial, integrations, local suitability, what users say. Topics: Pricing, Integrations, Local fit, Reviews. Rewrite the "Local fit" answer for the US and Canada.

**Screenshots policy (hard rule).** Real screenshots only. `lib/screenshots.ts` maps a slug to uploaded files in `/public/screenshots`; when a product has none, the **section and its nav item are omitted entirely**. Never render placeholder or illustrative previews.

```ts
export function screenshotsFor(product: { slug: string; screenshots: string[] }): string[] {
  if (product.screenshots.length > 0) return product.screenshots;   // DB first
  const files = UPLOADED_SCREENSHOTS[product.slug] ?? [];           // then local map
  return files.map((file) => `/screenshots/${file}`);               // else []
}
```

### 5.5 Reviews archive — `/software/[slug]/reviews`

- `container-site space-y-8 py-10`, `Breadcrumbs`.
- Header row (`md:flex-row md:items-center md:justify-between`): logo `size={64}` + H1 "{name} reviews" + rating line; right side `btn-glossy` "Write a review".
- Body `grid gap-8 lg:grid-cols-[300px_1fr]`:
  - **Left rail** (`lg:sticky lg:top-24`), a `rounded-3xl border bg-card p-6` card: `CircularRating size={96}`, `StarRating`, "{n} ratings", five `RatingBar`s labelled `5 ★`…`1 ★` (`[&>span:first-child]:w-10`), `SentimentBar`, `VerifiedBadges`.
  - **Right:** `<Suspense><ReviewFilters /></Suspense>`, a "Showing X to Y of Z reviews" line, `space-y-5` of `ReviewCard`, then `Pagination`.
- `PAGE_SIZE = 20`. Filters: `country`, `industry`, `size`, `duration`, `sort` (`helpful` | `recent`).
- Empty state: `rounded-3xl border p-12 text-center` "No reviews match these filters. Try broadening your selection."

> 🔁 The `country` filter is driven by `REVIEWER_COUNTRIES` in `lib/site.ts` (South Africa, Namibia, Botswana, …). Replace with `["United States", "Canada", "Other"]`, defaulting to no filter (show all of North America). Keep the filter: a Canadian buyer reading a payroll review genuinely wants to narrow to Canadian reviewers, and this is the one place the single market voice still needs a country lens.

### 5.6 About — `/about`

Nearly identical rhythm to a product profile, which is deliberate.

- Centered hero: `BookOpen` eyebrow "About {brand}", H1 "Software advice that speaks **fluent SARS**" → **must be rewritten** (for example "**fluent IRS**" / "**fluent tax season**"), lede paragraph.
- `ProfileNav` with: Our story, How we work, What we measure, Who writes this.
- **Our story** (`#story`) — `Compass` eyebrow, H2 "Built because the reviews we found were **written elsewhere**", three paragraphs at `text-foreground/85`.
- **How we work** (`#method`) — `Scale` eyebrow, H2 "Three rules hold **everything together**". A single bordered `rounded-[2rem]` container of 3 rows, each `sm:grid-cols-[auto_1fr]` with a ghost number + bare icon, title, and body. Rows separated by `[&:not(:first-child)]:border-t`.
- **What we measure** (`#yardstick`) — `ListChecks` eyebrow, H2 "Every product meets **the same yardstick**", a `dl` in a `rounded-[2rem]` card, `sm:grid-cols-2`, each item icon + term + detail.
- **Who writes this** (`#people`) — `PenLine` eyebrow, H2 "Practitioners first, **writers second**", plate → card `sm:grid-cols-[auto_1fr]` with a navy initials tile (`size-20 rounded-2xl bg-[var(--color-navy)] text-[var(--color-brand)]`), name + role, bio.
- Closing CTA band: `rounded-[2rem] border bg-muted/40 px-6 py-12 text-center`, H2 + two glossy buttons.

> 🔁 The YARDSTICK list is entirely South African (SARS eFiling, VAT201 at 15%, EMP201/EMP501, UIF and IRP5, POPIA, Rand pricing). **Rebuild it** for the target market: IRS e-file, sales tax and nexus, Form 941 / W-2 / 1099, CCPA/PIPEDA posture, USD/CAD pricing, and (for Canada) GST/HST and T4.

### 5.7 Blog — `/blog` and `/blog/[slug]`

**Index:** hero, then a featured article treatment, then a list; each row shows category tag, title, excerpt, author, date and read time.

**Article:** breadcrumbs → category tag → H1 → excerpt → author row (initials avatar, name, `author_title` · date · read time) → `.article-content` body → author bio box at the foot (initials avatar, name, `author_bio`).

Author identity is data (`articles.author_name`, `author_title`, `author_bio`), rendered in two places per article. Initials are derived from the name.

### 5.8 Legal and policy pages

`/privacy-policy`, `/cookie-policy`, `/terms`, `/accessibility` all render through one shared component:

```tsx
// components/public/LegalPage.tsx
export async function LegalPage({ slug }: { slug: string }) {
  const page = await getPageBySlug(slug);
  if (!page) notFound();
  return (
    <div className="container-site max-w-3xl space-y-8 py-10">
      <Breadcrumbs items={[{ name: page.title }]} />
      <header className="space-y-2 border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <h1 className="font-heading text-4xl font-bold tracking-tight">{page.title}</h1>
        {page.updated_at && (
          <p className="text-sm text-muted-foreground">Last updated {formatDate(page.updated_at)}</p>
        )}
      </header>
      <div className="legal-content" dangerouslySetInnerHTML={{ __html: page.content }} />
    </div>
  );
}
```

Each route file is a thin wrapper supplying metadata plus `<LegalPage slug="terms" />`.

> ⚠️ **Trap.** Content comes from the `pages` table. If a row is missing, the page **404s** rather than falling back to the bundled default (the fallback only triggers when Supabase is unconfigured or the query throws). An empty `pages` table silently 404s the entire legal suite. Seed it as part of deployment and add a smoke test.
>
> `/affiliate-disclosure` and `/editorial-policy` are **not** CMS driven; they are hand built pages with their own layout.

### 5.9 404 — `app/not-found.tsx`

Centered: logo mark, giant `404`, "Page not found", one line of explanation, then two buttons ("Back home" glossy brand, "Browse software" white).

---

## 6. Component library

### 6.1 `cn()` — `lib/utils.ts`

```ts
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
```

Every component composes classes through this. No exceptions.

### 6.2 Brand

#### `BrandLogo` / `LogoMark` — `components/public/BrandLogo.tsx`

```tsx
export function LogoMark({ className }: { className?: string })
export function BrandLogo({ className, invert = false }: { className?: string; invert?: boolean })
```

- `LogoMark` is a pure SVG symbol on a transparent background, sized `size-8` by default, `aria-hidden`.
- `BrandLogo` is the full lockup: a `Link` to `/` with `aria-label={\`${SITE_NAME} — home\`}`, `flex items-center gap-2.5 shrink-0`, mark + a two tone wordmark at `font-heading text-[1.35rem] font-medium tracking-tight`.
- The wordmark splits the brand name in two: the first half in `text-foreground` (or `text-white` when `invert`), the second half `font-semibold` in `text-[var(--color-brand-dark)]` (or `text-[var(--color-brand)]` when `invert`).
- `invert` is used on the dark footer.

**The mark must be colour legible on both a white header and a dark tab bar.** Because lime is ~1.2:1 on white, a lime only mark fails. The shipped solution: a two tone mark (olive structure + lime accent) in app, and a **theme aware favicon** at `app/icon.svg` that swaps hue by media query:

```svg
<style>
  .mark { fill: #4c5f0a }
  @media (prefers-color-scheme: dark) { .mark { fill: #d9f65f } }
</style>
```

The favicon has **no background tile**. Keep both properties in the rebrand.

> 🔁 The current brand ("SoftGids", Afrikaans *gids* = guide) and its mark are market specific. Pick a new US and Canada brand name and mark, but preserve: transparent favicon, theme aware favicon colour, two tone wordmark, and the `LogoMark` / `BrandLogo` split.

### 6.3 Navigation

#### `Navbar` — `components/public/Navbar.tsx` (client)

Props: `{ searchIndex: NavSearchIndex }` where

```ts
export interface NavSearchIndex {
  software: Array<{ name: string; slug: string; category: string | null }>;
  articles: Array<{ title: string; slug: string }>;
}
```

Behaviour, all of it load bearing:

- **Floating capsule.** `sticky top-0 z-50 pt-3`, inner `flex h-14 items-center justify-between gap-4 rounded-2xl border px-3 sm:px-4`.
- **Frost on scroll.** Past `scrollY > 8` the capsule gains `border-zinc-200/70 bg-background/85 shadow-[0_16px_40px_-20px_rgba(15,23,42,0.25)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/70`; before that it is fully transparent.
- **Hide on scroll down.** Past `scrollY > 120` and moving down, the header translates `-translate-y-[130%]` over `300ms`; any upward scroll brings it back. Suppressed while the mobile drawer is open.
- **Broadcast.** It sets a document level attribute so other sticky elements can react:
  ```ts
  document.documentElement.toggleAttribute("data-header-hidden", hidden && !mobileOpen);
  ```
- **Animated active pill.** A `ref` on the link row measures the `[data-active='true']` anchor with `getBoundingClientRect()` and slides an absolutely positioned `h-9 rounded-full bg-accent` span to it (`transition-all duration-300 ease-out`). Re measured on resize and route change.
- **Active matching** is prefix aware: `/software` also matches `/search`; `/categories` also matches `/category`.
- **Right cluster:** a `size-9 rounded-xl bg-zinc-100` search button (hover turns lime with ink), a `GlossyButton` "List your software" (`hidden sm:inline-flex`), and a `lg:hidden` menu toggle with `aria-expanded`.
- **Mobile drawer:** a floating card below the capsule, `rounded-2xl border bg-background/95 p-3 backdrop-blur-xl`, stacked links, closes on navigate.
- **Command palette:** `CommandDialog` (cmdk) with groups "Software" and "Articles", `CommandEmpty` "No results found.", each item routing via `router.push`.

Links: Software Reviews `/software`, Categories `/categories`, Compare `/compare`, Blog `/blog`.

#### `ProfileNav` — `components/public/ProfileNav.tsx` (client)

```tsx
export interface ProfileSection { id: string; label: string }
export function ProfileNav({ sections }: { sections: ProfileSection[] })
```

- A dark floating pill bar: `sticky top-20 z-40`, inner `mx-auto flex w-fit max-w-full gap-1 overflow-x-auto rounded-full bg-[#232428]/95 p-1.5 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.5)] backdrop-blur`.
- **Cooperates with the header:** `transition-[top] duration-300 [[data-header-hidden]_&]:top-3` — when the navbar hides, the pill bar rises. This is the pairing that makes the page feel engineered.
- Active section tracked with `IntersectionObserver` at `rootMargin: "-30% 0px -60% 0px"`, so the active item flips when a section reaches the upper third.
- Active item: `bg-[color-mix(in_srgb,var(--color-brand)_16%,transparent)] text-[var(--color-brand)] ring-1 ring-inset ring-[color-mix(in_srgb,var(--color-brand)_30%,transparent)]`. Inactive: `text-zinc-400 hover:text-white`.
- Sets `aria-current` on the active anchor. Sections need `scroll-mt-32`.

Used by both `/software/[slug]` and `/about`.

#### `Footer` — `components/public/Footer.tsx`

```tsx
export function Footer({ categories, popularSoftware, settings }: {
  categories: Category[]; popularSoftware: Software[]; settings: Record<string, string>;
})
```

- Shell: `mt-20 overflow-hidden rounded-t-[2.5rem] bg-[#141517] text-zinc-400`.
- **Newsletter band:** `container-site border-b border-white/[0.06] py-14`, `grid lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-16`. Left: `MailCheck` pill "The monthly letter", H2 with lime chip, supporting copy. Right: `<NewsletterForm variant="footer" />`.
- **Link columns:** `container-site grid gap-x-8 gap-y-12 py-16 md:grid-cols-2 lg:grid-cols-12`.
  - `lg:col-span-4` brand column: `<BrandLogo invert />`, `settings.footer_text ?? SITE_TAGLINE`, then contact list (email, phone, location) each with a lime icon.
  - Four `lg:col-span-2` nav columns: **Explore**, **Categories** (first 5, `" Software"` stripped), **Company**, **Popular reviews** (first 5 products).
- **Legal bar:** `border-t border-white/[0.06]`, `flex … py-6 text-xs text-zinc-600 md:flex-row`, copyright left, legal links right.
- **Ghost wordmark:** a decorative, oversized brand name clipped by the footer's bottom edge:
  ```tsx
  <p className="-mb-[0.26em] text-center font-heading text-[clamp(4rem,14vw,13rem)] leading-none font-semibold tracking-tight whitespace-nowrap text-white/[0.045]">
  ```
  `aria-hidden`, `select-none`. Keep it. It is a large part of the footer's character.

Column headings: `text-[0.65rem] font-bold tracking-[0.18em] text-zinc-500 uppercase`.

> 🔁 Remove the **PAIA Manual** entry from `LEGAL_LINKS`. Rewrite the newsletter band copy (currently "rand price moves and a checklist for every SARS season … in line with POPIA").

### 6.4 Buttons

#### `GlossyButton` — `components/public/GlossyButton.tsx`

```tsx
type GlossyButtonProps = {
  href?: string;
  className?: string;
  variant?: "brand" | "dark" | "white";
  children: React.ReactNode;
} & (React.AnchorHTMLAttributes<HTMLAnchorElement> | React.ButtonHTMLAttributes<HTMLButtonElement>);
```

- Renders `<a>` when `href` is present, otherwise `<button>`.
- Base: `inline-flex items-center justify-center gap-2 px-6 py-3 text-sm select-none` + focus ring.
- Variants map to `btn-glossy`, `btn-glossy btn-glossy-dark`, `btn-glossy btn-glossy-white`.
- Children are wrapped in `<span className="relative z-10 inline-flex items-center gap-2">` so they sit above the sheen.

#### `Button` — `components/ui/button.tsx` (cva)

Base:

```
inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium
transition-all disabled:pointer-events-none disabled:opacity-50
[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0
outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2
focus-visible:ring-offset-background cursor-pointer
```

| Variant | Classes |
|---|---|
| `default` | `btn-glossy` |
| `destructive` | `btn-glossy [--btn-bg:var(--color-error)] [--btn-ink:#ffffff] [--btn-glow:rgba(239,68,68,0.45)]` |
| `outline` | `border border-border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground` |
| `secondary` | `bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/85` |
| `ghost` | `hover:bg-accent hover:text-accent-foreground` |
| `link` | `text-primary underline-offset-4 hover:underline` |

| Size | Classes |
|---|---|
| `default` | `h-9 px-4 py-2 has-[>svg]:px-3` |
| `sm` | `h-8 rounded-lg gap-1.5 px-3 has-[>svg]:px-2.5` |
| `lg` | `h-11 rounded-2xl px-6 has-[>svg]:px-4 text-base` |
| `icon` | `size-9` |

Defaults `variant: "default"`, `size: "default"`. Supports `asChild` via Radix `Slot`.

> ⚠️ The `link` variant uses `text-primary`, which is **lime**. Unreadable on white. Fix to `text-[var(--color-brand-dark)]`.

#### `Badge` — `components/ui/badge.tsx` (cva)

Base: `inline-flex items-center justify-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 transition-colors`

| Variant | Classes |
|---|---|
| `default` | `border-transparent bg-primary text-primary-foreground` (lime + ink) |
| `secondary` | `border-transparent bg-secondary text-secondary-foreground` |
| `destructive` | `border-transparent bg-destructive text-white` |
| `outline` | `text-foreground border-border` |
| `success` | `border-transparent bg-[var(--color-brand-light)] text-[var(--color-brand-dark)]` |
| `amber` | `border-transparent bg-amber-50 text-amber-700` |
| `muted` | `border-transparent bg-muted text-muted-foreground` |

`success` is the "Free trial" badge; `amber` is "Featured".

### 6.5 Product surfaces

#### `SoftwareCard` — `components/public/SoftwareCard.tsx`

```tsx
export function SoftwareCard({ software, categoryName, distribution, className }: {
  software: Software;
  categoryName?: string;
  /** Live star distribution; when provided the card shows review sentiment. */
  distribution?: RatingDistribution;
  className?: string;
})
```

Shell: `group flex flex-col gap-5 rounded-3xl border border-zinc-200/80 bg-card p-6 transition-colors duration-200 hover:border-zinc-300`, with the vendor accent injected as a CSS variable:

```tsx
style={{ ["--accent" as string]: accent }}   // accent = brandColorFor(software)
```

Anatomy, top to bottom:

1. **Header** — `SoftwareLogo size={44}` (raw logo, no background tile), then a min width 0 column with a truncating H3 linking to the profile (`hover:text-[var(--accent)]`), and a rating row: `StarRating size={14}` + bold `tabular-nums` rating + `({review_count})`. Optional right side category chip: `rounded-md bg-muted px-2.5 py-1 text-[0.65rem] font-bold uppercase`.
2. **Rating highlight** — `rounded-2xl border border-zinc-100 bg-muted/50 px-4 py-3.5`: "Highly rated for {best dimension}" and "Based on {n} verified user reviews". When `distribution` is passed, `<ReviewSentiment />` renders beneath.
   The highlighted dimension is computed, not stored:
   ```ts
   function topDimension(software: Software) {
     const dims = [
       { label: "ease of use",      value: software.ease_of_use_rating },
       { label: "value for money",  value: software.value_for_money_rating },
       { label: "functionality",    value: software.functionality_rating },
       { label: "customer service", value: software.customer_service_rating },
     ];
     return dims.reduce((best, d) => (d.value > best.value ? d : best));
   }
   ```
3. **Tagline** — `line-clamp-2 text-sm text-muted-foreground`, falls back to `description_short`.
4. **Price** — separated by `border-t`, micro label "Starting from", then a `font-heading text-2xl font-extrabold tabular-nums` amount plus a small note (`/mo`). Custom pricing renders muted. Right side: `Badge variant="success"` "Free trial" when applicable.
5. **Actions** — `mt-auto grid grid-cols-2 gap-3`: "View profile" (`btn-glossy btn-glossy-white h-11`) and "Visit website" (`btn-glossy h-11` tinted with the vendor accent), the latter pointing at `/api/track-click?software={slug}` with `target="_blank"` and `rel="noopener noreferrer sponsored"`.

**The `sponsored` rel is required** on every affiliate link. It is also an FTC expectation in the US market.

#### Other product components (same family)

| Component | Purpose |
|---|---|
| `SoftwareListRow` | Horizontal directory row with `rank`, used on `/software` |
| `RecentSoftwareCard` | Compact card with `rank`, homepage "Recently reviewed" |
| `AlternativeCard` | Alternative with `originalSlug` + `rank`, links to a comparison |
| `SoftwareLogo` | Renders the vendor logo at a given `size`, handles missing logo |
| `SoftwareSidebar` | Vendor spec sheet (vendor, founded, support, countries, languages) |
| `CategoryCard` / `CategoryIcon` | Category tiles and their icons |

### 6.6 Ratings and data viz

| Component | Notes |
|---|---|
| `StarRating` | Props `{ rating, size }`. Uses `--color-star` `#f5a623`. Supports halves. |
| `CircularRating` | Props `{ rating, size, color }`. Radial dial, coloured by the vendor accent. Sizes seen: `104` (profile), `96` (reviews rail). |
| `RatingBar` | Props `{ label, value, max, color, suffix, className }`. Uses `.animate-fill-bar`. |
| `SentimentBar` | Props `{ distribution, className }`. Positive / Neutral / Negative split. |
| `ReviewSentiment` | Props `{ distribution, slug }`. The compact strip inside `SoftwareCard`. |
| `SoftwareRatingsChart` | Recharts. Props `{ software, accent }`. The four dimensions. |
| `CompanySizeChart` | Recharts. Props `{ reviews }`. Reviewer company size distribution. |
| `DonutChart` | Generic donut. |
| `StarSelector` | Interactive star input for the review form. |

Sentiment is derived from the distribution: 5 and 4 star are positive, 3 neutral, 2 and 1 negative.

### 6.7 Reviews

| Component | Notes |
|---|---|
| `ReviewCard` | Props `{ review }`. Reviewer identity, verified badges, ratings, title, pros/cons, vendor response, helpful count. |
| `ReviewFilters` | Client. URL driven: `country`, `industry`, `size`, `duration`, `sort`. Must be inside `<Suspense>`. |
| `ReviewForm` | Client. Submits a review. |
| `VerifiedBadges` | The trust strip. |
| `CountryFlag` | Flag beside a reviewer country. Uses `lib/flags.ts`. |

### 6.8 Compare

| Component | Notes |
|---|---|
| `HomepageCompare` | Props `{ comparisons }`. Renders `null` when empty. **Sorts by combined review volume** and takes 3. |
| `ComparisonCard` | Props `{ a, b, className }`. The head to head card with per dimension bars. |
| `CompareAlternative` | Props `{ software, alternative }`. Profile page comparison. |
| `CompareSelector` | Client. Two product pickers. |
| `CompareDashboard`, `ComparisonMatrix`, `ComparisonTable`, `CompareStickyBar` | The `/compare/[pair]` surface. |
| `FeatureChecklist` | Feature by feature tick list. |

The homepage ordering rule, worth keeping:

```tsx
const reviewWeight = (c: Comparison) =>
  (c.software_a?.review_count ?? 0) + (c.software_b?.review_count ?? 0);
const usable = comparisons
  .filter((c) => c.software_a && c.software_b)
  .sort((a, b) => reviewWeight(b) - reviewWeight(a))
  .slice(0, 3);
```

### 6.9 Content and navigation helpers

| Component | Notes |
|---|---|
| `HomepageExplore` | Client. Props `{ categories, softwareByCategory }`. Radix Tabs; hides categories with no products; **slices 3 per tab**; tab bar is `justify-start` on mobile and `sm:justify-center` (centering alone would clip the first tab out of reach). |
| `SearchBar` | Client. Hero search. |
| `Breadcrumbs` | Props `{ items: { name, href? }[] }`. |
| `Pagination` | Props `{ currentPage, totalPages, basePath, searchParams, className }`. |
| `FilterSidebar` | Client, URL driven. Must be inside `<Suspense>`. |
| `DirectorySort` | Client. `reviews` \| `rating` \| `recent`. Must be inside `<Suspense>`. |
| `FaqAccordion` | Props `{ items: FaqItem[] }` where `FaqItem = { topic, question, answer }`. |
| `PricingCards` | Props `{ plans, currency, ctaHref, freeTrial, vendorName }`. |
| `PricingTable` | Props `{ plans, currency }`. Feature comparison across plans. |
| `FeaturesSection` | Props `{ software }`. `top_features` first, then the full list. |
| `ScreenshotCarousel` | Client. Props `{ screenshots, productName }`. Embla + lightbox. |
| `LegalPage` | Server. Props `{ slug }`. |
| `NewsletterSection` / `NewsletterForm` / `NewsletterUnsubscribeForm` | `NewsletterForm` takes `variant` (`"footer"` and others). |
| `ContactForm` | Client, server action backed. |
| `AffiliateCTAButton`, `AffiliateDisclosureNote` | Affiliate CTA + inline disclosure. |
| `ThemeToggle` | Present but inert while `forcedTheme="light"`. |
| `SocialIcons`, `StatusBadge`, `GlossyCTA` | Misc. |

#### `ScreenshotCarousel` detail

- Embla with `{ align: "start", loop: false }`; `canPrev` / `canNext` tracked via `select` and `reInit`.
- Returns `null` when `screenshots.length === 0`.
- Slides: `flex-[0_0_85%] sm:flex-[0_0_60%] lg:flex-[0_0_48%]`, `cursor-zoom-in`, image `aspect-[8/5] w-full rounded-3xl border object-cover`, plus an `Expand` badge that fades in on hover.
- Uses plain `<img loading="lazy">`, **not** `next/image`, because sources may be local public paths or remote vendor URLs.
- Controls are two `size-9 rounded-full border` buttons, bottom right, disabled state `opacity-40 pointer-events-none`.
- Lightbox is a Radix `Dialog` with a `sr-only` `DialogTitle`.

### 6.10 `components/ui/*` (Radix wrappers)

Standard shadcn style wrappers over the unified `radix-ui` package: `alert-dialog`, `avatar`, `badge`, `breadcrumb`, `button`, `card`, `checkbox`, `command`, `dialog`, `dropdown-menu`, `input-group`, `input`, `label`, `navigation-menu`, `popover`, `progress`, `scroll-area`, `select`, `separator`, `skeleton`, `sonner`, `switch`, `table`, `tabs`, `textarea`.

**Import style is the unified package**, not per primitive packages:

```ts
import { Slot } from "radix-ui";
```

Each wrapper sets a `data-slot` attribute for styling hooks.

### 6.11 `components/admin/*`

`LoginForm`, `ResourceForm`, `SettingsForm`, `ui.tsx`. Driven by the resource registry in `lib/admin/resources.ts` (field name, label, type, required, rows). Detailed in `BACKEND.md`.

---

## 7. Responsive behavior

Tailwind v4 defaults: `sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536`. The codebase uses `sm`, `md` and `lg` almost exclusively. **Mobile first: unprefixed classes are the mobile design.**

### 7.1 Container

| Width | Gutter |
|---|---|
| `< 768px` | `1rem` |
| `≥ 768px` | `2rem` |
| `≥ 1024px` | `3rem` |
| Max | `1440px` |

### 7.2 Key layout shifts

| Surface | Mobile | `sm` | `md` | `lg` |
|---|---|---|---|---|
| Nav links | hidden (drawer) | — | — | `lg:block` inline |
| "List your software" | hidden | `sm:inline-flex` | — | — |
| Menu toggle | shown | — | — | `lg:hidden` |
| Hero H1 | `2rem` | `3.75rem` | — | `4.5rem` |
| Hero padding | `py-14` | `sm:py-28` | — | `lg:py-32` |
| Floating shapes | hidden | `sm:block` | — | larger |
| Stats bar | 1 col, `divide-y` | `sm:grid-cols-3`, `sm:divide-x` | — | — |
| Card grids | 1 col | `sm:grid-cols-2` | — | `lg:grid-cols-3` |
| Plated triples | 1 col | — | `md:grid-cols-3` | — |
| Directory | stacked | — | — | `lg:grid-cols-[300px_1fr]`, sidebar `lg:sticky lg:top-24` |
| Reviews page | stacked | — | — | `lg:grid-cols-[300px_1fr]` |
| Ratings block | stacked | — | `md:grid-cols-[280px_1fr]` | `lg:grid-cols-2` sub grid |
| Footer columns | 1 col | — | `md:grid-cols-2` | `lg:grid-cols-12` (4 + 2 + 2 + 2 + 2) |
| Footer legal bar | stacked, centered | — | `md:flex-row` | — |
| Newsletter band | stacked | — | — | `lg:grid-cols-[1.2fr_1fr]` |
| Profile header | centered `max-w-2xl` | — | — | — |
| Reviews header | stacked | — | `md:flex-row md:justify-between` | — |
| About principles | stacked | `sm:grid-cols-[auto_1fr]` | — | — |
| Screenshot slides | `85%` | `sm:60%` | — | `lg:48%` |

### 7.3 Horizontal scroll rules

Two bars scroll horizontally rather than wrap:

- **Category tabs** (`HomepageExplore`): `-mx-4 flex snap-x justify-start overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:justify-center [&::-webkit-scrollbar]:hidden`. The source comments the reasoning: *`justify-center` alone would clip the first tab out of reach on narrow screens, so we only center when there is room.* Tabs are `snap-start`.
- **ProfileNav:** `overflow-x-auto` with `scrollbar-none`, `w-fit max-w-full`, items `shrink-0 whitespace-nowrap`.

The page body must never scroll horizontally. Wide content (tables, matrices) scrolls inside its own container.

---

## 8. Accessibility

The stated target is **WCAG 2.2 level AA**, published on `/accessibility`. The rebuild must actually hold that line.

### 8.1 Already correct — preserve

- **Landmarks.** `<header>`, `<main className="flex-1">`, `<footer>`, and every `<nav>` carries an `aria-label` ("Primary", "Mobile", "Explore", "Categories", "Company", "Popular reviews", "Legal", "Page sections").
- **Sections** use `aria-labelledby` pointing at their own heading id, and headings are ordered (single `h1`, then `h2`, `h3`).
- **Icons** are `aria-hidden="true"` when decorative; icon only controls have `aria-label` (Search, Open/Close menu, carousel prev/next, screenshot open).
- **`aria-expanded`** on the mobile toggle; **`aria-current`** on the active `ProfileNav` item.
- **Focus rings** are global on `Button` and `GlossyButton`: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background`.
- **Reduced motion** is honoured twice: the reveal animation is gated on `prefers-reduced-motion: no-preference`, and a global `reduce` block flattens all animation and transition durations.
- **Dialogs** (search palette, screenshot lightbox) are Radix, so focus trap and Escape come free; the lightbox supplies a `sr-only` `DialogTitle`.
- **Decorative content** (floating shapes, ghost wordmark) is `aria-hidden` and `pointer-events-none` / `select-none`.
- **Alt text**: decorative images use `alt=""`; screenshots use `alt={\`${productName} screenshot ${i + 1}\`}`.
- **Card overlay links** use `after:absolute after:inset-0` so the whole card is clickable while only the title is in the a11y tree.

### 8.2 Must fix in the rebuild

| Issue | Fix |
|---|---|
| **Prose link colour** is lime (~1.2:1) in `.prose-content`, `.legal-content`, `.article-content` | Use `var(--color-brand-dark)` |
| **`Button` `link` variant** uses `text-primary` (lime) | Use `var(--color-brand-dark)` |
| **No skip link** | Add "Skip to content" targeting `<main id="main">` |
| **`main` has no `id`** | Add one |
| **`ProfileNav` is anchors only** | Anchors are fine, but ensure focus moves to the section (`tabIndex={-1}` on the target) |
| **Charts are visual only** | Recharts output needs a text alternative; the accessibility page already admits this gap |
| **`lang` is `en-ZA`** | Set `en-US`. Single locale, no switching. |

### 8.3 Contrast targets

- Body text `#111827` on `#ffffff` ≈ 16.1:1.
- Muted text `#6b7280` on `#ffffff` ≈ 4.8:1 — passes AA for normal text, but do not go lighter.
- `text-zinc-500` on the `#141517` footer ≈ 4.6:1 — acceptable; `text-zinc-600` for the legal bar is borderline at ~3.6:1 and should be lifted to `zinc-500`.
- Ink `#1a2008` on lime `#d9f65f` ≈ 13:1 — the reason the lime + ink pairing is mandatory.

---

## 9. SEO and metadata

### 9.1 Title system

Root layout defines a template; every page supplies only its own title:

```ts
title: {
  default: `${SITE_NAME} — ${SITE_TAGLINE}`,
  template: `%s | ${SITE_NAME}`,
}
```

Admin has its own: `{ template: "%s · {BRAND} admin", default: "{BRAND} admin" }`.

### 9.2 Canonicals

Every public page sets one explicitly:

```ts
alternates: { canonical: `${siteUrl}/software` }
```

`siteUrl` resolves from `process.env.NEXT_PUBLIC_SITE_URL` with a hardcoded fallback, trailing slashes stripped:

```ts
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com").replace(/\/+$/, "");
```

> ⚠️ **Deployment trap.** The env var **wins over the code default**. Changing the fallback without changing the env var leaves stale canonicals and OG URLs pointing at the old domain. Set `NEXT_PUBLIC_SITE_URL` per environment and verify the rendered `<link rel="canonical">` after any domain change.

### 9.3 Dynamic metadata

Product pages generate metadata from the record, with sensible fallbacks:

```ts
export async function generateMetadata(props: PageProps<"/software/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const software = await getSoftwareBySlug(slug);
  if (!software) return { title: "Software not found" };

  const title = software.meta_title ??
    `${software.name} Review ${new Date().getFullYear()} — Pricing, Features & Ratings`;
  const description = software.meta_description ??
    `${software.description_short} Read ${formatNumber(software.review_count)} verified reviews from South African businesses.`;

  return {
    title, description,
    alternates: { canonical: `${siteUrl}/software/${software.slug}` },
    openGraph: {
      title, description,
      url: `${siteUrl}/software/${software.slug}`,
      images: [software.og_image_url ??
        `/api/og?title=${encodeURIComponent(software.name)}&rating=${software.overall_rating}&type=software`],
    },
  };
}
```

Note the auto refreshing `Review {year}` title. Keep it. Rewrite the description's market phrase.

### 9.4 Structured data — `lib/jsonld.tsx`

Helpers: `productJsonLd`, `reviewsJsonLd`, `breadcrumbJsonLd`, plus a `<JsonLd data={[...]} />` renderer. Product pages emit all three.

### 9.5 OG images — `app/api/og/route.tsx`

`runtime = "edge"`, 1200×630, built with `next/og` `ImageResponse`.

- Params: `title` (sliced to 90 chars), `rating`, `type` (`software` | `article` | `page`).
- Subtitle switches on `type`.
- Layout: dark navy gradient `linear-gradient(135deg, #1b1f3b 0%, #10132a 100%)`, brand row (mark + two tone wordmark) top left, title block, a lime rating pill, and a footer with the domain and a "Made for …" flag line.
- The rating pill **must** set `color: "#1a2008"` explicitly. It inherits white otherwise, and white on lime is illegible.

> ⚠️ Known defect: the `★` character fails to load a font in Satori and renders as a tofu box. Replace it with an inline SVG star or a font that covers the glyph.
>
> 🔁 Localize the `🇿🇦 Made for South Africa` line.

### 9.6 Sitemap — `app/sitemap.ts`

Generated from live data, combining static routes with software (profile + `/reviews` + `/alternatives`), categories, articles and comparisons.

| Route class | `changeFrequency` | `priority` |
|---|---|---|
| `/` | daily | 1.0 |
| Static pages | weekly | 0.7 |
| `/software/[slug]` | weekly | 0.9 (with `lastModified`) |
| `/software/[slug]/reviews` and `/alternatives` | weekly | 0.6 |
| `/category/[slug]` | weekly | 0.8 |
| `/blog/[slug]` | monthly | 0.6 (with `lastModified`) |
| `/compare/[pair]` | weekly | 0.7 |

Comparison URLs are `\`${siteUrl}/compare/${a.slug}-vs-${b.slug}\``. Software and articles are pulled at `perPage: 500`.

> 🔁 **Remove `/paia-manual` from the static list.**

### 9.7 Robots

`app/robots.ts` generates `robots.txt`. Disallow `/admin` and `/api`. Point `sitemap` at `${siteUrl}/sitemap.xml`.

### 9.8 Images

`next/image` for hero, decorative shapes and stat icons. Remote images are restricted to `**.supabase.co`. Screenshots deliberately use plain `<img>` (mixed local and remote origins). Hero is `priority`; everything else lazy loads.

---

## 10. Copywriting voice and tone

The copy is a real asset of this product. It reads like a competent human wrote it, not a content mill.

### 10.1 Voice

- **Plain, direct, unhedged.** "Vendors cannot pay their way to the top." "No spam and your address is never sold."
- **Specific over grand.** Name the actual filing, the actual bank feed, the actual dollar figure.
- **Confident but not salesy.** The product's pitch is neutrality; overselling breaks it.
- **Occasional dry warmth.** "No hard feelings if you do." "A person reads it."
- **Second person.** Talk to the reader as "you".

### 10.2 House rules

1. **No em dashes or en dashes in body copy.** Use a comma, a full stop, or restructure. This is a deliberate, enforced house style; em dashes read as machine written.
2. **Avoid hyphenated connectors in prose.** Prefer "one click" over "one-click", "sign ups" over "sign-ups", "opt in" over "opt-in". Hyphens are fine in URLs, slugs, code and identifiers.
3. **No AI tells.** Never "unlock", "seamless", "elevate", "delve", "in today's fast paced world", "game changer". No sparkle iconography.
4. **Headings are a phrase, not a sentence.** The last two or three words go in the lime chip.
5. **Numbers are concrete.** "296 verified reviews", not "hundreds of reviews".
6. **Sentence case** for headings; **Title Case** only for proper nouns and legal page titles.
7. **US spelling.** The current codebase is British/South African ("organisation", "colour", "centre", "favourite", "recognise", "apologise"). **Convert everything**: organization, color, center, favorite, recognize, apologize. Note the homepage section is literally titled "Community favourites" — it becomes "Community favorites".

### 10.3 Section header formula

```
Eyebrow pill (2–3 words, icon)  →  H2 with lime chip on the final phrase  →  one sentence of subtitle
```

Examples from the live site, reusable as patterns:

| Eyebrow | H2 | Subtitle |
|---|---|---|
| Explore by category | Find the right tool for the job | Every product is assessed against real {market} requirements … |
| Head to head | Popular comparisons, **side by side** | The match ups {market} buyers research most … |
| Community favourites | The best reviewed software | Ranked by verified reviews and ratings … Vendors cannot pay their way to the top. |
| Fresh on the platform | Recently **reviewed** | The latest software to earn verified reviews from {market} teams. |
| From the blog | Guides for {market} buyers | — |
| Ratings | The rating, **broken down** | Every score below comes from verified reviews. Nothing is weighted or edited. |
| Screenshots | See {name} **up close** | A look at the screens you'll spend your day in. |
| Features | What {name} can **actually do** | The headline features first, then the full list as the vendor states it. |
| FAQ | We have the **answers** | The questions {market} buyers ask most about {name}, answered from the data on this page. |

### 10.4 Legal and policy tone

Legal pages are written in plain language on purpose, and say so: *"We have written it in plain language on purpose. If anything here is unclear, email us and a real person will explain it properly."*

Keep that. Rewrite the substance for CCPA/CPRA, PIPEDA, Quebec Law 25, CAN-SPAM and CASL, the FTC endorsement guides, and the correct regulators (FTC; Office of the Privacy Commissioner of Canada). Delete every POPIA, Information Regulator, PAIA and SARS reference.

### 10.5 Terms that must not survive

`SARS`, `eFiling`, `VAT201`, `VAT at 15%`, `EMP201`, `EMP501`, `IRP5`, `UIF`, `POPIA`, `PAIA`, `Information Regulator`, `rand`, `ZAR`, `R1 375`, `Cape Town`, `.co.za`, `en-ZA`, `South Africa(n)`, `Consumer Protection Act`, `the big five banks`, and any Afrikaans wordplay in the brand.

---

## 11. Known issues and improvements

Found by reading the source. **Fix these in the rebuild rather than cloning them.**

### 11.1 Real bugs

| # | Issue | Where | Fix |
|---|---|---|---|
| 1 | **Prose links are lime on white (~1.2:1)** — effectively invisible | `.prose-content a`, `.legal-content a`, `.article-content a` in `globals.css` | Use `var(--color-brand-dark)` |
| 2 | **`Button` `link` variant** uses `text-primary` (lime) | `components/ui/button.tsx` | Use `var(--color-brand-dark)` |
| 3 | **Locale produces the wrong number format** — `formatRating` renders `4,4` and `formatPrice` renders `R1 375` because `SITE_LOCALE = "en-ZA"` | `lib/format.ts` | `en-US` gives `4.4` and `$1,375`. **This is the single highest impact localization fix.** |
| 4 | **OG star renders as tofu** — Satori cannot load a font for `★` | `app/api/og/route.tsx` | Inline SVG star, or embed a font that covers it |
| 5 | **Legal pages 404 on an empty `pages` table** — the placeholder fallback only fires when Supabase is unconfigured or throws, not when a row is simply missing | `LegalPage` + `getPageBySlug` | Fall back to bundled content on `null`, or add a deploy time seed check |
| 6 | **`BRAND_GREEN` (`#00a86b`) is off palette** | `lib/brandColors.ts` | Use a token, not a stray hex |

### 11.2 Weak patterns

| # | Issue | Detail |
|---|---|---|
| 7 | **The command palette is not a search index** | `app/(public)/layout.tsx` seeds it with 8 products and 5 articles from `getTopRatedSoftware(8)` / `getLatestArticles(5)`. Users reasonably expect it to find everything. Wire it to the real search endpoint with debounced server search. |
| 8 | **Dark mode is dead code** | A complete `.dark` palette and `dark:` utilities exist across every component, but `forcedTheme="light"` disables all of it, and `ThemeToggle` is inert. Either finish and ship it or delete it. Carrying it doubles the styling surface for zero user value. |
| 9 | **`--font-outfit` is a legacy alias** | Points at Inter Tight, same as `--font-heading`. Remove. |
| 10 | **Three near duplicate prose systems** | `.prose-content`, `.legal-content`, `.article-content` share most rules. Extract the common base, keep only the genuine differences (lead paragraph, bullet shape, counters). |
| 11 | **Homepage ranking constants are magic** | `priorWeight` is the median review count and `meanRating` is computed per request from a 60 item page. Move to a documented, tested module. Note it is also implicitly capped by `perPage: 60`; if the catalogue exceeds 60 products the homepage silently ranks a subset. |
| 12 | **Repeated `single()` helper** | `const single = (v) => Array.isArray(v) ? v[0] : v` is redefined in several pages. Extract to `lib/utils.ts`. |
| 13 | **`lib/scrub.ts` carries legacy domain rewrites** | Regex maps for an older `.uk` domain. Dead weight in a new build. |
| 14 | **Hardcoded slug → colour map** | `BRAND_COLORS` will drift from the catalogue. Prefer `software.brand_color` in the database as the source of truth, with the map as a seed only convenience. |
| 15 | **Admin mark on a dark sidebar** | The sidebar is `#141517` and the logo's olive facet is dark on dark. Give `LogoMark` an `invert` prop like `BrandLogo` has. |
| 16 | **Screenshot filename → slug mapping is manual** | `UPLOADED_SCREENSHOTS` in `lib/screenshots.ts` hand maps files to slugs and is easy to desync. Prefer Supabase Storage with a slug convention, or at least a build time check that every mapped file exists. |
| 17 | **Large unoptimized screenshots** | Files in `/public/screenshots` run 1–2 MB each and are served through plain `<img>` with no responsive sizing. Compress and generate widths. |

### 11.3 Gaps to close

- **No skip link**, and `<main>` has no `id`.
- **No test suite at all.** At minimum add a smoke test that every route returns 200 and that the legal suite is seeded.
- **No error boundaries** (`error.tsx`) or loading states (`loading.tsx`) in any route segment.
- **Charts have no text alternative**, which the accessibility statement already concedes.
- **No `manifest.ts`**, so there is no installable PWA metadata or Android icon set. Only `app/icon.svg` exists.
- **`public/logo.png` is unreferenced** dead weight.

---

## 12. Localization checklist

Concrete, greppable work items for the US and Canada rebuild.

### 12.1 `lib/site.ts` — the single source of market truth

Every market signal is centralized here by design. Rewrite it and most of the site follows.

```ts
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://yourbrand.com").replace(/\/+$/, "");

export const SITE_NAME     = "YourBrand";
export const SITE_DOMAIN   = "yourbrand.com";
export const SITE_TAGLINE  = "…";                 // rewrite, drop "South Africa's #1"
export const CONTACT_EMAIL = "hello@yourbrand.com";
export const CONTACT_PHONE = "+1 …";
export const SITE_LOCATION = "…, United States";
export const SITE_LOCALE   = "en-US";             // was "en-ZA" — fixes 4,4 → 4.4
export const OG_LOCALE     = "en_US";

// North America is one market. Country survives only as a review lens.
export const REVIEWER_COUNTRIES = ["United States", "Canada", "Other"] as const;
export const DEFAULT_REVIEWER_COUNTRY = "United States";

// Single display currency. See §1.4.
export const CURRENCIES = ["USD", "CAD"] as const;  // CAD only for vendors who genuinely list in CAD
export const DEFAULT_CURRENCY = "USD";
```

**No region state anywhere.** No cookie, no switcher, no `useRegion()`, no IP lookup. If you find yourself adding one, re read §1.4.

### 12.2 `lib/format.ts`

```ts
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  CAD: "CA$",   // only rendered when a vendor genuinely lists in CAD
};
```

- `currencySymbol()` default `"ZAR"` → `"USD"`.
- `formatPrice()` default param `"ZAR"` → `"USD"`.
- `formatPricePerPeriod()` default `"ZAR"` → `"USD"`.
- `startingPriceLabel()` needs no logic change, only the currency defaults.
- `formatDate()` default options `{ day: "numeric", month: "long", year: "numeric" }` renders "8 July 2026" under `en-ZA`. Under `en-US` prefer `{ month: "long", day: "numeric", year: "numeric" }` → "July 8, 2026".

### 12.3 Type defaults

`lib/types.ts` comments and defaults reference ZAR and South Africa:

```ts
price_currency: string;    // default 'ZAR'      → 'USD'
reviewer_country: string;  // default 'South Africa' → 'United States'
```

### 12.4 Delete outright

- `app/(public)/paia-manual/page.tsx`
- The `PAIA Manual` entry in `Footer.LEGAL_LINKS`
- `/paia-manual` from `app/sitemap.ts`
- `lib/scrub.ts` legacy `.uk` rewrites
- `public/logo.png` if still unreferenced
- The whole South African `BRAND_COLORS` map

### 12.5 Rewrite content

- All six legal/policy pages in the `pages` table (privacy, cookie, terms, accessibility) plus the hand built `/affiliate-disclosure` and `/editorial-policy`.
- The About page YARDSTICK and hero heading.
- The homepage category explorer subtitle and blog section title.
- The footer newsletter band.
- Every product `description_full`, every article body, every FAQ "Local fit" answer.
- Root `lang` and OG `locale`.

### 12.6 Verify after the swap

```bash
# Nothing South African should survive
grep -rniE "sars|efiling|vat201|emp201|emp501|irp5|uif|popia|paia|information regulator|rand|zar|cape town|co\.za|en-ZA|south africa" app components lib scripts

# British spelling sweep
grep -rniE "organis|colour|centre|favourite|recognis|apologis|licence|analyse" app components lib
```

Then load the site and confirm:
- ratings render `4.4`, not `4,4`
- prices render `$1,375`, not `R1 375`
- `<html lang="en-US">`
- `<link rel="canonical">` points at the new domain (check `NEXT_PUBLIC_SITE_URL`, not just the code default)
- the legal suite returns 200, not 404

---

## Appendix A — Design token quick reference

```
BRAND
  lime        #d9f65f   fills only, never text on white
  lime strong #c9ec3e   hover fill
  ink         #1a2008   text on lime
  olive       #4c5f0a   brand text on white
  lime light  #f3fbd3   tint surface
  navy        #1b1f3b
  amber/star  #f5a623

SEMANTIC (light, authoritative)
  background  #ffffff      foreground  #111827
  card        #ffffff      muted       #f9fafb
  muted fg    #6b7280      accent      #f3f4f6
  border      #e5e7eb      ring        #b6d43a
  destructive #ef4444

TYPE
  body     DM Sans     400/500/700
  heading  Inter Tight 400–900
  fallback Inter       400–700

LAYOUT
  container  max 1440, pad 1/2/3rem @ base/768/1024
  plate      rounded-[1.75rem] bg-zinc-100/80 p-2
  card in plate  rounded-[1.4rem]
  card       rounded-3xl border-zinc-200/80 p-6
  button     0.875rem radius (.btn-glossy)

MOTION
  easing     cubic-bezier(0.16, 1, 0.3, 1)
  buttons    .2s   cards .25s   nav .3s   bars 1.1s   float 7s/8s
  reveal     animation-timeline: view(), entry 0% → entry 42%
```

## Appendix B — Build order

1. Scaffold Next 16 + React 19 + TypeScript, add the exact deps from §2.
2. Port `app/globals.css` verbatim (§3), swapping nothing but the brand mark.
3. `lib/utils.ts` (`cn`), `lib/site.ts` (localized, §12.1), `lib/format.ts` (localized, §12.2), `lib/types.ts`.
4. `components/ui/*` primitives (button, badge, dialog, tabs, command, …).
5. `BrandLogo` + `app/icon.svg` (theme aware, transparent).
6. `Navbar`, `Footer`, `app/layout.tsx`, `app/(public)/layout.tsx`.
7. Product surfaces: `SoftwareLogo`, `StarRating`, `SoftwareCard`, `SoftwareListRow`.
8. Homepage, then `/software`, then `/software/[slug]`.
9. Reviews, compare, blog, category.
10. Legal suite (**seed the `pages` table in the same step**, see §11.1 #5).
11. SEO: sitemap, robots, JSON-LD, OG route.
12. Admin.
13. Accessibility pass: skip link, `main` id, link contrast, chart alternatives.

---

*End of `FRONTEND.md`. The database schema, query layer, ranking maths, auth, admin, email, affiliate tracking and deployment are specified in `BACKEND.md`.*
