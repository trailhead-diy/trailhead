import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { rmSync, existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { generateProject } from '../lib/generator.js';
import {
  createTestContext,
  mockFileSystem,
} from '@esteban-url/trailhead-cli/testing';
import {
  validateTemplateStructure,
  validateAllTemplates,
  formatValidationReport,
} from '../lib/template-validator.js';
import type { ProjectConfig, GeneratorContext } from '../lib/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Generator Structure Tests', () => {
  let tempDir: string;
  let testContext: GeneratorContext;

  beforeEach(() => {
    // Create a unique temp directory for each test
    tempDir = join(__dirname, '..', '..', 'temp-test-' + Date.now());

    testContext = createTestContext({
      verbose: false,
      templateConfig: undefined,
    });
  });

  afterEach(() => {
    // Clean up temp directory
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Template Structure Validation', () => {
    it('should validate that all commands have corresponding tests', async () => {
      const results = await validateAllTemplates();

      expect(results).toHaveLength(3); // basic, advanced, enterprise

      results.forEach((result) => {
        expect(result.statistics.coverage).toBe(100);
        expect(result.missing).toHaveLength(0);
        expect(result.valid).toBe(true);
      });
    });

    it('should validate basic template structure', async () => {
      const result = await validateTemplateStructure('basic');

      expect(result.valid).toBe(true);
      expect(result.variant).toBe('basic');
      expect(result.statistics.totalCommands).toBe(2); // build, dev
      expect(result.statistics.testedCommands).toBe(2);
      expect(result.statistics.coverage).toBe(100);
      expect(result.statistics.colocatedTests).toBe(2); // All tests should be colocated
      expect(result.statistics.integrationTests).toBeGreaterThan(0);
    });

    it('should validate advanced template structure', async () => {
      const result = await validateTemplateStructure('advanced');

      expect(result.valid).toBe(true);
      expect(result.variant).toBe('advanced');
      expect(result.statistics.totalCommands).toBe(3); // config, init, validate
      expect(result.statistics.testedCommands).toBe(3);
      expect(result.statistics.coverage).toBe(100);
      expect(result.statistics.colocatedTests).toBe(3);
      expect(result.statistics.integrationTests).toBeGreaterThan(0);
    });

    it('should validate enterprise template structure', async () => {
      const result = await validateTemplateStructure('enterprise');

      expect(result.valid).toBe(true);
      expect(result.variant).toBe('enterprise');
      expect(result.statistics.totalCommands).toBe(2); // monitor, security
      expect(result.statistics.testedCommands).toBe(2);
      expect(result.statistics.coverage).toBe(100);
      expect(result.statistics.colocatedTests).toBe(2);
      expect(result.statistics.integrationTests).toBeGreaterThan(0);
    });

    it('should generate a comprehensive validation report', async () => {
      const results = await validateAllTemplates();
      const report = formatValidationReport(results);

      expect(report).toContain('Template Structure Validation Report');
      expect(report).toContain('✅ VALID');
      expect(report).toContain('**Test Coverage**: 100%');
      expect(report).toContain('BASIC Template');
      expect(report).toContain('ADVANCED Template');
      expect(report).toContain('ENTERPRISE Template');
      expect(report).toContain('Summary Statistics');
    });
  });

  describe('Generated Project Structure', () => {
    it('should generate basic template with correct file structure', async () => {
      const config: ProjectConfig = {
        projectName: 'test-basic-cli',
        projectPath: tempDir,
        template: 'basic',
        packageManager: 'pnpm',
        includeDocs: true,
        initGit: false,
        installDependencies: false,
        dryRun: false,
      };

      const result = await generateProject(config, testContext);
      expect(result.success).toBe(true);

      // Check main structure
      expect(existsSync(join(tempDir, 'package.json'))).toBe(true);
      expect(existsSync(join(tempDir, 'src/index.ts'))).toBe(true);
      expect(existsSync(join(tempDir, 'bin/cli.js'))).toBe(true);
      expect(existsSync(join(tempDir, 'vitest.config.ts'))).toBe(true);

      // Check command files
      expect(existsSync(join(tempDir, 'src/commands/build.ts'))).toBe(true);
      expect(existsSync(join(tempDir, 'src/commands/dev.ts'))).toBe(true);

      // Check colocated test structure
      expect(
        existsSync(join(tempDir, 'src/commands/__tests__/build.test.ts')),
      ).toBe(true);
      expect(
        existsSync(join(tempDir, 'src/commands/__tests__/dev.test.ts')),
      ).toBe(true);
      expect(
        existsSync(join(tempDir, 'src/__tests__/integration/cli.test.ts')),
      ).toBe(true);

      // Verify no old test structure
      expect(existsSync(join(tempDir, 'tests'))).toBe(false);
    });

    it('should generate advanced template with correct file structure', async () => {
      const config: ProjectConfig = {
        projectName: 'test-advanced-cli',
        projectPath: tempDir,
        template: 'advanced',
        packageManager: 'pnpm',
        includeDocs: true,
        initGit: false,
        installDependencies: false,
        dryRun: false,
      };

      const result = await generateProject(config, testContext);
      expect(result.success).toBe(true);

      // Check command files
      expect(existsSync(join(tempDir, 'src/commands/config.ts'))).toBe(true);
      expect(existsSync(join(tempDir, 'src/commands/init.ts'))).toBe(true);
      expect(existsSync(join(tempDir, 'src/commands/validate.ts'))).toBe(true);

      // Check colocated test structure
      expect(
        existsSync(join(tempDir, 'src/commands/__tests__/config.test.ts')),
      ).toBe(true);
      expect(
        existsSync(join(tempDir, 'src/commands/__tests__/init.test.ts')),
      ).toBe(true);
      expect(
        existsSync(join(tempDir, 'src/commands/__tests__/validate.test.ts')),
      ).toBe(true);
      expect(
        existsSync(join(tempDir, 'src/__tests__/integration/cli.test.ts')),
      ).toBe(true);

      // Check additional files
      expect(existsSync(join(tempDir, 'src/lib/performance.ts'))).toBe(true);
      expect(existsSync(join(tempDir, 'src/types/index.ts'))).toBe(true);
    });

    it('should generate enterprise template with correct file structure', async () => {
      const config: ProjectConfig = {
        projectName: 'test-enterprise-cli',
        projectPath: tempDir,
        template: 'enterprise',
        packageManager: 'pnpm',
        includeDocs: true,
        initGit: false,
        installDependencies: false,
        dryRun: false,
      };

      const result = await generateProject(config, testContext);
      expect(result.success).toBe(true);

      // Check command files
      expect(existsSync(join(tempDir, 'src/commands/monitor.ts'))).toBe(true);
      expect(existsSync(join(tempDir, 'src/commands/security.ts'))).toBe(true);

      // Check colocated test structure
      expect(
        existsSync(join(tempDir, 'src/commands/__tests__/monitor.test.ts')),
      ).toBe(true);
      expect(
        existsSync(join(tempDir, 'src/commands/__tests__/security.test.ts')),
      ).toBe(true);
      expect(
        existsSync(join(tempDir, 'src/__tests__/integration/cli.test.ts')),
      ).toBe(true);

      // Check monitoring setup
      expect(existsSync(join(tempDir, 'src/monitoring/setup.ts'))).toBe(true);
    });

    it('should generate vitest config that supports __tests__ directories', async () => {
      const config: ProjectConfig = {
        projectName: 'test-vitest-config',
        projectPath: tempDir,
        template: 'basic',
        packageManager: 'pnpm',
        includeDocs: false,
        initGit: false,
        installDependencies: false,
        dryRun: false,
      };

      const result = await generateProject(config, testContext);
      expect(result.success).toBe(true);

      const vitestConfigPath = join(tempDir, 'vitest.config.ts');
      expect(existsSync(vitestConfigPath)).toBe(true);

      const vitestConfig = readFileSync(vitestConfigPath, 'utf-8');

      // Check that it includes __tests__ patterns
      expect(vitestConfig).toContain('src/**/__tests__/**/*.test.ts');
      expect(vitestConfig).toContain('src/**/__tests__/**/*.spec.ts');

      // Check coverage exclusions
      expect(vitestConfig).toContain('src/**/__tests__/**/*.ts');
    });

    it('should process template files with correct metadata', async () => {
      const config: ProjectConfig = {
        projectName: 'test-template-processing',
        projectPath: tempDir,
        template: 'basic',
        packageManager: 'pnpm',
        includeDocs: true,
        initGit: false,
        installDependencies: false,
        dryRun: false,
      };

      const result = await generateProject(config, testContext);
      expect(result.success).toBe(true);

      // Check that .hbs extensions are removed
      expect(existsSync(join(tempDir, 'src/commands/build.ts.hbs'))).toBe(
        false,
      );
      expect(existsSync(join(tempDir, 'src/commands/build.ts'))).toBe(true);

      // Check that bin files are executable
      const binFile = join(tempDir, 'bin/cli.js');
      expect(existsSync(binFile)).toBe(true);
      const stats = statSync(binFile);
      expect(stats.mode & 0o111).toBeTruthy(); // Check executable bits

      // Check that template content is processed
      const packageJsonPath = join(tempDir, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      expect(packageJson.name).toBe('test-template-processing');
    });

    it('should handle nested __tests__ directories correctly', async () => {
      const config: ProjectConfig = {
        projectName: 'test-nested-tests',
        projectPath: tempDir,
        template: 'advanced',
        packageManager: 'pnpm',
        includeDocs: false,
        initGit: false,
        installDependencies: false,
        dryRun: false,
      };

      const result = await generateProject(config, testContext);
      expect(result.success).toBe(true);

      // Check that nested test directories are created correctly
      const commandTestsDir = join(tempDir, 'src/commands/__tests__');
      const integrationTestsDir = join(tempDir, 'src/__tests__/integration');

      expect(existsSync(commandTestsDir)).toBe(true);
      expect(existsSync(integrationTestsDir)).toBe(true);

      // Check that test files exist
      const commandTests = readdirSync(commandTestsDir);
      expect(commandTests).toContain('config.test.ts');
      expect(commandTests).toContain('init.test.ts');
      expect(commandTests).toContain('validate.test.ts');

      const integrationTests = readdirSync(integrationTestsDir);
      expect(integrationTests).toContain('cli.test.ts');
    });

    it('should maintain test file import paths correctly', async () => {
      const config: ProjectConfig = {
        projectName: 'test-import-paths',
        projectPath: tempDir,
        template: 'basic',
        packageManager: 'pnpm',
        includeDocs: false,
        initGit: false,
        installDependencies: false,
        dryRun: false,
      };

      const result = await generateProject(config, testContext);
      expect(result.success).toBe(true);

      // Check that test files have correct import paths
      const buildTestPath = join(
        tempDir,
        'src/commands/__tests__/build.test.ts',
      );
      const buildTestContent = readFileSync(buildTestPath, 'utf-8');

      // Should import from relative path to command
      expect(buildTestContent).toContain("from '../build.js'");

      // Should not contain old deep paths
      expect(buildTestContent).not.toContain(
        "from '../../src/commands/build.js'",
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle missing template directories gracefully', async () => {
      const config: ProjectConfig = {
        projectName: 'test-missing-template',
        projectPath: tempDir,
        template: 'nonexistent' as any,
        packageManager: 'pnpm',
        includeDocs: false,
        initGit: false,
        installDependencies: false,
        dryRun: false,
      };

      const result = await generateProject(config, testContext);
      expect(result.success).toBe(false);
      expect(result.error.message).toContain('Invalid template');
    });

    it('should validate dry run mode correctly', async () => {
      const config: ProjectConfig = {
        projectName: 'test-dry-run',
        projectPath: tempDir,
        template: 'basic',
        packageManager: 'pnpm',
        includeDocs: false,
        initGit: false,
        installDependencies: false,
        dryRun: true,
      };

      const result = await generateProject(config, testContext);
      expect(result.success).toBe(true);

      // No files should be created in dry run mode
      expect(existsSync(tempDir)).toBe(false);
    });
  });
});
