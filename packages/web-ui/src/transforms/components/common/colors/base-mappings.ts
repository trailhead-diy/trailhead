/**
 * Base color mappings - zinc to semantic tokens
 * These are the core color transformations that apply to all components
 *
 * - Functional composition from focused modules
 * - Pure functions with no side effects
 * - Single responsibility per module
 *
 * CRITICAL: These mappings exclude style object contexts to preserve
 * component functionality like Button/Badge predefined color schemes
 */

import {
  createProtectedRegexTransform,
  makeProtected,
} from '../utilities/protected-regex-transform-factory.js'
import { getBackgroundMappings } from './mappings/backgrounds.js'
import { getBorderMappings } from './mappings/borders.js'
import { getFillMappings } from './mappings/fills.js'
import { getRingMappings } from './mappings/rings.js'
import { getTextMappings } from './mappings/text.js'

/**
 * Get all color mappings by combining individual mapping functions
 * Pure function that aggregates all color transformation rules
 */
function getAllColorMappings() {
  return [
    ...getBackgroundMappings(),
    ...getBorderMappings(),
    ...getFillMappings(),
    ...getRingMappings(),
    ...getTextMappings(),
  ]
}

/**
 * Base color mappings transform with style object protection
 * Uses protected regex transform factory to preserve component functionality
 *
 * CRITICAL: This transform protects style objects like Button.colors and Badge.colors
 * from being modified, ensuring predefined color schemes remain functional
 */
export const baseMappingsTransform = createProtectedRegexTransform({
  name: 'protected-base-color-mappings',
  description: 'Transform zinc colors to semantic tokens (protected)',
  mappings: makeProtected(getAllColorMappings()),
  changeType: 'protected-color-mapping',
  globalProtection: true, // Enable style object protection
})
