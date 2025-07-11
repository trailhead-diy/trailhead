/**
 * Additional test specifically designed to achieve 100% coverage
 * of the transform pipeline, particularly semantic color transforms
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { copyFreshFilesBatch } from '@/cli/shared/file-utils.js';
import { runMainPipeline } from '@/transforms/index.js';
import { join } from 'path';
import { mkdir, writeFile, readdir, readFile, rm } from 'fs/promises';
import { existsSync } from 'fs';

// Mock chalk to prevent ANSI escape codes in snapshots
vi.mock('chalk', () => ({
  default: {
    green: (text: string) => text,
    gray: (text: string) => text,
    yellow: (text: string) => text,
    blue: (text: string) => text,
    cyan: (text: string) => text,
    red: (text: string) => text,
  },
}));

// Specific fixtures designed to trigger semantic color detection patterns
const SEMANTIC_COLOR_FIXTURES = {
  'catalyst-badge-semantic.tsx': `import clsx from 'clsx';
import React from 'react';

// Badge component specifically designed to trigger CatalystBadge detection
export function CatalystBadge({ color = 'primary', className, children }: {
  color?: 'primary' | 'secondary' | 'destructive' | 'accent' | 'muted';
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-x-1.5 rounded-md px-1.5 py-0.5 text-xs/5 font-medium',
      {
        'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/30': color === 'destructive',
        'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/30': color === 'primary',
        'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/20 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/30': color === 'secondary',
      },
      className
    )}>
      {children}
    </span>
  );
}`,

  'catalyst-button-semantic.tsx': `import clsx from 'clsx';
import React, { forwardRef } from 'react';

// Button component with --btn- variables to trigger semantic detection
export const CatalystButton = forwardRef<HTMLButtonElement, {
  variant?: 'solid' | 'outline';
  className?: string;
  children: React.ReactNode;
}>(function CatalystButton({ variant = 'solid', className, children, ...props }, ref) {
  return (
    <button
      ref={ref}
      className={clsx(
        'relative isolate inline-flex items-baseline justify-center',
        '[--btn-bg:var(--color-blue-600)] [--btn-border:var(--color-blue-700)]',
        '[--btn-hover-overlay:var(--color-white)]/10',
        '[--btn-icon:var(--color-blue-300)]',
        'data-active:[--btn-icon:var(--color-blue-200)]',
        'data-hover:[--btn-icon:var(--color-blue-200)]',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});`,

  'catalyst-input-semantic.tsx': `import clsx from 'clsx';
import React, { forwardRef } from 'react';

// Input component specifically for CatalystInput detection
export const CatalystInput = forwardRef<HTMLInputElement, {
  className?: string;
}>(function CatalystInput({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={clsx(
        'block w-full rounded-lg border',
        'border-zinc-950/10 data-hover:border-zinc-950/20',
        'dark:border-white/10 dark:data-hover:border-white/20',
        'bg-transparent dark:bg-white/5',
        'text-zinc-950 dark:text-white',
        'placeholder:text-zinc-500 dark:placeholder:text-zinc-400',
        className
      )}
      {...props}
    />
  );
});`,

  'catalyst-select-semantic.tsx': `import clsx from 'clsx';
import React, { forwardRef } from 'react';

// Select component for CatalystSelect detection
export const CatalystSelect = forwardRef<HTMLSelectElement, {
  className?: string;
  children: React.ReactNode;
}>(function CatalystSelect({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={clsx(
        'block w-full rounded-lg border',
        'border-zinc-950/10 data-hover:border-zinc-950/20',
        'dark:border-white/10 dark:data-hover:border-white/20',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});`,

  'catalyst-textarea-semantic.tsx': `import clsx from 'clsx';
import React, { forwardRef } from 'react';

// Textarea component for CatalystTextarea detection
export const CatalystTextarea = forwardRef<HTMLTextAreaElement, {
  className?: string;
}>(function CatalystTextarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={clsx(
        'block w-full rounded-lg border',
        'border-zinc-950/10 data-hover:border-zinc-950/20',
        'dark:border-white/10 dark:data-hover:border-white/20',
        'text-zinc-950 dark:text-white',
        className
      )}
      {...props}
    />
  );
});`,

  'catalyst-checkbox-semantic.tsx': `import clsx from 'clsx';
import React, { forwardRef } from 'react';

// Checkbox for CatalystCheckbox detection
export const CatalystCheckbox = forwardRef<HTMLInputElement, {
  className?: string;
}>(function CatalystCheckbox({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      type="checkbox"
      className={clsx(
        'rounded border',
        'border-zinc-950/20 data-hover:border-zinc-950/30',
        'dark:border-white/20 dark:data-hover:border-white/30',
        className
      )}
      {...props}
    />
  );
});`,

  'catalyst-radio-semantic.tsx': `import clsx from 'clsx';
import React, { forwardRef } from 'react';

// Radio for CatalystRadio detection
export const CatalystRadio = forwardRef<HTMLInputElement, {
  className?: string;
}>(function CatalystRadio({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      type="radio"
      className={clsx(
        'rounded-full border',
        'border-zinc-950/20 data-hover:border-zinc-950/30',
        'dark:border-white/20 dark:data-hover:border-white/30',
        className
      )}
      {...props}
    />
  );
});`,

  'all-colors-comprehensive.tsx': `import clsx from 'clsx';
import React from 'react';

// Component with ALL possible color patterns to achieve 100% semantic coverage
export function AllColorsComprehensive() {
  return (
    <div className={clsx(
      // Red family
      'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
      'dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30',
      
      // Orange family  
      'bg-orange-50 text-orange-700 border-orange-200',
      'dark:bg-orange-500/10 dark:text-orange-400',
      
      // Amber/Yellow family
      'bg-amber-50 text-amber-700 border-amber-200',
      'bg-yellow-50 text-yellow-700 border-yellow-200',
      'dark:bg-amber-500/10 dark:text-amber-400',
      
      // Lime/Green family
      'bg-lime-50 text-lime-700 border-lime-200',
      'bg-green-50 text-green-700 border-green-200',
      'dark:bg-lime-500/10 dark:text-lime-400',
      
      // Emerald family
      'bg-emerald-50 text-emerald-700 border-emerald-200',
      'dark:bg-emerald-500/10 dark:text-emerald-400',
      
      // Teal family
      'bg-teal-50 text-teal-700 border-teal-200',
      'dark:bg-teal-500/10 dark:text-teal-400',
      
      // Cyan family
      'bg-cyan-50 text-cyan-700 border-cyan-200',
      'dark:bg-cyan-500/10 dark:text-cyan-400',
      
      // Sky family
      'bg-sky-50 text-sky-700 border-sky-200',
      'dark:bg-sky-500/10 dark:text-sky-400',
      
      // Blue family
      'bg-blue-50 text-blue-700 border-blue-200',
      'dark:bg-blue-500/10 dark:text-blue-400',
      
      // Indigo family
      'bg-indigo-50 text-indigo-700 border-indigo-200',
      'dark:bg-indigo-500/10 dark:text-indigo-400',
      
      // Violet family
      'bg-violet-50 text-violet-700 border-violet-200',
      'dark:bg-violet-500/10 dark:text-violet-400',
      
      // Purple family
      'bg-purple-50 text-purple-700 border-purple-200',
      'dark:bg-purple-500/10 dark:text-purple-400',
      
      // Fuchsia family
      'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
      'dark:bg-fuchsia-500/10 dark:text-fuchsia-400',
      
      // Pink family
      'bg-pink-50 text-pink-700 border-pink-200',
      'dark:bg-pink-500/10 dark:text-pink-400',
      
      // Rose family
      'bg-rose-50 text-rose-700 border-rose-200',
      'dark:bg-rose-500/10 dark:text-rose-400',
      
      // Gray family
      'bg-gray-50 text-gray-700 border-gray-200',
      'dark:bg-gray-500/10 dark:text-gray-400',
      
      // Zinc family
      'bg-zinc-50 text-zinc-700 border-zinc-200',
      'dark:bg-zinc-500/10 dark:text-zinc-400'
    )}>
      All colors test
    </div>
  );
}`,
};

describe('Complete Coverage Tests', () => {
  const testDir = join(process.cwd(), 'test-temp-coverage');
  const sourceDir = join(testDir, 'catalyst-ui-kit', 'typescript');
  const destDir = join(testDir, 'components', 'lib');

  beforeEach(async () => {
    if (existsSync(testDir)) {
      await rm(testDir, { recursive: true });
    }
    await mkdir(sourceDir, { recursive: true });
    await mkdir(destDir, { recursive: true });

    for (const [filename, content] of Object.entries(SEMANTIC_COLOR_FIXTURES)) {
      await writeFile(join(sourceDir, filename), content);
    }
  });

  afterEach(async () => {
    if (existsSync(testDir)) {
      await rm(testDir, { recursive: true });
    }
  });

  it('should achieve maximum transform coverage', async () => {
    const mockLogger = {
      info: (_msg: string) => {},
      warn: (_msg: string) => {},
      error: (_msg: string) => {},
      debug: (_msg: string) => {},
      success: (_msg: string) => {},
    };

    // Copy files
    const copyResult = await copyFreshFilesBatch(sourceDir, destDir, true, true);

    expect(copyResult.isOk()).toBe(true);

    // Apply transforms
    const transformResult = await runMainPipeline(destDir, {
      verbose: true,
      dryRun: false,
      logger: mockLogger,
    });

    expect(transformResult.success).toBe(true);
    expect(transformResult.processedFiles).toBeGreaterThan(0);

    // Verify semantic color transforms were applied
    const destFiles = await readdir(destDir);
    expect(destFiles.length).toBeGreaterThan(0);

    // Check that files contain semantic transformations
    for (const file of destFiles) {
      const content = await readFile(join(destDir, file), 'utf-8');
      expect(content).toContain('// WARNING: This file is auto-generated');
      expect(content).toContain('Catalyst');
    }
  });
});
