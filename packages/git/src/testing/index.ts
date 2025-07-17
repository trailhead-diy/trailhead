/**
 * @esteban-url/git/testing
 *
 * Git-specific testing utilities for repository operations, commit testing, and Git workflows.
 * Provides domain-focused utilities for testing Git operations and repository states.
 *
 * ## Features
 * - **High-fidelity mocks**: Realistic git operation simulation with proper state management
 * - **Result-based testing**: All operations return proper Result types for explicit error handling
 * - **Comprehensive coverage**: Support for branches, commits, tags, status, and more
 * - **Test repository management**: Easy creation and cleanup of test repositories
 * - **Cross-package integration**: Works seamlessly with other Trailhead testing utilities
 *
 * @example
 * ```typescript
 * import {
 *   createTestRepository,
 *   gitFixtures,
 *   assertCommitExists,
 *   createMockGit,
 * } from '@esteban-url/git/testing'
 *
 * // Create test repository
 * const repo = await createTestRepository()
 * await repo.addFile('README.md', '# Test Project')
 * await repo.commit('Initial commit')
 *
 * // Mock git operations with Result types
 * const mockGit = createMockGit()
 * const result = await mockGit.status()
 * expect(result).toBeOk()
 * expect(result.value.clean).toBe(true)
 *
 * // Test git operations with proper error handling
 * const checkoutResult = await mockGit.checkout('non-existent-branch')
 * expect(checkoutResult).toBeErr()
 * expect(checkoutResult.error.code).toBe('BRANCH_NOT_FOUND')
 * ```
 */

import { ok, err, type Result } from '@esteban-url/core'
import type { CoreError } from '@esteban-url/core'
import type { GitError, GitCommit, GitStatus, GitPerson } from '../types.js'
import {
  createInitialMockState,
  createBranchNotFoundError,
  createMockCommit,
  createMockStatus,
  addBranch,
  branchExists,
  switchBranch,
  addCommit,
  getCommitHistory,
  stageFiles,
  addTag,
  resetMockState,
} from './mock-helpers.js'

// ========================================
// Git Test Repository Management
// ========================================

export interface TestRepository {
  readonly path: string
  readonly gitDir: string
  addFile(filePath: string, content: string): Promise<void>
  commit(message: string, author?: GitPerson): Promise<string>
  createBranch(branchName: string): Promise<void>
  checkoutBranch(branchName: string): Promise<void>
  addTag(tagName: string, message?: string): Promise<void>
  getCommitHash(message: string): Promise<string | null>
  cleanup(): Promise<void>
}

/**
 * Creates a temporary test Git repository
 */
export async function createTestRepository(
  options: {
    name?: string
    author?: GitPerson
  } = {}
): Promise<TestRepository> {
  const {
    name = 'test-repo',
    author = { name: 'Test User', email: 'test@example.com', date: new Date() },
  } = options

  // Implementation would create actual git repo
  const tempPath = `/tmp/git-test-${Date.now()}-${name}`
  const gitDir = `${tempPath}/.git`

  const commits: Array<{ hash: string; message: string }> = []
  const files = new Map<string, string>()
  const branches = ['main']
  let currentBranch = 'main'
  const tags = new Map<string, string>()

  return {
    path: tempPath,
    gitDir,

    async addFile(filePath: string, content: string): Promise<void> {
      // Mock implementation - simulates adding file to git staging area
      const relativePath = filePath.startsWith('/') ? filePath.slice(1) : filePath
      files.set(relativePath, content)
    },

    async commit(message: string, commitAuthor?: GitPerson): Promise<string> {
      const hash = `commit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      commits.push({ hash, message })
      return hash
    },

    async createBranch(branchName: string): Promise<void> {
      // Mock implementation - simulates creating git branch
      if (!branches.includes(branchName)) {
        branches.push(branchName)
      }
    },

    async checkoutBranch(branchName: string): Promise<void> {
      // Mock implementation - simulates checking out git branch
      if (branches.includes(branchName)) {
        currentBranch = branchName
      } else {
        throw new Error(`Branch '${branchName}' does not exist`)
      }
    },

    async addTag(tagName: string, tagMessage?: string): Promise<void> {
      // Mock implementation - simulates creating git tag
      tags.set(tagName, tagMessage || '')
    },

    async getCommitHash(message: string): Promise<string | null> {
      const commit = commits.find((c) => c.message === message)
      return commit?.hash || null
    },

    async cleanup(): Promise<void> {
      // Mock implementation - simulates cleaning up repository state
      files.clear()
      commits.length = 0
      branches.length = 0
      branches.push('main')
      currentBranch = 'main'
      tags.clear()
    },
  }
}

// ========================================
// Git Fixtures and Test Data
// ========================================

export const gitFixtures = {
  /**
   * Sample commit messages for testing
   */
  commitMessages: {
    initial: 'Initial commit',
    feature: 'feat: add new feature',
    fix: 'fix: resolve critical bug',
    docs: 'docs: update README',
    refactor: 'refactor: improve code structure',
  },

  /**
   * Sample file structures for repositories
   */
  repositoryStructures: {
    simple: {
      'README.md': '# Simple Project\n\nA simple test project.',
      'package.json': JSON.stringify({ name: 'simple-project', version: '1.0.0' }, null, 2),
    },

    complex: {
      'README.md': '# Complex Project\n\nA complex test project.',
      'src/index.ts': 'export { main } from "./main.js"',
      'src/main.ts': 'export function main() { console.log("Hello!") }',
      'tests/main.test.ts': 'import { main } from "../src/main.js"',
      'package.json': JSON.stringify(
        {
          name: 'complex-project',
          version: '1.0.0',
          scripts: { test: 'vitest' },
        },
        null,
        2
      ),
    },
  },

  /**
   * Sample authors for commits
   */
  authors: {
    developer: { name: 'Jane Developer', email: 'jane@example.com' },
    maintainer: { name: 'John Maintainer', email: 'john@example.com' },
    bot: { name: 'Bot User', email: 'bot@ci.example.com' },
  },
}

// ========================================
// Git Operation Mocking
// ========================================

export interface MockGitOperations {
  init: () => Promise<Result<void, GitError>>
  add: (files: string[]) => Promise<Result<void, GitError>>
  commit: (message: string, author?: GitPerson) => Promise<Result<string, GitError>>
  branch: (branchName?: string) => Promise<Result<string[], GitError>>
  checkout: (branchName: string) => Promise<Result<void, GitError>>
  merge: (branchName: string) => Promise<Result<void, GitError>>
  tag: (tagName: string, message?: string) => Promise<Result<void, GitError>>
  log: (options?: { maxCount?: number }) => Promise<Result<GitCommit[], GitError>>
  status: () => Promise<Result<GitStatus, GitError>>
}

/**
 * Creates mock Git operations for testing
 */
export function createMockGit(): MockGitOperations {
  const mockState = createInitialMockState()

  return {
    async init(): Promise<Result<void, GitError>> {
      return ok(undefined)
    },

    async add(files: string[]): Promise<Result<void, GitError>> {
      stageFiles(mockState, files)
      return ok(undefined)
    },

    async commit(message: string, author?: GitPerson): Promise<Result<string, GitError>> {
      const commit = createMockCommit(message, author)
      addCommit(mockState, commit)
      return ok(commit.sha)
    },

    async branch(branchName?: string): Promise<Result<string[], GitError>> {
      if (branchName) {
        addBranch(mockState, branchName)
      }
      return ok([...mockState.branches])
    },

    async checkout(branchName: string): Promise<Result<void, GitError>> {
      if (!branchExists(mockState, branchName)) {
        return err(createBranchNotFoundError(branchName, 'checkout'))
      }
      switchBranch(mockState, branchName)
      return ok(undefined)
    },

    async merge(branchName: string): Promise<Result<void, GitError>> {
      if (!branchExists(mockState, branchName)) {
        return err(createBranchNotFoundError(branchName, 'merge'))
      }
      return ok(undefined)
    },

    async tag(tagName: string, message?: string): Promise<Result<void, GitError>> {
      addTag(mockState, tagName, message || '')
      return ok(undefined)
    },

    async log(options?: { maxCount?: number }): Promise<Result<GitCommit[], GitError>> {
      const commits = getCommitHistory(mockState, options?.maxCount)
      return ok(commits)
    },

    async status(): Promise<Result<GitStatus, GitError>> {
      return ok(createMockStatus(mockState))
    },
  }
}

// ========================================
// Git-Specific Assertions
// ========================================

/**
 * Asserts that a commit exists in the repository
 */
export function assertCommitExists(
  result: Result<Array<{ message: string; hash: string }>, CoreError>,
  expectedMessage: string
): void {
  if (result.isErr()) {
    throw new Error(`Expected commit history but got error: ${result.error.message}`)
  }

  const commits = result.value
  const commit = commits.find((c) => c.message === expectedMessage)

  if (!commit) {
    const messages = commits.map((c) => c.message).join(', ')
    throw new Error(
      `Expected commit with message "${expectedMessage}" not found. Found: ${messages}`
    )
  }
}

/**
 * Asserts that a branch exists
 */
export function assertBranchExists(result: Result<string[], CoreError>, branchName: string): void {
  if (result.isErr()) {
    throw new Error(`Expected branch list but got error: ${result.error.message}`)
  }

  if (!result.value.includes(branchName)) {
    throw new Error(`Expected branch "${branchName}" not found. Found: ${result.value.join(', ')}`)
  }
}

/**
 * Asserts that a tag exists
 */
export function assertTagExists(result: Result<string[], CoreError>, tagName: string): void {
  if (result.isErr()) {
    throw new Error(`Expected tag list but got error: ${result.error.message}`)
  }

  if (!result.value.includes(tagName)) {
    throw new Error(`Expected tag "${tagName}" not found. Found: ${result.value.join(', ')}`)
  }
}

/**
 * Asserts that the repository is clean (no uncommitted changes)
 */
export function assertRepositoryClean(
  result: Result<{ clean: boolean; files: string[] }, CoreError>
): void {
  if (result.isErr()) {
    throw new Error(`Expected repository status but got error: ${result.error.message}`)
  }

  if (!result.value.clean) {
    throw new Error(
      `Expected clean repository but found uncommitted files: ${result.value.files.join(', ')}`
    )
  }
}

// ========================================
// Git Workflow Helpers
// ========================================

/**
 * Creates a complete workflow for testing Git operations
 */
export async function createGitWorkflow(
  options: {
    repositoryName?: string
    initialFiles?: Record<string, string>
    author?: GitPerson
  } = {}
): Promise<{
  repository: TestRepository
  addAndCommit: (files: Record<string, string>, message: string) => Promise<string>
  createFeatureBranch: (branchName: string, files: Record<string, string>) => Promise<void>
  mergeToMain: (branchName: string) => Promise<void>
  cleanup: () => Promise<void>
}> {
  const repository = await createTestRepository({
    name: options.repositoryName,
    author: options.author,
  })

  // Add initial files if provided
  if (options.initialFiles) {
    for (const [filePath, content] of Object.entries(options.initialFiles)) {
      await repository.addFile(filePath, content)
    }
    await repository.commit('Initial commit')
  }

  return {
    repository,

    async addAndCommit(files: Record<string, string>, message: string): Promise<string> {
      for (const [filePath, content] of Object.entries(files)) {
        await repository.addFile(filePath, content)
      }
      return repository.commit(message)
    },

    async createFeatureBranch(branchName: string, files: Record<string, string>): Promise<void> {
      await repository.createBranch(branchName)
      await repository.checkoutBranch(branchName)

      for (const [filePath, content] of Object.entries(files)) {
        await repository.addFile(filePath, content)
      }
      await repository.commit(`feat: add ${branchName} feature`)
    },

    async mergeToMain(branchName: string): Promise<void> {
      await repository.checkoutBranch('main')
      // Mock merge operation
    },

    async cleanup(): Promise<void> {
      await repository.cleanup()
    },
  }
}

// ========================================
// Export Collections
// ========================================

/**
 * Git testing utilities grouped by functionality
 */
export const gitTesting = {
  // Repository management
  createTestRepository,
  createGitWorkflow,

  // Fixtures and test data
  fixtures: gitFixtures,

  // Mocking
  createMockGit,

  // Assertions
  assertCommitExists,
  assertBranchExists,
  assertTagExists,
  assertRepositoryClean,
}
