/**
 * Refactored Profile Command using command patterns
 */

import { Ok } from '@trailhead/cli'
import { createCommand, executeSubprocess } from '@trailhead/cli/command'
import { type StrictProfileOptions } from '../core/types/command-options.js'

// ============================================================================
// TYPES
// ============================================================================

// Use strict typing for better type safety
type ProfileOptions = StrictProfileOptions

// ============================================================================
// COMMAND CONFIGURATION
// ============================================================================

/**
 * Create profile command using unified patterns
 */
export const createProfileCommand = () => {
  return createCommand<ProfileOptions>({
    name: 'profile',
    description: 'Profile transform performance with detailed metrics and memory analysis',

    options: [
      {
        flags: '-p, --pipeline',
        description: 'profile full pipeline execution',
        default: false,
      },
      {
        flags: '-s, --simple',
        description: 'profile simple (color-only) transforms',
        default: false,
      },
      {
        flags: '--memory',
        description: 'include memory profiling (requires --expose-gc)',
        default: false,
      },
    ],

    examples: [
      '$ trailhead-ui profile',
      '$ trailhead-ui profile --pipeline --verbose',
      '$ trailhead-ui profile --simple --memory',
      '$ node --expose-gc trailhead-ui profile --memory',
    ],

    validation: (options) => {
      if (options.pipeline && options.simple) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Cannot use both --pipeline and --simple options together',
            suggestion:
              'Choose either --pipeline for full pipeline profiling or --simple for color-only transforms',
            recoverable: true,
          },
        }
      }
      return { success: true, value: options }
    },

    action: async (options, cmdContext) => {
      // Set up environment based on options
      const env: Record<string, string> = {}

      if (options.pipeline) {
        env.PROFILE_MODE = 'pipeline'
      } else if (options.simple) {
        env.PROFILE_MODE = 'simple'
      }

      if (options.verbose) {
        env.PROFILE_VERBOSE = 'true'
      }

      if (options.memory) {
        env.PROFILE_MEMORY = 'true'

        // Check if --expose-gc is available
        if (!global.gc) {
          cmdContext.logger.warning(
            'Memory profiling requested but --expose-gc flag not detected. ' +
              'For accurate memory measurements, run with: node --expose-gc trailhead-ui profile --memory'
          )
        }
      }

      // Delegate to the profiling system using subprocess pattern
      const profilingModule = `${cmdContext.projectRoot}/dist/src/transforms/profiling/main.js`

      // Build args based on whether memory profiling is enabled
      const args =
        options.memory && global.gc ? ['--expose-gc', profilingModule] : [profilingModule]

      const result = await executeSubprocess(
        {
          command: 'node',
          args,
          env,
          cwd: cmdContext.projectRoot,
        },
        cmdContext
      )

      if (!result.success) {
        return result
      }

      cmdContext.logger.success('Profiling completed successfully')
      return Ok(undefined)
    },
  })
}
