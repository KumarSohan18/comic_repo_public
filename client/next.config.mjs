/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    BACKEND_URL: process.env.NODE_ENV === 'production' ? 'https://api.sohankumar.com' : 'http://localhost:8000',
  
  },
  images: {
    domains: ['localhost', 'comicimages3upload.s3.us-east-1.amazonaws.com'],
  },
  async rewrites() {
    return [
      {
        source: '/auth/:path*',
        destination: 'http://localhost:8000/auth/:path*'
      },
      {
        source: '/api/payments/:path*',
        destination: 'http://localhost:8000/payments/:path*'
      }
    ];
  },
  output: 'standalone',
};

export default nextConfig; 