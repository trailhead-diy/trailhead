import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { npmAuthCommand } from '../../src/commands/npm-auth.js'
import { createMockContext, createMockFileSystem } from '../utils/mock-context.js'

describe('npm-auth integration tests', () => {
  let mockContext: any
  let files: Record<string, string>
  let originalEnv: any

  beforeEach(() => {
    files = {}
    mockContext = createMockContext({
      fs: createMockFileSystem(files)
    })
    originalEnv = process.env
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should create .npmrc with GitHub token from environment', async () => {
    process.env.GITHUB_TOKEN = 'ghp_test_token_123'
    
    const result = await npmAuthCommand.action({}, mockContext)
    
    expect(result.isOk()).toBe(true)
    expect(files['.npmrc']).toContain('//npm.pkg.github.com/:_authToken=ghp_test_token_123')
    expect(files['.npmrc']).toContain('@trailhead:registry=https://npm.pkg.github.com')
    expect(files['.npmrc']).toContain('# GitHub Packages Authentication (added by scripts-cli)')
  })

  it('should use token from options over environment', async () => {
    process.env.GITHUB_TOKEN = 'env_token'
    
    const result = await npmAuthCommand.action({
      token: 'option_token'
    }, mockContext)
    
    expect(result.isOk()).toBe(true)
    expect(files['.npmrc']).toContain('//npm.pkg.github.com/:_authToken=option_token')
    expect(files['.npmrc']).not.toContain('env_token')
  })

  it('should use custom registry when specified', async () => {
    process.env.GITHUB_TOKEN = 'test_token'
    
    const result = await npmAuthCommand.action({
      registry: 'https://custom.npm.registry.com'
    }, mockContext)
    
    expect(result.isOk()).toBe(true)
    expect(files['.npmrc']).toContain('@trailhead:registry=https://custom.npm.registry.com')
    expect(files['.npmrc']).toContain('//custom.npm.registry.com/:_authToken=test_token')
  })

  it('should skip when no token is available', async () => {
    delete process.env.GITHUB_TOKEN
    
    const result = await npmAuthCommand.action({}, mockContext)
    
    expect(result.isOk()).toBe(true)
    expect(Object.keys(files)).toHaveLength(0)
    expect(mockContext.logger.info).toHaveBeenCalledWith(
      expect.stringContaining('GITHUB_TOKEN not set, skipping GitHub Packages configuration')
    )
  })

  it('should show dry-run output without creating file', async () => {
    process.env.GITHUB_TOKEN = 'test_token'
    
    const result = await npmAuthCommand.action({
      dryRun: true
    }, mockContext)
    
    expect(result.isOk()).toBe(true)
    expect(Object.keys(files)).toHaveLength(0)
    expect(mockContext.logger.info).toHaveBeenCalledWith(
      expect.stringContaining('DRY RUN: Would append to .npmrc:')
    )
  })

  it('should append to existing .npmrc file', async () => {
    process.env.GITHUB_TOKEN = 'test_token'
    files['.npmrc'] = 'registry=https://registry.npmjs.org/\n'
    
    const result = await npmAuthCommand.action({}, mockContext)
    
    expect(result.isOk()).toBe(true)
    expect(files['.npmrc']).toContain('registry=https://registry.npmjs.org/')
    expect(files['.npmrc']).toContain('# GitHub Packages Authentication (added by scripts-cli)')
    expect(files['.npmrc']).toContain('//npm.pkg.github.com/:_authToken=test_token')
  })

  it('should not duplicate configuration if already exists', async () => {
    process.env.GITHUB_TOKEN = 'test_token'
    files['.npmrc'] = `
registry=https://registry.npmjs.org/

# GitHub Packages Authentication (added by scripts-cli)
@trailhead:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=existing_token
`
    
    const result = await npmAuthCommand.action({}, mockContext)
    
    expect(result.isOk()).toBe(true)
    expect(mockContext.logger.info).toHaveBeenCalledWith(
      expect.stringContaining('GitHub Packages authentication already configured')
    )
    
    // Should not have been modified
    const configCount = (files['.npmrc'].match(/GitHub Packages Authentication/g) || []).length
    expect(configCount).toBe(1)
  })

  it('should handle file system errors gracefully', async () => {
    process.env.GITHUB_TOKEN = 'test_token'
    
    // Mock append to fail
    mockContext.fs.appendFile.mockResolvedValue({
      isErr: () => true,
      error: { message: 'Permission denied' }
    })
    
    const result = await npmAuthCommand.action({}, mockContext)
    
    expect(result.isErr()).toBe(true)
    expect(result.error.code).toBe('NPMRC_WRITE_FAILED')
    expect(result.error.suggestion).toContain('Check file permissions')
  })
})