/**
 * Theme Utils Tests
 *
 * High-ROI tests focusing on OKLCH color manipulation, theme generation,
 * and business-critical functionality
 */

import { describe, it, expect } from 'vitest'
import {
  type OKLCHColorData,
  parseOKLCHColor,
  formatOKLCHColor,
  adjustLightness,
  adjustChroma,
  rotateHue,
  getContrastingColor,
  invertForDarkMode,
  ensureInGamut,
  clampColorChroma,
  composeColorTransforms,
  createColorTransformer,
  generateColorPalette,
  themeToCSS,
  mergeThemes,
  extractThemeFromCSS,
  checkShadcnCompatibility,
  autoFixTheme,
  createLighterVariant,
  createDesaturatedVariant,
  createComplementaryColor,
} from '../../../../src/components/theme/utils'
import type { TrailheadThemeConfig } from '../../../../src/components/theme/config'

describe('OKLCH Color Parsing and Formatting', () => {
  it('parses valid OKLCH colors correctly', () => {
    const color = parseOKLCHColor('oklch(0.7 0.15 180)')
    expect(color.mode).toBe('oklch')
    expect(color.l).toBeCloseTo(0.7, 2)
    expect(color.c).toBeCloseTo(0.15, 2)
    expect(color.h).toBeCloseTo(180, 1)
    expect(color.alpha || 1).toBe(1)
  })

  it('parses hex colors and converts to OKLCH', () => {
    const color = parseOKLCHColor('#ff0000')
    expect(color.mode).toBe('oklch')
    expect(color.l).toBeGreaterThan(0.4)
    expect(color.l).toBeLessThan(0.8)
    expect(color.c).toBeGreaterThan(0.2)
    expect(typeof color.h).toBe('number')
  })

  it('parses rgb colors and converts to OKLCH', () => {
    const color = parseOKLCHColor('rgb(255, 0, 0)')
    expect(color.mode).toBe('oklch')
    expect(color.l).toBeGreaterThan(0.4)
    expect(color.c).toBeGreaterThan(0.2)
  })

  it('throws error for invalid colors', () => {
    expect(() => parseOKLCHColor('invalid-color')).toThrow('Invalid color')
    expect(() => parseOKLCHColor('')).toThrow('Invalid color')
    expect(() => parseOKLCHColor('not-a-color')).toThrow('Invalid color')
  })

  it('formats OKLCH colors to string correctly', () => {
    const color: OKLCHColorData = {
      mode: 'oklch',
      l: 0.7,
      c: 0.15,
      h: 180,
      alpha: 1,
    }

    const formatted = formatOKLCHColor(color)
    expect(formatted).toBe('oklch(0.700 0.150 180.000)')
  })

  it('formats OKLCH colors with alpha correctly', () => {
    const color: OKLCHColorData = {
      mode: 'oklch',
      l: 0.7,
      c: 0.15,
      h: 180,
      alpha: 0.5,
    }

    const formatted = formatOKLCHColor(color)
    expect(formatted).toBe('oklch(0.700 0.150 180.000 / 0.5)')
  })

  it('handles achromatic colors (no hue)', () => {
    const color: OKLCHColorData = {
      mode: 'oklch',
      l: 0.5,
      c: 0,
    }

    const formatted = formatOKLCHColor(color)
    expect(formatted).toBe('oklch(0.500 0.000 0.000)')
  })
})

describe('Color Transformation Functions', () => {
  const baseColor: OKLCHColorData = {
    mode: 'oklch',
    l: 0.5,
    c: 0.15,
    h: 180,
    alpha: 1,
  }

  it('adjusts lightness correctly', () => {
    const lighter = adjustLightness(baseColor, 0.2)
    expect(lighter.l).toBe(0.7)
    expect(lighter.c).toBe(baseColor.c)
    expect(lighter.h).toBe(baseColor.h)

    const darker = adjustLightness(baseColor, -0.2)
    expect(darker.l).toBe(0.3)
  })

  it('clamps lightness to valid range', () => {
    const tooLight = adjustLightness(baseColor, 1.0)
    expect(tooLight.l).toBe(1.0)

    const tooDark = adjustLightness(baseColor, -1.0)
    expect(tooDark.l).toBe(0.0)
  })

  it('adjusts chroma correctly', () => {
    const moreVibrant = adjustChroma(baseColor, 0.1)
    expect(moreVibrant.c).toBe(0.25)
    expect(moreVibrant.l).toBe(baseColor.l)
    expect(moreVibrant.h).toBe(baseColor.h)

    const lessVibrant = adjustChroma(baseColor, -0.05)
    expect(lessVibrant.c).toBeCloseTo(0.1, 5)
  })

  it('prevents negative chroma values', () => {
    const result = adjustChroma(baseColor, -1.0)
    expect(result.c).toBe(0)
  })

  it('rotates hue correctly', () => {
    const rotated = rotateHue(baseColor, 90)
    expect(rotated.h).toBe(270)
    expect(rotated.l).toBe(baseColor.l)
    expect(rotated.c).toBe(baseColor.c)
  })

  it('handles hue rotation overflow', () => {
    const rotated = rotateHue(baseColor, 200)
    expect(rotated.h).toBe(20) // 180 + 200 = 380 % 360 = 20
  })

  it('inverts colors for dark mode', () => {
    const inverted = invertForDarkMode(baseColor)
    expect(inverted.l).toBe(0.5) // 1 - 0.5 = 0.5
    expect(inverted.c).toBe(baseColor.c)
    expect(inverted.h).toBe(baseColor.h)
  })
})

describe('Contrast and Accessibility', () => {
  it('provides contrasting colors for light backgrounds', () => {
    const lightBg: OKLCHColorData = {
      mode: 'oklch',
      l: 0.9,
      c: 0.05,
      h: 0,
    }

    const contrast = getContrastingColor(lightBg)
    expect(contrast.l).toBeLessThan(0.5) // Should be dark text
    expect(contrast.c).toBe(0) // Should be achromatic
  })

  it('provides contrasting colors for dark backgrounds', () => {
    const darkBg: OKLCHColorData = {
      mode: 'oklch',
      l: 0.2,
      c: 0.05,
      h: 0,
    }

    const contrast = getContrastingColor(darkBg)
    expect(contrast.l).toBeGreaterThan(0.8) // Should be light text
    expect(contrast.c).toBe(0) // Should be achromatic
  })

  it('preserves alpha channel in contrasting colors', () => {
    const colorWithAlpha: OKLCHColorData = {
      mode: 'oklch',
      l: 0.5,
      c: 0.1,
      h: 120,
      alpha: 0.8,
    }

    const contrast = getContrastingColor(colorWithAlpha)
    expect(contrast.alpha).toBe(0.8)
  })
})

describe('Gamut Mapping', () => {
  it('ensures colors are within gamut', () => {
    const highChromaColor: OKLCHColorData = {
      mode: 'oklch',
      l: 0.5,
      c: 0.5, // Very high chroma, likely out of gamut
      h: 120,
    }

    const inGamut = ensureInGamut(highChromaColor)
    expect(inGamut.mode).toBe('oklch')
    expect(inGamut.l).toBe(highChromaColor.l)
    expect(inGamut.h).toBe(highChromaColor.h)
    expect(inGamut.c).toBeLessThanOrEqual(highChromaColor.c)
  })

  it('clamps chroma to displayable values', () => {
    const highChromaColor: OKLCHColorData = {
      mode: 'oklch',
      l: 0.8,
      c: 0.4, // Very high chroma
      h: 60,
    }

    const clamped = clampColorChroma(highChromaColor)
    expect(clamped.mode).toBe('oklch')
    expect(clamped.l).toBe(highChromaColor.l)
    expect(clamped.h).toBe(highChromaColor.h)
    expect(clamped.c).toBeLessThanOrEqual(highChromaColor.c)
  })
})

describe('Functional Composition', () => {
  const baseColor: OKLCHColorData = {
    mode: 'oklch',
    l: 0.5,
    c: 0.15,
    h: 180,
  }

  it('composes color transformations correctly', () => {
    const transform = composeColorTransforms(
      (color) => adjustLightness(color, 0.1),
      (color) => adjustChroma(color, 0.05),
      (color) => rotateHue(color, 30)
    )

    const result = transform(baseColor)
    expect(result.l).toBe(0.6)
    expect(result.c).toBe(0.2)
    expect(result.h).toBe(210)
  })

  it('creates string-to-string color transformers', () => {
    const lighten = createColorTransformer((color) => adjustLightness(color, 0.1))

    const result = lighten('oklch(0.5 0.15 180)')
    expect(result).toContain('oklch(0.600')
  })

  it('provides functional examples', () => {
    const inputColor = 'oklch(0.5 0.15 180)'

    const lighter = createLighterVariant(inputColor)
    expect(lighter).toContain('oklch(0.600')

    const desaturated = createDesaturatedVariant(inputColor)
    const desaturatedParsed = parseOKLCHColor(desaturated)
    expect(desaturatedParsed.c).toBeLessThan(0.15)

    const complementary = createComplementaryColor(inputColor)
    const complementaryParsed = parseOKLCHColor(complementary)
    expect(complementaryParsed.h).toBeCloseTo(0, 1) // 180 + 180 = 360 % 360 = 0
  })
})

describe('Color Palette Generation', () => {
  it('generates complete color palette from base color', () => {
    const palette = generateColorPalette('oklch(0.6 0.2 240)')

    expect(palette).toHaveProperty('50')
    expect(palette).toHaveProperty('100')
    expect(palette).toHaveProperty('200')
    expect(palette).toHaveProperty('300')
    expect(palette).toHaveProperty('400')
    expect(palette).toHaveProperty('500')
    expect(palette).toHaveProperty('600')
    expect(palette).toHaveProperty('700')
    expect(palette).toHaveProperty('800')
    expect(palette).toHaveProperty('900')
    expect(palette).toHaveProperty('950')

    // Base color should be 500
    expect(palette['500']).toBe('oklch(0.6 0.2 240)')

    // Lighter shades should have higher lightness
    const shade50 = parseOKLCHColor(palette['50'])
    const shade500 = parseOKLCHColor(palette['500'])
    expect(shade50.l).toBeGreaterThan(shade500.l)

    // Darker shades should have lower lightness
    const shade900 = parseOKLCHColor(palette['900'])
    expect(shade900.l).toBeLessThan(shade500.l)
  })

  it('ensures all palette colors are in gamut', () => {
    const palette = generateColorPalette('oklch(0.6 0.3 120)') // High chroma green

    Object.values(palette).forEach((colorString) => {
      expect(() => parseOKLCHColor(colorString)).not.toThrow()
      const color = parseOKLCHColor(colorString)
      expect(color.l).toBeGreaterThanOrEqual(0)
      expect(color.l).toBeLessThanOrEqual(1)
      expect(color.c).toBeGreaterThanOrEqual(0)
    })
  })
})

describe('Theme CSS Generation', () => {
  const mockTheme: TrailheadThemeConfig = {
    name: 'Test Theme',
    light: {
      background: 'oklch(1 0 0)',
      foreground: 'oklch(0.09 0 0)',
      primary: 'oklch(0.6 0.25 240)',
      'primary-foreground': 'oklch(1 0 0)',
      secondary: 'oklch(0.9 0 0)',
      'secondary-foreground': 'oklch(0.1 0 0)',
      muted: 'oklch(0.95 0 0)',
      'muted-foreground': 'oklch(0.45 0 0)',
      accent: 'oklch(0.9 0 0)',
      'accent-foreground': 'oklch(0.1 0 0)',
      destructive: 'oklch(0.6 0.25 0)',
      'destructive-foreground': 'oklch(1 0 0)',
      border: 'oklch(0.9 0 0)',
      input: 'oklch(0.9 0 0)',
      ring: 'oklch(0.6 0.25 240)',
      card: 'oklch(1 0 0)',
      'card-foreground': 'oklch(0.09 0 0)',
      popover: 'oklch(1 0 0)',
      'popover-foreground': 'oklch(0.09 0 0)',
    } as any,
    dark: {
      background: 'oklch(0.09 0 0)',
      foreground: 'oklch(0.98 0 0)',
      primary: 'oklch(0.7 0.25 240)',
      'primary-foreground': 'oklch(0.09 0 0)',
      secondary: 'oklch(0.15 0 0)',
      'secondary-foreground': 'oklch(0.98 0 0)',
      muted: 'oklch(0.15 0 0)',
      'muted-foreground': 'oklch(0.65 0 0)',
      accent: 'oklch(0.15 0 0)',
      'accent-foreground': 'oklch(0.98 0 0)',
      destructive: 'oklch(0.7 0.25 0)',
      'destructive-foreground': 'oklch(0.98 0 0)',
      border: 'oklch(0.15 0 0)',
      input: 'oklch(0.15 0 0)',
      ring: 'oklch(0.7 0.25 240)',
      card: 'oklch(0.09 0 0)',
      'card-foreground': 'oklch(0.98 0 0)',
      popover: 'oklch(0.09 0 0)',
      'popover-foreground': 'oklch(0.98 0 0)',
    } as any,
  }

  it('generates CSS with proper format', () => {
    const css = themeToCSS(mockTheme)

    expect(css).toContain(':root {')
    expect(css).toContain('--background: oklch(1 0 0);')
    expect(css).toContain('--primary: oklch(0.6 0.25 240);')
    expect(css).toContain('.dark {')
    expect(css).toContain('}')
  })

  it('supports minification', () => {
    const css = themeToCSS(mockTheme, { minify: true })

    expect(css).not.toContain('\n')
    expect(css).not.toContain('  ')
    expect(css).toContain(':root{')
    expect(css).toContain('--background:oklch(1 0 0);')
  })

  it('supports custom selector', () => {
    const css = themeToCSS(mockTheme, { selector: '.my-theme' })

    expect(css).toContain('.my-theme {')
    expect(css).not.toContain(':root {')
  })

  it('includes component variables when requested', () => {
    const themeWithComponents: TrailheadThemeConfig = {
      ...mockTheme,
      components: {
        button: {
          'primary-bg': 'oklch(0.6 0.25 240)',
          'primary-text': 'oklch(1 0 0)',
        },
      },
    }

    const css = themeToCSS(themeWithComponents, { includeComponents: true })
    expect(css).toContain('--button-primary-bg: oklch(0.6 0.25 240);')
    expect(css).toContain('--button-primary-text: oklch(1 0 0);')
  })
})

describe('Theme Merging and Processing', () => {
  const baseTheme: TrailheadThemeConfig = {
    name: 'Base Theme',
    light: {
      background: 'oklch(1 0 0)',
      foreground: 'oklch(0.09 0 0)',
      primary: 'oklch(0.6 0.25 240)',
      'primary-foreground': 'oklch(1 0 0)',
    } as any,
    dark: {
      background: 'oklch(0.09 0 0)',
      foreground: 'oklch(0.98 0 0)',
      primary: 'oklch(0.7 0.25 240)',
      'primary-foreground': 'oklch(0.09 0 0)',
    } as any,
  }

  it('merges themes correctly', () => {
    const override = {
      name: 'Override Theme',
      light: {
        primary: 'oklch(0.6 0.25 120)', // Green instead of blue
      } as any,
    }

    const merged = mergeThemes(baseTheme, override)

    expect(merged.name).toBe('Override Theme')
    expect(merged.light.primary).toBe('oklch(0.6 0.25 120)')
    expect(merged.light.background).toBe('oklch(1 0 0)') // Preserved from base
    expect(merged.dark.primary).toBe('oklch(0.7 0.25 240)') // Unchanged from base
  })

  it('auto-fixes common theme issues', () => {
    const incompleteTheme: TrailheadThemeConfig = {
      name: 'Incomplete Theme',
      light: {
        background: 'oklch(1 0 0)',
        foreground: 'oklch(0.09 0 0)',
        // Missing card and popover colors
      } as any,
      dark: {
        background: 'oklch(0.09 0 0)',
        foreground: 'oklch(0.98 0 0)',
      } as any,
    }

    const fixed = autoFixTheme(incompleteTheme)

    expect(fixed.light.card).toBe(fixed.light.background)
    expect(fixed.light['card-foreground']).toBe(fixed.light.foreground)
    expect(fixed.light.popover).toBe(fixed.light.card)
    expect(fixed.light['popover-foreground']).toBe(fixed.light['card-foreground'])

    expect(fixed.dark.card).toBe(fixed.dark.background)
    expect(fixed.dark['card-foreground']).toBe(fixed.dark.foreground)
  })
})

describe('shadcn/ui Compatibility', () => {
  const compliantTheme: TrailheadThemeConfig = {
    name: 'Compliant Theme',
    light: {
      background: 'oklch(1 0 0)',
      foreground: 'oklch(0.09 0 0)',
      card: 'oklch(1 0 0)',
      'card-foreground': 'oklch(0.09 0 0)',
      popover: 'oklch(1 0 0)',
      'popover-foreground': 'oklch(0.09 0 0)',
      primary: 'oklch(0.6 0.25 240)',
      'primary-foreground': 'oklch(1 0 0)',
      secondary: 'oklch(0.9 0 0)',
      'secondary-foreground': 'oklch(0.1 0 0)',
      muted: 'oklch(0.95 0 0)',
      'muted-foreground': 'oklch(0.45 0 0)',
      accent: 'oklch(0.9 0 0)',
      'accent-foreground': 'oklch(0.1 0 0)',
      destructive: 'oklch(0.6 0.25 0)',
      'destructive-foreground': 'oklch(1 0 0)',
      border: 'oklch(0.9 0 0)',
      input: 'oklch(0.9 0 0)',
      ring: 'oklch(0.6 0.25 240)',
    } as any,
    dark: {
      background: 'oklch(0.09 0 0)',
      foreground: 'oklch(0.98 0 0)',
      card: 'oklch(0.09 0 0)',
      'card-foreground': 'oklch(0.98 0 0)',
      popover: 'oklch(0.09 0 0)',
      'popover-foreground': 'oklch(0.98 0 0)',
      primary: 'oklch(0.7 0.25 240)',
      'primary-foreground': 'oklch(0.09 0 0)',
      secondary: 'oklch(0.15 0 0)',
      'secondary-foreground': 'oklch(0.98 0 0)',
      muted: 'oklch(0.15 0 0)',
      'muted-foreground': 'oklch(0.65 0 0)',
      accent: 'oklch(0.15 0 0)',
      'accent-foreground': 'oklch(0.98 0 0)',
      destructive: 'oklch(0.7 0.25 0)',
      'destructive-foreground': 'oklch(0.98 0 0)',
      border: 'oklch(0.15 0 0)',
      input: 'oklch(0.15 0 0)',
      ring: 'oklch(0.7 0.25 240)',
    } as any,
  }

  it('validates compliant themes as compatible', () => {
    const result = checkShadcnCompatibility(compliantTheme)

    expect(result.compatible).toBe(true)
    expect(result.issues).toEqual([])
  })

  it('detects missing required variables', () => {
    const incompleteTheme = {
      ...compliantTheme,
      light: {
        background: 'oklch(1 0 0)',
        foreground: 'oklch(0.09 0 0)',
        // Missing required variables
      } as any,
    }

    const result = checkShadcnCompatibility(incompleteTheme)

    expect(result.compatible).toBe(false)
    expect(result.issues.length).toBeGreaterThan(0)
    expect(result.issues.some((issue) => issue.includes('Missing light theme variable'))).toBe(true)
  })

  it('validates color formats', () => {
    const invalidColorTheme = {
      ...compliantTheme,
      light: {
        ...compliantTheme.light,
        primary: 'invalid-color',
      },
    }

    const result = checkShadcnCompatibility(invalidColorTheme)

    expect(result.compatible).toBe(false)
    expect(result.issues.some((issue) => issue.includes('invalid color format'))).toBe(true)
  })
})

describe('Error Handling', () => {
  it('handles malformed CSS extraction gracefully', () => {
    const malformedCSS = 'not valid css at all'
    const result = extractThemeFromCSS(malformedCSS)
    expect(result).toBeNull()
  })

  it('handles partial CSS extraction', () => {
    const partialCSS = ':root { --background: white; --foreground: black; }'
    const result = extractThemeFromCSS(partialCSS)
    expect(result).toBeNull() // Not enough variables
  })

  it('maintains immutability in all transformations', () => {
    const originalColor: OKLCHColorData = {
      mode: 'oklch',
      l: 0.5,
      c: 0.15,
      h: 180,
      alpha: 1,
    }

    const transformed = adjustLightness(originalColor, 0.1)

    // Original should be unchanged
    expect(originalColor.l).toBe(0.5)
    expect(originalColor.c).toBe(0.15)
    expect(originalColor.h).toBe(180)

    // New object should have changes
    expect(transformed.l).toBe(0.6)
    expect(transformed).not.toBe(originalColor)
  })
})
