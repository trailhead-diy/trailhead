/**
 * Format detection and conversion testing utilities
 * Merged from @esteban-url/formats/testing
 */

import { ok, err, type Result } from '@esteban-url/core'
import type { CoreError } from '@esteban-url/core'

// ========================================
// Format Types and Interfaces
// ========================================

export type SupportedFormat =
  | 'json'
  | 'yaml'
  | 'csv'
  | 'xml'
  | 'toml'
  | 'ini'
  | 'properties'
  | 'markdown'
  | 'text'

export interface FormatDetectionResult {
  format: SupportedFormat
  confidence: number
  metadata?: Record<string, any>
}

export interface FormatConversionOptions {
  preserveComments?: boolean
  indent?: number | string
  encoding?: string
  csvDelimiter?: string
  csvQuote?: string
  csvEscape?: string
}

export interface MockFormatDetector {
  detectFormat(filePath: string): Promise<Result<FormatDetectionResult, CoreError>>
  detectFormatFromContent(
    content: string,
    fileName?: string
  ): Result<FormatDetectionResult, CoreError>
  addCustomDetector(format: SupportedFormat, detector: (content: string) => boolean): void
}

// ========================================
// Format Detection Mocking
// ========================================

/**
 * Creates a mock format detector for testing
 */
export function createMockFormatDetector(): MockFormatDetector {
  const customDetectors = new Map<SupportedFormat, (content: string) => boolean>()

  return {
    async detectFormat(filePath: string): Promise<Result<FormatDetectionResult, CoreError>> {
      const extension = filePath.split('.').pop()?.toLowerCase()

      const formatMap: Record<string, SupportedFormat> = {
        json: 'json',
        yaml: 'yaml',
        yml: 'yaml',
        csv: 'csv',
        xml: 'xml',
        toml: 'toml',
        ini: 'ini',
        properties: 'properties',
        md: 'markdown',
        txt: 'text',
      }

      const format = formatMap[extension || '']
      if (format) {
        return ok({
          format,
          confidence: 0.9,
          metadata: { detectedBy: 'extension' },
        })
      }

      return err({
        type: 'FormatError',
        code: 'UNKNOWN_FORMAT',
        message: `Cannot detect format for file: ${filePath}`,
        recoverable: true,
        component: 'formats',
        operation: 'format-detection',
        timestamp: new Date(),
        severity: 'medium' as const,
      } satisfies CoreError)
    },

    detectFormatFromContent(
      content: string,
      _fileName?: string
    ): Result<FormatDetectionResult, CoreError> {
      // Try custom detectors first
      for (const [format, detector] of customDetectors) {
        if (detector(content)) {
          return ok({
            format,
            confidence: 0.8,
            metadata: { detectedBy: 'custom' },
          })
        }
      }

      // Simple content-based detection
      const trimmed = content.trim()

      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        return ok({ format: 'json', confidence: 0.7, metadata: { detectedBy: 'content' } })
      }

      if (trimmed.includes('---') || /^[a-zA-Z_][a-zA-Z0-9_]*:\s/.test(trimmed)) {
        return ok({ format: 'yaml', confidence: 0.6, metadata: { detectedBy: 'content' } })
      }

      if (trimmed.includes(',') && trimmed.includes('\n')) {
        return ok({ format: 'csv', confidence: 0.5, metadata: { detectedBy: 'content' } })
      }

      if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
        return ok({ format: 'xml', confidence: 0.7, metadata: { detectedBy: 'content' } })
      }

      return ok({ format: 'text', confidence: 0.3, metadata: { detectedBy: 'fallback' } })
    },

    addCustomDetector(format: SupportedFormat, detector: (content: string) => boolean): void {
      customDetectors.set(format, detector)
    },
  }
}

// ========================================
// Format Test Fixtures
// ========================================

export const formatFixtures = {
  json: {
    simple: JSON.stringify({ name: 'test', value: 42 }, null, 2),
    complex: JSON.stringify(
      {
        users: [
          { id: 1, name: 'Alice', email: 'alice@example.com' },
          { id: 2, name: 'Bob', email: 'bob@example.com' },
        ],
        settings: { debug: true, theme: 'dark' },
      },
      null,
      2
    ),
    invalid: '{ "name": "test", invalid json }',
  },

  yaml: {
    simple: `name: test\nvalue: 42\n`,
    complex: `
users:
  - id: 1
    name: Alice
    email: alice@example.com
  - id: 2
    name: Bob
    email: bob@example.com
settings:
  debug: true
  theme: dark
`,
    invalid: `name: test\n  invalid: yaml: content`,
  },

  csv: {
    simple: `name,age,email\nAlice,30,alice@example.com\nBob,25,bob@example.com`,
    withQuotes: `"name","age","email"\n"Alice Smith",30,"alice@example.com"\n"Bob Jones",25,"bob@example.com"`,
    withCommas: `name,description,value\nTest,"A test item, with comma",42\nOther,"Another item",100`,
    invalid: `name,age,email\nAlice,30\nBob,25,bob@example.com,extra`,
  },

  xml: {
    simple: `<?xml version="1.0"?>\n<root>\n  <name>test</name>\n  <value>42</value>\n</root>`,
    complex: `<?xml version="1.0"?>
<users>
  <user id="1">
    <name>Alice</name>
    <email>alice@example.com</email>
  </user>
  <user id="2">
    <name>Bob</name>
    <email>bob@example.com</email>
  </user>
</users>`,
    invalid: `<root><name>test</value></root>`,
  },

  toml: {
    simple: `name = "test"\nvalue = 42\n`,
    complex: `
[database]
server = "192.168.1.1"
ports = [ 8001, 8001, 8002 ]
connection_max = 5000
enabled = true

[servers]
  [servers.alpha]
  ip = "10.0.0.1"
  dc = "eqdc10"
`,
    invalid: `name = "test\nvalue = 42`,
  },

  ini: {
    simple: `[section]\nname=test\nvalue=42\n`,
    complex: `
[database]
server=192.168.1.1
port=5432
user=admin

[cache]
enabled=true
ttl=3600
`,
    invalid: `[section\nname=test`,
  },

  markdown: {
    simple: `# Test Document\n\nThis is a test.`,
    complex: `# API Documentation

## Overview

This API provides access to user data.

### Endpoints

- \`GET /users\` - List all users
- \`POST /users\` - Create a user

### Example

\`\`\`json
{
  "name": "Alice",
  "email": "alice@example.com"
}
\`\`\`
`,
  },
}

// ========================================
// Format Conversion Testing
// ========================================

/**
 * Test format conversion between two formats
 */
export async function testFormatConversion(
  sourceContent: string,
  sourceFormat: SupportedFormat,
  targetFormat: SupportedFormat,
  options: FormatConversionOptions = {}
): Promise<Result<string, CoreError>> {
  // Mock conversion logic - in real implementation this would use actual converters
  try {
    // Simple mock conversion
    if (sourceFormat === 'json' && targetFormat === 'yaml') {
      const data = JSON.parse(sourceContent)
      // Mock YAML conversion
      return ok(`# Converted from JSON\ndata: ${JSON.stringify(data)}`)
    }

    if (sourceFormat === 'csv' && targetFormat === 'json') {
      const lines = sourceContent.split('\n')
      const headers = lines[0].split(',')
      const rows = lines.slice(1).map((line) => {
        const values = line.split(',')
        const row: Record<string, string> = {}
        headers.forEach((header, index) => {
          row[header] = values[index] || ''
        })
        return row
      })
      return ok(JSON.stringify(rows, null, options.indent || 2))
    }

    // Default: return source content with comment
    return ok(`# Converted from ${sourceFormat} to ${targetFormat}\n${sourceContent}`)
  } catch (error) {
    return err({
      type: 'FormatError',
      code: 'CONVERSION_FAILED',
      message: `Failed to convert from ${sourceFormat} to ${targetFormat}: ${error}`,
      recoverable: false,
      component: 'formats',
      operation: 'format-conversion',
      timestamp: new Date(),
      severity: 'high' as const,
    } satisfies CoreError)
  }
}

// ========================================
// Format Validation Testing
// ========================================

/**
 * Validates content against a specific format
 */
export function validateFormat(
  content: string,
  format: SupportedFormat
): Result<{ valid: boolean; errors: string[] }, CoreError> {
  const errors: string[] = []

  try {
    switch (format) {
      case 'json':
        JSON.parse(content)
        break

      case 'csv':
        const lines = content.split('\n')
        if (lines.length < 2) {
          errors.push('CSV must have at least header and one data row')
        }
        const headerCount = lines[0].split(',').length
        for (let i = 1; i < lines.length; i++) {
          const rowCount = lines[i].split(',').length
          if (rowCount !== headerCount) {
            errors.push(`Row ${i + 1} has ${rowCount} columns, expected ${headerCount}`)
          }
        }
        break

      case 'xml':
        if (!content.includes('<') || !content.includes('>')) {
          errors.push('XML must contain tags')
        }
        break

      default:
        // Other formats would have their own validation
        break
    }

    return ok({ valid: errors.length === 0, errors })
  } catch (error) {
    errors.push(`Format validation failed: ${error}`)
    return ok({ valid: false, errors })
  }
}

// ========================================
// Format Testing Assertions
// ========================================

/**
 * Asserts that format detection succeeded with expected format
 */
export function assertFormatDetection(
  result: Result<FormatDetectionResult, CoreError>,
  expectedFormat: SupportedFormat,
  minimumConfidence: number = 0.5
): void {
  if (result.isErr()) {
    throw new Error(`Expected format detection to succeed, but got error: ${result.error.message}`)
  }

  const detection = result.value
  if (detection.format !== expectedFormat) {
    throw new Error(`Expected format "${expectedFormat}", but detected "${detection.format}"`)
  }

  if (detection.confidence < minimumConfidence) {
    throw new Error(`Expected confidence >= ${minimumConfidence}, but got ${detection.confidence}`)
  }
}

/**
 * Asserts that format conversion succeeded
 */
export function assertFormatConversion(
  result: Result<string, CoreError>,
  expectedContent?: string
): void {
  if (result.isErr()) {
    throw new Error(`Expected format conversion to succeed, but got error: ${result.error.message}`)
  }

  if (expectedContent && result.value !== expectedContent) {
    throw new Error(`Converted content does not match expected content`)
  }
}

/**
 * Asserts that format validation results match expectations
 */
export function assertFormatValidation(
  result: Result<{ valid: boolean; errors: string[] }, CoreError>,
  expectedValid: boolean,
  expectedErrorCount?: number
): void {
  if (result.isErr()) {
    throw new Error(`Expected format validation to succeed, but got error: ${result.error.message}`)
  }

  const validation = result.value
  if (validation.valid !== expectedValid) {
    throw new Error(
      `Expected validation to be ${expectedValid}, but got ${validation.valid}. Errors: ${validation.errors.join(', ')}`
    )
  }

  if (expectedErrorCount !== undefined && validation.errors.length !== expectedErrorCount) {
    throw new Error(
      `Expected ${expectedErrorCount} validation errors, but got ${validation.errors.length}`
    )
  }
}

// ========================================
// Export Collections
// ========================================

/**
 * Format testing utilities grouped by functionality
 */
export const formatTesting = {
  // Mock creation
  createMockFormatDetector,

  // Format operations
  testFormatConversion,
  validateFormat,

  // Fixtures and test data
  fixtures: formatFixtures,

  // Assertions
  assertFormatDetection,
  assertFormatConversion,
  assertFormatValidation,
}
