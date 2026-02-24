import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "expo-flow-manage.vercel.app",
          },
        ],
        destination: "https://admin.ildexandhortiagri-vietnam.com/:path*",
        permanent: true, // 301 redirect
      },
    ];
  },
};

export default nextConfig;
