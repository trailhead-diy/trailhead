/**
 * AST Transform Factory
 * Creates AST-based transforms with consistent jscodeshift handling
 */

import { createRequire } from 'module'
import type { Transform, TransformResult } from '@/transforms/shared/types.js'
import type { JSCodeshift, Collection } from 'jscodeshift'

// Create require function for ESM compatibility
const require = createRequire(import.meta.url)

export interface ASTTransformConfig {
  name: string
  description: string
  transform: (root: Collection<any>, j: JSCodeshift) => TransformResult['changes']
}

// Standard AST formatting options
const STANDARD_AST_OPTIONS = {
  quote: 'single' as const,
  lineTerminator: '\n',
  tabWidth: 2,
}

/**
 * Create an AST-based transform from configuration
 * Handles jscodeshift initialization and source generation
 */
export function createASTTransform(config: ASTTransformConfig): Transform {
  return {
    name: config.name,
    description: config.description,
    type: 'ast',
    
    execute(content: string): TransformResult {
      // Initialize jscodeshift
      const jscodeshift = require('jscodeshift')
      const j = jscodeshift.withParser('tsx')
      const root = j(content)
      
      // Run the transformation
      const changes = config.transform(root, j)
      
      // If changes were made, generate new source
      if (changes.length > 0) {
        const transformed = root.toSource(STANDARD_AST_OPTIONS)
        
        return {
          content: transformed,
          changes,
          hasChanges: true,
        }
      }
      
      // No changes needed
      return {
        content,
        changes: [],
        hasChanges: false,
      }
    }
  }
}