/**
 * Main AST builder for semantic token resolution
 */

import type { API, VariableDeclaration } from 'jscodeshift';
import type { ResolutionConfig } from './types.js';
import {
  determinePattern,
  buildIIFEWithColorsPattern,
  buildConditionalWithColorsPattern,
  buildSimpleConditionalPattern,
} from './ast-patterns.js';

/**
 * Build semantic token resolution variable declaration
 * Main entry point that delegates to specific pattern builders
 */
export function buildSemanticResolution(
  j: API['jscodeshift'],
  config: ResolutionConfig
): VariableDeclaration {
  const { variableName } = config;

  // Determine which pattern to use
  const pattern = determinePattern(config);

  // Build the appropriate expression based on pattern
  const expression = buildResolutionExpression(j, config, pattern);

  // Create the variable declaration
  return j.variableDeclaration('const', [
    j.variableDeclarator(j.identifier(variableName), expression),
  ]);
}

/**
 * Build the resolution expression based on the pattern type
 * Pure function that returns the appropriate AST expression
 */
function buildResolutionExpression(
  j: API['jscodeshift'],
  config: ResolutionConfig,
  pattern: ReturnType<typeof determinePattern>
): any {
  switch (pattern) {
    case 'iife-with-colors':
      return buildIIFEWithColorsPattern(j, config);

    case 'conditional-with-colors':
      return buildConditionalWithColorsPattern(j, config);

    case 'simple-conditional':
      return buildSimpleConditionalPattern(j, config);

    default:
      // Type-safe exhaustive check
      const _exhaustive: never = pattern;
      throw new Error(`Unknown pattern: ${pattern}`);
  }
}

/**
 * Create a custom resolution builder with preset configuration
 * Higher-order function for creating specialized builders
 */
export function createResolutionBuilder(defaultConfig: Partial<ResolutionConfig>) {
  return (j: API['jscodeshift'], overrides: Partial<ResolutionConfig> = {}) => {
    const config: ResolutionConfig = {
      componentName: 'Component',
      variableName: 'resolvedColorClasses',
      defaultColor: 'zinc',
      useIIFE: false,
      hasColorsObject: true,
      ...defaultConfig,
      ...overrides,
    };

    return buildSemanticResolution(j, config);
  };
}

/**
 * Preset builders for common component patterns
 */
export const builders = {
  /** Builder for components with IIFE pattern and colors object */
  withIIFEAndColors: createResolutionBuilder({
    useIIFE: true,
    hasColorsObject: true,
  }),

  /** Builder for components with conditional pattern and colors object */
  withConditionalAndColors: createResolutionBuilder({
    useIIFE: false,
    hasColorsObject: true,
  }),

  /** Builder for components with simple conditional pattern */
  withSimpleConditional: createResolutionBuilder({
    useIIFE: false,
    hasColorsObject: false,
  }),
};

// Export individual builders for convenience
export const withIIFEAndColors = builders.withIIFEAndColors;
export const withConditionalAndColors = builders.withConditionalAndColors;
export const withSimpleConditional = builders.withSimpleConditional;
