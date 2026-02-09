import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['pg'],
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.buymeacoffee.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  // Vercel deployment için optimize edilmiş ayarlar
  experimental: {
    // Serverless functions için optimize
    serverActions: {
      bodySizeLimit: '2mb',
    },
    optimizePackageImports: ['react-bootstrap', 'react-leaflet'],
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  // swcMinify is enabled by default in Next.js 16, no need to specify
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
