import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { z } from 'zod';

// Mock cosmiconfig
const mockSearch = vi.fn();
const mockSearchSync = vi.fn();
const mockClearCaches = vi.fn();
const mockCosmiconfig = vi.fn(() => ({
  search: mockSearch,
  clearCaches: mockClearCaches,
}));
const mockCosmiconfigSync = vi.fn(() => ({
  search: mockSearchSync,
  clearCaches: mockClearCaches,
}));

vi.mock('cosmiconfig', () => ({
  cosmiconfig: mockCosmiconfig,
  cosmiconfigSync: mockCosmiconfigSync,
}));

// Import after mocking
const { createConfig } = await import('../config.js');

describe('Config Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearch.mockClear();
    mockSearchSync.mockClear();
    mockCosmiconfig.mockClear();
    mockCosmiconfigSync.mockClear();
    mockClearCaches.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createConfig', () => {
    it('should create config loader with load methods', () => {
      const schema = z.object({
        name: z.string(),
        port: z.number(),
      });

      const defaults = {
        name: 'test',
        port: 3000,
      };

      const configLoader = createConfig({
        name: 'test-config',
        schema,
        defaults,
      });

      expect(configLoader).toHaveProperty('load');
      expect(configLoader).toHaveProperty('loadSync');
      expect(configLoader).toHaveProperty('clearCache');
      expect(typeof configLoader.load).toBe('function');
      expect(typeof configLoader.loadSync).toBe('function');
      expect(typeof configLoader.clearCache).toBe('function');
    });

    it('should load config with defaults when no config file found', async () => {
      const schema = z.object({
        name: z.string(),
        port: z.number(),
        debug: z.boolean(),
      });

      const defaults = {
        name: 'default-name',
        port: 8080,
        debug: false,
      };

      // Mock no config found
      mockSearch.mockResolvedValue(null);

      const configLoader = createConfig({
        name: 'test-config',
        schema,
        defaults,
      });

      const result = await configLoader.load();

      expect(result.config).toEqual({
        name: 'default-name',
        port: 8080,
        debug: false,
      });
      expect(result.filepath).toBe(null);
      expect(result.source).toBe('defaults');
    });

    it('should load and validate config from file', async () => {
      const schema = z.object({
        name: z.string(),
        port: z.number(),
        features: z.array(z.string()).optional(),
      });

      const configData = {
        name: 'my-app',
        port: 3000,
        features: ['auth', 'api'],
      };

      // Mock config found
      mockSearch.mockResolvedValue({
        config: configData,
        filepath: '/project/.configrc.json',
      });

      const configLoader = createConfig({
        name: 'test-config',
        schema,
      });

      const result = await configLoader.load();

      expect(result.config).toEqual(configData);
      expect(result.filepath).toBe('/project/.configrc.json');
      expect(result.source).toBe('file');
    });

    it('should throw validation error for invalid config', async () => {
      const schema = z.object({
        name: z.string(),
        port: z.number(),
      });

      // Mock invalid config
      mockSearch.mockResolvedValue({
        config: {
          name: 'test',
          port: 'invalid-port', // Should be number
        },
        filepath: '/project/.configrc.json',
      });

      const configLoader = createConfig({
        name: 'test-config',
        schema,
      });

      await expect(configLoader.load()).rejects.toThrow();
    });

    it('should handle cosmiconfig errors', async () => {
      const schema = z.object({
        name: z.string(),
      });

      const defaults = {
        name: 'test',
      };

      // Mock cosmiconfig error
      mockSearch.mockRejectedValue(new Error('File system error'));

      const configLoader = createConfig({
        name: 'test-config',
        schema,
        defaults,
      });

      await expect(configLoader.load()).rejects.toThrow('Failed to load configuration');
    });

    it('should pass options to cosmiconfig', async () => {
      const schema = z.object({
        name: z.string(),
      });

      const defaults = {
        name: 'test',
      };

      mockSearch.mockResolvedValue(null);

      const configLoader = createConfig({
        name: 'my-cli',
        schema,
        defaults,
      });

      await configLoader.load('/custom/path');

      expect(mockCosmiconfig).toHaveBeenCalledWith('my-cli', {
        searchPlaces: [
          'my-cli.config.js',
          'my-cli.config.cjs',
          '.my-clirc.js',
          '.my-clirc.cjs',
          '.my-clirc.json',
          '.my-clirc.yaml',
          '.my-clirc.yml',
          '.my-clirc',
          'package.json',
        ],
        ignoreEmptySearchPlaces: false,
      });

      expect(mockSearch).toHaveBeenCalledWith('/custom/path');
    });

    it('should use custom search places when provided', async () => {
      const schema = z.object({
        name: z.string(),
      });

      const defaults = {
        name: 'test',
      };

      const customSearchPlaces = ['custom.config.js', '.customrc.json'];

      mockSearch.mockResolvedValue(null);

      const configLoader = createConfig({
        name: 'custom',
        schema,
        defaults,
        searchPlaces: customSearchPlaces,
      });

      await configLoader.load();

      expect(mockCosmiconfig).toHaveBeenCalledWith('custom', {
        searchPlaces: customSearchPlaces,
        ignoreEmptySearchPlaces: false,
      });
    });
  });

  describe('Schema Validation', () => {
    it('should handle complex nested schemas', async () => {
      const schema = z.object({
        database: z.object({
          host: z.string(),
          port: z.number(),
          ssl: z.boolean(),
        }),
        api: z.object({
          version: z.enum(['v1', 'v2']),
          endpoints: z.array(z.string()),
        }),
        features: z.record(z.boolean()),
      });

      const defaults = {
        database: {
          host: 'localhost',
          port: 5432,
          ssl: false,
        },
        api: {
          version: 'v2' as const,
          endpoints: [] as string[],
        },
        features: {} as Record<string, boolean>,
      };

      const configData = {
        database: {
          host: 'db.example.com',
          port: 3306,
          ssl: true,
        },
        api: {
          version: 'v1' as const,
          endpoints: ['/users', '/posts'],
        },
        features: {
          auth: true,
          cache: false,
        },
      };

      mockSearch.mockResolvedValue({
        config: configData,
        filepath: '/project/config.json',
      });

      const configLoader = createConfig({
        name: 'test-config',
        schema,
        defaults,
      });

      const result = await configLoader.load();
      expect(result.config).toEqual(configData);
      expect(result.filepath).toBe('/project/config.json');
      expect(result.source).toBe('file');
    });

    it('should merge with defaults for partial config', async () => {
      const schema = z.object({
        server: z.object({
          host: z.string(),
          port: z.number(),
          timeout: z.number(),
        }),
        logging: z.object({
          level: z.enum(['debug', 'info', 'warn', 'error']),
          file: z.string().optional(),
        }),
      });

      const defaults = {
        server: {
          host: '0.0.0.0',
          port: 3000,
          timeout: 5000,
        },
        logging: {
          level: 'info' as const,
        },
      };

      // Partial config - only some values provided
      const partialConfig = {
        server: {
          host: '0.0.0.0',
          port: 8080,
          timeout: 5000,
        },
        logging: {
          level: 'debug' as const,
        },
      };

      mockSearch.mockResolvedValue({
        config: partialConfig,
        filepath: '/project/.configrc',
      });

      const configLoader = createConfig({
        name: 'test-config',
        schema,
        defaults,
      });

      const result = await configLoader.load();
      expect(result.config).toEqual({
        server: {
          host: '0.0.0.0',
          port: 8080, // from config
          timeout: 5000,
        },
        logging: {
          level: 'debug', // from config
        },
      });
    });

    it('should validate enum values', async () => {
      const schema = z.object({
        environment: z.enum(['development', 'staging', 'production']),
        logLevel: z.enum(['debug', 'info', 'warn', 'error']),
      });

      const defaults = {
        environment: 'development' as const,
        logLevel: 'info' as const,
      };

      mockSearch.mockResolvedValue({
        config: {
          environment: 'invalid-env',
          logLevel: 'verbose', // invalid
        },
        filepath: '/project/config.js',
      });

      const configLoader = createConfig({
        name: 'test-config',
        schema,
        defaults,
      });

      await expect(configLoader.load()).rejects.toThrow();
    });

    it('should handle array validations', async () => {
      const schema = z.object({
        allowedHosts: z.array(z.string().url()),
        ports: z.array(z.number().min(1).max(65535)),
        features: z.array(z.enum(['auth', 'cache', 'logging'])),
      });

      const defaults = {
        allowedHosts: ['https://example.com'],
        ports: [80, 443],
        features: ['auth'] as Array<'auth' | 'cache' | 'logging'>,
      };

      mockSearch.mockResolvedValue({
        config: {
          allowedHosts: ['not-a-url', 'https://example.com'],
          ports: [80, 99999], // 99999 is too high
          features: ['auth', 'unknown-feature'],
        },
        filepath: '/project/config.json',
      });

      const configLoader = createConfig({
        name: 'test-config',
        schema,
        defaults,
      });

      await expect(configLoader.load()).rejects.toThrow();
    });
  });

  describe('Search Places', () => {
    it('should include all expected search places', async () => {
      const schema = z.object({ name: z.string() });
      const defaults = { name: 'test' };

      mockSearch.mockResolvedValue(null);

      const configLoader = createConfig({
        name: 'myapp',
        schema,
        defaults,
      });

      await configLoader.load();

      expect(mockCosmiconfig).toHaveBeenCalledWith('myapp', {
        searchPlaces: [
          'myapp.config.js',
          'myapp.config.cjs',
          '.myapprc.js',
          '.myapprc.cjs',
          '.myapprc.json',
          '.myapprc.yaml',
          '.myapprc.yml',
          '.myapprc',
          'package.json',
        ],
        ignoreEmptySearchPlaces: false,
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle schema with no defaults gracefully', async () => {
      const schema = z.object({
        requiredField: z.string(),
        optionalField: z.string().optional(),
      });

      mockSearch.mockResolvedValue(null);

      const configLoader = createConfig({
        name: 'test-config',
        schema,
        // No defaults provided
      });

      await expect(configLoader.load()).rejects.toThrow(
        'No configuration found and no defaults provided'
      );
    });

    it('should handle malformed JSON config', async () => {
      const schema = z.object({
        name: z.string(),
      });

      const defaults = {
        name: 'test',
      };

      // Mock cosmiconfig throwing JSON parse error
      mockSearch.mockRejectedValue(new SyntaxError('Unexpected token in JSON'));

      const configLoader = createConfig({
        name: 'test-config',
        schema,
        defaults,
      });

      await expect(configLoader.load()).rejects.toThrow('Failed to load configuration');
    });

    it('should provide detailed validation errors', async () => {
      const schema = z.object({
        name: z.string().min(3),
        port: z.number().min(1000).max(9999),
        features: z.array(z.string()),
      });

      const defaults = {
        name: 'default',
        port: 3000,
        features: [] as string[],
      };

      mockSearch.mockResolvedValue({
        config: {
          name: 'ab', // too short
          port: 99, // too low
          features: 'not-an-array',
        },
        filepath: '/project/config.json',
      });

      const configLoader = createConfig({
        name: 'test-config',
        schema,
        defaults,
      });

      await expect(configLoader.load()).rejects.toThrow();
    });
  });

  describe('Integration Scenarios', () => {
    it('should work with environment-specific configs', async () => {
      const baseSchema = z.object({
        app: z.object({
          name: z.string(),
          debug: z.boolean(),
        }),
        database: z.object({
          url: z.string(),
        }),
      });

      const defaults = {
        app: {
          name: 'myapp',
          debug: false,
        },
        database: {
          url: 'sqlite:memory:',
        },
      };

      // Development config
      const devConfig = {
        app: {
          name: 'myapp',
          debug: true,
        },
        database: {
          url: 'postgresql://localhost:5432/myapp_dev',
        },
      };

      mockSearch.mockResolvedValue({
        config: devConfig,
        filepath: '/project/.myapprc.json',
      });

      const configLoader = createConfig({
        name: 'myapp',
        schema: baseSchema,
        defaults,
      });

      const result = await configLoader.load();

      expect(result.config.app.name).toBe('myapp'); // from config (merged)
      expect(result.config.app.debug).toBe(true); // from config
      expect(result.config.database.url).toBe('postgresql://localhost:5432/myapp_dev');
      expect(result.filepath).toBe('/project/.myapprc.json');
      expect(result.source).toBe('file');
    });

    it('should handle package.json configuration', async () => {
      const schema = z.object({
        name: z.string(),
        version: z.string(),
        scripts: z.record(z.string()).optional(),
      });

      const packageJsonConfig = {
        name: 'my-package',
        version: '1.2.3',
        scripts: {
          start: 'node index.js',
          test: 'vitest',
        },
      };

      mockSearch.mockResolvedValue({
        config: packageJsonConfig,
        filepath: '/project/package.json',
      });

      const configLoader = createConfig({
        name: 'test-config',
        schema,
      });

      const result = await configLoader.load();
      expect(result.config).toEqual(packageJsonConfig);
      expect(result.filepath).toBe('/project/package.json');
      expect(result.source).toBe('package.json');
    });
  });

  describe('loadSync', () => {
    it('should load config with defaults synchronously', () => {
      const schema = z.object({
        name: z.string(),
        version: z.string(),
      });

      const defaults = {
        name: 'test-app',
        version: '1.0.0',
      };

      mockSearchSync.mockReturnValue(null);

      const configLoader = createConfig({
        name: 'test-config',
        schema,
        defaults,
      });

      const result = configLoader.loadSync();
      expect(result.config).toEqual({
        name: 'test-app',
        version: '1.0.0',
      });
      expect(result.filepath).toBe(null);
      expect(result.source).toBe('defaults');
    });

    it('should load and validate config from file synchronously', () => {
      const schema = z.object({
        name: z.string(),
        port: z.number(),
        features: z.array(z.string()).optional(),
      });

      const configData = {
        name: 'my-sync-app',
        port: 4000,
        features: ['auth', 'api'],
      };

      // Mock config found
      mockSearchSync.mockReturnValue({
        config: configData,
        filepath: '/project/.configrc.json',
      });

      const configLoader = createConfig({
        name: 'test-config',
        schema,
      });

      const result = configLoader.loadSync();

      expect(result.config).toEqual(configData);
      expect(result.filepath).toBe('/project/.configrc.json');
      expect(result.source).toBe('file');
    });

    it('should throw validation error for invalid config synchronously', () => {
      const schema = z.object({
        name: z.string(),
        port: z.number(),
      });

      // Mock invalid config
      mockSearchSync.mockReturnValue({
        config: {
          name: 'test',
          port: 'invalid-port', // Should be number
        },
        filepath: '/project/.configrc.json',
      });

      const configLoader = createConfig({
        name: 'test-config',
        schema,
      });

      expect(() => configLoader.loadSync()).toThrow();
    });

    it('should handle cosmiconfigSync errors', () => {
      const schema = z.object({
        name: z.string(),
      });

      const defaults = {
        name: 'test',
      };

      // Mock cosmiconfigSync error
      mockSearchSync.mockImplementation(() => {
        throw new Error('File system error');
      });

      const configLoader = createConfig({
        name: 'test-config',
        schema,
        defaults,
      });

      expect(() => configLoader.loadSync()).toThrow('Failed to load configuration');
    });
  });

  describe('clearCache', () => {
    it('should call clearCaches on cosmiconfig', () => {
      const schema = z.object({
        name: z.string(),
      });

      const defaults = {
        name: 'test',
      };

      const configLoader = createConfig({
        name: 'test-config',
        schema,
        defaults,
      });

      configLoader.clearCache();

      expect(mockClearCaches).toHaveBeenCalled();
    });
  });
});
