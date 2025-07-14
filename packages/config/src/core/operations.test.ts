import { describe, it, expect } from 'vitest';
import { z } from '@esteban-url/validation';
import { createConfigOperations } from './operations.js';

describe('Config Operations', () => {
  const configOps = createConfigOperations();

  describe('create', () => {
    it('should create a config manager successfully', () => {
      const definition = {
        name: 'test-config',
        sources: [
          {
            type: 'object' as const,
            data: { key: 'value' },
            priority: 1,
          },
        ],
      };

      const result = configOps.create(definition);

      // Debug output removed for production

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const manager = result.value;
        expect(manager.definition.name).toBe('test-config');
      }
    });

    it('should reject config without name', () => {
      const definition = {
        name: '',
        sources: [
          {
            type: 'object' as const,
            data: { key: 'value' },
            priority: 1,
          },
        ],
      };

      const result = configOps.create(definition);
      expect(result.isErr()).toBe(true);
    });

    it('should reject config without sources', () => {
      const definition = {
        name: 'test-config',
        sources: [],
      };

      const result = configOps.create(definition);
      expect(result.isErr()).toBe(true);
    });
  });

  describe('load', () => {
    it('should load configuration from object source', async () => {
      const definition = {
        name: 'test-config',
        sources: [
          {
            type: 'object' as const,
            data: { key: 'value', number: 42 },
            priority: 1,
          },
        ],
      };

      const result = await configOps.load(definition);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const state = result.value;
        expect(state.resolved.key).toBe('value');
        expect(state.resolved.number).toBe(42);
        expect(state.sources).toHaveLength(1);
      }
    });

    it('should merge multiple sources by priority', async () => {
      const definition = {
        name: 'test-config',
        sources: [
          {
            type: 'object' as const,
            data: { key: 'low-priority', common: 'base' },
            priority: 1,
          },
          {
            type: 'object' as const,
            data: { key: 'high-priority', extra: 'additional' },
            priority: 2,
          },
        ],
      };

      const result = await configOps.load(definition);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const state = result.value;
        expect(state.resolved.key).toBe('high-priority'); // Higher priority wins
        expect(state.resolved.common).toBe('base');
        expect(state.resolved.extra).toBe('additional');
      }
    });

    it('should apply defaults', async () => {
      const definition = {
        name: 'test-config',
        sources: [
          {
            type: 'object' as const,
            data: { key: 'value' },
            priority: 1,
          },
        ],
        defaults: {
          defaultKey: 'defaultValue',
          key: 'shouldBeOverridden',
        },
      };

      const result = await configOps.load(definition);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const state = result.value;
        expect(state.resolved.key).toBe('value'); // Source overrides default
        expect(state.resolved.defaultKey).toBe('defaultValue');
      }
    });
  });

  describe('validate', () => {
    it('should validate configuration against schema', () => {
      const config = { name: 'test', age: 25 };
      const schema = {
        name: 'TestSchema',
        zodSchema: z.object({
          name: z.string(),
          age: z.number(),
        }),
      };

      const result = configOps.validate(config, schema);
      expect(result.isOk()).toBe(true);
    });
  });

  describe('transform', () => {
    it('should transform configuration using transformers', () => {
      const config = { name: 'test', count: '42' };
      const transformers = [
        {
          name: 'parseNumbers',
          transform: (cfg: any) => {
            return {
              isOk: () => true,
              isErr: () => false,
              value: {
                ...cfg,
                count: parseInt(cfg.count, 10),
              },
            } as any;
          },
        },
      ];

      const result = configOps.transform(config, transformers as any);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.count).toBe(42);
      }
    });
  });
});
