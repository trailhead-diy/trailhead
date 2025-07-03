import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  loadConfig,
  loadConfigSync,
  clearConfigCache,
} from '../../../../src/cli/core/config/loader.js';
import { defaultConfig } from '../../../../src/cli/core/config/schema.js';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

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

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.config).toEqual(defaultConfig);
        expect(result.value.filepath).toBe(null);
      }
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

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.config.transforms?.enabled).toBe(false);
        expect(result.value.config.transforms?.srcDir).toBe('./custom/src');
        expect(result.value.config.transforms?.enabledTransforms).toEqual(['button', 'badge']);
        expect(result.value.config.verbose).toBe(true);
        expect(result.value.filepath).toBe(configPath);
      }
    });

    it('should validate config schema', async () => {
      const configPath = join(testDir, '.trailheadrc.json');
      const invalidConfig = {
        transforms: {
          enabled: 'not-a-boolean', // Invalid type
        },
      };

      writeFileSync(configPath, JSON.stringify(invalidConfig, null, 2));

      const result = await loadConfig(testDir);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('CONFIG_ERROR');
      }
    });

    it('should cache loaded config', async () => {
      const configPath = join(testDir, '.trailheadrc.json');
      const testConfig = { verbose: true };

      writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

      // First load
      const result1 = await loadConfig(testDir);
      expect(result1.success).toBe(true);

      // Modify the file
      writeFileSync(configPath, JSON.stringify({ verbose: false }, null, 2));

      // Second load should return cached value
      const result2 = await loadConfig(testDir);
      expect(result2.success).toBe(true);
      if (result2.success && result1.success) {
        expect(result2.value.config.verbose).toBe(result1.value.config.verbose);
      }
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

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.config.install?.destDir).toBe('./components/ui');
        expect(result.value.config.install?.wrappers).toBe(false);
      }
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

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.config.transforms?.srcDir).toBe('./src/components');
        expect(result.value.filepath).toBe(packagePath);
      }
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

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.config.verbose).toBe(true);
        expect(result.value.filepath).toBe(rcPath);
      }
    });
  });
});
