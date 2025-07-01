/**
 * Post-process transform wrapper
 * Applies final AST formatting using the post-process function
 */

import type { Transform, TransformResult } from '@/transforms/shared/types.js'
import { postProcessAstOutput } from './post-process.js'

/**
 * Post-process transform
 */
export const postProcessTransform: Transform = {
  name: 'post-process-formatting',
  description: 'Apply final AST formatting',
  type: 'ast',
  
  execute(content: string): TransformResult {
    const processed = postProcessAstOutput(content)
    
    if (processed !== content) {
      return {
        content: processed,
        changes: [{
          type: 'formatting',
          description: 'Applied post-processing formatting',
        }],
        hasChanges: true,
      }
    }
    
    return {
      content,
      changes: [],
      hasChanges: false,
    }
  }
}