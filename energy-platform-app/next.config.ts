import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: process.env.NODE_ENV === 'production' ? '/community-field-notes/energy-platform' : '',
  transpilePackages: ['three'],
  images: { unoptimized: true },
};

export default nextConfig;
