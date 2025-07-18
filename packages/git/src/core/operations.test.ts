import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createGitOperations } from './operations.js'

describe('Git Core Operations', () => {
  let tempDir: string
  let gitOps: ReturnType<typeof createGitOperations>

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'git-test-'))
    gitOps = createGitOperations()
  })

  afterEach(async () => {
    try {
      await rm(tempDir, { recursive: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  describe('init', () => {
    it('should initialize a new Git repository', async () => {
      const result = await gitOps.init(tempDir)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const repo = result.value
        expect(repo.path).toBe(tempDir)
        expect(repo.isValid).toBe(true)
        expect(repo.workingDirectory).toContain(tempDir.split('/').pop())
      }
    })

    it('should initialize a bare repository', async () => {
      const result = await gitOps.init(tempDir, { bare: true })

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const repo = result.value
        expect(repo.isValid).toBe(true)
      }
    })

    it('should initialize with custom branch', async () => {
      const result = await gitOps.init(tempDir, { branch: 'main' })

      expect(result.isOk()).toBe(true)
    })
  })

  describe('isRepository', () => {
    it('should return false for non-repository directory', async () => {
      const result = await gitOps.isRepository(tempDir)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe(false)
      }
    })

    it('should return true for initialized repository', async () => {
      await gitOps.init(tempDir)
      const result = await gitOps.isRepository(tempDir)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe(true)
      }
    })
  })

  describe('open', () => {
    it('should open an existing repository', async () => {
      await gitOps.init(tempDir)
      const result = await gitOps.open(tempDir)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const repo = result.value
        expect(repo.path).toBe(tempDir)
        expect(repo.isValid).toBe(true)
      }
    })

    it('should fail to open non-repository', async () => {
      const result = await gitOps.open(tempDir)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.code).toBe('NOT_A_REPOSITORY')
      }
    })
  })

  describe('getRepository', () => {
    it('should get repository info', async () => {
      await gitOps.init(tempDir)
      const result = await gitOps.getRepository(tempDir)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const repo = result.value
        expect(repo.path).toBe(tempDir)
        expect(repo.isValid).toBe(true)
        expect(repo.workingDirectory).toContain(tempDir.split('/').pop())
      }
    })
  })

  describe('clone', () => {
    it('should handle clone errors gracefully', async () => {
      const result = await gitOps.clone('invalid-url', tempDir)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.code).toBe('CLONE_FAILED')
      }
    })
  })
})
