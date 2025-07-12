import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCLIContext, getScriptDir } from '../context';
import type { CLIContext } from '../types';

// Mock the filesystem module
vi.mock('@esteban-url/trailhead-cli/filesystem', () => ({
  createNodeFileSystem: vi.fn(),
}));

// Mock path and url modules
vi.mock('path', async () => {
  const actual = await vi.importActual('path');
  return {
    ...actual,
    join: vi.fn((...paths: string[]) => paths.join('/')),
    dirname: vi.fn((path: string) => path.split('/').slice(0, -1).join('/')),
  };
});

vi.mock('url', async () => {
  const actual = await vi.importActual('url');
  return {
    ...actual,
    fileURLToPath: vi.fn((url: string) => url.replace('file://', '')),
  };
});

const mockFileSystem = {
  readJson: vi.fn(),
};

beforeEach(async () => {
  vi.clearAllMocks();
  const { createNodeFileSystem } = vi.mocked(await import('@esteban-url/trailhead-cli/filesystem'));
  createNodeFileSystem.mockReturnValue(mockFileSystem as any);
});

describe('CLI context utilities', () => {
  describe('createCLIContext', () => {
    it('should create CLI context with version from package.json', async () => {
      const mockPackageJson = { version: '2.1.0' };
      mockFileSystem.readJson.mockResolvedValue({
        isOk: () => true,
        value: mockPackageJson,
      });

      const context = await createCLIContext('/test/base/dir');

      expect(context).toEqual({
        version: '2.1.0',
        projectRoot: process.cwd(),
        isTrailheadProject: false,
      });
    });

    it('should use default version when package.json is missing version', async () => {
      const mockPackageJson = { name: 'test-package' }; // No version field
      mockFileSystem.readJson.mockResolvedValue({
        isOk: () => true,
        value: mockPackageJson,
      });

      const context = await createCLIContext('/test/base/dir');

      expect(context.version).toBe('1.0.0');
      expect(context.projectRoot).toBe(process.cwd());
      expect(context.isTrailheadProject).toBe(false);
    });

    it('should use default version when package.json read fails', async () => {
      mockFileSystem.readJson.mockResolvedValue({
        isOk: () => false,
        error: 'File not found',
      });

      const context = await createCLIContext('/test/base/dir');

      expect(context.version).toBe('1.0.0');
      expect(context.projectRoot).toBe(process.cwd());
      expect(context.isTrailheadProject).toBe(false);
    });

    it('should use default version when filesystem throws error', async () => {
      mockFileSystem.readJson.mockRejectedValue(new Error('Filesystem error'));

      const context = await createCLIContext('/test/base/dir');

      expect(context.version).toBe('1.0.0');
      expect(context.projectRoot).toBe(process.cwd());
      expect(context.isTrailheadProject).toBe(false);
    });

    it('should handle different base directories', async () => {
      const mockPackageJson = { version: '3.2.1' };
      mockFileSystem.readJson.mockResolvedValue({
        isOk: () => true,
        value: mockPackageJson,
      });

      const context1 = await createCLIContext('/path/to/project1');
      const context2 = await createCLIContext('/path/to/project2');

      expect(context1.version).toBe('3.2.1');
      expect(context2.version).toBe('3.2.1');
      // Both should have same project root (process.cwd())
      expect(context1.projectRoot).toBe(context2.projectRoot);
    });

    it('should create readonly context object', async () => {
      const mockPackageJson = { version: '1.5.0' };
      mockFileSystem.readJson.mockResolvedValue({
        isOk: () => true,
        value: mockPackageJson,
      });

      const context = await createCLIContext('/test/dir');

      // TypeScript should enforce readonly, but we can test runtime behavior
      expect(context).toEqual({
        version: '1.5.0',
        projectRoot: process.cwd(),
        isTrailheadProject: false,
      });

      // Verify properties exist and are correct type
      expect(typeof context.version).toBe('string');
      expect(typeof context.projectRoot).toBe('string');
      expect(typeof context.isTrailheadProject).toBe('boolean');
    });

    it('should handle malformed package.json', async () => {
      const malformedPackageJson = 'not valid json';
      mockFileSystem.readJson.mockResolvedValue({
        isOk: () => true,
        value: malformedPackageJson,
      });

      const context = await createCLIContext('/test/dir');

      // Should handle gracefully and use default version
      expect(context.version).toBe('1.0.0');
    });

    it('should handle empty package.json', async () => {
      const emptyPackageJson = {};
      mockFileSystem.readJson.mockResolvedValue({
        isOk: () => true,
        value: emptyPackageJson,
      });

      const context = await createCLIContext('/test/dir');

      expect(context.version).toBe('1.0.0');
    });

    it('should handle package.json with null version', async () => {
      const packageJsonWithNullVersion = { version: null };
      mockFileSystem.readJson.mockResolvedValue({
        isOk: () => true,
        value: packageJsonWithNullVersion,
      });

      const context = await createCLIContext('/test/dir');

      expect(context.version).toBe('1.0.0');
    });

    it('should use correct project root', async () => {
      const originalCwd = process.cwd();
      const mockPackageJson = { version: '1.0.0' };
      mockFileSystem.readJson.mockResolvedValue({
        isOk: () => true,
        value: mockPackageJson,
      });

      const context = await createCLIContext('/any/dir');

      expect(context.projectRoot).toBe(originalCwd);
    });
  });

  describe('getScriptDir', () => {
    it('should return script directory from import.meta.url', () => {
      // We can't easily mock import.meta.url, so we'll just test that the function
      // returns a string and doesn't throw
      const result = getScriptDir();

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return consistent result on multiple calls', () => {
      const result1 = getScriptDir();
      const result2 = getScriptDir();

      expect(result1).toBe(result2);
      expect(typeof result1).toBe('string');
      expect(typeof result2).toBe('string');
    });
  });

  describe('type safety and interfaces', () => {
    it('should return CLIContext type with correct properties', async () => {
      const mockPackageJson = { version: '2.0.0' };
      mockFileSystem.readJson.mockResolvedValue({
        isOk: () => true,
        value: mockPackageJson,
      });

      const context: CLIContext = await createCLIContext('/test/dir');

      // TypeScript should enforce this structure
      expect(context).toHaveProperty('version');
      expect(context).toHaveProperty('projectRoot');
      expect(context).toHaveProperty('isTrailheadProject');

      // Verify types
      expect(typeof context.version).toBe('string');
      expect(typeof context.projectRoot).toBe('string');
      expect(typeof context.isTrailheadProject).toBe('boolean');
    });

    it('should maintain interface contract', async () => {
      const mockPackageJson = { version: '1.2.3' };
      mockFileSystem.readJson.mockResolvedValue({
        isOk: () => true,
        value: mockPackageJson,
      });

      const context = await createCLIContext('/test/dir');

      // Should match CLIContext interface exactly
      const expectedKeys = ['version', 'projectRoot', 'isTrailheadProject'];
      const actualKeys = Object.keys(context);

      expect(actualKeys.sort()).toEqual(expectedKeys.sort());
    });
  });

  describe('error resilience', () => {
    it('should handle filesystem errors gracefully', async () => {
      const errors = [
        new Error('ENOENT: no such file or directory'),
        new Error('EACCES: permission denied'),
        new Error('EISDIR: illegal operation on a directory'),
        new TypeError('Cannot read property'),
        'String error',
        null,
        undefined,
      ];

      for (const error of errors) {
        mockFileSystem.readJson.mockRejectedValue(error);

        const context = await createCLIContext('/test/dir');

        expect(context.version).toBe('1.0.0');
        expect(context.projectRoot).toBe(process.cwd());
        expect(context.isTrailheadProject).toBe(false);
      }
    });

    it('should handle concurrent calls', async () => {
      const mockPackageJson = { version: '1.1.1' };
      mockFileSystem.readJson.mockResolvedValue({
        isOk: () => true,
        value: mockPackageJson,
      });

      const promises = Array.from({ length: 10 }, () => createCLIContext('/test/dir'));

      const contexts = await Promise.all(promises);

      contexts.forEach(context => {
        expect(context.version).toBe('1.1.1');
        expect(context.projectRoot).toBe(process.cwd());
        expect(context.isTrailheadProject).toBe(false);
      });
    });
  });

  describe('integration scenarios', () => {
    it('should work with different working directories', async () => {
      const mockPackageJson = { version: '4.0.0' };
      mockFileSystem.readJson.mockResolvedValue({
        isOk: () => true,
        value: mockPackageJson,
      });

      // Context should always use process.cwd() regardless of baseDir
      const context1 = await createCLIContext('/some/other/dir');
      const context2 = await createCLIContext('/completely/different/path');

      expect(context1.projectRoot).toBe(process.cwd());
      expect(context2.projectRoot).toBe(process.cwd());
      expect(context1.projectRoot).toBe(context2.projectRoot);
    });

    it('should handle realistic project structures', async () => {
      const mockPackageJson = {
        name: '@esteban-url/trailhead-web-ui',
        version: '1.0.1',
        description: 'UI component library',
        main: 'dist/index.js',
      };

      mockFileSystem.readJson.mockResolvedValue({
        isOk: () => true,
        value: mockPackageJson,
      });

      const context = await createCLIContext('/projects/trailhead/packages/web-ui/src/cli/utils');

      expect(context.version).toBe('1.0.1');
      expect(context.isTrailheadProject).toBe(false); // Currently always false
      expect(typeof context.projectRoot).toBe('string');
    });
  });
});
