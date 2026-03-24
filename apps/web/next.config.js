/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    resolveExtensions: [".ts", ".tsx", ".js", ".jsx"],
  },
  async headers() {
    return [
      {
        source: "/:owner/:repo/sessions/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "upgrade-insecure-requests",
          },
        ],
      },
      {
        source: "/:owner/:repo/:extra/sessions/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "upgrade-insecure-requests",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
