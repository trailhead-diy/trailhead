/**
 * Init Command - Initialize a new Trailhead UI project
 */

import { ok } from '@esteban-url/cli';
import { createCommand, type CommandContext } from '@esteban-url/cli/command';
import { type StrictInitOptions } from '../core/types/command-options.js';

// Use strict typing for better type safety
type InitOptions = StrictInitOptions;

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

    action: async (_options: InitOptions, context: CommandContext) => {
      context.logger.info('🚧 Init command coming soon!');
      context.logger.info('For now, use: trailhead-ui install');
      return ok(undefined);
    },
  });
};
