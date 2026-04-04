import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 允許本地 /uploads/ 的圖片
    localPatterns: [
      {
        pathname: "/uploads/**",
      },
      {
        pathname: "/placeholder-product.svg",
      },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
    // SVG 支援
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
