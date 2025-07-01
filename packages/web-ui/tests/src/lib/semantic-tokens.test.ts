/**
 * Semantic Tokens Tests
 *
 * High-ROI tests focusing on business logic and user-facing functionality
 * testing behavior users care about
 */

import { describe, it, expect } from 'vitest'
import {
  type SemanticColorToken,
  resolveSemanticToken,
  isSemanticToken,
  createSemanticStyles,
  createSemanticBadgeStyles,
  createSemanticButtonStyles,
  createSemanticCheckboxStyles,
  createSemanticRadioStyles,
  createSemanticSwitchStyles,
  createSemanticTextStyles,
  createSemanticLinkStyles,
  createSemanticDropdownStyles,
  createSemanticListboxStyles,
  createSemanticComboboxStyles,
  resolveSemanticColor,
  resolveButtonColor,
  resolveBadgeColor,
  validateSemanticTokens,
  getSemanticTokens,
} from '../../../src/components/theme/semantic-tokens'

describe('Semantic Token Resolution', () => {
  it('resolves semantic tokens to correct values', () => {
    expect(resolveSemanticToken('primary')).toBe('primary')
    expect(resolveSemanticToken('secondary')).toBe('secondary')
    expect(resolveSemanticToken('success')).toBe('green')
    expect(resolveSemanticToken('warning')).toBe('amber')
    expect(resolveSemanticToken('danger')).toBe('destructive')
  })

  it('validates semantic tokens correctly', () => {
    expect(isSemanticToken('primary')).toBe(true)
    expect(isSemanticToken('secondary')).toBe(true)
    expect(isSemanticToken('success')).toBe(true)
    expect(isSemanticToken('warning')).toBe(true)
    expect(isSemanticToken('danger')).toBe(true)

    // Invalid tokens
    expect(isSemanticToken('invalid')).toBe(false)
    expect(isSemanticToken('red')).toBe(false)
    expect(isSemanticToken('')).toBe(false)
  })

  it('provides complete list of semantic tokens', () => {
    const tokens = getSemanticTokens()
    expect(tokens).toEqual(['primary', 'secondary', 'success', 'warning', 'danger'])
  })

  it('validates semantic token configuration', () => {
    const validation = validateSemanticTokens()
    expect(validation.isValid).toBe(true)
    expect(validation.errors).toEqual([])
  })
})

describe('Style Generation', () => {
  it('generates correct solid variant styles', () => {
    const primarySolid = createSemanticStyles('primary', 'solid')
    expect(primarySolid).toContain('bg-primary')
    expect(primarySolid).toContain('text-primary-foreground')
    expect(primarySolid).toContain('hover:bg-primary/90')
  })

  it('generates correct outline variant styles', () => {
    const primaryOutline = createSemanticStyles('primary', 'outline')
    expect(primaryOutline).toContain('border-primary')
    expect(primaryOutline).toContain('text-primary')
    expect(primaryOutline).toContain('hover:bg-primary/10')
  })

  it('generates correct ghost variant styles', () => {
    const primaryGhost = createSemanticStyles('primary', 'ghost')
    expect(primaryGhost).toContain('text-primary')
    expect(primaryGhost).toContain('hover:bg-primary/10')
  })

  it('defaults to solid variant', () => {
    const defaultStyle = createSemanticStyles('primary')
    expect(defaultStyle).toContain('bg-primary')
    expect(defaultStyle).toContain('text-primary-foreground')
  })
})

describe('Component-Specific Style Generation', () => {
  describe('Badge Styles', () => {
    it('generates correct badge styles for CSS variable tokens', () => {
      const primaryBadge = createSemanticBadgeStyles('primary')
      expect(primaryBadge).toContain('bg-primary/15')
      expect(primaryBadge).toContain('text-primary-foreground')
      expect(primaryBadge).toContain('group-data-hover:bg-primary/25')
    })

    it('generates correct badge styles for Tailwind color tokens', () => {
      const successBadge = createSemanticBadgeStyles('success')
      expect(successBadge).toContain('bg-green/15')
      expect(successBadge).toContain('text-green-700')
      expect(successBadge).toContain('dark:text-green-400')
    })

    it('handles warning token with amber colors', () => {
      const warningBadge = createSemanticBadgeStyles('warning')
      expect(warningBadge).toContain('bg-amber/15')
      expect(warningBadge).toContain('text-amber-700')
      expect(warningBadge).toContain('dark:text-amber-400')
    })
  })

  describe('Button Styles', () => {
    it('generates button styles with CSS variables', () => {
      const primaryButton = createSemanticButtonStyles('primary')
      expect(primaryButton).toContain('text-white')
      expect(primaryButton).toContain('[--btn-bg:var(--color-primary)]')
      expect(primaryButton).toContain('[--btn-border:var(--color-primary)]')
      expect(primaryButton).toContain('[--btn-hover-overlay:var(--color-white)]/10')
    })

    it('includes icon color variables', () => {
      const dangerButton = createSemanticButtonStyles('danger')
      expect(dangerButton).toContain('[--btn-icon:var(--color-white)]/60')
      expect(dangerButton).toContain('data-active:[--btn-icon:var(--color-white)]/80')
      expect(dangerButton).toContain('data-hover:[--btn-icon:var(--color-white)]/80')
    })
  })

  describe('Form Control Styles', () => {
    it('generates checkbox styles with CSS variables', () => {
      const primaryCheckbox = createSemanticCheckboxStyles('primary')
      expect(primaryCheckbox).toContain('[--checkbox-check:var(--color-white)]')
      expect(primaryCheckbox).toContain('[--checkbox-checked-bg:var(--color-primary)]')
      expect(primaryCheckbox).toContain('[--checkbox-checked-border:var(--color-primary)]/90')
    })

    it('generates radio styles with CSS variables', () => {
      const secondaryRadio = createSemanticRadioStyles('secondary')
      expect(secondaryRadio).toContain('[--radio-checked-bg:var(--color-secondary)]')
      expect(secondaryRadio).toContain('[--radio-checked-border:var(--color-secondary)]/90')
      expect(secondaryRadio).toContain('[--radio-checked-indicator:var(--color-white)]')
    })

    it('generates switch styles with CSS variables', () => {
      const primarySwitch = createSemanticSwitchStyles('primary')
      expect(primarySwitch).toContain('[--switch-bg-ring:var(--color-primary)]/90')
      expect(primarySwitch).toContain('[--switch-bg:var(--color-primary)]')
      expect(primarySwitch).toContain('dark:[--switch-bg-ring:transparent]')
      expect(primarySwitch).toContain('dark:[--switch-bg:var(--color-white)]/25')
    })
  })

  describe('Text and Link Styles', () => {
    it('generates text styles for CSS variable tokens', () => {
      const primaryText = createSemanticTextStyles('primary')
      expect(primaryText).toBe('text-primary-foreground dark:text-primary-foreground')
    })

    it('generates text styles for Tailwind color tokens', () => {
      const successText = createSemanticTextStyles('success')
      expect(successText).toBe('text-green-700 dark:text-green-400')

      const warningText = createSemanticTextStyles('warning')
      expect(warningText).toBe('text-amber-700 dark:text-amber-400')
    })

    it('generates link styles with hover states', () => {
      const successLink = createSemanticLinkStyles('success')
      expect(successLink).toContain('text-green-700')
      expect(successLink).toContain('hover:text-green-800')
      expect(successLink).toContain('dark:text-green-400')
      expect(successLink).toContain('dark:hover:text-green-300')
    })

    it('generates link styles for CSS variable tokens', () => {
      const primaryLink = createSemanticLinkStyles('primary')
      expect(primaryLink).toContain('text-primary-foreground')
      expect(primaryLink).toContain('hover:text-primary-foreground/80')
      expect(primaryLink).toContain('dark:text-primary-foreground')
      expect(primaryLink).toContain('dark:hover:text-primary-foreground/80')
    })
  })

  describe('Interactive Component Styles', () => {
    it('generates dropdown styles with proper contrast', () => {
      const successDropdown = createSemanticDropdownStyles('success')
      expect(successDropdown).toBe('data-focus:bg-green-600 data-focus:text-white')

      const primaryDropdown = createSemanticDropdownStyles('primary')
      expect(primaryDropdown).toBe('data-focus:bg-primary data-focus:text-primary-foreground')
    })

    it('generates listbox styles with proper contrast', () => {
      const warningListbox = createSemanticListboxStyles('warning')
      expect(warningListbox).toBe('data-focus:bg-amber-600 data-focus:text-white')

      const dangerListbox = createSemanticListboxStyles('danger')
      expect(dangerListbox).toBe('data-focus:bg-destructive data-focus:text-destructive-foreground')
    })

    it('generates combobox styles with proper contrast', () => {
      const successCombobox = createSemanticComboboxStyles('success')
      expect(successCombobox).toBe('data-focus:bg-green-600 data-focus:text-white')

      const secondaryCombobox = createSemanticComboboxStyles('secondary')
      expect(secondaryCombobox).toBe('data-focus:bg-secondary data-focus:text-secondary-foreground')
    })
  })
})

describe('Component Integration', () => {
  describe('resolveSemanticColor', () => {
    it('returns fallback for non-semantic tokens', () => {
      const fallback = 'original-color'
      expect(resolveSemanticColor('red', 'button', fallback)).toBe(fallback)
      expect(resolveSemanticColor('blue-500', 'badge', fallback)).toBe(fallback)
    })

    it('generates component-specific styles for semantic tokens', () => {
      const buttonStyle = resolveSemanticColor('primary', 'button', 'fallback')
      expect(typeof buttonStyle).toBe('string')
      expect(buttonStyle).toContain('[--btn-bg:var(--color-primary)]')

      const badgeStyle = resolveSemanticColor('success', 'badge', 'fallback')
      expect(typeof badgeStyle).toBe('string')
      expect(badgeStyle).toContain('bg-green/15')
    })

    it('handles outline styles for input and table components', () => {
      const inputStyle = resolveSemanticColor('primary', 'input', 'fallback')
      const tableStyle = resolveSemanticColor('secondary', 'table', 'fallback')

      expect(typeof inputStyle).toBe('string')
      expect(typeof tableStyle).toBe('string')
      expect(inputStyle).toContain('border-primary')
      expect(tableStyle).toContain('border-secondary')
    })
  })

  describe('Component Helpers', () => {
    it('resolves button colors correctly', () => {
      const mockCatalystStyles = {}

      // Returns empty array for non-semantic tokens
      expect(resolveButtonColor('red', mockCatalystStyles)).toEqual([])
      expect(resolveButtonColor(undefined, mockCatalystStyles)).toEqual([])

      // Returns semantic styles for semantic tokens
      const primaryResult = resolveButtonColor('primary', mockCatalystStyles)
      expect(primaryResult).toHaveLength(1)
      expect(primaryResult[0]).toContain('[--btn-bg:var(--color-primary)]')
    })

    it('resolves badge colors correctly', () => {
      const mockCatalystColors = {}

      // Returns empty string for non-semantic tokens
      expect(resolveBadgeColor('red', mockCatalystColors)).toBe('')
      expect(resolveBadgeColor(undefined, mockCatalystColors)).toBe('')

      // Returns semantic styles for semantic tokens
      const successResult = resolveBadgeColor('success', mockCatalystColors)
      expect(successResult).toContain('bg-green/15')
      expect(successResult).toContain('text-green-700')
    })
  })
})

describe('Error Handling and Edge Cases', () => {
  it('handles all semantic tokens without errors', () => {
    const tokens: SemanticColorToken[] = ['primary', 'secondary', 'success', 'warning', 'danger']

    tokens.forEach((token) => {
      expect(() => resolveSemanticToken(token)).not.toThrow()
      expect(() => createSemanticStyles(token)).not.toThrow()
      expect(() => createSemanticBadgeStyles(token)).not.toThrow()
      expect(() => createSemanticButtonStyles(token)).not.toThrow()
      expect(() => createSemanticTextStyles(token)).not.toThrow()
      expect(() => createSemanticLinkStyles(token)).not.toThrow()
    })
  })

  it('maintains consistent API across all style generators', () => {
    const token: SemanticColorToken = 'primary'

    // All style generators should return strings
    expect(typeof createSemanticStyles(token)).toBe('string')
    expect(typeof createSemanticBadgeStyles(token)).toBe('string')
    expect(typeof createSemanticButtonStyles(token)).toBe('string')
    expect(typeof createSemanticCheckboxStyles(token)).toBe('string')
    expect(typeof createSemanticRadioStyles(token)).toBe('string')
    expect(typeof createSemanticSwitchStyles(token)).toBe('string')
    expect(typeof createSemanticTextStyles(token)).toBe('string')
    expect(typeof createSemanticLinkStyles(token)).toBe('string')
    expect(typeof createSemanticDropdownStyles(token)).toBe('string')
    expect(typeof createSemanticListboxStyles(token)).toBe('string')
    expect(typeof createSemanticComboboxStyles(token)).toBe('string')
  })
})
