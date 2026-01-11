/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimisticClientCache: true,
  },
  turbopack: {
    resolveExtensions: [".ts", ".tsx", ".js", ".jsx"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "projectv.uk",
      },
      {
        protocol: "https",
        hostname: "imgur.com",
      },
    ],
  },
};

module.exports = nextConfig;
