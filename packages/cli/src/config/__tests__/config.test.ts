import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { z } from 'zod';
import {
  isOk,
  isErr,
  unwrap,
  getErrorMessage,
} from '../../core/errors/index.js';

// Mock cosmiconfig
const mockSearch = vi.fn();
const mockCosmiconfig = vi.fn(() => ({
  search: mockSearch,
}));

vi.mock('cosmiconfig', () => ({
  cosmiconfig: mockCosmiconfig,
}));

// Import after mocking
const { defineConfig, loadConfig } = await import('../config.js');

describe('Config Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('defineConfig', () => {
    it('should create config schema with load method', () => {
      const schema = z.object({
        name: z.string().default('test'),
        port: z.number().default(3000),
      });

      const config = defineConfig(schema);

      expect(config).toHaveProperty('schema');
      expect(config).toHaveProperty('load');
      expect(typeof config.load).toBe('function');
      expect(config.schema).toBe(schema);
    });

    it('should load config with defaults when no config file found', async () => {
      const schema = z.object({
        name: z.string().default('default-name'),
        port: z.number().default(8080),
        debug: z.boolean().default(false),
      });

      // Mock no config found
      mockSearch.mockResolvedValue(null);

      const config = defineConfig(schema);
      const result = await config.load();

      expect(isOk(result)).toBe(true);
      const data = unwrap(result);
      expect(data).toEqual({
        name: 'default-name',
        port: 8080,
        debug: false,
      });
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

      const config = defineConfig(schema);
      const result = await config.load();

      expect(isOk(result)).toBe(true);
      expect(unwrap(result)).toEqual(configData);
    });

    it('should return validation error for invalid config', async () => {
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

      const config = defineConfig(schema);
      const result = await config.load();

      expect(isErr(result)).toBe(true);
      const error = result.error as any;
      expect(error.code).toBe('CONFIG_VALIDATION_ERROR');
      expect(getErrorMessage(result)).toContain('Invalid configuration');
    });

    it('should handle cosmiconfig errors', async () => {
      const schema = z.object({
        name: z.string().default('test'),
      });

      // Mock cosmiconfig error
      mockSearch.mockRejectedValue(new Error('File system error'));

      const config = defineConfig(schema);
      const result = await config.load();

      expect(isErr(result)).toBe(true);
      const error = result.error as any;
      expect(error.code).toBe('CONFIG_LOAD_ERROR');
      expect(getErrorMessage(result)).toContain('Failed to load configuration');
    });

    it('should pass options to cosmiconfig', async () => {
      const schema = z.object({
        name: z.string().default('test'),
      });

      mockSearch.mockResolvedValue(null);

      const config = defineConfig(schema);
      await config.load({
        name: 'my-cli',
        searchFrom: '/custom/path',
      });

      expect(mockCosmiconfig).toHaveBeenCalledWith('my-cli', {
        searchPlaces: [
          'package.json',
          '.my-clirc',
          '.my-clirc.json',
          '.my-clirc.js',
          '.my-clirc.ts',
          '.my-clirc.mjs',
          '.my-clirc.cjs',
          '.my-clirc.yaml',
          '.my-clirc.yml',
          'my-cli.config.js',
          'my-cli.config.ts',
          'my-cli.config.mjs',
          'my-cli.config.cjs',
          'my-cli.config.json',
        ],
        ignoreEmptySearchPlaces: false,
      });

      expect(mockSearch).toHaveBeenCalledWith('/custom/path');
    });

    it('should use default config name when not provided', async () => {
      const schema = z.object({
        name: z.string().default('test'),
      });

      mockSearch.mockResolvedValue(null);

      const config = defineConfig(schema);
      await config.load();

      expect(mockCosmiconfig).toHaveBeenCalledWith('config', {
        searchPlaces: [
          'package.json',
          '.configrc',
          '.configrc.json',
          '.configrc.js',
          '.configrc.ts',
          '.configrc.mjs',
          '.configrc.cjs',
          '.configrc.yaml',
          '.configrc.yml',
          'config.config.js',
          'config.config.ts',
          'config.config.mjs',
          'config.config.cjs',
          'config.config.json',
        ],
        ignoreEmptySearchPlaces: false,
      });
    });
  });

  describe('loadConfig', () => {
    it('should be a convenience function for defineConfig + load', async () => {
      const schema = z.object({
        name: z.string().default('test-app'),
        version: z.string().default('1.0.0'),
      });

      mockSearch.mockResolvedValue(null);

      const result = await loadConfig(schema);
      expect(isOk(result)).toBe(true);
      expect(unwrap(result)).toEqual({
        name: 'test-app',
        version: '1.0.0',
      });
    });

    it('should forward options to defineConfig', async () => {
      const schema = z.object({
        name: z.string().default('test'),
      });

      mockSearch.mockResolvedValue(null);

      await loadConfig(schema, {
        name: 'my-tool',
        searchFrom: '/custom/search',
      });

      expect(mockCosmiconfig).toHaveBeenCalledWith(
        'my-tool',
        expect.any(Object),
      );
      expect(mockSearch).toHaveBeenCalledWith('/custom/search');
    });
  });

  describe('Schema Validation', () => {
    it('should handle complex nested schemas', async () => {
      const schema = z.object({
        database: z.object({
          host: z.string().default('localhost'),
          port: z.number().default(5432),
          ssl: z.boolean().default(false),
        }),
        api: z.object({
          version: z.enum(['v1', 'v2']).default('v2'),
          endpoints: z.array(z.string()).default([]),
        }),
        features: z.record(z.boolean()).default({}),
      });

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

      const result = await loadConfig(schema);
      expect(isOk(result)).toBe(true);
      expect(unwrap(result)).toEqual(configData);
    });

    it('should apply schema defaults for partial config', async () => {
      const schema = z.object({
        server: z.object({
          host: z.string().default('0.0.0.0'),
          port: z.number().default(3000),
          timeout: z.number().default(5000),
        }),
        logging: z.object({
          level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
          file: z.string().optional(),
        }),
      });

      // Partial config - only some values provided
      const partialConfig = {
        server: {
          port: 8080,
        },
        logging: {
          level: 'debug' as const,
        },
      };

      mockSearch.mockResolvedValue({
        config: partialConfig,
        filepath: '/project/.configrc',
      });

      const result = await loadConfig(schema);
      expect(isOk(result)).toBe(true);
      expect(unwrap(result)).toEqual({
        server: {
          host: '0.0.0.0', // default
          port: 8080, // from config
          timeout: 5000, // default
        },
        logging: {
          level: 'debug', // from config
          // file is optional, no default
        },
      });
    });

    it('should validate enum values', async () => {
      const schema = z.object({
        environment: z.enum(['development', 'staging', 'production']),
        logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
      });

      mockSearch.mockResolvedValue({
        config: {
          environment: 'invalid-env',
          logLevel: 'verbose', // invalid
        },
        filepath: '/project/config.js',
      });

      const result = await loadConfig(schema);
      expect(isErr(result)).toBe(true);
      expect(getErrorMessage(result)).toContain('Invalid configuration');
    });

    it('should handle array validations', async () => {
      const schema = z.object({
        allowedHosts: z.array(z.string().url()),
        ports: z.array(z.number().min(1).max(65535)),
        features: z.array(z.enum(['auth', 'cache', 'logging'])),
      });

      mockSearch.mockResolvedValue({
        config: {
          allowedHosts: ['not-a-url', 'https://example.com'],
          ports: [80, 99999], // 99999 is too high
          features: ['auth', 'unknown-feature'],
        },
        filepath: '/project/config.json',
      });

      const result = await loadConfig(schema);
      expect(isErr(result)).toBe(true);
      expect(getErrorMessage(result)).toContain('Invalid configuration');
    });
  });

  describe('Search Places', () => {
    it('should include all expected search places', async () => {
      const schema = z.object({ name: z.string().default('test') });
      mockSearch.mockResolvedValue(null);

      await loadConfig(schema, { name: 'myapp' });

      expect(mockCosmiconfig).toHaveBeenCalledWith('myapp', {
        searchPlaces: [
          'package.json',
          '.myapprc',
          '.myapprc.json',
          '.myapprc.js',
          '.myapprc.ts',
          '.myapprc.mjs',
          '.myapprc.cjs',
          '.myapprc.yaml',
          '.myapprc.yml',
          'myapp.config.js',
          'myapp.config.ts',
          'myapp.config.mjs',
          'myapp.config.cjs',
          'myapp.config.json',
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

      const result = await loadConfig(schema);
      expect(isErr(result)).toBe(true);
      const error = result.error as any;
      expect(error.code).toBe('CONFIG_VALIDATION_ERROR');
      expect(getErrorMessage(result)).toContain(
        'Invalid default configuration',
      );
    });

    it('should handle malformed JSON config', async () => {
      const schema = z.object({
        name: z.string().default('test'),
      });

      // Mock cosmiconfig throwing JSON parse error
      mockSearch.mockRejectedValue(new SyntaxError('Unexpected token in JSON'));

      const result = await loadConfig(schema);
      expect(isErr(result)).toBe(true);
      expect(getErrorMessage(result)).toContain('Failed to load configuration');
    });

    it('should provide detailed validation errors', async () => {
      const schema = z.object({
        name: z.string().min(3),
        port: z.number().min(1000).max(9999),
        features: z.array(z.string()),
      });

      mockSearch.mockResolvedValue({
        config: {
          name: 'ab', // too short
          port: 99, // too low
          features: 'not-an-array',
        },
        filepath: '/project/config.json',
      });

      const result = await loadConfig(schema);
      expect(isErr(result)).toBe(true);

      const errorMsg = getErrorMessage(result);
      expect(errorMsg).toContain('Invalid configuration');
    });
  });

  describe('Integration Scenarios', () => {
    it('should work with environment-specific configs', async () => {
      const baseSchema = z.object({
        app: z.object({
          name: z.string().default('myapp'),
          debug: z.boolean().default(false),
        }),
        database: z.object({
          url: z.string().default('sqlite:memory:'),
        }),
      });

      // Development config
      const devConfig = {
        app: {
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

      const result = await loadConfig(baseSchema, { name: 'myapp' });
      expect(isOk(result)).toBe(true);

      const config = unwrap(result);
      expect(config.app.name).toBe('myapp'); // default
      expect(config.app.debug).toBe(true); // from config
      expect(config.database.url).toBe('postgresql://localhost:5432/myapp_dev');
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

      const result = await loadConfig(schema);
      expect(isOk(result)).toBe(true);
      expect(unwrap(result)).toEqual(packageJsonConfig);
    });
  });
});
