import type { NextConfig } from 'next'

/**
 * Next.js Configuration
 *
 * - YAGNI: Only essential configuration
 * - Type safety: Fully typed configuration
 * - Performance: Optimized for development and production
 */
const nextConfig: NextConfig = {
  // Enable Turbopack for faster development builds (now stable)
  turbopack: {
    // Turbopack configuration
  },

  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
  },

  // Enable strict mode for better development experience
  reactStrictMode: true,

  // Type checking during build
  typescript: {
    // Fail build on type errors
    ignoreBuildErrors: false,
  },

  // ESLint during build
  eslint: {
    // Fail build on lint errors
    ignoreDuringBuilds: false,
  },
}

export default nextConfig
