/**
 * Semantic Enhancements Tests
 *
 * High-ROI tests focusing on component enhancement registry validation
 * and business logic
 */

import { describe, it, expect } from 'vitest';
import {
  SEMANTIC_ENHANCED_COMPONENTS,
  ENHANCED_COMPONENT_COUNT,
  hasSemanticSupport,
  getSemanticInfo,
  listEnhancedComponents,
  ACCESSIBILITY_IMPROVEMENTS,
  COLOR_MAPPING_STRATEGY,
} from '../../../src/components/theme/semantic-enhancements';
import type { SemanticColorToken } from '../../../src/components/theme/semantic-tokens';

describe('Component Enhancement Registry', () => {
  it('maintains consistent registry structure', () => {
    // All components should have required properties
    Object.entries(SEMANTIC_ENHANCED_COMPONENTS).forEach(([componentName, config]) => {
      expect(config).toHaveProperty('prop');
      expect(config).toHaveProperty('supports');
      expect(config).toHaveProperty('description');
      expect(config).toHaveProperty('implementation');

      expect(typeof config.prop).toBe('string');
      expect(Array.isArray(config.supports)).toBe(true);
      expect(typeof config.description).toBe('string');
      expect(typeof config.implementation).toBe('string');

      // All components should support the same semantic tokens
      expect(config.supports).toEqual(['primary', 'secondary', 'success', 'warning', 'danger']);

      // Prop should be 'color' for all components
      expect(config.prop).toBe('color');

      // Description should be descriptive
      expect(config.description.length).toBeGreaterThan(20);
      const capitalizedName = componentName.charAt(0).toUpperCase() + componentName.slice(1);
      expect(config.description).toContain(capitalizedName);

      // Implementation should reference a function
      expect(config.implementation).toContain('()');
    });
  });

  it('includes all expected enhanced components', () => {
    const expectedComponents = [
      'button',
      'badge',
      'checkbox',
      'radio',
      'switch',
      'text',
      'link',
      'dropdown',
      'listbox',
      'combobox',
    ];

    expectedComponents.forEach(component => {
      expect(SEMANTIC_ENHANCED_COMPONENTS).toHaveProperty(component);
    });

    expect(Object.keys(SEMANTIC_ENHANCED_COMPONENTS)).toHaveLength(expectedComponents.length);
  });

  it('correctly counts enhanced components', () => {
    const actualCount = Object.keys(SEMANTIC_ENHANCED_COMPONENTS).length;
    expect(ENHANCED_COMPONENT_COUNT).toBe(actualCount);
  });

  it('supports all required semantic tokens', () => {
    const requiredTokens: SemanticColorToken[] = [
      'primary',
      'secondary',
      'success',
      'warning',
      'danger',
    ];

    Object.values(SEMANTIC_ENHANCED_COMPONENTS).forEach(config => {
      requiredTokens.forEach(token => {
        expect(config.supports).toContain(token);
      });
    });
  });
});

describe('Component Support Checking', () => {
  it('correctly identifies supported components', () => {
    // Test known supported components
    expect(hasSemanticSupport('button')).toBe(true);
    expect(hasSemanticSupport('badge')).toBe(true);
    expect(hasSemanticSupport('checkbox')).toBe(true);
    expect(hasSemanticSupport('radio')).toBe(true);
    expect(hasSemanticSupport('switch')).toBe(true);
    expect(hasSemanticSupport('text')).toBe(true);
    expect(hasSemanticSupport('link')).toBe(true);
    expect(hasSemanticSupport('dropdown')).toBe(true);
    expect(hasSemanticSupport('listbox')).toBe(true);
    expect(hasSemanticSupport('combobox')).toBe(true);
  });

  it('returns semantic information for supported components', () => {
    const buttonInfo = getSemanticInfo('button');
    expect(buttonInfo).not.toBeNull();
    expect(buttonInfo?.prop).toBe('color');
    expect(buttonInfo?.supports).toContain('primary');
    expect(buttonInfo?.description).toContain('Button');
    expect(buttonInfo?.implementation).toContain('createSemanticButtonStyles');

    const badgeInfo = getSemanticInfo('badge');
    expect(badgeInfo).not.toBeNull();
    expect(badgeInfo?.description).toContain('Badge');
    expect(badgeInfo?.implementation).toContain('createSemanticBadgeStyles');
  });

  it('lists all enhanced components', () => {
    const components = listEnhancedComponents();
    expect(Array.isArray(components)).toBe(true);
    expect(components).toContain('button');
    expect(components).toContain('badge');
    expect(components).toContain('checkbox');
    expect(components).toContain('radio');
    expect(components).toContain('switch');
    expect(components).toContain('text');
    expect(components).toContain('link');
    expect(components).toContain('dropdown');
    expect(components).toContain('listbox');
    expect(components).toContain('combobox');

    expect(components.length).toBe(ENHANCED_COMPONENT_COUNT);
  });
});

describe('Accessibility Improvements Documentation', () => {
  it('documents accessibility improvements for all relevant components', () => {
    const accessibilityComponents = ['badge', 'text', 'link', 'dropdown', 'listbox', 'combobox'];

    accessibilityComponents.forEach(component => {
      expect(ACCESSIBILITY_IMPROVEMENTS).toHaveProperty(component);
      const improvement =
        ACCESSIBILITY_IMPROVEMENTS[component as keyof typeof ACCESSIBILITY_IMPROVEMENTS];
      expect(typeof improvement).toBe('string');
      expect(improvement.length).toBeGreaterThan(10);

      // Should mention contrast or foreground colors
      expect(
        improvement.includes('contrast') ||
          improvement.includes('foreground') ||
          improvement.includes('-foreground')
      ).toBe(true);
    });
  });

  it('emphasizes proper contrast in accessibility improvements', () => {
    // Text-related components should mention foreground colors
    expect(ACCESSIBILITY_IMPROVEMENTS.badge).toContain('-foreground');
    expect(ACCESSIBILITY_IMPROVEMENTS.text).toContain('-foreground');
    expect(ACCESSIBILITY_IMPROVEMENTS.link).toContain('-foreground');

    // Interactive components should mention focus contrast
    expect(ACCESSIBILITY_IMPROVEMENTS.dropdown).toContain('contrast');
    expect(ACCESSIBILITY_IMPROVEMENTS.listbox).toContain('contrast');
    expect(ACCESSIBILITY_IMPROVEMENTS.combobox).toContain('contrast');
  });
});

describe('Color Mapping Strategy Documentation', () => {
  it('documents CSS Variables strategy correctly', () => {
    const cssVarsStrategy = COLOR_MAPPING_STRATEGY['CSS Variables'];

    expect(cssVarsStrategy).toHaveProperty('tokens');
    expect(cssVarsStrategy).toHaveProperty('pattern');
    expect(cssVarsStrategy).toHaveProperty('example');

    expect(cssVarsStrategy.tokens).toContain('primary');
    expect(cssVarsStrategy.tokens).toContain('secondary');
    expect(cssVarsStrategy.tokens).toContain('destructive');

    expect(cssVarsStrategy.pattern).toContain('CSS custom properties');
    expect(cssVarsStrategy.pattern).toContain('-foreground');

    expect(cssVarsStrategy.example).toContain('bg-primary');
    expect(cssVarsStrategy.example).toContain('text-primary-foreground');
  });

  it('documents Tailwind Colors strategy correctly', () => {
    const tailwindStrategy = COLOR_MAPPING_STRATEGY['Tailwind Colors'];

    expect(tailwindStrategy).toHaveProperty('tokens');
    expect(tailwindStrategy).toHaveProperty('pattern');
    expect(tailwindStrategy).toHaveProperty('example');

    expect(tailwindStrategy.tokens).toContain('success (green)');
    expect(tailwindStrategy.tokens).toContain('warning (amber)');

    expect(tailwindStrategy.pattern).toContain('Tailwind utilities');
    expect(tailwindStrategy.pattern).toContain('contrast');

    expect(tailwindStrategy.example).toContain('bg-green-600');
    expect(tailwindStrategy.example).toContain('text-green-700');
    expect(tailwindStrategy.example).toContain('dark:');
  });

  it('maintains consistent strategy structure', () => {
    Object.entries(COLOR_MAPPING_STRATEGY).forEach(([strategyName, strategy]) => {
      expect(typeof strategyName).toBe('string');
      expect(strategy).toHaveProperty('tokens');
      expect(strategy).toHaveProperty('pattern');
      expect(strategy).toHaveProperty('example');

      expect(Array.isArray(strategy.tokens)).toBe(true);
      expect(typeof strategy.pattern).toBe('string');
      expect(typeof strategy.example).toBe('string');

      expect(strategy.tokens.length).toBeGreaterThan(0);
      expect(strategy.pattern.length).toBeGreaterThan(20);
      expect(strategy.example.length).toBeGreaterThan(10);
    });
  });
});

describe('Registry Consistency and Validation', () => {
  it('ensures all enhanced components have accessibility improvements documented', () => {
    const accessibilityComponents = Object.keys(ACCESSIBILITY_IMPROVEMENTS);
    const enhancedComponents = Object.keys(SEMANTIC_ENHANCED_COMPONENTS);

    // Not all enhanced components need accessibility improvements documented
    // but all documented improvements should be for enhanced components
    accessibilityComponents.forEach(component => {
      expect(enhancedComponents).toContain(component);
    });
  });

  it('maintains proper implementation function naming conventions', () => {
    Object.entries(SEMANTIC_ENHANCED_COMPONENTS).forEach(([componentName, config]) => {
      const expectedFunctionName = `createSemantic${componentName.charAt(0).toUpperCase() + componentName.slice(1)}Styles()`;
      expect(config.implementation).toBe(expectedFunctionName);
    });
  });

  it('ensures description quality standards', () => {
    Object.entries(SEMANTIC_ENHANCED_COMPONENTS).forEach(([componentName, config]) => {
      const description = config.description;

      // Should mention the component name (capitalized)
      const capitalizedName = componentName.charAt(0).toUpperCase() + componentName.slice(1);
      expect(description).toContain(capitalizedName);

      // Should mention enhancement or semantic
      expect(
        description.includes('Enhanced') ||
          description.includes('semantic') ||
          description.includes('token')
      ).toBe(true);

      // Should be descriptive enough
      expect(description.length).toBeGreaterThan(30);
      expect(description.split(' ').length).toBeGreaterThan(5);
    });
  });

  it('validates semantic token support consistency', () => {
    const expectedTokens: SemanticColorToken[] = [
      'primary',
      'secondary',
      'success',
      'warning',
      'danger',
    ];

    Object.values(SEMANTIC_ENHANCED_COMPONENTS).forEach(config => {
      // All components should support exactly the same tokens
      expect(config.supports).toEqual(expectedTokens);
      expect(config.supports.length).toBe(5);

      // Tokens should be in consistent order
      expect(config.supports[0]).toBe('primary');
      expect(config.supports[1]).toBe('secondary');
      expect(config.supports[2]).toBe('success');
      expect(config.supports[3]).toBe('warning');
      expect(config.supports[4]).toBe('danger');
    });
  });
});

describe('Business Logic Validation', () => {
  it('ensures registry provides complete component coverage information', () => {
    // The registry should help developers understand which components support semantic tokens
    const componentList = listEnhancedComponents();

    // Should include form components
    expect(componentList).toContain('checkbox');
    expect(componentList).toContain('radio');
    expect(componentList).toContain('switch');

    // Should include UI components
    expect(componentList).toContain('button');
    expect(componentList).toContain('badge');

    // Should include text components
    expect(componentList).toContain('text');
    expect(componentList).toContain('link');

    // Should include interactive components
    expect(componentList).toContain('dropdown');
    expect(componentList).toContain('listbox');
    expect(componentList).toContain('combobox');
  });

  it('provides actionable information for developers', () => {
    // Each component should provide enough information for developers to use semantic tokens
    Object.entries(SEMANTIC_ENHANCED_COMPONENTS).forEach(([_componentName, config]) => {
      // Should specify which prop to use
      expect(config.prop).toBe('color');

      // Should list available tokens
      expect(config.supports.length).toBeGreaterThan(0);

      // Should explain what the enhancement does
      expect(
        config.description.includes('Enhanced') ||
          config.description.includes('semantic') ||
          config.description.includes('token')
      ).toBe(true);

      // Should reference the implementation function
      expect(config.implementation).toMatch(/^createSemantic\w+Styles\(\)$/);
    });
  });

  it('supports component enhancement queries effectively', () => {
    // Test realistic usage patterns developers would need

    // Check if a component supports semantic tokens
    expect(hasSemanticSupport('button')).toBe(true);
    expect(hasSemanticSupport('input' as any)).toBe(false); // Not enhanced yet

    // Get information about a component's semantic support
    const buttonInfo = getSemanticInfo('button');
    expect(buttonInfo?.supports).toContain('primary');
    expect(buttonInfo?.supports).toContain('danger');

    // List all enhanced components for documentation
    const allComponents = listEnhancedComponents();
    expect(allComponents.length).toBeGreaterThan(5);
    expect(allComponents.every(name => typeof name === 'string')).toBe(true);
  });
});
