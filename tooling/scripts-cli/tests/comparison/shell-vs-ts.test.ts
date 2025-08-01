import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, unlink, mkdir, rmdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const execAsync = promisify(exec)

describe('Shell vs TypeScript parity tests', () => {
  const testDir = path.join(process.cwd(), 'temp-test-dir')
  const originalCwd = process.cwd()
  let originalEnv: any

  beforeEach(async () => {
    originalEnv = { ...process.env }
    
    // Create temporary test directory
    if (!existsSync(testDir)) {
      await mkdir(testDir, { recursive: true })
    }
    process.chdir(testDir)
    
    // Setup basic project structure
    await writeFile('package.json', JSON.stringify({
      name: 'test-project',
      version: '1.0.0',
      scripts: {
        test: 'echo "test"'
      }
    }, null, 2))
    
    await writeFile('pnpm-lock.yaml', '')
  })

  afterEach(async () => {
    process.env = originalEnv
    process.chdir(originalCwd)
    
    // Cleanup test directory
    if (existsSync(testDir)) {
      await rmdir(testDir, { recursive: true })
    }
  })

  describe('npm-auth command parity', () => {
    it('should produce equivalent output for basic authentication', async () => {
      process.env.GITHUB_TOKEN = 'test_token_123'
      
      // Run shell script
      const shellResult = await execAsync(`${originalCwd}/scripts/setup-npm-auth.sh`, {
        cwd: testDir,
        env: process.env
      }).catch(e => ({ stdout: '', stderr: e.message, code: e.code }))
      
      // Run TypeScript command
      const tsResult = await execAsync(`pnpm --dir ${originalCwd}/tooling/scripts-cli scripts-cli npm-auth`, {
        cwd: testDir,
        env: process.env
      }).catch(e => ({ stdout: '', stderr: e.message, code: e.code }))
      
      // Both should succeed
      expect(shellResult.code).toBeUndefined()
      expect(tsResult.code).toBeUndefined()
      
      // Both should mention GitHub Packages
      expect(shellResult.stdout).toContain('GitHub Packages')
      expect(tsResult.stdout).toContain('GitHub Packages')
    })

    it('should handle missing token consistently', async () => {
      delete process.env.GITHUB_TOKEN
      
      const shellResult = await execAsync(`${originalCwd}/scripts/setup-npm-auth.sh`, {
        cwd: testDir,
        env: process.env
      }).catch(e => ({ stdout: e.stdout || '', stderr: e.stderr || '', code: e.code }))
      
      const tsResult = await execAsync(`pnpm --dir ${originalCwd}/tooling/scripts-cli scripts-cli npm-auth`, {
        cwd: testDir,
        env: process.env
      }).catch(e => ({ stdout: e.stdout || '', stderr: e.stderr || '', code: e.code }))
      
      // Both should handle missing token gracefully
      expect(shellResult.code || 0).toBe(0)
      expect(tsResult.code || 0).toBe(0)
      
      // Both should mention missing token
      expect(shellResult.stdout).toContain('GITHUB_TOKEN not set')
      expect(tsResult.stdout).toContain('GITHUB_TOKEN not set')
    })
  })

  describe('test-runner command parity', () => {
    beforeEach(async () => {
      // Create git repository for staged files
      await execAsync('git init', { cwd: testDir })
      await execAsync('git config user.email "test@example.com"', { cwd: testDir })
      await execAsync('git config user.name "Test User"', { cwd: testDir })
      
      // Add and stage a test file
      await writeFile('test-file.ts', 'console.log("test")')
      await execAsync('git add test-file.ts', { cwd: testDir })
    })

    it('should detect risk levels consistently', async () => {
      // Both should detect high risk for .ts files
      const shellResult = await execAsync(`${originalCwd}/scripts/smart-test-runner.sh --dry-run`, {
        cwd: testDir,
        env: { ...process.env, SKIP_TESTS: '0' }
      }).catch(e => ({ stdout: e.stdout || '', stderr: e.stderr || '', code: e.code }))
      
      const tsResult = await execAsync(`pnpm --dir ${originalCwd}/tooling/scripts-cli scripts-cli test-runner --dry-run`, {
        cwd: testDir,
        env: { ...process.env, SKIP_TESTS: '0' }
      }).catch(e => ({ stdout: e.stdout || '', stderr: e.stderr || '', code: e.code }))
      
      // Both should indicate high risk and run full test suite
      expect(shellResult.stdout).toContain('Code changes detected')
      expect(tsResult.stdout).toContain('Code changes detected')
    })

    it('should handle skip flag consistently', async () => {
      const shellResult = await execAsync(`${originalCwd}/scripts/smart-test-runner.sh --skip`, {
        cwd: testDir
      }).catch(e => ({ stdout: e.stdout || '', stderr: e.stderr || '', code: e.code }))
      
      const tsResult = await execAsync(`pnpm --dir ${originalCwd}/tooling/scripts-cli scripts-cli test-runner --skip`, {
        cwd: testDir
      }).catch(e => ({ stdout: e.stdout || '', stderr: e.stderr || '', code: e.code }))
      
      // Both should skip tests
      expect(shellResult.stdout).toContain('Skipping all tests')
      expect(tsResult.stdout).toContain('Skipping all tests')
    })
  })

  describe('validate-deps command parity', () => {
    beforeEach(async () => {
      // Create monorepo structure
      await mkdir('packages/cli', { recursive: true })
      await writeFile('packages/cli/package.json', JSON.stringify({
        name: '@test/cli',
        dependencies: {
          '@repo/config': 'workspace:*'
        }
      }, null, 2))
      
      await mkdir('tooling/config', { recursive: true })
      await writeFile('tooling/config/package.json', JSON.stringify({
        name: '@repo/config',
        scripts: {
          build: 'echo build'
        }
      }, null, 2))
      
      await writeFile('turbo.json', JSON.stringify({
        tasks: {
          test: {
            dependsOn: ['@repo/vitest-config#build']
          }
        }
      }, null, 2))
    })

    it('should produce similar validation output', async () => {
      const shellResult = await execAsync(`${originalCwd}/scripts/validate-monorepo-deps.sh`, {
        cwd: testDir
      }).catch(e => ({ stdout: e.stdout || '', stderr: e.stderr || '', code: e.code }))
      
      const tsResult = await execAsync(`pnpm --dir ${originalCwd}/tooling/scripts-cli scripts-cli validate-deps`, {
        cwd: testDir
      }).catch(e => ({ stdout: e.stdout || '', stderr: e.stderr || '', code: e.code }))
      
      // Both should validate dependencies
      expect(shellResult.stdout).toContain('Validating')
      expect(tsResult.stdout).toContain('Validating')
      
      // Both should check for @repo packages
      expect(shellResult.stdout).toContain('@repo')
      expect(tsResult.stdout).toContain('@repo')
    })

    it('should handle turbo.json validation consistently', async () => {
      // Create turbo.json without vitest dependency
      await writeFile('turbo.json', JSON.stringify({
        tasks: {
          test: {
            dependsOn: ['build']
          }
        }
      }, null, 2))
      
      // Add vitest config to trigger warning
      await mkdir('packages/cli/src', { recursive: true })
      await writeFile('packages/cli/vitest.config.ts', 'export default {}')
      
      const shellResult = await execAsync(`${originalCwd}/scripts/validate-monorepo-deps.sh`, {
        cwd: testDir
      }).catch(e => ({ stdout: e.stdout || '', stderr: e.stderr || '', code: e.code }))
      
      const tsResult = await execAsync(`pnpm --dir ${originalCwd}/tooling/scripts-cli scripts-cli validate-deps`, {
        cwd: testDir
      }).catch(e => ({ stdout: e.stdout || '', stderr: e.stderr || '', code: e.code }))
      
      // Both should warn about missing vitest-config dependency
      expect(shellResult.stdout).toContain('vitest-config')
      expect(tsResult.stdout).toContain('vitest-config')
    })
  })

  describe('fix-imports command parity', () => {
    beforeEach(async () => {
      await mkdir('src', { recursive: true })
      await writeFile('src/test.ts', `
        import { ok } from '@esteban-url/core'
        import { err } from '@esteban-url/core'
        export const test = { ok, err }
      `)
    })

    it('should produce equivalent results for duplicate import fixing', async () => {
      // Create backup of original file for comparison
      const originalContent = await require('fs/promises').readFile('src/test.ts', 'utf8')
      
      // Run shell script on copy
      await writeFile('src/test-shell.ts', originalContent)
      const shellResult = await execAsync(`${originalCwd}/scripts/fix-duplicate-imports.sh`, {
        cwd: testDir
      }).catch(e => ({ stdout: e.stdout || '', stderr: e.stderr || '', code: e.code }))
      
      // Run TypeScript command on copy
      await writeFile('src/test-ts.ts', originalContent)
      const tsResult = await execAsync(`pnpm --dir ${originalCwd}/tooling/scripts-cli scripts-cli fix-imports --pattern "src/test-ts.ts"`, {
        cwd: testDir
      }).catch(e => ({ stdout: e.stdout || '', stderr: e.stderr || '', code: e.code }))
      
      // Both should succeed
      expect(shellResult.code || 0).toBe(0)
      expect(tsResult.code || 0).toBe(0)
      
      // TypeScript version should report processing files
      expect(tsResult.stdout).toContain('files to analyze')
    })
  })

  describe('performance comparison', () => {
    it('should have comparable execution times', async () => {
      process.env.GITHUB_TOKEN = 'test_token'
      
      // Measure shell script execution time
      const shellStart = Date.now()
      await execAsync(`${originalCwd}/scripts/setup-npm-auth.sh`, {
        cwd: testDir,
        env: process.env
      }).catch(() => {})
      const shellTime = Date.now() - shellStart
      
      // Clean up for TypeScript test
      if (existsSync('.npmrc')) {
        await unlink('.npmrc')
      }
      
      // Measure TypeScript execution time
      const tsStart = Date.now()
      await execAsync(`pnpm --dir ${originalCwd}/tooling/scripts-cli scripts-cli npm-auth`, {
        cwd: testDir,
        env: process.env
      }).catch(() => {})
      const tsTime = Date.now() - tsStart
      
      // TypeScript should be within reasonable performance bounds (5x slower max due to Node.js startup)
      const performanceRatio = tsTime / shellTime
      expect(performanceRatio).toBeLessThan(5)
      
      console.log(`Performance comparison - Shell: ${shellTime}ms, TypeScript: ${tsTime}ms (${performanceRatio.toFixed(2)}x)`)
    })
  })
})