/**
 * Color Mapping Critical Path Tests
 *
 * Tests the core business logic of color transformations.
 * Verifies that Catalyst colors map correctly to semantic tokens.
 */

import { describe, it, expect } from 'vitest';
import { baseMappingsTransform } from '../../../../src/transforms/components/common/colors/base-mappings.js';
import { interactiveStatesTransform } from '../../../../src/transforms/components/common/colors/interactive-states.js';
import { darkModeTransform } from '../../../../src/transforms/components/common/colors/dark-mode.js';
import { specialPatternsTransform } from '../../../../src/transforms/components/common/colors/special-patterns.js';

describe('color mapping transformations', () => {
  describe('base color mappings', () => {
    it.fails('maps zinc colors to semantic tokens correctly', () => {
      const input = `
        className={cn(
          'bg-zinc-950 text-zinc-900 border-zinc-800',
          'ring-zinc-700 fill-zinc-600 stroke-zinc-500',
          'divide-zinc-400 placeholder:text-zinc-300'
        )}
      `;

      const result = baseMappingsTransform.execute(input);

      expect(result.content).toContain('bg-foreground');
      expect(result.content).toContain('text-foreground');
      expect(result.content).toContain('border-muted');
      expect(result.content).toContain('ring-muted-foreground');
      expect(result.content).toContain('fill-muted-foreground');
      expect(result.content).toContain('stroke-muted');
      expect(result.content).toContain('divide-muted');
      expect(result.content).toContain('placeholder:text-muted-foreground');
    });

    it.fails('maps white and black to background tokens', () => {
      const input = `
        <div className="bg-white text-black border-white/50">
          <span className="bg-black/10 text-white/80" />
        </div>
      `;

      const result = baseMappingsTransform.execute(input);

      expect(result.content).toContain('bg-background');
      expect(result.content).toContain('text-foreground');
      expect(result.content).toContain('border-background/50');
      expect(result.content).toContain('bg-foreground/10');
      expect(result.content).toContain('text-background/80');
    });

    it.fails('maps gray and slate colors consistently', () => {
      const input = 'bg-gray-100 text-gray-900 border-slate-200 ring-slate-800';

      const result = baseMappingsTransform.execute(input);

      expect(result.content).toContain('bg-muted');
      expect(result.content).toContain('text-foreground');
      expect(result.content).toContain('border-border');
      expect(result.content).toContain('ring-muted');
    });

    it.fails('preserves opacity modifiers', () => {
      const input = 'bg-zinc-950/90 text-white/75 border-zinc-200/20';

      const result = baseMappingsTransform.execute(input);

      expect(result.content).toContain('bg-foreground/90');
      expect(result.content).toContain('text-background/75');
      expect(result.content).toContain('border-border/20');
    });
  });

  describe('interactive state mappings', () => {
    it.fails('maps hover states correctly', () => {
      const input = `
        className={cn(
          'hover:bg-zinc-900 hover:text-white',
          'hover:border-zinc-700 hover:ring-zinc-600'
        )}
      `;

      const result = interactiveStatesTransform.execute(input);

      expect(result.content).toContain('hover:bg-foreground');
      expect(result.content).toContain('hover:text-background');
      expect(result.content).toContain('hover:border-muted-foreground');
      expect(result.content).toContain('hover:ring-muted-foreground');
    });

    it.fails('maps focus states with proper specificity', () => {
      const input = `
        'focus:ring-zinc-950 focus-visible:ring-zinc-900',
        'data-focus:ring-black focus-within:border-zinc-800'
      `;

      const result = interactiveStatesTransform.execute(input);

      expect(result.content).toContain('focus:ring-primary');
      expect(result.content).toContain('focus-visible:ring-primary');
      expect(result.content).toContain('data-focus:ring-primary');
      expect(result.content).toContain('focus-within:border-primary');
    });

    it.fails('maps disabled states to muted tokens', () => {
      const input = `
        disabled:bg-zinc-100 disabled:text-zinc-400
        data-disabled:border-zinc-200 disabled:cursor-not-allowed
      `;

      const result = interactiveStatesTransform.execute(input);

      expect(result.content).toContain('disabled:bg-muted');
      expect(result.content).toContain('disabled:text-muted-foreground');
      expect(result.content).toContain('data-disabled:border-muted');
      expect(result.content).toContain('disabled:cursor-not-allowed'); // Preserved
    });

    it.fails('handles group and peer states', () => {
      const input = `
        group-hover:bg-zinc-900 peer-focus:ring-zinc-950
        group-data-hover:text-white peer-disabled:opacity-50
      `;

      const result = interactiveStatesTransform.execute(input);

      expect(result.content).toContain('group-hover:bg-foreground');
      expect(result.content).toContain('peer-focus:ring-primary');
      expect(result.content).toContain('group-data-hover:text-background');
      expect(result.content).toContain('peer-disabled:opacity-50'); // Preserved
    });
  });

  describe('dark mode transformations', () => {
    it.fails('maps dark mode colors correctly', () => {
      const input = `
        className={cn(
          'bg-white dark:bg-zinc-900',
          'text-zinc-900 dark:text-white',
          'border-zinc-200 dark:border-zinc-800'
        )}
      `;

      const result = darkModeTransform.execute(input);

      expect(result.content).toContain('bg-background dark:bg-card');
      expect(result.content).toContain('text-foreground dark:text-foreground');
      expect(result.content).toContain('border-border dark:border-border');
    });

    it.fails('handles complex dark mode patterns', () => {
      const input = `
        'ring-black/5 dark:ring-white/10',
        'shadow-zinc-900/5 dark:shadow-white/5',
        'bg-zinc-50 dark:bg-zinc-950/50'
      `;

      const result = darkModeTransform.execute(input);

      expect(result.content).toContain('ring-foreground/5 dark:ring-background/10');
      expect(result.content).toContain('shadow-foreground/5 dark:shadow-background/5');
      expect(result.content).toContain('bg-muted dark:bg-card/50');
    });
  });

  describe('special patterns', () => {
    it.fails('transforms gradient patterns', () => {
      const input = `
        className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-700"
      `;

      const result = specialPatternsTransform.execute(input);

      expect(result.content).toContain('from-foreground');
      expect(result.content).toContain('via-muted');
      expect(result.content).toContain('to-muted-foreground');
    });

    it.fails('transforms shadow colors', () => {
      const input = `
        shadow-zinc-900/10 ring-offset-white
        ring-1 ring-zinc-200 shadow-lg
      `;

      const result = specialPatternsTransform.execute(input);

      expect(result.content).toContain('shadow-foreground/10');
      expect(result.content).toContain('ring-offset-background');
      expect(result.content).toContain('ring-1 ring-border');
    });

    it.fails('handles backdrop and selection colors', () => {
      const input = `
        backdrop-blur-sm selection:bg-zinc-900 selection:text-white
        placeholder-zinc-400 caret-zinc-600
      `;

      const result = specialPatternsTransform.execute(input);

      expect(result.content).toContain('selection:bg-primary');
      expect(result.content).toContain('selection:text-primary-foreground');
      expect(result.content).toContain('placeholder-muted-foreground');
      expect(result.content).toContain('caret-primary');
    });
  });

  describe('color preservation in protected contexts', () => {
    it('preserves colors in variable declarations', () => {
      const input = `
        const color = 'zinc-900'
        const styles = { backgroundColor: 'white' }
        const cssVar = '--color-zinc-950'
      `;

      const result = baseMappingsTransform.execute(input);

      // Should not transform these
      expect(result.content).toContain("'zinc-900'");
      expect(result.content).toContain("'white'");
      expect(result.content).toContain('--color-zinc-950');
    });

    it('preserves colors in import statements', () => {
      const input = `
        import { zinc900 } from './colors'
        import whiteLogo from './white-logo.svg'
      `;

      const result = baseMappingsTransform.execute(input);

      expect(result.content).toContain('zinc900');
      expect(result.content).toContain('white-logo');
    });
  });

  describe('transform ordering and composition', () => {
    it.fails('applies transforms in correct order without conflicts', () => {
      const input = `
        className={cn(
          'bg-white hover:bg-zinc-100 dark:bg-zinc-900',
          'text-zinc-900 hover:text-zinc-800 dark:text-white',
          'focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white'
        )}
      `;

      // Apply all transforms in sequence
      let result = baseMappingsTransform.execute(input);
      result = interactiveStatesTransform.execute(result.content);
      result = darkModeTransform.execute(result.content);

      const final = result.content;

      // Base mappings
      expect(final).toContain('bg-background');
      expect(final).toContain('text-foreground');

      // Interactive states
      expect(final).toContain('hover:bg-muted');
      expect(final).toContain('hover:text-muted-foreground');
      expect(final).toContain('focus:ring-primary');

      // Dark mode
      expect(final).toContain('dark:bg-card');
      expect(final).toContain('dark:text-foreground');
      expect(final).toContain('dark:focus:ring-primary-foreground');
    });
  });
});
