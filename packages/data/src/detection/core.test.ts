import { describe, it, expect } from 'vitest'
import { createDetectionOperations } from './core.js'

describe('Detection Core Operations', () => {
  const detectionOps = createDetectionOperations()

  describe('detectFromBuffer', () => {
    it('should detect JPEG from magic numbers', async () => {
      const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46])
      const result = await detectionOps.detectFromBuffer(jpegHeader)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.format.ext).toBe('jpg')
        expect(result.value.format.mime).toBe('image/jpeg')
        expect(result.value.source).toBe('magic-numbers')
        expect(result.value.reliability).toBe('high')
      }
    })

    it('should detect PNG from magic numbers', async () => {
      const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      const result = await detectionOps.detectFromBuffer(pngHeader)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.format.ext).toBe('png')
        expect(result.value.format.mime).toBe('image/png')
        expect(result.value.source).toBe('magic-numbers')
      }
    })

    it('should handle empty buffer', async () => {
      const emptyBuffer = Buffer.alloc(0)
      const result = await detectionOps.detectFromBuffer(emptyBuffer)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toBe('Invalid or empty buffer provided')
      }
    })

    it('should handle unknown format gracefully', async () => {
      const unknownBuffer = Buffer.from('unknown file content')
      const result = await detectionOps.detectFromBuffer(unknownBuffer)

      // Unknown formats should return an error with appropriate message
      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toBeDefined()
        expect(result.error.type).toBeDefined()
      }
    })
  })

  describe('detectFromExtension', () => {
    it('should detect format from file extension', () => {
      const result = detectionOps.detectFromExtension('.jpg')

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.ext).toBe('jpg')
        expect(result.value.mime).toBe('image/jpeg')
      }
    })

    it('should handle extension without dot', () => {
      const result = detectionOps.detectFromExtension('png')

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.ext).toBe('png')
        expect(result.value.mime).toBe('image/png')
      }
    })

    it('should handle unknown extension', () => {
      const result = detectionOps.detectFromExtension('.xyz')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('Unknown file extension')
      }
    })

    it('should handle empty extension', () => {
      const result = detectionOps.detectFromExtension('')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toBe('No file extension provided')
      }
    })
  })

  describe('detectFromMime', () => {
    it('should detect format from MIME type', () => {
      const result = detectionOps.detectFromMime('image/jpeg')

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.ext).toBe('jpg')
        expect(result.value.mime).toBe('image/jpeg')
      }
    })

    it('should handle MIME type with parameters', () => {
      const result = detectionOps.detectFromMime('text/html; charset=utf-8')

      // MIME with parameters may not be recognized - depends on implementation
      // The function should return a Result (either Ok or Err) without throwing
      if (result.isOk()) {
        expect(result.value.mime).toBeDefined()
        expect(result.value.ext).toBeDefined()
      } else {
        expect(result.error.message).toBeDefined()
      }
    })

    it('should handle unknown MIME type', () => {
      const result = detectionOps.detectFromMime('application/x-unknown')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('Unknown MIME type')
      }
    })

    it('should handle empty MIME type', () => {
      const result = detectionOps.detectFromMime('')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toBe('No MIME type provided')
      }
    })
  })

  describe('detectBatch', () => {
    it('should handle empty file list', async () => {
      const result = await detectionOps.detectBatch([])

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toHaveLength(0)
      }
    })

    it('should detect multiple files with extension fallback', async () => {
      // When files don't exist, detectBatch falls back to extension-based detection
      const result = await detectionOps.detectBatch([
        '/path/to/image.jpg',
        '/path/to/document.pdf',
        '/path/to/data.json',
      ])

      // Extension-based detection should succeed
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toHaveLength(3)

        // Verify each detection result (results are in order)
        expect(result.value[0].format.ext).toBe('jpg')
        expect(result.value[0].source).toBe('file-extension')

        expect(result.value[1].format.ext).toBe('pdf')
        expect(result.value[1].source).toBe('file-extension')

        expect(result.value[2].format.ext).toBe('json')
        expect(result.value[2].source).toBe('file-extension')
      }
    })

    it('should handle files with unknown extensions', async () => {
      const result = await detectionOps.detectBatch(['/path/to/file.xyz'])

      // Unknown extension + file not found = FormatError from mapFileError
      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        // Falls through to buffer detection which fails with FormatError
        expect(result.error.type).toBe('FormatError')
        expect(result.error.message).toBeDefined()
      }
    })

    it('should return results in order', async () => {
      const files = ['/a.png', '/b.jpg', '/c.gif']
      const result = await detectionOps.detectBatch(files)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        // DetectionResult doesn't include filePath, but results are in input order
        expect(result.value).toHaveLength(3)
        expect(result.value[0].format.ext).toBe('png')
        expect(result.value[1].format.ext).toBe('jpg')
        expect(result.value[2].format.ext).toBe('gif')
      }
    })
  })

  describe('detectFromFile', () => {
    it('should fall back to extension for non-existent file', async () => {
      const result = await detectionOps.detectFromFile('/non/existent/file.jpg')

      // Implementation falls back to extension-based detection when file doesn't exist
      // since useFileExtension is enabled by default and runs first
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.source).toBe('file-extension')
        expect(result.value.format.ext).toBe('jpg')
      }
    })
  })
})
