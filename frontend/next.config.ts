import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  // In local development, proxy same-origin /api/* requests to the FastAPI
  // backend (default http://localhost:8000) so the browser can call relative
  // URLs like /api/chat — exactly as it will in production, where vercel.json
  // routes /api/* to the Python function. Override the target with
  // BACKEND_ORIGIN if your backend runs elsewhere.
  async rewrites() {
    if (process.env.NODE_ENV !== "development") return [];
    const backend = process.env.BACKEND_ORIGIN ?? "http://localhost:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${backend}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
