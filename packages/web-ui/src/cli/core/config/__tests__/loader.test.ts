import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// Import config functions directly - no mocking needed for integration tests
import { loadConfig, loadConfigSync, clearConfigCache } from '@/cli/config.js';

// Create a unique temp directory for each test run
const createTempDir = () => {
  const baseTempDir = tmpdir();
  const testDir = join(
    baseTempDir,
    `trailhead-config-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
  mkdirSync(testDir, { recursive: true });
  return testDir;
};

// Default configuration for tests
const defaultConfig = {
  install: { wrappers: true },
  transforms: { enabled: true, excludePatterns: [], disabledTransforms: [] },
  devRefresh: { prefix: 'catalyst-' },
  verbose: false,
  dryRun: false,
};

describe('Configuration Loader (CLI Framework Integration Tests)', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = createTempDir();
    clearConfigCache();
  });

  afterEach(() => {
    // Clean up temp directory after each test
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('loadConfig', () => {
    it('should return default config when no config file exists', async () => {
      // Test with empty directory - no config files present
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

      // Write actual config file
      writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

      const result = await loadConfig(testDir);

      // CLI framework merges with defaults, so verify expected merged result
      expect(result.filepath).toBe(configPath);
      expect(result.source).toBe('file');

      // Verify the loaded config has merged properly with defaults
      expect(result.config.transforms?.enabled).toBe(false); // from file
      expect(result.config.transforms?.srcDir).toBe('./custom/src'); // from file
      expect(result.config.transforms?.enabledTransforms).toEqual(['button', 'badge']); // from file
      expect(result.config.transforms?.excludePatterns).toEqual([]); // from defaults
      expect(result.config.transforms?.disabledTransforms).toEqual([]); // from defaults
      expect(result.config.verbose).toBe(true); // from file
      expect(result.config.dryRun).toBe(false); // from defaults
    });

    it('should validate config schema and throw on invalid data', async () => {
      const configPath = join(testDir, '.trailheadrc.json');
      const invalidConfig = {
        transforms: {
          enabled: 'not-a-boolean', // Invalid type - should be boolean
        },
      };

      // Write invalid config file
      writeFileSync(configPath, JSON.stringify(invalidConfig, null, 2));

      // CLI framework should validate and throw errors for invalid schemas
      await expect(loadConfig(testDir)).rejects.toThrow();
    });

    it('should handle malformed JSON files gracefully', async () => {
      const configPath = join(testDir, '.trailheadrc.json');

      // Write malformed JSON file
      writeFileSync(configPath, '{ "transforms": { "enabled": true, } }'); // trailing comma makes it invalid JSON

      await expect(loadConfig(testDir)).rejects.toThrow('Failed to load configuration');
    });

    it('should cache loaded config when file unchanged', async () => {
      const configPath = join(testDir, '.trailheadrc.json');
      const testConfig = { verbose: true };

      // Write config file
      writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

      // First load
      const result1 = await loadConfig(testDir);
      expect(result1.config.verbose).toBe(true);
      expect(result1.filepath).toBe(configPath);

      // Second load - should get same results (cosmiconfig handles caching internally)
      const result2 = await loadConfig(testDir);
      expect(result2.config.verbose).toBe(true);
      expect(result2.filepath).toBe(configPath);

      // Both results should be consistent
      expect(result2.config.verbose).toBe(result1.config.verbose);
      expect(result2.filepath).toBe(result1.filepath);
    });
  });

  describe('loadConfigSync', () => {
    it('should work synchronously', () => {
      const configPath = join(testDir, '.trailheadrc.json');
      const testConfig = {
        install: {
          destDir: './components/ui',
          wrappers: false,
        },
      };

      // Write config file
      writeFileSync(configPath, JSON.stringify(testConfig, null, 2));

      const result = loadConfigSync(testDir);

      expect(result.config.install?.destDir).toBe('./components/ui');
      expect(result.config.install?.wrappers).toBe(false);
      expect(result.filepath).toBe(configPath);
      expect(result.source).toBe('file');
    });

    it('should return defaults when no config found', () => {
      // Test with empty directory
      const result = loadConfigSync(testDir);

      expect(result.config).toEqual(defaultConfig);
      expect(result.filepath).toBe(null);
      expect(result.source).toBe('defaults');
    });
  });

  describe('Config file discovery', () => {
    it('should find config in package.json', async () => {
      const packagePath = join(testDir, 'package.json');
      const packageJson = {
        name: 'test-package',
        version: '1.0.0',
        trailhead: {
          transforms: {
            srcDir: './src/components',
          },
        },
      };

      // Write package.json with trailhead config
      writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));

      const result = await loadConfig(testDir);

      expect(result.config.transforms?.srcDir).toBe('./src/components');
      expect(result.filepath).toBe(packagePath);
      expect(result.source).toBe('package.json');
    });

    it('should prefer .trailheadrc over package.json', async () => {
      const rcPath = join(testDir, '.trailheadrc.json');
      const packagePath = join(testDir, 'package.json');

      // Write both files
      const packageJson = {
        name: 'test-package',
        trailhead: { verbose: false },
      };
      const rcConfig = { verbose: true };

      writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
      writeFileSync(rcPath, JSON.stringify(rcConfig, null, 2));

      const result = await loadConfig(testDir);

      // Should prefer .trailheadrc.json over package.json
      expect(result.config.verbose).toBe(true);
      expect(result.filepath).toBe(rcPath);
      expect(result.source).toBe('file');
    });
  });

  describe('Complex configuration merging', () => {
    it('should merge nested objects correctly', async () => {
      const configPath = join(testDir, '.trailheadrc.json');
      const partialConfig = {
        transforms: {
          enabled: false,
          srcDir: './custom',
          // excludePatterns and disabledTransforms should use defaults
        },
        install: {
          destDir: './ui',
          // wrappers should use default
        },
        // devRefresh should use all defaults
        verbose: true,
        // dryRun should use default
      };

      // Write partial config file
      writeFileSync(configPath, JSON.stringify(partialConfig, null, 2));

      const result = await loadConfig(testDir);

      // User overrides
      expect(result.config.transforms?.enabled).toBe(false);
      expect(result.config.transforms?.srcDir).toBe('./custom');
      expect(result.config.install?.destDir).toBe('./ui');
      expect(result.config.verbose).toBe(true);

      // Defaults preserved for unspecified values
      expect(result.config.transforms?.excludePatterns).toEqual([]);
      expect(result.config.transforms?.disabledTransforms).toEqual([]);
      expect(result.config.install?.wrappers).toBe(true);
      expect(result.config.devRefresh?.prefix).toBe('catalyst-');
      expect(result.config.dryRun).toBe(false);
    });

    it('should handle arrays in configuration', async () => {
      const configPath = join(testDir, '.trailheadrc.json');
      const configWithArrays = {
        transforms: {
          excludePatterns: ['*.test.tsx', '*.stories.tsx'],
          enabledTransforms: ['button', 'input', 'select'],
          disabledTransforms: ['legacy-component'],
        },
      };

      // Write config file with arrays
      writeFileSync(configPath, JSON.stringify(configWithArrays, null, 2));

      const result = await loadConfig(testDir);

      expect(result.config.transforms?.excludePatterns).toEqual(['*.test.tsx', '*.stories.tsx']);
      expect(result.config.transforms?.enabledTransforms).toEqual(['button', 'input', 'select']);
      expect(result.config.transforms?.disabledTransforms).toEqual(['legacy-component']);
    });
  });

  describe('Error scenarios', () => {
    it('should handle malformed JSON gracefully', async () => {
      const configPath = join(testDir, '.trailheadrc.json');

      // Write malformed JSON
      writeFileSync(configPath, '{ "transforms": { "enabled": true, } }'); // trailing comma

      await expect(loadConfig(testDir)).rejects.toThrow('Failed to load configuration');
    });

    it('should validate type mismatches', async () => {
      const configPath = join(testDir, '.trailheadrc.json');
      const configWithWrongTypes = {
        transforms: {
          enabled: true,
          excludePatterns: 'not-an-array', // Should be array
        },
      };

      // Write invalid config file
      writeFileSync(configPath, JSON.stringify(configWithWrongTypes, null, 2));

      await expect(loadConfig(testDir)).rejects.toThrow();
    });

    it('should validate boolean fields', async () => {
      const configPath = join(testDir, '.trailheadrc.json');
      const configWithInvalidBoolean = {
        verbose: 'yes', // Should be boolean
        dryRun: 1, // Should be boolean
      };

      // Write invalid config file
      writeFileSync(configPath, JSON.stringify(configWithInvalidBoolean, null, 2));

      await expect(loadConfig(testDir)).rejects.toThrow();
    });
  });
});
