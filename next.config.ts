import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage (logos, screenshots, avatars, article images)
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
};

export default nextConfig;
