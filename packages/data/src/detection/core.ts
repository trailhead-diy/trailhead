import { ok, err } from '@trailhead/core'
import { readFile } from '@trailhead/cli/fs'
import { fileTypeFromBuffer } from 'file-type'
import path from 'node:path'
import type {
  DetectionConfig,
  FormatResult,
  DetectionResult,
  FileFormatInfo,
} from '../formats-types.js'
import { defaultDetectionConfig, type CreateDetectionOperations } from './types.js'
import { FORMAT_DATABASE } from './database.js'
import {
  createDetectionError,
  createInvalidBufferError,
  mapFileError,
  mapLibraryError,
} from '../formats-errors.js'

// ========================================
// Detection Core Operations
// ========================================

/**
 * Creates detection operations for identifying file formats from various sources.
 * Supports detection from buffers, files, extensions, and MIME types with configurable reliability.
 *
 * @param config - Optional detection configuration for magic number and extension detection
 * @returns Detection operations interface with format identification methods
 */
export const createDetectionOperations: CreateDetectionOperations = (config = {}) => {
  const detectionConfig = { ...defaultDetectionConfig, ...config }

  const detectFromBuffer = async (
    buffer: Buffer,
    options: DetectionConfig = {}
  ): Promise<FormatResult<DetectionResult>> => {
    try {
      const mergedOptions = { ...detectionConfig, ...options }

      if (!buffer || buffer.length === 0) {
        return err(createInvalidBufferError())
      }

      // Try magic number detection first (most reliable)
      if (mergedOptions.useMagicNumbers) {
        const magicResult = detectFromMagicNumbers(buffer, mergedOptions)
        if (magicResult.isOk()) {
          return magicResult
        }
      }

      // Fallback to file-type library
      return await detectWithFileType(buffer, mergedOptions)
    } catch (error) {
      return err(mapLibraryError('Detection', 'detectFromBuffer', error))
    }
  }

  const detectFromFile = async (
    filePath: string,
    options: DetectionConfig = {}
  ): Promise<FormatResult<DetectionResult>> => {
    try {
      const mergedOptions = { ...detectionConfig, ...options }

      // Try extension-based detection first if enabled
      if (mergedOptions.useFileExtension) {
        const extensionResult = detectFromExtension(path.extname(filePath), mergedOptions)
        if (extensionResult.isOk()) {
          return ok({
            format: extensionResult.value,
            source: 'file-extension',
            reliability: 'medium',
          })
        }
      }

      // Read file buffer for content analysis
      const fileOps = readFile()
      const fileResult = await fileOps(filePath)
      if (fileResult.isErr()) {
        return err(mapFileError('read', filePath, fileResult.error))
      }

      // Use first part of file for detection
      const buffer = Buffer.from(fileResult.value, 'binary').subarray(0, mergedOptions.bufferSize)
      return detectFromBuffer(buffer, mergedOptions)
    } catch (error) {
      return err(mapFileError('detect', filePath, error))
    }
  }

  const detectFromExtension = (
    extension: string,
    _options: DetectionConfig = {}
  ): FormatResult<FileFormatInfo> => {
    try {
      if (!extension) {
        return err(createDetectionError('No file extension provided', {}))
      }

      const normalizedExt = extension.toLowerCase().startsWith('.')
        ? extension.toLowerCase()
        : `.${extension.toLowerCase()}`

      const extensionMapping = FORMAT_DATABASE.extensions.find(
        (mapping) => mapping.extension === normalizedExt
      )

      if (!extensionMapping) {
        return err(
          createDetectionError(`Unknown file extension: ${extension}`, {
            details: `Extension "${extension}" not found in format database`,
            context: { extension, normalizedExt },
          })
        )
      }

      return ok(extensionMapping.format)
    } catch (error) {
      return err(mapLibraryError('Detection', 'detectFromExtension', error))
    }
  }

  const detectFromMime = (
    mimeType: string,
    _options: DetectionConfig = {}
  ): FormatResult<FileFormatInfo> => {
    try {
      if (!mimeType) {
        return err(createDetectionError('No MIME type provided', {}))
      }

      const normalizedMime = mimeType.toLowerCase().split(';')[0].trim()
      const format = FORMAT_DATABASE.mimeTypes.get(normalizedMime)

      if (!format) {
        return err(
          createDetectionError(`Unknown MIME type: ${mimeType}`, {
            details: `MIME type "${mimeType}" not found in format database`,
            context: { mimeType, normalizedMime },
          })
        )
      }

      return ok(format)
    } catch (error) {
      return err(mapLibraryError('Detection', 'detectFromMime', error))
    }
  }

  const detectBatch = async (
    files: string[],
    options: DetectionConfig = {}
  ): Promise<FormatResult<DetectionResult[]>> => {
    try {
      const results: DetectionResult[] = []
      const errors: unknown[] = []

      for (const file of files) {
        const result = await detectFromFile(file, options)
        if (result.isOk()) {
          results.push(result.value)
        } else {
          errors.push(result.error)
          if (!options.enableExtensionFallback) {
            return err(result.error)
          }
        }
      }

      if (results.length === 0 && errors.length > 0) {
        return err(
          createDetectionError('Batch detection failed', {
            details: `Failed to detect formats for all ${files.length} files`,
            cause: errors[0],
            context: { fileCount: files.length, errorCount: errors.length },
          })
        )
      }

      return ok(results)
    } catch (error) {
      return err(mapLibraryError('Detection', 'detectBatch', error))
    }
  }

  return {
    detectFromBuffer,
    detectFromFile,
    detectFromExtension,
    detectFromMime,
    detectBatch,
  }
}

// ========================================
// Helper Functions
// ========================================

/**
 * Detects file format from magic number signatures in buffer.
 * Provides high-reliability detection based on file content analysis.
 *
 * @param buffer - Buffer containing file data to analyze
 * @param _config - Detection configuration (currently unused)
 * @returns Result with detected format or error
 */
const detectFromMagicNumbers = (
  buffer: Buffer,
  _config: DetectionConfig
): FormatResult<DetectionResult> => {
  for (const pattern of FORMAT_DATABASE.magicNumbers) {
    if (matchesMagicPattern(buffer, pattern)) {
      return ok({
        format: pattern.format,
        source: 'magic-numbers',
        reliability: 'high',
      })
    }
  }

  return err(
    createDetectionError('No magic number pattern matched', {
      details: 'File content does not match any known magic number signatures',
      context: { bufferLength: buffer.length },
    })
  )
}

/**
 * Checks if buffer matches a specific magic number pattern.
 * Applies optional bit mask for flexible pattern matching.
 *
 * @param buffer - Buffer to check against pattern
 * @param pattern - Magic number pattern with signature and offset
 * @returns True if buffer matches the pattern
 */
const matchesMagicPattern = (
  buffer: Buffer,
  pattern: (typeof FORMAT_DATABASE.magicNumbers)[0]
): boolean => {
  const { signature, offset, mask } = pattern

  if (buffer.length < offset + signature.length) {
    return false
  }

  for (let i = 0; i < signature.length; i++) {
    const bufferByte = buffer[offset + i]
    const signatureByte = signature[i]

    if (mask) {
      const maskByte = mask[i]
      if ((bufferByte & maskByte) !== (signatureByte & maskByte)) {
        return false
      }
    } else {
      if (bufferByte !== signatureByte) {
        return false
      }
    }
  }

  return true
}

/**
 * Detects file format using the file-type library.
 * Provides medium-reliability detection as a fallback method.
 *
 * @param buffer - Buffer containing file data to analyze
 * @param _config - Detection configuration (currently unused)
 * @returns Result with detected format or error
 */
const detectWithFileType = async (
  buffer: Buffer,
  _config: DetectionConfig
): Promise<FormatResult<DetectionResult>> => {
  try {
    const fileTypeResult = await fileTypeFromBuffer(buffer)

    if (!fileTypeResult) {
      return err(
        createDetectionError('Unknown file format', {
          details: 'File content could not be identified by any detection method',
          context: { bufferLength: buffer.length },
        })
      )
    }

    // Map file-type result to our format structure
    const format: FileFormatInfo = {
      ext: fileTypeResult.ext,
      mime: fileTypeResult.mime,
      description: `${fileTypeResult.ext.toUpperCase()} file`,
      category: categorizeFromMime(fileTypeResult.mime),
      confidence: 0.8, // file-type library is generally reliable
    }

    return ok({
      format,
      source: 'content-analysis',
      reliability: 'medium',
    })
  } catch (error) {
    return err(mapLibraryError('file-type', 'detectWithFileType', error))
  }
}

/**
 * Categorizes a file format based on its MIME type.
 * Maps MIME types to high-level categories like image, video, document, etc.
 *
 * @param mimeType - MIME type string to categorize
 * @returns Format category classification
 */
const categorizeFromMime = (mimeType: string): FileFormatInfo['category'] => {
  const [type] = mimeType.split('/')

  switch (type) {
    case 'image':
      return 'image'
    case 'video':
      return 'video'
    case 'audio':
      return 'audio'
    case 'text':
      return 'document'
    case 'application':
      if (
        mimeType.includes('zip') ||
        mimeType.includes('archive') ||
        mimeType.includes('compressed')
      ) {
        return 'archive'
      }
      if (
        mimeType.includes('pdf') ||
        mimeType.includes('document') ||
        mimeType.includes('office')
      ) {
        return 'document'
      }
      if (mimeType.includes('json') || mimeType.includes('xml') || mimeType.includes('yaml')) {
        return 'data'
      }
      if (mimeType.includes('executable') || mimeType.includes('exe')) {
        return 'executable'
      }
      return 'document'
    case 'font':
      return 'font'
    default:
      return 'unknown'
  }
}
