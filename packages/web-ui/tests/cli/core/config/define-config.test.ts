import { describe, it, expect } from 'vitest';
import { defineConfig } from '../../../../src/cli/core/config/define-config.js';
import type { TrailheadConfig } from '../../../../src/cli/core/config/schema.js';

describe('defineConfig', () => {
  it('should return the config object as-is', () => {
    const config: TrailheadConfig = {
      install: {
        destDir: './components/ui',
        wrappers: true,
      },
      transforms: {
        enabled: true,
        srcDir: './src/components',
        excludePatterns: ['**/*.test.tsx'],
        enabledTransforms: ['button', 'alert'],
        disabledTransforms: [],
      },
      verbose: false,
      dryRun: false,
    };

    const result = defineConfig(config);
    expect(result).toBe(config);
    expect(result).toEqual(config);
  });

  it('should provide type safety', () => {
    // This test verifies TypeScript compilation
    const config = defineConfig({
      install: {
        destDir: './components/ui',
        wrappers: true,
      },
      transforms: {
        enabled: true,
        srcDir: './src/components',
        excludePatterns: ['**/*.test.tsx'],
        enabledTransforms: ['button', 'alert', 'badge'],
      },
      devRefresh: {
        srcDir: './catalyst-ui-kit/typescript',
        destDir: './src/components/lib',
        prefix: 'catalyst-',
      },
      verbose: true,
      dryRun: false,
    });

    // Type assertions to ensure proper typing
    expect(config.install?.destDir).toBe('./components/ui');
    expect(config.transforms?.enabledTransforms).toContain('button');
    expect(config.devRefresh?.prefix).toBe('catalyst-');
  });

  it('should work with minimal config', () => {
    const config = defineConfig({});
    expect(config).toEqual({});
  });

  it('should work with partial config', () => {
    const config = defineConfig({
      transforms: {
        enabledTransforms: ['button', 'badge'],
      },
    });

    expect(config.transforms?.enabledTransforms).toEqual(['button', 'badge']);
    expect(config.install).toBeUndefined();
    expect(config.verbose).toBeUndefined();
  });
});
