/**
 * Integration test for enhance command
 * Tests the complete enhance workflow with real Catalyst components
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { runSimplifiedPipeline } from '../../src/transforms/pipelines/simplified.js';

describe('Enhance Command Integration', () => {
  let testDir: string;
  let componentsDir: string;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = await mkdtemp(join(tmpdir(), 'trailhead-enhance-test-'));
    componentsDir = join(testDir, 'src', 'components', 'lib');
    await mkdir(componentsDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    await rm(testDir, { recursive: true, force: true });
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

export function Button({ color = 'blue', children, ...props }) {
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
    await writeFile(buttonPath, buttonComponent);

    // Run simplified pipeline directly
    const result = await runSimplifiedPipeline(componentsDir, {
      dryRun: false,
      verbose: false,
    });

    expect(result.success).toBe(true);

    // Verify the component was enhanced
    const enhancedContent = await readFile(buttonPath, 'utf-8');

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

    for (const comp of components) {
      await writeFile(join(componentsDir, comp.name), comp.content);
    }

    // Run simplified pipeline directly
    const result = await runSimplifiedPipeline(componentsDir, {
      dryRun: false,
      verbose: true,
    });

    expect(result.success).toBe(true);

    // Verify all components were processed
    for (const comp of components) {
      const enhanced = await readFile(join(componentsDir, comp.name), 'utf-8');
      expect(enhanced).toBeDefined();
      // Basic verification that file was processed (would have semantic colors if applicable)
      expect(enhanced.length).toBeGreaterThan(comp.content.length);
    }
  });

  it('should handle dry-run mode correctly', async () => {
    const originalContent = `const styles = { colors: { blue: 'bg-blue-500' } };`;
    const buttonPath = join(componentsDir, 'catalyst-button.tsx');
    await writeFile(buttonPath, originalContent);

    // Run simplified pipeline in dry-run mode
    const result = await runSimplifiedPipeline(componentsDir, {
      dryRun: true,
      verbose: true,
    });

    expect(result.success).toBe(true);

    // File should be unchanged in dry-run mode
    const content = await readFile(buttonPath, 'utf-8');
    expect(content).toBe(originalContent);
  });

  it('should handle missing source directory gracefully', async () => {
    const nonExistentDir = join(testDir, 'non-existent-dir');

    const result = await runSimplifiedPipeline(nonExistentDir, {
      dryRun: false,
      verbose: false,
    });

    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
