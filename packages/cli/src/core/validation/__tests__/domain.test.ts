/**
 * High-ROI tests for domain validators
 * Tests business rules, user input validation, and edge cases
 */

import { describe, it, expect } from 'vitest';
import {
  framework,
  semver,
  tsConfig,
  packageJson,
  installOptions,
  projectConfig,
  importStatement,
  jsonContent,
} from '@esteban-url/trailhead-cli/core';
import type { Framework } from '@esteban-url/trailhead-cli/core';

describe('Domain Validators', () => {
  describe('Framework Validation', () => {
    it('should accept valid framework types', () => {
      console.log('framework import:', typeof framework, framework);
      const validFrameworks: Framework[] = [
        'redwood-sdk',
        'nextjs',
        'vite',
        'generic-react',
      ];

      for (const fw of validFrameworks) {
        const result = framework(fw);
        expect(result.success).toBe(true);
        expect(result.value).toBe(fw);
      }
    });

    it('should reject invalid framework types', () => {
      const invalidFrameworks = ['angular', 'vue', 'svelte', ''];

      for (const fw of invalidFrameworks) {
        const result = framework(fw);
        expect(result.success).toBe(false);
        expect(result.error.message).toContain('must be one of');
      }
    });
  });

  describe('Semantic Version Validation', () => {
    it('should parse valid semantic versions', () => {
      const versions = [
        { input: '1.2.3', expected: { major: 1, minor: 2, patch: 3 } },
        { input: '0.0.1', expected: { major: 0, minor: 0, patch: 1 } },
        { input: '10.20.30', expected: { major: 10, minor: 20, patch: 30 } },
        {
          input: '1.2.3-alpha',
          expected: { major: 1, minor: 2, patch: 3, prerelease: 'alpha' },
        },
        {
          input: '1.2.3+build123',
          expected: { major: 1, minor: 2, patch: 3, build: 'build123' },
        },
        {
          input: '1.2.3-beta.1+build',
          expected: {
            major: 1,
            minor: 2,
            patch: 3,
            prerelease: 'beta.1',
            build: 'build',
          },
        },
      ];

      for (const { input, expected } of versions) {
        const result = semver()(input);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value).toMatchObject(expected);
        }
      }
    });

    it('should handle version prefixes', () => {
      const result1 = semver()('^1.2.3');
      expect(result1.success).toBe(true);
      if (result1.success) expect(result1.value.major).toBe(1);

      const result2 = semver()('~2.3.4');
      expect(result2.success).toBe(true);
      if (result2.success) expect(result2.value.major).toBe(2);
    });

    it('should reject invalid versions', () => {
      const invalid = ['1.2', '1', 'v1.2.3', 'latest', ''];

      for (const version of invalid) {
        const result = semver()(version);
        expect(result.success).toBe(false);
      }
    });
  });

  describe('TypeScript Config Validation', () => {
    it('should validate correct tsconfig structure', () => {
      const config = {
        compilerOptions: {
          target: 'ES2020',
          baseUrl: '.',
          paths: {
            '@/*': ['./src/*'],
            '@components/*': ['./src/components/*'],
          },
          moduleResolution: 'bundler',
        },
        include: ['src/**/*'],
        exclude: ['node_modules'],
      };

      const result = tsConfig(config);
      expect(result.success).toBe(true);
      expect(result.value).toEqual(config);
    });

    it('should reject invalid path mappings', () => {
      const config = {
        compilerOptions: {
          paths: {
            '@/*': './src/*', // Should be array
          },
        },
      };

      const result = tsConfig(config);
      expect(result.success).toBe(false);
      expect(result.error.message).toContain('must be an array');
    });

    it('should reject non-string compiler options', () => {
      const config = {
        compilerOptions: {
          target: 123, // Should be string
        },
      };

      const result = tsConfig(config);
      expect(result.success).toBe(false);
      expect(result.error.message).toContain('must be a string');
    });
  });

  describe('Package.json Validation', () => {
    it('should validate correct package.json structure', () => {
      const pkg = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          react: '^18.0.0',
          'react-dom': '^18.0.0',
        },
        devDependencies: {
          typescript: '^5.0.0',
        },
        scripts: {
          build: 'tsc',
          test: 'vitest',
        },
      };

      const result = packageJson(pkg);
      expect(result.success).toBe(true);
      expect(result.value).toEqual(pkg);
    });

    it('should reject non-string dependency versions', () => {
      const pkg = {
        dependencies: {
          react: 18, // Should be string
        },
      };

      const result = packageJson(pkg);
      expect(result.success).toBe(false);
      expect(result.error.message).toContain('must be a string');
    });
  });

  describe('Install Options Validation', () => {
    it('should validate complete install options', () => {
      const options = {
        framework: 'nextjs' as Framework,
        destinationDir: 'components/ui',
        catalystDir: '../catalyst',
        force: true,
        dryRun: false,
        verbose: true,
      };

      const result = installOptions(options);
      expect(result.success).toBe(true);
      expect(result.value).toEqual(options);
    });

    it('should accept partial options', () => {
      const options = {
        framework: 'vite' as Framework,
        verbose: true,
      };

      const result = installOptions(options);
      expect(result.success).toBe(true);
      expect(result.value).toEqual(options);
    });

    it('should reject invalid framework in options', () => {
      const options = {
        framework: 'invalid',
      };

      const result = installOptions(options);
      expect(result.success).toBe(false);
      expect(result.error.message).toContain('must be one of');
    });

    it('should reject non-boolean flags', () => {
      const options = {
        force: 'true', // Should be boolean
      };

      const result = installOptions(options);
      expect(result.success).toBe(false);
      expect(result.error.message).toContain('must be a boolean');
    });
  });

  describe('Import Statement Validation', () => {
    it('should parse named imports', () => {
      const statement = "import { Button, Alert } from '@/components/ui'";
      const result = importStatement.validate(statement);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.module).toBe('@/components/ui');
        expect(result.value.imports).toEqual(['Button', 'Alert']);
        expect(result.value.isDefault).toBe(false);
      }
    });

    it('should parse default imports', () => {
      const statement = "import React from 'react'";
      const result = importStatement.validate(statement);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.module).toBe('react');
        expect(result.value.imports).toEqual(['React']);
        expect(result.value.isDefault).toBe(true);
      }
    });

    it('should handle imports with semicolons', () => {
      const statement = "import { useState } from 'react';";
      const result = importStatement.validate(statement);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.module).toBe('react');
      }
    });

    it('should reject invalid import statements', () => {
      const invalid = [
        'const x = 5',
        'import from "module"',
        'import { } from ""',
        'require("module")',
      ];

      for (const stmt of invalid) {
        const result = importStatement.validate(stmt);
        expect(result.success).toBe(false);
      }
    });
  });

  describe('JSON Content Validation', () => {
    it('should parse valid JSON', () => {
      const json = '{"name": "test", "value": 123, "nested": {"key": "value"}}';
      const result = jsonContent<{ name: string; value: number }>()(json);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.name).toBe('test');
        expect(result.value.value).toBe(123);
      }
    });

    it('should reject invalid JSON', () => {
      const invalid = [
        '{invalid json}',
        'undefined',
        "{'single': 'quotes'}",
        '{name: value}', // Missing quotes
      ];

      for (const json of invalid) {
        const result = jsonContent()(json);
        expect(result.success).toBe(false);
        expect(result.error.message).toContain('Invalid JSON');
      }
    });
  });

  describe('Project Config Validation', () => {
    it('should validate required project configuration', () => {
      const config = {
        projectRoot: '/home/user/project',
        componentsDir: '/home/user/project/components',
        libDir: '/home/user/project/components/lib',
      };

      const result = projectConfig(config);
      expect(result.success).toBe(true);
      expect(result.value).toEqual(config);
    });

    it('should accept optional catalyst directory', () => {
      const config = {
        projectRoot: '/project',
        componentsDir: '/project/components',
        libDir: '/project/lib',
        catalystDir: '/project/catalyst',
      };

      const result = projectConfig(config);
      expect(result.success).toBe(true);
      expect(result.value.catalystDir).toBe('/project/catalyst');
    });

    it('should reject empty required fields', () => {
      const config = {
        projectRoot: '',
        componentsDir: 'components',
        libDir: 'lib',
      };

      const result = projectConfig(config);
      expect(result.success).toBe(false);
      expect(result.error.message).toContain('non-empty string');
    });
  });
});
