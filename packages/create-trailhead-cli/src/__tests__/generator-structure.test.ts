import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { join, dirname } from 'path';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';
import { rmSync, existsSync, readFileSync, statSync } from 'fs';
import { generateProject } from '../lib/generator.js';
import { createTestContext } from '@esteban-url/trailhead-cli/testing';

import type { ProjectConfig, GeneratorContext } from '../lib/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Generator Structure Tests', () => {
  let tempDir: string;
  let testContext: GeneratorContext;

  beforeEach(() => {
    // Create a unique temp directory for each test outside project directory
    tempDir = join(
      tmpdir(),
      'create-trailhead-cli-structure-test-' + Date.now(),
    );

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
      expect(result.error.message).toContain('Invalid enum value');
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
