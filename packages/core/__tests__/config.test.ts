import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createConfig, validators, configOps, env } from '../src/functional/config.js';

describe('Configuration System', () => {
  describe('Config Builder', () => {
    interface TestConfig {
      name: string;
      port: number;
      enabled: boolean;
      optional?: string;
    }

    const defaultConfig: TestConfig = {
      name: 'test-app',
      port: 3000,
      enabled: true,
    };

    it('should build config with defaults', () => {
      const config = createConfig(defaultConfig).build();

      expect(config.isOk()).toBe(true);
      if (config.isOk()) {
        expect(config.value).toEqual(defaultConfig);
      }
    });

    it('should override config values', () => {
      const config = createConfig(defaultConfig)
        .with('port', 8080)
        .with('name', 'custom-app')
        .build();

      expect(config.isOk()).toBe(true);
      if (config.isOk()) {
        expect(config.value.port).toBe(8080);
        expect(config.value.name).toBe('custom-app');
        expect(config.value.enabled).toBe(true); // unchanged
      }
    });

    it('should merge config objects', () => {
      const overrides = { port: 8080, enabled: false };
      const config = createConfig(defaultConfig).merge(overrides).build();

      expect(config.isOk()).toBe(true);
      if (config.isOk()) {
        expect(config.value.port).toBe(8080);
        expect(config.value.enabled).toBe(false);
        expect(config.value.name).toBe('test-app'); // unchanged
      }
    });

    it('should validate config', () => {
      const config = createConfig(defaultConfig)
        .with('port', 8080)
        .validate(validators.required('name'))
        .validate(validators.isNumber('port'))
        .build();

      expect(config.isOk()).toBe(true);
    });

    it('should fail validation for missing required field', () => {
      const configWithUndefined = { ...defaultConfig, name: undefined as any };
      const config = createConfig(configWithUndefined)
        .validate(validators.required('name'))
        .build();

      expect(config.isErr()).toBe(true);
      if (config.isErr()) {
        expect(config.error.message).toContain("Required field 'name' is missing");
      }
    });
  });

  describe('Validators', () => {
    interface TestConfig {
      name?: string;
      port?: number;
      enabled?: boolean;
      mode?: 'dev' | 'prod';
      email?: string;
    }

    it('should validate required fields', () => {
      const validator = validators.required<TestConfig>('name');

      expect(validator({ name: 'test' }).isOk()).toBe(true);
      expect(validator({}).isErr()).toBe(true);
      expect(validator({ name: null as any }).isErr()).toBe(true);
    });

    it('should validate string fields', () => {
      const validator = validators.isString<TestConfig>('name');

      expect(validator({ name: 'test' }).isOk()).toBe(true);
      expect(validator({}).isOk()).toBe(true); // undefined is ok
      expect(validator({ name: 123 as any }).isErr()).toBe(true);
    });

    it('should validate number fields', () => {
      const validator = validators.isNumber<TestConfig>('port');

      expect(validator({ port: 3000 }).isOk()).toBe(true);
      expect(validator({}).isOk()).toBe(true); // undefined is ok
      expect(validator({ port: '3000' as any }).isErr()).toBe(true);
    });

    it('should validate boolean fields', () => {
      const validator = validators.isBoolean<TestConfig>('enabled');

      expect(validator({ enabled: true }).isOk()).toBe(true);
      expect(validator({ enabled: false }).isOk()).toBe(true);
      expect(validator({}).isOk()).toBe(true); // undefined is ok
      expect(validator({ enabled: 'true' as any }).isErr()).toBe(true);
    });

    it('should validate number ranges', () => {
      const validator = validators.inRange<TestConfig>('port', 1000, 9000);

      expect(validator({ port: 3000 }).isOk()).toBe(true);
      expect(validator({ port: 1000 }).isOk()).toBe(true);
      expect(validator({ port: 9000 }).isOk()).toBe(true);
      expect(validator({ port: 500 }).isErr()).toBe(true);
      expect(validator({ port: 10000 }).isErr()).toBe(true);
    });

    it('should validate allowed values', () => {
      const validator = validators.oneOf<TestConfig, 'dev' | 'prod'>('mode', ['dev', 'prod']);

      expect(validator({ mode: 'dev' }).isOk()).toBe(true);
      expect(validator({ mode: 'prod' }).isOk()).toBe(true);
      expect(validator({}).isOk()).toBe(true); // undefined is ok
      expect(validator({ mode: 'test' as any }).isErr()).toBe(true);
    });

    it('should validate string patterns', () => {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const validator = validators.matchesPattern<TestConfig>(
        'email',
        emailPattern,
        'must be a valid email'
      );

      expect(validator({ email: 'test@example.com' }).isOk()).toBe(true);
      expect(validator({}).isOk()).toBe(true); // undefined is ok
      expect(validator({ email: 'invalid-email' }).isErr()).toBe(true);
    });
  });

  describe('Config Operations', () => {
    const config1 = { name: 'app1', port: 3000, enabled: true };
    const config2 = { port: 8080, debug: true };
    const config3 = { name: 'app3', timeout: 5000 };

    it('should merge multiple configs', () => {
      const merged = configOps.merge(config1, config2, config3);

      expect(merged).toEqual({
        name: 'app3', // last value wins
        port: 8080, // last value wins
        enabled: true,
        debug: true,
        timeout: 5000,
      });
    });

    it('should pick specific fields', () => {
      const picked = configOps.pick(config1, ['name', 'port']);

      expect(picked).toEqual({
        name: 'app1',
        port: 3000,
      });
    });

    it('should omit specific fields', () => {
      const omitted = configOps.omit(config1, ['enabled']);

      expect(omitted).toEqual({
        name: 'app1',
        port: 3000,
      });
    });

    it('should map config values', () => {
      const mapped = configOps.map(config1, (value, key) => `${key}:${value}`);

      expect(mapped).toEqual({
        name: 'name:app1',
        port: 'port:3000',
        enabled: 'enabled:true',
      });
    });

    it('should filter config by predicate', () => {
      const filtered = configOps.filter(config1, value => typeof value === 'string');

      expect(filtered).toEqual({
        name: 'app1',
      });
    });
  });

  describe('Environment Variables', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should get environment variable with default', () => {
      process.env.TEST_VAR = 'test-value';

      expect(env.get('TEST_VAR')).toBe('test-value');
      expect(env.get('NON_EXISTENT', 'default')).toBe('default');
      expect(env.get('NON_EXISTENT')).toBeUndefined();
    });

    it('should require environment variable', () => {
      process.env.REQUIRED_VAR = 'required-value';

      const result1 = env.require('REQUIRED_VAR');
      expect(result1.isOk()).toBe(true);
      if (result1.isOk()) {
        expect(result1.value).toBe('required-value');
      }

      const result2 = env.require('NON_EXISTENT_VAR');
      expect(result2.isErr()).toBe(true);
    });

    it('should parse number environment variables', () => {
      process.env.PORT = '3000';
      process.env.INVALID_PORT = 'not-a-number';

      const result1 = env.getNumber('PORT');
      expect(result1.isOk()).toBe(true);
      if (result1.isOk()) {
        expect(result1.value).toBe(3000);
      }

      const result2 = env.getNumber('INVALID_PORT');
      expect(result2.isErr()).toBe(true);

      const result3 = env.getNumber('NON_EXISTENT_PORT', 8080);
      expect(result3.isOk()).toBe(true);
      if (result3.isOk()) {
        expect(result3.value).toBe(8080);
      }
    });

    it('should parse boolean environment variables', () => {
      process.env.ENABLED_TRUE = 'true';
      process.env.ENABLED_FALSE = 'false';
      process.env.ENABLED_ONE = '1';
      process.env.ENABLED_ZERO = '0';
      process.env.ENABLED_INVALID = 'maybe';

      expect(env.getBoolean('ENABLED_TRUE').unwrapOr(false)).toBe(true);
      expect(env.getBoolean('ENABLED_FALSE').unwrapOr(true)).toBe(false);
      expect(env.getBoolean('ENABLED_ONE').unwrapOr(false)).toBe(true);
      expect(env.getBoolean('ENABLED_ZERO').unwrapOr(true)).toBe(false);
      expect(env.getBoolean('ENABLED_INVALID').isErr()).toBe(true);

      const result = env.getBoolean('NON_EXISTENT_BOOL', true);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(true);
      }
    });
  });
});
