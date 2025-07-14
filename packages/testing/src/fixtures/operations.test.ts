import { describe, it, expect } from 'vitest';
import { ok } from '@esteban-url/core';
import { createFixtureOperations } from './operations.js';

describe('Fixture Operations', () => {
  const fixtureOps = createFixtureOperations();

  describe('createRegistry', () => {
    it('should create a fixture registry', () => {
      const registry = fixtureOps.createRegistry();

      expect(typeof registry.register).toBe('function');
      expect(typeof registry.get).toBe('function');
      expect(typeof registry.cleanup).toBe('function');
      expect(typeof registry.clear).toBe('function');
    });
  });

  describe('createFixture', () => {
    it('should create a fixture definition', () => {
      const fixture = fixtureOps.createFixture('test-fixture', {
        create: () => ok({ value: 42 }),
      });

      expect(fixture.name).toBe('test-fixture');
      expect(typeof fixture.create).toBe('function');
    });

    it('should support cleanup function', () => {
      const fixture = fixtureOps.createFixture('test-fixture', {
        create: () => ok({ value: 42 }),
        cleanup: () => ok(undefined),
      });

      expect(fixture.cleanup).toBeDefined();
    });

    it('should support dependencies', () => {
      const fixture = fixtureOps.createFixture('dependent-fixture', {
        create: () => ok({ value: 42 }),
        dependencies: ['base-fixture'],
      });

      expect(fixture.dependencies).toEqual(['base-fixture']);
    });
  });

  describe('registry operations', () => {
    it('should register and retrieve fixtures', async () => {
      const registry = fixtureOps.createRegistry();
      const fixture = fixtureOps.createFixture('test-data', {
        create: () => ok({ id: 1, name: 'test' }),
      });

      registry.register(fixture);

      const result = await registry.get('test-data');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual({ id: 1, name: 'test' });
      }
    });

    it('should return same instance on multiple gets', async () => {
      const registry = fixtureOps.createRegistry();
      const fixture = fixtureOps.createFixture('singleton', {
        create: () => ok({ timestamp: Date.now() }),
      });

      registry.register(fixture);

      const result1 = await registry.get('singleton');
      const result2 = await registry.get('singleton');

      expect(result1.isOk()).toBe(true);
      expect(result2.isOk()).toBe(true);
      if (result1.isOk() && result2.isOk()) {
        expect(result1.value).toBe(result2.value);
      }
    });

    it('should handle fixture dependencies', async () => {
      const registry = fixtureOps.createRegistry();

      const baseFixture = fixtureOps.createFixture('base', {
        create: () => ok({ baseValue: 'foundation' }),
      });

      const dependentFixture = fixtureOps.createFixture('dependent', {
        create: async () => {
          const base = await registry.get<{ baseValue: string }>('base');
          if (base.isErr()) return base;
          return ok({ dependentValue: `built on ${base.value.baseValue}` });
        },
        dependencies: ['base'],
      });

      registry.register(baseFixture);
      registry.register(dependentFixture);

      const result = await registry.get('dependent');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual({ dependentValue: 'built on foundation' });
      }
    });

    it('should handle missing fixtures', async () => {
      const registry = fixtureOps.createRegistry();

      const result = await registry.get('non-existent');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.code).toBe('FIXTURE_NOT_FOUND');
      }
    });

    it('should prevent duplicate registration', () => {
      const registry = fixtureOps.createRegistry();
      const fixture = fixtureOps.createFixture('duplicate', {
        create: () => ok({}),
      });

      registry.register(fixture);
      expect(() => registry.register(fixture)).toThrow();
    });

    it('should cleanup fixtures in reverse order', async () => {
      const registry = fixtureOps.createRegistry();
      const cleanupOrder: string[] = [];

      const fixture1 = fixtureOps.createFixture('first', {
        create: () => ok({ name: 'first' }),
        cleanup: () => {
          cleanupOrder.push('first');
          return ok(undefined);
        },
      });

      const fixture2 = fixtureOps.createFixture('second', {
        create: () => ok({ name: 'second' }),
        cleanup: () => {
          cleanupOrder.push('second');
          return ok(undefined);
        },
      });

      registry.register(fixture1);
      registry.register(fixture2);

      await registry.get('first');
      await registry.get('second');

      const cleanupResult = await registry.cleanup();

      expect(cleanupResult.isOk()).toBe(true);
      expect(cleanupOrder).toEqual(['second', 'first']);
    });

    it('should clear all state', () => {
      const registry = fixtureOps.createRegistry();
      const fixture = fixtureOps.createFixture('test', {
        create: () => ok({}),
      });

      registry.register(fixture);
      registry.clear();

      // Should be able to register same fixture again
      expect(() => registry.register(fixture)).not.toThrow();
    });
  });

  describe('withFixtures', () => {
    it('should execute function with fixture registry', async () => {
      const fixtures = [
        fixtureOps.createFixture('config', {
          create: () => ok({ setting: 'value' }),
        }),
        fixtureOps.createFixture('data', {
          create: () => ok({ items: [1, 2, 3] }),
        }),
      ];

      const result = await fixtureOps.withFixtures(fixtures, async registry => {
        const config = await registry.get('config');
        const data = await registry.get('data');

        if (config.isErr() || data.isErr()) {
          return ok('error');
        }

        return ok({
          config: config.value,
          data: data.value,
        });
      });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual({
          config: { setting: 'value' },
          data: { items: [1, 2, 3] },
        });
      }
    });

    it('should cleanup fixtures after execution', async () => {
      let cleanupCalled = false;

      const fixtures = [
        fixtureOps.createFixture('cleanup-test', {
          create: () => ok({}),
          cleanup: () => {
            cleanupCalled = true;
            return ok(undefined);
          },
        }),
      ];

      await fixtureOps.withFixtures(fixtures, async registry => {
        await registry.get('cleanup-test');
        return ok('done');
      });

      expect(cleanupCalled).toBe(true);
    });

    it('should cleanup even if function throws', async () => {
      let cleanupCalled = false;

      const fixtures = [
        fixtureOps.createFixture('error-test', {
          create: () => ok({}),
          cleanup: () => {
            cleanupCalled = true;
            return ok(undefined);
          },
        }),
      ];

      const result = await fixtureOps.withFixtures(fixtures, async registry => {
        await registry.get('error-test');
        throw new Error('Test error');
      });

      expect(result.isErr()).toBe(true);
      expect(cleanupCalled).toBe(true);
    });
  });
});
