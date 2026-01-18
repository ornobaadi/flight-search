import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pic.avs.io',
        pathname: '/al/**',
      },
      {
        protocol: 'https',
        hostname: 'static.wikia.nocookie.net',
        pathname: '/logopedia/**',
      },
      {
        protocol: 'https',
        hostname: 'toppng.com',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'brandlogos.net',
        pathname: '/wp-content/**',
      },
      {
        protocol: 'https',
        hostname: 'content.airhex.com',
        pathname: '/content/logos/**',
      },
      {
        protocol: 'https',
        hostname: 'images.kiwi.com',
        pathname: '/airlines/**',
      },
    ],
  },
};

export default nextConfig;
