import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import { createConfigMock } from '../mocks.js';

describe('createConfigMock', () => {
  const schema = z.object({
    verbose: z.boolean(),
    theme: z.string(),
    features: z.array(z.string()).optional(),
  });

  const defaultConfig = {
    verbose: false,
    theme: 'light',
    features: [],
  };

  let configMock: ReturnType<typeof createConfigMock>;

  beforeEach(() => {
    configMock = createConfigMock({
      scenarios: {
        'file-found': {
          config: { verbose: true, theme: 'dark', features: ['auth'] },
          filepath: '/project/.testrc.json',
          source: 'file',
        },
        'package-json': {
          config: { verbose: false, theme: 'blue' },
          filepath: '/project/package.json',
          source: 'package.json',
        },
        'no-config': {
          config: null,
          filepath: null,
          source: 'defaults',
        },
        'validation-error': {
          error: new Error('Invalid configuration schema'),
        },
      },
      defaultConfig,
      defaultScenario: 'no-config',
    });
  });

  describe('createConfig mock', () => {
    it('should create a mock config loader', () => {
      const configLoader = configMock.createConfig({
        name: 'test',
        schema,
        defaults: defaultConfig,
      });

      expect(configLoader).toHaveProperty('load');
      expect(configLoader).toHaveProperty('loadSync');
      expect(configLoader).toHaveProperty('clearCache');
      expect(typeof configLoader.load).toBe('function');
      expect(typeof configLoader.loadSync).toBe('function');
      expect(typeof configLoader.clearCache).toBe('function');
    });

    it('should return defaults when no config scenario', async () => {
      configMock.setScenario('no-config');

      const configLoader = configMock.createConfig({
        name: 'test',
        schema,
        defaults: defaultConfig,
      });

      const result = await configLoader.load();

      expect(result.config).toEqual(defaultConfig);
      expect(result.filepath).toBe(null);
      expect(result.source).toBe('defaults');
    });

    it('should return config from file scenario', async () => {
      configMock.setScenario('file-found');

      const configLoader = configMock.createConfig({
        name: 'test',
        schema,
        defaults: defaultConfig,
      });

      const result = await configLoader.load();

      // Should merge with defaults
      expect(result.config.verbose).toBe(true); // from scenario
      expect(result.config.theme).toBe('dark'); // from scenario
      expect(result.config.features).toEqual(['auth']); // from scenario
      expect(result.filepath).toBe('/project/.testrc.json');
      expect(result.source).toBe('file');
    });

    it('should handle package.json scenario', async () => {
      configMock.setScenario('package-json');

      const configLoader = configMock.createConfig({
        name: 'test',
        schema,
        defaults: defaultConfig,
      });

      const result = await configLoader.load();

      expect(result.config.verbose).toBe(false); // from scenario
      expect(result.config.theme).toBe('blue'); // from scenario
      expect(result.config.features).toEqual([]); // from defaults (merged)
      expect(result.filepath).toBe('/project/package.json');
      expect(result.source).toBe('package.json');
    });

    it('should handle error scenarios', async () => {
      configMock.setScenario('validation-error');

      const configLoader = configMock.createConfig({
        name: 'test',
        schema,
        defaults: defaultConfig,
      });

      await expect(configLoader.load()).rejects.toThrow('Invalid configuration schema');
    });

    it('should work synchronously', () => {
      configMock.setScenario('file-found');

      const configLoader = configMock.createConfig({
        name: 'test',
        schema,
        defaults: defaultConfig,
      });

      const result = configLoader.loadSync();

      expect(result.config.verbose).toBe(true);
      expect(result.config.theme).toBe('dark');
      expect(result.filepath).toBe('/project/.testrc.json');
      expect(result.source).toBe('file');
    });

    it('should validate config with schema', async () => {
      // Add a scenario with invalid data that should trigger schema validation
      configMock.addScenario('invalid-data', {
        config: { verbose: 'not-a-boolean', theme: 'dark' },
        filepath: '/project/.testrc.json',
        source: 'file',
      });

      configMock.setScenario('invalid-data');

      const configLoader = configMock.createConfig({
        name: 'test',
        schema,
        defaults: defaultConfig,
      });

      await expect(configLoader.load()).rejects.toThrow();
    });

    it('should support dynamic scenario addition', async () => {
      configMock.addScenario('dynamic', {
        config: { verbose: true, theme: 'purple' },
        filepath: '/project/.dynamic.json',
        source: 'file',
      });

      configMock.setScenario('dynamic');

      const configLoader = configMock.createConfig({
        name: 'test',
        schema,
        defaults: defaultConfig,
      });

      const result = await configLoader.load();

      expect(result.config.theme).toBe('purple');
      expect(result.filepath).toBe('/project/.dynamic.json');
    });
  });

  describe('utility methods', () => {
    it('should track call history', () => {
      const _configLoader = configMock.createConfig({
        name: 'test',
        schema,
        defaults: defaultConfig,
      });

      expect(configMock.getCallHistory()).toHaveLength(1);
      expect(configMock.getCallHistory()[0]).toEqual([
        {
          name: 'test',
          schema,
          defaults: defaultConfig,
        },
      ]);
    });

    it('should track current scenario', () => {
      expect(configMock.getCurrentScenario()).toBe('no-config');

      configMock.setScenario('file-found');
      expect(configMock.getCurrentScenario()).toBe('file-found');
    });

    it('should reset state', () => {
      configMock.setScenario('file-found');
      configMock.createConfig({
        name: 'test',
        schema,
        defaults: defaultConfig,
      });

      configMock.reset();

      expect(configMock.getCurrentScenario()).toBe('no-config');
      expect(configMock.getCallHistory()).toHaveLength(0);
    });
  });

  describe('config merging', () => {
    it('should merge nested objects correctly', async () => {
      const nestedSchema = z.object({
        database: z.object({
          host: z.string(),
          port: z.number(),
          ssl: z.boolean(),
        }),
        api: z.object({
          version: z.string(),
          timeout: z.number(),
        }),
      });

      const nestedDefaults = {
        database: {
          host: 'localhost',
          port: 5432,
          ssl: false,
        },
        api: {
          version: 'v1',
          timeout: 5000,
        },
      };

      const nestedConfigMock = createConfigMock({
        scenarios: {
          'partial-config': {
            config: {
              database: {
                host: 'remote.db.com',
                ssl: true,
                // port should come from defaults
              },
              // api should come entirely from defaults
            },
            filepath: '/project/.testrc.json',
            source: 'file',
          },
        },
        defaultScenario: 'partial-config',
      });

      const configLoader = nestedConfigMock.createConfig({
        name: 'test',
        schema: nestedSchema,
        defaults: nestedDefaults,
      });

      const result = await configLoader.load();

      expect(result.config.database.host).toBe('remote.db.com'); // from config
      expect(result.config.database.ssl).toBe(true); // from config
      expect(result.config.database.port).toBe(5432); // from defaults
      expect(result.config.api).toEqual(nestedDefaults.api); // entirely from defaults
    });
  });
});
