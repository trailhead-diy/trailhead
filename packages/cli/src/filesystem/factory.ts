import type {
  FileSystem,
  MkdirOptions,
  CopyOptions,
  RmOptions,
} from './types.js';
import { createNodeFileSystem } from './node.js';
import { createMemoryFileSystem } from './memory.js';

export interface FileSystemOptions {
  type?: 'node' | 'memory';
  dryRun?: boolean;
  initialFiles?: Record<string, string>;
}

export function createFileSystem(options: FileSystemOptions = {}): FileSystem {
  if (options.type === 'memory') {
    return createMemoryFileSystem(options.initialFiles);
  }

  const fs = createNodeFileSystem();

  if (options.dryRun) {
    // Wrap in dry-run adapter
    return createDryRunFileSystem(fs);
  }

  return fs;
}

/**
 * Create a dry-run filesystem that logs operations but doesn't perform them
 */
function createDryRunFileSystem(fs: FileSystem): FileSystem {
  return {
    ...fs,
    writeFile: async (path: string, _content: string) => {
      console.log(`[DRY RUN] Would write file: ${path}`);
      return { success: true, value: undefined };
    },
    mkdir: async (path: string, _options?: MkdirOptions) => {
      console.log(`[DRY RUN] Would create directory: ${path}`);
      return { success: true, value: undefined };
    },
    cp: async (src: string, dest: string, _options?: CopyOptions) => {
      console.log(`[DRY RUN] Would copy: ${src} -> ${dest}`);
      return { success: true, value: undefined };
    },
    writeJson: async (path: string, _data: any) => {
      console.log(`[DRY RUN] Would write JSON to: ${path}`);
      return { success: true, value: undefined };
    },
    rename: async (src: string, dest: string) => {
      console.log(`[DRY RUN] Would rename: ${src} -> ${dest}`);
      return { success: true, value: undefined };
    },
    rm: async (path: string, _options?: RmOptions) => {
      console.log(`[DRY RUN] Would remove: ${path}`);
      return { success: true, value: undefined };
    },
    access: async (path: string, _mode?: number) => {
      console.log(`[DRY RUN] Would check access: ${path}`);
      return { success: true, value: undefined };
    },
    stat: async (path: string) => {
      console.log(`[DRY RUN] Would stat: ${path}`);
      return {
        success: true,
        value: { size: 0, isFile: true, isDirectory: false, mtime: new Date() },
      };
    },
    readdir: async (path: string) => {
      console.log(`[DRY RUN] Would read directory: ${path}`);
      return { success: true, value: [] };
    },
    ensureDir: async (path: string) => {
      console.log(`[DRY RUN] Would ensure directory: ${path}`);
      return { success: true, value: undefined };
    },
    readJson: async <T = any>(path: string) => {
      console.log(`[DRY RUN] Would read JSON: ${path}`);
      return { success: true, value: {} as T };
    },
    emptyDir: async (path: string) => {
      console.log(`[DRY RUN] Would empty directory: ${path}`);
      return { success: true, value: undefined };
    },
    outputFile: async (path: string, _content: string) => {
      console.log(`[DRY RUN] Would output file: ${path}`);
      return { success: true, value: undefined };
    },
  };
}
