/**
 * @fileoverview Dependency Management Tests for Trailhead UI Install Script
 *
 * High-ROI tests focusing on critical dependency management functionality:
 * - Package.json validation and structure checking
 * - Data transformation and validation logic
 * - Business logic validation
 */

import { describe, it, expect } from 'vitest';
import type {} from '../../../src/cli/core/installation/types.js';
import { validatePackageJsonDeps } from '../../../src/cli/core/installation/dependencies.js';

describe('Dependency Management Tests', () => {
  describe('Package.json Validation', () => {
    it('should validate valid package.json structure', () => {
      const packageJson = {
        name: 'test-project',
        dependencies: {
          react: '^18.2.0',
          next: '^13.4.0',
        },
        devDependencies: {
          typescript: '^5.0.0',
        },
      };

      const result = validatePackageJsonDeps(packageJson);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.dependencies).toEqual({
          react: '^18.2.0',
          next: '^13.4.0',
        });
        expect(result.value.devDependencies).toEqual({
          typescript: '^5.0.0',
        });
      }
    });

    it('should handle missing dependencies sections', () => {
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
      };

      const result = validatePackageJsonDeps(packageJson);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.dependencies).toBeUndefined();
        expect(result.value.devDependencies).toBeUndefined();
      }
    });

    it('should reject non-object package.json', () => {
      const result = validatePackageJsonDeps('invalid');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Value must be an object');
      }
    });

    it('should reject invalid dependencies structure', () => {
      const packageJson = {
        name: 'test-project',
        dependencies: 'invalid',
      };

      const result = validatePackageJsonDeps(packageJson);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('dependencies must be an object');
      }
    });

    it('should reject invalid devDependencies structure', () => {
      const packageJson = {
        name: 'test-project',
        devDependencies: { typescript: 123 },
      };

      const result = validatePackageJsonDeps(packageJson);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('typescript must be a string');
      }
    });
  });
});
