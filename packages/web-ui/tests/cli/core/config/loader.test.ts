import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig, loadConfigSync, clearConfigCache } from '../../../../src/cli/config.js';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// Default configuration for tests
const defaultConfig = {
  install: {
    wrappers: true,
  },
  transforms: {
    enabled: true,
    excludePatterns: [],
    disabledTransforms: [],
  },
  devRefresh: {
    prefix: 'catalyst-',
  },
  verbose: false,
  dryRun: false,
};

describe('Configuration Loader', () => {
  let testDir: string;

  beforeEach(() => {
    // Create a temporary directory for testing
    testDir = join(tmpdir(), `trailhead-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    clearConfigCache();
  });

  afterEach(() => {
    // Clean up
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
    clearConfigCache();
  });

  describe('loadConfig', () => {
    it('should return default config when no config file exists', async () => {
      const result = await loadConfig(testDir);

      expect(result.config).toEqual(defaultConfig);
      expect(result.filepath).toBe(null);
      expect(result.source).toBe('defaults');
    });

    it('should load config from .trailheadrc.json', async () => {
      const configPath = join(testDir, '.trailheadrc.json');
      const testConfig = {
        transforms: {
          enabled: false,
          srcDir: './custom/src',
          enabledTransforms: ['button', 'badge'],
        },
        verbose: true,
      };

      writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

      const result = await loadConfig(testDir);

      expect(result.config.transforms?.enabled).toBe(false);
      expect(result.config.transforms?.srcDir).toBe('./custom/src');
      expect(result.config.transforms?.enabledTransforms).toEqual(['button', 'badge']);
      expect(result.config.verbose).toBe(true);
      expect(result.filepath).toBe(configPath);
      expect(result.source).toBe('file');
    });

    it('should validate config schema', async () => {
      const configPath = join(testDir, '.trailheadrc.json');
      const invalidConfig = {
        transforms: {
          enabled: 'not-a-boolean', // Invalid type
        },
      };

      writeFileSync(configPath, JSON.stringify(invalidConfig, null, 2));

      // Should throw an error due to invalid schema
      await expect(loadConfig(testDir)).rejects.toThrow();
    });

    it('should cache loaded config when file unchanged', async () => {
      const configPath = join(testDir, '.trailheadrc.json');
      const testConfig = { verbose: true };

      writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

      // First load
      const result1 = await loadConfig(testDir);
      expect(result1.config.verbose).toBe(true);

      // Second load without file change should return cached value
      const result2 = await loadConfig(testDir);
      expect(result2.config.verbose).toBe(result1.config.verbose);
      expect(result2.config.verbose).toBe(true);
    });
  });

  describe('loadConfigSync', () => {
    it('should work synchronously', () => {
      // Clear cache before sync test
      clearConfigCache();

      const configPath = join(testDir, '.trailheadrc.json');
      const testConfig = {
        install: {
          destDir: './components/ui',
          wrappers: false,
        },
      };

      writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

      const result = loadConfigSync(testDir);

      expect(result.config.install?.destDir).toBe('./components/ui');
      expect(result.config.install?.wrappers).toBe(false);
      expect(result.filepath).toBe(configPath);
      expect(result.source).toBe('file');
    });
  });

  describe('Config file discovery', () => {
    it('should find config in package.json', async () => {
      const packagePath = join(testDir, 'package.json');
      const packageJson = {
        name: 'test-project',
        trailhead: {
          transforms: {
            srcDir: './src/components',
          },
        },
      };

      writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));

      const result = await loadConfig(testDir);

      expect(result.config.transforms?.srcDir).toBe('./src/components');
      expect(result.filepath).toBe(packagePath);
      expect(result.source).toBe('package.json');
    });

    it('should prefer .trailheadrc over package.json', async () => {
      const rcPath = join(testDir, '.trailheadrc.json');
      const packagePath = join(testDir, 'package.json');

      writeFileSync(rcPath, JSON.stringify({ verbose: true }, null, 2));
      writeFileSync(
        packagePath,
        JSON.stringify(
          {
            name: 'test-project',
            trailhead: { verbose: false },
          },
          null,
          2
        )
      );

      const result = await loadConfig(testDir);

      expect(result.config.verbose).toBe(true);
      expect(result.filepath).toBe(rcPath);
      expect(result.source).toBe('file');
    });
  });
});
