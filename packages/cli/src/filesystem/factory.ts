import type { FileSystem } from './types.js'
import { createNodeFileSystem } from './node.js'
import { createMemoryFileSystem } from './memory.js'

export interface FileSystemOptions {
  type?: 'node' | 'memory'
  dryRun?: boolean
  initialFiles?: Record<string, string>
}

export function createFileSystem(options: FileSystemOptions = {}): FileSystem {
  if (options.type === 'memory') {
    return createMemoryFileSystem(options.initialFiles)
  }

  const fs = createNodeFileSystem()

  if (options.dryRun) {
    // Wrap in dry-run adapter
    return createDryRunFileSystem(fs)
  }

  return fs
}

/**
 * Create a dry-run filesystem that logs operations but doesn't perform them
 */
function createDryRunFileSystem(fs: FileSystem): FileSystem {
  return {
    ...fs,
    writeFile: async (path: string, _content: string) => {
      console.log(`[DRY RUN] Would write file: ${path}`)
      return { success: true, value: undefined }
    },
    mkdir: async (path: string, _options?) => {
      console.log(`[DRY RUN] Would create directory: ${path}`)
      return { success: true, value: undefined }
    },
    copy: async (src: string, dest: string, _options?) => {
      console.log(`[DRY RUN] Would copy: ${src} -> ${dest}`)
      return { success: true, value: undefined }
    },
    writeJson: async (path: string, _data: any) => {
      console.log(`[DRY RUN] Would write JSON to: ${path}`)
      return { success: true, value: undefined }
    },
  }
}
