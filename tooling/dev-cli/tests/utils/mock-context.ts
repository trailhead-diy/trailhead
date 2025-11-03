import { vi } from 'vitest'
import { ok, err, createCoreError } from '@trailhead/core'
import type { CommandContext } from '@trailhead/cli/command'

export function createMockContext(overrides: Partial<CommandContext> = {}): CommandContext {
  const mockLogger = {
    info: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }

  const mockFs = {
    exists: vi.fn().mockResolvedValue(false),
    readFile: vi.fn().mockResolvedValue(ok('')),
    writeFile: vi.fn().mockResolvedValue(ok(undefined)),
    appendFile: vi.fn().mockResolvedValue(ok(undefined)),
    createDirectory: vi.fn().mockResolvedValue(ok(undefined)),
    deleteFile: vi.fn().mockResolvedValue(ok(undefined)),
    copyFile: vi.fn().mockResolvedValue(ok(undefined)),
    moveFile: vi.fn().mockResolvedValue(ok(undefined)),
    listDirectory: vi.fn().mockResolvedValue(ok([])),
    getFileStats: vi.fn().mockResolvedValue(
      ok({
        size: 0,
        isFile: true,
        isDirectory: false,
        modifiedTime: new Date(),
        createdTime: new Date(),
      })
    ),
  }

  return {
    logger: mockLogger,
    fs: mockFs,
    verbose: false,
    ...overrides,
  }
}

export function createMockFileSystem(files: Record<string, string>) {
  const mockFs = {
    exists: vi.fn().mockImplementation((path: string) => Promise.resolve(path in files)),
    readFile: vi.fn().mockImplementation((path: string) =>
      Promise.resolve(
        path in files
          ? ok(files[path])
          : err(
              createCoreError('FILE_NOT_FOUND', 'FILE_SYSTEM_ERROR', `File not found: ${path}`, {
                recoverable: false,
              })
            )
      )
    ),
    writeFile: vi.fn().mockImplementation((path: string, content: string) => {
      files[path] = content
      return Promise.resolve(ok(undefined))
    }),
    appendFile: vi.fn().mockImplementation((path: string, content: string) => {
      files[path] = (files[path] || '') + content
      return Promise.resolve(ok(undefined))
    }),
    createDirectory: vi.fn().mockResolvedValue(ok(undefined)),
    deleteFile: vi.fn().mockImplementation((path: string) => {
      delete files[path]
      return Promise.resolve(ok(undefined))
    }),
    copyFile: vi.fn().mockResolvedValue(ok(undefined)),
    moveFile: vi.fn().mockResolvedValue(ok(undefined)),
    listDirectory: vi.fn().mockResolvedValue(ok([])),
    getFileStats: vi.fn().mockResolvedValue(
      ok({
        size: 0,
        isFile: true,
        isDirectory: false,
        modifiedTime: new Date(),
        createdTime: new Date(),
      })
    ),
  }

  return mockFs
}

export function createMockPackageJson(
  name: string,
  dependencies: Record<string, string> = {},
  scripts: Record<string, string> = {}
) {
  return JSON.stringify(
    {
      name,
      version: '1.0.0',
      dependencies,
      scripts,
    },
    null,
    2
  )
}

export function createMockTurboJson(tasks: Record<string, any> = {}) {
  return JSON.stringify(
    {
      tasks,
    },
    null,
    2
  )
}
