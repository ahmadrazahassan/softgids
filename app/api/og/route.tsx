import { ImageResponse } from "next/og";
import { SITE_DOMAIN } from "@/lib/site";

export const runtime = "edge";

/**
 * Dynamic OpenGraph image (1200×630): brand mark, title, optional rating,
 * and the softgids.co.za domain footer.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title")?.slice(0, 90) ?? "SoftGids";
  const rating = Number(searchParams.get("rating")) || null;
  const type = searchParams.get("type") ?? "page";

  const subtitle =
    type === "software"
      ? "Verified reviews, pricing & alternatives"
      : type === "article"
        ? "Guides for South African businesses"
        : "South Africa's #1 Business Software Reviews Platform";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #1b1f3b 0%, #10132a 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        {/* Brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="64" height="56" viewBox="0 0 64 56" fill="none">
            <path d="M10 40 A22 22 0 0 1 54 40" stroke="#d9f65f" strokeOpacity="0.3" strokeWidth="7.5" strokeLinecap="round" />
            <path d="M10 40 A22 22 0 0 1 44.93 22.2" stroke="#d9f65f" strokeWidth="7.5" strokeLinecap="round" />
            <line x1="32" y1="40" x2="40.2" y2="28.7" stroke="#d9f65f" strokeWidth="4.5" strokeLinecap="round" />
            <circle cx="32" cy="40" r="4.5" fill="#d9f65f" />
          </svg>
          <div style={{ display: "flex", fontSize: 36, fontWeight: 700 }}>
            <span>Soft</span>
            <span style={{ color: "#d9f65f" }}>Gids</span>
          </div>
        </div>

        {/* Title block */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: title.length > 50 ? 52 : 64,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: -1,
              maxWidth: 980,
            }}
          >
            {title}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {rating != null && rating > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "#d9f65f",
                  color: "#1a2008",
                  borderRadius: 999,
                  padding: "10px 24px",
                  fontSize: 28,
                  fontWeight: 700,
                }}
              >
                ★ {rating.toFixed(1)} / 5
              </div>
            )}
            <div style={{ fontSize: 26, color: "#9ca3af" }}>{subtitle}</div>
          </div>
        </div>

        {/* Domain footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(255,255,255,0.15)",
            paddingTop: 28,
            fontSize: 24,
            color: "#9ca3af",
          }}
        >
          <span>{SITE_DOMAIN}</span>
          <span style={{ color: "#d9f65f", fontWeight: 600 }}>🇿🇦 Made for South Africa</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
