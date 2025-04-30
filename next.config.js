import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  swcMinify: true,
  optimizeFonts: true,
  experimental: {
    optimizeCss: true
  },
  env: {
    BACKEND_URL: 'http://localhost:8000',
  },
  images: {
    domains: [
      'localhost', 
      'comicimages3upload.s3.us-east-1.amazonaws.com'
    ],
  },
  async rewrites() {
    return [
      {
        source: '/auth/:path*',
        destination: 'http://localhost:8000/auth/:path*'
      }
    ];
  },
  optimizeScripts: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig; 