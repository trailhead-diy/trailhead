import { createCommand, type CommandOptions } from '@esteban-url/cli/command'
import { ok, err, createCoreError, type Result, type CoreError } from '@esteban-url/core'
import { colorize, withIcon } from '../../utils/colors.js'
import { docsOperations } from '../../utils/docs.js'

interface ValidateDocsOptions extends CommandOptions {
  readonly pattern?: string
  readonly fix?: boolean
  readonly verbose?: boolean
  readonly strict?: boolean
}

export const validateDocsCommand = createCommand<ValidateDocsOptions>({
  name: 'validate-docs',
  description: 'Comprehensive documentation validation with TypeScript syntax checking',
  options: [
    {
      flags: '--pattern <glob>',
      description: 'Glob pattern for files to validate',
      type: 'string',
      default: '**/*.{md,mdx}',
    },
    {
      flags: '--fix',
      description: 'Attempt to fix validation issues automatically',
      type: 'boolean',
      default: false,
    },
    {
      flags: '--strict',
      description: 'Enable strict validation mode',
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
    'validate-docs',
    'validate-docs --pattern "docs/**/*.md"',
    'validate-docs --verbose --strict',
    'validate-docs --pattern "tutorials/**/*.md" --fix',
  ],
  action: async (options, context): Promise<Result<void, CoreError>> => {
    context.logger.info(colorize('blue', withIcon('search', 'Validating documentation...')))

    const pattern = options.pattern || '**/*.{md,mdx}'

    if (options.verbose) {
      context.logger.info(`Pattern: ${pattern}`)
      context.logger.info(`Fix mode: ${options.fix ? 'enabled' : 'disabled'}`)
      context.logger.info(`Strict mode: ${options.strict ? 'enabled' : 'disabled'}`)
    }

    try {
      // Start validation phases
      context.logger.info(colorize('blue', '🔍 Phase 1: Extracting and validating code blocks...'))

      const result = docsOperations.validateMarkdownCodeBlocks({
        pattern,
        fix: options.fix || false,
        verbose: options.verbose || false,
        strict: options.strict || false,
      })

      if (result.isErr()) {
        return err(result.error)
      }

      const { filesChecked, errors, warnings, passed, failed } = result.value

      // Report phase 1 results
      context.logger.info(`Checked ${filesChecked} files with code blocks`)

      if (failed === 0) {
        context.logger.info(colorize('green', `✅ All ${passed} files passed code validation!`))
      } else {
        context.logger.error(colorize('red', `❌ ${failed} files have validation errors`))

        if (options.verbose && errors.length > 0) {
          context.logger.info('\nValidation errors:')
          errors.forEach((error, index) => {
            context.logger.error(`\n${index + 1}. ${error.file}:${error.line}`)
            context.logger.error(`   ${colorize('red', error.message)}`)
            if (error.code) {
              context.logger.error(`   Code:\n${error.code}`)
            }
          })
        }
      }

      // Show warnings
      if (warnings.length > 0) {
        context.logger.info(colorize('yellow', `⚠️  ${warnings.length} warnings found`))

        if (options.verbose) {
          warnings.forEach((warning) => {
            context.logger.info(colorize('yellow', `   ${warning}`))
          })
        }
      }

      // Phase 2: Test examples with actual API (if requested)
      if (options.strict) {
        context.logger.info(colorize('blue', '\n🔍 Phase 2: Testing examples with actual API...'))

        const testResult = docsOperations.testDocumentationExamples({
          verbose: options.verbose || false,
        })

        if (testResult.isOk()) {
          const { totalTests, passed: testsPassed, failed: testsFailed } = testResult.value

          if (testsFailed === 0) {
            context.logger.info(colorize('green', `✅ All ${totalTests} API tests passed!`))
          } else {
            context.logger.error(
              colorize('red', `❌ ${testsFailed} of ${totalTests} API tests failed`)
            )
          }
        }
      }

      // Final summary
      context.logger.info(colorize('blue', '\n📊 Validation Summary'))
      context.logger.info('====================')
      context.logger.info(`Files checked: ${filesChecked}`)
      context.logger.info(`${colorize('green', `Passed: ${passed}`)}`)

      if (failed > 0) {
        context.logger.info(`${colorize('red', `Failed: ${failed}`)}`)
      }

      if (warnings.length > 0) {
        context.logger.info(`${colorize('yellow', `Warnings: ${warnings.length}`)}`)
      }

      // Success/failure determination
      const hasErrors = failed > 0
      const hasStrictFailures = options.strict && errors.length > 0

      if (!hasErrors && !hasStrictFailures) {
        context.logger.info(colorize('green', '\n✨ All documentation validation checks passed!'))
        return ok(undefined)
      } else {
        const errorMessage = hasStrictFailures
          ? 'Documentation validation failed in strict mode'
          : `Found ${failed} files with validation errors`

        return err(createCoreError('DOCS_VALIDATION_FAILED', 'DOCS_ERROR', errorMessage))
      }
    } catch (error) {
      return err(
        createCoreError('DOCS_VALIDATION_ERROR', 'DOCS_ERROR', 'Failed to validate documentation')
      )
    }
  },
})
