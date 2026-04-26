import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  
  // Fix for Cesium WebGL shaders throwing octal escape errors in production.
  // SWC minifier incorrectly parses null bytes (\0) in Cesium's shader strings as octal template escapes.
  swcMinify: false,
  
  // Empty turbopack config to silence the warning
  turbopack: {},
};

export default nextConfig;
