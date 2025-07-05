import { describe, it, expect, vi } from 'vitest';
import { resolve } from 'path';
import {
  createValidationPipeline,
  createRule,
  ValidationOk as Ok,
  ValidationErr as Err,
  type ValidationContext,
} from '@esteban-url/trailhead-cli/core';

describe('Validation Pipeline', () => {
  describe('Business Logic', () => {
    it('should validate required fields and report all errors', () => {
      const pipeline = createValidationPipeline<{
        email: string;
        age: number;
      }>()
        .add(
          createRule(
            'email',
            'Email is required',
            (data) => {
              if (!data.email) return Err('Email is required', 'email');
              return Ok(data);
            },
            true,
          ),
        )
        .add(
          createRule(
            'age',
            'Age must be positive',
            (data) => {
              if (data.age < 0) return Err('Age must be positive', 'age');
              return Ok(data);
            },
            true,
          ),
        );

      const result = pipeline.validateSync({ email: '', age: -5 });

      expect(result.overall).toBe('fail');
      expect(result.failed.length).toBe(2);
      expect(result.failed[0].message).toContain('Email is required');
      expect(result.failed[1].message).toContain('Age must be positive');
      expect(result.warnings.length).toBe(0);
    });

    it('should continue validation for non-required fields', () => {
      const pipeline = createValidationPipeline<{
        name?: string;
        email?: string;
      }>()
        .add(
          createRule(
            'name',
            'Name format',
            (data) => {
              if (data.name && data.name.length < 2) {
                return Err('Name too short', 'name');
              }
              return Ok(data);
            },
            false,
          ),
        )
        .add(
          createRule(
            'email',
            'Email format',
            (data) => {
              if (data.email && !data.email.includes('@')) {
                return Err('Invalid email', 'email');
              }
              return Ok(data);
            },
            false,
          ),
        );

      const result = pipeline.validateSync({ name: 'A', email: 'invalid' });

      expect(result.overall).toBe('warning');
      expect(result.warnings.length).toBe(2);
      expect(result.warnings[0].message).toContain('Name too short');
      expect(result.warnings[1].message).toContain('Invalid email');
    });
  });

  describe('Context Usage', () => {
    it('should pass context to all validation rules', () => {
      const mockValidator1 = vi.fn().mockReturnValue(Ok({}));
      const mockValidator2 = vi.fn().mockReturnValue(Ok({}));

      const context: ValidationContext = {
        projectRoot: resolve('test', 'project'),
        verbose: true,
      };

      const pipeline = createValidationPipeline<{}>()
        .add(createRule('test1', 'Test 1', mockValidator1))
        .add(createRule('test2', 'Test 2', mockValidator2));

      pipeline.validateSync({}, context);

      expect(mockValidator1).toHaveBeenCalledWith({});
      expect(mockValidator2).toHaveBeenCalledWith({});
    });
  });

  describe('Async Validation', () => {
    it('should handle async validators correctly', async () => {
      const pipeline = createValidationPipeline<{ apiKey: string }>().add(
        createRule('apiKey', 'API key validation', async (data) => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          if (data.apiKey === 'invalid') {
            return Err('Invalid API key', 'apiKey');
          }
          return Ok(data);
        }),
      );

      const result = await pipeline.validate({ apiKey: 'invalid' });

      expect(result.overall).toBe('fail');
      expect(result.failed.length).toBe(1);
      expect(result.failed[0].message).toContain('Invalid API key');
    });

    it('should process validators sequentially', async () => {
      const startTime = Date.now();

      const pipeline = createValidationPipeline<{
        field1: string;
        field2: string;
      }>()
        .add(
          createRule(
            'field1',
            'Field 1',
            async (data) => {
              await new Promise((resolve) => setTimeout(resolve, 50));
              return Ok(data);
            },
            false,
          ),
        )
        .add(
          createRule(
            'field2',
            'Field 2',
            async (data) => {
              await new Promise((resolve) => setTimeout(resolve, 50));
              return Ok(data);
            },
            false,
          ),
        );

      await pipeline.validate({ field1: 'test', field2: 'test' });
      const elapsed = Date.now() - startTime;

      expect(elapsed).toBeGreaterThanOrEqual(100);
    });
  });

  describe('Error Recovery', () => {
    it('should handle validator exceptions gracefully', () => {
      const pipeline = createValidationPipeline<{}>().add(
        createRule('failing', 'Will throw', () => {
          throw new Error('Unexpected error');
        }),
      );

      const result = pipeline.validateSync({});

      expect(result.overall).toBe('fail');
      expect(result.failed.length).toBe(1);
      expect(result.failed[0].message).toContain('Unexpected error');
    });
  });

  describe('Empty Pipeline', () => {
    it('should pass validation for empty pipeline', () => {
      const pipeline = createValidationPipeline<{}>();
      const result = pipeline.validateSync({});

      expect(result.overall).toBe('pass');
      expect(result.failed).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });
  });
});
