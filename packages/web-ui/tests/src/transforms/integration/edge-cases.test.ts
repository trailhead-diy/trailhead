/**
 * Edge Case Integration Tests
 *
 * Tests complex real-world scenarios and edge cases that could break transforms.
 * These tests ensure the pipeline handles unusual but valid code patterns.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { runMainPipeline } from '../../../../src/transforms/pipelines/main.js';

describe('edge case scenarios', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = path.join(process.cwd(), 'temp', `edge-case-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('complex component patterns', () => {
    it.fails('handles components with colors object and CSS variables', async () => {
      const switchComponent = `
import * as Headless from '@headlessui/react'
import clsx from 'clsx'

export function Switch({ color = 'dark/zinc' }: { color?: Color }) {
  const colors = {
    'dark/zinc': [
      'bg-white dark:bg-zinc-900 [--switch-bg-ring:theme(colors.zinc.950)]/90',
      'data-checked:bg-zinc-900 dark:data-checked:bg-white',
      '[--switch-bg:theme(colors.zinc.950)] dark:[--switch-bg:white]',
      '[--switch-shadow:theme(colors.black/10)] [--switch:white] dark:[--switch:theme(colors.zinc.900)]'
    ].join(' '),
    zinc: 'bg-zinc-200 [--switch-bg:theme(colors.zinc.600)]',
    white: 'bg-white/10 [--switch-bg:white] [--switch:transparent]'
  }
  
  return (
    <Headless.Switch
      className={clsx(
        'group relative inline-flex h-6 w-11 rounded-full p-0.5',
        'focus:outline-none data-focus:outline-2 data-focus:outline-offset-2',
        'data-focus:outline-blue-500',
        colors[color]
      )}
    >
      <span className="size-5 rounded-full bg-white transition" />
    </Headless.Switch>
  )
}
`;

      const componentPath = path.join(tempDir, 'switch.tsx');
      await fs.writeFile(componentPath, switchComponent);

      await runMainPipeline({
        srcDir: tempDir,
        outDir: tempDir,
        verbose: false,
        dryRun: false,
      });

      const result = await fs.readFile(componentPath, 'utf-8');

      // Should preserve colors object structure
      expect(result).toContain('const colors = {');
      expect(result).toContain("'dark/zinc':");

      // Should convert className colors outside colors object
      expect(result).toContain('data-focus:outline-primary');
      expect(result).not.toContain('data-focus:outline-blue-500');

      // Should handle CSS variables in colors object correctly
      expect(result).toContain('[--switch-bg:theme(colors.foreground)]');
      expect(result).toContain('[--switch-bg:theme(colors.muted.foreground)]');

      // Should convert to cn
      expect(result).toContain('cn(');
      expect(result).not.toContain('clsx(');
    });

    it.fails('handles nested className usage in render props', async () => {
      const dropdownComponent = `
import * as Headless from '@headlessui/react'
import clsx from 'clsx'

export function Dropdown() {
  return (
    <Headless.Menu>
      {({ open }) => (
        <>
          <Headless.MenuButton
            className={clsx(
              'px-4 py-2 rounded-lg',
              open ? 'bg-zinc-100' : 'bg-white',
              'hover:bg-zinc-50 focus:ring-2 focus:ring-zinc-950'
            )}
          >
            Options
          </Headless.MenuButton>
          <Headless.MenuItems className="bg-white border border-zinc-200">
            <Headless.MenuItem>
              {({ active, disabled }) => (
                <button
                  className={clsx(
                    'w-full px-4 py-2 text-left',
                    active && 'bg-zinc-100',
                    disabled && 'opacity-50 cursor-not-allowed'
                  )}
                  disabled={disabled}
                >
                  Edit
                </button>
              )}
            </Headless.MenuItem>
          </Headless.MenuItems>
        </>
      )}
    </Headless.Menu>
  )
}
`;

      const componentPath = path.join(tempDir, 'dropdown.tsx');
      await fs.writeFile(componentPath, dropdownComponent);

      await runMainPipeline({
        srcDir: tempDir,
        outDir: tempDir,
        verbose: false,
        dryRun: false,
      });

      const result = await fs.readFile(componentPath, 'utf-8');

      // All clsx should be converted to cn
      expect(result).not.toContain('clsx');
      expect(result.match(/cn\(/g)?.length).toBeGreaterThan(1);

      // Colors should be converted
      expect(result).toContain('bg-muted');
      expect(result).toContain('bg-background');
      expect(result).toContain('hover:bg-muted');
      expect(result).toContain('focus:ring-primary');
      expect(result).toContain('border-border');

      // Conditional logic should be preserved
      expect(result).toContain('open ?');
      expect(result).toContain('active &&');
      expect(result).toContain('disabled &&');
    });

    it.fails('handles multiple component exports in one file', async () => {
      const tableComponents = `
import clsx from 'clsx'

export function Table({ children, className, bleed, grid, striped }) {
  return (
    <div className={clsx('overflow-x-auto', className)}>
      <table
        className={clsx(
          'min-w-full text-left text-sm',
          grid && 'table-grid',
          striped && 'table-striped'
        )}
      >
        {children}
      </table>
    </div>
  )
}

export function TableHead({ children }) {
  return (
    <thead className="border-b border-zinc-200 text-zinc-900 dark:border-zinc-800 dark:text-white">
      {children}
    </thead>
  )
}

export function TableBody({ children }) {
  return <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">{children}</tbody>
}

export function TableRow({ children, href }) {
  const Component = href ? 'a' : 'tr'
  return (
    <Component
      href={href}
      className={clsx(
        href && 'hover:bg-zinc-50 dark:hover:bg-zinc-900/50',
        'transition-colors'
      )}
    >
      {children}
    </Component>
  )
}
`;

      const componentPath = path.join(tempDir, 'table.tsx');
      await fs.writeFile(componentPath, tableComponents);

      await runMainPipeline({
        srcDir: tempDir,
        outDir: tempDir,
        verbose: false,
        dryRun: false,
      });

      const result = await fs.readFile(componentPath, 'utf-8');

      // All components should be transformed
      expect(result).not.toContain('clsx');
      expect(result).toContain('cn(');

      // Each component's colors should be transformed
      expect(result).toContain('border-border');
      expect(result).toContain('text-foreground');
      expect(result).toContain('dark:border-border');
      expect(result).toContain('dark:text-foreground');
      expect(result).toContain('divide-muted');
      expect(result).toContain('dark:divide-muted');
      expect(result).toContain('hover:bg-muted');
      expect(result).toContain('dark:hover:bg-card/50');

      // Structure should be preserved
      expect(result).toContain('export function Table');
      expect(result).toContain('export function TableHead');
      expect(result).toContain('export function TableBody');
      expect(result).toContain('export function TableRow');
    });
  });

  describe('CSS-in-JS patterns', () => {
    it.fails('handles tw template literals correctly', async () => {
      const componentWithTw = `
import { tw } from '../utils'

const buttonStyles = tw\`
  px-4 py-2 rounded-lg
  bg-zinc-900 text-white
  hover:bg-zinc-800
  focus:ring-2 focus:ring-zinc-950
\`

export function Button({ className }) {
  return <button className={buttonStyles + ' ' + className}>Click</button>
}
`;

      const componentPath = path.join(tempDir, 'button-tw.tsx');
      await fs.writeFile(componentPath, componentWithTw);

      await runMainPipeline({
        srcDir: tempDir,
        outDir: tempDir,
        verbose: false,
        dryRun: false,
      });

      const result = await fs.readFile(componentPath, 'utf-8');

      // Template literal content should be transformed
      expect(result).toContain('bg-foreground text-background');
      expect(result).toContain('hover:bg-muted');
      expect(result).toContain('focus:ring-primary');
    });
  });

  describe('error recovery', () => {
    it('handles malformed JSX gracefully', async () => {
      const malformedComponent = `
export function Broken({ className }) {
  return (
    <div className={cn('bg-zinc-900', className}>
      Missing closing parenthesis
    </div>
  )
}
`;

      const componentPath = path.join(tempDir, 'broken.tsx');
      await fs.writeFile(componentPath, malformedComponent);

      // Pipeline should not crash
      await runMainPipeline({
        srcDir: tempDir,
        outDir: tempDir,
        verbose: false,
        dryRun: false,
      });

      // File should still exist
      const exists = await fs
        .access(componentPath)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);
    });

    it.fails('handles TypeScript type errors gracefully', async () => {
      const typeErrorComponent = `
interface Props {
  color: 'red' | 'blue'
}

export function Typed({ color, invalidProp }: Props) {
  // invalidProp is not in Props interface
  return <div className="bg-zinc-900">{invalidProp}</div>
}
`;

      const componentPath = path.join(tempDir, 'typed.tsx');
      await fs.writeFile(componentPath, typeErrorComponent);

      await runMainPipeline({
        srcDir: tempDir,
        outDir: tempDir,
        verbose: false,
        dryRun: false,
      });

      const result = await fs.readFile(componentPath, 'utf-8');

      // Should still transform colors despite type errors
      expect(result).toContain('bg-foreground');
      expect(result).not.toContain('bg-zinc-900');
    });
  });

  describe('preservation of non-color code', () => {
    it.fails('preserves event handlers and logic', async () => {
      const interactiveComponent = `
import { useState } from 'react'
import clsx from 'clsx'

export function Counter() {
  const [count, setCount] = useState(0)
  
  const increment = () => setCount(c => c + 1)
  const decrement = () => setCount(c => c - 1)
  
  return (
    <div className="flex items-center gap-4">
      <button
        onClick={decrement}
        className={clsx(
          'px-3 py-1 rounded',
          'bg-zinc-200 hover:bg-zinc-300',
          count <= 0 && 'opacity-50 cursor-not-allowed'
        )}
        disabled={count <= 0}
      >
        -
      </button>
      <span className="text-zinc-900 font-medium">{count}</span>
      <button
        onClick={increment}
        className="px-3 py-1 rounded bg-zinc-200 hover:bg-zinc-300"
      >
        +
      </button>
    </div>
  )
}
`;

      const componentPath = path.join(tempDir, 'counter.tsx');
      await fs.writeFile(componentPath, interactiveComponent);

      await runMainPipeline({
        srcDir: tempDir,
        outDir: tempDir,
        verbose: false,
        dryRun: false,
      });

      const result = await fs.readFile(componentPath, 'utf-8');

      // All logic should be preserved
      expect(result).toContain('useState(0)');
      expect(result).toContain('setCount(c => c + 1)');
      expect(result).toContain('onClick={decrement}');
      expect(result).toContain('disabled={count <= 0}');
      expect(result).toContain('{count}');

      // Colors should be transformed
      expect(result).toContain('bg-muted');
      expect(result).toContain('hover:bg-muted');
      expect(result).toContain('text-foreground');
    });
  });
});
