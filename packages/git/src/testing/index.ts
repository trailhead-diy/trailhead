/**
 * @esteban-url/git/testing
 *
 * Git-specific testing utilities for repository operations, commit testing, and Git workflows.
 * Provides domain-focused utilities for testing Git operations and repository states.
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
 * // Test git operations
 * const result = await gitOperations.getCommitHistory(repo.path)
 * assertCommitExists(result, 'Initial commit')
 * ```
 */

import { ok, err, type Result } from '@esteban-url/core'
import type { CoreError } from '@esteban-url/core'

// ========================================
// Git Test Repository Management
// ========================================

export interface TestRepository {
  readonly path: string
  readonly gitDir: string
  addFile(filePath: string, content: string): Promise<void>
  commit(message: string, author?: GitAuthor): Promise<string>
  createBranch(branchName: string): Promise<void>
  checkoutBranch(branchName: string): Promise<void>
  addTag(tagName: string, message?: string): Promise<void>
  getCommitHash(message: string): Promise<string | null>
  cleanup(): Promise<void>
}

export interface GitAuthor {
  name: string
  email: string
}

/**
 * Creates a temporary test Git repository
 */
export async function createTestRepository(
  options: {
    name?: string
    author?: GitAuthor
  } = {}
): Promise<TestRepository> {
  const { name = 'test-repo', author = { name: 'Test User', email: 'test@example.com' } } = options

  // Implementation would create actual git repo
  const tempPath = `/tmp/git-test-${Date.now()}-${name}`
  const gitDir = `${tempPath}/.git`

  const commits: Array<{ hash: string; message: string }> = []

  return {
    path: tempPath,
    gitDir,

    async addFile(filePath: string, content: string): Promise<void> {
      // Mock implementation - would use fs to create file
      // await fs.writeFile(path.join(tempPath, filePath), content)
    },

    async commit(message: string, commitAuthor?: GitAuthor): Promise<string> {
      const hash = `commit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      commits.push({ hash, message })
      return hash
    },

    async createBranch(branchName: string): Promise<void> {
      // Mock implementation - would create git branch
    },

    async checkoutBranch(branchName: string): Promise<void> {
      // Mock implementation - would checkout branch
    },

    async addTag(tagName: string, tagMessage?: string): Promise<void> {
      // Mock implementation - would create git tag
    },

    async getCommitHash(message: string): Promise<string | null> {
      const commit = commits.find((c) => c.message === message)
      return commit?.hash || null
    },

    async cleanup(): Promise<void> {
      // Mock implementation - would remove temp directory
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
  init: any
  add: any
  commit: any
  branch: any
  checkout: any
  merge: any
  tag: any
  log: any
  status: any
}

/**
 * Creates mock Git operations for testing
 */
export function createMockGit(): MockGitOperations {
  // Simple mock functions that return Result types
  const mockFn = (returnValue: any) => () => Promise.resolve(returnValue)

  return {
    init: mockFn(ok(undefined)),
    add: mockFn(ok(undefined)),
    commit: mockFn(ok('abc123')),
    branch: mockFn(ok(undefined)),
    checkout: mockFn(ok(undefined)),
    merge: mockFn(ok(undefined)),
    tag: mockFn(ok(undefined)),
    log: mockFn(ok([])),
    status: mockFn(ok({ clean: true, files: [] })),
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
    author?: GitAuthor
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
