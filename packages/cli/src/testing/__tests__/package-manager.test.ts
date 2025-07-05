import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { execSync } from 'node:child_process';
import {
  detectPackageManager,
  getRunCommand,
  execPackageManagerCommand,
  clearPackageManagerCache,
  createPackageManagerCache,
  SemVer,
} from '../package-manager.js';

vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

describe('Package Manager Detection', () => {
  const mockExecSync = execSync as unknown as ReturnType<typeof vi.fn>;
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    clearPackageManagerCache();
    process.env = { ...originalEnv };
    delete process.env.FORCE_PACKAGE_MANAGER;
  });

  afterEach(() => {
    process.env = originalEnv;
    clearPackageManagerCache();
  });

  describe('detectPackageManager', () => {
    it('should detect pnpm when available with valid version', () => {
      mockExecSync.mockImplementationOnce(() => '9.1.4\n');

      const result = detectPackageManager();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual({
          name: 'pnpm',
          command: 'pnpm',
          runCommand: 'pnpm run',
          installCommand: 'pnpm install',
          version: '9.1.4',
        });
      }
    });

    it('should handle timeout gracefully', () => {
      const timeoutError = new Error('Command timed out');
      (timeoutError as any).code = 'ETIMEDOUT';
      mockExecSync.mockImplementationOnce(() => {
        throw timeoutError;
      });

      const result = detectPackageManager({ timeout: 100 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('NO_PACKAGE_MANAGER');
      }
    });

    it('should use custom cache instance', () => {
      const customCache = createPackageManagerCache();
      mockExecSync.mockImplementation(() => '9.1.4\n');

      const _result1 = detectPackageManager({ cache: customCache });
      const _result2 = detectPackageManager({ cache: customCache });
      const _result3 = detectPackageManager(); // Uses default cache

      expect(mockExecSync).toHaveBeenCalledTimes(2); // Custom cache hit + default cache miss
    });

    it('should handle cache TTL expiration', async () => {
      const customCache = createPackageManagerCache();
      mockExecSync.mockImplementation(() => '9.1.4\n');

      // Mock Date.now to simulate time passing
      const originalNow = Date.now;
      let currentTime = originalNow();
      Date.now = vi.fn(() => currentTime);

      const result1 = detectPackageManager({ cache: customCache });
      expect(result1.success).toBe(true);

      // Advance time by 6 minutes (past TTL)
      currentTime += 6 * 60 * 1000;

      const result2 = detectPackageManager({ cache: customCache });
      expect(result2.success).toBe(true);
      expect(mockExecSync).toHaveBeenCalledTimes(2);

      Date.now = originalNow;
    });

    it('should sanitize malicious FORCE_PACKAGE_MANAGER values', () => {
      process.env.FORCE_PACKAGE_MANAGER = 'rm -rf /; npm';

      const result = detectPackageManager();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_PACKAGE_MANAGER');
        expect(result.error.message).toContain('Invalid package manager name');
      }
    });

    it('should handle command injection attempts', () => {
      process.env.FORCE_PACKAGE_MANAGER = 'npm; echo "hacked"';

      const result = detectPackageManager();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_PACKAGE_MANAGER');
      }
    });

    it('should normalize package manager names', () => {
      process.env.FORCE_PACKAGE_MANAGER = 'NPM';
      mockExecSync.mockImplementationOnce(() => '10.2.5\n');

      const result = detectPackageManager();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.name).toBe('npm');
      }
    });

    it('should handle pre-release versions', () => {
      mockExecSync.mockImplementationOnce(() => '9.0.0-beta.1\n');

      const result = detectPackageManager();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.version).toBe('9.0.0-beta.1');
      }
    });

    it('should handle version with v prefix', () => {
      mockExecSync.mockImplementationOnce(() => 'v9.1.4\n');

      const result = detectPackageManager();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.version).toBe('v9.1.4');
      }
    });

    it('should report timeout errors with details', () => {
      const timeoutError = new Error('Command timed out');
      (timeoutError as any).code = 'ETIMEDOUT';

      process.env.FORCE_PACKAGE_MANAGER = 'npm';
      mockExecSync.mockImplementationOnce(() => {
        throw timeoutError;
      });

      const result = detectPackageManager({ timeout: 100 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('FORCED_PACKAGE_MANAGER_NOT_FOUND');
        expect(result.error.cause).toBeDefined();
      }
    });

    it('should handle version parse errors gracefully', () => {
      mockExecSync
        .mockImplementationOnce(() => 'not-a-version\n')
        .mockImplementationOnce(() => 'also-not-a-version\n')
        .mockImplementationOnce(() => 'still-not-a-version\n');

      const result = detectPackageManager();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('invalid version format');
      }
    });
  });

  describe('SemVer', () => {
    it('should parse valid semantic versions', () => {
      const result = SemVer.parse('1.2.3');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.major).toBe(1);
        expect(result.value.minor).toBe(2);
        expect(result.value.patch).toBe(3);
        expect(result.value.prerelease).toBeUndefined();
      }
    });

    it('should parse versions with pre-release', () => {
      const result = SemVer.parse('1.2.3-beta.1');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.major).toBe(1);
        expect(result.value.minor).toBe(2);
        expect(result.value.patch).toBe(3);
        expect(result.value.prerelease).toBe('beta.1');
      }
    });

    it('should parse versions with v prefix', () => {
      const result = SemVer.parse('v1.2.3');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.major).toBe(1);
      }
    });

    it('should fail on invalid versions', () => {
      const result = SemVer.parse('not-a-version');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Invalid version format');
      }
    });

    it('should compare versions correctly', () => {
      const v1 = new SemVer(2, 0, 0);
      const v2 = new SemVer(1, 9, 9);
      const v3 = new SemVer(2, 0, 0);
      const v4 = new SemVer(2, 0, 0, 'beta');

      expect(v1.isGreaterThanOrEqual(v2)).toBe(true);
      expect(v2.isGreaterThanOrEqual(v1)).toBe(false);
      expect(v1.isGreaterThanOrEqual(v3)).toBe(true);
      expect(v1.isGreaterThanOrEqual(v4)).toBe(true);
      expect(v4.isGreaterThanOrEqual(v1)).toBe(false);
    });
  });

  describe('execPackageManagerCommand', () => {
    it('should respect custom timeout in exec options', () => {
      process.env.FORCE_PACKAGE_MANAGER = 'npm';
      clearPackageManagerCache();
      
      mockExecSync
        .mockImplementationOnce(() => '9.1.4\n')
        .mockImplementationOnce(() => 'output');

      const _result = execPackageManagerCommand('test', { 
        timeout: 1000 
      }, { 
        cache: createPackageManagerCache() 
      });

      expect(mockExecSync).toHaveBeenNthCalledWith(
        2,
        'test',
        expect.objectContaining({
          timeout: 1000,
        }),
      );
    });

    it('should handle timeout errors', () => {
      process.env.FORCE_PACKAGE_MANAGER = 'npm';
      clearPackageManagerCache();
      
      const timeoutError = new Error('Command timed out');
      (timeoutError as any).code = 'ETIMEDOUT';

      mockExecSync
        .mockImplementationOnce(() => '9.1.4\n')
        .mockImplementationOnce(() => {
          throw timeoutError;
        });

      const result = execPackageManagerCommand(
        'slow-command',
        {},
        { 
          timeout: 100,
          cache: createPackageManagerCache() 
        },
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('COMMAND_TIMEOUT');
        expect(result.error.message).toContain('timed out after 100ms');
        expect(result.error.recoverable).toBe(true);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle empty FORCE_PACKAGE_MANAGER', () => {
      process.env.FORCE_PACKAGE_MANAGER = '';
      mockExecSync.mockImplementationOnce(() => '9.1.4\n');

      const result = detectPackageManager();

      // Empty FORCE_PACKAGE_MANAGER should be ignored and proceed with normal detection
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.name).toBe('pnpm');
      }
    });

    it('should handle whitespace in FORCE_PACKAGE_MANAGER', () => {
      process.env.FORCE_PACKAGE_MANAGER = '  npm  ';
      mockExecSync.mockImplementationOnce(() => '10.2.5\n');

      const result = detectPackageManager();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.name).toBe('npm');
      }
    });

    it('should handle non-string exec output', () => {
      mockExecSync.mockImplementationOnce(() => Buffer.from('9.1.4\n'));

      const result = detectPackageManager();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.version).toBe('9.1.4');
      }
    });
  });

  // Keep original tests that are still valid
  describe('original functionality', () => {
    it('should skip pnpm if version is too old', () => {
      mockExecSync
        .mockImplementationOnce(() => '5.18.0\n')
        .mockImplementationOnce(() => '10.2.5\n');

      const result = detectPackageManager();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.name).toBe('npm');
        expect(result.value.version).toBe('10.2.5');
      }
    });

    it('should fall back to npm when pnpm is not available', () => {
      mockExecSync
        .mockImplementationOnce(() => {
          throw new Error('pnpm not found');
        })
        .mockImplementationOnce(() => '10.2.5\n');

      const result = detectPackageManager();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.name).toBe('npm');
      }
    });

    it('should return error when no package manager is found', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('not found');
      });

      const result = detectPackageManager();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain(
          'No package manager found. Tried: pnpm, npm',
        );
        expect(result.error.suggestion).toBe(
          'Please install pnpm (recommended) or npm',
        );
        expect(result.error.details).toContain('FORCE_PACKAGE_MANAGER');
      }
    });

    it('should create run command with detected package manager', () => {
      mockExecSync.mockImplementationOnce(() => '9.1.4\n');

      const result = getRunCommand('test');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe('pnpm run test');
      }
    });

    it('should include arguments when provided', () => {
      mockExecSync
        .mockImplementationOnce(() => {
          throw new Error('pnpm not found');
        })
        .mockImplementationOnce(() => '10.2.5\n');

      const result = getRunCommand('build', ['--watch', '--verbose']);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe('npm run build -- --watch --verbose');
      }
    });
  });
});
