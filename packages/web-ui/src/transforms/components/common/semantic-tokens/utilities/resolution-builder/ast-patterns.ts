/**
 * AST pattern builders for semantic token resolution
 */

import type { ResolutionConfig } from './types.js';
import type { API } from 'jscodeshift';

/**
 * Build IIFE pattern with colors object
 * Used for components that need immediate execution context
 *
 * Pattern:
 * ```
 * const resolvedClasses = (() => {
 *   if (color && isSemanticToken(color)) {
 *     return createSemanticStyles(color)
 *   }
 *   return colors[color] || colors['default']
 * })()
 * ```
 */
export function buildIIFEWithColorsPattern(j: API['jscodeshift'], config: ResolutionConfig): any {
  const { componentName, defaultColor } = config;
  const styleFunction = `createSemantic${componentName}Styles`;

  const arrowFunc = j.arrowFunctionExpression(
    [],
    j.blockStatement([
      j.ifStatement(
        j.logicalExpression(
          '&&',
          j.identifier('color'),
          j.callExpression(j.identifier('isSemanticToken'), [j.identifier('color')])
        ),
        j.blockStatement([
          j.returnStatement(j.callExpression(j.identifier(styleFunction), [j.identifier('color')])),
        ])
      ),
      j.returnStatement(
        j.logicalExpression(
          '||',
          j.memberExpression(j.identifier('colors'), j.identifier('color'), true),
          j.memberExpression(j.identifier('colors'), j.stringLiteral(defaultColor), true)
        )
      ),
    ]),
    false
  );

  return j.callExpression(arrowFunc, []);
}

/**
 * Build conditional pattern with colors object
 * Used for components that use ternary expressions
 *
 * Pattern:
 * ```
 * const resolvedClasses = color && isSemanticToken(color)
 *   ? createSemanticStyles(color)
 *   : colors[color ?? 'default'] || colors['default']
 * ```
 */
export function buildConditionalWithColorsPattern(
  j: API['jscodeshift'],
  config: ResolutionConfig
): any {
  const { componentName, defaultColor } = config;
  const styleFunction = `createSemantic${componentName}Styles`;

  return j.conditionalExpression(
    j.logicalExpression(
      '&&',
      j.identifier('color'),
      j.callExpression(j.identifier('isSemanticToken'), [j.identifier('color')])
    ),
    j.callExpression(j.identifier(styleFunction), [j.identifier('color')]),
    j.logicalExpression(
      '||',
      j.memberExpression(
        j.identifier('colors'),
        j.logicalExpression('??', j.identifier('color'), j.stringLiteral(defaultColor)),
        true
      ),
      j.memberExpression(j.identifier('colors'), j.stringLiteral(defaultColor), true)
    )
  );
}

/**
 * Build simple conditional pattern without colors object
 * Used for components like Text, Link, Input that don't have predefined colors
 *
 * Pattern:
 * ```
 * const resolvedClasses = color && isSemanticToken(color)
 *   ? createSemanticStyles(color)
 *   : ''
 * ```
 */
export function buildSimpleConditionalPattern(
  j: API['jscodeshift'],
  config: ResolutionConfig
): any {
  const { componentName } = config;
  const styleFunction = `createSemantic${componentName}Styles`;

  return j.conditionalExpression(
    j.logicalExpression(
      '&&',
      j.identifier('color'),
      j.callExpression(j.identifier('isSemanticToken'), [j.identifier('color')])
    ),
    j.callExpression(j.identifier(styleFunction), [j.identifier('color')]),
    j.stringLiteral('')
  );
}

/**
 * Determine which pattern to use based on configuration
 * Pure function that returns the appropriate pattern type
 */
export function determinePattern(
  config: ResolutionConfig
): 'iife-with-colors' | 'conditional-with-colors' | 'simple-conditional' {
  const { useIIFE, hasColorsObject } = config;

  if (useIIFE && hasColorsObject) {
    return 'iife-with-colors';
  } else if (hasColorsObject) {
    return 'conditional-with-colors';
  } else {
    return 'simple-conditional';
  }
}
