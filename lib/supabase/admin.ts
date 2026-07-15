import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";

/**
 * Service role client for privileged writes: review submission, newsletter
 * signup, affiliate click logging and admin mutations. Server only; the key
 * is never NEXT_PUBLIC_ and this module cannot be imported by client code.
 */

export function isAdminConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

let cached: SupabaseClient | null = null;

export function createAdminClient(): SupabaseClient | null {
  if (!isAdminConfigured()) return null;
  if (!cached) {
    cached = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  }
  return cached;
}

/** SHA-256 of an IP address. We never store the raw address (POPIA). */
export function hashIp(ip: string | null | undefined): string {
  return createHash("sha256").update(ip?.trim() || "unknown").digest("hex");
}
