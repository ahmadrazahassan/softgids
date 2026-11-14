import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage (logos, screenshots, avatars, article images)
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
  async headers() {
    return [
      {
        /**
         * The admin panel is private, and its URLs carry record IDs we have no
         * business leaking to anywhere a user navigates next.
         *
         * Public pages are deliberately left alone. Modern browsers already
         * default to strict-origin-when-cross-origin, and affiliate links set
         * `referrerpolicy` on the element, which overrides any document or
         * header policy — so locking this down here costs us no attribution.
         * Do NOT widen this source to "/" or "/:path*": that is exactly the
         * kind of blanket no-referrer header that makes an affiliate network
         * report every click under "No referring domain".
         */
        source: "/admin/:path*",
        headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
      },
    ];
  },
};

export default nextConfig;
