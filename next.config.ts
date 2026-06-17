import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimasi gambar — matikan saat dev untuk lebih cepat
  images: {
    unoptimized: process.env.NODE_ENV === "development",
  },

  // Experimental: optimasi import lucide-react (tree-shaking lebih agresif)
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },

  // Mengizinkan Cloudflare Tunnel untuk mengakses HMR & assets di Next.js 16
  allowedDevOrigins: [
    "app.unesa.dev",
    "app.claude-code.bond",
  ],
};

export default nextConfig;
