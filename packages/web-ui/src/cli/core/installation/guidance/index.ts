/**
 * Guidance module exports
 */

import type { FrameworkType, FrameworkInfo } from '../framework-detection.js'
import type { FrameworkGuidance, ConfigTemplate } from './types.js'

// Re-export types
export * from './types.js'

// Import framework-specific guidance
import { generateRedwoodSDKGuidance, generateRedwoodSDKCSSTemplate } from './redwood-sdk.js'
import { generateNextJSGuidance, generateNextJSTailwindConfig, generateNextJSCSSTemplate } from './nextjs.js'
import { generateViteGuidance, generateViteTailwindConfig, generateViteCSSTemplate } from './vite.js'
import { 
  generateGenericReactGuidance, 
  generateGenericReactTailwindConfig, 
  generateGenericReactCSSTemplate 
} from './generic-react.js'

// Re-export shared utilities
export { generateCSSCustomProperties, generateThemeProviderUsage } from './shared.js'

// ============================================================================
// MAIN GUIDANCE GENERATOR
// ============================================================================

/**
 * Pure function: Generate framework-specific guidance
 */
export const generateFrameworkGuidance = (
  frameworkType: FrameworkType,
  framework: FrameworkInfo
): FrameworkGuidance => {
  switch (frameworkType) {
    case 'redwood-sdk':
      return generateRedwoodSDKGuidance(framework)
    case 'nextjs':
      return generateNextJSGuidance(framework)
    case 'vite':
      return generateViteGuidance(framework)
    case 'generic-react':
    default:
      return generateGenericReactGuidance(framework)
  }
}

// ============================================================================
// CONFIG TEMPLATE GENERATORS
// ============================================================================

/**
 * Generate Tailwind config template
 */
export const generateTailwindConfigTemplate = (frameworkType: FrameworkType): ConfigTemplate => {
  switch (frameworkType) {
    case 'nextjs':
      return generateNextJSTailwindConfig()
    case 'vite':
      return generateViteTailwindConfig()
    case 'generic-react':
      return generateGenericReactTailwindConfig()
    default:
      // RedwoodSDK doesn't need a separate Tailwind config
      return generateGenericReactTailwindConfig()
  }
}

/**
 * Generate CSS template
 */
export const generateCSSTemplate = (frameworkType: FrameworkType): ConfigTemplate => {
  switch (frameworkType) {
    case 'redwood-sdk':
      return generateRedwoodSDKCSSTemplate()
    case 'nextjs':
      return generateNextJSCSSTemplate()
    case 'vite':
      return generateViteCSSTemplate()
    case 'generic-react':
    default:
      return generateGenericReactCSSTemplate()
  }
}