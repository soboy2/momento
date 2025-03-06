/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Properly handle Mapbox
  transpilePackages: ['mapbox-gl'],
};

module.exports = nextConfig; 