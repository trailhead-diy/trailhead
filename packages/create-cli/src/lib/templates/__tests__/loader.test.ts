import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { join } from 'path'
import { tmpdir } from 'os'
import { mkdtemp, rm, mkdir, writeFile } from 'fs/promises'
import { getTemplateFiles, resolveTemplatePaths } from '../loader.js'

describe('Template Loader', () => {
  let tempDir: string

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'template-loader-test-'))
  })

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  describe('resolveTemplatePaths', () => {
    it('should resolve paths with default configuration', () => {
      const result = resolveTemplatePaths('basic')

      expect(result.paths.base).toBeDefined()
      expect(result.paths.default).toBeDefined()
      expect(result.dirs.variant).toContain('basic')
      expect(result.dirs.shared).toContain('shared')
    })

    it('should use custom templatesDir when provided', () => {
      const customDir = '/custom/templates'
      const result = resolveTemplatePaths('advanced', { templatesDir: customDir })

      expect(result.paths.base).toBe(customDir)
      expect(result.dirs.variant).toBe(join(customDir, 'advanced'))
      expect(result.dirs.shared).toBe(join(customDir, 'shared'))
    })

    it('should use custom sharedDir when provided', () => {
      const customShared = '/custom/shared'
      const result = resolveTemplatePaths('basic', { sharedDir: customShared })

      expect(result.dirs.shared).toBe(customShared)
    })

    it('should handle different variant names', () => {
      const variants = ['basic', 'advanced', 'library', 'monorepo-package']

      for (const variant of variants) {
        const result = resolveTemplatePaths(variant)
        expect(result.dirs.variant).toContain(variant)
      }
    })
  })

  describe('getTemplateFiles', () => {
    it('should return empty array for non-existent template directory', async () => {
      const files = await getTemplateFiles('nonexistent', {
        templatesDir: join(tempDir, 'does-not-exist'),
      })

      expect(files).toEqual([])
    })

    it('should load template files from custom directory', async () => {
      // Create a mock template structure
      const templatesDir = join(tempDir, 'templates')
      const variantDir = join(templatesDir, 'test-variant')
      const sharedDir = join(templatesDir, 'shared')

      await mkdir(variantDir, { recursive: true })
      await mkdir(sharedDir, { recursive: true })

      // Create test files
      await writeFile(join(variantDir, 'package.json.hbs'), '{"name": "{{name}}"}')
      await writeFile(join(variantDir, 'README.md'), '# Test')
      await writeFile(join(sharedDir, '_gitignore'), 'node_modules')

      const files = await getTemplateFiles('test-variant', {
        templatesDir,
      })

      expect(files.length).toBeGreaterThan(0)

      // Check for variant file
      const packageFile = files.find((f) => f.destination === 'package.json')
      expect(packageFile).toBeDefined()
      expect(packageFile!.isTemplate).toBe(true)

      // Check for shared file (converted from _gitignore to .gitignore)
      const gitignoreFile = files.find((f) => f.destination === '.gitignore')
      expect(gitignoreFile).toBeDefined()
    })

    it('should filter out monorepo-specific files for non-monorepo templates', async () => {
      const templatesDir = join(tempDir, 'templates-mono')
      const variantDir = join(templatesDir, 'mono-test')

      await mkdir(variantDir, { recursive: true })

      // Create monorepo-specific files
      await writeFile(join(variantDir, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*')
      await writeFile(join(variantDir, 'turbo.json'), '{}')
      await writeFile(join(variantDir, 'index.ts'), 'export {}')

      const files = await getTemplateFiles('mono-test', { templatesDir })

      // Monorepo-specific files should be filtered out
      expect(files.find((f) => f.destination === 'pnpm-workspace.yaml')).toBeUndefined()
      expect(files.find((f) => f.destination === 'turbo.json')).toBeUndefined()

      // Regular files should be included
      expect(files.find((f) => f.destination === 'index.ts')).toBeDefined()
    })

    it('should load files from additionalDirs within templates', async () => {
      // additionalDirs must be within the templates base directory for security
      const templatesDir = join(tempDir, 'templates-additional')
      const variantDir = join(templatesDir, 'add-test')
      const additionalDir = join(templatesDir, 'extra') // Within templatesDir

      await mkdir(variantDir, { recursive: true })
      await mkdir(additionalDir, { recursive: true })

      await writeFile(join(variantDir, 'main.ts'), 'console.log("main")')
      await writeFile(join(additionalDir, 'extra.ts'), 'console.log("extra")')

      const files = await getTemplateFiles('add-test', {
        templatesDir,
        additionalDirs: [additionalDir],
      })

      expect(files.find((f) => f.destination === 'main.ts')).toBeDefined()
      expect(files.find((f) => f.destination === 'extra.ts')).toBeDefined()
    })

    it('should mark .hbs files as templates', async () => {
      const templatesDir = join(tempDir, 'templates-hbs')
      const variantDir = join(templatesDir, 'hbs-test')

      await mkdir(variantDir, { recursive: true })

      await writeFile(join(variantDir, 'config.json.hbs'), '{"key": "{{value}}"}')
      await writeFile(join(variantDir, 'static.json'), '{"static": true}')

      const files = await getTemplateFiles('hbs-test', { templatesDir })

      const templateFile = files.find((f) => f.destination === 'config.json')
      const staticFile = files.find((f) => f.destination === 'static.json')

      expect(templateFile?.isTemplate).toBe(true)
      expect(staticFile?.isTemplate).toBe(false)
    })

    it('should mark executable files correctly', async () => {
      const templatesDir = join(tempDir, 'templates-exec')
      const variantDir = join(templatesDir, 'exec-test')
      const binDir = join(variantDir, 'bin')

      await mkdir(binDir, { recursive: true })

      await writeFile(join(binDir, 'cli.js'), '#!/usr/bin/env node')
      await writeFile(join(variantDir, 'index.ts'), 'export {}')

      const files = await getTemplateFiles('exec-test', { templatesDir })

      const binFile = files.find((f) => f.destination.includes('bin/'))
      const regularFile = files.find((f) => f.destination === 'index.ts')

      expect(binFile?.executable).toBe(true)
      expect(regularFile?.executable).toBe(false)
    })

    it('should convert underscore prefix to dot files', async () => {
      const templatesDir = join(tempDir, 'templates-dot')
      const variantDir = join(templatesDir, 'dot-test')

      await mkdir(variantDir, { recursive: true })

      await writeFile(join(variantDir, '_eslintrc.json'), '{}')
      await writeFile(join(variantDir, '_prettierrc'), '{}')

      const files = await getTemplateFiles('dot-test', { templatesDir })

      expect(files.find((f) => f.destination === '.eslintrc.json')).toBeDefined()
      expect(files.find((f) => f.destination === '.prettierrc')).toBeDefined()
    })

    it('should convert DOT_ prefix to dot files', async () => {
      const templatesDir = join(tempDir, 'templates-dotprefix')
      const variantDir = join(templatesDir, 'dotprefix-test')

      await mkdir(variantDir, { recursive: true })

      await writeFile(join(variantDir, 'DOT_env'), 'KEY=value')
      await writeFile(join(variantDir, 'DOT_npmrc'), 'registry=...')

      const files = await getTemplateFiles('dotprefix-test', { templatesDir })

      expect(files.find((f) => f.destination === '.env')).toBeDefined()
      expect(files.find((f) => f.destination === '.npmrc')).toBeDefined()
    })
  })
})
