/**
 * Main transform creation logic
 */

import { createRequire } from 'module'
import { API, FileInfo } from 'jscodeshift'
import { STANDARD_AST_FORMAT_OPTIONS } from '@/transforms/components/common/formatting/ast-options.js'
import type { Transform, TransformResult } from '@/transforms/shared/types.js'
import { addSemanticImports } from '../import-handler.js'
import {
  updateColorTypeAlias,
  updateColorPropType,
  addColorPropToInterface,
  addPropsToInlineType,
} from '../type-updater.js'
import { buildSemanticResolution } from '../resolution-builder/ast-builders.js'
import { insertSemanticResolution } from '../resolution-builder/insertion-logic.js'
import type { ComponentConfig, TransformContext } from './types.js'
import {
  shouldTransformContent,
  findComponentDeclaration,
  extractFunctionBody,
  getFunctionParams,
} from './component-detector.js'
import { addColorPropIfNeeded } from './prop-enhancer.js'
import { applySemanticResolution } from './resolution-applier.js'

// Create require function for ESM compatibility
const require = createRequire(import.meta.url)

/**
 * Check if an error is a non-critical AST parsing warning that should be suppressed
 */
function isNonCriticalASTError(error: any): boolean {
  if (!(error instanceof Error)) return false

  const message = error.message

  // Suppress specific AST parsing warnings that don't affect functionality
  const suppressedPatterns = [
    'Rest element must be last element',
    'SyntaxError: Rest element must be last element',
    'ElementAfterRest',
  ]

  return suppressedPatterns.some((pattern) => message.includes(pattern))
}

/**
 * Create a semantic enhancement transform from configuration
 * This is the main orchestrator that composes all utilities
 */
export function createSemanticEnhancementTransform(config: ComponentConfig): Transform {
  const {
    name,
    typeAliasName = 'Color',
    propsInterfaceName = `${name}Props`,
    variableName: _variableName = 'resolvedColorClasses',
    defaultColor: _defaultColor,
    hasColorsObject: _hasColorsObject = true,
    useIIFE: _useIIFE = false,
  } = config

  return {
    name: `${name.toLowerCase()}-semantic-enhancement`,
    description: `Add semantic token support to ${name} component`,
    type: 'ast',

    execute(content: string): TransformResult {
      // Quick check if this file contains the component
      if (!shouldTransformContent(content, config)) {
        return {
          content,
          changes: [],
          hasChanges: false,
        }
      }

      const changes: any[] = []

      try {
        const jscodeshift = require('jscodeshift')
        const j = jscodeshift.withParser('tsx')

        const transformer = (fileInfo: FileInfo, _api: API) => {
          const root = j(fileInfo.source)
          const context: TransformContext = { root, j, config, changes }

          // Step 1: Add imports
          const importResult = addSemanticImports(root, j, name)
          changes.push(...importResult.changes)

          // Step 2: Update types based on pattern
          handleTypeUpdates(context, typeAliasName, propsInterfaceName)

          // Step 3: Process component declarations
          const componentPaths = findComponentDeclaration(root, j, config)

          componentPaths.forEach((path) => {
            processComponentDeclaration(path, context)
          })

          return root.toSource(STANDARD_AST_FORMAT_OPTIONS)
        }

        const result = transformer(
          { path: `${name.toLowerCase()}.tsx`, source: content },
          { jscodeshift: j, j, stats: () => {}, report: () => {} }
        )

        return {
          content: result || content,
          changes,
          hasChanges: changes.length > 0,
        }
      } catch (error) {
        // Only log errors that are not non-critical AST parsing warnings
        if (!isNonCriticalASTError(error)) {
          console.error(`Error in ${name} semantic enhancement transform:`, error)
        }

        return {
          content,
          changes: [
            {
              type: 'error',
              description: `Transform failed: ${error}`,
            },
          ],
          hasChanges: false,
        }
      }
    },
  }
}

/**
 * Handle type updates based on pattern
 * Extracted for clarity and single responsibility
 */
function handleTypeUpdates(
  context: TransformContext,
  typeAliasName: string,
  propsInterfaceName: string
): void {
  const { root, j, config, changes } = context
  const { typePattern } = config

  if (typePattern === 'alias') {
    const typeResult = updateColorTypeAlias(root, j, typeAliasName)
    changes.push(...typeResult.changes)
  } else if (typePattern === 'prop') {
    const propResult = updateColorPropType(root, j)
    if (!propResult.hasChanges && propsInterfaceName) {
      // Try to add to interface if not found as prop
      const interfaceResult = addColorPropToInterface(root, j, propsInterfaceName)
      changes.push(...interfaceResult.changes)
    } else {
      changes.push(...propResult.changes)
    }

    // Always try to add className and color props to inline types for prop pattern
    const inlineTypeResult = addPropsToInlineType(root, j, true, true)
    changes.push(...inlineTypeResult.changes)
  } else {
    // For 'none' pattern, still add className if needed
    const inlineTypeResult = addPropsToInlineType(root, j, true, false)
    changes.push(...inlineTypeResult.changes)
  }
}

/**
 * Process a single component declaration
 * Handles prop addition and resolution logic
 */
function processComponentDeclaration(path: any, context: TransformContext): void {
  const { j, config, changes } = context
  const {
    name,
    variableName = 'resolvedColorClasses',
    defaultColor,
    useIIFE,
    hasColorsObject,
  } = config

  const functionBody = extractFunctionBody(path, config)
  if (!functionBody) return

  // Add color prop if needed
  const params = getFunctionParams(path, config)
  addColorPropIfNeeded(params, j, context)

  // Build and insert resolution
  const resolution = buildSemanticResolution(j, {
    componentName: name,
    variableName,
    defaultColor,
    useIIFE,
    hasColorsObject,
  })

  if (insertSemanticResolution(j, functionBody, resolution)) {
    changes.push({
      type: 'logic',
      description: 'Added semantic token resolution logic',
    })

    // Apply resolution to component
    applySemanticResolution(functionBody, context)
  }
}
