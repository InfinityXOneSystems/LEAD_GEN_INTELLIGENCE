/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async rewrites() {
    // Proxy all /api/* requests from the browser to the Express gateway.
    // In development: set NEXT_PUBLIC_API_URL=http://localhost:3000
    // In production:  set NEXT_PUBLIC_API_URL to your deployed gateway URL.
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3001"],
    },
  },
};

module.exports = nextConfig;
