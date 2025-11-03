import { createCommand, type CommandOptions } from '@trailhead/cli/command'
import { ok, err, createCoreError, type Result, type CoreError } from '@trailhead/core'
import { colorize, withIcon } from '../../utils/colors.js'
import { docsOperations } from '../../utils/docs.js'

interface TestExamplesOptions extends CommandOptions {
  readonly verbose?: boolean
  readonly filter?: string
}

export const testExamplesCommand = createCommand<TestExamplesOptions>({
  name: 'test-examples',
  description: 'Test documentation examples with actual Trailhead API imports',
  options: [
    {
      flags: '--filter <pattern>',
      description: 'Filter tests by pattern',
      type: 'string',
    },
    {
      flags: '-v, --verbose',
      description: 'Show detailed test information',
      type: 'boolean',
      default: false,
    },
  ],
  examples: ['test-examples', 'test-examples --verbose', 'test-examples --filter "CLI creation"'],
  action: async (options, context): Promise<Result<void, CoreError>> => {
    context.logger.info(colorize('blue', withIcon('search', 'Testing documentation examples...')))

    if (options.verbose) {
      context.logger.info('Running tests against actual Trailhead API')
      if (options.filter) {
        context.logger.info(`Filter: ${options.filter}`)
      }
    }

    try {
      const result = docsOperations.testDocumentationExamples({
        verbose: options.verbose || false,
        filter: options.filter,
      })

      if (result.isErr()) {
        return err(result.error)
      }

      const { totalTests, passed, failed, errors } = result.value

      // Report results
      if (failed === 0) {
        context.logger.info(
          colorize('green', `✅ All ${totalTests} documentation examples passed!`)
        )
      } else {
        context.logger.error(colorize('red', `❌ ${failed} of ${totalTests} tests failed`))

        if (options.verbose && errors.length > 0) {
          context.logger.info('\nFailed tests:')
          errors.forEach((error, index) => {
            context.logger.error(`\n${index + 1}. ${error.testName}`)
            context.logger.error(`   ${colorize('red', error.error)}`)
            if (error.stack) {
              context.logger.error(`   Stack trace:\n${error.stack}`)
            }
          })
        }
      }

      // Summary
      context.logger.info('\nSummary:')
      context.logger.info(`  Total tests: ${totalTests}`)
      context.logger.info(`  ${colorize('green', `Passed: ${passed}`)}`)
      if (failed > 0) {
        context.logger.info(`  ${colorize('red', `Failed: ${failed}`)}`)
      }

      return failed === 0
        ? ok(undefined)
        : err(
            createCoreError(
              'TEST_EXAMPLES_FAILED',
              'DOCS_ERROR',
              `${failed} documentation examples failed`
            )
          )
    } catch (error) {
      return err(
        createCoreError(
          'TEST_EXAMPLES_ERROR',
          'DOCS_ERROR',
          'Failed to test documentation examples'
        )
      )
    }
  },
})
