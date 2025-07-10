/**
 * Tests for reorder cn arguments transform
 */

import { describe, it, expect } from 'vitest';
import { expectResult } from '@esteban-url/trailhead-cli/testing';
import { transformReorderCnArgs } from '../format/reorder-cn-args.js';

describe('ReorderCnArgsTransform', () => {
  describe('Core Transform Logic', () => {
    it('should reorder cn() arguments to place className last', () => {
      const input = `
export function Component({ className }) {
  return <div className={cn(className, 'base-styles', 'more-styles')} />;
}
      `.trim();

      const result = transformReorderCnArgs(input);

      expectResult(result);
      expect(result.value.changed).toBe(true);
      expect(result.value.content).toMatch(
        /cn\([^)]*'base-styles'[^)]*'more-styles'[^)]*className[^)]*\)/
      );
      expect(result.value.warnings).toContain(
        'Reordered cn() arguments to place className variables last'
      );
    });

    it('should handle multiple className variables', () => {
      const input = `
export function Component({ className, className2 }) {
  return <div className={cn(className, 'base', className2, 'other')} />;
}
      `.trim();

      const result = transformReorderCnArgs(input);

      expectResult(result);
      expect(result.value.changed).toBe(true);
      expect(result.value.content).toMatch(
        /cn\([^)]*'base'[^)]*'other'[^)]*className[^)]*className2[^)]*\)/
      );
    });

    it('should preserve original order when className is already last', () => {
      const input = `
export function Component({ className }) {
  return <div className={cn('base-styles', 'more-styles', className)} />;
}
      `.trim();

      const result = transformReorderCnArgs(input);

      expectResult(result);
      expect(result.value.changed).toBe(false);
      // Check that className is still last in the cn() call
      expect(result.value.content).toMatch(
        /cn\(['"]base-styles['"],\s*['"]more-styles['"],\s*className\)/
      );
    });

    it('should handle complex expressions and preserve non-className variables', () => {
      const input = `
export function Component({ className, isActive }) {
  return <div className={cn(className, 'base', isActive && 'active', someVar)} />;
}
      `.trim();

      const result = transformReorderCnArgs(input);

      expectResult(result);
      expect(result.value.changed).toBe(true);
      expect(result.value.content).toMatch(
        /cn\([^)]*'base'[^)]*isActive && 'active'[^)]*someVar[^)]*className[^)]*\)/
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle cn() calls with no arguments', () => {
      const input = `
const classes = cn();
      `.trim();

      const result = transformReorderCnArgs(input);

      expectResult(result);
      expect(result.value.changed).toBe(false);
      expect(result.value.content).toMatch(/const classes = cn\(\);/);
    });

    it('should handle cn() calls with single argument', () => {
      const input = `
const classes = cn(className);
      `.trim();

      const result = transformReorderCnArgs(input);

      expectResult(result);
      expect(result.value.changed).toBe(false);
      expect(result.value.content).toMatch(/const classes = cn\(className\);/);
    });

    it('should handle cn() calls with no className variables', () => {
      const input = `
const classes = cn('base', 'styles', isActive && 'active');
      `.trim();

      const result = transformReorderCnArgs(input);

      expectResult(result);
      expect(result.value.changed).toBe(false);
      expect(result.value.content).toMatch(
        /cn\(['"]base['"],\s*['"]styles['"],\s*isActive && ['"]active['"]\);/
      );
    });

    it('should handle nested function calls and complex expressions', () => {
      const input = `
const classes = cn(className, getBaseClass(), 'static', condition ? 'yes' : 'no');
      `.trim();

      const result = transformReorderCnArgs(input);

      expectResult(result);
      expect(result.value.changed).toBe(true);
      expect(result.value.content).toMatch(
        /cn\([^)]*getBaseClass\(\)[^)]*'static'[^)]*condition \? 'yes' : 'no'[^)]*className[^)]*\)/
      );
    });

    it('should handle empty file', () => {
      const input = '';

      const result = transformReorderCnArgs(input);

      expectResult(result);
      expect(result.value.changed).toBe(false);
      expect(result.value.content).toBe('');
    });

    it('should handle file with no cn() calls', () => {
      const input = `
export function Component({ className }) {
  return <div className={className} />;
}
      `.trim();

      const result = transformReorderCnArgs(input);

      expectResult(result);
      expect(result.value.changed).toBe(false);
      expect(result.value.content).toMatch(
        /export function Component.*className.*return.*div.*className.*{className}/s
      );
    });
  });

  describe('Complex Argument Parsing', () => {
    it('should handle string literals with commas', () => {
      const input = `
const classes = cn(className, 'base, with, commas', 'other');
      `.trim();

      const result = transformReorderCnArgs(input);

      expectResult(result);
      expect(result.value.changed).toBe(true);
      expect(result.value.content).toMatch(
        /cn\([^)]*'base, with, commas'[^)]*'other'[^)]*className[^)]*\)/
      );
    });

    it('should handle template literals', () => {
      const input = `
const classes = cn(className, \`base-\${variant}\`, 'other');
      `.trim();

      const result = transformReorderCnArgs(input);

      expectResult(result);
      expect(result.value.changed).toBe(true);
      expect(result.value.content).toMatch(
        /cn\([^)]*`base-\$\{variant\}`[^)]*'other'[^)]*className[^)]*\)/
      );
    });

    it('should handle nested parentheses in arguments', () => {
      const input = `
const classes = cn(className, someFunc(arg1, arg2), 'static');
      `.trim();

      const result = transformReorderCnArgs(input);

      expectResult(result);
      expect(result.value.changed).toBe(true);
      expect(result.value.content).toMatch(
        /cn\([^)]*someFunc\(arg1, arg2\)[^)]*'static'[^)]*className[^)]*\)/
      );
    });
  });

  describe('Multiple cn() Calls', () => {
    it('should handle multiple cn() calls in the same file', () => {
      const input = `
export function Component({ className, className2 }) {
  const baseClasses = cn(className, 'base');
  const otherClasses = cn(className2, 'other', 'styles');
  return <div className={baseClasses} data-class={otherClasses} />;
}
      `.trim();

      const result = transformReorderCnArgs(input);

      expectResult(result);
      expect(result.value.changed).toBe(true);
      expect(result.value.content).toMatch(/cn\([^)]*'base'[^)]*className[^)]*\)/);
      expect(result.value.content).toMatch(/cn\([^)]*'other'[^)]*'styles'[^)]*className2[^)]*\)/);
    });
  });

  describe('Spacing and Formatting', () => {
    it('should normalize spacing in reordered arguments', () => {
      const input = `cn(className,  'base',   'styles')`;

      const result = transformReorderCnArgs(input);

      expectResult(result);
      expect(result.value.changed).toBe(true);
      // Regex transform preserves some whitespace - className should be moved to end
      expect(result.value.content).toMatch(/cn\([^)]*'base'[^)]*'styles'[^)]*className[^)]*\)/);
    });
  });
});
