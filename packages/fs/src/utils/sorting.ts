import { basename, extname, join } from 'node:path'
import type { FileStats, FileSortField, SortOptions, FileSystemError } from '../types.js'

/**
 * Get the sort field accessor function for a given field
 */
function getSortAccessor(field: FileSortField) {
  switch (field) {
    case 'name':
      return (item: string | FileStats) =>
        typeof item === 'string' ? item.toLowerCase() : (item.name?.toLowerCase() ?? '')
    case 'size':
      return (item: string | FileStats) => (typeof item === 'string' ? 0 : item.size)
    case 'mtime':
      return (item: string | FileStats) => (typeof item === 'string' ? 0 : item.mtime.getTime())
    case 'atime':
      return (item: string | FileStats) => (typeof item === 'string' ? 0 : item.atime.getTime())
    case 'ctime':
      return (item: string | FileStats) => (typeof item === 'string' ? 0 : item.ctime.getTime())
    case 'extension':
      return (item: string | FileStats) => {
        const name = typeof item === 'string' ? item : (item.name ?? '')
        return extname(name).toLowerCase()
      }
  }
}

/**
 * Sort file entries based on the provided options
 */
export function sortFileEntries<T extends string | FileStats>(
  entries: T[],
  options?: SortOptions
): T[] {
  if (!options?.sort || entries.length === 0) {
    return entries
  }

  // Normalize sort options
  const sortOptions = Array.isArray(options.sort)
    ? options.sort
    : typeof options.sort === 'string'
      ? [{ by: options.sort, order: 'asc' }]
      : [options.sort]

  // Custom sort function that handles both strings and FileStats
  return [...entries].sort((a, b) => {
    for (const { by, order = 'asc' } of sortOptions) {
      const accessor = getSortAccessor(by)
      const aValue = accessor(a as any)
      const bValue = accessor(b as any)

      let comparison = 0
      if (aValue < bValue) comparison = -1
      else if (aValue > bValue) comparison = 1

      if (comparison !== 0) {
        return order === 'desc' ? -comparison : comparison
      }
    }
    return 0
  })
}

/**
 * Enrich file names with stats for sorting
 * Uses parallel stat calls for better performance
 */
export async function enrichWithStats(
  dirPath: string,
  entries: string[],
  statFn: (path: string) => Promise<FileStats>
): Promise<FileStats[]> {
  // Process in batches to avoid overwhelming the file system
  const BATCH_SIZE = 50
  const results: FileStats[] = []

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.all(
      batch.map(async (name) => {
        const fullPath = join(dirPath, name)
        const stats = await statFn(fullPath)
        return { ...stats, name }
      })
    )
    results.push(...batchResults)
  }

  return results
}

/**
 * Check if a sort field requires file stats
 */
export function needsFileStats(sortOptions?: SortOptions): boolean {
  if (!sortOptions?.sort) return false

  const sortField =
    typeof sortOptions.sort === 'string'
      ? sortOptions.sort
      : Array.isArray(sortOptions.sort)
        ? sortOptions.sort[0].by
        : sortOptions.sort.by

  return sortField !== 'name' && sortField !== 'extension'
}

/**
 * Apply sorting with stats and error handling - shared utility for readDir/findFiles
 */
export async function applySortingWithStats(
  entries: string[],
  basePath: string,
  sortOptions: SortOptions,
  statFn: (
    path: string
  ) => Promise<{ isErr(): boolean; error?: FileSystemError; value?: FileStats }>,
  operationName: string,
  preserveFullPaths: boolean = false
): Promise<string[]> {
  const statErrors: Array<{ file: string; error: FileSystemError }> = []

  const enriched = await enrichWithStats(basePath, entries, async (filePath) => {
    const result = await statFn(filePath)
    if (result.isErr()) {
      statErrors.push({ file: filePath, error: result.error! })
      // Return minimal stats for failed files
      return {
        size: 0,
        isFile: true,
        isDirectory: false,
        isSymbolicLink: false,
        mtime: new Date(0),
        atime: new Date(0),
        ctime: new Date(0),
        name: preserveFullPaths ? filePath : basename(filePath),
      }
    }
    return {
      ...result.value!,
      name: preserveFullPaths ? filePath : basename(filePath),
    }
  })

  const sorted = sortFileEntries(enriched, sortOptions)
  const sortedNames = sorted.map((s) => s.name!)

  // Log warnings for stat failures
  if (statErrors.length > 0) {
    console.warn(`Warning: Failed to stat ${statErrors.length} entries during ${operationName}:`)
    statErrors.slice(0, 3).forEach(({ file, error }) => {
      console.warn(`  - ${file}: ${error.message}`)
    })
    if (statErrors.length > 3) {
      console.warn(`  ... and ${statErrors.length - 3} more`)
    }
  }

  return sortedNames
}
