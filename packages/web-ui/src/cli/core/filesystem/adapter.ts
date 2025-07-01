/**
 * FileSystem adapter to bridge between different FileSystem interfaces
 */

import type { FileSystem as FrameworkFileSystem } from '@trailhead/cli/filesystem'
import type {
  FileSystem as InstallFileSystem,
  InstallError,
  Result,
} from '../installation/types.js'

/**
 * Convert shared FileSystemError to InstallError
 */
function toInstallError(error: any): InstallError {
  return {
    type: 'FileSystemError',
    message: error.message || 'Filesystem operation failed',
    path: error.path || '',
    cause: error.cause || error,
  }
}

/**
 * Adapt framework FileSystem to installation FileSystem interface
 */
export function adaptSharedToInstallFS(frameworkFS: FrameworkFileSystem): InstallFileSystem {
  return {
    readFile: async (path: string): Promise<Result<string, InstallError>> => {
      const result = await frameworkFS.readFile(path)
      if (!result.success) {
        return { success: false, error: toInstallError(result.error) }
      }
      return { success: true, value: result.value }
    },

    writeFile: async (path: string, content: string): Promise<Result<void, InstallError>> => {
      const result = await frameworkFS.writeFile(path, content)
      if (!result.success) {
        return { success: false, error: toInstallError(result.error) }
      }
      return { success: true, value: undefined }
    },

    exists: async (path: string): Promise<Result<boolean, InstallError>> => {
      const result = await frameworkFS.exists(path)
      if (!result.success) {
        return { success: false, error: toInstallError(result.error) }
      }
      return { success: true, value: result.value }
    },

    ensureDir: async (path: string): Promise<Result<void, InstallError>> => {
      const result = await frameworkFS.ensureDir(path)
      if (!result.success) {
        return { success: false, error: toInstallError(result.error) }
      }
      return { success: true, value: undefined }
    },

    readDir: async (path: string): Promise<Result<string[], InstallError>> => {
      const result = await frameworkFS.readdir(path)
      if (!result.success) {
        return { success: false, error: toInstallError(result.error) }
      }
      return { success: true, value: result.value }
    },

    copy: async (
      source: string,
      dest: string,
      options?: any
    ): Promise<Result<void, InstallError>> => {
      const result = await frameworkFS.copy(source, dest, options)
      if (!result.success) {
        return { success: false, error: toInstallError(result.error) }
      }
      return { success: true, value: undefined }
    },

    readJson: async <T>(path: string): Promise<Result<T, InstallError>> => {
      const result = await frameworkFS.readJson<T>(path)
      if (!result.success) {
        return { success: false, error: toInstallError(result.error) }
      }
      return { success: true, value: result.value }
    },

    writeJson: async <T>(
      path: string,
      data: T,
      options?: { spaces?: number }
    ): Promise<Result<void, InstallError>> => {
      const result = await frameworkFS.writeJson(path, data, options)
      if (!result.success) {
        return { success: false, error: toInstallError(result.error) }
      }
      return { success: true, value: undefined }
    },

    remove: async (path: string): Promise<Result<void, InstallError>> => {
      // Framework FileSystem doesn't have remove method
      return {
        success: false,
        error: toInstallError({ message: 'Remove not supported by framework filesystem', path }),
      }
    },

    stat: async (path: string): Promise<Result<any, InstallError>> => {
      // Framework FileSystem doesn't have stat method
      const existsResult = await frameworkFS.exists(path)
      if (!existsResult.success) {
        return { success: false, error: toInstallError(existsResult.error) }
      }
      if (!existsResult.value) {
        return { success: false, error: toInstallError({ message: 'File not found', path }) }
      }
      // Return minimal stats
      return { success: true, value: { mtime: new Date() } }
    },
  }
}
