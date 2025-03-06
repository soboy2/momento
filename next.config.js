/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'images.unsplash.com',
      'firebasestorage.googleapis.com',
      'lh3.googleusercontent.com',
      'avatars.githubusercontent.com',
      'randomuser.me',
      'picsum.photos'
    ],
  },
  // Properly handle Mapbox
  transpilePackages: ['mapbox-gl'],
};

module.exports = nextConfig; 