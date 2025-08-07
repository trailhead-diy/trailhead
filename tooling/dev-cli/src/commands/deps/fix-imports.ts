import { createCommand, type CommandOptions, type CommandContext } from '@esteban-url/cli/command'
import { ok, err, createCoreError, type Result, type CoreError } from '@esteban-url/core'
import { colorize, withIcon } from '../../utils/colors.js'
import fastGlob from 'fast-glob'
const { glob } = fastGlob

interface FixImportsOptions extends CommandOptions {
  readonly dryRun?: boolean
  readonly pattern?: string
  readonly backup?: boolean
}

export const fixImportsCommand = createCommand<FixImportsOptions>({
  name: 'fix-imports',
  description: 'Fix duplicate imports in TypeScript files',
  options: [
    {
      flags: '--dry-run',
      description: 'Show what would be fixed without making changes',
      type: 'boolean',
      default: false,
    },
    {
      flags: '-p, --pattern <pattern>',
      description: 'Glob pattern for files to process',
      type: 'string',
      default: 'packages/**/*.ts',
    },
    {
      flags: '--backup',
      description: 'Create backup files before modification',
      type: 'boolean',
      default: false,
    },
  ],
  examples: [
    'fix-imports',
    'fix-imports --dry-run',
    'fix-imports --pattern "src/**/*.ts" --backup',
  ],
  action: async (options, context): Promise<Result<void, CoreError>> => {
    context.logger.info(colorize('blue', withIcon('progress', 'Scanning for duplicate imports...')))

    try {
      // Find TypeScript files matching pattern
      const files = await glob(options.pattern || 'packages/**/*.ts', {
        ignore: ['**/node_modules/**', '**/dist/**', '**/*.d.ts', '**/*.test.ts', '**/*.spec.ts'],
      })

      if (files.length === 0) {
        context.logger.info(
          colorize('yellow', withIcon('warning', 'No TypeScript files found matching pattern'))
        )
        return ok(undefined)
      }

      context.logger.info(`Found ${files.length} files to analyze`)

      let processedCount = 0
      let fixedCount = 0

      for (const file of files) {
        if (context.verbose) {
          context.logger.info(`Processing: ${file}`)
        }

        const result = await processFile(file, options, context)
        if (result.isErr()) {
          context.logger.error(`Failed to process ${file}: ${result.error.message}`)
          continue
        }

        processedCount++
        if (result.value) {
          fixedCount++
          if (!options.dryRun) {
            context.logger.info(colorize('green', `Fixed: ${file}`))
          } else {
            context.logger.info(colorize('yellow', `Would fix: ${file}`))
          }
        }
      }

      const summary = options.dryRun
        ? `Would fix ${fixedCount} of ${processedCount} files`
        : `Fixed ${fixedCount} of ${processedCount} files`

      context.logger.info('')
      context.logger.info(colorize('green', withIcon('success', summary)))

      return ok(undefined)
    } catch (error) {
      return err(
        createCoreError('IMPORT_FIX_FAILED', 'FILE_SYSTEM_ERROR', 'Failed to fix imports', {
          recoverable: false,
          cause: error,
          suggestion: 'Check file permissions and ensure files are not in use',
        })
      )
    }
  },
})

async function processFile(
  filePath: string,
  options: FixImportsOptions,
  context: CommandContext
): Promise<Result<boolean, CoreError>> {
  const contentResult = await context.fs.readFile(filePath)
  if (contentResult.isErr()) {
    return err(
      createCoreError('FILE_READ_FAILED', 'FILE_SYSTEM_ERROR', `Failed to read file: ${filePath}`, {
        recoverable: true,
        cause: contentResult.error,
      })
    )
  }

  const content = contentResult.value
  const fixedContent = fixDuplicateImports(content)

  // Check if any changes were made
  if (content === fixedContent) {
    return ok(false) // No changes needed
  }

  if (options.dryRun) {
    return ok(true) // Would make changes
  }

  // Create backup if requested
  if (options.backup) {
    const backupResult = await context.fs.writeFile(`${filePath}.bak`, content)
    if (backupResult.isErr()) {
      return err(
        createCoreError(
          'BACKUP_FAILED',
          'FILE_SYSTEM_ERROR',
          `Failed to create backup for: ${filePath}`,
          {
            recoverable: true,
            cause: backupResult.error,
          }
        )
      )
    }
  }

  // Write fixed content
  const writeResult = await context.fs.writeFile(filePath, fixedContent)
  if (writeResult.isErr()) {
    return err(
      createCoreError(
        'FILE_WRITE_FAILED',
        'FILE_SYSTEM_ERROR',
        `Failed to write file: ${filePath}`,
        {
          recoverable: true,
          cause: writeResult.error,
        }
      )
    )
  }

  return ok(true) // Changes made
}

// Pure functions for import processing

type ImportInfo = {
  readonly imports: readonly string[]
  readonly module: string
  readonly isTypeImport: boolean
}

type ImportAnalysis = {
  readonly regularImports: ReadonlyMap<string, readonly string[]>
  readonly typeImports: ReadonlyMap<string, readonly string[]>
  readonly importLineIndices: readonly number[]
  readonly lines: readonly string[]
}

const parseImportLine = (line: string): ImportInfo | null => {
  // Match regular imports: import { ... } from '...'
  const importMatch = line.match(/^import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]([^'"]+)['"]/)
  if (importMatch) {
    const [, imports, module] = importMatch
    return {
      imports: imports
        .split(',')
        .map((imp) => imp.trim())
        .filter(Boolean),
      module,
      isTypeImport: false,
    }
  }

  // Match type imports: import type { ... } from '...'
  const typeImportMatch = line.match(/^import\s+type\s*\{\s*([^}]+)\s*\}\s*from\s*['"]([^'"]+)['"]/)
  if (typeImportMatch) {
    const [, imports, module] = typeImportMatch
    return {
      imports: imports
        .split(',')
        .map((imp) => imp.trim())
        .filter(Boolean),
      module,
      isTypeImport: true,
    }
  }

  return null
}

const analyzeImports = (content: string): ImportAnalysis => {
  const lines = content.split('\n')
  const regularImportsMap = new Map<string, Set<string>>()
  const typeImportsMap = new Map<string, Set<string>>()
  const importLineIndices: number[] = []

  lines.forEach((line, index) => {
    const importInfo = parseImportLine(line.trim())
    if (importInfo) {
      importLineIndices.push(index)
      const targetMap = importInfo.isTypeImport ? typeImportsMap : regularImportsMap

      if (!targetMap.has(importInfo.module)) {
        targetMap.set(importInfo.module, new Set())
      }

      importInfo.imports.forEach((imp) => targetMap.get(importInfo.module)!.add(imp))
    }
  })

  // Convert to readonly maps with readonly arrays
  const regularImports = new Map(
    Array.from(regularImportsMap.entries()).map(([module, imports]) => [
      module,
      Array.from(imports).sort(),
    ])
  )

  const typeImports = new Map(
    Array.from(typeImportsMap.entries()).map(([module, imports]) => [
      module,
      Array.from(imports).sort(),
    ])
  )

  return {
    regularImports,
    typeImports,
    importLineIndices,
    lines,
  }
}

const buildMergedImportLines = (analysis: ImportAnalysis): readonly string[] => {
  const mergedLines: string[] = []

  // Add merged regular imports
  Array.from(analysis.regularImports.entries()).forEach(([module, imports]) => {
    mergedLines.push(`import { ${imports.join(', ')} } from '${module}'`)
  })

  // Add merged type imports
  Array.from(analysis.typeImports.entries()).forEach(([module, imports]) => {
    mergedLines.push(`import type { ${imports.join(', ')} } from '${module}'`)
  })

  return mergedLines
}

const rebuildContent = (analysis: ImportAnalysis): string => {
  const { lines, importLineIndices } = analysis
  const importLineSet = new Set(importLineIndices)
  const mergedImportLines = buildMergedImportLines(analysis)

  if (mergedImportLines.length === 0) {
    return lines.join('\n') // No imports to merge
  }

  const result: string[] = []
  let importsInserted = false
  const lastImportIndex = Math.max(...importLineIndices)

  lines.forEach((line, index) => {
    // Skip original import lines
    if (importLineSet.has(index)) {
      return
    }

    // Insert merged imports after the last original import line
    if (!importsInserted && index > lastImportIndex) {
      result.push(...mergedImportLines)
      result.push('') // Empty line after imports
      importsInserted = true
    }

    result.push(line)
  })

  return result.join('\n')
}

const fixDuplicateImports = (content: string): string => {
  const analysis = analyzeImports(content)
  return rebuildContent(analysis)
}
