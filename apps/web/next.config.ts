import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@securelend/shared'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/:path*',
      },
      {
        source: '/health',
        destination: 'http://localhost:4000/health',
      },
    ];
  },
};

export default nextConfig;
