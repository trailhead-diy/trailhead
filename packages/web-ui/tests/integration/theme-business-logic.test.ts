import { describe, it, expect } from 'vitest';
import { createTheme } from '../../src/components/theme/builder';
import {
  createThemeMap,
  addTheme,
  getTheme,
  getThemeNames,
} from '../../src/components/theme/registry';
import { parseOKLCHColor, formatOKLCHColor } from '../../src/components/theme/utils';
import { getPresetTheme, getPresetThemeNames } from '../../src/components/theme/presets';
import { cn } from '../../src/components/utils/cn';

describe('Business Logic - Critical Theme Operations', () => {
  describe('Theme Builder Business Logic', () => {
    it('should create complete theme with all required properties', () => {
      const theme = createTheme('test-theme')
        .withPrimaryColor('oklch(0.7 0.2 300)')
        .withSecondaryColor('oklch(0.8 0.1 250)')
        .withAccentColor('oklch(0.85 0.05 200)')
        .withMutedColor('oklch(0.9 0.02 150)')
        .withBackgroundColors('oklch(1 0 0)', 'oklch(0.1 0 0)')
        .withDestructiveColor('oklch(0.6 0.25 27)')
        .withBorderColors('oklch(0.9 0.01 0)', 'oklch(0.2 0 0 / 0.1)')
        .build();

      // Theme should have all required properties
      expect(theme.name).toBe('test-theme');
      expect(theme.light.primary).toBe('oklch(0.7 0.2 300)');
      expect(theme.light.secondary).toBe('oklch(0.8 0.1 250)');
      expect(theme.light.accent).toBe('oklch(0.85 0.05 200)');
      expect(theme.light.muted).toBe('oklch(0.9 0.02 150)');
      expect(theme.light.destructive).toBe('oklch(0.6 0.25 27)');
      expect(theme.light.background).toBe('oklch(1 0 0)');
      expect(theme.dark.background).toBeDefined();
      expect(theme.light.border).toBe('oklch(0.9 0.01 0)');
      expect(theme.dark.border).toBe('oklch(0.2 0 0 / 0.1)');

      // Should have light and dark configurations
      expect(theme.light).toBeDefined();
      expect(theme.dark).toBeDefined();
    });

    it('should complete theme with auto-completion', () => {
      // Theme builder auto-completes missing colors
      const theme = createTheme('auto-completed-theme')
        .withPrimaryColor('oklch(0.7 0.2 300)')
        .withBackgroundColors('oklch(1 0 0)', 'oklch(0.145 0 0)')
        .build();

      // Should auto-complete card colors
      expect(theme.light.card).toBe(theme.light.background);
      expect(theme.light['card-foreground']).toBe(theme.light.foreground);
    });

    it('should handle color transformation correctly', () => {
      const theme = createTheme('color-test')
        .withPrimaryColor('oklch(0.7 0.2 300)')
        .withBackgroundColors('oklch(1 0 0)', 'oklch(0.145 0 0)')
        .build();

      // Should generate contrasting foreground colors
      expect(theme.light['primary-foreground']).toBeDefined();
      expect(theme.dark['primary-foreground']).toBeDefined();
    });
  });

  describe('Theme Registry Operations', () => {
    it('should create theme map with preset themes', () => {
      const themeMap = createThemeMap();

      // Should have preset themes
      expect(themeMap.size).toBeGreaterThan(0);

      // Should include catalyst theme
      const catalyst = getTheme(themeMap, 'catalyst');
      expect(catalyst).toBeDefined();
      expect(catalyst?.name).toBe('Catalyst');
    });

    it('should add custom themes to theme map', () => {
      let themeMap = createThemeMap();

      const customTheme = createTheme('custom')
        .withPrimaryColor('oklch(0.7 0.2 300)')
        .withSecondaryColor('oklch(0.8 0.1 250)')
        .withAccentColor('oklch(0.85 0.05 200)')
        .withMutedColor('oklch(0.9 0.02 150)')
        .withBackgroundColors('oklch(1 0 0)', 'oklch(0.1 0 0)')
        .withDestructiveColor('oklch(0.6 0.25 27)')
        .withBorderColors('oklch(0.9 0.01 0)', 'oklch(0.2 0 0 / 0.1)')
        .build();

      // Add theme (returns new map)
      themeMap = addTheme(themeMap, 'custom', customTheme);

      // Should be retrievable
      const retrieved = getTheme(themeMap, 'custom');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('custom');
      expect(retrieved?.light.primary).toBe('oklch(0.7 0.2 300)');

      // Should appear in list
      const allThemeNames = getThemeNames(themeMap);
      expect(allThemeNames).toContain('custom');
    });

    it('should handle immutable theme operations', () => {
      const originalMap = createThemeMap();
      const originalSize = originalMap.size;

      const customTheme = createTheme('immutable-test')
        .withPrimaryColor('oklch(0.7 0.2 300)')
        .withSecondaryColor('oklch(0.8 0.1 250)')
        .withAccentColor('oklch(0.85 0.05 200)')
        .withMutedColor('oklch(0.9 0.02 150)')
        .withBackgroundColors('oklch(1 0 0)', 'oklch(0.1 0 0)')
        .withDestructiveColor('oklch(0.6 0.25 27)')
        .withBorderColors('oklch(0.9 0.01 0)', 'oklch(0.2 0 0 / 0.1)')
        .build();

      // Adding theme should return new map
      const newMap = addTheme(originalMap, 'immutable-test', customTheme);

      // Original map should be unchanged
      expect(originalMap.size).toBe(originalSize);
      expect(getTheme(originalMap, 'immutable-test')).toBeUndefined();

      // New map should have the theme
      expect(newMap.size).toBe(originalSize + 1);
      expect(getTheme(newMap, 'immutable-test')).toBeDefined();
    });
  });

  describe('Color Validation Logic', () => {
    it('should parse OKLCH colors correctly', () => {
      const validColors = [
        'oklch(0.7 0.2 300)',
        'oklch(1 0 0)',
        'oklch(0.5 0.15 180)',
        'oklch(0.8 0.3 45 / 0.9)',
        'oklch(0 0 0)',
      ];

      validColors.forEach(color => {
        expect(() => parseOKLCHColor(color)).not.toThrow();
      });
    });
    (it('should parse and format OKLCH values correctly', () => {
      const result = parseOKLCHColor('oklch(0.7 0.2 300)');
      expect(result.l).toBe(0.7);
      expect(result.c).toBe(0.2);
      expect(result.h).toBe(300);
      expect(result.mode).toBe('oklch');

      const resultWithAlpha = parseOKLCHColor('oklch(0.5 0.15 180 / 0.8)');
      expect(resultWithAlpha.l).toBe(0.5);
      expect(resultWithAlpha.c).toBe(0.15);
      expect(resultWithAlpha.h).toBe(180);
      expect(resultWithAlpha.alpha).toBeCloseTo(0.8);

      // Test formatting
      const formatted = formatOKLCHColor(result);
      expect(formatted).toContain('oklch(');
    }),
      it('should handle edge case color values', () => {
        // Test minimum values
        expect(() => parseOKLCHColor('oklch(0 0 0)')).not.toThrow();

        // Test maximum values
        expect(() => parseOKLCHColor('oklch(1 0.4 360)')).not.toThrow();

        // Test values with decimals
        expect(() => parseOKLCHColor('oklch(0.75 0.25 123.45)')).not.toThrow();
      }));
  });

  describe('Preset Themes Validation', () => {
    it('should have all required preset themes', () => {
      const requiredThemes = [
        'catalyst',
        'red',
        'rose',
        'orange',
        'yellow',
        'green',
        'blue',
        'violet',
      ];
      const presetNames = getPresetThemeNames();

      requiredThemes.forEach(themeName => {
        expect(presetNames).toContain(themeName);

        const theme = getPresetTheme(themeName as any);
        expect(theme).toBeDefined();
        // Theme names are capitalized in the actual implementation
        expect(theme.name).toBe(themeName.charAt(0).toUpperCase() + themeName.slice(1));

        // Validate required color properties
        expect(theme.light.primary).toBeDefined();
        expect(theme.light.secondary).toBeDefined();
        expect(theme.light.accent).toBeDefined();
        expect(theme.light.muted).toBeDefined();
        expect(theme.light.destructive).toBeDefined();
        expect(theme.light.background).toBeDefined();
        expect(theme.dark.background).toBeDefined();

        // Validate OKLCH format
        expect(() => parseOKLCHColor(theme.light.primary)).not.toThrow();
        expect(() => parseOKLCHColor(theme.light.secondary)).not.toThrow();
      });
    });

    it('should have unique theme names', () => {
      const themeNames = getPresetThemeNames();
      const uniqueNames = new Set(themeNames);
      expect(uniqueNames.size).toBe(themeNames.length);
    });

    it('should provide valid theme configurations for all preset themes', () => {
      const presetNames = getPresetThemeNames();

      presetNames.forEach(name => {
        const theme = getPresetTheme(name);
        expect(theme.light).toBeDefined();
        expect(theme.dark).toBeDefined();
        expect(theme.light.primary).toBeDefined();
        expect(theme.light.background).toBeDefined();
        expect(theme.light.foreground).toBeDefined();

        // Validate OKLCH color format
        expect(theme.light.primary).toContain('oklch(');
        expect(theme.dark.primary).toContain('oklch(');
      });
    });
  });

  describe('Utility Functions', () => {
    (it('should combine class names correctly', () => {
      // Basic combination
      expect(cn('class1', 'class2')).toBe('class1 class2');

      // Conditional classes
      const shouldInclude = true;
      const shouldExclude = false;
      expect(cn('base', shouldInclude && 'conditional', shouldExclude && 'excluded')).toBe(
        'base conditional'
      );

      // Tailwind merge functionality
      expect(cn('px-4', 'px-6')).toBe('px-6'); // Later class should override
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');

      // Handle undefined/null values
      expect(cn('class1', undefined, null, 'class2')).toBe('class1 class2');

      // Array inputs
      expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3');
    }),
      it('should handle complex conditional class combinations', () => {
        function getButtonClasses(
          variant: 'primary' | 'secondary',
          size: 'large' | 'small',
          disabled: boolean
        ) {
          return cn(
            'base-button',
            variant === 'primary' && 'bg-primary text-primary-foreground',
            variant === 'secondary' && 'bg-secondary text-secondary-foreground',
            size === 'large' && 'px-6 py-3 text-lg',
            size === 'small' && 'px-3 py-1 text-sm',
            disabled && 'opacity-50 cursor-not-allowed'
          );
        }

        // Test primary large
        expect(getButtonClasses('primary', 'large', false)).toBe(
          'base-button bg-primary text-primary-foreground px-6 py-3 text-lg'
        );

        // Test secondary small disabled
        expect(getButtonClasses('secondary', 'small', true)).toBe(
          'base-button bg-secondary text-secondary-foreground px-3 py-1 text-sm opacity-50 cursor-not-allowed'
        );
      }));
  });

  describe('Performance and Memory Management', () => {
    it('should handle large number of theme operations efficiently', () => {
      let themeMap = createThemeMap();

      // Register 100 themes
      for (let i = 0; i < 100; i++) {
        const theme = createTheme(`test-theme-${i}`)
          .withPrimaryColor(`oklch(0.${50 + (i % 50)} 0.2 ${(i * 3.6) % 360})`)
          .withSecondaryColor('oklch(0.8 0.1 250)')
          .withAccentColor('oklch(0.85 0.05 200)')
          .withMutedColor('oklch(0.9 0.02 150)')
          .withBackgroundColors('oklch(1 0 0)', 'oklch(0.1 0 0)')
          .withDestructiveColor('oklch(0.6 0.25 27)')
          .withBorderColors('oklch(0.9 0.01 0)', 'oklch(0.2 0 0 / 0.1)')
          .build();

        themeMap = addTheme(themeMap, `test-theme-${i}`, theme);
      }

      // Should be able to retrieve all themes
      const allThemeNames = getThemeNames(themeMap);
      expect(allThemeNames.length).toBeGreaterThanOrEqual(100);

      // Verify specific themes can be retrieved
      const firstTheme = getTheme(themeMap, 'test-theme-0');
      const lastTheme = getTheme(themeMap, 'test-theme-99');
      expect(firstTheme).toBeDefined();
      expect(lastTheme).toBeDefined();
    });

    it('should maintain immutability in theme operations', () => {
      const originalMap = createThemeMap();
      const initialThemeCount = originalMap.size;

      // Create and add many themes
      let currentMap = originalMap;
      for (let i = 0; i < 50; i++) {
        const theme = createTheme(`temp-theme-${i}`)
          .withPrimaryColor(`oklch(0.7 0.2 ${(i * 7) % 360})`)
          .withSecondaryColor('oklch(0.8 0.1 250)')
          .withAccentColor('oklch(0.85 0.05 200)')
          .withMutedColor('oklch(0.9 0.02 150)')
          .withBackgroundColors('oklch(1 0 0)', 'oklch(0.1 0 0)')
          .withDestructiveColor('oklch(0.6 0.25 27)')
          .withBorderColors('oklch(0.9 0.01 0)', 'oklch(0.2 0 0 / 0.1)')
          .build();

        currentMap = addTheme(currentMap, `temp-theme-${i}`, theme);
      }

      // Original map should be unchanged
      expect(originalMap.size).toBe(initialThemeCount);
      expect(currentMap.size).toBe(initialThemeCount + 50);
    });
  });
});
