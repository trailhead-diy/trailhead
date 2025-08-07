import { createCommand, type CommandOptions } from '@esteban-url/cli/command'
import { ok, err, createCoreError, type Result, type CoreError } from '@esteban-url/core'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { colorize, withIcon } from '../../utils/colors.js'

interface ValidateInterdepsOptions extends CommandOptions {
  readonly fix?: boolean
  readonly graph?: boolean
}

interface PackageInfo {
  readonly path: string
  readonly package: {
    readonly name?: string
    readonly dependencies?: Record<string, string>
    readonly devDependencies?: Record<string, string>
    readonly peerDependencies?: Record<string, string>
  }
}

interface Violation {
  readonly package: string
  readonly dependency: string
  readonly version?: string
  readonly rule: string
}

/**
 * Read and parse package.json files
 */
function getPackageJson(packagePath: string): any {
  try {
    const content = readFileSync(join(packagePath, 'package.json'), 'utf8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

/**
 * Get all package.json files in the monorepo
 */
function getAllPackages(): PackageInfo[] {
  const packages: PackageInfo[] = []
  const repoRoot = process.cwd()
  const dirs = ['packages', 'tooling', 'apps']

  for (const dir of dirs) {
    const dirPath = join(repoRoot, dir)
    try {
      const entries = readdirSync(dirPath)
      for (const entry of entries) {
        const entryPath = join(dirPath, entry)
        if (statSync(entryPath).isDirectory()) {
          const pkg = getPackageJson(entryPath)
          if (pkg) {
            packages.push({ path: entryPath, package: pkg })
          }
        }
      }
    } catch {
      // Directory doesn't exist, skip
    }
  }

  // Also check apps/demos subdirectories
  try {
    const demosPath = join(repoRoot, 'apps', 'demos')
    const demoEntries = readdirSync(demosPath)
    for (const entry of demoEntries) {
      const entryPath = join(demosPath, entry)
      if (statSync(entryPath).isDirectory()) {
        const pkg = getPackageJson(entryPath)
        if (pkg) {
          packages.push({ path: entryPath, package: pkg })
        }
      }
    }
  } catch {
    // demos directory doesn't exist, skip
  }

  return packages
}

/**
 * Validate that @repo/* packages don't depend on @esteban-url/* packages
 */
function validateRepoPackageDependencies(packages: readonly PackageInfo[]): readonly Violation[] {
  const violations: Violation[] = []

  for (const { package: pkg } of packages) {
    if (!pkg.name?.startsWith('@repo/')) continue

    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.peerDependencies,
    }

    for (const depName of Object.keys(allDeps)) {
      if (depName.startsWith('@esteban-url/')) {
        violations.push({
          package: pkg.name,
          dependency: depName,
          rule: '@repo/* packages should not depend on @esteban-url/* packages',
        })
      }
    }
  }

  return violations
}

/**
 * Validate workspace protocol usage
 */
function validateWorkspaceProtocol(packages: readonly PackageInfo[]): readonly Violation[] {
  const violations: Violation[] = []
  const internalPackages = new Set(packages.map((p) => p.package.name).filter(Boolean))

  for (const { package: pkg } of packages) {
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    }

    for (const [depName, depVersion] of Object.entries(allDeps)) {
      // Only check dependencies that are actually internal packages
      if (
        internalPackages.has(depName) &&
        !depVersion.startsWith('workspace:') &&
        (depName.startsWith('@esteban-url/') || depName.startsWith('@repo/'))
      ) {
        violations.push({
          package: pkg.name || 'unknown',
          dependency: depName,
          version: depVersion,
          rule: 'Internal dependencies must use workspace: protocol',
        })
      }
    }
  }

  return violations
}

/**
 * Validate that public packages don't import internal tooling
 */
function validatePublicPackageBoundaries(packages: readonly PackageInfo[]): readonly Violation[] {
  const violations: Violation[] = []

  for (const { package: pkg } of packages) {
    if (!pkg.name?.startsWith('@esteban-url/')) continue

    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    }

    for (const depName of Object.keys(allDeps)) {
      if (depName.startsWith('@repo/') && !depName.includes('config')) {
        violations.push({
          package: pkg.name,
          dependency: depName,
          rule: 'Public packages should only use @repo/*-config tooling',
        })
      }
    }
  }

  return violations
}

/**
 * Simple circular dependency detection for internal packages only
 */
function detectCircularDependencies(packages: readonly PackageInfo[]): readonly Violation[] {
  const violations: Violation[] = []
  const internalPackageMap = new Map(
    packages
      .filter(
        (p) => p.package.name?.startsWith('@esteban-url/') || p.package.name?.startsWith('@repo/')
      )
      .map((p) => [p.package.name!, p])
  )

  function hasCircularDep(
    pkgName: string,
    targetName: string,
    visited = new Set<string>()
  ): boolean {
    if (visited.has(pkgName)) return pkgName === targetName
    if (pkgName === targetName) return true

    visited.add(pkgName)
    const pkg = internalPackageMap.get(pkgName)
    if (!pkg) return false

    const allDeps = {
      ...pkg.package.dependencies,
      ...pkg.package.devDependencies,
    }

    for (const depName of Object.keys(allDeps)) {
      if (
        internalPackageMap.has(depName) &&
        hasCircularDep(depName, targetName, new Set(visited))
      ) {
        return true
      }
    }

    return false
  }

  for (const { package: pkg } of packages) {
    // Only check internal packages
    if (!pkg.name?.startsWith('@esteban-url/') && !pkg.name?.startsWith('@repo/')) continue

    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    }

    for (const depName of Object.keys(allDeps)) {
      if (internalPackageMap.has(depName) && hasCircularDep(depName, pkg.name!)) {
        violations.push({
          package: pkg.name!,
          dependency: depName,
          rule: 'Circular dependency detected',
        })
      }
    }
  }

  return violations
}

export const validateInterdepsCommand = createCommand<ValidateInterdepsOptions>({
  name: 'validate-interdeps',
  description: 'Validate package boundaries and dependency rules in monorepo',
  options: [
    {
      flags: '--fix',
      description: 'Attempt to fix validation issues automatically',
      type: 'boolean',
      default: false,
    },
    {
      flags: '--graph',
      description: 'Show dependency graph information',
      type: 'boolean',
      default: false,
    },
  ],
  examples: ['validate-interdeps', 'validate-interdeps --fix', 'validate-interdeps --graph'],
  action: async (options, context): Promise<Result<void, CoreError>> => {
    context.logger.info(colorize('blue', withIcon('search', 'Validating package dependencies...')))

    try {
      const packages = getAllPackages()
      context.logger.info(`Found ${packages.length} packages\n`)

      const validators = [
        { name: 'Repo Package Dependencies', fn: validateRepoPackageDependencies },
        { name: 'Workspace Protocol Usage', fn: validateWorkspaceProtocol },
        { name: 'Public Package Boundaries', fn: validatePublicPackageBoundaries },
        { name: 'Circular Dependencies', fn: detectCircularDependencies },
      ]

      let totalViolations = 0

      for (const { name, fn } of validators) {
        const violations = fn(packages)

        if (violations.length === 0) {
          context.logger.info(colorize('green', `✅ ${name}: All good`))
        } else {
          context.logger.info(colorize('red', `❌ ${name}: ${violations.length} violation(s)`))
          for (const violation of violations) {
            context.logger.info(
              colorize('yellow', `   • ${violation.package} → ${violation.dependency}`)
            )
            context.logger.info(`     Rule: ${violation.rule}`)
            if (violation.version) {
              context.logger.info(`     Version: ${violation.version}`)
            }
          }
          totalViolations += violations.length
        }
        context.logger.info('')
      }

      if (options.graph) {
        context.logger.info('📊 Dependency Graph Information:')
        const internalPackages = packages.filter(
          (p) => p.package.name?.startsWith('@esteban-url/') || p.package.name?.startsWith('@repo/')
        )

        for (const { package: pkg } of internalPackages) {
          const deps = Object.keys({
            ...pkg.dependencies,
            ...pkg.devDependencies,
          }).filter((dep) => dep.startsWith('@esteban-url/') || dep.startsWith('@repo/'))

          if (deps.length > 0) {
            context.logger.info(`${pkg.name} → ${deps.join(', ')}`)
          }
        }
      }

      if (totalViolations === 0) {
        context.logger.info(colorize('green', '🎉 All dependency validation checks passed!'))
        return ok(undefined)
      } else {
        context.logger.info(colorize('red', `💥 Found ${totalViolations} dependency violations`))

        if (options.fix) {
          context.logger.info(colorize('yellow', '⚠️  Auto-fix functionality not yet implemented'))
          context.logger.info('Please resolve violations manually for now')
        }

        return err(
          createCoreError(
            'DEPENDENCY_VIOLATIONS',
            `Found ${totalViolations} dependency violations`,
            `${totalViolations} violations found`
          )
        )
      }
    } catch (error) {
      return err(
        createCoreError(
          'VALIDATION_ERROR',
          'Failed to validate dependencies',
          error instanceof Error ? error.message : String(error)
        )
      )
    }
  },
})
