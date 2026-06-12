import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Разрешаем dev-серверу принимать запросы через Cloudflare-туннель.
  // URL эфемерный (territory-view-align-linda.trycloudflare.com и т.п.),
  // поэтому wildcard на весь домен.
  allowedDevOrigins: ['*.trycloudflare.com'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
