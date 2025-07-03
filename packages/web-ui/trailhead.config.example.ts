import { defineConfig } from './src/cli/core/config/define-config';

/**
 * Example TypeScript configuration for Trailhead UI
 * Copy this file to `trailhead.config.ts` and customize as needed
 */
export default defineConfig({
  // Installation settings
  install: {
    dest: 'src/components/ui',
    framework: 'nextjs', // 'nextjs' | 'vite' | 'redwood-sdk' | 'generic-react'
    wrappers: true,
  },

  // Transform settings for color-to-semantic-token conversion
  transforms: {
    enabled: true,
    src: 'src/components/lib',

    // Option 1: Enable only specific transforms
    // enabledTransforms: ['button', 'badge', 'alert', 'dialog'],

    // Option 2: Disable specific transforms
    // disabledTransforms: ['table', 'combobox'],
  },

  // Development refresh settings
  devRefresh: {
    src: 'catalyst-ui-kit/typescript',
    dest: 'src/components/lib',
    clean: true,
  },

  // Global settings
  verbose: false,
  dryRun: false,
});
