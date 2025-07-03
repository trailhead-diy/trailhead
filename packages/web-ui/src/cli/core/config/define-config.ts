import type { TrailheadConfig } from './schema.js';

/**
 * Helper function to define configuration with TypeScript support
 *
 * @example
 * ```typescript
 * // trailhead.config.ts
 * import { defineConfig } from 'trailhead-ui'
 *
 * export default defineConfig({
 *   install: {
 *     destDir: './components/ui',
 *     wrappers: true
 *   },
 *   transforms: {
 *     enabled: true,
 *     srcDir: './src/components',
 *     excludePatterns: ['**\/*.test.tsx'],
 *     enabledTransforms: ['button', 'alert', 'badge']
 *   }
 * })
 * ```
 */
export function defineConfig(config: TrailheadConfig): TrailheadConfig {
  return config;
}
