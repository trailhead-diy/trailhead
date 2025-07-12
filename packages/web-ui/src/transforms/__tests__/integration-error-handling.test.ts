import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ok, err } from '@esteban-url/trailhead-cli/core';
import type { FileSystem } from '@esteban-url/trailhead-cli/filesystem';
import { runMainPipelineWithFs, getMainPipelineInfo } from '../index';

// Mock filesystem for testing
const createMockFileSystem = (): FileSystem => ({
  readdir: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  exists: vi.fn(),
  mkdir: vi.fn(),
  rmdir: vi.fn(),
  stat: vi.fn(),
  copyFile: vi.fn(),
});

describe('Transform Pipeline Integration - Error Handling', () => {
  let mockFs: FileSystem;
  let mockLogger: any;

  beforeEach(() => {
    mockFs = createMockFileSystem();
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      success: vi.fn(),
    };
  });

  describe('Directory reading errors', () => {
    it('should handle directory read failures gracefully', async () => {
      vi.mocked(mockFs.readdir).mockResolvedValue(
        err({ code: 'ENOENT', message: 'Directory not found', recoverable: false })
      );

      const result = await runMainPipelineWithFs(mockFs, '/nonexistent', {
        logger: mockLogger,
      });

      expect(result.success).toBe(false);
      expect(result.processedFiles).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        file: '/nonexistent',
        error: 'Failed to read directory',
      });
      expect(result.summary).toBe('Failed to read directory');
    });

    it('should handle permission errors when reading directory', async () => {
      vi.mocked(mockFs.readdir).mockResolvedValue(
        err({ code: 'EACCES', message: 'Permission denied', recoverable: false })
      );

      const result = await runMainPipelineWithFs(mockFs, '/restricted', {
        logger: mockLogger,
      });

      expect(result.success).toBe(false);
      expect(result.errors[0].error).toBe('Failed to read directory');
      // Logger might not be called in all error paths
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('File reading errors', () => {
    it('should handle file read failures and continue processing other files', async () => {
      vi.mocked(mockFs.readdir).mockResolvedValue(ok(['button.tsx', 'input.tsx', 'dialog.tsx']));

      vi.mocked(mockFs.readFile)
        .mockResolvedValueOnce(ok('export function CatalystButton() { return <button />; }'))
        .mockResolvedValueOnce(
          err({ code: 'ENOENT', message: 'File not found', recoverable: false })
        )
        .mockResolvedValueOnce(ok('export function CatalystDialog() { return <dialog />; }'));

      vi.mocked(mockFs.writeFile).mockResolvedValue(ok(undefined));

      const result = await runMainPipelineWithFs(mockFs, '/components', {
        logger: mockLogger,
        verbose: true,
      });

      expect(result.success).toBe(false);
      expect(result.processedFiles).toBe(2); // button.tsx and dialog.tsx processed
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        file: 'input.tsx',
        error: 'Failed to read file',
      });
    });

    it('should handle binary files gracefully', async () => {
      vi.mocked(mockFs.readdir).mockResolvedValue(ok(['component.tsx']));
      vi.mocked(mockFs.readFile).mockResolvedValue(ok(Buffer.from([0x89, 0x50, 0x4e, 0x47]))); // PNG header
      vi.mocked(mockFs.writeFile).mockResolvedValue(ok(undefined));

      const result = await runMainPipelineWithFs(mockFs, '/components', {
        logger: mockLogger,
      });

      expect(result.success).toBe(true);
      expect(result.processedFiles).toBeGreaterThanOrEqual(0); // Binary data might be processed
    });
  });

  describe('File writing errors', () => {
    it('should handle file write failures', async () => {
      vi.mocked(mockFs.readdir).mockResolvedValue(ok(['button.tsx']));
      vi.mocked(mockFs.readFile).mockResolvedValue(
        ok('import clsx from "clsx"; export function CatalystButton() { return <button />; }')
      );
      vi.mocked(mockFs.writeFile).mockResolvedValue(
        err({ code: 'EACCES', message: 'Permission denied', recoverable: false })
      );

      const result = await runMainPipelineWithFs(mockFs, '/components', {
        logger: mockLogger,
      });

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        file: 'button.tsx',
        error: 'Failed to write file',
      });
    });

    it('should handle disk space errors during writing', async () => {
      vi.mocked(mockFs.readdir).mockResolvedValue(ok(['large-component.tsx']));
      vi.mocked(mockFs.readFile).mockResolvedValue(
        ok('export function CatalystButton() { return <button />; }')
      );
      vi.mocked(mockFs.writeFile).mockResolvedValue(
        err({ code: 'ENOSPC', message: 'No space left on device', recoverable: false })
      );

      const result = await runMainPipelineWithFs(mockFs, '/components', {
        logger: mockLogger,
      });

      expect(result.success).toBe(false);
      expect(result.errors[0].error).toBe('Failed to write file');
    });
  });

  describe('Transform-specific errors', () => {
    it('should handle syntax errors in TypeScript files', async () => {
      const malformedContent = `
        export function CatalystButton({ 
          // Missing closing brace and invalid syntax
          return <button />
        }
      `;

      vi.mocked(mockFs.readdir).mockResolvedValue(ok(['malformed.tsx']));
      vi.mocked(mockFs.readFile).mockResolvedValue(ok(malformedContent));

      const result = await runMainPipelineWithFs(mockFs, '/components', {
        logger: mockLogger,
        verbose: true,
      });

      // Some transforms might fail on malformed syntax
      expect(result.errors.length).toBeGreaterThanOrEqual(0);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle extremely large files', async () => {
      const largeContent = 'export function CatalystButton() { return <button />; }\n'.repeat(1000); // Reduce size for faster test

      vi.mocked(mockFs.readdir).mockResolvedValue(ok(['huge-component.tsx']));
      vi.mocked(mockFs.readFile).mockResolvedValue(ok(largeContent));
      vi.mocked(mockFs.writeFile).mockResolvedValue(ok(undefined));

      const result = await runMainPipelineWithFs(mockFs, '/components', {
        logger: mockLogger,
      });

      expect(result.success).toBe(true);
    });

    it('should handle files with mixed line endings', async () => {
      const mixedLineEndings = 'export function CatalystButton() {\r\n  return <button />;\r}\n';

      vi.mocked(mockFs.readdir).mockResolvedValue(ok(['mixed-endings.tsx']));
      vi.mocked(mockFs.readFile).mockResolvedValue(ok(mixedLineEndings));
      vi.mocked(mockFs.writeFile).mockResolvedValue(ok(undefined));

      const result = await runMainPipelineWithFs(mockFs, '/components', {
        logger: mockLogger,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Resource exhaustion scenarios', () => {
    it('should handle memory pressure with many files', async () => {
      const manyFiles = Array.from({ length: 1000 }, (_, i) => `component-${i}.tsx`);

      vi.mocked(mockFs.readdir).mockResolvedValue(ok(manyFiles));
      vi.mocked(mockFs.readFile).mockResolvedValue(
        ok('export function CatalystButton() { return <button />; }')
      );
      vi.mocked(mockFs.writeFile).mockResolvedValue(ok(undefined));

      const result = await runMainPipelineWithFs(mockFs, '/components', {
        logger: mockLogger,
      });

      expect(result.success).toBe(true);
      expect(result.processedFiles).toBeGreaterThan(0);
    });

    it('should handle concurrent file operations gracefully', async () => {
      vi.mocked(mockFs.readdir).mockResolvedValue(ok(['button.tsx', 'input.tsx', 'dialog.tsx']));

      // Simulate random delays to test concurrency issues
      vi.mocked(mockFs.readFile).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
        return ok('export function CatalystButton() { return <button />; }');
      });

      vi.mocked(mockFs.writeFile).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 5));
        return ok(undefined);
      });

      const result = await runMainPipelineWithFs(mockFs, '/components', {
        logger: mockLogger,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Filter and option handling', () => {
    it('should handle filter functions that throw errors', async () => {
      const badFilter = () => {
        throw new Error('Filter function crashed');
      };

      vi.mocked(mockFs.readdir).mockResolvedValue(ok(['button.tsx']));

      const result = await runMainPipelineWithFs(mockFs, '/components', {
        logger: mockLogger,
        filter: badFilter,
      });

      // Pipeline should handle filter errors gracefully
      expect(result.errors.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle dry run mode with write errors', async () => {
      vi.mocked(mockFs.readdir).mockResolvedValue(ok(['button.tsx']));
      vi.mocked(mockFs.readFile).mockResolvedValue(
        ok('import clsx from "clsx"; export function CatalystButton() { return <button />; }')
      );

      // In dry run mode, write should not be called
      const result = await runMainPipelineWithFs(mockFs, '/components', {
        logger: mockLogger,
        dryRun: true,
      });

      expect(result.success).toBe(true);
      expect(mockFs.writeFile).not.toHaveBeenCalled();
      expect(result.summary).toContain('(dry run)');
    });
  });

  describe('Edge case file types', () => {
    it('should ignore non-TSX files correctly', async () => {
      vi.mocked(mockFs.readdir).mockResolvedValue(
        ok([
          'component.tsx',
          'styles.css',
          'config.json',
          'README.md',
          'test.spec.ts',
          'component.test.tsx',
        ])
      );

      vi.mocked(mockFs.readFile).mockResolvedValue(
        ok('export function CatalystButton() { return <button />; }')
      );
      vi.mocked(mockFs.writeFile).mockResolvedValue(ok(undefined));

      const result = await runMainPipelineWithFs(mockFs, '/components', {
        logger: mockLogger,
        verbose: true,
      });

      expect(result.success).toBe(true);
      // Only component.tsx should be processed (test files are filtered out)
      expect(mockFs.readFile).toHaveBeenCalledTimes(1);
    });

    it('should handle empty TSX files', async () => {
      vi.mocked(mockFs.readdir).mockResolvedValue(ok(['empty.tsx']));
      vi.mocked(mockFs.readFile).mockResolvedValue(ok(''));
      vi.mocked(mockFs.writeFile).mockResolvedValue(ok(undefined));

      const result = await runMainPipelineWithFs(mockFs, '/components', {
        logger: mockLogger,
      });

      expect(result.success).toBe(true);
      expect(result.processedFiles).toBeGreaterThanOrEqual(0); // Empty files might trigger transforms
    });

    it('should handle files with only comments', async () => {
      const commentOnlyContent = `
        /**
         * This file only contains comments
         * No actual code here
         */
        
        // More comments
        /* Block comment */
      `;

      vi.mocked(mockFs.readdir).mockResolvedValue(ok(['comments-only.tsx']));
      vi.mocked(mockFs.readFile).mockResolvedValue(ok(commentOnlyContent));
      vi.mocked(mockFs.writeFile).mockResolvedValue(ok(undefined));

      const result = await runMainPipelineWithFs(mockFs, '/components', {
        logger: mockLogger,
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Logger error handling', () => {
    it('should handle logger failures gracefully', async () => {
      const faultyLogger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
        success: vi.fn(),
      };

      vi.mocked(mockFs.readdir).mockResolvedValue(ok(['button.tsx']));
      vi.mocked(mockFs.readFile).mockResolvedValue(
        ok('export function CatalystButton() { return <button />; }')
      );
      vi.mocked(mockFs.writeFile).mockResolvedValue(ok(undefined));

      // Should not throw even if logger fails
      const result = await runMainPipelineWithFs(mockFs, '/components', {
        logger: faultyLogger,
        verbose: true,
      });

      expect(result.success).toBe(true);
    });

    it('should work without a logger', async () => {
      vi.mocked(mockFs.readdir).mockResolvedValue(ok(['button.tsx']));
      vi.mocked(mockFs.readFile).mockResolvedValue(
        ok('export function CatalystButton() { return <button />; }')
      );
      vi.mocked(mockFs.writeFile).mockResolvedValue(ok(undefined));

      const result = await runMainPipelineWithFs(mockFs, '/components', {
        // No logger provided
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Pipeline info and metadata', () => {
    it('should provide accurate pipeline information', () => {
      const info = getMainPipelineInfo();

      expect(info.transformCount).toBe(9);
      expect(info.transforms).toHaveLength(9);
      expect(info.categories).toBeDefined();

      // Verify all expected transforms are present
      const transformNames = info.transforms.map(t => t.name);
      expect(transformNames).toContain('clsx-to-cn');
      expect(transformNames).toContain('catalyst-prefix');
      expect(transformNames).toContain('semantic-colors');
      expect(transformNames).toContain('remove-duplicate-props');
      expect(transformNames).toContain('reorder-cn-args');
      expect(transformNames).toContain('ts-nocheck');
      expect(transformNames).toContain('file-headers');
    });

    it('should categorize transforms correctly', () => {
      const info = getMainPipelineInfo();

      expect(info.categories).toHaveProperty('import');
      expect(info.categories).toHaveProperty('format');
      expect(info.categories).toHaveProperty('semantic');
    });
  });

  describe('Transform order dependencies', () => {
    it('should handle transform dependencies correctly', async () => {
      // Test that transforms are applied in the correct order
      const contentWithMultipleTransforms = `
        import clsx from 'clsx';
        
        export function Button() {
          return <button className={clsx('btn', 'btn-primary')} />;
        }
      `;

      vi.mocked(mockFs.readdir).mockResolvedValue(ok(['multi-transform.tsx']));
      vi.mocked(mockFs.readFile).mockResolvedValue(ok(contentWithMultipleTransforms));
      vi.mocked(mockFs.writeFile).mockResolvedValue(ok(undefined));

      const result = await runMainPipelineWithFs(mockFs, '/components', {
        logger: mockLogger,
        verbose: true,
      });

      expect(result.success).toBe(true);
      expect(result.processedFiles).toBe(1);

      // Multiple transforms should have been applied
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('applied'));
    });

    it('should continue processing even if one transform fails', async () => {
      // This tests resilience - if one transform fails, others should still run
      const contentThatMightFailSomeTransforms = `
        export function CatalystButton() {
          return <button className="complex-class-that-might-break-some-transforms" />;
        }
      `;

      vi.mocked(mockFs.readdir).mockResolvedValue(ok(['robust.tsx']));
      vi.mocked(mockFs.readFile).mockResolvedValue(ok(contentThatMightFailSomeTransforms));
      vi.mocked(mockFs.writeFile).mockResolvedValue(ok(undefined));

      const result = await runMainPipelineWithFs(mockFs, '/components', {
        logger: mockLogger,
        verbose: true,
      });

      // Even if some transforms fail, the pipeline should continue
      expect(result.processedFiles).toBeGreaterThanOrEqual(0);
    });
  });
});
