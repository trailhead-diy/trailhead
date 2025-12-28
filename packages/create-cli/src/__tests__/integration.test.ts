import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { tmpdir } from 'os'
import { join } from 'path'
import { rmSync, existsSync, readFileSync } from 'fs'
import { execSync } from 'child_process'
import { generateProject } from '../lib/core/generator.js'
import { createDefaultLogger } from '@trailhead/cli/utils'
import { setupResultMatchers } from '@trailhead/core/testing'
import type { ProjectConfig } from '../lib/config/types.js'

// Setup Result matchers for better testing
setupResultMatchers()

describe('End-to-End Project Generation', () => {
  let testDir: string
  let projectPath: string
  const projectName = 'test-integration-cli'

  beforeAll(async () => {
    testDir = join(tmpdir(), `create-cli-e2e-${Date.now()}`)
    projectPath = join(testDir, projectName)

    const config: ProjectConfig = {
      projectName,
      projectPath,
      description: 'Integration test CLI',
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
      ide: 'vscode',
      includeDocs: false,
      force: false,
      dryRun: false, // Actually generate files
      verbose: false,
    }

    const logger = createDefaultLogger(false)
    const result = await generateProject(config, { logger, verbose: false })

    expect(result).toBeOk()
  }, 120000) // 2 minute timeout for generation

  afterAll(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  it('should generate all required files', () => {
    const requiredFiles = [
      'package.json',
      'tsconfig.json',
      'bin/cli.js',
      'src/index.ts',
      'src/commands/hello.ts',
      'src/commands/config.ts',
      'src/lib/config-schema.ts',
      'src/lib/config.ts',
      'config.json',
      '.gitignore',
    ]

    for (const file of requiredFiles) {
      const filePath = join(projectPath, file)
      expect(existsSync(filePath), `${file} should exist`).toBe(true)
    }
  })

  it('should generate valid package.json with correct dependencies', () => {
    const packageJsonPath = join(projectPath, 'package.json')
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))

    expect(packageJson.name).toBe(projectName)
    expect(packageJson.version).toBe('0.1.0')
    expect(packageJson.dependencies).toHaveProperty('@trailhead/cli')
    expect(packageJson.dependencies).toHaveProperty('@trailhead/core')
    expect(packageJson.dependencies).toHaveProperty('zod')
    expect(packageJson.tsup).toBeDefined()
    expect(packageJson.tsup.entry).toEqual(['src/index.ts'])
  })

  it('should generate valid config.json', () => {
    const configPath = join(projectPath, 'config.json')
    const config = JSON.parse(readFileSync(configPath, 'utf-8'))

    expect(config.name).toBe(projectName)
    expect(config.version).toBe('0.1.0')
    expect(config.environment).toBe('development')
    expect(config.theme).toHaveProperty('color')
    expect(config.settings).toHaveProperty('debug')
    expect(config.settings).toHaveProperty('verbose')
  })

  it('should install dependencies successfully', () => {
    expect(() => {
      execSync('pnpm install', {
        cwd: projectPath,
        stdio: 'pipe',
        timeout: 60000,
      })
    }).not.toThrow()

    expect(existsSync(join(projectPath, 'node_modules'))).toBe(true)
  }, 90000) // 90 second timeout for npm install

  it('should build the project successfully', () => {
    expect(() => {
      execSync('pnpm build', {
        cwd: projectPath,
        stdio: 'pipe',
        timeout: 30000,
      })
    }).not.toThrow()

    expect(existsSync(join(projectPath, 'dist/index.js'))).toBe(true)
    expect(existsSync(join(projectPath, 'dist/index.d.ts'))).toBe(true)
  }, 45000) // 45 second timeout for build

  it('should run the CLI and show help', () => {
    const output = execSync('node bin/cli.js --help', {
      cwd: projectPath,
      encoding: 'utf-8',
      timeout: 10000,
    })

    expect(output).toContain(projectName)
    expect(output).toContain('Integration test CLI')
    expect(output).toContain('hello')
    expect(output).toContain('config')
  })

  it('should run hello command successfully', () => {
    const output = execSync('node bin/cli.js hello', {
      cwd: projectPath,
      encoding: 'utf-8',
      timeout: 10000,
    })

    expect(output).toContain(`Welcome to ${projectName}`)
    expect(output).toContain('Version: 0.1.0')
    expect(output).toContain('Environment: development')
  })

  it('should pass type checking', () => {
    expect(() => {
      execSync('pnpm types', {
        cwd: projectPath,
        stdio: 'pipe',
        timeout: 30000,
      })
    }).not.toThrow()
  }, 45000)

  it('should pass linting', () => {
    expect(() => {
      execSync('pnpm lint', {
        cwd: projectPath,
        stdio: 'pipe',
        timeout: 20000,
      })
    }).not.toThrow()
  }, 30000)

  it('should run tests successfully', () => {
    expect(() => {
      execSync('pnpm test', {
        cwd: projectPath,
        stdio: 'pipe',
        timeout: 60000,
      })
    }).not.toThrow()
  }, 90000)
})
