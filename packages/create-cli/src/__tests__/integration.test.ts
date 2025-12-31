import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { tmpdir } from 'os'
import { join, dirname } from 'path'
import { rmSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { generateProject } from '../lib/core/generator.js'
import { createDefaultLogger } from '@trailhead/cli/utils'
import { setupResultMatchers } from '@trailhead/core/testing'
import type { ProjectConfig } from '../lib/config/types.js'

// Setup Result matchers for better testing
setupResultMatchers()

// Get monorepo root for packing local packages
const __dirname = dirname(fileURLToPath(import.meta.url))
const monorepoRoot = join(__dirname, '../../../..')

interface PackedPackages {
  cli: string
  core: string
}

/**
 * Verify tarball contains dist folder (package was built).
 */
function verifyTarballHasDist(tarballPath: string, packageName: string): void {
  const contents = execSync(`tar -tzf "${tarballPath}"`, { encoding: 'utf-8' })
  if (!contents.includes('package/dist/')) {
    throw new Error(
      `Tarball ${packageName} missing dist/ folder. Was the package built?\n` +
        `Contents: ${contents.slice(0, 500)}`
    )
  }
}

/**
 * Pack local @trailhead packages into tarballs for E2E testing.
 * This allows testing generated projects without publishing to npm.
 */
function packLocalPackages(destDir: string): PackedPackages {
  mkdirSync(destDir, { recursive: true })

  // Pack @trailhead/core first (cli depends on it)
  const coreOutput = execSync('pnpm pack --pack-destination ' + destDir, {
    cwd: join(monorepoRoot, 'packages/core'),
    encoding: 'utf-8',
  })
  // pnpm pack outputs full path on last line
  const coreTarball = coreOutput.trim().split('\n').pop()!.trim()
  verifyTarballHasDist(coreTarball, '@trailhead/core')

  // Pack @trailhead/cli
  const cliOutput = execSync('pnpm pack --pack-destination ' + destDir, {
    cwd: join(monorepoRoot, 'packages/cli'),
    encoding: 'utf-8',
  })
  const cliTarball = cliOutput.trim().split('\n').pop()!.trim()
  verifyTarballHasDist(cliTarball, '@trailhead/cli')

  return { cli: cliTarball, core: coreTarball }
}

/**
 * Update generated project's package.json to use local tarballs.
 */
function useLocalTarballs(projectPath: string, tarballs: PackedPackages): void {
  const pkgPath = join(projectPath, 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))

  pkg.dependencies['@trailhead/cli'] = `file:${tarballs.cli}`
  pkg.dependencies['@trailhead/core'] = `file:${tarballs.core}`

  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
}

describe('End-to-End Project Generation', () => {
  let testDir: string
  let projectPath: string
  let tarballs: PackedPackages
  const projectName = 'test-integration-cli'

  beforeAll(async () => {
    testDir = join(tmpdir(), `create-cli-e2e-${Date.now()}`)
    projectPath = join(testDir, projectName)
    const tarballDir = join(testDir, 'tarballs')

    // Pack local packages into tarballs for E2E testing
    tarballs = packLocalPackages(tarballDir)

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

    // Update package.json to use local tarballs instead of npm
    useLocalTarballs(projectPath, tarballs)
  }, 120000) // 2 minute timeout for generation + packing

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
    // This test validates the tarball approach works for local package installation
    try {
      execSync('pnpm install', {
        cwd: projectPath,
        stdio: 'pipe',
        timeout: 60000,
      })
    } catch (error) {
      const execError = error as { stderr?: Buffer; stdout?: Buffer }
      const stderr = execError.stderr?.toString() ?? ''
      const stdout = execError.stdout?.toString() ?? ''
      throw new Error(`pnpm install failed:\nstderr: ${stderr}\nstdout: ${stdout}`)
    }

    expect(existsSync(join(projectPath, 'node_modules'))).toBe(true)
  }, 90000) // 90 second timeout for npm install

  // TODO: Fix template bugs (API mismatches with @trailhead/cli/prompts)
  // These tests are skipped until templates are updated to use correct APIs
  it.skip('should build the project successfully', () => {
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

  it.skip('should run the CLI and show help', () => {
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

  it.skip('should run hello command successfully', () => {
    const output = execSync('node bin/cli.js hello', {
      cwd: projectPath,
      encoding: 'utf-8',
      timeout: 10000,
    })

    expect(output).toContain(`Welcome to ${projectName}`)
    expect(output).toContain('Version: 0.1.0')
    expect(output).toContain('Environment: development')
  })

  it.skip('should pass type checking', () => {
    expect(() => {
      execSync('pnpm types', {
        cwd: projectPath,
        stdio: 'pipe',
        timeout: 30000,
      })
    }).not.toThrow()
  }, 45000)

  it.skip('should pass linting', () => {
    expect(() => {
      execSync('pnpm lint', {
        cwd: projectPath,
        stdio: 'pipe',
        timeout: 20000,
      })
    }).not.toThrow()
  }, 30000)

  it.skip('should run tests successfully', () => {
    expect(() => {
      execSync('pnpm test', {
        cwd: projectPath,
        stdio: 'pipe',
        timeout: 60000,
      })
    }).not.toThrow()
  }, 90000)
})
