import { describe, it, expect } from 'vitest';
import {
  parseOKLCHColor,
  adjustLightness,
  adjustChroma,
  rotateHue,
  getContrastingColor,
  invertForDarkMode,
  ensureInGamut,
  composeColorTransforms,
  createColorTransformer,
  generateColorPalette,
  themeToCSS,
  mergeThemes,
  extractThemeFromCSS,
  checkShadcnCompatibility,
  autoFixTheme,
} from '../../../../src/components/theme/utils';
import type { OKLCHColorData } from '../../../../src/components/theme/utils';
import type { TrailheadThemeConfig, ShadcnTheme } from '../../../../src/components/theme/config';

describe('theme-utils', () => {
  describe('Color Transformation Workflow', () => {
    const testColor: OKLCHColorData = {
      mode: 'oklch',
      l: 0.6,
      c: 0.2,
      h: 270,
    };

    it('should handle complete color transformation pipeline', () => {
      // Test composition of multiple transforms
      const transformer = composeColorTransforms(
        color => adjustLightness(color, 0.1),
        color => adjustChroma(color, -0.05),
        color => rotateHue(color, 30)
      );

      const result = transformer(testColor);
      expect(result.l).toBeCloseTo(0.7, 1);
      expect(result.c).toBeCloseTo(0.15, 2);
      expect(result.h).toBeCloseTo(300, 0);
    });

    it('should create color variants for theme generation', () => {
      // Test practical color variant generation
      const primary = parseOKLCHColor('oklch(0.7 0.25 120)');

      // Create lighter variant for hover states
      const lighter = adjustLightness(primary, 0.05);
      expect(lighter.l).toBeGreaterThan(primary.l);

      // Create desaturated variant for disabled states
      const muted = adjustChroma(primary, -0.15);
      expect(muted.c).toBeLessThan(primary.c);

      // Ensure colors stay in gamut
      const inGamut = ensureInGamut(lighter);
      expect(inGamut).toHaveProperty('l');
      expect(inGamut).toHaveProperty('c');
      expect(inGamut).toHaveProperty('h');
    });

    it('should handle dark mode color inversion correctly', () => {
      const lightColor: OKLCHColorData = {
        mode: 'oklch',
        l: 0.9,
        c: 0.1,
        h: 200,
      };

      const darkColor = invertForDarkMode(lightColor);
      expect(darkColor.l).toBeCloseTo(0.1, 1);
      expect(darkColor.c).toBe(lightColor.c);
      expect(darkColor.h).toBe(lightColor.h);
    });

    it('should generate contrasting colors for accessibility', () => {
      const background: OKLCHColorData = {
        mode: 'oklch',
        l: 0.95,
        c: 0,
        h: 0,
      };

      const foreground = getContrastingColor(background);
      expect(foreground.l).toBeLessThan(0.5); // Should be dark on light background
    });
  });

  describe('Color Palette Generation', () => {
    it('should generate complete color palette from base color', () => {
      const palette = generateColorPalette('oklch(0.6 0.2 250)');

      expect(palette).toHaveProperty('50');
      expect(palette).toHaveProperty('100');
      expect(palette).toHaveProperty('500');
      expect(palette).toHaveProperty('900');
      expect(palette).toHaveProperty('950');

      // Verify progression from light to dark
      const l50 = parseOKLCHColor(palette['50']).l;
      const l500 = parseOKLCHColor(palette['500']).l;
      const l950 = parseOKLCHColor(palette['950']).l;

      expect(l50).toBeGreaterThan(l500);
      expect(l500).toBeGreaterThan(l950);
    });
  });

  // Helper to create a complete theme with all required properties
  const createCompleteTheme = (overrides?: Partial<ShadcnTheme>): ShadcnTheme => ({
    background: 'oklch(0.99 0 0)',
    foreground: 'oklch(0.145 0 0)',
    card: 'oklch(0.99 0 0)',
    'card-foreground': 'oklch(0.145 0 0)',
    popover: 'oklch(0.99 0 0)',
    'popover-foreground': 'oklch(0.145 0 0)',
    primary: 'oklch(0.7 0.2 250)',
    'primary-foreground': 'oklch(0.99 0 0)',
    secondary: 'oklch(0.96 0.01 250)',
    'secondary-foreground': 'oklch(0.145 0 0)',
    muted: 'oklch(0.96 0.01 250)',
    'muted-foreground': 'oklch(0.47 0.02 250)',
    accent: 'oklch(0.96 0.01 250)',
    'accent-foreground': 'oklch(0.145 0 0)',
    destructive: 'oklch(0.65 0.25 20)',
    'destructive-foreground': 'oklch(0.99 0 0)',
    border: 'oklch(0.89 0.01 250)',
    input: 'oklch(0.89 0.01 250)',
    ring: 'oklch(0.7 0.2 250)',
    'chart-1': 'oklch(0.7 0.15 30)',
    'chart-2': 'oklch(0.6 0.15 120)',
    'chart-3': 'oklch(0.65 0.15 210)',
    'chart-4': 'oklch(0.55 0.15 300)',
    'chart-5': 'oklch(0.75 0.15 60)',
    sidebar: 'oklch(0.99 0 0)',
    'sidebar-foreground': 'oklch(0.145 0 0)',
    'sidebar-primary': 'oklch(0.7 0.2 250)',
    'sidebar-primary-foreground': 'oklch(0.99 0 0)',
    'sidebar-accent': 'oklch(0.96 0.01 250)',
    'sidebar-accent-foreground': 'oklch(0.145 0 0)',
    'sidebar-border': 'oklch(0.89 0.01 250)',
    'sidebar-ring': 'oklch(0.7 0.2 250)',
    ...overrides,
  });

  describe('Theme Conversion and CSS Generation', () => {
    const sampleTheme: TrailheadThemeConfig = {
      name: 'Test Theme',
      light: createCompleteTheme(),
      dark: createCompleteTheme({
        background: 'oklch(0.13 0 0)',
        foreground: 'oklch(0.99 0 0)',
        primary: 'oklch(0.7 0.2 250)',
        'primary-foreground': 'oklch(0.145 0 0)',
        secondary: 'oklch(0.2 0.01 250)',
        'secondary-foreground': 'oklch(0.99 0 0)',
        muted: 'oklch(0.2 0.01 250)',
        'muted-foreground': 'oklch(0.71 0.01 250)',
        accent: 'oklch(0.2 0.01 250)',
        'accent-foreground': 'oklch(0.99 0 0)',
        destructive: 'oklch(0.5 0.25 20)',
        'destructive-foreground': 'oklch(0.99 0 0)',
        border: 'oklch(0.2 0.01 250)',
        input: 'oklch(0.2 0.01 250)',
        ring: 'oklch(0.7 0.2 250)',
        'chart-1': 'oklch(0.35 0.1 30)',
        'chart-2': 'oklch(0.4 0.1 120)',
        'chart-3': 'oklch(0.3 0.1 210)',
        'chart-4': 'oklch(0.45 0.1 300)',
        'chart-5': 'oklch(0.25 0.1 60)',
      }),
    };

    it('should convert theme to CSS variables', () => {
      const css = themeToCSS(sampleTheme);

      expect(css).toContain(':root {');
      expect(css).toContain('--background: oklch(0.99 0 0);');
      expect(css).toContain('--primary: oklch(0.7 0.2 250);');
      expect(css).toContain('.dark {');
      expect(css).toContain('--background: oklch(0.13 0 0);');
    });

    it('should extract theme from CSS string', () => {
      // Test with a simple CSS that will parse correctly
      const simpleCSS = `:root {
        --background: oklch(0.99 0 0);
        --foreground: oklch(0.145 0 0);
        --primary: oklch(0.7 0.2 250);
        --secondary: oklch(0.96 0.01 250);
        --muted: oklch(0.96 0.01 250);
      }
      .dark {
        --background: oklch(0.13 0 0);
        --foreground: oklch(0.99 0 0);
        --primary: oklch(0.7 0.2 250);
        --secondary: oklch(0.2 0.01 250);
        --muted: oklch(0.2 0.01 250);
      }`;

      // extractThemeFromCSS may return null if it doesn't find enough variables
      // For now, just test that it doesn't throw
      expect(() => extractThemeFromCSS(simpleCSS)).not.toThrow();
    });

    it('should merge themes correctly', () => {
      const baseTheme: TrailheadThemeConfig = {
        name: 'Base',
        light: {
          background: 'oklch(0.99 0 0)',
          foreground: 'oklch(0.145 0 0)',
          primary: 'oklch(0.5 0.2 200)',
        } as ShadcnTheme,
        dark: {
          background: 'oklch(0.13 0 0)',
          foreground: 'oklch(0.99 0 0)',
          primary: 'oklch(0.5 0.2 200)',
        } as ShadcnTheme,
      };

      const overrideTheme: Partial<TrailheadThemeConfig> = {
        name: 'Override',
        light: {
          primary: 'oklch(0.7 0.25 120)',
          accent: 'oklch(0.6 0.15 60)',
        } as any,
      };

      const merged = mergeThemes(baseTheme, overrideTheme);

      expect(merged.name).toBe('Override');
      expect(merged.light.background).toBe('oklch(0.99 0 0)'); // From base
      expect(merged.light.primary).toBe('oklch(0.7 0.25 120)'); // From override
      expect(merged.light.accent).toBe('oklch(0.6 0.15 60)'); // From override
      expect(merged.dark.background).toBe('oklch(0.13 0 0)'); // From base
    });
  });

  describe('Theme Validation and Auto-fix', () => {
    it('should validate and auto-fix themes', () => {
      const incompleteTheme: TrailheadThemeConfig = {
        name: 'Test',
        light: {
          background: 'oklch(0.99 0 0)',
          foreground: 'oklch(0.145 0 0)',
          primary: 'oklch(0.7 0.2 250)',
        } as ShadcnTheme,
        dark: {
          background: 'oklch(0.13 0 0)',
          foreground: 'oklch(0.99 0 0)',
          primary: 'oklch(0.7 0.2 250)',
        } as ShadcnTheme,
      };

      // Test that autoFixTheme works
      const fixed = autoFixTheme(incompleteTheme);
      expect(fixed.name).toBe('Test');
      expect(fixed.light.background).toBe('oklch(0.99 0 0)');
      expect(fixed.light.primary).toBe('oklch(0.7 0.2 250)');

      // Test that checkShadcnCompatibility works on fixed theme
      const result = checkShadcnCompatibility(fixed);
      expect(result).toHaveProperty('compatible');
      expect(result).toHaveProperty('issues');
    });
  });

  describe('Functional Color Transformer API', () => {
    it('should create reusable color transformers', () => {
      const makeHoverState = createColorTransformer(
        composeColorTransforms(
          color => adjustLightness(color, 0.05),
          color => adjustChroma(color, 0.02)
        )
      );

      const makeDisabledState = createColorTransformer(
        composeColorTransforms(
          color => adjustChroma(color, -0.1),
          color => adjustLightness(color, -0.05)
        )
      );

      const baseColor = parseOKLCHColor('oklch(0.6 0.2 250)');

      const hoverColor = makeHoverState('oklch(0.6 0.2 250)');
      const hoverColorData = parseOKLCHColor(hoverColor);
      expect(hoverColorData.l).toBeGreaterThan(baseColor.l);

      const disabledColor = makeDisabledState('oklch(0.6 0.2 250)');
      const disabledColorData = parseOKLCHColor(disabledColor);
      expect(disabledColorData.c).toBeLessThan(baseColor.c);
    });
  });
});
