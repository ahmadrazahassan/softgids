import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** CSV export of newsletter subscribers. Admin session required. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorised", { status: 401 });

  const { data: subscribers } = await supabase
    .from("newsletter_subscribers")
    .select("email, status, consent_source, created_at, confirmed_at, unsubscribed_at")
    .order("created_at", { ascending: false });

  const escape = (value: unknown) =>
    `"${String(value ?? "").replaceAll('"', '""')}"`;
  const lines = [
    "email,status,consent_source,created_at,confirmed_at,unsubscribed_at",
    ...(subscribers ?? []).map((row) =>
      [row.email, row.status, row.consent_source, row.created_at, row.confirmed_at, row.unsubscribed_at]
        .map(escape)
        .join(",")
    ),
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="newsletter-subscribers.csv"',
    },
  });
}
