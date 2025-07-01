/**
 * Configuration detection and validation for Trailhead UI install script
 */

import * as path from 'path'
import type {
  InstallConfig,
  InstallationTrailheadConfig,
  InstallError,
  FileSystem,
  Logger,
  Result,
  CLIOptions,
} from './types.js'
import { Ok, Err, isString, isObject } from './types.js'

// ============================================================================
// CONFIGURATION DETECTION (Pure Functions)
// ============================================================================

/**
 * Pure function: Search for catalyst-ui-kit directory
 */
export const detectCatalystDir = async (
  fs: FileSystem,
  startDir: string = process.cwd()
): Promise<Result<string, InstallError>> => {
  const candidatePaths = [
    path.join(startDir, 'catalyst-ui-kit'),
    path.join(startDir, '..', 'catalyst-ui-kit'),
    path.join(startDir, 'catalyst-ui-kit', 'typescript'),
    path.join(startDir, '..', 'catalyst-ui-kit', 'typescript'),
  ]

  for (const candidatePath of candidatePaths) {
    const existsResult = await fs.exists(candidatePath)
    if (!existsResult.success) continue

    if (existsResult.value) {
      // Check if it contains typescript files
      const typescriptDir = candidatePath.endsWith('typescript')
        ? candidatePath
        : path.join(candidatePath, 'typescript')

      const typescriptExistsResult = await fs.exists(typescriptDir)
      if (typescriptExistsResult.success && typescriptExistsResult.value) {
        return Ok(typescriptDir)
      }
    }
  }

  return Err({
    type: 'ConfigurationError',
    message: 'Could not find catalyst-ui-kit directory',
    details: `Searched in: ${candidatePaths.join(', ')}\n\n💡 Expected Catalyst UI Kit structure:\n   catalyst-ui-kit/\n   └── typescript/\n       ├── button.tsx\n       ├── input.tsx\n       ├── alert.tsx\n       └── ... (27 component files)\n\n📋 To fix this:\n1. Download Catalyst UI Kit from Tailwind Plus\n2. Extract the ZIP file to your project directory\n3. Ensure you're using the TypeScript version\n\n🔍 Try running with:\n   npx tsx scripts/install.ts --catalyst-dir /path/to/catalyst-ui-kit/typescript\n\n💻 Or use the interactive CLI:\n   pnpm trailhead-ui install`,
  })
}

/**
 * Pure function: Search for components directory
 */
export const detectComponentsDir = async (
  fs: FileSystem,
  startDir: string = process.cwd()
): Promise<Result<string, InstallError>> => {
  const candidatePaths = [
    path.join(startDir, 'src', 'components'),
    path.join(startDir, 'components'),
    path.join(startDir, 'app', 'components'),
    path.join(startDir, 'lib', 'components'),
  ]

  for (const candidatePath of candidatePaths) {
    const existsResult = await fs.exists(candidatePath)
    if (!existsResult.success) continue

    if (existsResult.value) {
      return Ok(candidatePath)
    }
  }

  // Default to src/components if none found
  const defaultPath = path.join(startDir, 'src', 'components')
  return Ok(defaultPath)
}

/**
 * Pure function: Search for lib directory
 */
export const detectLibDir = async (
  fs: FileSystem,
  startDir: string = process.cwd()
): Promise<Result<string, InstallError>> => {
  const candidatePaths = [
    path.join(startDir, 'src', 'lib'),
    path.join(startDir, 'lib'),
    path.join(startDir, 'app', 'lib'),
  ]

  for (const candidatePath of candidatePaths) {
    const existsResult = await fs.exists(candidatePath)
    if (!existsResult.success) continue

    if (existsResult.value) {
      return Ok(candidatePath)
    }
  }

  // Default to src/lib if none found
  const defaultPath = path.join(startDir, 'src', 'lib')
  return Ok(defaultPath)
}

// ============================================================================
// CONFIGURATION VALIDATION (Pure Functions)
// ============================================================================

/**
 * Pure function: Validate InstallationTrailheadConfig object
 */
export const validateTrailheadConfig = (
  config: unknown
): Result<InstallationTrailheadConfig, InstallError> => {
  if (!isObject(config)) {
    return Err({
      type: 'ValidationError',
      message: 'Configuration must be an object',
    })
  }

  const { catalystDir, destinationDir, componentsDir, libDir } = config

  if (!isString(catalystDir) || !catalystDir.trim()) {
    return Err({
      type: 'ValidationError',
      message: 'catalystDir must be a non-empty string',
      field: 'catalystDir',
    })
  }

  if (!isString(destinationDir) || !destinationDir.trim()) {
    return Err({
      type: 'ValidationError',
      message: 'destinationDir must be a non-empty string',
      field: 'destinationDir',
    })
  }

  if (!isString(componentsDir) || !componentsDir.trim()) {
    return Err({
      type: 'ValidationError',
      message: 'componentsDir must be a non-empty string',
      field: 'componentsDir',
    })
  }

  if (!isString(libDir) || !libDir.trim()) {
    return Err({
      type: 'ValidationError',
      message: 'libDir must be a non-empty string',
      field: 'libDir',
    })
  }

  return Ok({
    catalystDir: catalystDir.trim(),
    destinationDir: destinationDir.trim(),
    componentsDir: componentsDir.trim(),
    libDir: libDir.trim(),
  })
}

/**
 * Pure function: Validate InstallConfig object
 */
export const validateInstallConfig = (config: unknown): Result<InstallConfig, InstallError> => {
  if (!isObject(config)) {
    return Err({
      type: 'ValidationError',
      message: 'Install configuration must be an object',
    })
  }

  const { catalystDir, destinationDir, componentsDir, libDir, projectRoot } = config

  if (!isString(catalystDir) || !catalystDir.trim()) {
    return Err({
      type: 'ValidationError',
      message: 'catalystDir must be a non-empty string',
      field: 'catalystDir',
    })
  }

  if (!isString(destinationDir) || !destinationDir.trim()) {
    return Err({
      type: 'ValidationError',
      message: 'destinationDir must be a non-empty string',
      field: 'destinationDir',
    })
  }

  if (!isString(componentsDir) || !componentsDir.trim()) {
    return Err({
      type: 'ValidationError',
      message: 'componentsDir must be a non-empty string',
      field: 'componentsDir',
    })
  }

  if (!isString(libDir) || !libDir.trim()) {
    return Err({
      type: 'ValidationError',
      message: 'libDir must be a non-empty string',
      field: 'libDir',
    })
  }

  if (!isString(projectRoot) || !projectRoot.trim()) {
    return Err({
      type: 'ValidationError',
      message: 'projectRoot must be a non-empty string',
      field: 'projectRoot',
    })
  }

  return Ok({
    catalystDir: catalystDir.trim(),
    destinationDir: destinationDir.trim(),
    componentsDir: componentsDir.trim(),
    libDir: libDir.trim(),
    projectRoot: projectRoot.trim(),
  })
}

// ============================================================================
// CONFIGURATION FILE OPERATIONS
// ============================================================================

/**
 * Read existing trailhead.config.json file
 */
export const readTrailheadConfig = async (
  fs: FileSystem,
  projectRoot: string
): Promise<Result<InstallationTrailheadConfig | null, InstallError>> => {
  const configPath = path.join(projectRoot, 'trailhead.config.json')

  const existsResult = await fs.exists(configPath)
  if (!existsResult.success) return existsResult

  if (!existsResult.value) {
    return Ok(null)
  }

  const readResult = await fs.readJson<unknown>(configPath)
  if (!readResult.success) return readResult

  const validateResult = validateTrailheadConfig(readResult.value)
  if (!validateResult.success) return validateResult

  return Ok(validateResult.value)
}

/**
 * Write trailhead.config.json file
 */
export const writeTrailheadConfig = async (
  fs: FileSystem,
  projectRoot: string,
  config: InstallationTrailheadConfig
): Promise<Result<void, InstallError>> => {
  const configPath = path.join(projectRoot, 'trailhead.config.json')

  return await fs.writeJson(configPath, config, { spaces: 2 })
}

// ============================================================================
// CONFIGURATION RESOLUTION (Functional Composition)
// ============================================================================

/**
 * Resolve configuration from multiple sources with precedence:
 * 1. CLI options (highest priority)
 * 2. Existing config file
 * 3. Auto-detection (lowest priority)
 */
export const resolveConfiguration = async (
  fs: FileSystem,
  logger: Logger,
  options: CLIOptions,
  projectRoot: string = process.cwd()
): Promise<Result<InstallConfig, InstallError>> => {
  try {
    logger.step('Resolving configuration...')

    // Read existing config file
    const existingConfigResult = await readTrailheadConfig(fs, projectRoot)
    if (!existingConfigResult.success) return existingConfigResult

    const existingConfig = existingConfigResult.value

    // Auto-detect directories only if not provided via CLI
    let catalystDir: string
    let destinationDir: string
    let componentsDir: string
    let libDir: string

    // Catalyst directory resolution
    if (options.catalystDir) {
      catalystDir = options.catalystDir
    } else if (existingConfig?.catalystDir) {
      catalystDir = existingConfig.catalystDir
    } else {
      const catalystDirResult = await detectCatalystDir(fs, projectRoot)
      if (!catalystDirResult.success) {
        return catalystDirResult
      }
      catalystDir = catalystDirResult.value
    }

    // Destination directory resolution (new single destination approach)
    if (options.destinationDir) {
      destinationDir = options.destinationDir
    } else if (existingConfig?.destinationDir) {
      destinationDir = existingConfig.destinationDir
    } else {
      // Detect default destination directory based on project structure
      const srcComponentsExists = await fs.exists(path.join(projectRoot, 'src', 'components'))
      if (srcComponentsExists.success && srcComponentsExists.value) {
        destinationDir = path.join('src', 'components', 'th')
      } else {
        destinationDir = path.join('components', 'th')
      }
    }

    // Derive componentsDir and libDir from destinationDir
    componentsDir = path.resolve(projectRoot, destinationDir)
    libDir = path.resolve(projectRoot, destinationDir, 'lib')

    // Create resolved configuration
    const resolvedConfig: InstallConfig = {
      projectRoot,
      catalystDir,
      destinationDir,
      componentsDir,
      libDir,
    }

    // Validate the resolved configuration
    const validateResult = validateInstallConfig(resolvedConfig)
    if (!validateResult.success) return validateResult

    // Log what was resolved
    if (options.verbose) {
      logger.debug(`Resolved configuration:`)
      logger.debug(`  Project root: ${resolvedConfig.projectRoot}`)
      logger.debug(`  Catalyst dir: ${resolvedConfig.catalystDir}`)
      logger.debug(`  Destination dir: ${resolvedConfig.destinationDir}`)
      logger.debug(`  Components dir: ${resolvedConfig.componentsDir}`)
      logger.debug(`  Lib dir: ${resolvedConfig.libDir}`)
    }

    return Ok(validateResult.value)
  } catch (error) {
    return Err({
      type: 'ConfigurationError',
      message: 'Failed to resolve configuration',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

/**
 * Interactive configuration prompting (for when auto-detection needs confirmation)
 */
export const promptForConfiguration = async (
  detectedConfig: Partial<InstallConfig>,
  logger: Logger
): Promise<Result<InstallConfig, InstallError>> => {
  logger.info('Configuration detected:')

  if (detectedConfig.catalystDir) {
    logger.info(`  Catalyst UI Kit: ${detectedConfig.catalystDir}`)
  } else {
    logger.warning('  Catalyst UI Kit: Not found')
  }

  if (detectedConfig.destinationDir) {
    logger.info(`  Destination directory: ${detectedConfig.destinationDir}`)
  }

  if (detectedConfig.componentsDir) {
    logger.info(`  Components directory: ${detectedConfig.componentsDir}`)
  }

  if (detectedConfig.libDir) {
    logger.info(`  Library directory: ${detectedConfig.libDir}`)
  }

  // For now, we'll proceed with auto-detection
  // In a future enhancement, we could add readline prompting here
  const projectRoot = detectedConfig.projectRoot || process.cwd()
  const destinationDir = detectedConfig.destinationDir || path.join('components', 'th')
  const config: InstallConfig = {
    projectRoot,
    catalystDir: detectedConfig.catalystDir || '',
    destinationDir,
    componentsDir: path.resolve(projectRoot, destinationDir),
    libDir: path.resolve(projectRoot, destinationDir, 'lib'),
  }

  return validateInstallConfig(config)
}

// ============================================================================
// CONFIGURATION VERIFICATION
// ============================================================================

/**
 * Verify that the resolved configuration paths are valid
 */
export const verifyConfiguration = async (
  fs: FileSystem,
  config: InstallConfig
): Promise<Result<void, InstallError>> => {
  // Check if catalyst directory exists and contains TypeScript files
  const catalystExistsResult = await fs.exists(config.catalystDir)
  if (!catalystExistsResult.success) return catalystExistsResult

  if (!catalystExistsResult.value) {
    return Err({
      type: 'ConfigurationError',
      message: `Catalyst UI Kit directory not found: ${config.catalystDir}`,
      details: `💡 Expected Catalyst UI Kit structure:\n   catalyst-ui-kit/\n   └── typescript/\n       ├── button.tsx\n       ├── input.tsx\n       ├── alert.tsx\n       └── ... (27 component files)\n\n📋 To fix this:\n1. Download Catalyst UI Kit from Tailwind Plus\n2. Extract the ZIP file to your project directory\n3. Point to the typescript/ directory within catalyst-ui-kit\n\n🔍 Try running with:\n   npx tsx scripts/install.ts --catalyst-dir /path/to/catalyst-ui-kit/typescript\n\n💻 Or use the interactive CLI:\n   pnpm trailhead-ui install`,
    })
  }

  // Check if catalyst directory contains component files
  const readDirResult = await fs.readDir(config.catalystDir)
  if (!readDirResult.success) return readDirResult

  const hasComponents = readDirResult.value.some((file) => file.endsWith('.tsx'))
  if (!hasComponents) {
    return Err({
      type: 'ConfigurationError',
      message: `No TypeScript component files found in: ${config.catalystDir}`,
      details: `💡 Expected Catalyst UI Kit structure:\n   catalyst-ui-kit/\n   └── typescript/\n       ├── button.tsx ← Missing\n       ├── input.tsx ← Missing\n       ├── alert.tsx ← Missing\n       └── ... (27 component files)\n\n📋 To fix this:\n1. Ensure you downloaded the TypeScript version from Tailwind Plus\n2. Point to the typescript/ directory (not the root catalyst-ui-kit/)\n3. Check that component files (.tsx) are present\n\n🔍 Try running with:\n   npx tsx scripts/install.ts --catalyst-dir /path/to/catalyst-ui-kit/typescript\n\n💻 Or use the interactive CLI:\n   pnpm trailhead-ui install`,
    })
  }

  return Ok(undefined)
}
