import { ok, err, fromThrowable } from '@esteban-url/core'
import { execSync } from 'node:child_process'
import { existsSync, rmSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { platform } from 'node:os'
import type {
  GitRepository,
  GitResult,
  TypeScriptCacheInfo,
  ValidationResult,
  IntegrityResult,
} from '../types.js'
import { createGitErrors } from '../errors.js'

// ========================================
// Git Validation Operations
// ========================================

export interface GitValidationOperations {
  readonly clearTypeScriptCache: (repo: GitRepository) => Promise<GitResult<TypeScriptCacheInfo>>
  readonly validateTypeScriptState: (repo: GitRepository) => Promise<GitResult<boolean>>
  readonly runValidationCommand: (
    repo: GitRepository,
    command: string
  ) => Promise<GitResult<ValidationResult>>
  readonly validateCommitIntegrity: (repo: GitRepository) => Promise<GitResult<IntegrityResult>>
}

export const createGitValidationOperations = (): GitValidationOperations => {
  const clearTypeScriptCache = async (
    repo: GitRepository
  ): Promise<GitResult<TypeScriptCacheInfo>> => {
    const buildInfoFiles: string[] = []
    const warnings: string[] = []
    let cleared = true

    // Common TypeScript cache file patterns
    const cachePatterns = [
      'tsconfig.tsbuildinfo',
      '.tsbuildinfo',
      'dist/tsconfig.tsbuildinfo',
      'build/tsconfig.tsbuildinfo',
      'out/tsconfig.tsbuildinfo',
    ]

    // Find all .tsbuildinfo files (cross-platform)
    const findTsBuildInfo = (dir: string, basePath: string = ''): string[] => {
      const results: string[] = []

      try {
        const entries = readdirSync(dir, { withFileTypes: true })

        for (const entry of entries) {
          const fullPath = join(dir, entry.name)
          const relativePath = join(basePath, entry.name)

          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            results.push(...findTsBuildInfo(fullPath, relativePath))
          } else if (entry.isFile() && entry.name.endsWith('.tsbuildinfo')) {
            results.push(`./${relativePath}`)
          }
        }
      } catch (error) {
        warnings.push(`Error scanning directory ${dir}: ${error}`)
      }

      return results
    }

    buildInfoFiles.push(...findTsBuildInfo(repo.workingDirectory))

    // Also check common locations
    for (const pattern of cachePatterns) {
      const fullPath = join(repo.workingDirectory, pattern)
      if (existsSync(fullPath) && !buildInfoFiles.includes(`./${pattern}`)) {
        buildInfoFiles.push(`./${pattern}`)
      }
    }

    // Clear each cache file
    for (const file of buildInfoFiles) {
      try {
        const fullPath = join(repo.workingDirectory, file)
        rmSync(fullPath, { force: true })
      } catch (error) {
        cleared = false
        warnings.push(`Failed to remove ${file}: ${error}`)
      }
    }

    const info: TypeScriptCacheInfo = {
      buildInfoFiles,
      cleared,
      warnings,
    }

    if (!cleared && warnings.length > 0) {
      return err(createGitErrors.typeScriptCacheClearFailed(new Error(warnings.join('; '))))
    }

    return ok(info)
  }

  const validateTypeScriptState = async (repo: GitRepository): Promise<GitResult<boolean>> => {
    // Check if TypeScript is configured
    const tsconfigPath = join(repo.workingDirectory, 'tsconfig.json')
    if (!existsSync(tsconfigPath)) {
      return ok(true) // No TypeScript, so state is valid
    }

    // Run TypeScript compiler in check mode
    const npmCmd = platform() === 'win32' ? 'npx.cmd' : 'npx'
    const tscResult = fromThrowable(() =>
      execSync(`${npmCmd} tsc --noEmit`, {
        cwd: repo.workingDirectory,
        encoding: 'utf8',
      })
    )()

    if (tscResult.isErr()) {
      // Check if it's just type errors or actual configuration issues
      const errorString = tscResult.error?.toString() || ''
      if (errorString.includes('error TS')) {
        // Type errors exist but TypeScript state is valid
        return ok(false)
      }
      // Configuration or other issues
      return err(createGitErrors.validationFailed('tsc --noEmit', 1))
    }

    return ok(true)
  }

  const runValidationCommand = async (
    repo: GitRepository,
    command: string
  ): Promise<GitResult<ValidationResult>> => {
    const startTime = Date.now()

    const safeExec = fromThrowable(() =>
      execSync(command, {
        cwd: repo.workingDirectory,
        encoding: 'utf8',
        stdio: 'pipe',
      })
    )

    const result = safeExec()
    const duration = Date.now() - startTime

    if (result.isErr()) {
      // Extract exit code from error
      const errorString = result.error?.toString() || ''
      const exitCodeMatch = errorString.match(/exit code (\d+)/)
      const exitCode = exitCodeMatch ? parseInt(exitCodeMatch[1], 10) : 1

      const validationResult: ValidationResult = {
        command,
        exitCode,
        output: errorString,
        passed: false,
        duration,
      }

      return ok(validationResult)
    }

    const validationResult: ValidationResult = {
      command,
      exitCode: 0,
      output: result.value,
      passed: true,
      duration,
    }

    return ok(validationResult)
  }

  const validateCommitIntegrity = async (
    repo: GitRepository
  ): Promise<GitResult<IntegrityResult>> => {
    const errors: string[] = []
    let typesValid = true
    let lintPassed = true
    let testsPassed: boolean | undefined
    const npmCmd = platform() === 'win32' ? 'npx.cmd' : 'npx'

    // Run TypeScript validation
    const tsResult = await runValidationCommand(repo, `${npmCmd} tsc --noEmit`)
    if (tsResult.isOk() && !tsResult.value.passed) {
      typesValid = false
      errors.push('TypeScript compilation failed')
    }

    // Run linting (try common linters)
    const linters = [
      'npm run lint',
      'pnpm lint',
      'yarn lint',
      `${npmCmd} eslint .`,
      `${npmCmd} oxlint`,
    ]

    let lintRun = false
    for (const linter of linters) {
      const checkResult = fromThrowable(() =>
        execSync(`${linter} --version`, {
          cwd: repo.workingDirectory,
          encoding: 'utf8',
        })
      )()

      if (checkResult.isOk()) {
        const lintResult = await runValidationCommand(repo, linter)
        lintRun = true
        if (lintResult.isOk() && !lintResult.value.passed) {
          lintPassed = false
          errors.push(`Linting failed with ${linter}`)
        }
        break
      }
    }

    if (!lintRun) {
      errors.push('No linter found')
    }

    // Check if tests exist and run them
    const testCommands = [
      'npm test',
      'pnpm test',
      'yarn test',
      `${npmCmd} jest`,
      `${npmCmd} vitest run`,
    ]

    for (const testCommand of testCommands) {
      const checkResult = fromThrowable(() =>
        execSync(`${testCommand} --version`, {
          cwd: repo.workingDirectory,
          encoding: 'utf8',
        })
      )()

      if (checkResult.isOk()) {
        const testResult = await runValidationCommand(repo, testCommand)
        testsPassed = testResult.isOk() && testResult.value.passed
        if (!testsPassed) {
          errors.push(`Tests failed with ${testCommand}`)
        }
        break
      }
    }

    const integrityResult: IntegrityResult = {
      typesValid,
      lintPassed,
      testsPassed,
      isValid: typesValid && lintPassed && (testsPassed === undefined || testsPassed),
      errors,
    }

    if (!integrityResult.isValid) {
      return err(createGitErrors.commitIntegrityFailed(errors))
    }

    return ok(integrityResult)
  }

  return {
    clearTypeScriptCache,
    validateTypeScriptState,
    runValidationCommand,
    validateCommitIntegrity,
  }
}
