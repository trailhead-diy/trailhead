/**
 * Tests for git mock operations to ensure they work correctly
 */
import { describe, test, expect, beforeEach } from 'vitest'
import { setupResultMatchers } from '@esteban-url/core/testing'
import { createMockGit, createTestRepository } from './index.js'

// Setup Result matchers for testing
setupResultMatchers()

describe('Git Mock Operations', () => {
  let mockGit: ReturnType<typeof createMockGit>

  beforeEach(() => {
    mockGit = createMockGit()
  })

  describe('Basic Operations', () => {
    test('should initialize successfully', async () => {
      const result = await mockGit.init()
      expect(result).toBeOk()
    })

    test('should add files to staging', async () => {
      const result = await mockGit.add(['file1.txt', 'file2.txt'])
      expect(result).toBeOk()

      const statusResult = await mockGit.status()
      expect(statusResult).toBeOk()
      expect(statusResult.value.staged.length).toBe(2)
    })

    test('should commit with generated hash', async () => {
      await mockGit.add(['file1.txt'])

      const result = await mockGit.commit('Initial commit')
      expect(result).toBeOk()
      expect(result.value).toMatch(/^commit-\d+-[a-z0-9]+$/)
    })

    test('should track commit history', async () => {
      await mockGit.add(['file1.txt'])
      await mockGit.commit('First commit')
      await mockGit.add(['file2.txt'])
      await mockGit.commit('Second commit')

      const logResult = await mockGit.log()
      expect(logResult).toBeOk()
      expect(logResult.value.length).toBe(2)
      expect(logResult.value[0].message).toBe('Second commit')
      expect(logResult.value[1].message).toBe('First commit')
    })
  })

  describe('Branch Operations', () => {
    test('should create new branches', async () => {
      const result = await mockGit.branch('feature-branch')
      expect(result).toBeOk()
      expect(result.value).toContain('feature-branch')
    })

    test('should checkout existing branch', async () => {
      await mockGit.branch('feature-branch')

      const result = await mockGit.checkout('feature-branch')
      expect(result).toBeOk()

      const statusResult = await mockGit.status()
      expect(statusResult).toBeOk()
      expect(statusResult.value.branch).toBe('feature-branch')
    })

    test('should fail to checkout non-existent branch', async () => {
      const result = await mockGit.checkout('non-existent')
      expect(result).toBeErr()
      expect(result.error.code).toBe('BRANCH_NOT_FOUND')
    })

    test('should merge branches', async () => {
      await mockGit.branch('feature-branch')

      const result = await mockGit.merge('feature-branch')
      expect(result).toBeOk()
    })

    test('should fail to merge non-existent branch', async () => {
      const result = await mockGit.merge('non-existent')
      expect(result).toBeErr()
      expect(result.error.code).toBe('BRANCH_NOT_FOUND')
    })
  })

  describe('Tag Operations', () => {
    test('should create tags', async () => {
      const result = await mockGit.tag('v1.0.0', 'Release version 1.0.0')
      expect(result).toBeOk()
    })

    test('should create tags without message', async () => {
      const result = await mockGit.tag('v1.0.1')
      expect(result).toBeOk()
    })
  })

  describe('Status Operations', () => {
    test('should return clean status initially', async () => {
      const result = await mockGit.status()
      expect(result).toBeOk()
      expect(result.value.clean).toBe(true)
      expect(result.value.staged.length).toBe(0)
      expect(result.value.modified.length).toBe(0)
      expect(result.value.untracked.length).toBe(0)
    })

    test('should show staged files in status', async () => {
      await mockGit.add(['file1.txt', 'file2.txt'])

      const result = await mockGit.status()
      expect(result).toBeOk()
      expect(result.value.clean).toBe(false)
      expect(result.value.staged.length).toBe(2)
      expect(result.value.staged[0].path).toBe('file1.txt')
      expect(result.value.staged[0].status).toBe('added')
    })

    test('should include current branch in status', async () => {
      await mockGit.branch('feature-branch')
      await mockGit.checkout('feature-branch')

      const result = await mockGit.status()
      expect(result).toBeOk()
      expect(result.value.branch).toBe('feature-branch')
    })
  })

  describe('Log Operations', () => {
    test('should limit log entries', async () => {
      // Create multiple commits
      for (let i = 0; i < 5; i++) {
        await mockGit.add([`file${i}.txt`])
        await mockGit.commit(`Commit ${i}`)
      }

      const result = await mockGit.log({ maxCount: 3 })
      expect(result).toBeOk()
      expect(result.value.length).toBe(3)
    })

    test('should return all commits when no limit specified', async () => {
      for (let i = 0; i < 3; i++) {
        await mockGit.add([`file${i}.txt`])
        await mockGit.commit(`Commit ${i}`)
      }

      const result = await mockGit.log()
      expect(result).toBeOk()
      expect(result.value.length).toBe(3)
    })
  })
})

describe('Test Repository', () => {
  test('should create test repository with proper structure', async () => {
    const repo = await createTestRepository({
      name: 'test-repo',
      author: { name: 'Test Author', email: 'test@example.com', date: new Date() },
    })

    expect(repo.path).toContain('test-repo')
    expect(repo.gitDir).toContain('.git')
  })

  test('should add files and commit', async () => {
    const repo = await createTestRepository()

    await repo.addFile('README.md', '# Test Project')
    const hash = await repo.commit('Initial commit')

    expect(hash).toMatch(/^commit-\d+-[a-z0-9]+$/)

    const retrievedHash = await repo.getCommitHash('Initial commit')
    expect(retrievedHash).toBe(hash)
  })

  test('should manage branches', async () => {
    const repo = await createTestRepository()

    await repo.createBranch('feature-branch')
    await repo.checkoutBranch('feature-branch')

    // Should not throw
    expect(true).toBe(true)
  })

  test('should handle branch checkout errors', async () => {
    const repo = await createTestRepository()

    await expect(repo.checkoutBranch('non-existent')).rejects.toThrow(
      "Branch 'non-existent' does not exist"
    )
  })

  test('should manage tags', async () => {
    const repo = await createTestRepository()

    await repo.addTag('v1.0.0', 'Release version')

    // Should not throw
    expect(true).toBe(true)
  })

  test('should cleanup repository state', async () => {
    const repo = await createTestRepository()

    await repo.addFile('test.txt', 'content')
    await repo.commit('Test commit')
    await repo.createBranch('test-branch')

    await repo.cleanup()

    // After cleanup, should be back to initial state
    const hash = await repo.getCommitHash('Test commit')
    expect(hash).toBeNull()
  })
})
