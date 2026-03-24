/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  inlineCss: true,
  turbopack: {
    resolveExtensions: [".ts", ".tsx", ".js", ".jsx"],
  },
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
  optimizePackageImports: [
    "@tabler/icons-react",
    "lucide-react",
    "@radix-ui/react-accordion",
    "@radix-ui/react-avatar",
    "@radix-ui/react-checkbox",
    "@radix-ui/react-collapsible",
    "@radix-ui/react-context-menu",
    "@radix-ui/react-dialog",
    "@radix-ui/react-dropdown-menu",
    "@radix-ui/react-hover-card",
    "@radix-ui/react-popover",
    "@radix-ui/react-select",
    "@radix-ui/react-tabs",
    "@radix-ui/react-tooltip",
    "@dnd-kit/core",
    "@dnd-kit/sortable",
    "motion",
    "convex",
    "zod",
  ],
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
