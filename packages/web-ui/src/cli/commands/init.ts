/**
 * Init Command - Initialize a new Trailhead UI project
 */

import { Ok } from '@trailhead/cli'
import { createCommand } from '@trailhead/cli/command'
import { type StrictInitOptions } from '../core/types/command-options.js'

// Use strict typing for better type safety
type InitOptions = StrictInitOptions

export const createInitCommand = () => {
  return createCommand<InitOptions>({
    name: 'init',
    description: 'Initialize a new Trailhead UI project',
    
    options: [
      {
        flags: '-n, --name <name>',
        description: 'project name',
      },
      {
        flags: '-t, --template <template>',
        description: 'project template',
      },
    ],

    examples: [
      '$ trailhead-ui init',
      '$ trailhead-ui init --name my-app',
      '$ trailhead-ui init --template nextjs',
    ],

    action: async (_options, context) => {
      context.logger.info('🚧 Init command coming soon!')
      context.logger.info('For now, use: trailhead-ui install')
      return Ok(undefined)
    },
  })
}