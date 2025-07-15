/** @type {import('next').NextConfig} */
const nextConfig = {
  // appDir is now stable in Next.js 13.4+, no need for experimental flag
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig