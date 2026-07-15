"use client";

import { createBrowserClient } from "@supabase/ssr";

/** Browser client (anon key). Used by client components that need auth state. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
