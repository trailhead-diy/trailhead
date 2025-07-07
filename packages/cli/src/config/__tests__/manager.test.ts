import { describe, it, expect, beforeEach, vi } from 'vitest';
import { z } from 'zod';
import { isOk, isErr, unwrap } from '../../core/errors/index.js';

// Mock cosmiconfig first (must be hoisted)
const mockSearch = vi.fn();
const mockSearchSync = vi.fn();

vi.mock('cosmiconfig', () => ({
  cosmiconfig: vi.fn(() => ({
    search: mockSearch,
  })),
  cosmiconfigSync: vi.fn(() => ({
    search: mockSearchSync,
  })),
}));

// Import after mocking
const {
  createConfigurationManager,
  registerGlobalConfig,
  loadGlobalConfig,
  loadGlobalConfigSync,
} = await import('../manager.js');
const { defineConfig } = await import('../config.js');

describe('Configuration Manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearch.mockClear();
    mockSearchSync.mockClear();
  });

  describe('createConfigurationManager', () => {
    it('should create manager with sync methods', () => {
      const manager = createConfigurationManager();

      expect(manager).toHaveProperty('loadSync');
      expect(manager).toHaveProperty('loadAllSync');
      expect(typeof manager.loadSync).toBe('function');
      expect(typeof manager.loadAllSync).toBe('function');
    });

    it('should load configuration synchronously', () => {
      const manager = createConfigurationManager();

      const schema = defineConfig(
        z.object({
          name: z.string().default('test'),
          port: z.number().default(3000),
        }),
      );

      mockSearchSync.mockReturnValue(null);

      manager.register('app', schema);
      const result = manager.loadSync('app');

      expect(isOk(result)).toBe(true);
      expect(unwrap(result)).toEqual({
        name: 'test',
        port: 3000,
      });
    });

    it('should return error for unknown schema in loadSync', () => {
      const manager = createConfigurationManager();

      const result = manager.loadSync('unknown');

      expect(isErr(result)).toBe(true);
      expect(result.error.code).toBe('CONFIG_NOT_FOUND');
      expect(result.error.message).toContain(
        "Configuration schema 'unknown' not found",
      );
    });

    it('should handle cache in loadSync', () => {
      const manager = createConfigurationManager();

      const schema = defineConfig(
        z.object({
          name: z.string().default('cached'),
        }),
        { cache: true },
      );

      const configData = { name: 'from-file' };
      mockSearchSync.mockReturnValue({
        config: configData,
        filepath: '/project/config.json',
      });

      manager.register('cached-config', schema);

      // First load - should read from file
      const result1 = manager.loadSync('cached-config');
      expect(isOk(result1)).toBe(true);
      expect(unwrap(result1)).toEqual(configData);
      expect(mockSearchSync).toHaveBeenCalledTimes(1);

      // Second load - should use cache
      const result2 = manager.loadSync('cached-config');
      expect(isOk(result2)).toBe(true);
      expect(unwrap(result2)).toEqual(configData);
      expect(mockSearchSync).toHaveBeenCalledTimes(1); // Still only called once
    });

    it('should load all configurations synchronously', () => {
      const manager = createConfigurationManager();

      const appSchema = defineConfig(
        z.object({
          name: z.string().default('app'),
        }),
      );

      const dbSchema = defineConfig(
        z.object({
          host: z.string().default('localhost'),
        }),
      );

      mockSearchSync.mockReturnValue(null);

      manager.register('app', appSchema);
      manager.register('database', dbSchema);

      const result = manager.loadAllSync();

      expect(isOk(result)).toBe(true);
      const configs = unwrap(result);
      expect(configs).toEqual({
        app: { name: 'app' },
        database: { host: 'localhost' },
      });
    });

    it('should handle errors in loadAllSync', () => {
      const manager = createConfigurationManager();

      const validSchema = defineConfig(
        z.object({
          name: z.string().default('valid'),
        }),
      );

      const invalidSchema = defineConfig(
        z.object({
          required: z.string(), // No default - will fail
        }),
      );

      mockSearchSync.mockReturnValue(null);

      manager.register('valid', validSchema);
      manager.register('invalid', invalidSchema);

      const result = manager.loadAllSync();

      expect(isErr(result)).toBe(true);
      expect(result.error.code).toBe('CONFIG_LOAD_MULTIPLE_ERRORS');
      expect(result.error.message).toContain(
        'Failed to load some configurations',
      );
    });

    it('should handle schema loadSync errors gracefully', () => {
      const manager = createConfigurationManager();

      const schema = defineConfig(
        z.object({
          name: z.string(),
        }),
      );

      // Mock error in cosmiconfigSync
      mockSearchSync.mockImplementation(() => {
        throw new Error('File system error');
      });

      manager.register('error-config', schema);
      const result = manager.loadSync('error-config');

      expect(isErr(result)).toBe(true);
      expect(result.error.code).toBe('CONFIG_LOAD_ERROR');
      expect(result.error.message).toContain('Failed to load configuration');
    });
  });

  describe('Global Configuration Manager', () => {
    it('should provide loadGlobalConfigSync function', () => {
      expect(typeof loadGlobalConfigSync).toBe('function');
    });

    it('should load global configuration synchronously', () => {
      const schema = defineConfig(
        z.object({
          globalName: z.string().default('global-test'),
        }),
      );

      mockSearchSync.mockReturnValue(null);

      registerGlobalConfig('global-sync', schema);
      const result = loadGlobalConfigSync('global-sync');

      expect(isOk(result)).toBe(true);
      expect(unwrap(result)).toEqual({
        globalName: 'global-test',
      });
    });

    it('should use same global manager instance for sync and async', async () => {
      const schema = defineConfig(
        z.object({
          shared: z.string().default('shared-value'),
        }),
      );

      mockSearch.mockResolvedValue(null);
      mockSearchSync.mockReturnValue(null);

      registerGlobalConfig('shared-config', schema);

      // Load async
      const asyncResult = await loadGlobalConfig('shared-config');
      expect(isOk(asyncResult)).toBe(true);

      // Load sync
      const syncResult = loadGlobalConfigSync('shared-config');
      expect(isOk(syncResult)).toBe(true);

      // Both should have same value
      expect(unwrap(asyncResult)).toEqual(unwrap(syncResult));
    });

    it('should handle errors in loadGlobalConfigSync', () => {
      const result = loadGlobalConfigSync('non-existent');

      expect(isErr(result)).toBe(true);
      expect(result.error.code).toBe('CONFIG_NOT_FOUND');
    });

    it('should forward options to global manager loadSync', () => {
      const schema = defineConfig(
        z.object({
          name: z.string().default('test'),
        }),
      );

      mockSearchSync.mockReturnValue(null);

      registerGlobalConfig('options-test', schema);

      const result = loadGlobalConfigSync('options-test', {
        searchFrom: '/custom/path',
      });

      expect(isOk(result)).toBe(true);
      expect(mockSearchSync).toHaveBeenCalledWith('/custom/path');
    });
  });

  describe('Sync/Async Parity', () => {
    it('should produce identical results for sync and async methods', async () => {
      const schema = defineConfig(
        z.object({
          name: z.string().default('parity-test'),
          port: z.number().default(8080),
          features: z.array(z.string()).default(['auth']),
        }),
      );

      const configData = {
        name: 'test-app',
        port: 3000,
        features: ['auth', 'api', 'cache'],
      };

      // Setup both mocks with same data
      mockSearch.mockResolvedValue({
        config: configData,
        filepath: '/project/config.json',
      });
      mockSearchSync.mockReturnValue({
        config: configData,
        filepath: '/project/config.json',
      });

      // Test with manager
      const manager = createConfigurationManager();
      manager.register('parity', schema);

      const asyncResult = await manager.load('parity');
      const syncResult = manager.loadSync('parity');

      expect(isOk(asyncResult)).toBe(true);
      expect(isOk(syncResult)).toBe(true);
      expect(unwrap(asyncResult)).toEqual(unwrap(syncResult));
      expect(unwrap(syncResult)).toEqual(configData);
    });

    it('should handle validation errors consistently', async () => {
      const schema = defineConfig(
        z.object({
          port: z.number(),
        }),
      );

      const invalidConfig = {
        port: 'not-a-number',
      };

      mockSearch.mockResolvedValue({
        config: invalidConfig,
        filepath: '/project/config.json',
      });
      mockSearchSync.mockReturnValue({
        config: invalidConfig,
        filepath: '/project/config.json',
      });

      const manager = createConfigurationManager();
      manager.register('validation-test', schema);

      const asyncResult = await manager.load('validation-test');
      const syncResult = manager.loadSync('validation-test');

      expect(isErr(asyncResult)).toBe(true);
      expect(isErr(syncResult)).toBe(true);
      expect(asyncResult.error.code).toBe(syncResult.error.code);
      expect(asyncResult.error.code).toBe('CONFIG_VALIDATION_ERROR');
    });
  });
});
