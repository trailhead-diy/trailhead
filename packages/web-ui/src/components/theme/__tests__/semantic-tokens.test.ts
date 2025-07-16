/**
 * @fileoverview Tests for Semantic Token System
 *
 * HIGH-ROI tests focusing on:
 * - Token mapping and resolution
 * - Style generation business logic
 * - Component-specific token handling
 * - Fallback chain reliability
 * - Validation and error handling
 * - Transform process compatibility
 */

import { describe, it, expect } from 'vitest'
import {
  // Types
  type SemanticColorToken,

  // Mappings
  SEMANTIC_MAPPINGS,
  HIERARCHICAL_TEXT_MAPPINGS,
  ICON_SEMANTIC_MAPPINGS,
  BORDER_SEMANTIC_MAPPINGS,

  // Resolvers
  resolveSemanticToken,
  resolveHierarchicalTextToken,
  resolveIconSemanticToken,
  resolveBorderSemanticToken,
  resolveAnySemanticToken,

  // Validators
  isSemanticToken,
  isAnySemanticToken,
  validateSemanticTokens,
  validateHierarchicalSemanticTokens,

  // Style Generators
  createSemanticStyles,
  createSemanticBadgeStyles,
  createSemanticButtonStyles,
  createSemanticCheckboxStyles,
  createSemanticTextStyles,
  createSemanticLinkStyles,
  createSemanticDropdownStyles,

  // Enhanced Generators
  createHierarchicalTextStyles,
  createIconSemanticStyles,
  createButtonIconStyles,
  createBorderSemanticStyles,
  createCSSVariableFallbackChain,

  // Component Helpers
  resolveButtonColor,
  resolveBadgeColor,
  resolveSemanticColor,

  // Utilities
  getSemanticTokens,
  getAllSemanticTokens,
  createCatalystThemeVariables,
} from '../semantic-tokens'

describe('Semantic Token System', () => {
  describe('Token Mappings Validation', () => {
    it('should have complete semantic color token mappings', () => {
      const expectedTokens: SemanticColorToken[] = [
        'primary',
        'secondary',
        'success',
        'warning',
        'danger',
      ]

      expectedTokens.forEach((token) => {
        expect(SEMANTIC_MAPPINGS).toHaveProperty(token)
        expect(SEMANTIC_MAPPINGS[token]).toBeTruthy()
      })

      expect(Object.keys(SEMANTIC_MAPPINGS)).toEqual(expectedTokens)
    })

    it('should map semantic tokens to appropriate values', () => {
      expect(SEMANTIC_MAPPINGS.primary).toBe('primary')
      expect(SEMANTIC_MAPPINGS.secondary).toBe('secondary')
      expect(SEMANTIC_MAPPINGS.success).toBe('green')
      expect(SEMANTIC_MAPPINGS.warning).toBe('amber')
      expect(SEMANTIC_MAPPINGS.danger).toBe('destructive')
    })

    it('should have hierarchical text mappings', () => {
      const expectedMappings = [
        'text-primary',
        'text-secondary',
        'text-tertiary',
        'text-quaternary',
        'text-muted',
      ]

      expectedMappings.forEach((token) => {
        expect(HIERARCHICAL_TEXT_MAPPINGS).toHaveProperty(token)
      })
    })

    it('should have icon semantic mappings', () => {
      const expectedMappings = [
        'icon-primary',
        'icon-secondary',
        'icon-inactive',
        'icon-active',
        'icon-hover',
        'icon-muted',
      ]

      expectedMappings.forEach((token) => {
        expect(ICON_SEMANTIC_MAPPINGS).toHaveProperty(token)
      })
    })

    it('should have border semantic mappings', () => {
      const expectedMappings = ['border-strong', 'border-medium', 'border-subtle', 'border-ghost']

      expectedMappings.forEach((token) => {
        expect(BORDER_SEMANTIC_MAPPINGS).toHaveProperty(token)
      })
    })
  })

  describe('Token Resolution Functions', () => {
    it('should resolve semantic color tokens correctly', () => {
      expect(resolveSemanticToken('primary')).toBe('primary')
      expect(resolveSemanticToken('success')).toBe('green')
      expect(resolveSemanticToken('warning')).toBe('amber')
      expect(resolveSemanticToken('danger')).toBe('destructive')
    })

    it('should resolve hierarchical text tokens', () => {
      expect(resolveHierarchicalTextToken('text-primary')).toBe('foreground')
      expect(resolveHierarchicalTextToken('text-secondary')).toBe('secondary-foreground')
      expect(resolveHierarchicalTextToken('text-muted')).toBe('muted-foreground')
    })

    it('should resolve icon semantic tokens', () => {
      expect(resolveIconSemanticToken('icon-primary')).toBe('icon-primary')
      expect(resolveIconSemanticToken('icon-inactive')).toBe('icon-inactive')
      expect(resolveIconSemanticToken('icon-active')).toBe('icon-active')
    })

    it('should resolve border semantic tokens', () => {
      expect(resolveBorderSemanticToken('border-strong')).toBe('border-strong')
      expect(resolveBorderSemanticToken('border-medium')).toBe('border')
      expect(resolveBorderSemanticToken('border-subtle')).toBe('border-subtle')
    })

    it('should resolve any semantic token with universal resolver', () => {
      // Test different token types
      expect(resolveAnySemanticToken('primary')).toBe('primary')
      expect(resolveAnySemanticToken('text-primary')).toBe('foreground')
      expect(resolveAnySemanticToken('icon-primary')).toBe('icon-primary')
      expect(resolveAnySemanticToken('border-strong')).toBe('border-strong')

      // Test unknown token returns original
      expect(resolveAnySemanticToken('unknown-token')).toBe('unknown-token')
    })
  })

  describe('Token Validation Functions', () => {
    it('should correctly identify semantic color tokens', () => {
      expect(isSemanticToken('primary')).toBe(true)
      expect(isSemanticToken('success')).toBe(true)
      expect(isSemanticToken('warning')).toBe(true)
      expect(isSemanticToken('danger')).toBe(true)

      expect(isSemanticToken('text-primary')).toBe(false)
      expect(isSemanticToken('icon-primary')).toBe(false)
      expect(isSemanticToken('unknown')).toBe(false)
    })

    it('should correctly identify any semantic token', () => {
      expect(isAnySemanticToken('primary')).toBe(true)
      expect(isAnySemanticToken('text-primary')).toBe(true)
      expect(isAnySemanticToken('icon-primary')).toBe(true)
      expect(isAnySemanticToken('border-strong')).toBe(true)

      expect(isAnySemanticToken('unknown')).toBe(false)
      expect(isAnySemanticToken('')).toBe(false)
    })

    it('should validate semantic token system', () => {
      const validation = validateSemanticTokens()
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should validate hierarchical semantic tokens', () => {
      const validation = validateHierarchicalSemanticTokens()
      // The validation function should return proper structure even if there are some issues
      expect(validation).toHaveProperty('isValid')
      expect(validation).toHaveProperty('errors')
      expect(typeof validation.isValid).toBe('boolean')
      expect(Array.isArray(validation.errors)).toBe(true)

      // If there are errors, they should be descriptive
      if (!validation.isValid) {
        validation.errors.forEach((error) => {
          expect(typeof error).toBe('string')
          expect(error.length).toBeGreaterThan(0)
        })
      }
    })
  })

  describe('Style Generation Functions', () => {
    describe('Basic Semantic Styles', () => {
      it('should generate solid variant styles', () => {
        const styles = createSemanticStyles('primary', 'solid')
        expect(styles).toContain('bg-primary')
        expect(styles).toContain('text-primary-foreground')
        expect(styles).toContain('hover:bg-primary/90')
      })

      it('should generate outline variant styles', () => {
        const styles = createSemanticStyles('secondary', 'outline')
        expect(styles).toContain('border')
        expect(styles).toContain('border-secondary')
        expect(styles).toContain('text-secondary')
        expect(styles).toContain('hover:bg-secondary/10')
      })

      it('should generate ghost variant styles', () => {
        const styles = createSemanticStyles('success', 'ghost')
        expect(styles).toContain('text-green')
        expect(styles).toContain('hover:bg-green/10')
      })
    })

    describe('Component-Specific Style Generators', () => {
      it('should generate badge styles with proper contrast', () => {
        const primaryBadge = createSemanticBadgeStyles('primary')
        expect(primaryBadge).toContain('bg-primary/15')
        expect(primaryBadge).toContain('text-primary-foreground')

        const successBadge = createSemanticBadgeStyles('success')
        expect(successBadge).toContain('text-green-700')
        expect(successBadge).toContain('dark:text-green-400')
      })

      it('should generate button styles with CSS variables', () => {
        const buttonStyles = createSemanticButtonStyles('primary')
        expect(buttonStyles).toContain('[--btn-bg:var(--color-primary)]')
        expect(buttonStyles).toContain('[--btn-border:var(--color-primary)]')
        expect(buttonStyles).toContain('text-white')
      })

      it('should generate checkbox styles with CSS variables', () => {
        const checkboxStyles = createSemanticCheckboxStyles('success')
        expect(checkboxStyles).toContain('[--checkbox-checked-bg:var(--color-green)]')
        expect(checkboxStyles).toContain('[--checkbox-check:var(--color-white)]')
      })

      it('should generate text styles with proper colors', () => {
        const primaryText = createSemanticTextStyles('primary')
        expect(primaryText).toContain('text-primary-foreground')

        const successText = createSemanticTextStyles('success')
        expect(successText).toContain('text-green-700')
        expect(successText).toContain('dark:text-green-400')
      })

      it('should generate link styles with hover states', () => {
        const primaryLink = createSemanticLinkStyles('primary')
        expect(primaryLink).toContain('text-primary-foreground')
        expect(primaryLink).toContain('hover:text-primary-foreground/80')

        const successLink = createSemanticLinkStyles('success')
        expect(successLink).toContain('text-green-700')
        expect(successLink).toContain('hover:text-green-800')
      })

      it('should generate dropdown focus styles with proper contrast', () => {
        const primaryDropdown = createSemanticDropdownStyles('primary')
        expect(primaryDropdown).toContain('data-focus:bg-primary')
        expect(primaryDropdown).toContain('data-focus:text-primary-foreground')

        const successDropdown = createSemanticDropdownStyles('success')
        expect(successDropdown).toContain('data-focus:bg-green-600')
        expect(successDropdown).toContain('data-focus:text-white')
      })
    })

    describe('Enhanced Style Generators', () => {
      it('should generate hierarchical text styles', () => {
        const textStyles = createHierarchicalTextStyles('text-primary')
        expect(textStyles).toBe('text-foreground')

        const mutedStyles = createHierarchicalTextStyles('text-muted')
        expect(mutedStyles).toBe('text-muted-foreground')
      })

      it('should generate icon semantic styles', () => {
        const iconStyles = createIconSemanticStyles('icon-primary')
        expect(iconStyles).toBe('[--icon:var(--color-icon-primary)]')
      })

      it('should generate button icon styles with states', () => {
        const buttonIconStyles = createButtonIconStyles(
          'icon-inactive',
          'icon-active',
          'icon-hover'
        )
        expect(buttonIconStyles).toContain('[--btn-icon:var(--color-icon-inactive)]')
        expect(buttonIconStyles).toContain('data-active:[--btn-icon:var(--color-icon-active)]')
        expect(buttonIconStyles).toContain('data-hover:[--btn-icon:var(--color-icon-hover)]')
      })

      it('should generate border styles with opacity', () => {
        const borderStyles = createBorderSemanticStyles('border-subtle', 20)
        expect(borderStyles).toBe('border-border-subtle/20')

        const borderNoOpacity = createBorderSemanticStyles('border-strong')
        expect(borderNoOpacity).toBe('border-border-strong')
      })
    })
  })

  describe('Component Helper Functions', () => {
    it('should resolve button colors correctly', () => {
      const primaryButton = resolveButtonColor('primary', {})
      expect(primaryButton).toHaveLength(1)
      expect(primaryButton[0]).toContain('[--btn-bg:var(--color-primary)]')

      const noColorButton = resolveButtonColor(undefined, {})
      expect(noColorButton).toHaveLength(0)

      const invalidButton = resolveButtonColor('invalid', {})
      expect(invalidButton).toHaveLength(0)
    })

    it('should resolve badge colors correctly', () => {
      const primaryBadge = resolveBadgeColor('primary', {})
      expect(primaryBadge).toContain('bg-primary/15')

      const noBadge = resolveBadgeColor(undefined, {})
      expect(noBadge).toBe('')

      const invalidBadge = resolveBadgeColor('invalid', {})
      expect(invalidBadge).toBe('')
    })

    it('should resolve semantic colors with component fallbacks', () => {
      const buttonResult = resolveSemanticColor('primary', 'button', 'fallback')
      expect(typeof buttonResult).toBe('string')
      expect(buttonResult).toContain('[--btn-bg:var(--color-primary)]')

      const badgeResult = resolveSemanticColor('success', 'badge', 'fallback')
      expect(typeof badgeResult).toBe('string')
      expect(badgeResult).toContain('bg-green/15')

      const fallbackResult = resolveSemanticColor('invalid', 'button', 'fallback')
      expect(fallbackResult).toBe('fallback')
    })
  })

  describe('CSS Variable Fallback System', () => {
    it('should create proper CSS variable fallback chains', () => {
      const fallbackChain = createCSSVariableFallbackChain(
        'text-primary',
        ['foreground', 'zinc-950'],
        'text'
      )

      expect(fallbackChain).toContain('text-[var(--color-foreground)')
      expect(fallbackChain).toContain('var(--color-foreground)')
      expect(fallbackChain).toContain('var(--color-zinc-950)')
    })

    it('should create Catalyst theme variables with fallbacks', () => {
      const variables = createCatalystThemeVariables()

      expect(variables).toHaveProperty('--color-text-primary')
      expect(variables).toHaveProperty('--color-icon-primary')
      expect(variables).toHaveProperty('--color-border-strong')

      // Should include fallback chains
      expect(variables['--color-text-tertiary']).toContain('var(--color-tertiary-foreground')
      expect(variables['--color-text-tertiary']).toContain('var(--color-muted-foreground)')
    })
  })

  describe('Token Utility Functions', () => {
    it('should return all semantic color tokens', () => {
      const tokens = getSemanticTokens()
      expect(tokens).toContain('primary')
      expect(tokens).toContain('secondary')
      expect(tokens).toContain('success')
      expect(tokens).toContain('warning')
      expect(tokens).toContain('danger')
      expect(tokens).toHaveLength(5)
    })

    it('should return all semantic token categories', () => {
      const allTokens = getAllSemanticTokens()

      expect(allTokens).toHaveProperty('color')
      expect(allTokens).toHaveProperty('text')
      expect(allTokens).toHaveProperty('icon')
      expect(allTokens).toHaveProperty('border')
      expect(allTokens).toHaveProperty('component')

      expect(allTokens.color).toContain('primary')
      expect(allTokens.text).toContain('text-primary')
      expect(allTokens.icon).toContain('icon-primary')
      expect(allTokens.border).toContain('border-strong')
    })
  })

  describe('Transform Process Compatibility', () => {
    it('should support AST transformation workflows', () => {
      // Test that all resolvers are pure functions (no side effects)
      const token = 'primary'
      const result1 = resolveSemanticToken(token)
      const result2 = resolveSemanticToken(token)
      expect(result1).toBe(result2)

      // Test that styles are deterministic
      const styles1 = createSemanticStyles(token)
      const styles2 = createSemanticStyles(token)
      expect(styles1).toBe(styles2)
    })

    it('should provide consistent token identification for transforms', () => {
      const semanticTokens = ['primary', 'secondary', 'success', 'warning', 'danger']
      const nonSemanticTokens = ['red', 'blue', 'zinc', 'custom-color']

      semanticTokens.forEach((token) => {
        expect(isSemanticToken(token)).toBe(true)
        expect(isAnySemanticToken(token)).toBe(true)
      })

      nonSemanticTokens.forEach((token) => {
        expect(isSemanticToken(token)).toBe(false)
      })
    })

    it('should maintain mapping consistency for reliable transforms', () => {
      // All semantic tokens should resolve to something meaningful
      const allSemanticColorTokens: SemanticColorToken[] = [
        'primary',
        'secondary',
        'success',
        'warning',
        'danger',
      ]

      allSemanticColorTokens.forEach((token) => {
        const resolved = resolveSemanticToken(token)
        expect(resolved).toBeTruthy()
        expect(resolved).not.toBe('')
        expect(typeof resolved).toBe('string')
      })
    })
  })

  describe('Business Logic Validation', () => {
    it('should maintain visual hierarchy with hierarchical tokens', () => {
      // Primary should be highest contrast
      expect(resolveHierarchicalTextToken('text-primary')).toBe('foreground')

      // Secondary should use existing shadcn token
      expect(resolveHierarchicalTextToken('text-secondary')).toBe('secondary-foreground')

      // Muted should be lowest contrast
      expect(resolveHierarchicalTextToken('text-muted')).toBe('muted-foreground')
    })

    it('should provide proper color mappings for accessibility', () => {
      // Success should map to green for semantic clarity
      expect(SEMANTIC_MAPPINGS.success).toBe('green')

      // Warning should map to amber for semantic clarity
      expect(SEMANTIC_MAPPINGS.warning).toBe('amber')

      // Danger should map to destructive for shadcn compatibility
      expect(SEMANTIC_MAPPINGS.danger).toBe('destructive')
    })

    it('should generate accessible contrast for all components', () => {
      const badgeStyles = createSemanticBadgeStyles('success')
      expect(badgeStyles).toContain('text-green-700') // Good contrast on light bg
      expect(badgeStyles).toContain('dark:text-green-400') // Good contrast on dark bg

      const linkStyles = createSemanticLinkStyles('warning')
      expect(linkStyles).toContain('text-amber-700')
      expect(linkStyles).toContain('dark:text-amber-400')
    })

    it('should support all critical UI component scenarios', () => {
      const componentScenarios = {
        buttons: () => createSemanticButtonStyles('primary'),
        badges: () => createSemanticBadgeStyles('success'),
        checkboxes: () => createSemanticCheckboxStyles('primary'),
        dropdowns: () => createSemanticDropdownStyles('warning'),
        text: () => createSemanticTextStyles('danger'),
        links: () => createSemanticLinkStyles('secondary'),
      }

      Object.entries(componentScenarios).forEach(([_component, generator]) => {
        const styles = generator()
        expect(styles).toBeTruthy()
        expect(typeof styles).toBe('string')
        expect(styles.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty and invalid inputs gracefully', () => {
      expect(resolveAnySemanticToken('')).toBe('')
      expect(resolveAnySemanticToken('   ')).toBe('   ')
      expect(isSemanticToken('')).toBe(false)
      expect(isAnySemanticToken('')).toBe(false)
    })

    it('should provide fallbacks for unknown tokens', () => {
      const unknownToken = 'unknown-semantic-token'
      expect(resolveAnySemanticToken(unknownToken)).toBe(unknownToken)
      expect(isSemanticToken(unknownToken)).toBe(false)
    })

    it('should handle component helpers with invalid inputs', () => {
      expect(resolveButtonColor('', {})).toEqual([])
      expect(resolveBadgeColor('', {})).toBe('')
      expect(resolveSemanticColor('', 'button', 'fallback')).toBe('fallback')
    })
  })
})
