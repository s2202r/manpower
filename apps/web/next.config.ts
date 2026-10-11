import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@taim/config', '@taim/i18n', '@taim/core'],
}

export default nextConfig
