#!/usr/bin/env tsx

/**
 * Generate SHA hashes for Catalyst UI Kit components
 */

import * as path from 'path'
import chalk from 'chalk'

// Import from CLI core for file system functions and types
import { createNodeFileSystem } from '@esteban-url/trailhead-cli/filesystem'
// Import verification functions from CLI core
import {
  createDefaultHasher,
  generateCatalystHashData,
  writeCatalystHashes,
} from '../src/cli/core/installation/verification.js'
import { CATALYST_VERSION, Ok, Err } from '../src/cli/core/installation/types.js'
import type {
  InstallError,
  FileSystem as InstallFileSystem,
  Logger,
} from '../src/cli/core/installation/types.js'

// ============================================================================
// ADAPTER FUNCTIONS
// ============================================================================

/**
 * Create file system implementation compatible with install script types
 */
const createDefaultFileSystem = (): InstallFileSystem => {
  const robustFs = createNodeFileSystem()

  // Adapter to convert FileSystemError to InstallError
  const adaptError = (fsError: any): InstallError => ({
    type: 'FileSystemError' as const,
    message: fsError.message,
    path: fsError.path,
    cause: fsError.cause,
  })

  // Using Ok and Err from types.js

  return {
    exists: async (path: string) => {
      const result = await robustFs.exists(path)
      if (result.success) {
        return Ok(result.value)
      } else {
        return Err(adaptError((result as any).error))
      }
    },
    readDir: async (path: string) => {
      const result = await robustFs.readdir(path)
      if (result.success) {
        return Ok(result.value)
      } else {
        return Err(adaptError((result as any).error))
      }
    },
    readFile: async (path: string) => {
      const result = await robustFs.readFile(path)
      if (result.success) {
        return Ok(result.value)
      } else {
        return Err(adaptError((result as any).error))
      }
    },
    writeFile: async (path: string, content: string) => {
      const result = await robustFs.writeFile(path, content)
      if (result.success) {
        return Ok(undefined)
      } else {
        return Err(adaptError((result as any).error))
      }
    },
    readJson: async <T>(path: string) => {
      const result = await robustFs.readJson<T>(path)
      if (result.success) {
        return Ok(result.value)
      } else {
        return Err(adaptError((result as any).error))
      }
    },
    writeJson: async (path: string, data: any, options?: any) => {
      const result = await robustFs.writeJson(path, data, options)
      if (result.success) {
        return Ok(undefined)
      } else {
        return Err(adaptError((result as any).error))
      }
    },
    copy: async (src: string, dest: string, options?: any) => {
      const result = await robustFs.copy(src, dest, options)
      if (result.success) {
        return Ok(undefined)
      } else {
        return Err(adaptError((result as any).error))
      }
    },
    ensureDir: async (path: string) => {
      const result = await robustFs.ensureDir(path)
      if (result.success) {
        return Ok(undefined)
      } else {
        return Err(adaptError((result as any).error))
      }
    },
    stat: async (_path: string) => {
      // stat is not available in the new filesystem module
      // Return a mock implementation for now
      return Err(adaptError({ message: 'stat not implemented', type: 'FileSystemError' }))
    },
  }
}

/**
 * Create logger implementation for CLI usage
 */
const createDefaultLogger = (verbose = false): Logger => ({
  info: (message: string) => console.log(message),
  success: (message: string) => console.log(chalk.green(`✓ ${message}`)),
  warning: (message: string) => console.log(chalk.yellow(`⚠ ${message}`)),
  error: (message: string) => console.log(chalk.red(`✗ ${message}`)),
  debug: (message: string) => (verbose ? console.log(chalk.gray(`🐛 ${message}`)) : undefined),
  step: (message: string) => console.log(chalk.blue(`→ ${message}`)),
})

// ============================================================================
// MAIN HASH GENERATION
// ============================================================================

/**
 * Generate catalyst-hashes.json file from current Catalyst UI Kit
 */
export const generateHashes = async (): Promise<void> => {
  const logger = createDefaultLogger(true) // Always verbose for this script
  const fs = createDefaultFileSystem()
  const hasher = createDefaultHasher(fs)

  logger.info('')
  logger.info(chalk.bold.blue('🔐 Generating Catalyst UI Kit SHA Hashes'))
  logger.info('')

  try {
    // Get project root
    const projectRoot = getProjectRoot()
    const catalystDir = path.join(projectRoot, 'catalyst-ui-kit', 'typescript')

    logger.step(`Reading Catalyst components from: ${catalystDir}`)

    // Verify catalyst directory exists
    const existsResult = await fs.exists(catalystDir)
    if (!existsResult.success) {
      logger.error(`Failed to check directory: ${(existsResult as any).error.message}`)
      process.exit(1)
    }

    if (!existsResult.value) {
      logger.error(`Catalyst UI Kit directory not found: ${catalystDir}`)
      logger.info('Please ensure you have catalyst-ui-kit in your project root')
      process.exit(1)
    }

    // Check directory contents
    const readDirResult = await fs.readDir(catalystDir)
    if (!readDirResult.success) {
      logger.error(`Failed to read directory: ${(readDirResult as any).error.message}`)
      logger.debug(`Error type: ${(readDirResult as any).error.type}`)
      if ('cause' in (readDirResult as any).error && (readDirResult as any).error.cause) {
        logger.debug(`Error cause: ${(readDirResult as any).error.cause}`)
      }
      process.exit(1)
    }

    const files = readDirResult.value.filter((file: string) => file.endsWith('.tsx'))
    logger.info(`Found ${files.length} TypeScript component files`)

    if (files.length === 0) {
      logger.error('No .tsx files found in catalyst directory')
      logger.info(
        'Please ensure you are pointing to the correct catalyst-ui-kit/typescript directory'
      )
      process.exit(1)
    }

    // Generate hash data
    logger.step('Calculating SHA-256 hashes...')
    const hashDataResult = await generateCatalystHashData(fs, hasher, catalystDir, CATALYST_VERSION)
    if (!hashDataResult.success) {
      logger.error(`Failed to generate hashes: ${(hashDataResult as any).error.message}`)
      process.exit(1)
    }

    const hashData = hashDataResult.value
    const hashCount = Object.keys(hashData.files).length

    logger.success(`Generated ${hashCount} file hashes for version ${hashData.version}`)

    // Write hash file
    logger.step('Writing catalyst-hashes.json...')
    const writeResult = await writeCatalystHashes(fs, projectRoot, hashData)
    if (!writeResult.success) {
      logger.error(`Failed to write hash file: ${(writeResult as any).error.message}`)
      process.exit(1)
    }

    const hashFilePath = path.join(projectRoot, 'scripts', 'catalyst-hashes.json')
    logger.success(`Hash file written to: ${hashFilePath}`)

    // Display summary
    logger.info('')
    logger.info(chalk.green('✅ Hash generation completed successfully!'))
    logger.info('')
    logger.info('Generated hashes for:')
    Object.keys(hashData.files).forEach((fileName) => {
      logger.info(`  • ${fileName}`)
    })
    logger.info('')
    logger.info(`Version: ${hashData.version}`)
    logger.info(`Total files: ${hashCount}`)
    logger.info('')
    logger.info('The catalyst-hashes.json file can now be used by the install script')
    logger.info('to verify Catalyst UI Kit integrity.')
  } catch (error) {
    logger.error('Unexpected error occurred')
    if (error instanceof Error) {
      logger.debug(`Error: ${error.message}`)
      logger.debug(`Stack: ${error.stack}`)
    }
    process.exit(1)
  }
}

/**
 * Get project root directory
 */
const getProjectRoot = (): string => {
  // Get the directory where this script is located
  const scriptDir = path.dirname(new URL(import.meta.url).pathname)

  // If the script is in the scripts directory, go up one level
  if (scriptDir.endsWith('scripts')) {
    return path.dirname(scriptDir)
  }

  // Otherwise try to find the parent that contains scripts
  const scriptsIndex = scriptDir.lastIndexOf(path.sep + 'scripts')
  if (scriptsIndex !== -1) {
    return scriptDir.substring(0, scriptsIndex)
  }

  return scriptDir
}

// ============================================================================
// CLI EXECUTION
// ============================================================================

/**
 * Main entry point
 */
export const main = async (): Promise<void> => {
  await generateHashes()
}

// ES module execution check
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Unhandled error:', error)
    process.exit(1)
  })
}
