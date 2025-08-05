import { createCommand, type CommandOptions, type CommandContext } from '@esteban-url/cli/command'
import { ok, err, createCoreError, type Result, type CoreError } from '@esteban-url/core'
import { colorize, withIcon } from '../utils/colors.js'
import fastGlob from 'fast-glob'
const { glob } = fastGlob

interface ValidateDepsOptions extends CommandOptions {
  readonly fix?: boolean
  readonly graph?: boolean
}

type ValidationResult = {
  readonly errors: number
  readonly warnings: number
  readonly issues: readonly string[]
}

type PackageInfo = {
  readonly name: string
  readonly path: string
  readonly hasValidPackageJson: boolean
  readonly hasBuildScript: boolean
}

export const validateDepsCommand = createCommand<ValidateDepsOptions>({
  name: 'validate-deps',
  description: 'Validate monorepo dependencies and check for circular dependencies',
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
  examples: ['validate-deps', 'validate-deps --fix', 'validate-deps --graph --verbose'],
  action: async (options, context): Promise<Result<void, CoreError>> => {
    context.logger.info(colorize('blue', withIcon('search', 'Validating monorepo dependencies...')))

    try {
      // Get all TypeScript/JavaScript files
      const sourceFiles = await findSourceFiles()
      const packageDirs = await findPackageDirectories(context)

      // Run validation checks
      const [repoPackageResult, circularDepResult, turboJsonResult] = await Promise.all([
        validateRepoPackageImports(sourceFiles, packageDirs, context),
        checkCircularDependencies(packageDirs, context),
        validateTurboJson(context),
      ])

      if (repoPackageResult.isErr()) return err(repoPackageResult.error)
      if (circularDepResult.isErr()) return err(circularDepResult.error)
      if (turboJsonResult.isErr()) return err(turboJsonResult.error)

      const combinedResult = combineValidationResults([
        repoPackageResult.value,
        circularDepResult.value,
        turboJsonResult.value,
      ])

      // Display dependency graph if requested
      if (options.graph) {
        await displayDependencyGraph(packageDirs, context)
      }

      // Display summary
      displayValidationSummary(combinedResult, context)

      // Attempt to fix issues if requested
      if (options.fix && (combinedResult.errors > 0 || combinedResult.warnings > 0)) {
        context.logger.info('')
        context.logger.info(colorize('blue', withIcon('progress', 'Attempting to fix issues...')))
        const fixResult = await fixDependencyIssues(combinedResult.issues, packageDirs, context)
        if (fixResult.isErr()) {
          context.logger.error(colorize('red', withIcon('error', 'Failed to auto-fix some issues')))
          context.logger.info(colorize('yellow', 'Some issues require manual intervention'))
        } else {
          context.logger.info(
            colorize('green', withIcon('success', 'Fixed all auto-fixable issues'))
          )
        }
      }

      if (combinedResult.errors > 0) {
        return err(
          createCoreError(
            'VALIDATION_FAILED',
            'DEPENDENCY_ERROR',
            `Found ${combinedResult.errors} errors and ${combinedResult.warnings} warnings`,
            {
              recoverable: true,
              suggestion: 'Review the issues above and fix dependency problems',
            }
          )
        )
      }

      return ok(undefined)
    } catch (error) {
      return err(
        createCoreError(
          'VALIDATION_ERROR',
          'FILE_SYSTEM_ERROR',
          'Failed to validate dependencies',
          {
            recoverable: false,
            cause: error,
          }
        )
      )
    }
  },
})

// Pure functional utilities

const findSourceFiles = async (): Promise<readonly string[]> => {
  const files = await glob(
    ['packages/**/*.{ts,tsx,js,jsx}', 'apps/**/*.{ts,tsx,js,jsx}', 'tooling/**/*.{ts,tsx,js,jsx}'],
    {
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**'],
    }
  )

  return files
}

const findPackageDirectories = async (context: CommandContext): Promise<readonly PackageInfo[]> => {
  const packageJsonFiles = await glob(['packages/*/package.json', 'tooling/*/package.json'])

  const packageInfos = await Promise.all(
    packageJsonFiles.map(async (pkgPath): Promise<PackageInfo> => {
      const packageDir = pkgPath.replace('/package.json', '')
      const packageName = packageDir.split('/').pop() || ''

      try {
        const contentResult = await context.fs.readFile(pkgPath)
        if (contentResult.isErr()) {
          return {
            name: packageName,
            path: packageDir,
            hasValidPackageJson: false,
            hasBuildScript: false,
          }
        }
        const packageJson = JSON.parse(contentResult.value)
        const hasBuildScript = !!packageJson.scripts?.build

        return {
          name: packageName,
          path: packageDir,
          hasValidPackageJson: true,
          hasBuildScript,
        }
      } catch {
        return {
          name: packageName,
          path: packageDir,
          hasValidPackageJson: false,
          hasBuildScript: false,
        }
      }
    })
  )

  return packageInfos
}

const extractRepoImports = (fileContent: string): readonly string[] => {
  const repoImportRegex = /@repo\/[^"'`\s]*/g
  const matches = fileContent.match(repoImportRegex) || []
  return [...new Set(matches)]
}

const validateFileImports = async (
  filePath: string,
  packageDirs: readonly PackageInfo[],
  context: CommandContext
): Promise<ValidationResult> => {
  const issues: string[] = []
  let errors = 0
  let warnings = 0

  try {
    const contentResult = await context.fs.readFile(filePath)
    if (contentResult.isErr()) {
      issues.push(`Failed to read ${filePath}: ${contentResult.error.message}`)
      errors++
      return { errors, warnings, issues }
    }
    const content = contentResult.value
    const repoImports = extractRepoImports(content)

    for (const importPath of repoImports) {
      // Skip self-imports
      if (filePath.includes(importPath.replace('@repo/', ''))) {
        continue
      }

      // Extract base package name (handle subpath exports)
      const basePackage = importPath.replace('@repo/', '').split('/')[0]
      const packageInfo = packageDirs.find((pkg) => pkg.name === basePackage)

      if (!packageInfo) {
        issues.push(`${filePath} imports ${importPath} but package not found`)
        errors++
      } else if (!packageInfo.hasBuildScript) {
        issues.push(`${filePath} imports ${importPath} but ${basePackage} has no build script`)
        warnings++
      }
    }
  } catch (error) {
    issues.push(`Failed to process ${filePath}: ${error}`)
    errors++
  }

  return { errors, warnings, issues }
}

const validateRepoPackageImports = async (
  sourceFiles: readonly string[],
  packageDirs: readonly PackageInfo[],
  context: CommandContext
): Promise<Result<ValidationResult, CoreError>> => {
  context.logger.info(colorize('yellow', 'Checking @repo package imports...'))

  try {
    const validationResults = await Promise.all(
      sourceFiles.map((file) => validateFileImports(file, packageDirs, context))
    )

    const combined = combineValidationResults(validationResults)
    return ok(combined)
  } catch (error) {
    return err(
      createCoreError(
        'IMPORT_VALIDATION_FAILED',
        'FILE_SYSTEM_ERROR',
        'Failed to validate @repo imports',
        {
          recoverable: true,
          cause: error,
        }
      )
    )
  }
}

const checkCircularDependencies = async (
  packageDirs: readonly PackageInfo[],
  context: CommandContext
): Promise<Result<ValidationResult, CoreError>> => {
  context.logger.info(colorize('yellow', 'Checking for circular dependencies...'))

  const issues: string[] = []
  let errors = 0

  try {
    for (const packageInfo of packageDirs) {
      const packageFiles = await glob(`${packageInfo.path}/src/**/*.{ts,tsx,js,jsx}`, {
        ignore: ['**/node_modules/**', '**/dist/**'],
      })

      for (const file of packageFiles) {
        const contentResult = await context.fs.readFile(file)
        if (contentResult.isErr()) continue
        const content = contentResult.value
        const importedPackages = extractImportedPackages(content)

        for (const importedPkg of importedPackages) {
          const isCircular = await checkForCircularImport(
            packageInfo.name,
            importedPkg,
            packageDirs,
            context
          )

          if (isCircular) {
            issues.push(`Circular dependency: ${packageInfo.name} ⇄ ${importedPkg}`)
            errors++
          }
        }
      }
    }

    return ok({ errors, warnings: 0, issues })
  } catch (error) {
    return err(
      createCoreError(
        'CIRCULAR_DEPENDENCY_CHECK_FAILED',
        'FILE_SYSTEM_ERROR',
        'Failed to check circular dependencies',
        {
          recoverable: true,
          cause: error,
        }
      )
    )
  }
}

const extractImportedPackages = (content: string): readonly string[] => {
  const importRegex = /from\s+['"]@[^'"]*['"]/g
  const matches = content.match(importRegex) || []

  return matches
    .map((match) => match.replace(/from\s+['"]@([^/'"]*)['"]/g, '$1'))
    .filter((pkg) => pkg && pkg !== 'repo') // Filter out @repo imports
}

const checkForCircularImport = async (
  packageName: string,
  importedPackage: string,
  packageDirs: readonly PackageInfo[],
  context: CommandContext
): Promise<boolean> => {
  const importedPackageInfo = packageDirs.find((pkg) => pkg.name === importedPackage)
  if (!importedPackageInfo) return false

  try {
    const importedPackageFiles = await glob(`${importedPackageInfo.path}/src/**/*.{ts,tsx,js,jsx}`)

    for (const file of importedPackageFiles) {
      const contentResult = await context.fs.readFile(file)
      if (contentResult.isOk()) {
        const content = contentResult.value
        const backImports = extractImportedPackages(content)

        if (backImports.includes(packageName)) {
          return true
        }
      }
    }
  } catch {
    // Ignore file read errors for this check
  }

  return false
}

const validateTurboJson = async (
  context: CommandContext
): Promise<Result<ValidationResult, CoreError>> => {
  context.logger.info(colorize('yellow', 'Checking turbo.json task dependencies...'))

  try {
    const turboJsonExists = await context.fs.exists('turbo.json')
    if (!turboJsonExists) {
      return ok({ errors: 0, warnings: 0, issues: [] })
    }

    const contentResult = await context.fs.readFile('turbo.json')
    if (contentResult.isErr()) {
      return ok({ errors: 1, warnings: 0, issues: ['Failed to read turbo.json'] })
    }

    const turboConfig = JSON.parse(contentResult.value)
    const issues: string[] = []
    let warnings = 0

    // Check if test tasks depend on vitest-config build
    const testTask = turboConfig.tasks?.test || turboConfig.pipeline?.test
    if (testTask) {
      const dependsOn = testTask.dependsOn || []
      const hasVitestDep =
        dependsOn.includes('@repo/vitest-config#build') ||
        dependsOn.includes('^@repo/vitest-config#build')

      if (!hasVitestDep) {
        // Check if any package uses vitest
        const vitestConfigs = await glob('packages/**/vitest.config.ts')
        if (vitestConfigs.length > 0) {
          issues.push('⚠️  Test tasks should depend on @repo/vitest-config#build')
          warnings++
        }
      } else {
        if (context.verbose) {
          context.logger.info(
            colorize('green', '  ✅ Test tasks correctly depend on @repo/vitest-config#build')
          )
        }
      }
    }

    return ok({ errors: 0, warnings, issues })
  } catch (error) {
    return err(
      createCoreError(
        'TURBO_JSON_VALIDATION_FAILED',
        'FILE_SYSTEM_ERROR',
        'Failed to validate turbo.json',
        {
          recoverable: true,
          cause: error,
        }
      )
    )
  }
}

const combineValidationResults = (results: readonly ValidationResult[]): ValidationResult => {
  return results.reduce(
    (acc, result) => ({
      errors: acc.errors + result.errors,
      warnings: acc.warnings + result.warnings,
      issues: [...acc.issues, ...result.issues],
    }),
    { errors: 0, warnings: 0, issues: [] }
  )
}

const displayValidationSummary = (result: ValidationResult, context: CommandContext): void => {
  const border = '━'.repeat(60)

  // Display issues
  result.issues.forEach((issue) => {
    if (issue.includes('❌')) {
      context.logger.info(colorize('red', `  ${issue}`))
    } else {
      context.logger.info(colorize('yellow', `  ${issue}`))
    }
  })

  // Display summary
  context.logger.info('')
  context.logger.info(colorize('blue', border))

  if (result.errors === 0 && result.warnings === 0) {
    context.logger.info(colorize('green', withIcon('success', 'All dependency checks passed!')))
  } else {
    if (result.warnings > 0) {
      context.logger.info(
        colorize('yellow', withIcon('warning', `Found ${result.warnings} warnings`))
      )
    }
    if (result.errors > 0) {
      context.logger.info(colorize('red', withIcon('error', `Found ${result.errors} errors`)))
    }
  }
}

const displayDependencyGraph = async (
  packageDirs: readonly PackageInfo[],
  context: CommandContext
): Promise<void> => {
  context.logger.info('')
  context.logger.info(colorize('blue', withIcon('progress', 'Generating dependency graph...')))
  context.logger.info('')

  // Create a map of package dependencies
  const dependencyMap = new Map<string, Set<string>>()

  for (const pkg of packageDirs) {
    if (!pkg.hasValidPackageJson) continue

    const packageJsonPath = `${pkg.path}/package.json`
    const contentResult = await context.fs.readFile(packageJsonPath)
    if (contentResult.isErr()) continue

    try {
      const packageJson = JSON.parse(contentResult.value)
      const deps = new Set<string>()

      // Collect all internal dependencies
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
        ...packageJson.peerDependencies,
      }

      for (const [depName, depVersion] of Object.entries(allDeps)) {
        if (
          typeof depVersion === 'string' &&
          (depVersion.startsWith('workspace:') ||
            depName.startsWith('@repo/') ||
            depName.startsWith('@esteban-url/'))
        ) {
          // Extract package name
          const cleanName = depName.replace('@repo/', '').replace('@esteban-url/', '')
          if (packageDirs.some((p) => p.name === cleanName)) {
            deps.add(cleanName)
          }
        }
      }

      dependencyMap.set(pkg.name, deps)
    } catch {
      // Skip invalid package.json
    }
  }

  // Display as ASCII tree
  context.logger.info(colorize('yellow', 'Package Dependency Graph:'))
  context.logger.info('')

  const visited = new Set<string>()
  const printDependencyTree = (pkgName: string, prefix = '', isLast = true) => {
    if (visited.has(pkgName)) {
      context.logger.info(
        `${prefix}${isLast ? '└── ' : '├── '}${pkgName} ${colorize('yellow', '(circular)')}`
      )
      return
    }

    visited.add(pkgName)
    context.logger.info(`${prefix}${isLast ? '└── ' : '├── '}${pkgName}`)

    const deps = dependencyMap.get(pkgName) || new Set()
    const depArray = Array.from(deps)

    depArray.forEach((dep, index) => {
      const isLastDep = index === depArray.length - 1
      const newPrefix = prefix + (isLast ? '    ' : '│   ')
      printDependencyTree(dep, newPrefix, isLastDep)
    })

    visited.delete(pkgName)
  }

  // Print root packages (those not depended on by others)
  const allPackages = new Set(packageDirs.map((p) => p.name))
  const dependedOn = new Set<string>()
  dependencyMap.forEach((deps) => deps.forEach((dep) => dependedOn.add(dep)))
  const rootPackages = Array.from(allPackages).filter((pkg) => !dependedOn.has(pkg))

  rootPackages.forEach((pkg, index) => {
    if (index > 0) context.logger.info('')
    printDependencyTree(pkg, '', true)
  })

  context.logger.info('')
}

const fixDependencyIssues = async (
  issues: readonly string[],
  packageDirs: readonly PackageInfo[],
  context: CommandContext
): Promise<Result<void, CoreError>> => {
  let fixedCount = 0
  let failedCount = 0

  for (const issue of issues) {
    // Fix missing build scripts
    if (issue.includes('has no build script')) {
      const match = issue.match(/but (\S+) has no build script/)
      if (match) {
        const packageName = match[1]
        const pkg = packageDirs.find((p) => p.name === packageName)

        if (pkg) {
          const packageJsonPath = `${pkg.path}/package.json`
          const contentResult = await context.fs.readFile(packageJsonPath)

          if (contentResult.isOk()) {
            try {
              const packageJson = JSON.parse(contentResult.value)
              if (!packageJson.scripts) {
                packageJson.scripts = {}
              }

              // Add a basic build script
              packageJson.scripts.build = 'echo "No build required"'

              const writeResult = await context.fs.writeFile(
                packageJsonPath,
                JSON.stringify(packageJson, null, 2) + '\n'
              )

              if (writeResult.isOk()) {
                context.logger.info(colorize('green', `  ✅ Added build script to ${packageName}`))
                fixedCount++
              } else {
                failedCount++
              }
            } catch {
              failedCount++
            }
          }
        }
      }
    }

    // Fix turbo.json test dependencies
    if (issue.includes('Test tasks should depend on @repo/vitest-config#build')) {
      const turboJsonPath = 'turbo.json'
      const contentResult = await context.fs.readFile(turboJsonPath)

      if (contentResult.isOk()) {
        try {
          const turboConfig = JSON.parse(contentResult.value)

          // Ensure test task exists
          if (!turboConfig.tasks) {
            turboConfig.tasks = {}
          }
          if (!turboConfig.tasks.test) {
            turboConfig.tasks.test = {}
          }

          // Add dependency
          if (!turboConfig.tasks.test.dependsOn) {
            turboConfig.tasks.test.dependsOn = []
          }

          if (!turboConfig.tasks.test.dependsOn.includes('@repo/vitest-config#build')) {
            turboConfig.tasks.test.dependsOn.push('@repo/vitest-config#build')

            const writeResult = await context.fs.writeFile(
              turboJsonPath,
              JSON.stringify(turboConfig, null, 2) + '\n'
            )

            if (writeResult.isOk()) {
              context.logger.info(
                colorize('green', '  ✅ Added @repo/vitest-config#build dependency to test tasks')
              )
              fixedCount++
            } else {
              failedCount++
            }
          }
        } catch {
          failedCount++
        }
      }
    }
  }
  if (fixedCount > 0) {
    context.logger.info(
      colorize('green', withIcon('success', `Fixed ${fixedCount} issues automatically`))
    )
  }
  if (failedCount > 0) {
    return err(
      createCoreError('FIX_FAILED', 'FILE_SYSTEM_ERROR', `Failed to fix ${failedCount} issues`, {
        recoverable: true,
        suggestion: 'Some issues require manual intervention',
      })
    )
  }

  return ok(undefined)
}
