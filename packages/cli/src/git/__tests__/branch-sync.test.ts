import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkBranchSync, getCurrentBranch, needsSync, formatSyncStatus } from '../branch-sync.js';
import { executeGitCommandSimple, validateGitEnvironment } from '../git-command.js';
import type { BranchSyncStatus } from '../types.js';
import { createError } from '../../core/index.js';

// Mock the git command execution
vi.mock('../git-command.js');

const mockExecuteGitCommandSimple = vi.mocked(executeGitCommandSimple);
const mockValidateGitEnvironment = vi.mocked(validateGitEnvironment);

describe('branch-sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentBranch', () => {
    it('should return current branch name', async () => {
      mockExecuteGitCommandSimple.mockResolvedValueOnce({
        success: true,
        value: 'feature-branch',
      });

      const result = await getCurrentBranch();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe('feature-branch');
      }
      expect(mockExecuteGitCommandSimple).toHaveBeenCalledWith(
        ['rev-parse', '--abbrev-ref', 'HEAD'],
        {}
      );
    });

    it('should handle git command failure', async () => {
      mockExecuteGitCommandSimple.mockResolvedValueOnce({
        success: false,
        error: createError('GIT_ERROR', 'Not a git repository'),
      });

      const result = await getCurrentBranch();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Not a git repository');
      }
    });
  });

  describe('checkBranchSync', () => {
    it('should return up-to-date status when branches are synced', async () => {
      // Mock git environment validation
      mockValidateGitEnvironment.mockResolvedValueOnce({
        success: true,
        value: true,
      });

      mockExecuteGitCommandSimple
        // Mock getCurrentBranch
        .mockResolvedValueOnce({
          success: true,
          value: 'main',
        })
        // Mock remoteBranchExists
        .mockResolvedValueOnce({
          success: true,
          value: 'origin/main',
        })
        // Mock ahead count (origin/main..main)
        .mockResolvedValueOnce({
          success: true,
          value: '0',
        })
        // Mock behind count (main..origin/main)
        .mockResolvedValueOnce({
          success: true,
          value: '0',
        })
        // Mock isAncestor check
        .mockResolvedValueOnce({
          success: true,
          value: 'merge-base-sha',
        });

      const result = await checkBranchSync();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.currentBranch).toBe('main');
        expect(result.value.remoteBranch).toBe('origin/main');
        expect(result.value.ahead).toBe(0);
        expect(result.value.behind).toBe(0);
        expect(result.value.isUpToDate).toBe(true);
        expect(result.value.canFastForward).toBe(false);
      }
    });

    it('should return behind status when local branch is behind', async () => {
      // Mock git environment validation
      mockValidateGitEnvironment.mockResolvedValueOnce({
        success: true,
        value: true,
      });

      mockExecuteGitCommandSimple
        // Mock getCurrentBranch
        .mockResolvedValueOnce({
          success: true,
          value: 'main',
        })
        // Mock remoteBranchExists
        .mockResolvedValueOnce({
          success: true,
          value: 'origin/main',
        })
        // Mock ahead count (origin/main..main)
        .mockResolvedValueOnce({
          success: true,
          value: '0',
        })
        // Mock behind count (main..origin/main)
        .mockResolvedValueOnce({
          success: true,
          value: '2',
        })
        // Mock isAncestor check (main is ancestor of origin/main)
        .mockResolvedValueOnce({
          success: true,
          value: 'merge-base-sha',
        });

      const result = await checkBranchSync();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.currentBranch).toBe('main');
        expect(result.value.ahead).toBe(0);
        expect(result.value.behind).toBe(2);
        expect(result.value.isUpToDate).toBe(false);
        expect(result.value.canFastForward).toBe(true);
      }
    });
  });

  describe('needsSync', () => {
    it('should return true when branch is behind', async () => {
      // Mock git environment validation
      mockValidateGitEnvironment.mockResolvedValueOnce({
        success: true,
        value: true,
      });

      mockExecuteGitCommandSimple
        // Mock getCurrentBranch
        .mockResolvedValueOnce({
          success: true,
          value: 'main',
        })
        // Mock remoteBranchExists
        .mockResolvedValueOnce({
          success: true,
          value: 'origin/main',
        })
        // Mock ahead count
        .mockResolvedValueOnce({
          success: true,
          value: '0',
        })
        // Mock behind count
        .mockResolvedValueOnce({
          success: true,
          value: '2',
        })
        // Mock isAncestor check
        .mockResolvedValueOnce({
          success: true,
          value: 'merge-base-sha',
        });

      const result = await needsSync();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(true);
      }
    });

    it('should return false when branch is up to date', async () => {
      // Mock git environment validation
      mockValidateGitEnvironment.mockResolvedValueOnce({
        success: true,
        value: true,
      });

      mockExecuteGitCommandSimple
        // Mock getCurrentBranch
        .mockResolvedValueOnce({
          success: true,
          value: 'main',
        })
        // Mock remoteBranchExists
        .mockResolvedValueOnce({
          success: true,
          value: 'origin/main',
        })
        // Mock ahead count
        .mockResolvedValueOnce({
          success: true,
          value: '0',
        })
        // Mock behind count
        .mockResolvedValueOnce({
          success: true,
          value: '0',
        })
        // Mock isAncestor check
        .mockResolvedValueOnce({
          success: true,
          value: 'merge-base-sha',
        });

      const result = await needsSync();

      expect(result.success).toBe(true);
      if (result.success) {
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

      const result = formatSyncStatus(status);

      expect(result).toBe("Branch 'main' is up to date with 'origin/main'");
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

      const result = formatSyncStatus(status);

      expect(result).toBe("Branch 'feature' is 3 commits ahead compared to 'origin/main'");
    });

    it('should format behind status with fast-forward suggestion', () => {
      const status: BranchSyncStatus = {
        currentBranch: 'main',
        remoteBranch: 'origin/main',
        ahead: 0,
        behind: 2,
        isUpToDate: false,
        canFastForward: true,
      };

      const result = formatSyncStatus(status);

      expect(result).toBe(
        "Branch 'main' is 2 commits behind compared to 'origin/main' (can fast-forward with: git pull --rebase origin main)"
      );
    });

    it('should format diverged status', () => {
      const status: BranchSyncStatus = {
        currentBranch: 'feature',
        remoteBranch: 'origin/main',
        ahead: 2,
        behind: 1,
        isUpToDate: false,
        canFastForward: false,
      };

      const result = formatSyncStatus(status);

      expect(result).toBe(
        "Branch 'feature' is 2 commits ahead, 1 commit behind compared to 'origin/main' (merge required)"
      );
    });
  });
});
