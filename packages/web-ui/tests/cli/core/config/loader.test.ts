import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clearConfigCache } from '../../../../src/cli/config.js';

// Mock cosmiconfig before importing config functions
const mockSearch = vi.fn();
const mockSearchSync = vi.fn();
const mockClearCaches = vi.fn();

vi.mock('cosmiconfig', () => ({
  cosmiconfig: vi.fn(() => ({
    search: mockSearch,
    clearCaches: mockClearCaches,
  })),
  cosmiconfigSync: vi.fn(() => ({
    search: mockSearchSync,
    clearCaches: mockClearCaches,
  })),
}));

// Import after mocking
import { loadConfig, loadConfigSync } from '../../../../src/cli/config.js';

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
  const testDir = '/test/project';

  beforeEach(() => {
    vi.clearAllMocks();
    clearConfigCache();
  });

  describe('loadConfig', () => {
    it('should return default config when no config file exists', async () => {
      // Mock cosmiconfig to return null (no config found)
      mockSearch.mockResolvedValue(null);

      const result = await loadConfig(testDir);

      expect(result.config).toEqual(defaultConfig);
      expect(result.filepath).toBe(null);
      expect(result.source).toBe('defaults');
    });

    it('should load config from .trailheadrc.json', async () => {
      const configPath = `${testDir}/.trailheadrc.json`;
      const testConfig = {
        transforms: {
          enabled: false,
          srcDir: './custom/src',
          enabledTransforms: ['button', 'badge'],
        },
        verbose: true,
      };

      // Mock cosmiconfig to return config file result
      mockSearch.mockResolvedValue({
        config: testConfig,
        filepath: configPath,
      });

      const result = await loadConfig(testDir);

      expect(result.config.transforms?.enabled).toBe(false);
      expect(result.config.transforms?.srcDir).toBe('./custom/src');
      expect(result.config.transforms?.enabledTransforms).toEqual(['button', 'badge']);
      expect(result.config.verbose).toBe(true);
      expect(result.filepath).toBe(configPath);
      expect(result.source).toBe('file');
    });

    it('should validate config schema', async () => {
      const configPath = `${testDir}/.trailheadrc.json`;
      const invalidConfig = {
        transforms: {
          enabled: 'not-a-boolean', // Invalid type
        },
      };

      // Mock cosmiconfig to return invalid config
      mockSearch.mockResolvedValue({
        config: invalidConfig,
        filepath: configPath,
      });

      // Should throw an error due to invalid schema
      await expect(loadConfig(testDir)).rejects.toThrow();
    });

    it('should cache loaded config when file unchanged', async () => {
      const configPath = `${testDir}/.trailheadrc.json`;
      const testConfig = { verbose: true };

      // Mock cosmiconfig to return config
      mockSearch.mockResolvedValue({
        config: testConfig,
        filepath: configPath,
      });

      // First load
      const result1 = await loadConfig(testDir);
      expect(result1.config.verbose).toBe(true);

      // Second load should use cache (cosmiconfig internal caching)
      const result2 = await loadConfig(testDir);
      expect(result2.config.verbose).toBe(result1.config.verbose);
      expect(result2.config.verbose).toBe(true);
    });
  });

  describe('loadConfigSync', () => {
    it('should work synchronously', () => {
      // Clear cache before sync test
      clearConfigCache();

      const configPath = `${testDir}/.trailheadrc.json`;
      const testConfig = {
        install: {
          destDir: './components/ui',
          wrappers: false,
        },
      };

      // Mock cosmiconfig sync method
      mockSearchSync.mockReturnValue({
        config: testConfig,
        filepath: configPath,
      });

      const result = loadConfigSync(testDir);

      expect(result.config.install?.destDir).toBe('./components/ui');
      expect(result.config.install?.wrappers).toBe(false);
      expect(result.filepath).toBe(configPath);
      expect(result.source).toBe('file');
    });
  });

  describe('Config file discovery', () => {
    it('should find config in package.json', async () => {
      const packagePath = `${testDir}/package.json`;
      const trailheadConfig = {
        transforms: {
          srcDir: './src/components',
        },
      };

      // Mock cosmiconfig to return package.json config
      mockSearch.mockResolvedValue({
        config: trailheadConfig,
        filepath: packagePath,
      });

      const result = await loadConfig(testDir);

      expect(result.config.transforms?.srcDir).toBe('./src/components');
      expect(result.filepath).toBe(packagePath);
      expect(result.source).toBe('package.json');
    });

    it('should prefer .trailheadrc over package.json', async () => {
      const rcPath = `${testDir}/.trailheadrc.json`;

      // Mock cosmiconfig to return .trailheadrc.json (which has higher precedence)
      mockSearch.mockResolvedValue({
        config: { verbose: true },
        filepath: rcPath,
      });

      const result = await loadConfig(testDir);

      expect(result.config.verbose).toBe(true);
      expect(result.filepath).toBe(rcPath);
      expect(result.source).toBe('file');
    });
  });
});
