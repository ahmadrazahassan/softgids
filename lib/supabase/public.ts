import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Anonymous, RLS-constrained client for public reads. Degrades gracefully:
 * when the environment is unset (local preview, CI), `createPublicClient()`
 * returns null and every fetcher falls back to placeholder data so the site
 * always builds and renders.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

let cached: SupabaseClient | null = null;

export function createPublicClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!cached) {
    cached = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  }
  return cached;
}
