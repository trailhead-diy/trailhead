import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';
import { createGitOperations } from '../core/operations.js';
import { createGitCommandOperations } from './operations.js';

describe('Git Command Operations', () => {
  let tempDir: string;
  let gitOps: ReturnType<typeof createGitOperations>;
  let commandOps: ReturnType<typeof createGitCommandOperations>;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'git-command-test-'));
    gitOps = createGitOperations();
    commandOps = createGitCommandOperations();

    // Initialize repository
    await gitOps.init(tempDir);

    // Configure git user for this test
    execSync('git config user.name "Test User"', { cwd: tempDir });
    execSync('git config user.email "test@example.com"', { cwd: tempDir });
  });

  afterEach(async () => {
    try {
      await rm(tempDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('add', () => {
    it('should add files to staging area', async () => {
      const repoResult = await gitOps.open(tempDir);
      expect(repoResult.isOk()).toBe(true);

      if (repoResult.isOk()) {
        const repo = repoResult.value;

        // Create files
        await writeFile(join(tempDir, 'file1.txt'), 'content1');
        await writeFile(join(tempDir, 'file2.txt'), 'content2');

        const result = await commandOps.add(repo, ['file1.txt', 'file2.txt']);

        expect(result.isOk()).toBe(true);

        // Verify files are staged
        const statusOutput = execSync('git status --porcelain', {
          cwd: tempDir,
          encoding: 'utf-8',
        });
        expect(statusOutput).toContain('A  file1.txt');
        expect(statusOutput).toContain('A  file2.txt');
      }
    });

    it('should handle non-existent files', async () => {
      const repoResult = await gitOps.open(tempDir);
      expect(repoResult.isOk()).toBe(true);

      if (repoResult.isOk()) {
        const repo = repoResult.value;

        const result = await commandOps.add(repo, ['non-existent.txt']);

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.code).toBe('ADD_FAILED');
        }
      }
    });
  });

  describe('commit', () => {
    it('should create a commit', async () => {
      const repoResult = await gitOps.open(tempDir);
      expect(repoResult.isOk()).toBe(true);

      if (repoResult.isOk()) {
        const repo = repoResult.value;

        // Create and stage file
        await writeFile(join(tempDir, 'commit-test.txt'), 'content');
        await commandOps.add(repo, ['commit-test.txt']);

        const result = await commandOps.commit(repo, 'Initial commit');

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toMatch(/^[a-f0-9]+$/);
        }
      }
    });

    it('should fail commit without staged changes', async () => {
      const repoResult = await gitOps.open(tempDir);
      expect(repoResult.isOk()).toBe(true);

      if (repoResult.isOk()) {
        const repo = repoResult.value;

        const result = await commandOps.commit(repo, 'Empty commit');

        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error.code).toBe('COMMIT_FAILED');
        }
      }
    });

    it('should commit with options', async () => {
      const repoResult = await gitOps.open(tempDir);
      expect(repoResult.isOk()).toBe(true);

      if (repoResult.isOk()) {
        const repo = repoResult.value;

        // Create and stage file
        await writeFile(join(tempDir, 'commit-options.txt'), 'content');
        await commandOps.add(repo, ['commit-options.txt']);

        const result = await commandOps.commit(repo, 'Commit with author', {
          author: 'Custom Author <custom@example.com>',
          signoff: true,
        });

        expect(result.isOk()).toBe(true);
      }
    });
  });

  describe('branch', () => {
    it('should list branches', async () => {
      const repoResult = await gitOps.open(tempDir);
      expect(repoResult.isOk()).toBe(true);

      if (repoResult.isOk()) {
        const repo = repoResult.value;

        // Create initial commit
        await writeFile(join(tempDir, 'init.txt'), 'content');
        await commandOps.add(repo, ['init.txt']);
        await commandOps.commit(repo, 'Initial commit');

        const result = await commandOps.branch(repo);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value.length).toBeGreaterThan(0);
        }
      }
    });

    it('should create a new branch', async () => {
      const repoResult = await gitOps.open(tempDir);
      expect(repoResult.isOk()).toBe(true);

      if (repoResult.isOk()) {
        const repo = repoResult.value;

        // Create initial commit
        await writeFile(join(tempDir, 'init.txt'), 'content');
        await commandOps.add(repo, ['init.txt']);
        await commandOps.commit(repo, 'Initial commit');

        const result = await commandOps.branch(repo, 'feature-branch', { create: true });

        expect(result.isOk()).toBe(true);
      }
    });
  });

  describe('checkout', () => {
    it('should checkout existing branch', async () => {
      const repoResult = await gitOps.open(tempDir);
      expect(repoResult.isOk()).toBe(true);

      if (repoResult.isOk()) {
        const repo = repoResult.value;

        // Create initial commit and branch
        await writeFile(join(tempDir, 'init.txt'), 'content');
        await commandOps.add(repo, ['init.txt']);
        await commandOps.commit(repo, 'Initial commit');
        await commandOps.branch(repo, 'test-branch', { create: true });

        const result = await commandOps.checkout(repo, 'test-branch');

        expect(result.isOk()).toBe(true);
      }
    });

    it('should create and checkout new branch', async () => {
      const repoResult = await gitOps.open(tempDir);
      expect(repoResult.isOk()).toBe(true);

      if (repoResult.isOk()) {
        const repo = repoResult.value;

        // Create initial commit
        await writeFile(join(tempDir, 'init.txt'), 'content');
        await commandOps.add(repo, ['init.txt']);
        await commandOps.commit(repo, 'Initial commit');

        const result = await commandOps.checkout(repo, 'new-feature', { createBranch: true });

        expect(result.isOk()).toBe(true);
      }
    });
  });

  describe('reset', () => {
    it('should reset staged changes', async () => {
      const repoResult = await gitOps.open(tempDir);
      expect(repoResult.isOk()).toBe(true);

      if (repoResult.isOk()) {
        const repo = repoResult.value;

        // Create and stage file
        await writeFile(join(tempDir, 'reset-test.txt'), 'content');
        await commandOps.add(repo, ['reset-test.txt']);

        const result = await commandOps.reset(repo);

        expect(result.isOk()).toBe(true);

        // Verify file is unstaged
        const statusOutput = execSync('git status --porcelain', {
          cwd: tempDir,
          encoding: 'utf-8',
        });
        expect(statusOutput).toContain('?? reset-test.txt');
      }
    });

    it('should reset with specific mode', async () => {
      const repoResult = await gitOps.open(tempDir);
      expect(repoResult.isOk()).toBe(true);

      if (repoResult.isOk()) {
        const repo = repoResult.value;

        // Create initial commit
        await writeFile(join(tempDir, 'init.txt'), 'content');
        await commandOps.add(repo, ['init.txt']);
        await commandOps.commit(repo, 'Initial commit');

        // Create and stage new file
        await writeFile(join(tempDir, 'reset-mode.txt'), 'content');
        await commandOps.add(repo, ['reset-mode.txt']);

        const result = await commandOps.reset(repo, 'HEAD', { mode: 'hard' });

        expect(result.isOk()).toBe(true);
      }
    });
  });

  describe('tag', () => {
    it('should list tags', async () => {
      const repoResult = await gitOps.open(tempDir);
      expect(repoResult.isOk()).toBe(true);

      if (repoResult.isOk()) {
        const repo = repoResult.value;

        const result = await commandOps.tag(repo);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(Array.isArray(result.value)).toBe(true);
        }
      }
    });

    it('should create a tag', async () => {
      const repoResult = await gitOps.open(tempDir);
      expect(repoResult.isOk()).toBe(true);

      if (repoResult.isOk()) {
        const repo = repoResult.value;

        // Create initial commit
        await writeFile(join(tempDir, 'init.txt'), 'content');
        await commandOps.add(repo, ['init.txt']);
        await commandOps.commit(repo, 'Initial commit');

        const result = await commandOps.tag(repo, 'v1.0.0', { create: true });

        expect(result.isOk()).toBe(true);
      }
    });
  });
});
