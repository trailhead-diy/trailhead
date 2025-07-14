import { ok, err } from '@esteban-url/core'
import * as mimeTypes from 'mime-types'
import type { MimeConfig, FormatResult, MimeTypeInfo, FileCategory } from '../types.js'
import type { CreateMimeOperations } from './types.js'
import { defaultMimeConfig, MIME_TYPE_CATEGORIES } from './types.js'
import { createMimeError, createInvalidMimeTypeError, mapLibraryError } from '../errors.js'

// ========================================
// MIME Core Operations
// ========================================

export const createMimeOperations: CreateMimeOperations = (config = {}) => {
  const mimeConfig = { ...defaultMimeConfig, ...config }

  const getMimeType = (
    input: string | Buffer,
    options: MimeConfig = {}
  ): FormatResult<MimeTypeInfo> => {
    try {
      const mergedOptions = { ...mimeConfig, ...options }

      let mimeType: string | false

      if (Buffer.isBuffer(input)) {
        // For buffers, we need to detect from content
        // This is a simplified approach - in practice you'd use file-type or similar
        mimeType = mergedOptions.defaultMimeType
      } else {
        // For strings (file paths/extensions), use mime-types library
        mimeType = mimeTypes.lookup(input)
      }

      if (!mimeType) {
        mimeType = mergedOptions.defaultMimeType
      }

      return parseMimeType(mimeType, mergedOptions)
    } catch (error) {
      return err(mapLibraryError('mime-types', 'getMimeType', error))
    }
  }

  const getExtensions = (
    mimeType: string,
    _options: MimeConfig = {}
  ): FormatResult<readonly string[]> => {
    try {
      if (!mimeType) {
        return err(createMimeError('MIME type is required'))
      }

      const normalizedMimeType = normalizeMimeTypeString(mimeType)
      const extension = mimeTypes.extension(normalizedMimeType)

      if (!extension) {
        return ok([])
      }

      // Get all known extensions for this MIME type
      const allExtensions = Object.keys(mimeTypes.types).filter(
        (ext) => mimeTypes.types[ext] === normalizedMimeType
      )

      return ok(allExtensions)
    } catch (error) {
      return err(mapLibraryError('mime-types', 'getExtensions', error))
    }
  }

  const isMimeType = (mimeType: string, category: FileCategory): FormatResult<boolean> => {
    try {
      if (!mimeType) {
        return err(createMimeError('MIME type is required'))
      }

      const normalizedMimeType = normalizeMimeTypeString(mimeType)
      const categoryMimeTypes = MIME_TYPE_CATEGORIES[category] || []

      const isMatch =
        categoryMimeTypes.includes(normalizedMimeType) ||
        categoryMimeTypes.some((catMime) =>
          normalizedMimeType.startsWith(catMime.split('/')[0] + '/')
        )

      return ok(isMatch)
    } catch (error) {
      return err(mapLibraryError('MIME', 'isMimeType', error))
    }
  }

  const normalizeMimeType = (mimeType: string): FormatResult<string> => {
    try {
      if (!mimeType) {
        return err(createMimeError('MIME type is required'))
      }

      const normalized = normalizeMimeTypeString(mimeType)
      return ok(normalized)
    } catch (error) {
      return err(mapLibraryError('MIME', 'normalizeMimeType', error))
    }
  }

  const parseMimeType = (
    mimeType: string,
    options: MimeConfig = {}
  ): FormatResult<MimeTypeInfo> => {
    try {
      if (!mimeType) {
        return err(createMimeError('MIME type is required'))
      }

      const parsed = parseMimeTypeString(mimeType)
      if (parsed.isErr()) {
        return err(parsed.error)
      }

      const { type, subtype, parameters } = parsed.value
      const fullMimeType = `${type}/${subtype}`

      // Get extensions for this MIME type
      const extensionsResult = getExtensions(fullMimeType, options)
      const extensions = extensionsResult.isOk() ? extensionsResult.value : []

      // Determine category
      const category = categorizeMimeType(fullMimeType)

      // Check if compressible
      const compressible = isCompressibleMimeType(fullMimeType)

      const mimeTypeInfo: MimeTypeInfo = {
        type,
        subtype,
        full: fullMimeType,
        extensions,
        charset: parameters.charset || options.charset,
        compressible,
        category,
      }

      return ok(mimeTypeInfo)
    } catch (error) {
      return err(mapLibraryError('MIME', 'parseMimeType', error))
    }
  }

  return {
    getMimeType,
    getExtensions,
    isMimeType,
    normalizeMimeType,
    parseMimeType,
  }
}

// ========================================
// Helper Functions
// ========================================

const normalizeMimeTypeString = (mimeType: string): string => {
  return mimeType.toLowerCase().split(';')[0].trim()
}

const parseMimeTypeString = (
  mimeType: string
): FormatResult<{
  type: string
  subtype: string
  parameters: Record<string, string>
}> => {
  const mimePattern = /^([a-z]+)\/([a-z0-9][a-z0-9!#$&\-^]*)((?:\s*;\s*[a-z0-9-]+=[a-z0-9-]+)*)$/i
  const match = mimeType.match(mimePattern)

  if (!match) {
    return err(createInvalidMimeTypeError(mimeType))
  }

  const [, type, subtype, paramString] = match
  const parameters: Record<string, string> = {}

  if (paramString) {
    const paramPattern = /;\s*([a-z0-9-]+)=([a-z0-9-]+)/gi
    let paramMatch
    while ((paramMatch = paramPattern.exec(paramString)) !== null) {
      parameters[paramMatch[1].toLowerCase()] = paramMatch[2]
    }
  }

  return ok({
    type: type.toLowerCase(),
    subtype: subtype.toLowerCase(),
    parameters,
  })
}

const categorizeMimeType = (mimeType: string): FileCategory => {
  for (const [category, mimeTypes] of Object.entries(MIME_TYPE_CATEGORIES)) {
    if (mimeTypes.includes(mimeType)) {
      return category as FileCategory
    }
  }

  // Fallback to type-based categorization
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
    case 'font':
      return 'font'
    case 'application':
      if (mimeType.includes('zip') || mimeType.includes('archive')) {
        return 'archive'
      }
      if (mimeType.includes('javascript') || mimeType.includes('json')) {
        return 'code'
      }
      if (mimeType.includes('pdf') || mimeType.includes('document')) {
        return 'document'
      }
      return 'data'
    default:
      return 'unknown'
  }
}

const isCompressibleMimeType = (mimeType: string): boolean => {
  const [type, subtype] = mimeType.split('/')

  // Text-based formats are generally compressible
  if (type === 'text') {
    return true
  }

  // Specific application types that are compressible
  if (type === 'application') {
    const compressibleSubtypes = [
      'javascript',
      'json',
      'xml',
      'rss+xml',
      'atom+xml',
      'x-yaml',
      'x-www-form-urlencoded',
      'soap+xml',
    ]
    return compressibleSubtypes.some((sub) => subtype.includes(sub))
  }

  // SVG images are compressible
  if (mimeType === 'image/svg+xml') {
    return true
  }

  return false
}
