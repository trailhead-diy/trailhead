import { defineConfig } from 'tsup';

export default defineConfig({
  // Entry points
  entry: {
    index: 'src/index.ts',
    cli: 'src/cli.ts',
  },
  // Multiple formats for library usage
  format: ['cjs', 'esm'],
  // Generate TypeScript declarations
  dts: true,
  // Clean output directory
  clean: true,
  // Enable minification in production
  minify: process.env.NODE_ENV === 'production',
  // Generate source maps for debugging
  sourcemap: true,
  // Enable tree-shaking
  treeshake: true,
  // Split code for better caching
  splitting: true,
  // Target modern environments
  target: 'es2022',
  // Handle path aliases using tsc-alias after build
  onSuccess: 'tsc-alias',
  // External dependencies (peer dependencies and Node.js built-ins)
  external: [
    'react',
    'react-dom',
    'next-themes',
    'tailwindcss',
    'framer-motion',
    '@headlessui/react',
    'lucide-react',
    'clsx',
    'tailwind-merge',
    'culori',
    'zod',
    'semver',
    'commander',
    'chalk',
    '@inquirer/prompts',
    '@npmcli/package-json',
    'nypm',
  ],
  // Bundle configuration
  bundle: true,
  // Keep class names for better debugging
  keepNames: true,
  // Enable CJS interop for better compatibility
  cjsInterop: true,
  // Shims for Node.js compatibility
  shims: true,
});
