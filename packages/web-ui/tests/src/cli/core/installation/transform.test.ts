/**
 * High-ROI tests for transform module
 * Focus: Critical path functionality, business logic, error handling, user-facing behavior
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  runColorConversions,
  validateConversions,
  needsConversion,
  getFilesNeedingConversion,
  generateConversionReport,
} from '../../../../../src/cli/core/installation/transform.js';
import { Ok, Err } from '../../../../../src/cli/core/installation/types.js';
import type { InstallConfig, Logger } from '../../../../../src/cli/core/installation/types.js';
import { createMockFileSystem } from '../../../../utils/mock-filesystem.js';

// Mock the shared transform-core module
vi.mock('../../../../../src/cli/core/shared/transform-core.js', () => ({
  executeTransforms: vi.fn(),
  validateTransformConfig: vi.fn(),
}));

// Mock ora spinner
vi.mock('ora', () => {
  const mockSpinner = {
    start: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    warn: vi.fn().mockReturnThis(),
    text: '',
  };
  return {
    default: vi.fn(() => mockSpinner),
  };
});

describe('transform - High-ROI Tests', () => {
  let mockFS: ReturnType<typeof createMockFileSystem>;
  let mockLogger: Logger;
  let config: InstallConfig;

  beforeEach(() => {
    mockFS = createMockFileSystem();
    mockLogger = {
      info: vi.fn(),
      success: vi.fn(),
      warning: vi.fn(),
      error: vi.fn(),
    };
    config = {
      projectRoot: '/project',
      componentsDir: '/project/components',
      libDir: '/project/components/lib',
      catalystDir: '/project/components/lib/catalyst',
      framework: 'nextjs',
    };
    vi.clearAllMocks();
  });

  describe('runColorConversions - Critical Path', () => {
    it('should handle missing catalyst directory gracefully', async () => {
      // Setup: Catalyst directory does not exist
      mockFS.access.mockResolvedValue(
        Err({ code: 'ENOENT', message: 'Directory not found', path: config.catalystDir })
      );

      const result = await runColorConversions(mockFS, mockLogger, config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('ConversionError');
        expect(result.error.message).toContain('Catalyst components directory not found');
      }
    });

    it('should handle transform pipeline failures with user-friendly error messages', async () => {
      // Setup: Directory exists but transform pipeline fails
      mockFS.access.mockResolvedValue(Ok(undefined));

      const { executeTransforms, validateTransformConfig } = await import(
        '../../../../../src/cli/core/shared/transform-core.js'
      );
      (validateTransformConfig as any).mockReturnValue({ success: true });
      (executeTransforms as any).mockResolvedValue({
        success: false,
        error: 'Transform pipeline failed: AST parsing error',
      });

      const result = await runColorConversions(mockFS, mockLogger, config);

      expect(result.success).toBe(true); // Should handle errors gracefully
      if (result.success) {
        expect(result.value.errors).toContain('Transform pipeline failed: AST parsing error');
        expect(result.value.filesModified).toBe(0);
      }
    });

    it('should provide meaningful feedback when no conversions are needed', async () => {
      // Setup: Successful execution with no modifications
      mockFS.access.mockResolvedValue(Ok(undefined));

      const { executeTransforms, validateTransformConfig } = await import(
        '../../../../../src/cli/core/shared/transform-core.js'
      );
      (validateTransformConfig as any).mockReturnValue({ success: true });
      (executeTransforms as any).mockResolvedValue({
        success: true,
        value: {
          filesProcessed: 5,
          filesModified: 0,
          conversionsApplied: 0,
          errors: [],
          warnings: [],
        },
      });

      const result = await runColorConversions(mockFS, mockLogger, config);

      expect(result.success).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'No conversions needed - files already use semantic tokens'
      );
    });

    it('should handle invalid transform configuration with proper error reporting', async () => {
      // Setup: Directory exists but configuration is invalid
      mockFS.access.mockResolvedValue(Ok(undefined));

      const { validateTransformConfig } = await import(
        '../../../../../src/cli/core/shared/transform-core.js'
      );
      (validateTransformConfig as any).mockReturnValue({
        success: false,
        error: 'Invalid source directory path',
      });

      const result = await runColorConversions(mockFS, mockLogger, config);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('ConversionError');
        expect(result.error.message).toContain('Invalid transform configuration');
      }
    });

    it('should report successful conversions with detailed statistics', async () => {
      // Setup: Successful conversion with modifications
      mockFS.access.mockResolvedValue(Ok(undefined));

      const { executeTransforms, validateTransformConfig } = await import(
        '../../../../../src/cli/core/shared/transform-core.js'
      );
      (validateTransformConfig as any).mockReturnValue({ success: true });
      (executeTransforms as any).mockResolvedValue({
        success: true,
        value: {
          filesProcessed: 10,
          filesModified: 5,
          conversionsApplied: 25,
          errors: [],
          warnings: ['Minor formatting adjustment in button.tsx'],
        },
      });

      const result = await runColorConversions(mockFS, mockLogger, config);

      expect(result.success).toBe(true);
      expect(mockLogger.success).toHaveBeenCalledWith(
        'Transform pipeline completed: 5 files modified'
      );
      expect(mockLogger.info).toHaveBeenCalledWith('Applied 25 semantic token conversions');
      expect(mockLogger.warning).toHaveBeenCalledWith('Transform warnings (1):');
    });
  });

  describe('validateConversions - Business Logic', () => {
    it('should detect semantic tokens in converted components', async () => {
      // Setup: Files contain semantic tokens
      mockFS.access.mockResolvedValue(Ok(undefined));
      mockFS.readFile.mockImplementation(async (filePath: string) => {
        if (filePath.includes('button.tsx')) {
          return Ok(
            'export const Button = () => <button className="bg-primary text-primary-foreground">Test</button>'
          );
        }
        return Err({ type: 'FileSystemError', message: 'File not found', path: filePath });
      });

      const result = await validateConversions(mockFS, mockLogger, config);

      expect(result.success).toBe(true);
      expect(result.value).toBe(true);
    });

    it('should warn when semantic tokens are not detected', async () => {
      // Setup: Files do not contain semantic tokens
      mockFS.access.mockResolvedValue(Ok(undefined));
      mockFS.readFile.mockImplementation(async (filePath: string) => {
        if (filePath.includes('button.tsx')) {
          return Ok(
            'export const Button = () => <button className="bg-zinc-500 text-white">Test</button>'
          );
        }
        return Err({ type: 'FileSystemError', message: 'File not found', path: filePath });
      });

      const result = await validateConversions(mockFS, mockLogger, config);

      expect(result.success).toBe(true);
      expect(result.value).toBe(false);
    });

    it('should handle file read errors gracefully during validation', async () => {
      // Setup: Files exist but cannot be read
      mockFS.access.mockResolvedValue(Ok(undefined));
      mockFS.readFile.mockResolvedValue(
        Err({ type: 'FileSystemError', message: 'Permission denied', path: '/restricted/file' })
      );

      const result = await validateConversions(mockFS, mockLogger, config);

      expect(result.success).toBe(true);
      expect(result.value).toBe(false); // Should handle errors gracefully
    });
  });

  describe('needsConversion - File Analysis', () => {
    it('should identify files with hardcoded zinc colors that need conversion', async () => {
      const content = 'className="bg-zinc-500 text-zinc-900 border-zinc-200"';
      mockFS.readFile.mockResolvedValue(Ok(content));

      const result = await needsConversion(mockFS, '/components/button.tsx');

      expect(result.success).toBe(true);
      expect(result.value).toBe(true);
    });

    it('should identify files with hardcoded slate colors that need conversion', async () => {
      const content = 'className="bg-slate-100 text-slate-800"';
      mockFS.readFile.mockResolvedValue(Ok(content));

      const result = await needsConversion(mockFS, '/components/input.tsx');

      expect(result.success).toBe(true);
      expect(result.value).toBe(true);
    });

    it('should correctly identify files that already use semantic tokens', async () => {
      const content = 'className="bg-primary text-primary-foreground border-border"';
      mockFS.readFile.mockResolvedValue(Ok(content));

      const result = await needsConversion(mockFS, '/components/button.tsx');

      expect(result.success).toBe(true);
      expect(result.value).toBe(false);
    });

    it('should handle file read errors during conversion analysis', async () => {
      mockFS.readFile.mockResolvedValue(
        Err({ type: 'FileSystemError', message: 'File not accessible', path: '/restricted/file' })
      );

      const result = await needsConversion(mockFS, '/restricted/file');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('ConversionError');
        expect(result.error.message).toBe('Failed to read file for conversion check');
      }
    });
  });

  describe('getFilesNeedingConversion - Integration', () => {
    it('should identify all TSX files that need color token conversion', async () => {
      // Setup: Directory with mixed files - some need conversion, others don't
      mockFS.readdir.mockResolvedValue(
        Ok(['button.tsx', 'input.tsx', 'alert.tsx', 'types.ts', 'styles.css'])
      );

      mockFS.readFile.mockImplementation(async (filePath: string) => {
        if (filePath.includes('button.tsx')) {
          return Ok('className="bg-zinc-500"'); // Needs conversion
        }
        if (filePath.includes('input.tsx')) {
          return Ok('className="bg-primary"'); // Already converted
        }
        if (filePath.includes('alert.tsx')) {
          return Ok('className="bg-slate-100"'); // Needs conversion
        }
        return Ok('// No colors');
      });

      const result = await getFilesNeedingConversion(mockFS, '/components/catalyst');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual(['button.tsx', 'alert.tsx']);
      }
    });

    it('should handle directory read errors gracefully', async () => {
      mockFS.readdir.mockResolvedValue(
        Err({ type: 'FileSystemError', message: 'Directory not found', path: '/missing/dir' })
      );

      const result = await getFilesNeedingConversion(mockFS, '/missing/dir');

      expect(result.success).toBe(false);
    });

    it('should filter out non-TSX files from conversion analysis', async () => {
      mockFS.readdir.mockResolvedValue(Ok(['button.tsx', 'styles.css', 'types.ts', 'readme.md']));
      mockFS.readFile.mockResolvedValue(Ok('className="bg-zinc-500"'));

      const result = await getFilesNeedingConversion(mockFS, '/components');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual(['button.tsx']);
      }
    });
  });

  describe('generateConversionReport - User Communication', () => {
    it('should generate helpful report for successful conversions', () => {
      const stats = {
        filesProcessed: 10,
        filesModified: 5,
        conversionsApplied: 25,
        errors: [],
      };

      const report = generateConversionReport(stats);

      expect(report).toContain('🎨 Color Conversion Summary');
      expect(report).toContain('Files processed: 10');
      expect(report).toContain('Files modified: 5');
      expect(report).toContain('Conversions applied: 25');
      expect(report).toContain('✅ Components now use semantic color tokens');
      expect(report).toContain('   This enables dynamic theming with Trailhead UI');
    });

    it('should generate informative report when no conversions are needed', () => {
      const stats = {
        filesProcessed: 10,
        filesModified: 0,
        conversionsApplied: 0,
        errors: [],
      };

      const report = generateConversionReport(stats);

      expect(report).toContain('ℹ️  No conversions were needed');
      expect(report).toContain('   Components already use semantic tokens');
    });

    it('should include warnings and errors in conversion report', () => {
      const stats = {
        filesProcessed: 10,
        filesModified: 3,
        conversionsApplied: 15,
        errors: [
          'Warning: Unusual color pattern in custom-component.tsx',
          'Minor: Formatting adjusted',
        ],
      };

      const report = generateConversionReport(stats);

      expect(report).toContain('Warnings: 2');
      expect(report).toContain('  • Warning: Unusual color pattern in custom-component.tsx');
      expect(report).toContain('  • Minor: Formatting adjusted');
    });

    it('should provide user guidance for empty conversion results', () => {
      const stats = {
        filesProcessed: 0,
        filesModified: 0,
        conversionsApplied: 0,
        errors: ['No catalyst files found'],
      };

      const report = generateConversionReport(stats);

      expect(report).toContain('Files processed: 0');
      expect(report).toContain('Warnings: 1');
      expect(report).toContain('  • No catalyst files found');
    });
  });
});
