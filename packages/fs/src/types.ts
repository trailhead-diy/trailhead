import type { Result, CoreError } from '@esteban-url/core'

export interface FileStats {
  readonly size: number
  readonly isFile: boolean
  readonly isDirectory: boolean
  readonly isSymbolicLink: boolean
  readonly mtime: Date
}

export interface FileSystemError extends CoreError {
  readonly type: 'FILESYSTEM_ERROR'
  readonly code: string
  readonly path?: string
  readonly component: 'filesystem'
  readonly operation: string
  readonly severity: 'low' | 'medium' | 'high' | 'critical'
  readonly recoverable: boolean
  readonly timestamp: Date
}

export interface CopyOptions {
  readonly overwrite?: boolean
  readonly recursive?: boolean
}

export interface MoveOptions {
  readonly overwrite?: boolean
}

export interface MkdirOptions {
  readonly recursive?: boolean
}

export interface RmOptions {
  readonly recursive?: boolean
  readonly force?: boolean
}

export interface FSConfig {
  readonly encoding?: BufferEncoding
  readonly defaultMode?: number
  readonly jsonSpaces?: number
}

export type FSResult<T> = Result<T, FileSystemError>

// Functional operation types
export type ReadFileOp = (path: string) => Promise<FSResult<string>>
export type WriteFileOp = (path: string, content: string) => Promise<FSResult<void>>
export type ExistsOp = (path: string) => Promise<FSResult<boolean>>
export type StatOp = (path: string) => Promise<FSResult<FileStats>>
export type MkdirOp = (path: string, options?: MkdirOptions) => Promise<FSResult<void>>
export type ReadDirOp = (path: string) => Promise<FSResult<string[]>>
export type CopyOp = (src: string, dest: string, options?: CopyOptions) => Promise<FSResult<void>>
export type MoveOp = (src: string, dest: string, options?: MoveOptions) => Promise<FSResult<void>>
export type RemoveOp = (path: string, options?: RmOptions) => Promise<FSResult<void>>
export type ReadJsonOp = <T = any>(path: string) => Promise<FSResult<T>>
export type WriteJsonOp = <T = any>(
  path: string,
  data: T,
  options?: { spaces?: number }
) => Promise<FSResult<void>>
