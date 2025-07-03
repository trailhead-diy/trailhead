/**
 * Add Command - Add individual components
 */

import { Ok } from '@esteban-url/trailhead-cli'
import { createCommand } from '@esteban-url/trailhead-cli/command'
import { type StrictAddOptions } from '../core/types/command-options.js'

// Use strict typing for better type safety
type AddOptions = StrictAddOptions

export const createAddCommand = () => {
  return createCommand<AddOptions>({
    name: 'add',
    description: 'Add individual components',
    arguments: '[components...]',
    
    options: [
      {
        flags: '-f, --force',
        description: 'overwrite existing files',
        default: false,
      },
    ],

    examples: [
      '$ trailhead-ui add button',
      '$ trailhead-ui add button input --force',
      '$ trailhead-ui add dialog table badge',
    ],

    action: async (_options, context) => {
      context.logger.info('🚧 Add command coming soon!')
      context.logger.info('For now, use: trailhead-ui install')
      return Ok(undefined)
    },
  })
}