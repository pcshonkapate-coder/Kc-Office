import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return {
      beforeFiles: [
        { source: '/', destination: '/index.html' },
        { source: '/about', destination: '/about.html' },
        { source: '/services', destination: '/services.html' },
        { source: '/software-development', destination: '/software-development.html' },
        { source: '/ai-solutions', destination: '/ai-solutions.html' },
        { source: '/it-solutions', destination: '/it-solutions.html' },
        { source: '/ml-data', destination: '/ml-data.html' },
        { source: '/industries', destination: '/industries.html' },
        { source: '/contact', destination: '/contact.html' },
        { source: '/portal', destination: '/os' },
        { source: '/portal.html', destination: '/os' },
        { source: '/app', destination: '/os' },
        { source: '/privacy', destination: '/privacy.html' },
        { source: '/terms', destination: '/terms.html' },
        { source: '/security', destination: '/security.html' },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;

