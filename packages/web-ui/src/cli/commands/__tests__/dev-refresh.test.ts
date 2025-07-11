/**
 * Snapshot test for dev-refresh command execution
 * Tests the actual output of running the command on original Catalyst files
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

// Comprehensive Catalyst component fixtures designed to achieve 100% transform coverage
const CATALYST_FIXTURES = {
  'alert.tsx': `import clsx from 'clsx';
import React from 'react';

export function Alert({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={clsx('rounded-lg bg-blue-50 p-4 text-blue-700 dark:bg-blue-500/10', className)}>
      {children}
    </div>
  );
}`,

  'auth-layout.tsx': `import React from 'react';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      {children}
    </div>
  );
}`,

  'avatar.tsx': `import clsx from 'clsx';
import React from 'react';

export function Avatar({ className, src, alt }: { className?: string; src?: string; alt?: string }) {
  return (
    <img
      className={clsx('h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600', className)}
      src={src}
      alt={alt}
    />
  );
}`,

  'badge.tsx': `import clsx from 'clsx';
import React from 'react';

// Complex Badge component designed for semantic color detection after prefixing
export function Badge({ color = 'gray', className, children, ...props }: {
  color?: 'red' | 'blue' | 'gray' | 'zinc' | 'green' | 'yellow' | 'orange' | 'purple';
  className?: string;
  children: React.ReactNode;
} & React.ComponentPropsWithoutRef<'span'>) {
  return (
    <span 
      className={clsx(
        // This specific pattern should trigger CatalystBadge detection after prefixing
        'inline-flex items-center gap-x-1.5 rounded-md px-1.5 py-0.5 text-xs/5 font-medium sm:text-[0.8125rem]/5 forced-colors:outline',
        {
          'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/30': color === 'red',
          'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-400 dark:ring-orange-500/30': color === 'orange',
          'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30': color === 'yellow',
          'bg-lime-50 text-lime-700 ring-1 ring-inset ring-lime-600/20 dark:bg-lime-500/10 dark:text-lime-400 dark:ring-lime-500/30': color === 'green',
          'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/30': color === 'blue',
          'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20 dark:bg-purple-500/10 dark:text-purple-400 dark:ring-purple-500/30': color === 'purple',
          'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/20 dark:bg-gray-400/10 dark:text-gray-400 dark:ring-gray-400/30': color === 'gray',
          'bg-zinc-50 text-zinc-600 ring-1 ring-inset ring-zinc-500/20 dark:bg-zinc-400/10 dark:text-zinc-400 dark:ring-zinc-400/30': color === 'zinc',
        },
        className
      )}
      {...props}
      {...props}
    >
      {children}
    </span>
  );
}`,

  'button.tsx': `import clsx from 'clsx';
import React, { forwardRef } from 'react';
import { Link } from './link';

// Complex Button with --btn- CSS variables to trigger semantic color detection
const styles = {
  base: [
    'relative isolate inline-flex items-baseline justify-center gap-x-2 rounded-lg border text-base/6 font-semibold',
    'px-[calc(--spacing(3.5)-1px)] py-[calc(--spacing(2.5)-1px)] sm:px-[calc(--spacing(3)-1px)]',
    'focus:not-data-focus:outline-hidden data-focus:outline-2 data-focus:outline-offset-2 data-focus:outline-blue-500',
    '[--btn-icon:var(--color-zinc-500)] data-active:[--btn-icon:var(--color-zinc-700)]',
  ],
  solid: [
    'border-transparent bg-(--btn-border)',
    'dark:bg-(--btn-bg)',
    'before:absolute before:inset-0 before:-z-10 before:rounded-[calc(var(--radius-lg)-1px)] before:bg-(--btn-bg)',
    'data-active:after:bg-(--btn-hover-overlay) data-hover:after:bg-(--btn-hover-overlay)',
  ],
  outline: [
    'border-zinc-950/10 text-zinc-950 data-active:bg-zinc-950/2.5 data-hover:bg-zinc-950/2.5',
    'dark:border-white/15 dark:text-white dark:[--btn-bg:transparent]',
  ],
};

export const Button = forwardRef<HTMLButtonElement, {
  variant?: 'solid' | 'outline';
  className?: string;
  children: React.ReactNode;
  href?: string;
} & React.ComponentPropsWithoutRef<'button'>>(
  function Button({ variant = 'solid', className, children, href, ...props }, ref) {
    const classes = clsx(className, styles.base, styles[variant]);
    
    return href ? (
      <Link href={href} className={classes} {...props} {...props}>
        {children}
      </Link>
    ) : (
      <button
        ref={ref}
        className={classes}
        {...props}
        {...props}
      >
        {children}
      </button>
    );
  }
);`,

  'checkbox.tsx': `import clsx from 'clsx';
import React, { forwardRef } from 'react';

export const Checkbox = forwardRef<HTMLInputElement, {
  className?: string;
} & React.ComponentPropsWithoutRef<'input'>>(
  function Checkbox({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        type="checkbox"
        className={clsx(
          'h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600',
          className
        )}
        {...props}
      />
    );
  }
);`,

  'combobox.tsx': `import clsx from 'clsx';
import React from 'react';

export function Combobox({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={clsx('relative', className)}>
      {children}
    </div>
  );
}`,

  'description-list.tsx': `import clsx from 'clsx';
import React from 'react';

export function DescriptionList({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <dl className={clsx('space-y-4', className)}>
      {children}
    </dl>
  );
}

export function DescriptionTerm({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <dt className={clsx('text-sm font-medium text-gray-900 dark:text-white', className)}>
      {children}
    </dt>
  );
}`,

  'dialog.tsx': `import * as Headless from '@headlessui/react';
import clsx from 'clsx';
import React from 'react';

// Complex Dialog with Headless UI to test @headlessui import handling
export function Dialog({ 
  className, 
  children, 
  isOpen, 
  onClose,
  ...props 
}: { 
  className?: string; 
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
} & React.ComponentPropsWithoutRef<'div'>) {
  return (
    <Headless.Dialog 
      open={isOpen} 
      onClose={onClose}
      className={clsx('fixed inset-0 z-50', className)}
      {...props}
      {...props}
    >
      <Headless.DialogBackdrop className="fixed inset-0 bg-black/25" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Headless.DialogPanel className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-800">
          {children}
        </Headless.DialogPanel>
      </div>
    </Headless.Dialog>
  );
}`,

  'divider.tsx': `import clsx from 'clsx';
import React from 'react';

export function Divider({ className }: { className?: string }) {
  return (
    <hr className={clsx('border-gray-200 dark:border-gray-700', className)} />
  );
}`,

  'dropdown.tsx': `import clsx from 'clsx';
import React from 'react';

export function Dropdown({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={clsx('relative inline-block', className)}>
      {children}
    </div>
  );
}`,

  'fieldset.tsx': `import clsx from 'clsx';
import React from 'react';

export function Fieldset({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <fieldset className={clsx('space-y-4', className)}>
      {children}
    </fieldset>
  );
}`,

  'heading.tsx': `import clsx from 'clsx';
import React from 'react';

export function Heading({ level = 1, className, children }: {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
  children: React.ReactNode;
}) {
  const Component = \`h\${level}\` as keyof JSX.IntrinsicElements;
  return (
    <Component className={clsx('font-semibold text-gray-900 dark:text-white', className)}>
      {children}
    </Component>
  );
}`,

  'input.tsx': `import * as Headless from '@headlessui/react';
import clsx from 'clsx';
import React, { forwardRef } from 'react';

// Complex Input with data attributes and multiple color patterns
export function InputGroup({ 
  children, 
  className,
  ...props 
}: React.ComponentPropsWithoutRef<'span'>) {
  return (
    <span
      data-slot="control"
      className={clsx(
        'relative isolate block',
        'has-[[data-slot=icon]:first-child]:[&_input]:pl-10 has-[[data-slot=icon]:last-child]:[&_input]:pr-10',
        '*:data-[slot=icon]:pointer-events-none *:data-[slot=icon]:absolute *:data-[slot=icon]:top-3',
        '*:data-[slot=icon]:text-zinc-500 dark:*:data-[slot=icon]:text-zinc-400',
        className
      )}
      {...props}
      {...props}
    >
      {children}
    </span>
  );
}

export const Input = forwardRef<HTMLInputElement, {
  className?: string;
  invalid?: boolean;
} & React.ComponentPropsWithoutRef<'input'>>(
  function Input({ className, invalid, ...props }, ref) {
    return (
      <Headless.Field>
        <span
          data-slot="control"
          className={clsx([
            'relative isolate block',
            'group-has-[[data-slot=description]]:has-[[data-slot=description]]:mt-3',
            className,
          ])}
        >
          <input
            ref={ref}
            {...props}
            {...props}
            data-invalid={invalid}
            className={clsx([
              'relative block w-full appearance-none rounded-lg px-[calc(var(--spacing(3))-1px)]',
              'text-base/6 text-zinc-950 placeholder:text-zinc-500 sm:text-sm/6 dark:text-white',
              'border border-zinc-950/10 data-hover:border-zinc-950/20 dark:border-white/10',
              'bg-transparent dark:bg-white/5',
              'focus:outline-none',
              'data-invalid:border-red-500 data-invalid:data-hover:border-red-500',
              'data-disabled:border-zinc-950/20 data-disabled:bg-zinc-950/5',
            ])}
          />
        </span>
      </Headless.Field>
    );
  }
);`,

  'link.tsx': `import clsx from 'clsx';
import React, { forwardRef } from 'react';
import { Button } from './button';
import { Badge } from './badge';

export const Link = forwardRef<HTMLAnchorElement, {
  className?: string;
  children: React.ReactNode;
  variant?: 'button' | 'badge' | 'default';
} & React.ComponentPropsWithoutRef<'a'>>(
  function Link({ className, children, variant = 'default', ...props }, ref) {
    if (variant === 'button') {
      return <Button {...props} className={className}>{children}</Button>;
    }
    
    if (variant === 'badge') {
      return <Badge {...props} className={className}>{children}</Badge>;
    }

    return (
      <a
        ref={ref}
        className={clsx('text-blue-600 hover:text-blue-800 dark:text-blue-400', className)}
        {...props}
        {...props}
      >
        {children}
      </a>
    );
  }
);`,

  'listbox.tsx': `import clsx from 'clsx';
import React from 'react';

export function Listbox({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={clsx('space-y-1', className)}>
      {children}
    </div>
  );
}`,

  'navbar.tsx': `import clsx from 'clsx';
import React from 'react';

export function Navbar({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <nav className={clsx('bg-white shadow dark:bg-gray-800', className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </nav>
  );
}`,

  'pagination.tsx': `import clsx from 'clsx';
import React from 'react';

export function Pagination({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <nav className={clsx('flex items-center justify-between', className)}>
      {children}
    </nav>
  );
}`,

  'radio.tsx': `import clsx from 'clsx';
import React, { forwardRef } from 'react';

export const Radio = forwardRef<HTMLInputElement, {
  className?: string;
} & React.ComponentPropsWithoutRef<'input'>>(
  function Radio({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        type="radio"
        className={clsx(
          'h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600',
          className
        )}
        {...props}
      />
    );
  }
);`,

  'select.tsx': `import clsx from 'clsx';
import React, { forwardRef } from 'react';

export const Select = forwardRef<HTMLSelectElement, {
  className?: string;
  children: React.ReactNode;
} & React.ComponentPropsWithoutRef<'select'>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={clsx(
          'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700',
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);`,

  'sidebar-layout.tsx': `import React from 'react';

export function SidebarLayout({ sidebar, children }: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <div className="w-64 bg-gray-50 dark:bg-gray-900">
        {sidebar}
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}`,

  'sidebar.tsx': `import clsx from 'clsx';
import React from 'react';

export function Sidebar({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={clsx('h-full w-64 bg-gray-50 dark:bg-gray-900', className)}>
      {children}
    </div>
  );
}`,

  'stacked-layout.tsx': `import React from 'react';

export function StackedLayout({ navbar, children }: {
  navbar: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {navbar}
      <main>
        {children}
      </main>
    </div>
  );
}`,

  'switch.tsx': `import clsx from 'clsx';
import React, { forwardRef } from 'react';

export const Switch = forwardRef<HTMLInputElement, {
  className?: string;
} & React.ComponentPropsWithoutRef<'input'>>(
  function Switch({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        type="checkbox"
        role="switch"
        className={clsx(
          'h-6 w-11 rounded-full border-2 border-transparent bg-gray-200 dark:bg-gray-700',
          className
        )}
        {...props}
      />
    );
  }
);`,

  'table.tsx': `import clsx from 'clsx';
import React from 'react';

export function Table({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <table className={clsx('min-w-full divide-y divide-gray-200 dark:divide-gray-700', className)}>
      {children}
    </table>
  );
}

export function TableHead({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <thead className={clsx('bg-gray-50 dark:bg-gray-800', className)}>
      {children}
    </thead>
  );
}`,

  'text.tsx': `import clsx from 'clsx';
import React from 'react';

export function Text({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <p className={clsx('text-gray-900 dark:text-white', className)}>
      {children}
    </p>
  );
}`,

  'textarea.tsx': `import clsx from 'clsx';
import React, { forwardRef } from 'react';

export const Textarea = forwardRef<HTMLTextAreaElement, {
  className?: string;
} & React.ComponentPropsWithoutRef<'textarea'>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={clsx(
          'block w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-700',
          className
        )}
        {...props}
      />
    );
  }
);`,
  // Add components to trigger additional transform patterns
  'complex-form.tsx': `import clsx from 'clsx';
import React from 'react';
import { Input } from './input';
import { Button } from './button';
import { Badge } from './badge';

// Complex component with multiple relative imports to test import transforms
export function ComplexForm({ 
  className, 
  showBadge,
  ...formProps 
}: {
  className?: string;
  showBadge?: boolean;
} & React.ComponentPropsWithoutRef<'form'>) {
  return (
    <form 
      className={clsx('space-y-4', className)}
      {...formProps}
      {...formProps}
      {...formProps}
    >
      <Input placeholder="Enter text" />
      <Button type="submit">Submit</Button>
      {showBadge && <Badge color="blue">Status</Badge>}
    </form>
  );
}`,

  'edge-case-colors.tsx': `import clsx from 'clsx';
import React from 'react';

// Component with edge case color patterns to maximize semantic transform coverage
export function EdgeCaseColors({ className, variant = 'primary' }: {
  className?: string;
  variant?: 'primary' | 'secondary' | 'destructive' | 'accent' | 'muted';
}) {
  return (
    <div className={clsx(
      'p-4 rounded-lg transition-colors',
      // Complex color patterns with various prefixes
      'bg-emerald-50 text-emerald-700 border-emerald-200',
      'hover:bg-emerald-100 focus:bg-emerald-100',
      'dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700',
      'ring-1 ring-inset ring-emerald-600/20',
      // More color variations
      'data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700',
      'data-[state=inactive]:bg-cyan-50 data-[state=inactive]:text-cyan-700',
      // Sky, indigo, violet color patterns
      'selection:bg-sky-100 selection:text-sky-900',
      'marker:text-indigo-500 placeholder:text-violet-400',
      // Fuchsia, pink, rose patterns
      'caret-fuchsia-500 accent-pink-500',
      'decoration-rose-500 decoration-2',
      className
    )}>
      Comprehensive color test component
    </div>
  );
}`,
};

describe('Dev Refresh Command Execution Snapshots', () => {
  const testDir = join(process.cwd(), 'test-temp');
  const sourceDir = join(testDir, 'catalyst-ui-kit', 'typescript');
  const destDir = join(testDir, 'components', 'lib');

  beforeEach(async () => {
    // Clean up and create test directories
    if (existsSync(testDir)) {
      await rm(testDir, { recursive: true });
    }
    await mkdir(sourceDir, { recursive: true });
    await mkdir(destDir, { recursive: true });

    // Create original Catalyst component fixtures
    for (const [filename, content] of Object.entries(CATALYST_FIXTURES)) {
      await writeFile(join(sourceDir, filename), content);
    }
  });

  afterEach(async () => {
    // Clean up test directories
    if (existsSync(testDir)) {
      await rm(testDir, { recursive: true });
    }
  });

  it('should snapshot dev-refresh command execution with transforms', async () => {
    // Mock logger to capture output
    const logOutput: string[] = [];
    const mockLogger = {
      info: (msg: string) => logOutput.push(`INFO: ${msg}`),
      warn: (msg: string) => logOutput.push(`WARN: ${msg}`),
      error: (msg: string) => logOutput.push(`ERROR: ${msg}`),
      debug: (msg: string) => logOutput.push(`DEBUG: ${msg}`),
      success: (msg: string) => logOutput.push(`SUCCESS: ${msg}`),
    };

    // Step 1: Copy files
    const copyResult = await copyFreshFilesBatch(
      sourceDir,
      destDir,
      true, // force
      true // addPrefix
    );

    // Step 2: Apply transforms if copy succeeded
    let transformResult = null;
    if (copyResult.isOk()) {
      transformResult = await runMainPipeline(destDir, {
        verbose: true,
        dryRun: false,
        logger: mockLogger,
      });
    }

    // Read the final transformed files
    const destFiles = await readdir(destDir);
    const transformedFiles: Record<string, string> = {};

    for (const file of destFiles) {
      const content = await readFile(join(destDir, file), 'utf-8');
      transformedFiles[file] = content;
    }

    expect({
      copySuccess: copyResult.isOk(),
      copyError: copyResult.isErr() ? copyResult.error : null,
      copiedCount: copyResult.isOk() ? copyResult.value.copied.length : 0,
      transformSuccess: transformResult?.success ?? false,
      transformProcessedFiles: transformResult?.processedFiles ?? 0,
      transformErrors: transformResult?.errors ?? [],
      destFiles: destFiles.sort(),
      transformedFiles,
    }).toMatchSnapshot('dev-refresh-execution-with-transforms');
  });

  it('should snapshot dev-refresh command execution without transforms', async () => {
    // Step 1: Copy files only (no transforms)
    const copyResult = await copyFreshFilesBatch(
      sourceDir,
      destDir,
      true, // force
      true // addPrefix
    );

    // Read the copied files (should be unchanged from original except for catalyst- prefix)
    const destFiles = await readdir(destDir);
    const copiedFiles: Record<string, string> = {};

    for (const file of destFiles) {
      const content = await readFile(join(destDir, file), 'utf-8');
      copiedFiles[file] = content;
    }

    expect({
      copySuccess: copyResult.isOk(),
      copyError: copyResult.isErr() ? copyResult.error : null,
      copiedCount: copyResult.isOk() ? copyResult.value.copied.length : 0,
      skippedCount: copyResult.isOk() ? copyResult.value.skipped.length : 0,
      failedCount: copyResult.isOk() ? copyResult.value.failed.length : 0,
      destFiles: destFiles.sort(),
      copiedFiles,
    }).toMatchSnapshot('dev-refresh-execution-without-transforms');
  });

  it('should snapshot dev-refresh command error handling', async () => {
    const nonExistentSource = join(testDir, 'non-existent-source');

    // Execute with invalid source directory
    const copyResult = await copyFreshFilesBatch(
      nonExistentSource,
      destDir,
      true, // force
      true // addPrefix
    );

    expect({
      copySuccess: copyResult.isOk(),
      copyError: copyResult.isErr()
        ? {
            type: copyResult.error.type,
            message: copyResult.error.message,
          }
        : null,
    }).toMatchSnapshot('dev-refresh-execution-error-handling');
  });
});
