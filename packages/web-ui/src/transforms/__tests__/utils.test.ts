import { describe, it, expect } from 'vitest';
import {
  createTransformMetadata,
  executeTransform,
  type TransformResult,
  type TransformMetadata,
} from '../utils';

describe('transform utils', () => {
  describe('createTransformMetadata', () => {
    it('should create transform metadata with all required fields', () => {
      const metadata = createTransformMetadata('test-transform', 'Test description', 'semantic');

      expect(metadata).toEqual({
        name: 'test-transform',
        description: 'Test description',
        category: 'semantic',
      });
    });

    it('should create metadata for all valid categories', () => {
      const categories: TransformMetadata['category'][] = [
        'semantic',
        'format',
        'quality',
        'import',
        'ast',
      ];

      categories.forEach(category => {
        const metadata = createTransformMetadata('test', 'description', category);
        expect(metadata.category).toBe(category);
      });
    });

    it('should return readonly metadata object', () => {
      const metadata = createTransformMetadata('test', 'description', 'format');

      // Properties should be readonly (TypeScript check)
      expect(metadata).toHaveProperty('name', 'test');
      expect(metadata).toHaveProperty('description', 'description');
      expect(metadata).toHaveProperty('category', 'format');
    });

    it('should handle special characters in name and description', () => {
      const metadata = createTransformMetadata(
        'test-transform_123',
        'Description with special chars: @#$%^&*()',
        'import'
      );

      expect(metadata.name).toBe('test-transform_123');
      expect(metadata.description).toBe('Description with special chars: @#$%^&*()');
    });

    it('should handle empty strings', () => {
      const metadata = createTransformMetadata('', '', 'ast');

      expect(metadata.name).toBe('');
      expect(metadata.description).toBe('');
      expect(metadata.category).toBe('ast');
    });
  });

  describe('executeTransform', () => {
    describe('successful execution', () => {
      it('should execute transform function and return success result', () => {
        const mockTransform = (): TransformResult => ({
          content: 'transformed content',
          changed: true,
          warnings: [],
        });

        const result = executeTransform(mockTransform);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toEqual({
            content: 'transformed content',
            changed: true,
            warnings: [],
          });
        }
      });

      it('should handle transform with no changes', () => {
        const mockTransform = (): TransformResult => ({
          content: 'original content',
          changed: false,
          warnings: [],
        });

        const result = executeTransform(mockTransform);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.changed).toBe(false);
          expect(result.value.content).toBe('original content');
        }
      });

      it('should handle transform with warnings', () => {
        const mockTransform = (): TransformResult => ({
          content: 'content with warnings',
          changed: true,
          warnings: ['Warning 1', 'Warning 2'],
        });

        const result = executeTransform(mockTransform);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.warnings).toEqual(['Warning 1', 'Warning 2']);
        }
      });

      it('should handle transform with empty content', () => {
        const mockTransform = (): TransformResult => ({
          content: '',
          changed: true,
          warnings: [],
        });

        const result = executeTransform(mockTransform);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.content).toBe('');
          expect(result.value.changed).toBe(true);
        }
      });

      it('should handle transform with large content', () => {
        const largeContent = 'x'.repeat(10000);
        const mockTransform = (): TransformResult => ({
          content: largeContent,
          changed: true,
          warnings: [],
        });

        const result = executeTransform(mockTransform);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.content).toBe(largeContent);
          expect(result.value.content.length).toBe(10000);
        }
      });
    });

    describe('error handling', () => {
      it('should catch and wrap Error objects', () => {
        const mockTransform = (): TransformResult => {
          throw new Error('Transform failed');
        };

        const result = executeTransform(mockTransform);

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.code).toBe('TRANSFORM_ERROR');
          expect(result.error.message).toBe('Transform execution failed: Transform failed');
          expect(result.error.recoverable).toBe(true);
        }
      });

      it('should catch and wrap string errors', () => {
        const mockTransform = (): TransformResult => {
          throw 'String error message';
        };

        const result = executeTransform(mockTransform);

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.code).toBe('TRANSFORM_ERROR');
          expect(result.error.message).toBe('Transform execution failed: String error message');
          expect(result.error.recoverable).toBe(true);
        }
      });

      it('should catch and wrap object errors', () => {
        const mockTransform = (): TransformResult => {
          throw { custom: 'error' };
        };

        const result = executeTransform(mockTransform);

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.code).toBe('TRANSFORM_ERROR');
          expect(result.error.message).toContain('Transform execution failed:');
          expect(result.error.recoverable).toBe(true);
        }
      });

      it('should catch and wrap null/undefined errors', () => {
        const mockTransform = (): TransformResult => {
          throw null;
        };

        const result = executeTransform(mockTransform);

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.code).toBe('TRANSFORM_ERROR');
          expect(result.error.message).toBe('Transform execution failed: null');
          expect(result.error.recoverable).toBe(true);
        }
      });

      it('should handle TypeScript/syntax errors', () => {
        const mockTransform = (): TransformResult => {
          throw new SyntaxError('Unexpected token');
        };

        const result = executeTransform(mockTransform);

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.code).toBe('TRANSFORM_ERROR');
          expect(result.error.message).toBe('Transform execution failed: Unexpected token');
          expect(result.error.recoverable).toBe(true);
        }
      });

      it('should handle reference errors', () => {
        const mockTransform = (): TransformResult => {
          throw new ReferenceError('undefined is not defined');
        };

        const result = executeTransform(mockTransform);

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.code).toBe('TRANSFORM_ERROR');
          expect(result.error.message).toBe('Transform execution failed: undefined is not defined');
          expect(result.error.recoverable).toBe(true);
        }
      });
    });

    describe('edge cases', () => {
      it('should handle transform function that returns minimal result', () => {
        const mockTransform = (): TransformResult => ({
          content: '',
          changed: false,
          warnings: [],
        });

        const result = executeTransform(mockTransform);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toEqual({
            content: '',
            changed: false,
            warnings: [],
          });
        }
      });

      it('should handle transform with many warnings', () => {
        const manyWarnings = Array.from({ length: 100 }, (_, i) => `Warning ${i}`);
        const mockTransform = (): TransformResult => ({
          content: 'content',
          changed: true,
          warnings: manyWarnings,
        });

        const result = executeTransform(mockTransform);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.warnings).toHaveLength(100);
          expect(result.value.warnings[0]).toBe('Warning 0');
          expect(result.value.warnings[99]).toBe('Warning 99');
        }
      });

      it('should handle transform that modifies content multiple times', () => {
        let content = 'initial';
        const mockTransform = (): TransformResult => {
          content = content + ' -> modified';
          content = content + ' -> modified again';
          return {
            content,
            changed: true,
            warnings: [],
          };
        };

        const result = executeTransform(mockTransform);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.content).toBe('initial -> modified -> modified again');
        }
      });
    });

    describe('performance considerations', () => {
      it('should handle computationally intensive transforms', () => {
        const mockTransform = (): TransformResult => {
          // Simulate some computational work
          let result = '';
          for (let i = 0; i < 1000; i++) {
            result += `line ${i}\n`;
          }
          return {
            content: result,
            changed: true,
            warnings: [],
          };
        };

        const result = executeTransform(mockTransform);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.content).toContain('line 0');
          expect(result.value.content).toContain('line 999');
          expect(result.value.changed).toBe(true);
        }
      });

      it('should handle transforms with complex warning generation', () => {
        const mockTransform = (): TransformResult => {
          const warnings: string[] = [];

          // Simulate complex warning logic
          for (let i = 0; i < 10; i++) {
            if (i % 2 === 0) {
              warnings.push(`Even number warning: ${i}`);
            }
            if (i > 5) {
              warnings.push(`Large number warning: ${i}`);
            }
          }

          return {
            content: 'processed content',
            changed: warnings.length > 0,
            warnings,
          };
        };

        const result = executeTransform(mockTransform);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.warnings.length).toBeGreaterThan(0);
          expect(result.value.warnings).toContain('Even number warning: 0');
          expect(result.value.warnings).toContain('Large number warning: 6');
        }
      });
    });
  });

  describe('integration scenarios', () => {
    it('should work with metadata creation and transform execution together', () => {
      const metadata = createTransformMetadata(
        'integration-test',
        'Integration test transform',
        'quality'
      );

      const mockTransform = (): TransformResult => ({
        content: `Transformed by ${metadata.name}`,
        changed: true,
        warnings: [`Applied ${metadata.description}`],
      });

      const result = executeTransform(mockTransform);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.content).toBe('Transformed by integration-test');
        expect(result.value.warnings).toContain('Applied Integration test transform');
      }
    });

    it('should handle chained transform scenarios', () => {
      const transform1 = (): TransformResult => ({
        content: 'step1',
        changed: true,
        warnings: ['Step 1 completed'],
      });

      const transform2 = (input: string): TransformResult => ({
        content: input + ' -> step2',
        changed: true,
        warnings: ['Step 2 completed'],
      });

      const result1 = executeTransform(transform1);
      expect(result1.isOk()).toBe(true);

      if (result1.isOk()) {
        const result2 = executeTransform(() => transform2(result1.value.content));
        expect(result2.isOk()).toBe(true);

        if (result2.isOk()) {
          expect(result2.value.content).toBe('step1 -> step2');
          expect(result2.value.changed).toBe(true);
        }
      }
    });
  });
});
