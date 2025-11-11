import { promises as fs, constants } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { ok, err } from '@trailhead/core'
import { glob } from 'glob'
import { mapNodeError, createFileSystemError } from './errors.js'
import { sortFileEntries, needsFileStats, applySortingWithStats } from './utils/sorting.js'
import type {
  FSConfig,
  FSResult,
  FileStats,
  CopyOptions,
  MoveOptions,
  MkdirOptions,
  RmOptions,
  ReadFileOp,
  WriteFileOp,
  ExistsOp,
  StatOp,
  MkdirOp,
  ReadDirOp,
  CopyOp,
  SortOptions,
  FindFilesOp,
  FindFilesOptions,
  MoveOp,
  RemoveOp,
  ReadJsonOp,
  WriteJsonOp,
} from './types.js'

/**
 * Default configuration for filesystem operations.
 * Used when no custom configuration is provided.
 *
 * @example
 * ```typescript
 * import { defaultFSConfig, readFile } from '@trailhead/fs'
 *
 * // Use defaults
 * const reader = readFile() // uses defaultFSConfig
 *
 * // Override specific options
 * const customReader = readFile({ ...defaultFSConfig, encoding: 'latin1' })
 * ```
 */
export const defaultFSConfig: FSConfig = {
  encoding: 'utf8',
  defaultMode: constants.F_OK,
  jsonSpaces: 2,
} as const

/**
 * Creates a file reader function with the specified configuration.
 * Returns file contents as string with the configured encoding.
 *
 * @param _config Optional filesystem configuration
 * @returns Configured file reader function
 * @throws {FileSystemError} FILE_NOT_FOUND - When file does not exist
 * @throws {FileSystemError} PERMISSION_DENIED - When file cannot be accessed due to permissions
 * @throws {FileSystemError} READ_ERROR - When file cannot be read due to I/O errors
 *
 * @example
 * ```typescript
 * // Using default configuration
 * const reader = readFile()
 * const result = await reader('config.json')
 *
 * // Using custom encoding
 * const utf16Reader = readFile({ encoding: 'utf16le' })
 * const result = await utf16Reader('unicode.txt')
 *
 * // Error handling with specific error codes
 * const result = await reader('missing.txt')
 * if (result.isErr()) {
 *   switch (result.error.code) {
 *     case 'FILE_NOT_FOUND':
 *       console.error('File does not exist');
 *       break;
 *     case 'PERMISSION_DENIED':
 *       console.error('Cannot access file');
 *       break;
 *     default:
 *       console.error(`Failed: ${result.error.message}`);
 *   }
 * }
 * ```
 */
export const readFile =
  (_config: FSConfig = defaultFSConfig): ReadFileOp =>
  async (path: string): Promise<FSResult<string>> => {
    try {
      const content = await fs.readFile(path, _config.encoding || 'utf8')
      return ok(String(content))
    } catch (error) {
      return err(mapNodeError('Read file', path, error))
    }
  }

/**
 * Creates a file writer function with the specified configuration.
 * Writes string content to a file with the configured encoding.
 *
 * @param _config Optional filesystem configuration
 * @returns Configured file writer function
 * @throws {FileSystemError} PERMISSION_DENIED - When directory is not writable
 * @throws {FileSystemError} NO_SPACE - When disk is full
 * @throws {FileSystemError} WRITE_ERROR - When write operation fails
 * @throws {FileSystemError} DIRECTORY_NOT_FOUND - When parent directory doesn't exist
 *
 * @example
 * ```typescript
 * const writer = writeFile()
 * const result = await writer('output.txt', 'Hello, world!')
 * if (result.isOk()) {
 *   console.log('File written successfully')
 * }
 *
 * // Custom encoding
 * const utf16Writer = writeFile({ encoding: 'utf16le' })
 * await utf16Writer('unicode.txt', '日本語')
 *
 * // Error handling
 * const result = await writer('/restricted/file.txt', 'data')
 * if (result.isErr()) {
 *   if (result.error.code === 'PERMISSION_DENIED') {
 *     console.error('Cannot write to restricted directory');
 *   }
 * }
 * ```
 */
export const writeFile =
  (_config: FSConfig = defaultFSConfig): WriteFileOp =>
  async (path: string, content: string): Promise<FSResult<void>> => {
    try {
      await fs.writeFile(path, content, _config.encoding || 'utf8')
      return ok(undefined)
    } catch (error) {
      return err(mapNodeError('Write file', path, error))
    }
  }

/**
 * Creates an existence checker function with the specified configuration.
 * Checks if a file or directory exists and is accessible.
 *
 * @param _config Optional filesystem configuration
 * @returns Configured existence checker function
 *
 * @example
 * ```typescript
 * const checker = exists()
 * const result = await checker('package.json')
 * if (result.isOk() && result.value) {
 *   console.log('File exists')
 * }
 *
 * // Check with specific permissions
 * const writeChecker = exists({ defaultMode: constants.W_OK })
 * const canWrite = await writeChecker('file.txt')
 * ```
 */
export const exists =
  (_config: FSConfig = defaultFSConfig): ExistsOp =>
  async (path: string): Promise<FSResult<boolean>> => {
    try {
      await fs.access(path, _config.defaultMode)
      return ok(true)
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return ok(false)
      }
      return err(mapNodeError('Check existence', path, error))
    }
  }

/**
 * Creates a stat function to get file/directory information.
 * Returns standardized FileStats with size, type, and modification time.
 *
 * @param _config Optional filesystem configuration
 * @returns Configured stat function
 *
 * @example
 * ```typescript
 * const statter = stat()
 * const result = await statter('package.json')
 * if (result.isOk()) {
 *   const { size, isFile, mtime } = result.value
 *   console.log(`File size: ${size} bytes`)
 *   console.log(`Last modified: ${mtime}`)
 * }
 * ```
 */
export const stat =
  (_config: FSConfig = defaultFSConfig): StatOp =>
  async (path: string): Promise<FSResult<FileStats>> => {
    try {
      const stats = await fs.stat(path)
      const fileStats: FileStats = {
        size: stats.size,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        isSymbolicLink: stats.isSymbolicLink(),
        mtime: stats.mtime,
        atime: stats.atime,
        ctime: stats.ctime,
      }
      return ok(fileStats)
    } catch (error) {
      return err(mapNodeError('Get stats', path, error))
    }
  }

/**
 * Creates a directory creator function with the specified configuration.
 * Can create single directories or nested directory structures.
 *
 * @param _config Optional filesystem configuration
 * @returns Configured directory creator function
 * @throws {FileSystemError} DIRECTORY_EXISTS - When directory already exists (non-recursive mode)
 * @throws {FileSystemError} PERMISSION_DENIED - When parent directory is not writable
 * @throws {FileSystemError} INVALID_PATH - When path contains invalid characters
 *
 * @example
 * ```typescript
 * const creator = mkdir()
 *
 * // Create single directory
 * await creator('temp')
 *
 * // Create nested directories
 * await creator('path/to/nested/dir', { recursive: true })
 *
 * // Error handling
 * const result = await creator('existing-dir')
 * if (result.isErr() && result.error.code === 'DIRECTORY_EXISTS') {
 *   console.log('Directory already exists');
 * }
 * ```
 */
export const mkdir =
  (_config: FSConfig = defaultFSConfig): MkdirOp =>
  async (path: string, options: MkdirOptions = {}): Promise<FSResult<void>> => {
    try {
      await fs.mkdir(path, { recursive: options.recursive })
      return ok(undefined)
    } catch (error) {
      return err(mapNodeError('Create directory', path, error))
    }
  }

/**
 * Creates a directory reader function with the specified configuration.
 * Returns an array of entry names (files and subdirectories).
 *
 * @param _config Optional filesystem configuration
 * @returns Configured directory reader function
 *
 * @example
 * ```typescript
 * const reader = readDir()
 * const result = await reader('src')
 * if (result.isOk()) {
 *   console.log('Directory contents:', result.value)
 *   // ['index.ts', 'utils', 'tests']
 * }
 * ```
 */
export const readDir =
  (_config: FSConfig = defaultFSConfig): ReadDirOp =>
  async (path: string, options?: SortOptions): Promise<FSResult<string[]>> => {
    try {
      const entries = await fs.readdir(path)

      // Apply sorting if requested
      if (options?.sort) {
        if (needsFileStats(options)) {
          // Use shared utility for stat-based sorting
          const sortedNames = await applySortingWithStats(
            entries,
            path,
            options,
            stat(_config),
            `reading directory ${path}`
          )
          return ok(sortedNames)
        } else {
          // Simple string sorting (name or extension)
          const sorted = sortFileEntries(entries, options)
          return ok(sorted)
        }
      }

      return ok(entries)
    } catch (error) {
      return err(mapNodeError('Read directory', path, error))
    }
  }

/**
 * Creates a copy function with the specified configuration.
 * Can copy files or directories with optional recursion and overwrite control.
 *
 * @param _config Optional filesystem configuration
 * @returns Configured copy function
 *
 * @example
 * ```typescript
 * const copier = copy()
 *
 * // Copy a file
 * await copier('source.txt', 'backup.txt')
 *
 * // Copy directory recursively
 * await copier('src/', 'dist/', { recursive: true })
 *
 * // Prevent overwrite
 * const result = await copier('important.txt', 'existing.txt', { overwrite: false })
 * if (result.isErr()) {
 *   console.log('Destination already exists')
 * }
 * ```
 */
export const copy =
  (_config: FSConfig = defaultFSConfig): CopyOp =>
  async (src: string, dest: string, options: CopyOptions = {}): Promise<FSResult<void>> => {
    try {
      await fs.cp(src, dest, {
        recursive: options.recursive ?? false,
        force: options.overwrite !== false,
      })
      return ok(undefined)
    } catch (error) {
      return err(mapNodeError('Copy', `${src} to ${dest}`, error))
    }
  }

/**
 * Creates a move/rename function with the specified configuration.
 * Moves or renames files and directories with optional overwrite protection.
 *
 * @param _config Optional filesystem configuration
 * @returns Configured move function
 *
 * @example
 * ```typescript
 * const mover = move()
 *
 * // Rename a file
 * await mover('old-name.txt', 'new-name.txt')
 *
 * // Move to different directory
 * await mover('downloads/file.pdf', 'documents/file.pdf')
 *
 * // Prevent accidental overwrite
 * const result = await mover('temp.txt', 'important.txt', { overwrite: false })
 * if (result.isErr() && result.error.code === 'EEXIST') {
 *   console.log('Would overwrite existing file')
 * }
 * ```
 */
export const move =
  (_config: FSConfig = defaultFSConfig): MoveOp =>
  async (src: string, dest: string, options: MoveOptions = {}): Promise<FSResult<void>> => {
    try {
      // Check if destination exists and overwrite is disabled
      if (!options.overwrite) {
        try {
          await fs.access(dest)
          return err(
            createFileSystemError('Move', `Destination '${dest}' already exists`, {
              path: dest,
              code: 'EEXIST',
              recoverable: true,
              suggestion: 'Enable overwrite option or use a different destination',
            })
          )
        } catch (error: any) {
          if (error.code !== 'ENOENT') {
            return err(mapNodeError('Move', dest, error))
          }
        }
      }

      await fs.rename(src, dest)
      return ok(undefined)
    } catch (error) {
      return err(mapNodeError('Move', `${src} to ${dest}`, error))
    }
  }

/**
 * Creates a remove function with the specified configuration.
 * Removes files or directories with optional recursive deletion.
 *
 * @param _config Optional filesystem configuration
 * @returns Configured remove function
 *
 * @example
 * ```typescript
 * const remover = remove()
 *
 * // Remove a file
 * await remover('temp.txt')
 *
 * // Remove directory and contents
 * await remover('temp-dir/', { recursive: true })
 *
 * // Remove if exists (no error if missing)
 * await remover('maybe-exists.txt', { force: true })
 * ```
 */
export const remove =
  (_config: FSConfig = defaultFSConfig): RemoveOp =>
  async (path: string, options: RmOptions = {}): Promise<FSResult<void>> => {
    try {
      await fs.rm(path, {
        recursive: options.recursive ?? false,
        force: options.force ?? false,
      })
      return ok(undefined)
    } catch (error) {
      return err(mapNodeError('Remove', path, error))
    }
  }

/**
 * Creates a JSON reader function with the specified configuration.
 * Reads and parses JSON files with type safety.
 *
 * @param _config Optional filesystem configuration
 * @returns Configured JSON reader function
 *
 * @example
 * ```typescript
 * const reader = readJson()
 *
 * // Read with type inference
 * interface Config {
 *   name: string
 *   version: string
 * }
 * const result = await reader<Config>('package.json')
 * if (result.isOk()) {
 *   console.log(`${result.value.name} v${result.value.version}`)
 * }
 *
 * // Handle parse errors
 * const result = await reader('invalid.json')
 * if (result.isErr() && result.error.code === 'JSON_PARSE_ERROR') {
 *   console.log('Invalid JSON format')
 * }
 * ```
 */
export const readJson =
  (_config: FSConfig = defaultFSConfig): ReadJsonOp =>
  async <T = any>(path: string): Promise<FSResult<T>> => {
    try {
      const content = await fs.readFile(path, _config.encoding || 'utf8')
      const data = JSON.parse(String(content)) as T
      return ok(data)
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return err(mapNodeError('Read JSON', path, error))
      }
      return err(
        createFileSystemError('Read JSON', `Failed to parse JSON: ${error.message}`, {
          path,
          code: 'JSON_PARSE_ERROR',
          cause: error,
          recoverable: false,
          suggestion: 'Check if the file contains valid JSON',
        })
      )
    }
  }

/**
 * Creates a JSON writer function with the specified configuration.
 * Serializes data to JSON and writes to file, creating parent directories as needed.
 *
 * @param _config Optional filesystem configuration
 * @returns Configured JSON writer function
 *
 * @example
 * ```typescript
 * const writer = writeJson()
 *
 * // Write with default formatting (2 spaces)
 * const data = { name: 'my-app', version: '1.0.0' }
 * await writer('package.json', data)
 *
 * // Write with custom formatting
 * await writer('config.json', data, { spaces: 4 })
 *
 * // Parent directories created automatically
 * await writer('deep/nested/data.json', data)
 * ```
 */
export const writeJson =
  (_config: FSConfig = defaultFSConfig): WriteJsonOp =>
  async <T = any>(
    path: string,
    data: T,
    options?: { spaces?: number }
  ): Promise<FSResult<void>> => {
    try {
      const content = JSON.stringify(data, null, options?.spaces ?? _config.jsonSpaces)
      // Ensure directory exists before writing
      await fs.mkdir(dirname(path), { recursive: true })
      await fs.writeFile(path, content, _config.encoding || 'utf8')
      return ok(undefined)
    } catch (error) {
      return err(mapNodeError('Write JSON', path, error))
    }
  }

/**
 * Creates a directory ensurer function that creates directories recursively.
 * Convenience wrapper around mkdir with recursive option always enabled.
 *
 * @param _config Optional filesystem configuration
 * @returns Configured directory ensurer function
 *
 * @example
 * ```typescript
 * const ensurer = ensureDir()
 *
 * // Creates all parent directories if needed
 * await ensurer('path/to/nested/directory')
 *
 * // Safe to call multiple times
 * await ensurer('logs') // Creates if missing
 * await ensurer('logs') // No error if exists
 * ```
 */
export const ensureDir =
  (_config: FSConfig = defaultFSConfig) =>
  async (path: string): Promise<FSResult<void>> => {
    const mkdirOp = mkdir(_config)
    return mkdirOp(path, { recursive: true })
  }

/**
 * Creates a file output function that ensures parent directories exist.
 * Combines directory creation and file writing in a single operation.
 *
 * @param _config Optional filesystem configuration
 * @returns Configured file output function
 *
 * @example
 * ```typescript
 * const outputter = outputFile()
 *
 * // Write to nested path (creates directories as needed)
 * await outputter('output/reports/2024/summary.txt', 'Report content')
 *
 * // Replaces existing file
 * await outputter('dist/index.html', htmlContent)
 * ```
 */
export const outputFile =
  (_config: FSConfig = defaultFSConfig) =>
  async (path: string, content: string): Promise<FSResult<void>> => {
    try {
      // Ensure directory exists before writing
      await fs.mkdir(dirname(path), { recursive: true })
      await fs.writeFile(path, content, _config.encoding || 'utf8')
      return ok(undefined)
    } catch (error) {
      return err(mapNodeError('Output file', path, error))
    }
  }

/**
 * Creates a directory emptier function that removes all contents.
 * Removes all files and subdirectories but keeps the directory itself.
 *
 * @param _config Optional filesystem configuration
 * @returns Configured directory emptier function
 *
 * @example
 * ```typescript
 * const emptier = emptyDir()
 *
 * // Clear temporary directory
 * await emptier('temp')
 *
 * // Clear build output
 * await emptier('dist')
 *
 * // Directory must exist
 * const result = await emptier('non-existent')
 * if (result.isErr()) {
 *   console.log('Directory not found')
 * }
 * ```
 */
export const emptyDir =
  (_config: FSConfig = defaultFSConfig) =>
  async (path: string): Promise<FSResult<void>> => {
    try {
      const entries = await fs.readdir(path)
      await Promise.all(
        entries.map((entry) => fs.rm(resolve(path, entry), { recursive: true, force: true }))
      )
      return ok(undefined)
    } catch (error) {
      return err(mapNodeError('Empty directory', path, error))
    }
  }

/**
 * Creates a file finder function using glob patterns.
 * Searches for files matching patterns with optional filtering.
 *
 * @param _config Optional filesystem configuration
 * @returns Configured file finder function
 *
 * @example
 * ```typescript
 * const finder = findFiles()
 *
 * // Find all TypeScript files
 * const tsFiles = await finder('**' + '/*.ts')
 *
 * // Find with options
 * const srcFiles = await finder('**' + '/*.js', {
 *   cwd: 'src',
 *   ignore: ['**' + '/*.test.js', 'node_modules/**']
 * })
 *
 * // Multiple patterns
 * const assets = await finder('**' + '/*.{png,jpg,svg}')
 * ```
 */
export const findFiles =
  (_config: FSConfig = defaultFSConfig): FindFilesOp =>
  async (pattern: string, options?: FindFilesOptions): Promise<FSResult<string[]>> => {
    try {
      const files = await glob(pattern, {
        cwd: options?.cwd,
        ignore: options?.ignore,
      })

      // Apply sorting if requested
      if (options?.sort && files.length > 0) {
        if (needsFileStats(options)) {
          // Use shared utility for stat-based sorting
          const cwd = options.cwd || process.cwd()
          const sortedNames = await applySortingWithStats(
            files,
            cwd,
            options,
            stat(_config),
            `finding files with pattern ${pattern}`,
            true // preserve full paths for findFiles
          )
          return ok(sortedNames)
        } else {
          // Simple string sorting (name or extension)
          const sorted = sortFileEntries(files, options)
          return ok(sorted)
        }
      }

      return ok(files)
    } catch (error) {
      return err(
        createFileSystemError('Find files', `Pattern matching failed: ${error}`, {
          cause: error,
          context: { pattern, options },
          recoverable: true,
          suggestion: 'Check if the glob pattern is valid',
        })
      )
    }
  }

/**
 * Creates a conditional reader that returns null if file doesn't exist.
 * Useful for optional configuration files or fallback scenarios.
 *
 * @param _config Optional filesystem configuration
 * @returns Configured conditional reader function
 *
 * @example
 * ```typescript
 * const reader = readIfExists()
 *
 * // Read optional config
 * const config = await reader('.env.local')
 * if (config.isOk()) {
 *   if (config.value === null) {
 *     console.log('Using default config')
 *   } else {
 *     console.log('Loaded local config')
 *   }
 * }
 * ```
 */
export const readIfExists =
  (_config: FSConfig = defaultFSConfig) =>
  async (path: string): Promise<FSResult<string | null>> => {
    const existsOp = exists(_config)
    const readOp = readFile(_config)

    const existsResult = await existsOp(path)
    if (existsResult.isErr()) return err(existsResult.error)

    if (!existsResult.value) return ok(null)

    const readResult = await readOp(path)
    return readResult.isOk() ? ok(readResult.value) : err(readResult.error)
  }

/**
 * Creates a conditional copier that only copies if source exists.
 * Returns true if copied, false if source doesn't exist.
 *
 * @param _config Optional filesystem configuration
 * @returns Configured conditional copier function
 *
 * @example
 * ```typescript
 * const copier = copyIfExists()
 *
 * // Copy optional template
 * const result = await copier('template.default', 'config.json')
 * if (result.isOk()) {
 *   if (result.value) {
 *     console.log('Template copied')
 *   } else {
 *     console.log('No template found, using defaults')
 *   }
 * }
 * ```
 */
export const copyIfExists =
  (_config: FSConfig = defaultFSConfig) =>
  async (src: string, dest: string, options: CopyOptions = {}): Promise<FSResult<boolean>> => {
    const existsOp = exists(_config)
    const copyOp = copy(_config)

    const existsResult = await existsOp(src)
    if (existsResult.isErr()) return err(existsResult.error)

    if (!existsResult.value) return ok(false)

    const copyResult = await copyOp(src, dest, options)
    return copyResult.isOk() ? ok(true) : err(copyResult.error)
  }
