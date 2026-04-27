import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  
  // Empty turbopack config to silence the warning
  turbopack: {},
};

export default nextConfig;
