import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';
import { rmSync, existsSync } from 'fs';
import { generateProject } from '../lib/generator.js';
import { createLogger } from '../lib/logger.js';
import type { ProjectConfig } from '../lib/types.js';

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
    const config: ProjectConfig = {
      projectName: 'test-cli',
      projectPath: join(testDir, 'test-cli'),
      template: 'basic',
      packageManager: 'pnpm',
      includeDocs: false,
      initGit: false, // Skip git for test
      installDependencies: false, // Skip install for test
      force: false,
      dryRun: true, // Use dry run for test
      verbose: false,
    };

    const result = await generateProject(config, { logger, verbose: false });

    expect(result.isOk()).toBe(true);
  });

  it('should generate an advanced project successfully', async () => {
    const config: ProjectConfig = {
      projectName: 'advanced-cli',
      projectPath: join(testDir, 'advanced-cli'),
      template: 'advanced',
      packageManager: 'npm',
      includeDocs: true,
      initGit: false, // Skip git for test
      installDependencies: false, // Skip install for test
      force: false,
      dryRun: true, // Use dry run for test
      verbose: false,
    };

    const result = await generateProject(config, { logger, verbose: false });

    expect(result.isOk()).toBe(true);
  });

  it('should validate project configuration', async () => {
    const config: ProjectConfig = {
      projectName: '', // Invalid empty name
      projectPath: '',
      template: 'basic',
      packageManager: 'pnpm',
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
