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
        { source: '/projects', destination: '/projects.html' },
        { source: '/projects.html', destination: '/projects.html' },
        { source: '/industrial-wearable', destination: '/industrial-wearable.html' },
        { source: '/industrial-wearable.html', destination: '/industrial-wearable.html' },
        { source: '/projects/industrial-wearable', destination: '/industrial-wearable.html' },
        { source: '/final-year-project', destination: '/industrial-wearable.html' },
        { source: '/projects/final-year-project', destination: '/industrial-wearable.html' },
        { source: '/wearable-ai', destination: '/industrial-wearable.html' },
        { source: '/projects/wearable-ai', destination: '/industrial-wearable.html' },
        { source: '/sort-waste', destination: '/sort-waste.html' },
        { source: '/sort-waste.html', destination: '/sort-waste.html' },
        { source: '/projects/sort-waste', destination: '/sort-waste.html' },
        { source: '/api/sort-waste/predict', destination: 'http://127.0.0.1:5000/api/predict' },
        { source: '/api/sort-waste/gradcam', destination: 'http://127.0.0.1:5000/api/gradcam' },
        { source: '/api/sort-waste/info', destination: 'http://127.0.0.1:5000/api/info' },
        { source: '/api/sort-waste/plots', destination: 'http://127.0.0.1:5000/api/plots' },
        { source: '/api/sort-waste/samples', destination: 'http://127.0.0.1:5000/api/samples' },
        { source: '/api/sort-waste/sample_image/:path*', destination: 'http://127.0.0.1:5000/api/sample_image/:path*' },
        { source: '/api/predict', destination: 'http://127.0.0.1:5000/api/predict' },
        { source: '/api/gradcam', destination: 'http://127.0.0.1:5000/api/gradcam' },
        { source: '/api/info', destination: 'http://127.0.0.1:5000/api/info' },
        { source: '/api/plots', destination: 'http://127.0.0.1:5000/api/plots' },
        { source: '/api/samples', destination: 'http://127.0.0.1:5000/api/samples' },
        { source: '/api/sample_image/:path*', destination: 'http://127.0.0.1:5000/api/sample_image/:path*' },
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

