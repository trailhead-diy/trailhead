/**
 * Simple integration tests for core domain-driven testing functionality
 */

import { describe, test, expect, beforeAll } from 'vitest'
import { ok, err } from '@trailhead/core'
import {
  setupResultMatchers,
  createOkResult,
  createErrResult,
  createTestError,
} from '@trailhead/core/testing'
import { createMockFileSystem } from '@trailhead/fs/testing'

beforeAll(() => {
  setupResultMatchers()
})

describe('Core Domain-Driven Testing Integration', () => {
  test('should work with Result matchers', () => {
    const okResult = createOkResult('success')
    const errResult = createErrResult('failure')

    expect(okResult).toBeOk()
    expect(okResult).toHaveValue('success')

    expect(errResult).toBeErr()
  })

  test('should work with filesystem testing utilities', async () => {
    const mockFs = createMockFileSystem({
      '/project/package.json': '{"name": "test"}',
      '/project/src/index.ts': 'export default {}',
    })

    const content = mockFs.getFileContent('/project/package.json')
    const result = content ? ok(content) : err({ message: 'File not found' })
    expect(result).toBeOk()
    expect(result).toHaveValue('{"name": "test"}')

    // Check that both files exist
    expect(mockFs.exists('/project/package.json')).toBe(true)
    expect(mockFs.exists('/project/src/index.ts')).toBe(true)
  })

  test('should work with error creation', () => {
    const error = createTestError('VALIDATION_ERROR', 'Field required')

    expect(error.code).toBe('VALIDATION_ERROR')
    expect(error.message).toBe('Field required')
  })

  test('should demonstrate enhanced error messages', () => {
    const errResult = createErrResult(createTestError('FILE_NOT_FOUND', 'test.txt not found'))

    try {
      expect(errResult).toBeOk() // This should fail
    } catch (error) {
      expect(error.message).toContain('Expected Result to be successful')
      expect(error.message).toContain('test.txt not found')
    }
  })

  test('should verify /testing exports are accessible', async () => {
    // Test that we can import from the /testing subpath
    const { createOkResult: coreOk } = await import('@trailhead/core/testing')
    const { createMockFileSystem: fsCreate } = await import('@trailhead/fs/testing')

    expect(typeof coreOk).toBe('function')
    expect(typeof fsCreate).toBe('function')

    const result = coreOk('test')
    expect(result).toBeOk()
  })
})
