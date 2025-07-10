/**
 * Comprehensive tests for semantic colors transform using CLI testing utilities
 */

import { describe, it, expect } from 'vitest';
import { expectResult } from '@esteban-url/trailhead-cli/testing';
import { transformSemanticColors } from '../semantic/color-tokens/index.js';

describe('SemanticColorsTransform', () => {
  describe('Core Transform Logic', () => {
    it('should add semantic colors to components with colors object', () => {
      const input = `
const colors = {
  red: 'bg-red-500/15 text-red-700 group-data-hover:bg-red-500/25 dark:bg-red-500/10 dark:text-red-400 dark:group-data-hover:bg-red-500/20',
  zinc: 'bg-zinc-600/10 text-zinc-700 group-data-hover:bg-zinc-600/20 dark:bg-white/5 dark:text-zinc-400 dark:group-data-hover:bg-white/10',
};

export function CatalystBadge({ color = 'zinc', ...props }) {
  return <span className={colors[color]} {...props} />;
}
      `.trim();

      const result = transformSemanticColors(input);

      expectResult(result);
      expect(result.value.changed).toBe(true);
      expect(result.value.content).toContain('primary:');
      expect(result.value.content).toContain('secondary:');
      expect(result.value.content).toContain('destructive:');
      expect(result.value.content).toContain('accent:');
      expect(result.value.content).toContain('muted:');
      expect(result.value.content).toContain('bg-primary-500/15');
      expect(result.value.content).toContain('text-primary-700');
    });

    it('should skip if semantic colors already exist', () => {
      const input = `
const colors = {
  red: 'bg-red-500/15 text-red-700',
  primary: 'bg-primary-500/15 text-primary-700',
  secondary: 'bg-secondary-500/15 text-secondary-700',
};

export function CatalystBadge({ color = 'zinc', ...props }) {
  return <span className={colors[color]} {...props} />;
}
      `.trim();

      const result = transformSemanticColors(input);

      expectResult(result);
      expect(result.value.changed).toBe(false);
      expect(result.value.warnings).toHaveLength(0);
    });

    it('should handle component without colors object', () => {
      const input = `
export function CatalystBadge({ className, ...props }) {
  return <span className={className} {...props} />;
}
      `.trim();

      const result = transformSemanticColors(input);

      expectResult(result);
      expect(result.value.changed).toBe(false);
      expect(result.value.warnings).toContain('No colors object found in component');
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed colors object', () => {
      const input = `
const colors = {
  red: 'bg-red-500',
  // Missing closing brace intentionally
      `.trim();

      const result = transformSemanticColors(input);

      expectResult(result);
      expect(result.value.changed).toBe(false);
      // Just check that there's at least one warning for malformed input
      expect(result.value.warnings.length).toBeGreaterThan(0);
    });

    it('should handle empty file', () => {
      const input = '';

      const result = transformSemanticColors(input);

      expectResult(result);
      expect(result.value.changed).toBe(false);
      expect(result.value.warnings).toContain('No colors object found in component');
    });

    it('should handle file with only comments', () => {
      const input = '// This is just a comment';

      const result = transformSemanticColors(input);

      expectResult(result);
      expect(result.value.changed).toBe(false);
      expect(result.value.warnings).toContain('No colors object found in component');
    });

    it('should handle transform error gracefully', () => {
      // Passing null doesn't actually cause an error since regex.test() handles it gracefully
      // Instead test that the transform handles invalid input appropriately
      const result = transformSemanticColors(null as any);

      expectResult(result);
      expect(result.value.changed).toBe(false);
      expect(result.value.warnings).toContain('No colors object found in component');
    });
  });

  describe('Content Preservation', () => {
    it('should preserve existing colors when adding semantic colors', () => {
      const input = `
const colors = {
  red: 'bg-red-500/15 text-red-700',
  blue: 'bg-blue-500/15 text-blue-700',
  custom: 'bg-purple-500/15 text-purple-700',
};

export function CatalystBadge({ color = 'red', ...props }) {
  return <span className={colors[color]} {...props} />;
}
      `.trim();

      const result = transformSemanticColors(input);

      expectResult(result);
      expect(result.value.changed).toBe(true);
      // Original colors should be preserved
      expect(result.value.content).toContain("red: 'bg-red-500/15 text-red-700'");
      expect(result.value.content).toContain("blue: 'bg-blue-500/15 text-blue-700'");
      expect(result.value.content).toContain("custom: 'bg-purple-500/15 text-purple-700'");
      // New semantic colors should be added
      expect(result.value.content).toContain('primary:');
      expect(result.value.content).toContain('secondary:');
    });
  });

  describe('Multiple Colors Objects', () => {
    it('should only transform the first colors object', () => {
      const input = `
const colors = {
  red: 'bg-red-500/15 text-red-700',
};

const anotherColors = {
  blue: 'bg-blue-500/15 text-blue-700',
};

export function CatalystBadge({ color = 'red', ...props }) {
  return <span className={colors[color]} {...props} />;
}
      `.trim();

      const result = transformSemanticColors(input);

      expectResult(result);
      expect(result.value.changed).toBe(true);
      // Should only add semantic colors to the first colors object
      const firstColorsMatch = result.value.content.match(/const colors = \{[^}]+\}/s);
      const secondColorsMatch = result.value.content.match(/const anotherColors = \{[^}]+\}/s);

      expect(firstColorsMatch?.[0]).toContain('primary:');
      expect(secondColorsMatch?.[0]).not.toContain('primary:');
    });
  });

  describe('Nested Colors in Styles', () => {
    it('should add semantic colors to button-style nested colors object', () => {
      const input = `
  const styles = {
    base: ['relative inline-flex'],
    colors: {
      zinc: [
        'text-white [--btn-bg:var(--color-zinc-600)] [--btn-border:var(--color-zinc-700)]/90',
        '[--btn-icon:var(--color-zinc-400)]',
      ],
      blue: [
        'text-white [--btn-bg:var(--color-blue-600)] [--btn-border:var(--color-blue-700)]/90',
        '[--btn-icon:var(--color-blue-400)]',
      ],
    },
  };

  export const CatalystButton = forwardRef(function CatalystButton(props) {
    return <button className={cn(styles.base, styles.colors[color])} {...props} />;
  });
      `.trim();

      const result = transformSemanticColors(input);

      expectResult(result);
      expect(result.value.changed).toBe(true);
      expect(result.value.content).toContain('primary:');
      expect(result.value.content).toContain('secondary:');
      expect(result.value.content).toContain('destructive:');
      expect(result.value.content).toContain('accent:');
      expect(result.value.content).toContain('muted:');
      // Should preserve existing colors
      expect(result.value.content).toContain('zinc:');
      expect(result.value.content).toContain('blue:');
    });
  });
});
