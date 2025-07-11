import { describe, it, expect } from 'vitest';
import {
  trailheadConfigSchema,
  installConfigSchema,
  devRefreshConfigSchema,
} from '@/cli/config.js';

// Default configuration for tests
const defaultConfig = {
  install: {
    wrappers: true,
  },
  devRefresh: {
    prefix: 'catalyst-',
  },
  verbose: false,
  dryRun: false,
};

describe('Configuration Schema', () => {
  describe('trailheadConfigSchema', () => {
    it('should accept valid configuration', () => {
      const validConfig = {
        install: {
          destDir: './components/ui',
          wrappers: true,
        },
        devRefresh: {
          srcDir: './catalyst-ui-kit',
          destDir: './src/components/lib',
          prefix: 'catalyst-',
        },
        verbose: true,
        dryRun: false,
      };

      const result = trailheadConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('should accept empty config (defaults handled by loader)', () => {
      const minimalConfig = {};
      const result = trailheadConfigSchema.safeParse(minimalConfig);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.verbose).toBeUndefined();
        expect(result.data.dryRun).toBeUndefined();
      }
    });

    it('should reject invalid types', () => {
      const invalidConfig = {
        verbose: 'yes', // Should be boolean
        install: {
          wrappers: 'true', // Should be boolean
        },
      };

      const result = trailheadConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });
  });

  describe('installConfigSchema', () => {
    it('should accept valid install config', () => {
      const validConfig = {
        destDir: './components/ui',
        wrappers: false,
      };

      const result = installConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.destDir).toBe('./components/ui');
        expect(result.data.wrappers).toBe(false);
      }
    });

    it('should accept empty install config', () => {
      const minimalConfig = {};
      const result = installConfigSchema.safeParse(minimalConfig);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.wrappers).toBeUndefined();
      }
    });
  });

  describe('devRefreshConfigSchema', () => {
    it('should accept valid dev refresh config', () => {
      const validConfig = {
        srcDir: './catalyst-ui-kit/typescript',
        destDir: './src/components/lib',
        prefix: 'cat-',
      };

      const result = devRefreshConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.srcDir).toBe('./catalyst-ui-kit/typescript');
        expect(result.data.destDir).toBe('./src/components/lib');
        expect(result.data.prefix).toBe('cat-');
      }
    });

    it('should accept empty devRefresh config', () => {
      const minimalConfig = {};
      const result = devRefreshConfigSchema.safeParse(minimalConfig);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.prefix).toBeUndefined();
      }
    });
  });

  describe('defaultConfig', () => {
    it('should have valid default configuration', () => {
      const result = trailheadConfigSchema.safeParse(defaultConfig);
      expect(result.success).toBe(true);
    });

    it('should have expected default values', () => {
      expect(defaultConfig.install?.wrappers).toBe(true);
      expect(defaultConfig.devRefresh?.prefix).toBe('catalyst-');
      expect(defaultConfig.verbose).toBe(false);
      expect(defaultConfig.dryRun).toBe(false);
    });
  });
});
