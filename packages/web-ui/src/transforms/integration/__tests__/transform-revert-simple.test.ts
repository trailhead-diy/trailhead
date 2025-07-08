/**
 * Simple Transform→Revert Test
 *
 * Tests that the transform logging and revert functionality work correctly
 * by verifying that we can track and revert transformations.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { createTempPath, safeJoin } from '@tests/utils/cross-platform-paths.js';

describe('Transform Revert Functionality', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = createTempPath('revert-test');
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should track transformations and generate working revert scripts', async () => {
    // Create a test file with known content
    const testFile = safeJoin(testDir, 'catalyst-test.tsx');
    const originalContent = `import clsx from 'clsx'

export function TestComponent({ className }) {
  return (
    <div className={clsx('bg-zinc-950 text-white', className)}>
      Test Content
    </div>
  )
}
`;

    await fs.writeFile(testFile, originalContent);

    // Run a simple transform (clsx to cn)
    const { transformLogger } = await import('@/transforms/shared/transform-logger.js');
    const sessionId = await transformLogger.startSession({
      srcDir: testDir,
      outDir: testDir,
      verbose: false,
      dryRun: false,
      timestamp: new Date().toISOString(),
    });

    // Manually apply a transform and log it
    const transformedContent = originalContent
      .replace("import clsx from 'clsx'", "import { cn } from '../utils/cn'")
      .replace('clsx(', 'cn(');

    transformLogger.logFileTransform(
      testFile,
      'test-transform',
      'Test clsx to cn conversion',
      'regex',
      originalContent,
      transformedContent,
      [
        {
          from: "import clsx from 'clsx'",
          to: "import { cn } from '../utils/cn'",
          type: 'regex',
          line: 1,
          context: 'Import statement',
        },
        {
          from: 'clsx(',
          to: 'cn(',
          type: 'regex',
          line: 5,
          context: 'Function call',
        },
      ]
    );

    await fs.writeFile(testFile, transformedContent);

    // End session and generate revert script
    await transformLogger.endSession();
    const revertScriptPath = await transformLogger.generateRevertScript(sessionId!);

    // Verify revert script was created
    expect(
      await fs
        .access(revertScriptPath)
        .then(() => true)
        .catch(() => false)
    ).toBe(true);

    // Read the revert script
    const revertScript = await fs.readFile(revertScriptPath, 'utf-8');

    // Verify script contains our file
    expect(revertScript).toContain(testFile);
    expect(revertScript).toContain('Reverting catalyst-test.tsx');

    // The revert script should contain base64 encoded original content
    const encodedOriginal = Buffer.from(originalContent).toString('base64');
    expect(revertScript).toContain(encodedOriginal);

    // Verify transformed file has the changes
    const currentContent = await fs.readFile(testFile, 'utf-8');
    expect(currentContent).toContain("import { cn } from '../utils/cn'");
    expect(currentContent).toContain('cn(');
    expect(currentContent).not.toContain('clsx');
  });

  it('should handle multiple files in a session', async () => {
    // Create multiple test files
    const files = ['component-a.tsx', 'component-b.tsx', 'component-c.tsx'];
    const originalContents = new Map<string, string>();

    for (const filename of files) {
      const content = `// ${filename}
import clsx from 'clsx'
export const ${filename.replace('.tsx', '')} = ({ className }) => (
  <div className={clsx('test', className)}>Content</div>
)
`;
      const filepath = safeJoin(testDir, `catalyst-${filename}`);
      await fs.writeFile(filepath, content);
      originalContents.set(filepath, content);
    }

    // Start transform session
    const { transformLogger } = await import('@/transforms/shared/transform-logger.js');
    const sessionId = await transformLogger.startSession({
      srcDir: testDir,
      outDir: testDir,
      verbose: false,
      dryRun: false,
      timestamp: new Date().toISOString(),
    });

    // Transform each file
    for (const [filepath, originalContent] of originalContents) {
      const transformedContent = originalContent
        .replace("import clsx from 'clsx'", "import { cn } from '../utils/cn'")
        .replace('clsx(', 'cn(');

      transformLogger.logFileTransform(
        filepath,
        'bulk-transform',
        'Bulk clsx to cn conversion',
        'regex',
        originalContent,
        transformedContent,
        [
          {
            from: "import clsx from 'clsx'",
            to: "import { cn } from '../utils/cn'",
            type: 'regex',
          },
        ]
      );

      await fs.writeFile(filepath, transformedContent);
    }

    // End session
    await transformLogger.endSession();
    const revertScriptPath = await transformLogger.generateRevertScript(sessionId!);

    // Read revert script
    const revertScript = await fs.readFile(revertScriptPath, 'utf-8');

    // Verify all files are included
    for (const filename of files) {
      expect(revertScript).toContain(`catalyst-${filename}`);
    }

    // Verify the session tracked all files
    const sessionLogPath = safeJoin(process.cwd(), 'transform-logs', `${sessionId}.json`);
    const sessionData = JSON.parse(await fs.readFile(sessionLogPath, 'utf-8'));

    expect(sessionData.fileTransforms).toHaveLength(3);
    expect(sessionData.summary.filesChanged).toBe(3);
    expect(sessionData.summary.totalChanges).toBe(3);
  });
});
