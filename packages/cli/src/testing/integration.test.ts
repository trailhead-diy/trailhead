/**
 * Cross-package composition integration tests
 * Tests how testing utilities work together across different packages
 */

import { describe, test, expect } from 'vitest'
import { ok, err } from '@esteban-url/core'
import { setupResultMatchers, createTestError } from '@esteban-url/core/testing'
import { createMockFileSystem } from '@esteban-url/fs/testing'

// Setup cross-package matchers
setupResultMatchers()

describe('Cross-Package Testing Composition', () => {
  test('should compose core and filesystem testing utilities', async () => {
    const mockFs = createMockFileSystem({
      '/project/package.json': '{"name": "test"}',
      '/project/src/index.ts': 'export default "hello"',
    })

    // Test filesystem operations with Result types
    const content = mockFs.getFileContent('/project/package.json')
    const packageJsonResult = content
      ? ok(content)
      : err(createTestError('FILE_NOT_FOUND', 'File not found'))
    expect(packageJsonResult).toBeOk()
    expect(packageJsonResult).toHaveValue('{"name": "test"}')

    // Test with error case
    const missingContent = mockFs.getFileContent('/project/missing.txt')
    const missingResult = missingContent
      ? ok(missingContent)
      : err(createTestError('FILE_NOT_FOUND', 'File not found'))
    expect(missingResult).toBeErr()
    expect(missingResult).toHaveErrorCode('FILE_NOT_FOUND')
  })

  test('should work with error handling across utilities', () => {
    const errors = [
      createTestError('VALIDATION_ERROR', 'Invalid input'),
      createTestError('FS_ERROR', 'File not found'),
      createTestError('NETWORK_ERROR', 'Connection failed'),
    ]

    const results = errors.map((error) => err(error))

    // Test that all results are errors
    results.forEach((result) => {
      expect(result).toBeErr()
    })

    // Test error codes
    expect(results[0]).toHaveErrorCode('VALIDATION_ERROR')
    expect(results[1]).toHaveErrorCode('FS_ERROR')
    expect(results[2]).toHaveErrorCode('NETWORK_ERROR')
  })

  test('should handle cross-package error composition', () => {
    const fsError = createTestError('FS_ERROR', 'test.txt not found')
    const networkError = createTestError('NETWORK_ERROR', 'Connection failed')

    // Test error aggregation across packages
    const errors = [fsError, networkError]
    const errorMessages = errors.map((e) => e.message)

    expect(errorMessages).toContain('test.txt not found')
    expect(errorMessages).toContain('Connection failed')
    expect(errors.length).toBe(2)
  })

  test('should support CLI workflow testing scenarios', () => {
    // Simulate a CLI workflow with filesystem operations
    const mockFs = createMockFileSystem({
      '/workspace/package.json': '{"name": "test-cli", "version": "1.0.0"}',
      '/workspace/src/index.ts': 'export default {}',
    })

    // 1. Read package.json
    const packageContent = mockFs.getFileContent('/workspace/package.json')
    const packageResult = packageContent
      ? ok(packageContent)
      : err(createTestError('FILE_NOT_FOUND', 'package.json not found'))
    expect(packageResult).toBeOk()

    // 2. Parse and validate package data
    const packageData = JSON.parse(packageResult.value)
    expect(packageData.name).toBe('test-cli')
    expect(packageData.version).toBe('1.0.0')

    // 3. Check that source files exist
    expect(mockFs.exists('/workspace/src/index.ts')).toBe(true)

    // 4. Verify complete workflow
    const allFiles = mockFs.getAllFiles()
    const filePaths = Object.keys(allFiles)

    // Normalize paths to handle both Unix and Windows formats
    // On Windows, paths may have backslashes and drive letters
    const hasPackageJson = filePaths.some((path) =>
      path.replace(/\\/g, '/').endsWith('/workspace/package.json')
    )
    const hasIndexTs = filePaths.some((path) =>
      path.replace(/\\/g, '/').endsWith('/workspace/src/index.ts')
    )

    expect(hasPackageJson).toBe(true)
    expect(hasIndexTs).toBe(true)
  })
})
