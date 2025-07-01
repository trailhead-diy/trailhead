/**
 * Protected Regex Transform Factory
 *
 * Creates regex-based transforms that respect style object contexts and CSS variables
 *
 * This factory extends the base regex transform to protect component style objects
 * from being modified, preserving critical functionality like Button/Badge color schemes
 */

import type { Transform, TransformResult } from '@/transforms/shared/types.js'
import { createProtectedReplacer, createStyleObjectProtection } from './style-object-detector.js'
import {
  createColorsProtectedReplacer,
  createColorsObjectProtection,
  createCombinedProtection,
} from './colors-object-detector.js'

export interface ProtectedColorMapping {
  pattern: RegExp
  replacement: string
  description: string
  respectStyleObjects?: boolean // Default: true
  respectColorsObjects?: boolean // Default: true
}

export interface ProtectedRegexTransformConfig {
  name: string
  description: string
  mappings: ProtectedColorMapping[]
  changeType?: string
  contentFilter?: (content: string) => boolean
  globalProtection?: boolean // Default: true - protect all mappings
}

/**
 * Create a protected regex-based transform from configuration
 * Pure function that returns a Transform with style object protection
 */
export function createProtectedRegexTransform(config: ProtectedRegexTransformConfig): Transform {
  return {
    name: config.name,
    description: config.description,
    type: 'regex',

    execute(content: string): TransformResult {
      // Apply content filter if provided
      if (config.contentFilter && !config.contentFilter(content)) {
        return {
          content,
          changes: [],
          hasChanges: false,
        }
      }

      let transformed = content
      const changes: TransformResult['changes'] = []

      // Apply each mapping pattern with protection
      for (const mapping of config.mappings) {
        const shouldProtectStyles =
          config.globalProtection !== false && mapping.respectStyleObjects !== false
        const shouldProtectColors =
          config.globalProtection !== false && mapping.respectColorsObjects !== false

        if (shouldProtectStyles || shouldProtectColors) {
          let protectedReplace

          if (shouldProtectStyles && shouldProtectColors) {
            // Use combined protection for both style and colors objects
            const styleProtection = createStyleObjectProtection()
            const colorsProtection = createColorsObjectProtection()
            const combinedProtection = createCombinedProtection(styleProtection, colorsProtection)

            protectedReplace = function (content: string): string {
              return content.replace(mapping.pattern, (match, ...args) => {
                const offset = args[args.length - 2]
                if (typeof offset === 'number') {
                  const matchObj = Object.assign([match], { index: offset }) as RegExpMatchArray
                  if (combinedProtection(content, matchObj)) {
                    return match // Return original match unchanged
                  }
                }

                if (typeof mapping.replacement === 'function') {
                  return (mapping.replacement as Function)(match, ...args)
                }
                return mapping.replacement
              })
            }
          } else if (shouldProtectStyles) {
            // Use style object protection only
            protectedReplace = createProtectedReplacer(mapping.pattern, mapping.replacement)
          } else {
            // Use colors object protection only
            protectedReplace = createColorsProtectedReplacer(mapping.pattern, mapping.replacement)
          }

          const originalContent = transformed
          transformed = protectedReplace(transformed)

          // Check if any changes were made
          if (transformed !== originalContent) {
            changes.push({
              type: config.changeType || 'protected-color-mapping',
              description: mapping.description,
            })
          }
        } else {
          // Use standard replacement for mappings that opt out
          const matches = transformed.match(mapping.pattern)
          if (matches) {
            transformed = transformed.replace(mapping.pattern, mapping.replacement)
            changes.push({
              type: config.changeType || 'color-mapping',
              description: mapping.description,
            })
          }
        }
      }

      return {
        content: transformed,
        changes,
        hasChanges: changes.length > 0,
      }
    },
  }
}

/**
 * Convert standard ColorMapping to ProtectedColorMapping
 * Utility for migrating existing transforms
 */
export function makeProtected(
  mappings: Array<{
    pattern: RegExp
    replacement: string
    description: string
  }>
): ProtectedColorMapping[] {
  return mappings.map((mapping) => ({
    ...mapping,
    respectStyleObjects: true,
    respectColorsObjects: true,
  }))
}
