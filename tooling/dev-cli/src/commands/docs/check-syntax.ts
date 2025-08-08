import { createCommand, type CommandOptions } from '@esteban-url/cli/command'
import { ok, err, createCoreError, type Result, type CoreError } from '@esteban-url/core'
import { colorize, withIcon } from '../../utils/colors.js'
import { docsOperations } from '../../utils/docs.js'

interface CheckSyntaxOptions extends CommandOptions {
  readonly pattern?: string
  readonly fix?: boolean
  readonly verbose?: boolean
}

export const checkSyntaxCommand = createCommand<CheckSyntaxOptions>({
  name: 'check-syntax',
  description: 'Validate TypeScript syntax in documentation examples',
  options: [
    {
      flags: '--pattern <glob>',
      description: 'Glob pattern for files to check',
      type: 'string',
      default: 'docs/**/*.{md,mdx}',
    },
    {
      flags: '--fix',
      description: 'Attempt to fix syntax issues automatically',
      type: 'boolean',
      default: false,
    },
    {
      flags: '-v, --verbose',
      description: 'Show detailed validation information',
      type: 'boolean',
      default: false,
    },
  ],
  examples: [
    'check-syntax',
    'check-syntax --pattern "tutorials/**/*.md"',
    'check-syntax --fix --verbose',
  ],
  action: async (options, context): Promise<Result<void, CoreError>> => {
    context.logger.info(colorize('blue', withIcon('search', 'Checking documentation syntax...')))

    if (options.verbose) {
      context.logger.info(`Pattern: ${options.pattern}`)
      context.logger.info(`Fix mode: ${options.fix ? 'enabled' : 'disabled'}`)
    }

    try {
      const result = docsOperations.checkDocsSyntax({
        pattern: options.pattern || 'docs/**/*.{md,mdx}',
        fix: options.fix || false,
        verbose: options.verbose || false,
      })

      if (result.isErr()) {
        return err(result.error)
      }

      const { filesChecked, errors, warnings, fixed } = result.value

      // Report results
      if (errors.length === 0) {
        context.logger.info(
          colorize('green', `✅ All syntax checks passed! (${filesChecked} files checked)`)
        )
      } else {
        context.logger.error(
          colorize('red', `❌ Found ${errors.length} syntax errors in documentation`)
        )

        if (options.verbose) {
          errors.forEach((error, index) => {
            context.logger.error(`\n${index + 1}. ${error.file}:${error.line}`)
            context.logger.error(`   ${colorize('red', error.message)}`)
            if (error.code) {
              context.logger.error(`   Code:\n${error.code}`)
            }
          })
        }
      }

      if (warnings.length > 0) {
        context.logger.info(colorize('yellow', `⚠️  ${warnings.length} warnings found`))

        if (options.verbose) {
          warnings.forEach((warning) => {
            context.logger.info(colorize('yellow', `   ${warning}`))
          })
        }
      }

      if (options.fix && fixed > 0) {
        context.logger.info(colorize('green', `🔧 Fixed ${fixed} issues automatically`))
      }

      return errors.length === 0
        ? ok(undefined)
        : err(
            createCoreError(
              'SYNTAX_CHECK_FAILED',
              'DOCS_ERROR',
              `Found ${errors.length} syntax errors in documentation`
            )
          )
    } catch (error) {
      return err(
        createCoreError('SYNTAX_CHECK_ERROR', 'DOCS_ERROR', 'Failed to check documentation syntax')
      )
    }
  },
})
