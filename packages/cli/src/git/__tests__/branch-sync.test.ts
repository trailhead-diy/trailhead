import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  checkBranchSync,
  getCurrentBranch,
  needsSync,
  formatSyncStatus,
} from '../branch-sync.js';
import { executeGitCommandSimple } from '../git-command.js';
import type { BranchSyncStatus } from '../types.js';

// Mock the git command execution
vi.mock('../git-command.js');

const mockExecuteGitCommandSimple = vi.mocked(executeGitCommandSimple);

describe('branch-sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentBranch', () => {
    it('should return current branch name', async () => {
      mockExecuteGitCommandSimple.mockResolvedValueOnce({
        isOk: true,
        value: 'feature-branch',
        isErr: false,
        error: undefined as never,
      });

      const result = await getCurrentBranch();

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toBe('feature-branch');
      }
      expect(mockExecuteGitCommandSimple).toHaveBeenCalledWith(
        ['rev-parse', '--abbrev-ref', 'HEAD'],
        {},
      );
    });

    it('should handle git command failure', async () => {
      mockExecuteGitCommandSimple.mockResolvedValueOnce({
        isOk: false,
        isErr: true,
        error: 'Not a git repository',
        value: undefined as never,
      });

      const result = await getCurrentBranch();

      expect(result.isErr).toBe(true);
      if (result.isErr) {
        expect(result.error).toBe('Not a git repository');
      }
    });
  });

  describe('checkBranchSync', () => {
    it('should return up-to-date status when branches are synced', async () => {
      // Mock git environment validation
      mockExecuteGitCommandSimple
        .mockResolvedValueOnce({
          isOk: true,
          value: 'git version 2.34.1',
          isErr: false,
          error: undefined as never,
        })
        .mockResolvedValueOnce({
          isOk: true,
          value: '.git',
          isErr: false,
          error: undefined as never,
        })
        // Mock getCurrentBranch
        .mockResolvedValueOnce({
          isOk: true,
          value: 'main',
          isErr: false,
          error: undefined as never,
        })
        // Mock remoteBranchExists
        .mockResolvedValueOnce({
          isOk: true,
          value: 'origin/main',
          isErr: false,
          error: undefined as never,
        })
        // Mock ahead count (origin/main..main)
        .mockResolvedValueOnce({
          isOk: true,
          value: '0',
          isErr: false,
          error: undefined as never,
        })
        // Mock behind count (main..origin/main)
        .mockResolvedValueOnce({
          isOk: true,
          value: '0',
          isErr: false,
          error: undefined as never,
        })
        // Mock isAncestor check
        .mockResolvedValueOnce({
          isOk: true,
          value: 'abc123',
          isErr: false,
          error: undefined as never,
        });

      const result = await checkBranchSync();

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        const status = result.value;
        expect(status.currentBranch).toBe('main');
        expect(status.remoteBranch).toBe('origin/main');
        expect(status.ahead).toBe(0);
        expect(status.behind).toBe(0);
        expect(status.isUpToDate).toBe(true);
      }
    });

    it('should return behind status when local branch is behind', async () => {
      // Mock git environment validation
      mockExecuteGitCommandSimple
        .mockResolvedValueOnce({
          isOk: true,
          value: 'git version 2.34.1',
          isErr: false,
          error: undefined as never,
        })
        .mockResolvedValueOnce({
          isOk: true,
          value: '.git',
          isErr: false,
          error: undefined as never,
        })
        // Mock getCurrentBranch
        .mockResolvedValueOnce({
          isOk: true,
          value: 'feature',
          isErr: false,
          error: undefined as never,
        })
        // Mock remoteBranchExists
        .mockResolvedValueOnce({
          isOk: true,
          value: 'origin/main',
          isErr: false,
          error: undefined as never,
        })
        // Mock ahead count (origin/main..feature)
        .mockResolvedValueOnce({
          isOk: true,
          value: '2',
          isErr: false,
          error: undefined as never,
        })
        // Mock behind count (feature..origin/main)
        .mockResolvedValueOnce({
          isOk: true,
          value: '3',
          isErr: false,
          error: undefined as never,
        })
        // Mock isAncestor check
        .mockResolvedValueOnce({
          isOk: true,
          value: 'abc123',
          isErr: false,
          error: undefined as never,
        });

      const result = await checkBranchSync();

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        const status = result.value;
        expect(status.ahead).toBe(2);
        expect(status.behind).toBe(3);
        expect(status.isUpToDate).toBe(false);
        expect(status.canFastForward).toBe(true);
      }
    });
  });

  describe('needsSync', () => {
    it('should return true when branch is behind', async () => {
      // Mock the checkBranchSync call
      mockExecuteGitCommandSimple
        .mockResolvedValueOnce({
          isOk: true,
          value: 'git version 2.34.1',
          isErr: false,
          error: undefined as never,
        })
        .mockResolvedValueOnce({
          isOk: true,
          value: '.git',
          isErr: false,
          error: undefined as never,
        })
        .mockResolvedValueOnce({
          isOk: true,
          value: 'feature',
          isErr: false,
          error: undefined as never,
        })
        .mockResolvedValueOnce({
          isOk: true,
          value: 'origin/main',
          isErr: false,
          error: undefined as never,
        })
        .mockResolvedValueOnce({
          isOk: true,
          value: '0',
          isErr: false,
          error: undefined as never,
        })
        .mockResolvedValueOnce({
          isOk: true,
          value: '5',
          isErr: false,
          error: undefined as never,
        })
        .mockResolvedValueOnce({
          isOk: true,
          value: 'abc123',
          isErr: false,
          error: undefined as never,
        });

      const result = await needsSync();

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toBe(true);
      }
    });

    it('should return false when branch is up to date', async () => {
      // Mock the checkBranchSync call
      mockExecuteGitCommandSimple
        .mockResolvedValueOnce({
          isOk: true,
          value: 'git version 2.34.1',
          isErr: false,
          error: undefined as never,
        })
        .mockResolvedValueOnce({
          isOk: true,
          value: '.git',
          isErr: false,
          error: undefined as never,
        })
        .mockResolvedValueOnce({
          isOk: true,
          value: 'main',
          isErr: false,
          error: undefined as never,
        })
        .mockResolvedValueOnce({
          isOk: true,
          value: 'origin/main',
          isErr: false,
          error: undefined as never,
        })
        .mockResolvedValueOnce({
          isOk: true,
          value: '0',
          isErr: false,
          error: undefined as never,
        })
        .mockResolvedValueOnce({
          isOk: true,
          value: '0',
          isErr: false,
          error: undefined as never,
        })
        .mockResolvedValueOnce({
          isOk: true,
          value: 'abc123',
          isErr: false,
          error: undefined as never,
        });

      const result = await needsSync();

      expect(result.isOk).toBe(true);
      if (result.isOk) {
        expect(result.value).toBe(false);
      }
    });
  });

  describe('formatSyncStatus', () => {
    it('should format up-to-date status', () => {
      const status: BranchSyncStatus = {
        currentBranch: 'main',
        remoteBranch: 'origin/main',
        ahead: 0,
        behind: 0,
        isUpToDate: true,
        canFastForward: false,
      };

      const formatted = formatSyncStatus(status);
      expect(formatted).toBe("Branch 'main' is up to date with 'origin/main'");
    });

    it('should format ahead status', () => {
      const status: BranchSyncStatus = {
        currentBranch: 'feature',
        remoteBranch: 'origin/main',
        ahead: 3,
        behind: 0,
        isUpToDate: false,
        canFastForward: false,
      };

      const formatted = formatSyncStatus(status);
      expect(formatted).toBe(
        "Branch 'feature' is 3 commits ahead compared to 'origin/main'",
      );
    });

    it('should format behind status with fast-forward suggestion', () => {
      const status: BranchSyncStatus = {
        currentBranch: 'feature',
        remoteBranch: 'origin/main',
        ahead: 0,
        behind: 2,
        isUpToDate: false,
        canFastForward: true,
      };

      const formatted = formatSyncStatus(status);
      expect(formatted).toContain('2 commits behind');
      expect(formatted).toContain(
        'can fast-forward with: git pull --rebase origin main',
      );
    });

    it('should format diverged status', () => {
      const status: BranchSyncStatus = {
        currentBranch: 'feature',
        remoteBranch: 'origin/main',
        ahead: 2,
        behind: 3,
        isUpToDate: false,
        canFastForward: false,
      };

      const formatted = formatSyncStatus(status);
      expect(formatted).toContain('2 commits ahead, 3 commits behind');
      expect(formatted).toContain('merge required');
    });
  });
});
