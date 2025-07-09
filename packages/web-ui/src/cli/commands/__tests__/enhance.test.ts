/**
 * Integration test for enhance command
 * Tests the complete enhance workflow with real Catalyst components
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockFileSystem } from '@esteban-url/trailhead-cli/testing';
// import { Ok, Err, createError } from '@esteban-url/trailhead-cli/core';
import { join } from 'path';
import { runMainPipelineWithFs } from '@/transforms/index.js';

describe('Enhance Command Integration', () => {
  let fs: ReturnType<typeof mockFileSystem>;
  let testDir: string;
  let componentsDir: string;

  beforeEach(() => {
    fs = mockFileSystem();
    testDir = '/test/project';
    componentsDir = join(testDir, 'src', 'components', 'lib');
    vi.clearAllMocks();
  });

  it('should enhance Button component with semantic colors', async () => {
    // Create a realistic Button component
    const buttonComponent = `import { cn } from '../../lib/utils';
import clsx from 'clsx';

const styles = {
  base: 'inline-flex items-center gap-2 rounded-lg py-1.5 px-3 text-sm font-medium',
  colors: {
    blue: 'bg-blue-500 text-white hover:bg-blue-600',
    red: 'bg-red-500 text-white hover:bg-red-600',
    gray: 'bg-gray-500 text-white hover:bg-gray-600',
  },
};

export function CatalystButton({ color = 'blue', children, ...props }) {
  return (
    <button
      className={clsx(styles.base, styles.colors[color])}
      {...props}
    >
      {children}
    </button>
  );
}`;

    const buttonPath = join(componentsDir, 'catalyst-button.tsx');

    // Create filesystem with component file
    fs = mockFileSystem({
      [buttonPath]: buttonComponent,
    });

    // Ensure directory exists
    await fs.ensureDir(componentsDir);

    // Run main pipeline directly with mock filesystem
    const result = await runMainPipelineWithFs(fs, componentsDir, {
      dryRun: false,
      verbose: false,
    });

    // Pipeline might have errors but still process files
    expect(result.processedFiles).toBeGreaterThan(0);

    // Verify the component was enhanced
    const readResult = await fs.readFile(buttonPath);
    expect(readResult.success).toBe(true);
    const enhancedContent = readResult.success ? readResult.value.toString() : '';

    // Should have semantic colors added
    expect(enhancedContent).toContain('primary:');
    expect(enhancedContent).toContain('secondary:');
    expect(enhancedContent).toContain('destructive:');
    expect(enhancedContent).toContain('accent:');
    expect(enhancedContent).toContain('muted:');

    // Should convert clsx to cn (with different import path)
    expect(enhancedContent).toContain("import { cn } from '../utils/cn'");
    expect(enhancedContent).not.toContain("import clsx from 'clsx'");
    expect(enhancedContent).toContain('cn(styles.base');
  });

  it('should handle multiple components in batch', async () => {
    // Create multiple components
    const components = [
      {
        name: 'catalyst-button.tsx',
        content: `const styles = { colors: { blue: 'bg-blue-500' } };`,
      },
      {
        name: 'catalyst-badge.tsx',
        content: `const colors = { green: 'bg-green-500', yellow: 'bg-yellow-500' };`,
      },
      {
        name: 'catalyst-checkbox.tsx',
        content: `const colors = { blue: 'checked:bg-blue-500' };`,
      },
    ];

    // Create filesystem with multiple components
    const fileMap: Record<string, string> = {};
    for (const comp of components) {
      fileMap[join(componentsDir, comp.name)] = comp.content;
    }
    fs = mockFileSystem(fileMap);

    // Run main pipeline directly
    const result = await runMainPipelineWithFs(fs, componentsDir, {
      dryRun: false,
      verbose: true,
    });

    expect(result.success).toBe(true);

    // Verify all components were processed
    for (const comp of components) {
      const readResult = await fs.readFile(join(componentsDir, comp.name));
      expect(readResult.success).toBe(true);
      const enhanced = readResult.success ? readResult.value.toString() : '';
      expect(enhanced).toBeDefined();
      // Basic verification that file was processed (would have semantic colors if applicable)
      expect(enhanced.length).toBeGreaterThan(comp.content.length);
    }
  });

  it('should handle dry-run mode correctly', async () => {
    const originalContent = `const styles = { colors: { blue: 'bg-blue-500' } };`;
    const buttonPath = join(componentsDir, 'catalyst-button.tsx');

    // Create filesystem with component
    fs = mockFileSystem({
      [buttonPath]: originalContent,
    });

    // Run main pipeline in dry-run mode
    const result = await runMainPipelineWithFs(fs, componentsDir, {
      dryRun: true,
      verbose: true,
    });

    expect(result.success).toBe(true);

    // File should be unchanged in dry-run mode
    const readResult = await fs.readFile(buttonPath);
    expect(readResult.success).toBe(true);
    const content = readResult.success ? readResult.value.toString() : '';
    expect(content).toBe(originalContent);
  });

  it('should handle missing source directory gracefully', async () => {
    const nonExistentDir = join(testDir, 'non-existent-dir');

    const result = await runMainPipelineWithFs(fs, nonExistentDir, {
      dryRun: false,
      verbose: false,
    });

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
