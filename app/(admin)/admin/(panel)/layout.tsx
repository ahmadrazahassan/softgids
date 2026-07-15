import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeftRight,
  BarChart3,
  FileText,
  Inbox,
  LayoutDashboard,
  LayoutGrid,
  Layers,
  MailCheck,
  Settings,
  Star,
  StickyNote,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/public";
import { signOut } from "@/app/(admin)/admin/actions";
import { LogoMark } from "@/components/public/BrandLogo";

export const metadata: Metadata = {
  title: { template: "%s · SoftGids admin", default: "SoftGids admin" },
  robots: { index: false, follow: false },
};

const NAV = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Software", href: "/admin/software", icon: Layers },
  { label: "Reviews", href: "/admin/reviews", icon: Star },
  { label: "Categories", href: "/admin/categories", icon: LayoutGrid },
  { label: "Articles", href: "/admin/articles", icon: FileText },
  { label: "Comparisons", href: "/admin/comparisons", icon: ArrowLeftRight },
  { label: "Pages", href: "/admin/pages", icon: StickyNote },
  { label: "Newsletter", href: "/admin/newsletter", icon: MailCheck },
  { label: "Contact", href: "/admin/contact", icon: Inbox },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured()) redirect("/admin/login");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  return (
    <div className="flex min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-[#141517] px-4 py-6 text-zinc-400 lg:flex">
        <Link href="/admin" className="mb-8 flex items-center gap-2.5 px-2">
          <LogoMark className="size-7" />
          <span className="font-heading text-lg font-medium tracking-tight text-white">
            Soft<span className="font-semibold text-[var(--color-brand)]">Gids</span>
          </span>
        </Link>
        <nav className="flex-1 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-2 border-t border-white/10 pt-4">
          <p className="truncate px-3 text-xs text-zinc-500">{user.email}</p>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full cursor-pointer rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              Sign out
            </button>
          </form>
          <Link
            href="/"
            className="block rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            View site
          </Link>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-5 py-8 sm:px-8">{children}</main>
    </div>
  );
}
