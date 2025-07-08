import { describe, it, expect, vi, beforeEach } from 'vitest';
import { spawn } from 'node:child_process';
import {
  executeGitCommand,
  executeGitCommandSimple,
  validateGitEnvironment,
} from '../git-command.js';

// Mock child_process
vi.mock('node:child_process');

const mockSpawn = vi.mocked(spawn);

describe('git-command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('executeGitCommand', () => {
    it('should execute git command successfully', async () => {
      const mockChild = {
        stdout: {
          on: vi.fn((event, callback) => {
            if (event === 'data') {
              callback(Buffer.from('test output\n'));
            }
          }),
        },
        stderr: {
          on: vi.fn(),
        },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            callback(0); // Exit code 0
          }
        }),
        kill: vi.fn(),
      };

      mockSpawn.mockReturnValue(mockChild as any);

      const result = await executeGitCommand(['status']);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.exitCode).toBe(0);
        expect(result.value.stdout).toBe('test output');
        expect(result.value.command).toBe('git status');
      }
      expect(mockSpawn).toHaveBeenCalledWith('git', ['status'], {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false,
      });
    });

    it('should handle git command failure', async () => {
      const mockChild = {
        stdout: {
          on: vi.fn(),
        },
        stderr: {
          on: vi.fn((event, callback) => {
            if (event === 'data') {
              callback(Buffer.from('fatal: not a git repository\n'));
            }
          }),
        },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            callback(128); // Non-zero exit code
          }
        }),
        kill: vi.fn(),
      };

      mockSpawn.mockReturnValue(mockChild as any);

      const result = await executeGitCommand(['status']);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.exitCode).toBe(128);
        expect(result.value.stderr).toBe('fatal: not a git repository');
      }
    });

    it('should handle spawn error', async () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'error') {
            callback(new Error('spawn git ENOENT'));
          }
        }),
        kill: vi.fn(),
      };

      mockSpawn.mockReturnValue(mockChild as any);

      const result = await executeGitCommand(['status']);

      expect(!result.success).toBe(true);
      if (!result.success) {
        expect(result.error.message).toContain('Failed to execute git command');
      }
    });

    it('should handle timeout', async () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn(), // Never calls close
        kill: vi.fn(),
      };

      mockSpawn.mockReturnValue(mockChild as any);

      // Use a very short timeout for testing
      const result = await executeGitCommand(['status'], { timeout: 1 });

      expect(!result.success).toBe(true);
      if (!result.success) {
        expect(result.error.message).toContain('timed out');
      }
      expect(mockChild.kill).toHaveBeenCalledWith('SIGTERM');
    });
  });

  describe('executeGitCommandSimple', () => {
    it('should return stdout on successful command', async () => {
      const mockChild = {
        stdout: {
          on: vi.fn((event, callback) => {
            if (event === 'data') {
              callback(Buffer.from('main\n'));
            }
          }),
        },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            callback(0);
          }
        }),
        kill: vi.fn(),
      };

      mockSpawn.mockReturnValue(mockChild as any);

      const result = await executeGitCommandSimple(['rev-parse', '--abbrev-ref', 'HEAD']);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe('main');
      }
    });

    it('should return error on non-zero exit code', async () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: {
          on: vi.fn((event, callback) => {
            if (event === 'data') {
              callback(Buffer.from('fatal: not a git repository\n'));
            }
          }),
        },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            callback(128);
          }
        }),
        kill: vi.fn(),
      };

      mockSpawn.mockReturnValue(mockChild as any);

      const result = await executeGitCommandSimple(['status']);

      expect(!result.success).toBe(true);
      if (!result.success) {
        expect(result.error.message).toContain('fatal: not a git repository');
      }
    });
  });

  describe('validateGitEnvironment', () => {
    it('should validate git is available and in git repository', async () => {
      // Mock git --version call
      const mockChild1 = {
        stdout: {
          on: vi.fn((event, callback) => {
            if (event === 'data') {
              callback(Buffer.from('git version 2.34.1\n'));
            }
          }),
        },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            callback(0);
          }
        }),
        kill: vi.fn(),
      };

      // Mock git rev-parse --git-dir call
      const mockChild2 = {
        stdout: {
          on: vi.fn((event, callback) => {
            if (event === 'data') {
              callback(Buffer.from('.git\n'));
            }
          }),
        },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            callback(0);
          }
        }),
        kill: vi.fn(),
      };

      mockSpawn.mockReturnValueOnce(mockChild1 as any).mockReturnValueOnce(mockChild2 as any);

      const result = await validateGitEnvironment();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(true);
      }
    });

    it('should fail when git is not available', async () => {
      const mockChild = {
        stdout: { on: vi.fn() },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'error') {
            callback(new Error('spawn git ENOENT'));
          }
        }),
        kill: vi.fn(),
      };

      mockSpawn.mockReturnValue(mockChild as any);

      const result = await validateGitEnvironment();

      expect(!result.success).toBe(true);
      if (!result.success) {
        expect(result.error.message).toBe('Git is not available or not installed');
      }
    });

    it('should fail when not in git repository', async () => {
      // Mock successful git --version call
      const mockChild1 = {
        stdout: {
          on: vi.fn((event, callback) => {
            if (event === 'data') {
              callback(Buffer.from('git version 2.34.1\n'));
            }
          }),
        },
        stderr: { on: vi.fn() },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            callback(0);
          }
        }),
        kill: vi.fn(),
      };

      // Mock failed git rev-parse --git-dir call
      const mockChild2 = {
        stdout: { on: vi.fn() },
        stderr: {
          on: vi.fn((event, callback) => {
            if (event === 'data') {
              callback(Buffer.from('fatal: not a git repository\n'));
            }
          }),
        },
        on: vi.fn((event, callback) => {
          if (event === 'close') {
            callback(128);
          }
        }),
        kill: vi.fn(),
      };

      mockSpawn.mockReturnValueOnce(mockChild1 as any).mockReturnValueOnce(mockChild2 as any);

      const result = await validateGitEnvironment();

      expect(!result.success).toBe(true);
      if (!result.success) {
        expect(result.error.message).toBe('Current directory is not a git repository');
      }
    });
  });
});
