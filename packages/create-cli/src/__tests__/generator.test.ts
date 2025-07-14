import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';
import { rmSync, existsSync } from 'fs';
import { generateProject } from '../lib/generator.js';
import { createLogger } from '../lib/logger.js';
import type { ModernProjectConfig } from '../lib/interactive-prompts.js';

describe('Generator Integration', () => {
  let testDir: string;
  let logger: any;

  beforeEach(() => {
    testDir = join(tmpdir(), `create-trailhead-cli-test-${Date.now()}`);
    logger = createLogger();
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should generate a basic project successfully', async () => {
    const config: ModernProjectConfig = {
      projectName: 'test-cli',
      projectPath: join(testDir, 'test-cli'),
      description: 'A test CLI application',
      template: 'basic',
      projectType: 'standalone-cli',
      packageManager: 'pnpm',
      author: {
        name: 'Test Author',
        email: 'test@example.com',
      },
      license: 'MIT',
      features: {
        core: true,
        testing: true,
      },
      nodeVersion: '18',
      typescript: true,
      ide: 'vscode',
      includeDocs: false,
      initGit: false, // Skip git for test
      installDependencies: false, // Skip install for test
      force: false,
      dryRun: true, // Use dry run for test
      verbose: false,
    };

    const result = await generateProject(config, { logger, verbose: false });

    if (result.isErr()) {
      console.error('Generator error:', result.error);
    }
    expect(result.isOk()).toBe(true);
  });

  it('should generate an advanced project successfully', async () => {
    const config: ModernProjectConfig = {
      projectName: 'advanced-cli',
      projectPath: join(testDir, 'advanced-cli'),
      description: 'An advanced test CLI application',
      template: 'advanced',
      projectType: 'standalone-cli',
      packageManager: 'npm',
      author: {
        name: 'Test Author',
        email: 'test@example.com',
      },
      license: 'MIT',
      features: {
        core: true,
        config: true,
        validation: true,
        testing: true,
        docs: true,
      },
      nodeVersion: '18',
      typescript: true,
      ide: 'vscode',
      includeDocs: true,
      initGit: false, // Skip git for test
      installDependencies: false, // Skip install for test
      force: false,
      dryRun: true, // Use dry run for test
      verbose: false,
    };

    const result = await generateProject(config, { logger, verbose: false });

    if (result.isErr()) {
      console.error('Generator error:', result.error);
    }
    expect(result.isOk()).toBe(true);
  });

  it('should validate project configuration', async () => {
    const config: ModernProjectConfig = {
      projectName: '', // Invalid empty name
      projectPath: '',
      description: 'Test description',
      template: 'basic',
      projectType: 'standalone-cli',
      packageManager: 'pnpm',
      author: {
        name: 'Test Author',
        email: 'test@example.com',
      },
      license: 'MIT',
      features: {
        core: true,
      },
      nodeVersion: '18',
      typescript: true,
      ide: 'vscode',
      includeDocs: false,
      initGit: false,
      installDependencies: false,
      force: false,
      dryRun: true,
      verbose: false,
    };

    const result = await generateProject(config, { logger, verbose: false });

    expect(result.isErr()).toBe(true);
  });
});
