/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    BACKEND_URL: process.env.NODE_ENV === 'production' 
      ? 'https://api.sohankumar.com' 
      : 'http://localhost:8000',
  },
  images: {
    domains: ['localhost', 'comicimages3upload.s3.us-east-1.amazonaws.com', 'api.sohankumar.com'],
  },
  async rewrites() {
    return process.env.NODE_ENV === 'production' 
      ? [
          {
            source: '/auth/:path*',
            destination: 'https://api.sohankumar.com/auth/:path*'
          },
          {
            source: '/api/payments/:path*',
            destination: 'https://api.sohankumar.com/payments/:path*'
          }
        ]
      : [
          {
            source: '/auth/:path*',
            destination: 'http://localhost:8000/auth/:path*'
          },
          {
            source: '/api/payments/:path*',
            destination: 'http://localhost:8000/payments/:path*'
          }
        ]
  },
  output: 'standalone',
};

export default nextConfig;