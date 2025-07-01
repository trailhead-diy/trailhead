/**
 * Semantic Token Enhancements Registry
 *
 * Documents which components have been enhanced to support semantic color tokens
 * (primary, secondary, success, warning, danger) beyond their original Catalyst colors.
 *
 * This registry tracks component enhancements.
 */

import type { SemanticColorToken } from './semantic-tokens';

/**
 * Components that have been enhanced with semantic token support
 */
export const SEMANTIC_ENHANCED_COMPONENTS = {
  // Components with full semantic token support
  button: {
    prop: 'color',
    supports: [
      'primary',
      'secondary',
      'success',
      'warning',
      'danger',
    ] as SemanticColorToken[],
    description:
      'Enhanced Button component supporting semantic tokens alongside Catalyst colors',
    implementation: 'createSemanticButtonStyles()',
  },

  badge: {
    prop: 'color',
    supports: [
      'primary',
      'secondary',
      'success',
      'warning',
      'danger',
    ] as SemanticColorToken[],
    description:
      'Enhanced Badge component with proper foreground color contrast',
    implementation: 'createSemanticBadgeStyles()',
  },

  checkbox: {
    prop: 'color',
    supports: [
      'primary',
      'secondary',
      'success',
      'warning',
      'danger',
    ] as SemanticColorToken[],
    description: 'Enhanced Checkbox component with semantic color variables',
    implementation: 'createSemanticCheckboxStyles()',
  },

  radio: {
    prop: 'color',
    supports: [
      'primary',
      'secondary',
      'success',
      'warning',
      'danger',
    ] as SemanticColorToken[],
    description: 'Enhanced Radio component with semantic color variables',
    implementation: 'createSemanticRadioStyles()',
  },

  switch: {
    prop: 'color',
    supports: [
      'primary',
      'secondary',
      'success',
      'warning',
      'danger',
    ] as SemanticColorToken[],
    description: 'Enhanced Switch component with semantic color variables',
    implementation: 'createSemanticSwitchStyles()',
  },

  text: {
    prop: 'color',
    supports: [
      'primary',
      'secondary',
      'success',
      'warning',
      'danger',
    ] as SemanticColorToken[],
    description: 'Enhanced Text component with proper foreground colors',
    implementation: 'createSemanticTextStyles()',
  },

  link: {
    prop: 'color',
    supports: [
      'primary',
      'secondary',
      'success',
      'warning',
      'danger',
    ] as SemanticColorToken[],
    description:
      'Enhanced Link component with proper foreground and hover colors',
    implementation: 'createSemanticLinkStyles()',
  },

  dropdown: {
    prop: 'color',
    supports: [
      'primary',
      'secondary',
      'success',
      'warning',
      'danger',
    ] as SemanticColorToken[],
    description:
      'Enhanced Dropdown component with semantic focus states for menu items',
    implementation: 'createSemanticDropdownStyles()',
  },

  listbox: {
    prop: 'color',
    supports: [
      'primary',
      'secondary',
      'success',
      'warning',
      'danger',
    ] as SemanticColorToken[],
    description:
      'Enhanced Listbox component with semantic focus states for options',
    implementation: 'createSemanticListboxStyles()',
  },

  combobox: {
    prop: 'color',
    supports: [
      'primary',
      'secondary',
      'success',
      'warning',
      'danger',
    ] as SemanticColorToken[],
    description:
      'Enhanced Combobox component with semantic focus states for options',
    implementation: 'createSemanticComboboxStyles()',
  },
} as const;

/**
 * Total count of enhanced components
 */
export const ENHANCED_COMPONENT_COUNT = Object.keys(
  SEMANTIC_ENHANCED_COMPONENTS,
).length;

/**
 * Check if a component has semantic token support
 */
export function hasSemanticSupport(
  componentName: keyof typeof SEMANTIC_ENHANCED_COMPONENTS,
): boolean {
  return componentName in SEMANTIC_ENHANCED_COMPONENTS;
}

/**
 * Get semantic token information for a component
 */
export function getSemanticInfo(
  componentName: keyof typeof SEMANTIC_ENHANCED_COMPONENTS,
) {
  return SEMANTIC_ENHANCED_COMPONENTS[componentName] || null;
}

/**
 * List all components with semantic enhancements
 */
export function listEnhancedComponents(): string[] {
  return Object.keys(SEMANTIC_ENHANCED_COMPONENTS);
}

/**
 * Accessibility improvements made
 */
export const ACCESSIBILITY_IMPROVEMENTS = {
  badge: 'Fixed to use proper -foreground colors for contrast',
  text: 'Fixed to use proper -foreground colors for contrast',
  link: 'Fixed to use proper -foreground colors with hover states',
  dropdown: 'Uses -foreground colors for proper contrast on focus',
  listbox: 'Uses -foreground colors for proper contrast on focus',
  combobox: 'Uses -foreground colors for proper contrast on focus',
} as const;

/**
 * Color mapping strategy
 */
export const COLOR_MAPPING_STRATEGY = {
  'CSS Variables': {
    tokens: ['primary', 'secondary', 'destructive'],
    pattern: 'Uses CSS custom properties with -foreground variants',
    example: 'bg-primary text-primary-foreground',
  },
  'Tailwind Colors': {
    tokens: ['success (green)', 'warning (amber)'],
    pattern: 'Maps to Tailwind utilities with proper contrast colors',
    example: 'bg-green-600 text-white or text-green-700 dark:text-green-400',
  },
} as const;
