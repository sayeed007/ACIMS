/** @type {import('next').NextConfig} */
const nextConfig = {
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },
  images: { unoptimized: true },
  experimental: {
    turbopackUseSystemTlsCerts: true,
  },
};

module.exports = nextConfig;
