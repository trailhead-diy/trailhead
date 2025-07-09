/**
 * Tests for shared transform utilities
 * Verifies the new utility functions work correctly
 */

import { describe, it, expect } from 'vitest';
import {
  createTransformResult,
  createNoChangeResult,
  createTransformError,
  createTransformMetadata,
  executeTransform,
  type TransformResult,
  type TransformMetadata,
} from '../core/transform-utils.js';

describe('Transform Utils', () => {
  describe('createTransformResult', () => {
    it('should create a successful transform result', () => {
      const result = createTransformResult('transformed content', true, ['warning']);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.content).toBe('transformed content');
        expect(result.value.changed).toBe(true);
        expect(result.value.warnings).toEqual(['warning']);
      }
    });

    it('should create result with default empty warnings', () => {
      const result = createTransformResult('content', false);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.warnings).toEqual([]);
      }
    });
  });

  describe('createNoChangeResult', () => {
    it('should create a no-change result', () => {
      const result = createNoChangeResult('original content', ['info']);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.content).toBe('original content');
        expect(result.value.changed).toBe(false);
        expect(result.value.warnings).toEqual(['info']);
      }
    });
  });

  describe('createTransformError', () => {
    it('should create a transform error', () => {
      const result = createTransformError('Something went wrong', 'CUSTOM_ERROR');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Something went wrong');
        expect(result.error.code).toBe('CUSTOM_ERROR');
        expect(result.error.recoverable).toBe(true);
      }
    });

    it('should use default error code', () => {
      const result = createTransformError('Error message');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('TRANSFORM_ERROR');
      }
    });
  });

  describe('createTransformMetadata', () => {
    it('should create transform metadata', () => {
      const metadata = createTransformMetadata('test-transform', 'Test description', 'format');

      expect(metadata.name).toBe('test-transform');
      expect(metadata.description).toBe('Test description');
      expect(metadata.category).toBe('format');
    });

    it('should handle all category types', () => {
      const categories: TransformMetadata['category'][] = [
        'semantic',
        'format',
        'quality',
        'import',
        'ast',
      ];

      categories.forEach(category => {
        const metadata = createTransformMetadata('test', 'Test', category);
        expect(metadata.category).toBe(category);
      });
    });
  });

  describe('executeTransform', () => {
    it('should execute successful transform', () => {
      const transformFn = () => ({
        content: 'transformed',
        changed: true,
        warnings: [],
      });

      const result = executeTransform(transformFn);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.content).toBe('transformed');
        expect(result.value.changed).toBe(true);
      }
    });

    it('should handle transform errors', () => {
      const transformFn = () => {
        throw new Error('Transform failed');
      };

      const result = executeTransform(transformFn);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Transform failed');
        expect(result.error.code).toBe('TRANSFORM_ERROR');
      }
    });

    it('should handle non-Error exceptions', () => {
      const transformFn = () => {
        throw 'String error';
      };

      const result = executeTransform(transformFn);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('String error');
      }
    });
  });

  describe('type safety', () => {
    it('should enforce correct TransformResult structure', () => {
      const validResult: TransformResult = {
        content: 'test',
        changed: true,
        warnings: ['warning'],
      };

      expect(validResult.content).toBe('test');
      expect(validResult.changed).toBe(true);
      expect(validResult.warnings).toEqual(['warning']);
    });

    it('should enforce correct TransformMetadata structure', () => {
      const validMetadata: TransformMetadata = {
        name: 'test',
        description: 'Test transform',
        category: 'semantic',
      };

      expect(validMetadata.name).toBe('test');
      expect(validMetadata.description).toBe('Test transform');
      expect(validMetadata.category).toBe('semantic');
    });
  });
});
