/**
 * Create (or reset) the single admin auth user.
 *
 *   npm run create-admin -- zaidumar422cg@gmail.com "YourStrongPassword"
 *
 * Reads the Supabase URL and service role key from .env.local, creates the
 * user with the email already confirmed, and makes sure the address is on
 * the admin_allowlist so the RLS policies accept it. If the user already
 * exists, the password is updated instead.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (!match) continue;
      const value = match[2].replace(/^["']|["']$/g, "");
      if (!process.env[match[1]]) process.env[match[1]] = value;
    }
  } catch {
    /* fine when vars are exported in the shell */
  }
}
loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const [email, password] = process.argv.slice(2);

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  process.exit(1);
}
if (!email || !password) {
  console.error('Usage: npm run create-admin -- you@example.com "YourStrongPassword"');
  process.exit(1);
}
if (password.length < 10) {
  console.error("Pick a password of at least 10 characters.");
  process.exit(1);
}

const db = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const { data: created, error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    // Already registered: find the user and set the new password instead.
    const { data: list, error: listError } = await db.auth.admin.listUsers();
    if (listError) throw listError;
    const existing = list.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase()
    );
    if (!existing) throw error;

    const { error: updateError } = await db.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    });
    if (updateError) throw updateError;
    console.log(`Updated the password for ${email}.`);
  } else {
    console.log(`Created admin user ${email} (id ${created.user?.id}).`);
  }

  const { error: allowError } = await db
    .from("admin_allowlist")
    .upsert({ email: email.toLowerCase() }, { onConflict: "email" });
  if (allowError) {
    console.warn(
      `Could not update admin_allowlist (${allowError.message}). Run supabase/setup_complete.sql first.`
    );
  } else {
    console.log(`${email} is on the admin allowlist.`);
  }

  console.log("Done. Sign in at /admin/login.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
