/**
 * Format detection and conversion testing utilities
 * Consolidated format testing functionality
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
    // JSON conversions
    if (sourceFormat === 'json') {
      const data = JSON.parse(sourceContent)

      if (targetFormat === 'yaml') {
        return ok(convertJsonToYaml(data))
      }

      if (targetFormat === 'csv') {
        return ok(convertJsonToCsv(data))
      }

      if (targetFormat === 'xml') {
        return ok(convertJsonToXml(data))
      }

      if (targetFormat === 'toml') {
        return ok(convertJsonToToml(data))
      }
    }

    // CSV conversions
    if (sourceFormat === 'csv') {
      const csvData = parseCsvContent(sourceContent)

      if (targetFormat === 'json') {
        return ok(JSON.stringify(csvData, null, options.indent || 2))
      }

      if (targetFormat === 'yaml') {
        return ok(convertJsonToYaml(csvData))
      }

      if (targetFormat === 'xml') {
        return ok(convertJsonToXml(csvData))
      }
    }

    // YAML conversions
    if (sourceFormat === 'yaml') {
      const yamlData = parseYamlContent(sourceContent)

      if (targetFormat === 'json') {
        return ok(JSON.stringify(yamlData, null, options.indent || 2))
      }

      if (targetFormat === 'csv') {
        return ok(convertJsonToCsv(yamlData))
      }

      if (targetFormat === 'xml') {
        return ok(convertJsonToXml(yamlData))
      }
    }

    // XML conversions
    if (sourceFormat === 'xml') {
      const xmlData = parseXmlContent(sourceContent)

      if (targetFormat === 'json') {
        return ok(JSON.stringify(xmlData, null, options.indent || 2))
      }

      if (targetFormat === 'yaml') {
        return ok(convertJsonToYaml(xmlData))
      }

      if (targetFormat === 'csv') {
        return ok(convertJsonToCsv(xmlData))
      }
    }

    // TOML conversions
    if (sourceFormat === 'toml') {
      const tomlData = parseTomlContent(sourceContent)

      if (targetFormat === 'json') {
        return ok(JSON.stringify(tomlData, null, options.indent || 2))
      }

      if (targetFormat === 'yaml') {
        return ok(convertJsonToYaml(tomlData))
      }

      if (targetFormat === 'csv') {
        return ok(convertJsonToCsv(tomlData))
      }
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
        const lines = content.split('\n').filter((line) => line.trim())
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
        // Check for balanced tags with proper nesting
        const openTagsMatch = content.match(/<([^/\s>][^>]*?)>/g) || []
        const closeTagsMatch = content.match(/<\/([^>]*?)>/g) || []

        if (openTagsMatch.length !== closeTagsMatch.length) {
          errors.push('XML tags are not balanced')
        }

        // Check for mismatched tag names
        const openTagNames = openTagsMatch
          .map((tag) => tag.match(/<([^/\s>]+)/)?.[1] || '')
          .filter(Boolean)
        const closeTagNames = closeTagsMatch
          .map((tag) => tag.match(/<\/([^>]+)/)?.[1] || '')
          .filter(Boolean)

        for (let i = 0; i < Math.min(openTagNames.length, closeTagNames.length); i++) {
          if (openTagNames[i] !== closeTagNames[closeTagNames.length - 1 - i]) {
            errors.push('XML tags are not properly nested')
            break
          }
        }
        break

      case 'yaml':
        // Basic YAML validation
        if (!content.includes(':')) {
          errors.push('YAML must contain key-value pairs with colons')
        }
        // Check for proper indentation consistency
        const yamlLines = content
          .split('\n')
          .filter((line) => line.trim() && !line.trim().startsWith('#'))
        const indentLevels = yamlLines.map((line) => line.length - line.trimStart().length)
        const hasInconsistentIndent = indentLevels.some(
          (level, index) =>
            index > 0 &&
            level > indentLevels[index - 1] &&
            (level - indentLevels[index - 1]) % 2 !== 0
        )
        if (hasInconsistentIndent) {
          errors.push('YAML indentation is inconsistent')
        }
        break

      case 'toml':
        // Basic TOML validation
        if (!content.includes('=')) {
          errors.push('TOML must contain key-value pairs with equals signs')
        }
        // Check for section headers
        const tomlLines = content
          .split('\n')
          .filter((line) => line.trim() && !line.trim().startsWith('#'))
        const sections = tomlLines.filter(
          (line) => line.trim().startsWith('[') && line.trim().endsWith(']')
        )
        const keyValues = tomlLines.filter((line) => line.includes('='))
        if (sections.length === 0 && keyValues.length === 0) {
          errors.push('TOML must contain either sections or key-value pairs')
        }
        break

      case 'ini':
        // Basic INI validation
        if (!content.includes('=') && !content.includes('[')) {
          errors.push('INI must contain sections or key-value pairs')
        }
        break

      case 'markdown':
        // Basic Markdown validation - very lenient
        if (content.length === 0) {
          errors.push('Markdown content cannot be empty')
        }
        break

      case 'text':
        // Text files are always valid
        break

      default:
        errors.push(`Validation for format "${format}" is not implemented`)
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
// Format Conversion Helpers
// ========================================

/**
 * Parse CSV content into JSON structure
 */
function parseCsvContent(content: string): any[] {
  const lines = content.split('\n').filter((line) => line.trim())
  if (lines.length === 0) return []

  const headers = lines[0].split(',').map((h) => h.trim())
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim())
    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    return row
  })
}

/**
 * Convert JSON to YAML format (simple implementation)
 */
function convertJsonToYaml(data: any, indent: number = 0): string {
  const spaces = '  '.repeat(indent)

  if (Array.isArray(data)) {
    return data
      .map((item) =>
        typeof item === 'object'
          ? `${spaces}- ${convertJsonToYaml(item, indent + 1).trim()}`
          : `${spaces}- ${item}`
      )
      .join('\n')
  }

  if (typeof data === 'object' && data !== null) {
    return Object.entries(data)
      .map(([key, value]) => {
        if (typeof value === 'object') {
          return `${spaces}${key}:\n${convertJsonToYaml(value, indent + 1)}`
        }
        return `${spaces}${key}: ${value}`
      })
      .join('\n')
  }

  return `${spaces}${data}`
}

/**
 * Convert JSON to CSV format
 */
function convertJsonToCsv(data: any): string {
  if (!Array.isArray(data)) {
    data = [data]
  }

  if (data.length === 0) return ''

  const headers = Object.keys(data[0])
  const headerRow = headers.join(',')
  const dataRows = data.map((item: any) =>
    headers.map((header) => `"${item[header] || ''}"`).join(',')
  )

  return [headerRow, ...dataRows].join('\n')
}

/**
 * Convert object to XML format (simple implementation)
 */
function objectToXml(obj: any, tagName: string = 'item'): string {
  if (Array.isArray(obj)) {
    return obj.map((item) => objectToXml(item, tagName)).join('\n')
  }

  if (typeof obj === 'object' && obj !== null) {
    const elements = Object.entries(obj)
      .map(([key, value]) => {
        if (typeof value === 'object') {
          return `  <${key}>\n${objectToXml(value, 'item')
            .split('\n')
            .map((line) => `    ${line}`)
            .join('\n')}\n  </${key}>`
        }
        return `  <${key}>${value}</${key}>`
      })
      .join('\n')

    return `<${tagName}>\n${elements}\n</${tagName}>`
  }

  return `<${tagName}>${obj}</${tagName}>`
}

/**
 * Convert JSON to XML format (simple implementation)
 */
function convertJsonToXml(data: any, rootElement: string = 'root'): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n${objectToXml(data, rootElement)}`
}

/**
 * Convert JSON to TOML format (simple implementation)
 */
function convertJsonToToml(data: any): string {
  const lines: string[] = []

  function processObject(obj: any, prefix: string = ''): void {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        lines.push(`[${fullKey}]`)
        processObject(value, fullKey)
      } else if (Array.isArray(value)) {
        lines.push(`${key} = [${value.map((v) => `"${v}"`).join(', ')}]`)
      } else {
        lines.push(`${key} = "${value}"`)
      }
    }
  }

  processObject(data)
  return lines.join('\n')
}

/**
 * Parse YAML content (simple implementation)
 */
function parseYamlContent(content: string): any {
  const lines = content.split('\n').filter((line) => line.trim() && !line.trim().startsWith('#'))
  const result: any = {}

  for (const line of lines) {
    const [key, ...valueParts] = line.split(':')
    if (key && valueParts.length > 0) {
      result[key.trim()] = valueParts.join(':').trim()
    }
  }

  return result
}

/**
 * Parse XML content (simple implementation)
 */
function parseXmlContent(content: string): any {
  // Very basic XML parsing - in real implementation would use proper XML parser
  const tagRegex = /<(\w+)>(.*?)<\/\1>/g
  const result: any = {}
  let match

  while ((match = tagRegex.exec(content)) !== null) {
    const [, tagName, tagContent] = match
    // Handle nested tags or simple text content
    if (tagContent.includes('<')) {
      result[tagName] = parseXmlContent(tagContent)
    } else {
      result[tagName] = tagContent.trim()
    }
  }

  return result
}

/**
 * Parse TOML content (simple implementation)
 */
function parseTomlContent(content: string): any {
  const lines = content.split('\n').filter((line) => line.trim() && !line.trim().startsWith('#'))
  const result: any = {}

  for (const line of lines) {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim().replace(/^"|"$/g, '')
      result[key.trim()] = value
    }
  }

  return result
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
