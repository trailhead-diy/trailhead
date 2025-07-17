/**
 * Helper functions for git mock operations
 * Extracted for better code organization and reusability
 */

import { ok, err } from '@esteban-url/core'
import type { GitError, GitCommit, GitStatus, GitPerson } from '../types.js'

// ========================================
// Mock State Management
// ========================================

export interface MockGitState {
  branches: string[]
  currentBranch: string
  commits: GitCommit[]
  stagedFiles: string[]
  unstagedFiles: string[]
  untrackedFiles: string[]
  tags: Map<string, string>
}

export function createInitialMockState(): MockGitState {
  return {
    branches: ['main'],
    currentBranch: 'main',
    commits: [],
    stagedFiles: [],
    unstagedFiles: [],
    untrackedFiles: [],
    tags: new Map(),
  }
}

// ========================================
// Hash Generation
// ========================================

export function generateCommitHash(): string {
  return `commit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// ========================================
// Git Error Factories
// ========================================

export function createBranchNotFoundError(branchName: string, operation: string): GitError {
  return {
    type: 'GitError',
    code: 'BRANCH_NOT_FOUND',
    message: `Branch '${branchName}' does not exist`,
    recoverable: true,
    component: 'git',
    operation,
    timestamp: new Date(),
    severity: 'medium' as const,
  }
}

// ========================================
// Git Object Factories
// ========================================

export function createMockCommit(message: string, author?: GitPerson, sha?: string): GitCommit {
  const defaultAuthor: GitPerson = author || {
    name: 'Test User',
    email: 'test@example.com',
    date: new Date(),
  }

  return {
    sha: sha || generateCommitHash(),
    message,
    author: defaultAuthor,
    committer: defaultAuthor,
    date: new Date(),
    parents: [],
  }
}

export function createMockStatus(state: MockGitState): GitStatus {
  return {
    branch: state.currentBranch,
    commit: state.commits[state.commits.length - 1]?.sha || 'HEAD',
    ahead: 0,
    behind: 0,
    staged: state.stagedFiles.map((file) => ({ path: file, status: 'added' as const })),
    modified: state.unstagedFiles.map((file) => ({ path: file, status: 'modified' as const })),
    untracked: [...state.untrackedFiles],
    clean:
      state.stagedFiles.length === 0 &&
      state.unstagedFiles.length === 0 &&
      state.untrackedFiles.length === 0,
  }
}

// ========================================
// Branch Operations
// ========================================

export function addBranch(state: MockGitState, branchName: string): void {
  if (!state.branches.includes(branchName)) {
    state.branches.push(branchName)
  }
}

export function branchExists(state: MockGitState, branchName: string): boolean {
  return state.branches.includes(branchName)
}

export function switchBranch(state: MockGitState, branchName: string): void {
  if (branchExists(state, branchName)) {
    state.currentBranch = branchName
  } else {
    throw createBranchNotFoundError(branchName, 'checkout')
  }
}

// ========================================
// Commit Operations
// ========================================

export function addCommit(state: MockGitState, commit: GitCommit): void {
  state.commits.push(commit)
  state.stagedFiles = [] // Clear staged files after commit
}

export function getCommitHistory(state: MockGitState, maxCount?: number): GitCommit[] {
  const commits = [...state.commits].reverse()
  return maxCount ? commits.slice(0, maxCount) : commits
}

// ========================================
// File Operations
// ========================================

export function stageFiles(state: MockGitState, files: string[]): void {
  state.stagedFiles.push(...files)
}

export function clearStagedFiles(state: MockGitState): void {
  state.stagedFiles = []
}

// ========================================
// Tag Operations
// ========================================

export function addTag(state: MockGitState, tagName: string, message: string = ''): void {
  state.tags.set(tagName, message)
}

export function getTag(state: MockGitState, tagName: string): string | undefined {
  return state.tags.get(tagName)
}

// ========================================
// State Reset
// ========================================

export function resetMockState(state: MockGitState): void {
  state.branches = ['main']
  state.currentBranch = 'main'
  state.commits = []
  state.stagedFiles = []
  state.unstagedFiles = []
  state.untrackedFiles = []
  state.tags.clear()
}
