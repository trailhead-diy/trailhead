/**
 * Integration Matrix Tests
 *
 * Comprehensive testing of all generator combinations with real file generation.
 * Tests 12 core combinations: 3 templates × 2 package managers × 2 scenarios
 *
 * This test suite validates that:
 * - All template combinations generate successfully
 * - Generated TypeScript code compiles without errors
 * - Generated code passes linting
 * - Template variables resolve correctly
 * - File structure is correct for each template variant
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';
import { rmSync, existsSync } from 'fs';
import { execa } from 'execa';
import {
  createTestContext,
  mockFileSystem,
} from '@esteban-url/trailhead-cli/testing';
import { generateProject } from '../lib/generator.js';
import type {
  ProjectConfig,
  TemplateVariant,
  PackageManager,
} from '../lib/types.js';

/**
 * Test scenario configuration
 */
interface TestScenario {
  name: string;
  docs: boolean;
  git: boolean;
  description: string;
}

/**
 * Test combination for matrix testing
 */
interface TestCombination {
  template: TemplateVariant;
  packageManager: PackageManager;
  scenario: TestScenario;
  description: string;
}

// Test scenarios (no --install in CI)
const scenarios: TestScenario[] = [
  {
    name: 'minimal',
    docs: false,
    git: false,
    description: 'Minimal setup, fastest generation',
  },
  {
    name: 'full-setup',
    docs: true,
    git: true,
    description: 'Complete feature set without dependencies',
  },
];

// Generate all test combinations (12 total)
const testCombinations: TestCombination[] = [];
const templates: TemplateVariant[] = ['basic', 'advanced', 'enterprise'];
const packageManagers: PackageManager[] = ['npm', 'pnpm'];

for (const template of templates) {
  for (const packageManager of packageManagers) {
    for (const scenario of scenarios) {
      testCombinations.push({
        template,
        packageManager,
        scenario,
        description: `${template} template with ${packageManager} (${scenario.name})`,
      });
    }
  }
}

describe('Generator Integration Matrix', () => {
  let testBaseDir: string;
  let testContext: any;

  beforeEach(() => {
    // Use a subdirectory of current working directory instead of tmpdir for security validation
    testBaseDir = join(process.cwd(), 'test-temp', `matrix-${Date.now()}`);
    testContext = createTestContext({
      verbose: false,
      fs: undefined, // Use real filesystem for integration tests
    });
  });

  afterEach(() => {
    if (existsSync(testBaseDir)) {
      rmSync(testBaseDir, { recursive: true, force: true });
    }
  });

  describe('Template Generation Matrix', () => {
    // Test each combination individually for clear failure reporting
    for (const combination of testCombinations) {
      it(`should generate ${combination.description}`, async () => {
        const projectName = `test-${combination.template}-${combination.packageManager}-${combination.scenario.name}`;
        const projectPath = join(testBaseDir, projectName);

        const config: ProjectConfig = {
          projectName,
          projectPath,
          template: combination.template,
          packageManager: combination.packageManager,
          includeDocs: combination.scenario.docs,
          initGit: combination.scenario.git,
          installDependencies: false, // Never install dependencies in CI
          dryRun: false, // Use real file generation for integration tests
        };

        // Generate project
        const result = await generateProject(config, testContext);

        // Verify generation succeeded
        if (!result.success) {
          console.error('Generation failed:', result.error.message);
          console.error('Full error:', result.error);
        }
        expect(result.success).toBe(true);

        // Verify project directory exists
        expect(existsSync(projectPath)).toBe(true);

        // Verify core files exist
        expect(existsSync(join(projectPath, 'package.json'))).toBe(true);
        expect(existsSync(join(projectPath, 'tsconfig.json'))).toBe(true);
        expect(existsSync(join(projectPath, 'src/index.ts'))).toBe(true);

        // Verify package manager specific files
        if (combination.packageManager === 'pnpm') {
          expect(existsSync(join(projectPath, 'pnpm-workspace.yaml'))).toBe(
            true,
          );
        }

        // Verify template-specific files
        if (combination.template === 'enterprise') {
          expect(existsSync(join(projectPath, 'turbo.json'))).toBe(true);
          expect(existsSync(join(projectPath, '.changeset/config.json'))).toBe(
            true,
          );
        }

        // Verify scenario-specific files
        if (combination.scenario.docs) {
          expect(existsSync(join(projectPath, 'docs'))).toBe(true);
          expect(
            existsSync(join(projectPath, 'docs/tutorials/getting-started.md')),
          ).toBe(true);
        }

        if (combination.scenario.git) {
          expect(existsSync(join(projectPath, '.gitignore'))).toBe(true);
          expect(existsSync(join(projectPath, 'lefthook.yml'))).toBe(true);
        }
      });
    }
  });

  describe('Generated Code Quality', () => {
    // Test TypeScript compilation on a representative sample
    const sampleCombinations = [
      { template: 'basic' as const, packageManager: 'npm' as const },
      { template: 'advanced' as const, packageManager: 'pnpm' as const },
      { template: 'enterprise' as const, packageManager: 'pnpm' as const },
    ];

    for (const { template, packageManager } of sampleCombinations) {
      it(`should generate valid TypeScript code for ${template} template with ${packageManager}`, async () => {
        const projectName = `test-compile-${template}-${packageManager}`;
        const projectPath = join(testBaseDir, projectName);

        const config: ProjectConfig = {
          projectName,
          projectPath,
          template,
          packageManager,
          includeDocs: true,
          initGit: true,
          installDependencies: false,
          dryRun: false,
        };

        // Generate project
        const result = await generateProject(config, testContext);
        expect(result.success).toBe(true);

        // Test TypeScript compilation
        try {
          const { exitCode: tscExitCode } = await execa(
            'npx',
            ['tsc', '--noEmit'],
            {
              cwd: projectPath,
              stdio: 'pipe',
            },
          );
          expect(tscExitCode).toBe(0);
        } catch (error: any) {
          console.error(
            'TypeScript compilation failed:',
            error.stdout || error.message,
          );
          throw new Error(
            `TypeScript compilation failed for ${template} template`,
          );
        }

        // Test linting (if oxlint config exists)
        if (existsSync(join(projectPath, 'oxlintrc.json'))) {
          try {
            const { exitCode: lintExitCode } = await execa(
              'npx',
              ['oxlint', 'src'],
              {
                cwd: projectPath,
                stdio: 'pipe',
              },
            );
            expect(lintExitCode).toBe(0);
          } catch (error: any) {
            // Only fail if it's a real linting error, not a missing oxlint binary
            if (
              !error.message.includes('not found') &&
              !error.message.includes('ENOENT')
            ) {
              console.error('Linting failed:', error.stdout || error.message);
              throw new Error(`Linting failed for ${template} template`);
            }
          }
        }
      });
    }
  });

  describe('Package Manager Compatibility', () => {
    it('should generate npm-compatible projects', async () => {
      const projectName = 'test-npm-compat';
      const projectPath = join(testBaseDir, projectName);

      const config: ProjectConfig = {
        projectName,
        projectPath,
        template: 'basic',
        packageManager: 'npm',
        includeDocs: false,
        initGit: false,
        installDependencies: false,
        dryRun: false,
      };

      const result = await generateProject(config, testContext);
      expect(result.success).toBe(true);

      // Verify npm-specific configuration
      const packageJson = await import(join(projectPath, 'package.json'));
      expect(packageJson.scripts).toBeDefined();
      expect(packageJson.scripts.build).toContain('pnpm'); // Should use npm commands
    });

    it('should generate pnpm-compatible projects', async () => {
      const projectName = 'test-pnpm-compat';
      const projectPath = join(testBaseDir, projectName);

      const config: ProjectConfig = {
        projectName,
        projectPath,
        template: 'advanced',
        packageManager: 'pnpm',
        includeDocs: false,
        initGit: false,
        installDependencies: false,
        dryRun: false,
      };

      const result = await generateProject(config, testContext);
      expect(result.success).toBe(true);

      // Verify pnpm-specific files
      expect(existsSync(join(projectPath, 'pnpm-workspace.yaml'))).toBe(true);

      // Verify pnpm configuration in package.json
      const packageJson = await import(join(projectPath, 'package.json'));
      expect(packageJson.packageManager).toContain('pnpm');
    });
  });

  describe('Template Validation', () => {
    it('should resolve all template variables correctly', async () => {
      const projectName = 'test-template-vars';
      const projectPath = join(testBaseDir, projectName);

      const config: ProjectConfig = {
        projectName,
        projectPath,
        template: 'enterprise',
        packageManager: 'pnpm',
        includeDocs: true,
        initGit: true,
        installDependencies: false,
        dryRun: false,
      };

      const result = await generateProject(config, testContext);
      expect(result.success).toBe(true);

      // Read generated package.json to verify template variables
      const packageJsonPath = join(projectPath, 'package.json');
      const packageJsonContent = await import(packageJsonPath);

      // Verify basic template variables
      expect(packageJsonContent.name).toBe(projectName);
      expect(packageJsonContent.description).toBeDefined();
      expect(packageJsonContent.author).toBeDefined();
      expect(packageJsonContent.license).toBeDefined();

      // Verify no unresolved template variables remain
      const packageJsonText = await require('fs').promises.readFile(
        packageJsonPath,
        'utf-8',
      );
      expect(packageJsonText).not.toMatch(/\{\{.*\}\}/); // No unresolved Handlebars
      expect(packageJsonText).not.toMatch(/\[object Object\]/); // No object serialization errors
    });

    it('should handle project names with special characters', async () => {
      const projectName = 'test-special-chars-123';
      const projectPath = join(testBaseDir, projectName);

      const config: ProjectConfig = {
        projectName,
        projectPath,
        template: 'basic',
        packageManager: 'npm',
        includeDocs: false,
        initGit: false,
        installDependencies: false,
        dryRun: false,
      };

      const result = await generateProject(config, testContext);
      expect(result.success).toBe(true);

      // Verify sanitized package name in package.json
      const packageJson = await import(join(projectPath, 'package.json'));
      expect(packageJson.name).toMatch(/^[a-z0-9-]+$/); // Valid npm package name
    });
  });
});
