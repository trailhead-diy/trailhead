import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { tmpdir } from 'os'
import { join } from 'path'
import { rmSync, existsSync } from 'fs'
import { generateProject } from '../lib/core/generator.js'
import { createDefaultLogger } from '@esteban-url/cli/utils'
import { expectSuccess, expectError } from '@esteban-url/cli/testing'
import { setupResultMatchers } from '@esteban-url/core/testing'
import type { ProjectConfig } from '../lib/config/types.js'

// Setup Result matchers for better testing
setupResultMatchers()

describe('Generator Integration', () => {
  let testDir: string
  let logger: any

  beforeEach(() => {
    testDir = join(tmpdir(), `create-trailhead-cli-test-${Date.now()}`)
    logger = createDefaultLogger(false)
  })

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  it('should generate a basic project successfully', async () => {
    const config: ProjectConfig = {
      projectName: 'test-cli',
      projectPath: join(testDir, 'test-cli'),
      description: 'A test CLI application',
      projectType: 'standalone-cli',
      packageManager: 'pnpm',
      author: {
        name: 'Test Author',
        email: 'test@example.com',
      },
      license: 'MIT',
      features: {
        core: true,
        config: true,
        testing: true,
      },
      nodeVersion: '18',
      typescript: true,
      ide: 'none',
      includeDocs: false,
      force: false,
      dryRun: true, // Use dry run for test
      verbose: false,
    }

    const result = await generateProject(config, { logger, verbose: false })

    expectSuccess(result)
    expect(result).toBeOk()
  })

  it('should generate an advanced project successfully', async () => {
    const config: ProjectConfig = {
      projectName: 'advanced-cli',
      projectPath: join(testDir, 'advanced-cli'),
      description: 'An advanced test CLI application',
      projectType: 'standalone-cli',
      packageManager: 'npm',
      author: {
        name: 'Test Author',
        email: 'test@example.com',
      },
      license: 'MIT',
      features: {
        core: true,
        config: true,
        testing: true,
      },
      nodeVersion: '18',
      typescript: true,
      ide: 'none',
      includeDocs: true,
      force: false,
      dryRun: true, // Use dry run for test
      verbose: false,
    }

    const result = await generateProject(config, { logger, verbose: false })

    expectSuccess(result)
    expect(result).toBeOk()
  })

  it('should validate project configuration', async () => {
    const config: ProjectConfig = {
      projectName: '', // Invalid empty name
      projectPath: '',
      description: 'Test description',
      projectType: 'standalone-cli',
      packageManager: 'pnpm',
      author: {
        name: 'Test Author',
        email: 'test@example.com',
      },
      license: 'MIT',
      features: {
        core: true,
      },
      nodeVersion: '18',
      typescript: true,
      ide: 'none',
      includeDocs: false,
      force: false,
      dryRun: true,
      verbose: false,
    }

    const result = await generateProject(config, { logger, verbose: false })

    expectError(result)
    expect(result).toBeErr()
  })
})
