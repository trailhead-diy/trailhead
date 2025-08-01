import { createCommand, type CommandOptions, type CommandContext } from '@esteban-url/cli/command'
import { ok, err, createCoreError, type Result, type CoreError } from '@esteban-url/core'
import { colorize, withIcon } from '../utils/colors.js'

interface NpmAuthOptions extends CommandOptions {
  readonly token?: string
  readonly registry?: string
  readonly dryRun?: boolean
}

export const npmAuthCommand = createCommand<NpmAuthOptions>({
  name: 'npm-auth',
  description: 'Setup npm authentication for GitHub Packages',
  options: [
    {
      flags: '-t, --token <token>',
      description: 'GitHub token (defaults to GITHUB_TOKEN env var)',
      type: 'string'
    },
    {
      flags: '-r, --registry <url>',
      description: 'Registry URL',
      type: 'string',
      default: 'https://npm.pkg.github.com'
    },
    {
      flags: '--dry-run',
      description: 'Show what would be done without executing',
      type: 'boolean',
      default: false
    }
  ],
  examples: [
    'npm-auth',
    'npm-auth --token ghp_xxx',
    'npm-auth --registry https://npm.pkg.github.com --dry-run'
  ],
  action: async (options, context): Promise<Result<void, CoreError>> => {
    // Get token from options or environment
    const token = options.token || process.env.GITHUB_TOKEN
    
    if (!token) {
      context.logger.info(withIcon('info', 'GITHUB_TOKEN not set, skipping GitHub Packages configuration'))
      context.logger.info('   This is normal for public CI builds and local development')
      return ok(undefined)
    }

    context.logger.info(colorize('blue', withIcon('progress', 'Configuring npm authentication for GitHub Packages...')))

    const npmrcPath = '.npmrc'
    const registry = options.registry || 'https://npm.pkg.github.com'
    
    const npmrcContent = [
      '',
      '# GitHub Packages Authentication (added by scripts-cli)',
      `@trailhead:registry=${registry}`,
      `//${new URL(registry).host}/:_authToken=${token}`
    ].join('\n')

    if (options.dryRun) {
      context.logger.info(colorize('yellow', 'DRY RUN: Would append to .npmrc:'))
      context.logger.info(npmrcContent)
      return ok(undefined)
    }

    // Check if .npmrc exists and read existing content
    let existingContent = ''
    const npmrcExists = await context.fs.exists(npmrcPath)
    
    if (npmrcExists.isOk() && npmrcExists.value) {
      const contentResult = await context.fs.readFile(npmrcPath)
      if (contentResult.isOk()) {
        existingContent = contentResult.value
        // Check if already configured to avoid duplicates
        if (existingContent.includes('GitHub Packages Authentication')) {
          context.logger.info(withIcon('info', 'GitHub Packages authentication already configured'))
          return ok(undefined)
        }
      } else {
        return err(
          createCoreError(
            'NPMRC_READ_FAILED',
            'FILE_SYSTEM_ERROR',
            'Failed to read existing .npmrc configuration',
            {
              recoverable: true,
              cause: contentResult.error,
              suggestion: 'Check file permissions and ensure the file is readable'
            }
          )
        )
      }
    }

    // Simulate append by combining existing content with new content
    const finalContent = existingContent ? existingContent + npmrcContent : npmrcContent.trimStart()
    
    // Write the combined content
    const writeResult = await context.fs.writeFile(npmrcPath, finalContent)
    if (writeResult.isErr()) {
      return err(
        createCoreError(
          'NPMRC_WRITE_FAILED',
          'FILE_SYSTEM_ERROR',
          'Failed to write .npmrc configuration',
          {
            recoverable: true,
            cause: writeResult.error,
            suggestion: 'Check file permissions and ensure the directory is writable'
          }
        )
      )
    }
    
    context.logger.info(colorize('green', withIcon('success', 'GitHub Packages authentication configured')))
    return ok(undefined)
  }
})