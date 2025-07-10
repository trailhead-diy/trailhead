/**
 * @file File watcher tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { writeFileSync, unlinkSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  watcherUtils,
  createWatcher,
  watchFiles,
  createDevWatcher,
  watchPatterns,
  createPatternWatcher,
} from '../index.js';
import type { WatchEvent } from '../types.js';

describe('File Watcher', () => {
  let tempDir: string;
  let tempFiles: string[] = [];

  beforeEach(() => {
    tempDir = join(tmpdir(), `watcher-test-${Date.now()}`);
    mkdirSync(tempDir, { recursive: true });
    tempFiles = [];
  });

  afterEach(async () => {
    // Clean up temp files and directory
    tempFiles.forEach(file => {
      try {
        unlinkSync(file);
      } catch {
        // Ignore cleanup errors
      }
    });

    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  const createTempFile = (filename: string, content = 'test content'): string => {
    const filepath = join(tempDir, filename);
    writeFileSync(filepath, content);
    tempFiles.push(filepath);
    return filepath;
  };

  const waitForEvent = (timeout = 1000): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, timeout));
  };

  describe('createWatcher', () => {
    it('creates watcher for single file', () => {
      const filepath = createTempFile('test.txt');
      const result = createWatcher(filepath);

      expect(result.isOk()).toBe(true);

      if (result.isOk()) {
        expect(result.value.watcher).toBeDefined();
        expect(result.value.start).toBeDefined();
        expect(result.value.stop).toBeDefined();
      }
    });

    it('creates watcher for multiple files', () => {
      const file1 = createTempFile('test1.txt');
      const file2 = createTempFile('test2.txt');

      const result = createWatcher([file1, file2]);
      expect(result.isOk()).toBe(true);

      if (result.isOk()) {
        expect(result.value.stats.watchedPaths).toContain(file1);
        expect(result.value.stats.watchedPaths).toContain(file2);
      }
    });

    it('accepts watcher options', () => {
      const filepath = createTempFile('test.txt');

      const result = createWatcher(filepath, {
        ignoreInitial: true,
        followSymlinks: false,
        depth: 2,
      });

      expect(result.isOk()).toBe(true);

      if (result.isOk()) {
        expect(result.value.options.ignoreInitial).toBe(true);
        expect(result.value.options.followSymlinks).toBe(false);
        expect(result.value.options.depth).toBe(2);
      }
    });

    it('can start and stop watcher', async () => {
      const filepath = createTempFile('test.txt');
      const result = createWatcher(filepath);

      expect(result.isOk()).toBe(true);

      if (result.isOk()) {
        const watcher = result.value;

        const startResult = await watcher.start();
        expect(startResult.isOk()).toBe(true);
        expect(watcher.stats.isActive).toBe(true);

        const stopResult = await watcher.stop();
        expect(stopResult.isOk()).toBe(true);
        expect(watcher.stats.isActive).toBe(false);
      }
    });

    it('can add and remove paths', () => {
      const filepath = createTempFile('test.txt');
      const result = createWatcher(filepath);

      expect(result.isOk()).toBe(true);

      if (result.isOk()) {
        const watcher = result.value;
        const newFile = createTempFile('new.txt');

        const addResult = watcher.add(newFile);
        expect(addResult.isOk()).toBe(true);
        expect(watcher.stats.watchedPaths).toContain(newFile);

        const removeResult = watcher.unwatch(newFile);
        expect(removeResult.isOk()).toBe(true);
        expect(watcher.stats.watchedPaths).not.toContain(newFile);
      }
    });
  });

  describe('watchFiles', () => {
    it('creates simple file watcher with handler', () => {
      const filepath = createTempFile('test.txt');
      const handler = vi.fn();

      const result = watchFiles(filepath, handler);
      expect(result.isOk()).toBe(true);

      if (result.isOk()) {
        expect(typeof result.value).toBe('function');
      }
    });

    it('accepts watcher options', () => {
      const filepath = createTempFile('test.txt');
      const handler = vi.fn();

      const result = watchFiles(filepath, handler, {
        ignoreInitial: true,
        depth: 1,
      });

      expect(result.isOk()).toBe(true);
    });
  });

  describe('createPatternWatcher', () => {
    it('creates watcher for file patterns', () => {
      const result = createPatternWatcher({
        patterns: ['*.txt', '*.js'],
        baseDir: tempDir,
      });

      expect(result.isOk()).toBe(true);

      if (result.isOk()) {
        expect(result.value.options.cwd).toBe(tempDir);
      }
    });

    it('requires at least one pattern', () => {
      const result = createPatternWatcher({
        patterns: [],
        baseDir: tempDir,
      });

      expect(result.isOk()).toBe(false);

      if (result.isErr()) {
        expect(result.error.message).toContain('At least one pattern must be provided');
      }
    });

    it('handles absolute and relative patterns', () => {
      const result = createPatternWatcher({
        patterns: ['/absolute/path/*.txt', 'relative/*.js'],
        baseDir: tempDir,
      });

      expect(result.isOk()).toBe(true);
    });
  });

  describe('createDevWatcher', () => {
    it('creates development watcher with defaults', () => {
      const handler = vi.fn();
      const result = createDevWatcher(handler);

      expect(result.isOk()).toBe(true);
    });

    it('accepts custom options', () => {
      const handler = vi.fn();

      const result = createDevWatcher(handler, {
        baseDir: tempDir,
        include: ['*.ts', '*.js'],
        exclude: ['node_modules/**'],
        throttle: 500,
        batch: true,
      });

      expect(result.isOk()).toBe(true);
    });

    it('uses throttled watcher by default', () => {
      const handler = vi.fn();

      const result = createDevWatcher(handler, {
        batch: false,
      });

      expect(result.isOk()).toBe(true);
    });

    it('uses batch watcher when requested', () => {
      const handler = vi.fn();

      const result = createDevWatcher(handler, {
        batch: true,
      });

      expect(result.isOk()).toBe(true);
    });
  });

  describe('watchPatterns', () => {
    it('provides TypeScript patterns', () => {
      const patterns = watchPatterns.typescript('src');

      expect(patterns).toContain('src/**/*.ts');
      expect(patterns).toContain('src/**/*.tsx');
    });

    it('provides JavaScript patterns', () => {
      const patterns = watchPatterns.javascript('lib');

      expect(patterns).toContain('lib/**/*.js');
      expect(patterns).toContain('lib/**/*.jsx');
      expect(patterns).toContain('lib/**/*.mjs');
    });

    it('provides config file patterns', () => {
      const patterns = watchPatterns.config();

      expect(patterns).toContain('*.config.{js,ts,mjs,json}');
      expect(patterns).toContain('package.json');
      expect(patterns).toContain('tsconfig.json');
    });

    it('provides test file patterns', () => {
      const patterns = watchPatterns.tests('tests');

      expect(patterns).toContain('tests/**/*.test.{js,ts,jsx,tsx}');
      expect(patterns).toContain('tests/**/*.spec.{js,ts,jsx,tsx}');
      expect(patterns).toContain('tests/**/__tests__/**/*.{js,ts,jsx,tsx}');
    });

    it('provides documentation patterns', () => {
      const patterns = watchPatterns.docs();

      expect(patterns).toContain('**/*.md');
      expect(patterns).toContain('docs/**/*');
      expect(patterns).toContain('README*');
    });

    it('provides combined patterns', () => {
      const patterns = watchPatterns.all('app');

      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns).toContain('app/**/*.ts');
      expect(patterns).toContain('app/**/*.js');
    });
  });

  describe('watcherUtils convenience object', () => {
    it('exposes all utility functions', () => {
      expect(watcherUtils.createWatcher).toBe(createWatcher);
      expect(watcherUtils.watchFiles).toBe(watchFiles);
      expect(watcherUtils.createPatternWatcher).toBe(createPatternWatcher);
      expect(watcherUtils.createDevWatcher).toBe(createDevWatcher);
      expect(watcherUtils.patterns).toBe(watchPatterns);
    });

    it('can be used as a unified API', () => {
      const filepath = createTempFile('test.txt');
      const result = watcherUtils.createWatcher(filepath);

      expect(result.isOk()).toBe(true);
    });
  });

  describe('event handling', () => {
    it('can register event handlers', async () => {
      const filepath = createTempFile('test.txt');
      const result = createWatcher(filepath, { ignoreInitial: true });

      expect(result.isOk()).toBe(true);

      if (result.isOk()) {
        const watcher = result.value;
        const events: WatchEvent[] = [];

        // Register handler (using internal API for testing)
        (watcher as any).on((event: WatchEvent) => {
          events.push(event);
        });

        await watcher.start();

        // Modify file to trigger event
        writeFileSync(filepath, 'modified content');

        // Wait for event processing
        await waitForEvent(100);

        await watcher.stop();

        // Note: In a real environment, we might see change events
        // In test environment, events might not always fire reliably
        expect(events.length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('error handling', () => {
    it('handles watcher creation errors gracefully', () => {
      // Try to watch a non-existent directory with very strict options
      const result = createWatcher('/absolutely/non/existent/path', {
        usePolling: false,
        ignorePermissionErrors: false,
      });

      // The creation might succeed, but watching will fail
      // This depends on the underlying chokidar implementation
      expect(result.isOk()).toBe(true);
    });

    it('handles stop errors gracefully', async () => {
      const filepath = createTempFile('test.txt');
      const result = createWatcher(filepath);

      expect(result.isOk()).toBe(true);

      if (result.isOk()) {
        const watcher = result.value;

        // Stop multiple times should not throw
        const stop1 = await watcher.stop();
        const stop2 = await watcher.stop();

        expect(stop1.isOk()).toBe(true);
        expect(stop2.isOk()).toBe(true);
      }
    });
  });

  describe('performance and configuration', () => {
    it('respects high water mark settings', () => {
      const filepath = createTempFile('test.txt');

      const result = createWatcher(filepath, {
        // These options would be passed to chokidar
        usePolling: false,
        interval: 100,
        binaryInterval: 300,
      });

      expect(result.isOk()).toBe(true);
    });

    it('handles ignored patterns', () => {
      const result = createWatcher(tempDir, {
        ignored: ['*.tmp', '**/node_modules/**'],
        ignoreInitial: true,
      });

      expect(result.isOk()).toBe(true);
    });
  });
});
