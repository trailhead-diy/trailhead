/**
 * Cross-Platform Mock Filesystem Utilities
 * 
 * Provides Windows-compatible mock filesystem implementations for testing.
 * Handles path normalization, directory simulation, and cross-platform file operations.
 */

import { vi } from 'vitest'
import { normalize, join, dirname, basename } from 'path'
import type { FileSystem } from '../../src/cli/core/installation/types.js'
import { Ok, Err } from '@trailhead/cli'
import { normalizeMockPath, isWindows } from './cross-platform-paths.js'

export interface MockFileSystemOptions {
  /**
   * Initial files to populate the mock filesystem with
   * Keys should use forward slashes for consistency
   */
  initialFiles?: Record<string, string>
  
  /**
   * Initial directories to create
   * Will be created with forward slashes and normalized
   */
  initialDirectories?: string[]
  
  /**
   * Whether to simulate filesystem errors
   */
  simulateErrors?: boolean
  
  /**
   * Case sensitivity (Windows is case-insensitive)
   */
  caseSensitive?: boolean
}

/**
 * Creates a cross-platform mock filesystem for testing
 * Handles Windows vs Unix path differences automatically
 */
export function createMockFileSystem(options: MockFileSystemOptions = {}): FileSystem & {
  // Additional methods for test control
  mockFiles: Map<string, string>
  mockDirs: Set<string>
  addFile: (path: string, content: string) => void
  addDirectory: (path: string) => void
  clear: () => void
  simulateError: (operation: string, path: string, error: any) => void
  getStoredPaths: () => string[]
} {
  const {
    initialFiles = {},
    initialDirectories = [],
    caseSensitive = !isWindows
  } = options

  // Internal storage with normalized paths
  const mockFiles = new Map<string, string>()
  const mockDirs = new Set<string>()
  const simulatedErrors = new Map<string, any>()
  
  // Normalize path for internal storage (always forward slashes)
  const normalizePath = (path: string): string => {
    let normalized = normalize(path)
    if (isWindows) {
      // Convert Windows paths to forward slashes for internal storage
      normalized = normalized.replace(/\\/g, '/')
    }
    return caseSensitive ? normalized : normalized.toLowerCase()
  }
  
  // Initialize with provided files and directories
  Object.entries(initialFiles).forEach(([path, content]) => {
    const normalizedPath = normalizePath(path)
    mockFiles.set(normalizedPath, content)
    
    // Also create parent directories
    const parentDir = dirname(normalizedPath)
    if (parentDir !== '.' && parentDir !== normalizedPath) {
      mockDirs.add(parentDir)
    }
  })
  
  initialDirectories.forEach(dir => {
    mockDirs.add(normalizePath(dir))
  })
  
  // Helper to check if path exists (file or directory)
  const pathExists = (path: string): boolean => {
    const normalized = normalizePath(path)
    return mockFiles.has(normalized) || mockDirs.has(normalized)
  }
  
  // Helper to check for simulated errors
  const checkSimulatedError = (operation: string, path: string) => {
    const errorKey = `${operation}:${normalizePath(path)}`
    if (simulatedErrors.has(errorKey)) {
      return simulatedErrors.get(errorKey)
    }
    return null
  }
  
  const mockFs: FileSystem & {
    mockFiles: Map<string, string>
    mockDirs: Set<string>
    addFile: (path: string, content: string) => void
    addDirectory: (path: string) => void
    clear: () => void
    simulateError: (operation: string, path: string, error: any) => void
    getStoredPaths: () => string[]
  } = {
    mockFiles,
    mockDirs,
    
    addFile: (path: string, content: string) => {
      const normalized = normalizePath(path)
      mockFiles.set(normalized, content)
      
      // Create parent directories
      const parentDir = dirname(normalized)
      if (parentDir !== '.' && parentDir !== normalized) {
        mockDirs.add(parentDir)
      }
    },
    
    addDirectory: (path: string) => {
      mockDirs.add(normalizePath(path))
    },
    
    clear: () => {
      mockFiles.clear()
      mockDirs.clear()
      simulatedErrors.clear()
    },
    
    simulateError: (operation: string, path: string, error: any) => {
      const errorKey = `${operation}:${normalizePath(path)}`
      simulatedErrors.set(errorKey, error)
    },
    
    getStoredPaths: () => {
      return [
        ...Array.from(mockFiles.keys()),
        ...Array.from(mockDirs.keys())
      ].sort()
    },

    // FileSystem interface implementation
    exists: vi.fn().mockImplementation(async (path: string) => {
      const error = checkSimulatedError('exists', path)
      if (error) return Err(error)
      
      return Ok(pathExists(path))
    }),

    readDir: vi.fn().mockImplementation(async (path: string) => {
      const error = checkSimulatedError('readDir', path)
      if (error) return Err(error)
      
      const normalized = normalizePath(path)
      
      if (!mockDirs.has(normalized)) {
        return Err({
          type: 'FileSystemError',
          message: `Directory not found: ${path}`,
          path
        })
      }
      
      // Find all files and subdirectories in this directory
      const prefix = normalized.endsWith('/') ? normalized : normalized + '/'
      const children = new Set<string>()
      
      // Check files
      for (const filePath of mockFiles.keys()) {
        if (filePath.startsWith(prefix)) {
          const relativePath = filePath.substring(prefix.length)
          const firstSegment = relativePath.split('/')[0]
          if (firstSegment && !relativePath.includes('/')) {
            children.add(firstSegment)
          }
        }
      }
      
      // Check directories
      for (const dirPath of mockDirs.keys()) {
        if (dirPath.startsWith(prefix) && dirPath !== normalized) {
          const relativePath = dirPath.substring(prefix.length)
          const firstSegment = relativePath.split('/')[0]
          if (firstSegment) {
            children.add(firstSegment)
          }
        }
      }
      
      return Ok(Array.from(children))
    }),

    readFile: vi.fn().mockImplementation(async (path: string) => {
      const error = checkSimulatedError('readFile', path)
      if (error) return Err(error)
      
      const normalized = normalizePath(path)
      const content = mockFiles.get(normalized)
      
      if (content === undefined) {
        return Err({
          type: 'FileSystemError',
          message: `File not found: ${path}`,
          path
        })
      }
      
      return Ok(content)
    }),

    writeFile: vi.fn().mockImplementation(async (path: string, content: string) => {
      const error = checkSimulatedError('writeFile', path)
      if (error) return Err(error)
      
      const normalized = normalizePath(path)
      mockFiles.set(normalized, content)
      
      // Ensure parent directory exists
      const parentDir = dirname(normalized)
      if (parentDir !== '.' && parentDir !== normalized) {
        mockDirs.add(parentDir)
      }
      
      return Ok(undefined)
    }),

    readJson: vi.fn().mockImplementation(async (path: string) => {
      const error = checkSimulatedError('readJson', path)
      if (error) return Err(error)
      
      const fileResult = await mockFs.readFile(path)
      if (!fileResult.success) {
        return fileResult
      }
      
      try {
        const parsed = JSON.parse(fileResult.value)
        return Ok(parsed)
      } catch {
        return Err({
          type: 'FileSystemError',
          message: `Invalid JSON in file: ${path}`,
          path
        })
      }
    }),

    writeJson: vi.fn().mockImplementation(async (path: string, data: any) => {
      const error = checkSimulatedError('writeJson', path)
      if (error) return Err(error)
      
      try {
        const content = JSON.stringify(data, null, 2)
        return await mockFs.writeFile(path, content)
      } catch {
        return Err({
          type: 'FileSystemError',
          message: `Failed to stringify JSON for: ${path}`,
          path
        })
      }
    }),

    copy: vi.fn().mockImplementation(async (src: string, dest: string) => {
      const error = checkSimulatedError('copy', src) || checkSimulatedError('copy', dest)
      if (error) return Err(error)
      
      const srcResult = await mockFs.readFile(src)
      if (!srcResult.success) {
        return srcResult
      }
      
      return await mockFs.writeFile(dest, srcResult.value)
    }),

    ensureDir: vi.fn().mockImplementation(async (path: string) => {
      const error = checkSimulatedError('ensureDir', path)
      if (error) return Err(error)
      
      const normalized = normalizePath(path)
      mockDirs.add(normalized)
      
      // Also ensure parent directories exist
      const parts = normalized.split('/').filter(Boolean)
      for (let i = 1; i <= parts.length; i++) {
        const parentPath = parts.slice(0, i).join('/')
        mockDirs.add(parentPath)
      }
      
      return Ok(undefined)
    }),

    stat: vi.fn().mockImplementation(async (path: string) => {
      const error = checkSimulatedError('stat', path)
      if (error) return Err(error)
      
      const normalized = normalizePath(path)
      const isFile = mockFiles.has(normalized)
      const isDirectory = mockDirs.has(normalized)
      
      if (!isFile && !isDirectory) {
        return Err({
          type: 'FileSystemError',
          message: `Path not found: ${path}`,
          path
        })
      }
      
      return Ok({
        isFile,
        isDirectory
      })
    }),

    remove: vi.fn().mockImplementation(async (path: string) => {
      const error = checkSimulatedError('remove', path)
      if (error) return Err(error)
      
      const normalized = normalizePath(path)
      
      // Remove file if it exists
      if (mockFiles.has(normalized)) {
        mockFiles.delete(normalized)
      }
      
      // Remove directory and all children
      if (mockDirs.has(normalized)) {
        mockDirs.delete(normalized)
        
        // Remove all files and subdirectories within this directory
        const prefix = normalized.endsWith('/') ? normalized : normalized + '/'
        
        for (const filePath of Array.from(mockFiles.keys())) {
          if (filePath.startsWith(prefix)) {
            mockFiles.delete(filePath)
          }
        }
        
        for (const dirPath of Array.from(mockDirs.keys())) {
          if (dirPath.startsWith(prefix)) {
            mockDirs.delete(dirPath)
          }
        }
      }
      
      return Ok(undefined)
    })
  }

  return mockFs
}

/**
 * Creates a mock filesystem pre-populated with common test directory structure
 */
export function createTestMockFileSystem(projectRoot = '/test/project'): ReturnType<typeof createMockFileSystem> {
  const normalizedRoot = normalizeMockPath(projectRoot)
  
  return createMockFileSystem({
    initialDirectories: [
      normalizedRoot,
      join(normalizedRoot, 'src'),
      join(normalizedRoot, 'src/components'),
      join(normalizedRoot, 'src/components/lib'),
      join(normalizedRoot, 'components'),
      join(normalizedRoot, 'components/th'),
      join(normalizedRoot, 'components/th/lib'),
      join(normalizedRoot, 'node_modules'),
    ],
    initialFiles: {
      [join(normalizedRoot, 'package.json')]: JSON.stringify({
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          react: '^18.0.0',
          'react-dom': '^18.0.0'
        }
      }, null, 2)
    }
  })
}

/**
 * Helper for creating mock filesystem with Catalyst components
 */
export function createCatalystMockFileSystem(
  trailheadRoot = '/trailhead',
  projectRoot = '/test/project'
): ReturnType<typeof createMockFileSystem> {
  const mockFs = createTestMockFileSystem(projectRoot)
  
  // Add Catalyst source files
  const catalystComponents = [
    'button.tsx',
    'alert.tsx',
    'badge.tsx',
    'dialog.tsx',
    'input.tsx',
    'table.tsx'
  ]
  
  catalystComponents.forEach(component => {
    const componentName = basename(component, '.tsx')
    const catalystName = `Catalyst${componentName.charAt(0).toUpperCase()}${componentName.slice(1)}`
    
    mockFs.addFile(
      join(trailheadRoot, 'src/components/lib', `catalyst-${component}`),
      `export function ${catalystName}() { return <div>Catalyst ${componentName}</div> }`
    )
    
    mockFs.addFile(
      join(trailheadRoot, 'src/components', component),
      `export * from './lib/catalyst-${component}.js'`
    )
  })
  
  // Add index files
  mockFs.addFile(
    join(trailheadRoot, 'src/components/lib/index.ts'),
    catalystComponents.map(c => `export * from './catalyst-${c.replace('.tsx', '')}.js'`).join('\n')
  )
  
  mockFs.addFile(
    join(trailheadRoot, 'src/components/index.ts'),
    catalystComponents.map(c => `export * from './${c.replace('.tsx', '')}.js'`).join('\n')
  )
  
  return mockFs
}

