import { createCommand, type CommandOptions } from '@trailhead/cli/command'
import { ok, err, createCoreError, type Result, type CoreError } from '@trailhead/core'
import { colorize, withIcon } from '../../utils/colors.js'
import { docsOperations } from '../../utils/docs.js'

interface GenerateApiOptions extends CommandOptions {
  readonly packages?: string
  readonly output?: string
  readonly clean?: boolean
  readonly watch?: boolean
}

export const generateApiCommand = createCommand<GenerateApiOptions>({
  name: 'generate-api',
  description: 'Generate API documentation using TypeDoc for all or specific packages',
  options: [
    {
      flags: '-p, --packages <packages>',
      description: 'Comma-separated list of packages to generate docs for',
      type: 'string',
    },
    {
      flags: '-o, --output <directory>',
      description: 'Output directory for generated documentation',
      type: 'string',
    },
    {
      flags: '--clean',
      description: 'Clean output directory before generation',
      type: 'boolean',
      default: false,
    },
    {
      flags: '--watch',
      description: 'Watch mode for development',
      type: 'boolean',
      default: false,
    },
  ],
  examples: [
    'generate-api',
    'generate-api --packages core,cli',
    'generate-api --output ./custom-docs --clean',
    'generate-api --watch',
  ],
  action: async (options, context): Promise<Result<void, CoreError>> => {
    context.logger.info(colorize('blue', withIcon('docs', 'Generating API documentation...')))

    try {
      const packages = options.packages
        ? options.packages.split(',').map((p) => p.trim())
        : undefined

      if (packages) {
        context.logger.info(`Generating docs for packages: ${packages.join(', ')}`)
      } else {
        context.logger.info('Generating docs for all packages')
      }

      if (options.watch) {
        context.logger.info(colorize('yellow', 'Running in watch mode...'))
      }

      if (options.clean) {
        context.logger.info('Cleaning output directory...')
      }

      const result = docsOperations.generateApiDocs({
        packages,
        outputDir: options.output,
        clean: options.clean,
        watch: options.watch,
      })

      if (result.isErr()) {
        return result
      }

      context.logger.info(colorize('green', '✅ API documentation generated successfully'))

      if (options.output) {
        context.logger.info(`Documentation available at: ${options.output}`)
      }

      return ok(undefined)
    } catch {
      return err(
        createCoreError('API_DOCS_ERROR', 'DOCS_ERROR', 'Failed to generate API documentation')
      )
    }
  },
})
