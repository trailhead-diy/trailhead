#!/usr/bin/env node

/**
 * Package Interdependency Validation Script
 *
 * Validates package boundaries and dependency rules:
 * - @repo/* packages should not depend on @esteban-url/* packages
 * - Public packages should not import internal tooling
 * - Ensures proper workspace protocol usage
 * - Checks for circular dependencies
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import chalk from 'chalk'

const REPO_ROOT = process.cwd()

/**
 * Reads and parses package.json files
 */
function getPackageJson(packagePath) {
  try {
    const content = readFileSync(path.join(packagePath, 'package.json'), 'utf8')
    return JSON.parse(content)
  } catch (error) {
    return null
  }
}

/**
 * Gets all package.json files in the monorepo
 */
function getAllPackages() {
  const packages = []
  const dirs = ['packages', 'tooling', 'apps']

  for (const dir of dirs) {
    const dirPath = path.join(REPO_ROOT, dir)
    try {
      const entries = readdirSync(dirPath)
      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry)
        if (statSync(entryPath).isDirectory()) {
          const pkg = getPackageJson(entryPath)
          if (pkg) {
            packages.push({ path: entryPath, package: pkg })
          }
        }
      }
    } catch (error) {
      // Directory doesn't exist, skip
    }
  }

  // Also check apps/demos subdirectories
  try {
    const demosPath = path.join(REPO_ROOT, 'apps', 'demos')
    const demoEntries = readdirSync(demosPath)
    for (const entry of demoEntries) {
      const entryPath = path.join(demosPath, entry)
      if (statSync(entryPath).isDirectory()) {
        const pkg = getPackageJson(entryPath)
        if (pkg) {
          packages.push({ path: entryPath, package: pkg })
        }
      }
    }
  } catch (error) {
    // demos directory doesn't exist, skip
  }

  return packages
}

/**
 * Validates that @repo/* packages don't depend on @esteban-url/* packages
 */
function validateRepoPackageDependencies(packages) {
  const violations = []

  for (const { path: pkgPath, package: pkg } of packages) {
    if (!pkg.name?.startsWith('@repo/')) continue

    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.peerDependencies,
    }

    for (const [depName] of Object.entries(allDeps)) {
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
 * Validates workspace protocol usage
 */
function validateWorkspaceProtocol(packages) {
  const violations = []
  const internalPackages = new Set(packages.map((p) => p.package.name))

  for (const { path: pkgPath, package: pkg } of packages) {
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    }

    for (const [depName, depVersion] of Object.entries(allDeps)) {
      // Only check dependencies that are actually internal packages
      // Exclude external packages with same names
      if (
        internalPackages.has(depName) &&
        !depVersion.startsWith('workspace:') &&
        (depName.startsWith('@esteban-url/') || depName.startsWith('@repo/'))
      ) {
        violations.push({
          package: pkg.name,
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
 * Validates that public packages don't import internal tooling
 */
function validatePublicPackageBoundaries(packages) {
  const violations = []

  for (const { path: pkgPath, package: pkg } of packages) {
    if (!pkg.name?.startsWith('@esteban-url/')) continue

    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    }

    for (const [depName] of Object.entries(allDeps)) {
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
function detectCircularDependencies(packages) {
  const violations = []
  const internalPackageMap = new Map(
    packages
      .filter(
        (p) => p.package.name?.startsWith('@esteban-url/') || p.package.name?.startsWith('@repo/')
      )
      .map((p) => [p.package.name, p])
  )

  function hasCircularDep(pkgName, targetName, visited = new Set()) {
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
      if (internalPackageMap.has(depName) && hasCircularDep(depName, pkg.name)) {
        violations.push({
          package: pkg.name,
          dependency: depName,
          rule: 'Circular dependency detected',
        })
      }
    }
  }

  return violations
}

/**
 * Main validation function
 */
function validateDependencies() {
  console.log(chalk.blue('🔍 Validating package dependencies...\n'))

  const packages = getAllPackages()
  console.log(chalk.gray(`Found ${packages.length} packages\n`))

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
      console.log(chalk.green(`✅ ${name}: All good`))
    } else {
      console.log(chalk.red(`❌ ${name}: ${violations.length} violation(s)`))
      for (const violation of violations) {
        console.log(chalk.yellow(`   • ${violation.package} → ${violation.dependency}`))
        console.log(chalk.gray(`     Rule: ${violation.rule}`))
        if (violation.version) {
          console.log(chalk.gray(`     Version: ${violation.version}`))
        }
      }
      totalViolations += violations.length
    }
    console.log()
  }

  if (totalViolations === 0) {
    console.log(chalk.green('🎉 All dependency validation checks passed!'))
    process.exit(0)
  } else {
    console.log(chalk.red(`💥 Found ${totalViolations} dependency violations`))
    process.exit(1)
  }
}

// Run validation
validateDependencies()
