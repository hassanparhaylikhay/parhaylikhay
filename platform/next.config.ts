import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      // beforeFiles runs before pages are checked — serves landing.html at /
      beforeFiles: [
        {
          source: "/",
          destination: "/landing.html",
        },
      ],
      afterFiles: [],
      fallback: [],
    }
  },
}

export default nextConfig
