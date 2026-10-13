import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@taim/config', '@taim/i18n', '@taim/core'],
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 3600,
    deviceSizes: [640, 750, 828, 1080, 1200],
  },
  experimental: {
    optimizePackageImports: ['@taim/i18n', '@taim/config', '@taim/core'],
  },
}

export default nextConfig
