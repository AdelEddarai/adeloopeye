import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  
  // Disable Turbopack to avoid SWC binary issues
  // Use webpack instead (more stable on Windows)
  experimental: {
    turbo: undefined,
  },
};

export default nextConfig;
