import { createCommand, type CommandOptions } from '@trailhead/cli/command'
import { ok, err, createCoreError, type Result, type CoreError } from '@trailhead/core'
import { colorize, withIcon } from '../../utils/colors.js'
import { docsOperations } from '../../utils/docs.js'

interface FixLinksOptions extends CommandOptions {
  readonly pattern?: string
  readonly dryRun?: boolean
}

export const fixLinksCommand = createCommand<FixLinksOptions>({
  name: 'fix-links',
  description: 'Fix Docusaurus-compatible links in markdown files',
  options: [
    {
      flags: '--pattern <glob>',
      description: 'Glob pattern for files to process',
      type: 'string',
      default: '**/*.{md,mdx}',
    },
    {
      flags: '--dry-run',
      description: 'Show what would be fixed without making changes',
      type: 'boolean',
      default: false,
    },
  ],
  examples: ['fix-links', 'fix-links --pattern "docs/**/*.md"', 'fix-links --dry-run'],
  action: async (options, context): Promise<Result<void, CoreError>> => {
    context.logger.info(colorize('blue', withIcon('docs', 'Fixing documentation links...')))

    if (options.dryRun) {
      context.logger.info(colorize('yellow', 'Running in dry-run mode - no changes will be made'))
    }

    try {
      context.logger.info(`Searching for files matching: ${options.pattern}`)

      const result = docsOperations.fixDocusaurusLinks(options.pattern)

      if (result.isErr()) {
        return err(result.error)
      }

      const { fixed, errors } = result.value

      if (fixed === 0) {
        context.logger.info(colorize('green', '✅ No links needed fixing'))
      } else {
        context.logger.info(colorize('green', `✅ Fixed links in ${fixed} files`))
      }

      if (errors.length > 0) {
        context.logger.info(colorize('yellow', `⚠️  Encountered ${errors.length} errors:`))
        for (const error of errors) {
          context.logger.info(`   ${error}`)
        }
      }

      return ok(undefined)
    } catch {
      return err(
        createCoreError('LINK_FIX_ERROR', 'DOCS_ERROR', 'Failed to fix documentation links')
      )
    }
  },
})
