import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';
import { createGitOperations } from '../core/operations.js';
import { createGitStatusOperations } from './operations.js';

describe('Git Status Operations', () => {
  let tempDir: string;
  let gitOps: ReturnType<typeof createGitOperations>;
  let statusOps: ReturnType<typeof createGitStatusOperations>;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'git-status-test-'));
    gitOps = createGitOperations();
    statusOps = createGitStatusOperations();

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

  describe('getStatus', () => {
    it('should get status of clean repository', async () => {
      const repoResult = await gitOps.open(tempDir);
      expect(repoResult.isOk()).toBe(true);

      if (repoResult.isOk()) {
        const repo = repoResult.value;
        const result = await statusOps.getStatus(repo);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const status = result.value;
          expect(status.clean).toBe(true);
          expect(status.staged).toHaveLength(0);
          expect(status.modified).toHaveLength(0);
          expect(status.untracked).toHaveLength(0);
        }
      }
    });

    it('should detect untracked files', async () => {
      const repoResult = await gitOps.open(tempDir);
      expect(repoResult.isOk()).toBe(true);

      if (repoResult.isOk()) {
        const repo = repoResult.value;

        // Create untracked file
        await writeFile(join(tempDir, 'untracked.txt'), 'content');

        const result = await statusOps.getStatus(repo);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const status = result.value;
          expect(status.clean).toBe(false);
          expect(status.untracked).toContain('untracked.txt');
        }
      }
    });

    it('should detect staged files', async () => {
      const repoResult = await gitOps.open(tempDir);
      expect(repoResult.isOk()).toBe(true);

      if (repoResult.isOk()) {
        const repo = repoResult.value;

        // Create and stage file
        await writeFile(join(tempDir, 'staged.txt'), 'content');
        execSync('git add staged.txt', { cwd: tempDir });

        const result = await statusOps.getStatus(repo);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const status = result.value;
          expect(status.clean).toBe(false);
          expect(status.staged.some(f => f.path === 'staged.txt')).toBe(true);
        }
      }
    });
  });

  describe('isClean', () => {
    it('should return true for clean repository', async () => {
      const repoResult = await gitOps.open(tempDir);
      expect(repoResult.isOk()).toBe(true);

      if (repoResult.isOk()) {
        const repo = repoResult.value;
        const result = await statusOps.isClean(repo);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toBe(true);
        }
      }
    });

    it('should return false for dirty repository', async () => {
      const repoResult = await gitOps.open(tempDir);
      expect(repoResult.isOk()).toBe(true);

      if (repoResult.isOk()) {
        const repo = repoResult.value;

        // Create untracked file
        await writeFile(join(tempDir, 'dirty.txt'), 'content');

        const result = await statusOps.isClean(repo);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toBe(false);
        }
      }
    });
  });

  describe('hasChanges', () => {
    it('should return false for clean repository', async () => {
      const repoResult = await gitOps.open(tempDir);
      expect(repoResult.isOk()).toBe(true);

      if (repoResult.isOk()) {
        const repo = repoResult.value;
        const result = await statusOps.hasChanges(repo);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toBe(false);
        }
      }
    });

    it('should return true for repository with changes', async () => {
      const repoResult = await gitOps.open(tempDir);
      expect(repoResult.isOk()).toBe(true);

      if (repoResult.isOk()) {
        const repo = repoResult.value;

        // Create untracked file
        await writeFile(join(tempDir, 'changes.txt'), 'content');

        const result = await statusOps.hasChanges(repo);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toBe(true);
        }
      }
    });
  });

  describe('getUntrackedFiles', () => {
    it('should return empty array for clean repository', async () => {
      const repoResult = await gitOps.open(tempDir);
      expect(repoResult.isOk()).toBe(true);

      if (repoResult.isOk()) {
        const repo = repoResult.value;
        const result = await statusOps.getUntrackedFiles(repo);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toHaveLength(0);
        }
      }
    });

    it('should return untracked files', async () => {
      const repoResult = await gitOps.open(tempDir);
      expect(repoResult.isOk()).toBe(true);

      if (repoResult.isOk()) {
        const repo = repoResult.value;

        // Create untracked files
        await writeFile(join(tempDir, 'file1.txt'), 'content');
        await writeFile(join(tempDir, 'file2.txt'), 'content');

        const result = await statusOps.getUntrackedFiles(repo);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toContain('file1.txt');
          expect(result.value).toContain('file2.txt');
        }
      }
    });
  });

  describe('getStagedFiles', () => {
    it('should return empty array for clean repository', async () => {
      const repoResult = await gitOps.open(tempDir);
      expect(repoResult.isOk()).toBe(true);

      if (repoResult.isOk()) {
        const repo = repoResult.value;
        const result = await statusOps.getStagedFiles(repo);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          expect(result.value).toHaveLength(0);
        }
      }
    });

    it('should return staged files', async () => {
      const repoResult = await gitOps.open(tempDir);
      expect(repoResult.isOk()).toBe(true);

      if (repoResult.isOk()) {
        const repo = repoResult.value;

        // Create and stage files
        await writeFile(join(tempDir, 'staged1.txt'), 'content');
        await writeFile(join(tempDir, 'staged2.txt'), 'content');
        execSync('git add staged1.txt staged2.txt', { cwd: tempDir });

        const result = await statusOps.getStagedFiles(repo);

        expect(result.isOk()).toBe(true);
        if (result.isOk()) {
          const stagedFiles = result.value;
          expect(stagedFiles.some(f => f.path === 'staged1.txt')).toBe(true);
          expect(stagedFiles.some(f => f.path === 'staged2.txt')).toBe(true);
        }
      }
    });
  });
});
