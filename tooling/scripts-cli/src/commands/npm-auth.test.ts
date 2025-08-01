import { describe, it, expect, beforeEach } from 'vitest'
import { createTestContext } from '@esteban-url/cli/testing'
import { npmAuthCommand } from './npm-auth.js'

describe('npm-auth command', () => {
  let context: ReturnType<typeof createTestContext>

  beforeEach(() => {
    context = createTestContext()
  })

  it('should configure npm authentication when GITHUB_TOKEN is provided', async () => {
    const result = await npmAuthCommand.action(
      { token: 'test-token', dryRun: true },
      context.context
    )

    expect(result.isOk()).toBe(true)
    expect(context.getLoggerOutput()).toContain('Configuring npm authentication')
    expect(context.getLoggerOutput()).toContain('DRY RUN')
    expect(context.getLoggerOutput()).toContain('@trailhead:registry=https://npm.pkg.github.com')
    expect(context.getLoggerOutput()).toContain('_authToken=test-token')
  })

  it('should skip configuration when no token is provided', async () => {
    // Clear GITHUB_TOKEN env var
    const originalToken = process.env.GITHUB_TOKEN
    delete process.env.GITHUB_TOKEN

    const result = await npmAuthCommand.action({}, context.context)

    expect(result.isOk()).toBe(true)
    expect(context.getLoggerOutput()).toContain('GITHUB_TOKEN not set')
    expect(context.getLoggerOutput()).toContain('skipping GitHub Packages configuration')

    // Restore env var
    if (originalToken) {
      process.env.GITHUB_TOKEN = originalToken
    }
  })

  it('should use custom registry when provided', async () => {
    const customRegistry = 'https://custom.registry.com'
    
    const result = await npmAuthCommand.action(
      { 
        token: 'test-token', 
        registry: customRegistry,
        dryRun: true 
      },
      context.context
    )

    expect(result.isOk()).toBe(true)
    expect(context.getLoggerOutput()).toContain(`@trailhead:registry=${customRegistry}`)
    expect(context.getLoggerOutput()).toContain('//custom.registry.com/:_authToken=test-token')
  })
})