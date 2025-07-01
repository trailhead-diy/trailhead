/**
 * Component detection logic for AST transformations
 */

import type { JSCodeshift, Collection } from 'jscodeshift'
import type { ComponentInfo } from '@/transforms/shared/types.js'

// Component configurations
export const COMPONENT_CONFIGS: ComponentInfo[] = [
  {
    name: 'Button',
    type: 'forwardRef',
    colorPropHandling: 'styles',
    semanticStyleFunction: 'createSemanticButtonStyles',
  },
  {
    name: 'Badge',
    type: 'function',
    colorPropHandling: 'colors',
    defaultColor: 'zinc',
    semanticStyleFunction: 'createSemanticBadgeStyles',
  },
  {
    name: 'Checkbox',
    type: 'function',
    colorPropHandling: 'colors',
    defaultColor: 'dark/zinc',
    semanticStyleFunction: 'createSemanticCheckboxStyles',
  },
  {
    name: 'Radio',
    type: 'function',
    colorPropHandling: 'colors',
    defaultColor: 'dark/zinc',
    semanticStyleFunction: 'createSemanticRadioStyles',
  },
  {
    name: 'Switch',
    type: 'function',
    colorPropHandling: 'colors',
    defaultColor: 'dark/zinc',
    semanticStyleFunction: 'createSemanticSwitchStyles',
  },
  {
    name: 'Text',
    type: 'function',
    colorPropHandling: 'direct',
    semanticStyleFunction: 'createSemanticTextStyles',
  },
  {
    name: 'Link',
    type: 'forwardRef',
    colorPropHandling: 'direct',
    semanticStyleFunction: 'createSemanticLinkStyles',
  },
  {
    name: 'Input',
    type: 'forwardRef',
    colorPropHandling: 'direct',
    semanticStyleFunction: 'createSemanticInputStyles',
  },
]

/**
 * Detect which component we're processing based on AST content
 */
export function detectComponent(root: Collection<any>, j: JSCodeshift): ComponentInfo | null {
  for (const config of COMPONENT_CONFIGS) {
    // Check for the component export
    const hasComponent =
      root.find(j.VariableDeclarator, {
        id: { type: 'Identifier', name: config.name },
      }).length > 0 ||
      root.find(j.FunctionDeclaration, {
        id: { type: 'Identifier', name: config.name },
      }).length > 0

    if (hasComponent) {
      return config
    }
  }
  return null
}