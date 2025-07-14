import { ok, err } from '@esteban-url/core'
import type { FormatResult, ConversionInfo, ConversionQuality, FileCategory } from '../types.js'
import type { CreateConversionOperations } from './types.js'
import { CONVERSION_CATEGORIES } from './types.js'
import { createConversionError, createUnsupportedFormatError, mapLibraryError } from '../errors.js'

// ========================================
// Conversion Core Operations
// ========================================

export const createConversionOperations: CreateConversionOperations = (_config = {}) => {
  const checkConversion = (fromFormat: string, toFormat: string): FormatResult<ConversionInfo> => {
    try {
      if (!fromFormat || !toFormat) {
        return err(createConversionError('Both source and target formats are required'))
      }

      const normalizedFrom = normalizeFormat(fromFormat)
      const normalizedTo = normalizeFormat(toFormat)

      if (normalizedFrom === normalizedTo) {
        return ok({
          fromFormat: normalizedFrom,
          toFormat: normalizedTo,
          supported: true,
          quality: 'lossless',
        })
      }

      const conversionRule = findConversionRule(normalizedFrom, normalizedTo)

      if (!conversionRule) {
        return ok({
          fromFormat: normalizedFrom,
          toFormat: normalizedTo,
          supported: false,
          quality: 'lossy',
        })
      }

      return ok({
        fromFormat: normalizedFrom,
        toFormat: normalizedTo,
        supported: conversionRule.supported,
        quality: conversionRule.quality,
        options: conversionRule.options,
      })
    } catch (error) {
      return err(mapLibraryError('Conversion', 'checkConversion', error))
    }
  }

  const getSupportedFormats = (category?: FileCategory): FormatResult<readonly string[]> => {
    try {
      if (!category) {
        // Return all supported formats
        const allFormats = Object.values(CONVERSION_CATEGORIES).flat()
        return ok([...new Set(allFormats)])
      }

      const formats = getSupportedFormatsForCategory(category)
      return ok(formats)
    } catch (error) {
      return err(mapLibraryError('Conversion', 'getSupportedFormats', error))
    }
  }

  const getConversionChain = (
    fromFormat: string,
    toFormat: string
  ): FormatResult<readonly string[]> => {
    try {
      const normalizedFrom = normalizeFormat(fromFormat)
      const normalizedTo = normalizeFormat(toFormat)

      if (normalizedFrom === normalizedTo) {
        return ok([normalizedFrom])
      }

      // Try direct conversion first
      const directRule = findConversionRule(normalizedFrom, normalizedTo)
      if (directRule?.supported) {
        return ok([normalizedFrom, normalizedTo])
      }

      // Try to find conversion chain through intermediate formats
      const chain = findConversionChain(normalizedFrom, normalizedTo)
      if (chain.length > 0) {
        return ok(chain)
      }

      return err(
        createUnsupportedFormatError(`${normalizedFrom} → ${normalizedTo}`, 'conversion chain')
      )
    } catch (error) {
      return err(mapLibraryError('Conversion', 'getConversionChain', error))
    }
  }

  const estimateConversionQuality = (
    fromFormat: string,
    toFormat: string
  ): FormatResult<ConversionQuality> => {
    try {
      const normalizedFrom = normalizeFormat(fromFormat)
      const normalizedTo = normalizeFormat(toFormat)

      if (normalizedFrom === normalizedTo) {
        return ok('lossless')
      }

      const rule = findConversionRule(normalizedFrom, normalizedTo)
      if (rule) {
        return ok(rule.quality)
      }

      // Estimate based on format categories
      const fromCategory = getFormatCategory(normalizedFrom)
      const toCategory = getFormatCategory(normalizedTo)

      if (fromCategory === toCategory) {
        // Same category conversions are usually lossy but acceptable
        return ok('lossy')
      }

      // Cross-category conversions are typically transcoding
      return ok('transcode')
    } catch (error) {
      return err(mapLibraryError('Conversion', 'estimateConversionQuality', error))
    }
  }

  return {
    checkConversion,
    getSupportedFormats,
    getConversionChain,
    estimateConversionQuality,
  }
}

// ========================================
// Helper Functions
// ========================================

const normalizeFormat = (format: string): string => {
  return format.toLowerCase().replace(/^\./, '')
}

const findConversionRule = (
  fromFormat: string,
  toFormat: string
): Omit<ConversionInfo, 'fromFormat' | 'toFormat'> | null => {
  // This is a simplified conversion matrix
  // In a real implementation, this would be a comprehensive database
  const rules: Record<string, Record<string, Omit<ConversionInfo, 'fromFormat' | 'toFormat'>>> = {
    // Image conversions
    jpg: {
      png: { supported: true, quality: 'lossy' },
      webp: { supported: true, quality: 'lossy' },
      bmp: { supported: true, quality: 'lossless' },
      tiff: { supported: true, quality: 'lossless' },
    },
    png: {
      jpg: { supported: true, quality: 'lossy' },
      webp: { supported: true, quality: 'lossy' },
      gif: { supported: true, quality: 'lossy' },
      bmp: { supported: true, quality: 'lossless' },
    },

    // Document conversions
    doc: {
      docx: { supported: true, quality: 'lossless' },
      pdf: { supported: true, quality: 'lossy' },
      txt: { supported: true, quality: 'lossy' },
    },
    docx: {
      doc: { supported: true, quality: 'lossy' },
      pdf: { supported: true, quality: 'lossy' },
      txt: { supported: true, quality: 'lossy' },
    },

    // Data conversions
    json: {
      xml: { supported: true, quality: 'lossless' },
      yaml: { supported: true, quality: 'lossless' },
      csv: { supported: true, quality: 'lossy' },
    },
    xml: {
      json: { supported: true, quality: 'lossy' },
      yaml: { supported: true, quality: 'lossless' },
    },

    // Audio conversions
    wav: {
      mp3: { supported: true, quality: 'lossy' },
      flac: { supported: true, quality: 'lossless' },
      aac: { supported: true, quality: 'lossy' },
    },
    flac: {
      wav: { supported: true, quality: 'lossless' },
      mp3: { supported: true, quality: 'lossy' },
    },

    // Video conversions
    mp4: {
      avi: { supported: true, quality: 'transcode' },
      mov: { supported: true, quality: 'transcode' },
      webm: { supported: true, quality: 'transcode' },
    },
  }

  return rules[fromFormat]?.[toFormat] || null
}

const findConversionChain = (fromFormat: string, toFormat: string): string[] => {
  // Simplified chain finding - would use proper graph algorithms in production
  const intermediateFormats = getCommonIntermediateFormats(fromFormat, toFormat)

  for (const intermediate of intermediateFormats) {
    const fromToIntermediate = findConversionRule(fromFormat, intermediate)
    const intermediateToTarget = findConversionRule(intermediate, toFormat)

    if (fromToIntermediate?.supported && intermediateToTarget?.supported) {
      return [fromFormat, intermediate, toFormat]
    }
  }

  return []
}

const getCommonIntermediateFormats = (fromFormat: string, toFormat: string): string[] => {
  const fromCategory = getFormatCategory(fromFormat)
  const toCategory = getFormatCategory(toFormat)

  if (fromCategory === 'image' && toCategory === 'image') {
    return ['png'] // PNG as universal intermediate for images
  }

  if (fromCategory === 'document' && toCategory === 'document') {
    return ['pdf', 'txt'] // PDF or plain text as intermediates
  }

  if (fromCategory === 'data' && toCategory === 'data') {
    return ['json'] // JSON as universal data intermediate
  }

  return []
}

const getFormatCategory = (format: string): string => {
  for (const [category, formats] of Object.entries(CONVERSION_CATEGORIES)) {
    if ((formats as readonly string[]).includes(format)) {
      return category
    }
  }
  return 'unknown'
}

const getSupportedFormatsForCategory = (category: FileCategory): readonly string[] => {
  switch (category) {
    case 'image':
      return [...CONVERSION_CATEGORIES.IMAGE_RASTER, ...CONVERSION_CATEGORIES.IMAGE_VECTOR]
    case 'video':
      return CONVERSION_CATEGORIES.VIDEO
    case 'audio':
      return CONVERSION_CATEGORIES.AUDIO
    case 'document':
      return [...CONVERSION_CATEGORIES.DOCUMENT_TEXT, ...CONVERSION_CATEGORIES.DOCUMENT_OFFICE]
    case 'archive':
      return CONVERSION_CATEGORIES.ARCHIVE
    case 'data':
      return CONVERSION_CATEGORIES.DATA
    default:
      return []
  }
}
