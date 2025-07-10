import type { FileSystem, MkdirOptions, CopyOptions, RmOptions } from './types.js';
import { createNodeFileSystem } from './node.js';
import { createMemoryFileSystem } from './memory.js';
import { ok } from 'neverthrow';

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
      return ok(undefined);
    },
    mkdir: async (path: string, _options?: MkdirOptions) => {
      console.log(`[DRY RUN] Would create directory: ${path}`);
      return ok(undefined);
    },
    cp: async (src: string, dest: string, _options?: CopyOptions) => {
      console.log(`[DRY RUN] Would copy: ${src} -> ${dest}`);
      return ok(undefined);
    },
    writeJson: async (path: string, _data: any) => {
      console.log(`[DRY RUN] Would write JSON to: ${path}`);
      return ok(undefined);
    },
    rename: async (src: string, dest: string) => {
      console.log(`[DRY RUN] Would rename: ${src} -> ${dest}`);
      return ok(undefined);
    },
    rm: async (path: string, _options?: RmOptions) => {
      console.log(`[DRY RUN] Would remove: ${path}`);
      return ok(undefined);
    },
    access: async (path: string, _mode?: number) => {
      console.log(`[DRY RUN] Would check access: ${path}`);
      return ok(undefined);
    },
    stat: async (path: string) => {
      console.log(`[DRY RUN] Would stat: ${path}`);
      return ok({ size: 0, isFile: true, isDirectory: false, mtime: new Date() });
    },
    readdir: async (path: string) => {
      console.log(`[DRY RUN] Would read directory: ${path}`);
      return ok([]);
    },
    ensureDir: async (path: string) => {
      console.log(`[DRY RUN] Would ensure directory: ${path}`);
      return ok(undefined);
    },
    readJson: async <T = any>(path: string) => {
      console.log(`[DRY RUN] Would read JSON: ${path}`);
      return ok({} as T);
    },
    emptyDir: async (path: string) => {
      console.log(`[DRY RUN] Would empty directory: ${path}`);
      return ok(undefined);
    },
    outputFile: async (path: string, _content: string) => {
      console.log(`[DRY RUN] Would output file: ${path}`);
      return ok(undefined);
    },
  };
}
