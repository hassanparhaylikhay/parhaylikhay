import type { NextConfig } from "next"
import path from "node:path"

const nextConfig: NextConfig = {
  // Vercel's framework adapter has been throwing 'path argument
  // undefined' inside its modifyConfig step ever since 2026-05-22.
  // Their support flagged the custom root directory ('platform/') as
  // the likely cause. Setting outputFileTracingRoot explicitly tells
  // Next.js (and Vercel's adapter) exactly where the project root is
  // instead of letting it infer.
  outputFileTracingRoot: path.join(__dirname, ".."),
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
