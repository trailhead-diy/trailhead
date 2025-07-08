import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';
import { rmSync, existsSync } from 'fs';
import { createTestContext, mockFileSystem } from '@esteban-url/trailhead-cli/testing';
import { generateProject } from '../lib/generator.js';
import type { ProjectConfig } from '../lib/types.js';

describe('Generator Integration', () => {
  let testDir: string;
  let testContext: any;

  beforeEach(() => {
    testDir = join(tmpdir(), `create-trailhead-cli-test-${Date.now()}`);
    testContext = createTestContext({
      verbose: false,
      fs: mockFileSystem({}),
    });
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should generate basic project structure', async () => {
    const config: ProjectConfig = {
      projectName: 'test-cli',
      projectPath: testDir,
      template: 'basic',
      packageManager: 'pnpm',
      includeDocs: false,
      initGit: false,
      installDependencies: false,
      dryRun: true, // Use dry run to avoid actual file creation
    };

    const result = await generateProject(config, testContext);

    if (!result.success) {
      console.error('Generator failed:', result.error.message);
    }
    expect(result.success).toBe(true);
  });

  it('should handle template processing errors', async () => {
    const config: ProjectConfig = {
      projectName: 'test-cli',
      projectPath: '/invalid/path/that/does/not/exist',
      template: 'basic',
      packageManager: 'pnpm',
      includeDocs: false,
      initGit: false,
      installDependencies: false,
      dryRun: false,
    };

    const result = await generateProject(config, testContext);

    expect(result.success).toBe(false);
    expect(result.error.message).toContain('Failed to create project directory');
  });

  it('should support different template variants', async () => {
    const variants = ['basic', 'advanced'] as const;

    for (const variant of variants) {
      const config: ProjectConfig = {
        projectName: `test-cli-${variant}`,
        projectPath: join(testDir, variant),
        template: variant,
        packageManager: 'pnpm',
        includeDocs: false,
        initGit: false,
        installDependencies: false,
        dryRun: true,
      };

      const result = await generateProject(config, testContext);
      expect(result.success).toBe(true);
    }
  });

  it('should support different package managers', async () => {
    const packageManagers = ['npm', 'pnpm'] as const;

    for (const pm of packageManagers) {
      const config: ProjectConfig = {
        projectName: `test-cli-${pm}`,
        projectPath: join(testDir, pm),
        template: 'basic',
        packageManager: pm,
        includeDocs: false,
        initGit: false,
        installDependencies: false,
        dryRun: true,
      };

      const result = await generateProject(config, testContext);
      expect(result.success).toBe(true);
    }
  });

  it('should validate project configuration', async () => {
    const invalidConfig: ProjectConfig = {
      projectName: '',
      projectPath: '',
      template: 'basic',
      packageManager: 'pnpm',
      includeDocs: false,
      initGit: false,
      installDependencies: false,
      dryRun: true,
    };

    const result = await generateProject(invalidConfig, testContext);

    expect(result.success).toBe(false);
  });
});
