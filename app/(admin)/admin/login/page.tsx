import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/public";
import { LoginForm } from "@/components/admin/LoginForm";
import { LogoMark } from "@/components/public/BrandLogo";

export const metadata: Metadata = {
  title: "Admin login",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/admin");
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[#141517] px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <LogoMark className="size-10" />
          <h1 className="font-heading text-2xl font-medium tracking-tight text-white">
            SoftGids admin
          </h1>
          <p className="text-sm text-zinc-500">One account. Sign in to manage the platform.</p>
        </div>
        <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-6">
          {isSupabaseConfigured() ? (
            <LoginForm />
          ) : (
            <p className="text-sm leading-relaxed text-zinc-400">
              Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL,
              NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY to
              .env.local, run the migrations and the seed, then create your
              admin user in the Supabase dashboard.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
