import { describe, it, expect } from 'vitest'
import { join } from 'path'
import { createDetectionOperations } from '../src/detection/core.js'

describe('Detection Operations Integration', () => {
  const detect = createDetectionOperations()
  const fixturesPath = join(__dirname, 'fixtures')

  describe('detectFromFile with real fixtures', () => {
    it('should detect PNG format from binary file', async () => {
      const result = await detect.detectFromFile(join(fixturesPath, 'sample.png'))

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.format.ext).toBe('png')
        expect(result.value.format.mime).toBe('image/png')
        expect(result.value.format.category).toBe('image')
        expect(['high', 'medium']).toContain(result.value.reliability)
      }
    })

    it('should detect JPEG format from binary file', async () => {
      const result = await detect.detectFromFile(join(fixturesPath, 'sample.jpg'))

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.format.ext).toBe('jpg')
        expect(result.value.format.mime).toBe('image/jpeg')
        expect(result.value.format.category).toBe('image')
      }
    })

    it('should detect CSV format from extension', async () => {
      const result = await detect.detectFromFile(join(fixturesPath, 'sample.csv'))

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.format.ext).toBe('csv')
        expect(result.value.source).toBe('file-extension')
      }
    })

    it('should detect JSON format from extension', async () => {
      const result = await detect.detectFromFile(join(fixturesPath, 'sample.json'))

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.format.ext).toBe('json')
        expect(result.value.source).toBe('file-extension')
      }
    })

    it('should detect Excel format from extension', async () => {
      const result = await detect.detectFromFile(join(fixturesPath, 'sample.xlsx'))

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.format.ext).toBe('xlsx')
        expect(result.value.source).toBe('file-extension')
      }
    })

    it('should return error for non-existent file when extension detection disabled', async () => {
      // Disable extension-based detection to force file read attempt
      const result = await detect.detectFromFile('/non/existent/file.png', {
        useFileExtension: false,
        enableExtensionFallback: false,
      })

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBeDefined()
      }
    })
  })

  describe('detectBatch with real fixtures', () => {
    it('should detect formats for multiple files', async () => {
      const files = [
        join(fixturesPath, 'sample.csv'),
        join(fixturesPath, 'sample.json'),
        join(fixturesPath, 'sample.png'),
      ]

      const result = await detect.detectBatch(files)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.length).toBe(3)
        expect(result.value[0].format.ext).toBe('csv')
        expect(result.value[1].format.ext).toBe('json')
        expect(result.value[2].format.ext).toBe('png')
      }
    })

    it('should detect formats for all binary fixtures', async () => {
      const files = [join(fixturesPath, 'sample.png'), join(fixturesPath, 'sample.jpg')]

      const result = await detect.detectBatch(files)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.length).toBe(2)
        const extensions = result.value.map((r) => r.format.ext)
        expect(extensions).toContain('png')
        expect(extensions).toContain('jpg')
      }
    })

    it('should handle mixed success/failure with fallback enabled', async () => {
      const files = [
        join(fixturesPath, 'sample.csv'),
        '/non/existent/file.xyz', // Will fail
        join(fixturesPath, 'sample.json'),
      ]

      const result = await detect.detectBatch(files, { enableExtensionFallback: true })

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        // Should have 2 successful detections (skipped the non-existent file)
        expect(result.value.length).toBe(2)
      }
    })
  })
})
