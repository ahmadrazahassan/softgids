import type { Metadata } from "next";
import { DM_Sans, Inter, Inter_Tight } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next";
import { siteUrl, SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Independent reviews and side-by-side comparisons of accounting, payroll, HR, CRM, ERP and project management software for South African businesses.",
  openGraph: {
    type: "website",
    locale: "en_ZA",
    siteName: SITE_NAME,
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-ZA"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${dmSans.variable} ${inter.variable} ${interTight.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Impact.com media property verification. Rendered raw so the
            non-standard `value` attribute their crawler checks is preserved;
            React hoists this into <head>. */}
        <meta
          {...({
            name: "impact-site-verification",
            value: "5b80cfb6-29d2-42e8-bdeb-e3aeac02b9eb",
          } as Record<string, string>)}
        />
        {/* Light-only brand direction — the theme is forced site-wide. */}
        <ThemeProvider attribute="class" forcedTheme="light" enableSystem={false}>
          {children}
          <Toaster position="top-right" richColors />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
