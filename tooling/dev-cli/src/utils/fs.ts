import { execSync } from 'child_process'
import { existsSync, readdirSync, statSync, rmSync } from 'fs'
import { join } from 'path'
import { ok, err, createCoreError, type Result, type CoreError } from '@trailhead/core'

export interface PackageInfo {
  readonly name: string
  readonly path: string
  readonly hasPackageJson: boolean
  readonly hasBuildScript: boolean
}

export interface CleanupResult {
  readonly cleaned: readonly string[]
  readonly skipped: readonly string[]
}

/**
 * File system operations with Result-based error handling
 */
export const fsOperations = {
  /**
   * Clean directories and files matching patterns
   */
  cleanPaths(patterns: readonly string[]): Result<CleanupResult, CoreError> {
    const cleaned: string[] = []
    const skipped: string[] = []

    try {
      for (const pattern of patterns) {
        if (pattern.includes('*')) {
          // Handle glob patterns using find
          try {
            execSync(`find . -path "./${pattern}" -type d -exec rm -rf {} + 2>/dev/null || true`, {
              stdio: 'pipe',
            })
            cleaned.push(pattern)
          } catch {
            skipped.push(pattern)
          }
        } else {
          // Handle direct paths
          if (existsSync(pattern)) {
            try {
              rmSync(pattern, { recursive: true, force: true })
              cleaned.push(pattern)
            } catch {
              skipped.push(pattern)
            }
          } else {
            skipped.push(pattern)
          }
        }
      }

      return ok({ cleaned, skipped })
    } catch (error) {
      return err(
        createCoreError(
          'CLEANUP_ERROR',
          'Failed to clean paths',
          error instanceof Error ? error.message : String(error)
        )
      )
    }
  },

  /**
   * Find all packages in the monorepo
   */
  findPackages(): Result<readonly PackageInfo[], CoreError> {
    try {
      const packages: PackageInfo[] = []
      const dirs = ['packages', 'tooling', 'apps']

      for (const dir of dirs) {
        const dirPath = join(process.cwd(), dir)

        if (!existsSync(dirPath)) continue

        try {
          const entries = readdirSync(dirPath)

          for (const entry of entries) {
            const entryPath = join(dirPath, entry)

            if (statSync(entryPath).isDirectory()) {
              const packageJsonPath = join(entryPath, 'package.json')
              const hasPackageJson = existsSync(packageJsonPath)

              let hasBuildScript = false
              let packageName = entry

              if (hasPackageJson) {
                try {
                  const packageJson = JSON.parse(
                    require('fs').readFileSync(packageJsonPath, 'utf8')
                  )
                  packageName = packageJson.name || entry
                  hasBuildScript = Boolean(packageJson.scripts?.build)
                } catch {
                  // Invalid package.json, use defaults
                }
              }

              packages.push({
                name: packageName,
                path: entryPath,
                hasPackageJson,
                hasBuildScript,
              })
            }
          }
        } catch {
          // Directory access failed, skip
        }
      }

      // Also check apps/demos subdirectories
      try {
        const demosPath = join(process.cwd(), 'apps', 'demos')
        if (existsSync(demosPath)) {
          const demoEntries = readdirSync(demosPath)

          for (const entry of demoEntries) {
            const entryPath = join(demosPath, entry)

            if (statSync(entryPath).isDirectory()) {
              const packageJsonPath = join(entryPath, 'package.json')
              const hasPackageJson = existsSync(packageJsonPath)

              let hasBuildScript = false
              let packageName = entry

              if (hasPackageJson) {
                try {
                  const packageJson = JSON.parse(
                    require('fs').readFileSync(packageJsonPath, 'utf8')
                  )
                  packageName = packageJson.name || entry
                  hasBuildScript = Boolean(packageJson.scripts?.build)
                } catch {
                  // Invalid package.json, use defaults
                }
              }

              packages.push({
                name: packageName,
                path: entryPath,
                hasPackageJson,
                hasBuildScript,
              })
            }
          }
        }
      } catch {
        // demos directory doesn't exist or inaccessible, skip
      }

      return ok(packages)
    } catch (error) {
      return err(
        createCoreError(
          'PACKAGE_DISCOVERY_ERROR',
          'Failed to discover packages',
          error instanceof Error ? error.message : String(error)
        )
      )
    }
  },

  /**
   * Check if path exists
   */
  pathExists(path: string): boolean {
    return existsSync(path)
  },
}
