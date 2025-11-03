import { createCommand, type CommandOptions } from '@trailhead/cli/command'
import { ok, err, createCoreError, type Result, type CoreError } from '@trailhead/core'
import { colorize, withIcon } from '../../utils/colors.js'
import { docsOperations } from '../../utils/docs.js'

interface SetupIntegrationOptions extends CommandOptions {
  readonly force?: boolean
}

export const setupIntegrationCommand = createCommand<SetupIntegrationOptions>({
  name: 'setup-integration',
  description: 'Setup API documentation integration with proper directory structure',
  options: [
    {
      flags: '--force',
      description: 'Force setup even if files already exist',
      type: 'boolean',
      default: false,
    },
  ],
  examples: ['setup-integration', 'setup-integration --force'],
  action: async (options, context): Promise<Result<void, CoreError>> => {
    context.logger.info(
      colorize('blue', withIcon('docs', 'Setting up API documentation integration...'))
    )

    try {
      if (options.force) {
        context.logger.info(
          colorize('yellow', 'Force mode enabled - will overwrite existing files')
        )
      }

      const result = docsOperations.setupApiIntegration()

      if (result.isErr()) {
        return result
      }

      context.logger.info(colorize('green', '✅ API documentation integration setup complete'))
      context.logger.info('')
      context.logger.info('Documentation structure created:')
      context.logger.info('  docs/')
      context.logger.info('  └── api/')
      context.logger.info('      ├── index.md')
      context.logger.info('      ├── core/')
      context.logger.info('      ├── cli/')
      context.logger.info('      ├── config/')
      context.logger.info('      ├── data/')
      context.logger.info('      ├── fs/')
      context.logger.info('      ├── validation/')
      context.logger.info('      └── create-cli/')
      context.logger.info('')
      context.logger.info(colorize('blue', 'Next steps:'))
      context.logger.info('1. Run `dev-cli generate-api` to generate documentation')
      context.logger.info('2. Configure your documentation site to include the API docs')

      return ok(undefined)
    } catch {
      return err(
        createCoreError(
          'DOCS_SETUP_ERROR',
          'DOCS_ERROR',
          'Failed to setup API documentation integration'
        )
      )
    }
  },
})
