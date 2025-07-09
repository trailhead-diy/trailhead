/**
 * Functional transform to add semantic color tokens to Catalyst UI components
 *
 * Adds semantic color tokens (primary, secondary, destructive, accent, muted) to
 * component color objects to enable theme-aware styling across all components.
 *
 * Component detection and transformation:
 * 1. Detects component type by analyzing function signatures and CSS patterns
 * 2. Adds appropriate semantic color tokens for each component type
 * 3. Preserves existing color definitions while adding semantic tokens
 * 4. Uses component-specific color patterns for consistent theming
 *
 * Examples of transformations:
 *
 * Button component colors object:
 * ```
 * colors: {
 *   zinc: [...],
 *   blue: [...],
 *   // Adds these semantic tokens:
 *   primary: [
 *     'text-white [--btn-bg:var(--color-blue-600)] [--btn-border:var(--color-blue-700)]/90',
 *     '[--btn-icon:var(--color-blue-300)] data-active:[--btn-icon:var(--color-blue-200)]',
 *   ],
 *   secondary: [
 *     'text-white [--btn-bg:var(--color-zinc-600)] [--btn-border:var(--color-zinc-700)]/90',
 *     '[--btn-icon:var(--color-zinc-300)] data-active:[--btn-icon:var(--color-zinc-200)]',
 *   ],
 *   destructive: [
 *     'text-white [--btn-bg:var(--color-red-600)] [--btn-border:var(--color-red-700)]/90',
 *     '[--btn-icon:var(--color-red-300)] data-active:[--btn-icon:var(--color-red-200)]',
 *   ],
 *   accent: [
 *     'text-white [--btn-bg:var(--color-purple-600)] [--btn-border:var(--color-purple-700)]/90',
 *     '[--btn-icon:var(--color-purple-300)] data-active:[--btn-icon:var(--color-purple-200)]',
 *   ],
 *   muted: [
 *     'text-white [--btn-bg:var(--color-gray-600)] [--btn-border:var(--color-gray-700)]/90',
 *     '[--btn-icon:var(--color-gray-300)] data-active:[--btn-icon:var(--color-gray-200)]',
 *   ]
 * }
 * ```
 *
 * Badge component colors object:
 * ```
 * const colors = {
 *   zinc: 'bg-zinc-500/15...',
 *   blue: 'bg-blue-500/15...',
 *   // Adds these semantic tokens:
 *   primary: 'bg-primary-500/15 text-primary-700 group-data-hover:bg-primary-500/25 dark:bg-primary-500/10',
 *   secondary: 'bg-secondary-500/15 text-secondary-700 group-data-hover:bg-secondary-500/25 dark:bg-secondary-500/10',
 *   destructive: 'bg-destructive-500/15 text-destructive-700 group-data-hover:bg-destructive-500/25 dark:bg-destructive-500/10'
 * }
 * ```
 *
 * Switch component colors object:
 * ```
 * const colors = {
 *   zinc: [...],
 *   // Adds these semantic tokens:
 *   primary: [
 *     '[--switch-bg-ring:var(--color-blue-600)]/90 [--switch-bg:var(--color-blue-500)]',
 *     '[--switch:white] [--switch-ring:var(--color-blue-600)]/90 [--switch-shadow:var(--color-blue-900)]/20',
 *   ]
 * }
 * ```
 *
 * Uses CLI framework Result types for consistent error handling.
 * Pure functional interface with no classes.
 */

import type { Result, CLIError } from '@esteban-url/trailhead-cli/core';
import { createTransformMetadata, executeTransform, type TransformResult } from '../utils.js';

/**
 * Transform metadata
 */
export const semanticColorsTransform = createTransformMetadata(
  'semantic-colors',
  'Add semantic color tokens to color objects',
  'semantic'
);

/**
 * Component-specific semantic color patterns
 */
function getSemanticColorsForComponent(content: string): string[] {
  // Detect component type and return appropriate semantic colors
  // Use more specific patterns to detect component types
  // Badge detection first to prevent misidentification as button
  if (content.includes('export function CatalystBadge')) {
    return [
      "primary: 'bg-primary-500/15 text-primary-700 group-data-hover:bg-primary-500/25 dark:bg-primary-500/10 dark:text-primary-400 dark:group-data-hover:bg-primary-500/20',",
      "secondary: 'bg-secondary-500/15 text-secondary-700 group-data-hover:bg-secondary-500/25 dark:bg-secondary-500/10 dark:text-secondary-400 dark:group-data-hover:bg-secondary-500/20',",
      "destructive: 'bg-destructive-500/15 text-destructive-700 group-data-hover:bg-destructive-500/25 dark:bg-destructive-500/10 dark:text-destructive-400 dark:group-data-hover:bg-destructive-500/20',",
      "accent: 'bg-accent-500/15 text-accent-700 group-data-hover:bg-accent-500/25 dark:bg-accent-500/10 dark:text-accent-400 dark:group-data-hover:bg-accent-500/20',",
      "muted: 'bg-muted-500/15 text-muted-700 group-data-hover:bg-muted-500/25 dark:bg-muted-500/10 dark:text-muted-400 dark:group-data-hover:bg-muted-500/20',",
    ];
  }

  if (
    content.includes('export const CatalystButton =') ||
    content.includes('export function CatalystButton')
  ) {
    return [
      'primary: [',
      "  'text-white [--btn-hover-overlay:var(--color-white)]/10 [--btn-bg:var(--color-blue-600)] [--btn-border:var(--color-blue-700)]/90',",
      "  '[--btn-icon:var(--color-blue-300)] data-active:[--btn-icon:var(--color-blue-200)] data-hover:[--btn-icon:var(--color-blue-200)]',",
      '],',
      'secondary: [',
      "  'text-white [--btn-hover-overlay:var(--color-white)]/10 [--btn-bg:var(--color-zinc-600)] [--btn-border:var(--color-zinc-700)]/90',",
      "  '[--btn-icon:var(--color-zinc-300)] data-active:[--btn-icon:var(--color-zinc-200)] data-hover:[--btn-icon:var(--color-zinc-200)]',",
      '],',
      'destructive: [',
      "  'text-white [--btn-hover-overlay:var(--color-white)]/10 [--btn-bg:var(--color-red-600)] [--btn-border:var(--color-red-700)]/90',",
      "  '[--btn-icon:var(--color-red-300)] data-active:[--btn-icon:var(--color-red-200)] data-hover:[--btn-icon:var(--color-red-200)]',",
      '],',
      'accent: [',
      "  'text-white [--btn-hover-overlay:var(--color-white)]/10 [--btn-bg:var(--color-purple-600)] [--btn-border:var(--color-purple-700)]/90',",
      "  '[--btn-icon:var(--color-purple-300)] data-active:[--btn-icon:var(--color-purple-200)] data-hover:[--btn-icon:var(--color-purple-200)]',",
      '],',
      'muted: [',
      "  'text-white [--btn-hover-overlay:var(--color-white)]/10 [--btn-bg:var(--color-gray-600)] [--btn-border:var(--color-gray-700)]/90',",
      "  '[--btn-icon:var(--color-gray-300)] data-active:[--btn-icon:var(--color-gray-200)] data-hover:[--btn-icon:var(--color-gray-200)]',",
      '],',
    ];
  }

  if (content.includes('export function CatalystSwitch') && content.includes('--switch-')) {
    return [
      'primary: [',
      "  '[--switch-bg-ring:var(--color-blue-600)]/90 [--switch-bg:var(--color-blue-500)] dark:[--switch-bg-ring:transparent]',",
      "  '[--switch:white] [--switch-ring:var(--color-blue-600)]/90 [--switch-shadow:var(--color-blue-900)]/20',",
      '],',
      'secondary: [',
      "  '[--switch-bg-ring:var(--color-zinc-700)]/90 [--switch-bg:var(--color-zinc-600)] dark:[--switch-bg-ring:transparent]',",
      "  '[--switch-shadow:var(--color-black)]/10 [--switch:white] [--switch-ring:var(--color-zinc-700)]/90',",
      '],',
      'destructive: [',
      "  '[--switch-bg-ring:var(--color-red-700)]/90 [--switch-bg:var(--color-red-600)] dark:[--switch-bg-ring:transparent]',",
      "  '[--switch:white] [--switch-ring:var(--color-red-700)]/90 [--switch-shadow:var(--color-red-900)]/20',",
      '],',
      'accent: [',
      "  '[--switch-bg-ring:var(--color-purple-600)]/90 [--switch-bg:var(--color-purple-500)] dark:[--switch-bg-ring:transparent]',",
      "  '[--switch:white] [--switch-ring:var(--color-purple-600)]/90 [--switch-shadow:var(--color-purple-900)]/20',",
      '],',
      'muted: [',
      "  '[--switch-bg-ring:var(--color-gray-700)]/90 [--switch-bg:var(--color-gray-600)] dark:[--switch-bg-ring:transparent]',",
      "  '[--switch:white] [--switch-ring:var(--color-gray-700)]/90 [--switch-shadow:var(--color-gray-900)]/20',",
      '],',
    ];
  }

  if (content.includes('export function CatalystRadio') && content.includes('--radio-')) {
    return [
      "primary: '[--radio-checked-indicator:var(--color-white)] [--radio-checked-bg:var(--color-blue-600)] [--radio-checked-border:var(--color-blue-700)]/90',",
      "secondary: '[--radio-checked-indicator:var(--color-white)] [--radio-checked-bg:var(--color-zinc-600)] [--radio-checked-border:var(--color-zinc-700)]/90',",
      "destructive: '[--radio-checked-indicator:var(--color-white)] [--radio-checked-bg:var(--color-red-600)] [--radio-checked-border:var(--color-red-700)]/90',",
      "accent: '[--radio-checked-indicator:var(--color-white)] [--radio-checked-bg:var(--color-purple-600)] [--radio-checked-border:var(--color-purple-700)]/90',",
      "muted: '[--radio-checked-indicator:var(--color-white)] [--radio-checked-bg:var(--color-gray-600)] [--radio-checked-border:var(--color-gray-700)]/90',",
    ];
  }

  if (content.includes('export function CatalystCheckbox') && content.includes('--checkbox-')) {
    return [
      "primary: '[--checkbox-check:var(--color-white)] [--checkbox-checked-bg:var(--color-blue-600)] [--checkbox-checked-border:var(--color-blue-700)]/90',",
      "secondary: '[--checkbox-check:var(--color-white)] [--checkbox-checked-bg:var(--color-zinc-600)] [--checkbox-checked-border:var(--color-zinc-700)]/90',",
      "destructive: '[--checkbox-check:var(--color-white)] [--checkbox-checked-bg:var(--color-red-600)] [--checkbox-checked-border:var(--color-red-700)]/90',",
      "accent: '[--checkbox-check:var(--color-white)] [--checkbox-checked-bg:var(--color-purple-600)] [--checkbox-checked-border:var(--color-purple-700)]/90',",
      "muted: '[--checkbox-check:var(--color-white)] [--checkbox-checked-bg:var(--color-gray-600)] [--checkbox-checked-border:var(--color-gray-700)]/90',",
    ];
  }

  if (content.includes('export function CatalystAlert')) {
    return [
      "primary: 'bg-primary-50 border-primary-200 text-primary-800 dark:bg-primary-900/50 dark:border-primary-800 dark:text-primary-200',",
      "secondary: 'bg-secondary-50 border-secondary-200 text-secondary-800 dark:bg-secondary-900/50 dark:border-secondary-800 dark:text-secondary-200',",
      "destructive: 'bg-destructive-50 border-destructive-200 text-destructive-800 dark:bg-destructive-900/50 dark:border-destructive-800 dark:text-destructive-200',",
      "accent: 'bg-accent-50 border-accent-200 text-accent-800 dark:bg-accent-900/50 dark:border-accent-800 dark:text-accent-200',",
      "muted: 'bg-muted-50 border-muted-200 text-muted-800 dark:bg-muted-900/50 dark:border-muted-800 dark:text-muted-200',",
    ];
  }

  // Default fallback
  return [];
}

/**
 * Add semantic color tokens (primary, secondary, destructive, accent, muted) to component color objects
 *
 * Transform process:
 * 1. Detect component type by analyzing function signatures and CSS patterns
 * 2. Generate appropriate semantic color tokens for the detected component
 * 3. Locate colors object in the component (nested or direct)
 * 4. Add semantic tokens while preserving existing color definitions
 *
 * Examples:
 * - Button colors: `zinc: [...]` → adds `primary: ['text-white [--btn-bg:var(--color-blue-600)]...']`
 * - Badge colors: `zinc: 'bg-zinc-500/15...'` → adds `primary: 'bg-primary-500/15 text-primary-700...'`
 * - Switch colors: `zinc: [...]` → adds `primary: ['[--switch-bg-ring:var(--color-blue-600)]/90...']`
 */
export function transformSemanticColors(input: string): Result<TransformResult, CLIError> {
  return executeTransform(() => {
    let content = input;
    const warnings: string[] = [];
    let changed = false;

    /////////////////////////////////////////////////////////////////////////////////
    // Phase 1: Detect Colors Object Patterns
    // Finds:
    //        const colors = {...}    (direct colors object)
    //        colors: {...}          (nested colors object in styles)
    //
    /////////////////////////////////////////////////////////////////////////////////
    const directColorsObject = /const colors = \{/.test(content);
    const nestedColorsObject = /colors:\s*\{/.test(content);
    const stylesColorsObject = /const styles = \{[\s\S]*?colors:\s*\{/.test(content);

    if (!directColorsObject && !nestedColorsObject && !stylesColorsObject) {
      warnings.push('No colors object found in component');
      return { content, changed: false, warnings };
    }

    /////////////////////////////////////////////////////////////////////////////////
    // Phase 2: Component Type Detection and Semantic Color Generation
    // Analyzes function signatures and CSS patterns to determine component type
    // Finds:
    //        export function CatalystBadge + inline-flex items-center gap-x-1.5
    //        export const CatalystButton + --btn-
    //        export function CatalystSwitch + --switch-
    //
    /////////////////////////////////////////////////////////////////////////////////
    const semanticColors = getSemanticColorsForComponent(content);

    if (semanticColors.length === 0) {
      warnings.push('Unknown component type, no semantic colors available');
      return { content, changed: false, warnings };
    }

    /////////////////////////////////////////////////////////////////////////////////
    // Phase 3: Check for Existing Semantic Colors
    // Verifies if semantic colors are already present with correct format
    // Finds:
    //        primary: 'bg-primary-500/15 text-primary-700...'
    //        secondary: ['text-white [--btn-bg:var(--color-zinc-600)]...']
    //
    /////////////////////////////////////////////////////////////////////////////////
    const hasSemanticColors = semanticColors.some(colorLine => {
      const parts = colorLine.split(':');
      if (parts.length < 2) return false;

      const colorKey = parts[0].trim();

      // Check if the color key exists (simpler check)
      return content.includes(`${colorKey}:`);
    });

    if (!hasSemanticColors) {
      let patternFound = false;

      /////////////////////////////////////////////////////////////////////////////////
      // Phase 4: Apply Semantic Colors to Direct Colors Object
      // Finds:
      //        const colors = { zinc: '...', blue: '...' }
      //
      /////////////////////////////////////////////////////////////////////////////////
      if (directColorsObject) {
        // More flexible pattern that captures the entire colors object
        const colorsObjectPattern = /(const colors = \{[\s\S]*?)(})/;
        const match = content.match(colorsObjectPattern);

        if (match) {
          const beforeClosing = match[1];
          const closing = match[2];

          // Add semantic colors before the closing brace with proper indentation
          const semanticColorsBlock = semanticColors.map(color => `  ${color}`).join('\n');
          const newColorsObject = `${beforeClosing},\n  ${semanticColorsBlock}\n${closing}`;

          content = content.replace(colorsObjectPattern, newColorsObject);
          changed = true;
          patternFound = true;
        }
      }

      /////////////////////////////////////////////////////////////////////////////////
      // Phase 5: Apply Semantic Colors to Nested Colors Object
      // Finds:
      //        colors: { zinc: [...], blue: [...] }
      //
      /////////////////////////////////////////////////////////////////////////////////
      if (!patternFound && (nestedColorsObject || stylesColorsObject)) {
        // More flexible pattern for nested colors objects
        const colorsObjectPattern = /(colors:\s*\{[\s\S]*?)(\n\s*})/;
        const match = content.match(colorsObjectPattern);

        if (match) {
          const beforeClosing = match[1];
          const closing = match[2];

          // Add semantic colors before the closing brace with proper indentation
          const semanticColorsBlock = semanticColors.map(color => `    ${color}`).join('\n');
          const newColorsObject = `${beforeClosing},\n    ${semanticColorsBlock}${closing}`;

          content = content.replace(colorsObjectPattern, newColorsObject);
          changed = true;
          patternFound = true;
        }
      }

      if (!patternFound) {
        warnings.push('Could not find colors object pattern to add semantic colors');
      }
    }

    return { content, changed, warnings };
  });
}
