/**
 * FileSystem adapter to bridge between CLI framework and web-ui interfaces
 */

import type { FileSystem as FrameworkFileSystem } from '@esteban-url/trailhead-cli/filesystem';
import type {
  FileSystem as InstallFileSystem,
  InstallError,
  Result,
} from '../installation/types.js';

/**
 * Convert framework FileSystemError to InstallError
 */
function toInstallError(error: any): InstallError {
  return {
    type: 'FileSystemError',
    message: error.message || 'Filesystem operation failed',
    path: error.path || '',
    cause: error.cause || error,
  };
}

/**
 * Adapt framework FileSystem to installation FileSystem interface
 */
export function adaptFrameworkToInstallFS(frameworkFS: FrameworkFileSystem): InstallFileSystem {
  return {
    access: async (path: string, mode?: number): Promise<Result<void, InstallError>> => {
      const result = await frameworkFS.access(path, mode);
      if (!result.success) {
        return { success: false, error: toInstallError(result.error) };
      }
      return { success: true, value: undefined };
    },

    readFile: async (path: string): Promise<Result<string, InstallError>> => {
      const result = await frameworkFS.readFile(path);
      if (!result.success) {
        return { success: false, error: toInstallError(result.error) };
      }
      return { success: true, value: result.value };
    },

    writeFile: async (path: string, content: string): Promise<Result<void, InstallError>> => {
      const result = await frameworkFS.writeFile(path, content);
      if (!result.success) {
        return { success: false, error: toInstallError(result.error) };
      }
      return { success: true, value: undefined };
    },

    ensureDir: async (path: string): Promise<Result<void, InstallError>> => {
      const result = await frameworkFS.ensureDir(path);
      if (!result.success) {
        return { success: false, error: toInstallError(result.error) };
      }
      return { success: true, value: undefined };
    },

    readdir: async (path: string): Promise<Result<string[], InstallError>> => {
      const result = await frameworkFS.readdir(path);
      if (!result.success) {
        return { success: false, error: toInstallError(result.error) };
      }
      return { success: true, value: result.value };
    },

    cp: async (
      source: string,
      dest: string,
      options?: any
    ): Promise<Result<void, InstallError>> => {
      const result = await frameworkFS.cp(source, dest, options);
      if (!result.success) {
        return { success: false, error: toInstallError(result.error) };
      }
      return { success: true, value: undefined };
    },

    readJson: async <T>(path: string): Promise<Result<T, InstallError>> => {
      const result = await frameworkFS.readJson<T>(path);
      if (!result.success) {
        return { success: false, error: toInstallError(result.error) };
      }
      return { success: true, value: result.value };
    },

    writeJson: async <T>(
      path: string,
      data: T,
      options?: { spaces?: number }
    ): Promise<Result<void, InstallError>> => {
      const result = await frameworkFS.writeJson(path, data, options);
      if (!result.success) {
        return { success: false, error: toInstallError(result.error) };
      }
      return { success: true, value: undefined };
    },

    rm: async (path: string): Promise<Result<void, InstallError>> => {
      const result = await frameworkFS.rm(path, { recursive: true, force: true });
      if (!result.success) {
        return { success: false, error: toInstallError(result.error) };
      }
      return { success: true, value: undefined };
    },

    stat: async (path: string): Promise<Result<any, InstallError>> => {
      const result = await frameworkFS.stat(path);
      if (!result.success) {
        return { success: false, error: toInstallError(result.error) };
      }
      return { success: true, value: result.value };
    },
  };
}
