import { describe, it, expect, beforeEach } from 'vitest';
import {
  mockFileSystem,
  createEnhancedMockFileSystem,
  createTestMockFileSystem,
  createCLIMockFileSystem,
  createCrossPlatformMockFileSystem,
  mockLogger,
  mockPrompts,
} from '../mocks.js';

describe('Testing Mocks', () => {
  describe('mockFileSystem', () => {
    it('should create filesystem with initial files', async () => {
      const fs = mockFileSystem({
        'test.txt': 'Hello World',
        'dir/nested.json': '{"key": "value"}',
      });

      const testResult = await fs.readFile('test.txt');
      expect(testResult.success).toBe(true);
      expect(testResult.value).toBe('Hello World');

      const nestedResult = await fs.readFile('dir/nested.json');
      expect(nestedResult.success).toBe(true);
      expect(nestedResult.value).toBe('{"key": "value"}');
    });

    it('should handle file existence checks', async () => {
      const fs = mockFileSystem({
        'existing.txt': 'content',
      });

      const existsResult = await fs.access('existing.txt');
      expect(existsResult.success).toBe(true);

      const notExistsResult = await fs.access('nonexistent.txt');
      expect(notExistsResult.success).toBe(false);
    });

    it('should return error for missing files', async () => {
      const fs = mockFileSystem();

      const result = await fs.readFile('missing.txt');
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('FILE_NOT_FOUND');
      expect(result.error.message).toBe('File not found: missing.txt');
    });

    it('should write files and create directories', async () => {
      const fs = mockFileSystem();

      const writeResult = await fs.writeFile('new/file.txt', 'new content');
      expect(writeResult.success).toBe(true);

      const readResult = await fs.readFile('new/file.txt');
      expect(readResult.success).toBe(true);
      expect(readResult.value).toBe('new content');

      // Directory should exist
      const dirExistsResult = await fs.access('new');
      expect(dirExistsResult.success).toBe(true);
    });

    it('should handle directory operations', async () => {
      const fs = mockFileSystem();

      const mkdirResult = await fs.mkdir('testdir');
      expect(mkdirResult.success).toBe(true);

      const existsResult = await fs.access('testdir');
      expect(existsResult.success).toBe(true);
    });

    it('should list directory contents', async () => {
      const fs = mockFileSystem({
        'dir/file1.txt': 'content1',
        'dir/file2.txt': 'content2',
        'dir/subdir/file3.txt': 'content3',
      });

      const readdirResult = await fs.readdir('dir');
      expect(readdirResult.success).toBe(true);
      expect(readdirResult.value).toContain('file1.txt');
      expect(readdirResult.value).toContain('file2.txt');
      expect(readdirResult.value).toContain('subdir');
      expect(readdirResult.value).toHaveLength(3);
    });

    it('should handle file copying', async () => {
      const fs = mockFileSystem({
        'source.txt': 'original content',
      });

      const copyResult = await fs.cp('source.txt', 'destination.txt');
      expect(copyResult.success).toBe(true);

      const readResult = await fs.readFile('destination.txt');
      expect(readResult.success).toBe(true);
      expect(readResult.value).toBe('original content');
    });

    it('should handle JSON operations', async () => {
      const fs = mockFileSystem();
      const testData = { name: 'test', version: '1.0.0' };

      const writeResult = await fs.writeJson('package.json', testData);
      expect(writeResult.success).toBe(true);

      const readResult = await fs.readJson('package.json');
      expect(readResult.success).toBe(true);
      expect(readResult.value).toEqual(testData);
    });

    it('should handle invalid JSON', async () => {
      const fs = mockFileSystem({
        'invalid.json': '{ invalid json }',
      });

      const result = await fs.readJson('invalid.json');
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('PARSE_ERROR');
    });

    it('should ensure directories', async () => {
      const fs = mockFileSystem();

      const ensureResult = await fs.ensureDir('deep/nested/path');
      expect(ensureResult.success).toBe(true);

      const existsResult = await fs.access('deep/nested/path');
      expect(existsResult.success).toBe(true);

      // Parent directories should also exist
      const parentExistsResult = await fs.access('deep');
      expect(parentExistsResult.success).toBe(true);
    });

    it('should provide test helper methods', () => {
      const fs = mockFileSystem({
        'test.txt': 'content',
      });

      const files = fs.getFiles!();
      expect(files.get('test.txt')).toBe('content');

      const directories = fs.getDirectories!();
      expect(directories.size).toBeGreaterThan(0);

      fs.clear!();
      expect(fs.getFiles!().size).toBe(0);
      expect(fs.getDirectories!().size).toBe(0);
    });
  });

  describe('createEnhancedMockFileSystem', () => {
    it('should create filesystem with initial files and directories', () => {
      const fs = createEnhancedMockFileSystem({
        initialFiles: {
          'src/index.ts': 'console.log("test");',
        },
        initialDirectories: ['dist', 'node_modules'],
      });

      expect(fs.getStoredPaths()).toContain('src/index.ts');
      expect(fs.getStoredPaths()).toContain('dist');
      expect(fs.getStoredPaths()).toContain('node_modules');
    });

    it('should allow adding files dynamically', async () => {
      const fs = createEnhancedMockFileSystem();

      fs.addFile('dynamic.txt', 'dynamic content');

      const result = await fs.readFile('dynamic.txt');
      expect(result.success).toBe(true);
      expect(result.value).toBe('dynamic content');
    });

    it('should allow adding directories dynamically', async () => {
      const fs = createEnhancedMockFileSystem();

      fs.addDirectory('new/directory');

      const result = await fs.access('new/directory');
      expect(result.success).toBe(true);
    });

    it('should simulate errors when enabled', async () => {
      const fs = createEnhancedMockFileSystem({
        simulateErrors: true,
      });

      fs.simulateError('readFile', 'error.txt', {
        code: 'PERMISSION_DENIED',
        message: 'Permission denied',
      });

      const result = await fs.readFile('error.txt');
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('PERMISSION_DENIED');
    });

    it('should handle case sensitivity options', async () => {
      const fs = createEnhancedMockFileSystem({
        caseSensitive: false,
        simulateErrors: true,
      });

      fs.simulateError('readFile', 'FILE.TXT', {
        code: 'TEST_ERROR',
        message: 'Test error',
      });

      // Should match case-insensitively
      const result = await fs.readFile('file.txt');
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('TEST_ERROR');
    });

    it('should list all stored paths', () => {
      const fs = createEnhancedMockFileSystem({
        initialFiles: {
          'project/src/index.ts': 'code',
          'project/package.json': '{}',
        },
        initialDirectories: ['dist'],
      });

      const paths = fs.getStoredPaths();
      expect(paths).toContain('project/src/index.ts');
      expect(paths).toContain('project/package.json');
      expect(paths).toContain('dist');
      expect(paths).toContain('project');
      expect(paths).toContain('project/src');
    });

    it('should clear all data', async () => {
      const fs = createEnhancedMockFileSystem({
        initialFiles: { 'test.txt': 'content' },
        simulateErrors: true,
      });

      fs.simulateError('readFile', 'test.txt', { code: 'TEST' });

      fs.clear();

      expect(fs.getStoredPaths()).toHaveLength(0);

      // Error simulations should also be cleared
      const result = await fs.readFile('test.txt');
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('FILE_NOT_FOUND'); // Normal error, not simulated
    });
  });

  describe('createTestMockFileSystem', () => {
    let fs: ReturnType<typeof createTestMockFileSystem>;

    beforeEach(() => {
      fs = createTestMockFileSystem();
    });

    it('should have common test files', async () => {
      const packageResult = await fs.readJson('project/package.json');
      expect(packageResult.success).toBe(true);
      expect(packageResult.value.name).toBe('test-project');

      const indexResult = await fs.readFile('project/src/index.ts');
      expect(indexResult.success).toBe(true);
      expect(indexResult.value).toContain('Hello World');

      const readmeResult = await fs.readFile('project/README.md');
      expect(readmeResult.success).toBe(true);
      expect(readmeResult.value).toContain('# Test Project');
    });

    it('should have expected directory structure', async () => {
      const distExists = await fs.access('project/dist');
      expect(distExists.success).toBe(true);

      const nodeModulesExists = await fs.access('project/node_modules');
      expect(nodeModulesExists.success).toBe(true);
    });
  });

  describe('createCLIMockFileSystem', () => {
    let fs: ReturnType<typeof createCLIMockFileSystem>;

    beforeEach(() => {
      fs = createCLIMockFileSystem();
    });

    it('should have CLI project structure', async () => {
      const packageResult = await fs.readJson('cli-project/package.json');
      expect(packageResult.success).toBe(true);
      expect(packageResult.value.name).toBe('test-cli');
      expect(packageResult.value.bin).toEqual({
        'test-cli': './dist/index.js',
      });

      const indexResult = await fs.readFile('cli-project/src/index.ts');
      expect(indexResult.success).toBe(true);
      expect(indexResult.value).toContain('@esteban-url/trailhead-cli');

      const tsconfigResult = await fs.readJson('cli-project/tsconfig.json');
      expect(tsconfigResult.success).toBe(true);
      expect(tsconfigResult.value.compilerOptions.target).toBe('es2020');
    });
  });

  describe('createCrossPlatformMockFileSystem', () => {
    let fs: ReturnType<typeof createCrossPlatformMockFileSystem>;

    beforeEach(() => {
      fs = createCrossPlatformMockFileSystem();
    });

    it('should normalize different path separators', async () => {
      // All paths should be accessible with forward slashes
      const unixResult = await fs.readFile('unix/project/src/index.ts');
      expect(unixResult.success).toBe(true);
      expect(unixResult.value).toContain('Unix');

      const windowsResult = await fs.readFile('windows/project/src/index.ts');
      expect(windowsResult.success).toBe(true);
      expect(windowsResult.value).toContain('Windows');

      const mixedResult = await fs.readFile('mixed/project/src/index.ts');
      expect(mixedResult.success).toBe(true);
      expect(mixedResult.value).toContain('Mixed');
    });

    it('should handle case insensitivity', async () => {
      // Should work with different casing
      const result = await fs.readFile('UNIX/PROJECT/SRC/INDEX.TS');
      expect(result.success).toBe(true);
      expect(result.value).toContain('Unix');
    });
  });

  describe('mockLogger', () => {
    it('should capture all log messages', () => {
      const logger = mockLogger();

      logger.info('Info message');
      logger.success('Success message');
      logger.warning('Warning message');
      logger.error('Error message');
      logger.debug('Debug message');
      logger.step('Step message');

      expect(logger.logs).toHaveLength(6);
      expect(logger.logs[0]).toEqual({
        level: 'info',
        message: 'Info message',
      });
      expect(logger.logs[1]).toEqual({
        level: 'success',
        message: 'Success message',
      });
      expect(logger.logs[2]).toEqual({
        level: 'warning',
        message: 'Warning message',
      });
      expect(logger.logs[3]).toEqual({
        level: 'error',
        message: 'Error message',
      });
      expect(logger.logs[4]).toEqual({
        level: 'debug',
        message: 'Debug message',
      });
      expect(logger.logs[5]).toEqual({
        level: 'step',
        message: 'Step message',
      });
    });

    it('should provide access to logged messages by level', () => {
      const logger = mockLogger();

      logger.info('First info');
      logger.error('First error');
      logger.info('Second info');

      const infoLogs = logger.logs.filter(log => log.level === 'info');
      const errorLogs = logger.logs.filter(log => log.level === 'error');

      expect(infoLogs).toHaveLength(2);
      expect(errorLogs).toHaveLength(1);
      expect(infoLogs[0].message).toBe('First info');
      expect(infoLogs[1].message).toBe('Second info');
      expect(errorLogs[0].message).toBe('First error');
    });
  });

  describe('mockPrompts', () => {
    it('should return predefined responses', async () => {
      const prompts = mockPrompts({
        'What is your name?': 'Alice',
        'Select framework:': 'React',
        'Are you sure?': true,
        'Select tags:': ['typescript', 'react'],
      });

      expect(await prompts.prompt({ message: 'What is your name?' })).toBe('Alice');
      expect(await prompts.select({ message: 'Select framework:' })).toBe('React');
      expect(await prompts.confirm({ message: 'Are you sure?' })).toBe(true);
      expect(await prompts.multiselect({ message: 'Select tags:' })).toEqual([
        'typescript',
        'react',
      ]);
    });

    it('should throw for unmocked prompts', async () => {
      const prompts = mockPrompts();

      await expect(prompts.prompt({ message: 'Unmocked question?' })).rejects.toThrow(
        'No mock response for prompt: Unmocked question?'
      );

      await expect(prompts.select({ message: 'Unmocked select?' })).rejects.toThrow(
        'No mock response for select: Unmocked select?'
      );

      await expect(prompts.confirm({ message: 'Unmocked confirm?' })).rejects.toThrow(
        'No mock response for confirm: Unmocked confirm?'
      );

      await expect(prompts.multiselect({ message: 'Unmocked multiselect?' })).rejects.toThrow(
        'No mock response for multiselect: Unmocked multiselect?'
      );
    });

    it('should handle different response types', async () => {
      const prompts = mockPrompts({
        'String response': 'text',
        'Number response': 42,
        'Boolean response': false,
        'Array response': [1, 2, 3],
        'Object response': { key: 'value' },
      });

      expect(await prompts.prompt({ message: 'String response' })).toBe('text');
      expect(await prompts.prompt({ message: 'Number response' })).toBe(42);
      expect(await prompts.prompt({ message: 'Boolean response' })).toBe(false);
      expect(await prompts.prompt({ message: 'Array response' })).toEqual([1, 2, 3]);
      expect(await prompts.prompt({ message: 'Object response' })).toEqual({
        key: 'value',
      });
    });
  });

  describe('integration testing patterns', () => {
    it('should support realistic testing workflows', async () => {
      const fs = createTestMockFileSystem();
      const logger = mockLogger();

      // Simulate a CLI operation that reads config and writes output
      const packageResult = await fs.readJson('project/package.json');
      expect(packageResult.success).toBe(true);

      logger.info('Processing package.json');

      const newFile = `// Generated from ${packageResult.value.name}\nexport const version = "${packageResult.value.version}";`;
      const writeResult = await fs.writeFile('project/src/version.ts', newFile);
      expect(writeResult.success).toBe(true);

      logger.success('Generated version file');

      // Verify the operation
      const versionResult = await fs.readFile('project/src/version.ts');
      expect(versionResult.success).toBe(true);
      expect(versionResult.value).toContain('export const version = "1.0.0"');

      // Check logging
      expect(logger.logs).toHaveLength(2);
      expect(logger.logs[0].level).toBe('info');
      expect(logger.logs[1].level).toBe('success');
    });

    it('should support error simulation workflows', async () => {
      const fs = createEnhancedMockFileSystem({
        simulateErrors: true,
        initialFiles: { 'config.json': '{"setting": "value"}' },
      });

      // Simulate permission error
      fs.simulateError('writeFile', 'output.txt', {
        code: 'PERMISSION_DENIED',
        message: 'Permission denied',
      });

      // Normal read should work
      const readResult = await fs.readFile('config.json');
      expect(readResult.success).toBe(true);

      // Write should fail with simulated error
      const writeResult = await fs.writeFile('output.txt', 'content');
      expect(writeResult.success).toBe(false);
      expect(writeResult.error.code).toBe('PERMISSION_DENIED');
    });
  });
});
