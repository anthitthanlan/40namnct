import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.133", "192.168.1.222", "192.168.1.176", "192.168.1.189"],
  images: {
    // Cloudflare Workers không hỗ trợ /_next/image optimization endpoint
    unoptimized: true,
  },
};

export default nextConfig;
