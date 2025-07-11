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
        devRefresh: {
          prefix: 'custom-',
          srcDir: './custom/src',
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
      expect(result.config.devRefresh?.prefix).toBe('custom-'); // from file
      expect(result.config.devRefresh?.srcDir).toBe('./custom/src'); // from file
      expect(result.config.verbose).toBe(true); // from file
      expect(result.config.dryRun).toBe(false); // from defaults
    });

    it('should validate config schema and throw on invalid data', async () => {
      const configPath = join(testDir, '.trailheadrc.json');
      const invalidConfig = {
        devRefresh: {
          prefix: 123, // Invalid type - should be string
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
      writeFileSync(configPath, '{ "devRefresh": { "prefix": "catalyst-", } }'); // trailing comma makes it invalid JSON

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
          devRefresh: {
            prefix: 'custom-',
          },
        },
      };

      // Write package.json with trailhead config
      writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));

      const result = await loadConfig(testDir);

      expect(result.config.devRefresh?.prefix).toBe('custom-');
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
        install: {
          destDir: './ui',
          // wrappers should use default
        },
        devRefresh: {
          prefix: 'custom-',
          // srcDir and destDir should use defaults
        },
        verbose: true,
        // dryRun should use default
      };

      // Write partial config file
      writeFileSync(configPath, JSON.stringify(partialConfig, null, 2));

      const result = await loadConfig(testDir);

      // User overrides
      expect(result.config.install?.destDir).toBe('./ui');
      expect(result.config.devRefresh?.prefix).toBe('custom-');
      expect(result.config.verbose).toBe(true);

      // Defaults preserved for unspecified values
      expect(result.config.install?.wrappers).toBe(true);
      expect(result.config.dryRun).toBe(false);
    });

    it('should handle string configuration values', async () => {
      const configPath = join(testDir, '.trailheadrc.json');
      const configWithStrings = {
        devRefresh: {
          prefix: 'my-component-',
          srcDir: './catalyst-source',
          destDir: './my-components',
        },
      };

      // Write config file with string values
      writeFileSync(configPath, JSON.stringify(configWithStrings, null, 2));

      const result = await loadConfig(testDir);

      expect(result.config.devRefresh?.prefix).toBe('my-component-');
      expect(result.config.devRefresh?.srcDir).toBe('./catalyst-source');
      expect(result.config.devRefresh?.destDir).toBe('./my-components');
    });
  });

  describe('Error scenarios', () => {
    it('should handle malformed JSON gracefully', async () => {
      const configPath = join(testDir, '.trailheadrc.json');

      // Write malformed JSON
      writeFileSync(configPath, '{ "devRefresh": { "prefix": "catalyst-", } }'); // trailing comma

      await expect(loadConfig(testDir)).rejects.toThrow('Failed to load configuration');
    });

    it('should validate type mismatches', async () => {
      const configPath = join(testDir, '.trailheadrc.json');
      const configWithWrongTypes = {
        install: {
          wrappers: 'not-a-boolean', // Should be boolean
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
