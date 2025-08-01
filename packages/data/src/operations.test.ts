/**
 * Unified Data Operations Tests - High-ROI Testing
 *
 * Tests focus on:
 * - Auto-detection and parsing workflows
 * - Format-specific operation delegation
 * - Error handling and edge cases
 * - Integration with file system operations
 * - Business logic for data transformation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createUnifiedDataOperations, data, type UnifiedDataConfig } from './operations.js'

// Mock the underlying operations
vi.mock('./csv/index.js', () => ({
  createCSVOperations: vi.fn(() => ({
    parseFile: vi.fn(),
    parseString: vi.fn(),
    writeFile: vi.fn(),
  })),
}))

vi.mock('./json/index.js', () => ({
  createJSONOperations: vi.fn(() => ({
    parseFile: vi.fn(),
    parseString: vi.fn(),
    writeFile: vi.fn(),
  })),
}))

vi.mock('./excel/index.js', () => ({
  createExcelOperations: vi.fn(() => ({
    parseFile: vi.fn(),
    parseBuffer: vi.fn(),
    writeFile: vi.fn(),
  })),
}))

vi.mock('./detection/index.js', () => ({
  createDetectionOperations: vi.fn(() => ({
    detectFromFile: vi.fn(),
    detectFromExtension: vi.fn(),
  })),
}))

vi.mock('./mime/index.js', () => ({
  createMimeOperations: vi.fn(() => ({})),
}))

// Import mocked functions for assertions
import { createCSVOperations } from './csv/index.js'
import { createJSONOperations } from './json/index.js'
import { createExcelOperations } from './excel/index.js'
import { createDetectionOperations } from './detection/index.js'
import { ok, err } from '@esteban-url/core'

const mockCSVOps = vi.mocked(createCSVOperations)
const mockJSONOps = vi.mocked(createJSONOperations)
const mockExcelOps = vi.mocked(createExcelOperations)
const mockDetectionOps = vi.mocked(createDetectionOperations)

describe('Unified Data Operations - Auto-Detection Workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('parseAuto - File-based Auto-Detection', () => {
    it('should detect and parse CSV files correctly', async () => {
      const csvData = [
        { name: 'John', age: '30' },
        { name: 'Jane', age: '25' },
      ]

      // Mock detection to return CSV format
      const mockDetection = {
        detectFromFile: vi.fn().mockResolvedValue(
          ok({
            format: { mime: 'text/csv' },
            source: 'content-analysis',
            reliability: 'high',
          })
        ),
      }
      mockDetectionOps.mockReturnValue(mockDetection)

      // Mock CSV operations
      const mockCSV = {
        parseFile: vi.fn().mockResolvedValue(ok(csvData)),
        parseString: vi.fn(),
        writeFile: vi.fn(),
      }
      mockCSVOps.mockReturnValue(mockCSV)

      const operations = createUnifiedDataOperations()
      const result = await operations.parseAuto('/path/to/data.csv')

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual(csvData)
      }

      expect(mockDetection.detectFromFile).toHaveBeenCalledWith('/path/to/data.csv')
      expect(mockCSV.parseFile).toHaveBeenCalledWith('/path/to/data.csv')
    })

    it('should detect and parse JSON files correctly', async () => {
      const jsonData = { users: [{ id: 1, name: 'Alice' }] }

      // Mock detection to return JSON format
      const mockDetection = {
        detectFromFile: vi.fn().mockResolvedValue(
          ok({
            format: { mime: 'application/json' },
            source: 'content-analysis',
            reliability: 'high',
          })
        ),
      }
      mockDetectionOps.mockReturnValue(mockDetection)

      // Mock JSON operations
      const mockJSON = {
        parseFile: vi.fn().mockResolvedValue(ok(jsonData)),
        parseString: vi.fn(),
        writeFile: vi.fn(),
      }
      mockJSONOps.mockReturnValue(mockJSON)

      const operations = createUnifiedDataOperations()
      const result = await operations.parseAuto('/path/to/data.json')

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual(jsonData)
      }

      expect(mockDetection.detectFromFile).toHaveBeenCalledWith('/path/to/data.json')
      expect(mockJSON.parseFile).toHaveBeenCalledWith('/path/to/data.json')
    })

    it('should detect and parse Excel files correctly', async () => {
      const excelData = [{ Product: 'Laptop', Price: 999 }]

      // Mock detection to return Excel format
      const mockDetection = {
        detectFromFile: vi.fn().mockResolvedValue(
          ok({
            format: { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
            source: 'content-analysis',
            reliability: 'high',
          })
        ),
      }
      mockDetectionOps.mockReturnValue(mockDetection)

      // Mock Excel operations
      const mockExcel = {
        parseFile: vi.fn().mockResolvedValue(ok(excelData)),
        parseBuffer: vi.fn(),
        writeFile: vi.fn(),
      }
      mockExcelOps.mockReturnValue(mockExcel)

      const operations = createUnifiedDataOperations()
      const result = await operations.parseAuto('/path/to/data.xlsx')

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual(excelData)
      }

      expect(mockDetection.detectFromFile).toHaveBeenCalledWith('/path/to/data.xlsx')
      expect(mockExcel.parseFile).toHaveBeenCalledWith('/path/to/data.xlsx')
    })

    it('should handle format detection failures', async () => {
      const detectionError = {
        type: 'DETECTION_ERROR' as const,
        domain: 'detection',
        code: 'UNKNOWN_FORMAT',
        message: 'Cannot detect file format',
        timestamp: new Date(),
        recoverable: false,
        component: 'Detection',
        operation: 'detectFromFile',
        severity: 'high' as const,
      }

      const mockDetection = {
        detectFromFile: vi.fn().mockResolvedValue(err(detectionError)),
      }
      mockDetectionOps.mockReturnValue(mockDetection)

      const operations = createUnifiedDataOperations()
      const result = await operations.parseAuto('/path/to/unknown.file')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error).toEqual(detectionError)
      }
    })

    it('should handle unsupported format errors', async () => {
      // Mock detection to return unsupported format
      const mockDetection = {
        detectFromFile: vi.fn().mockResolvedValue(
          ok({
            format: { mime: 'application/pdf' },
            source: 'content-analysis',
            reliability: 'high',
          })
        ),
      }
      mockDetectionOps.mockReturnValue(mockDetection)

      const operations = createUnifiedDataOperations()
      const result = await operations.parseAuto('/path/to/document.pdf')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.code).toBe('DATA_UNSUPPORTED_FORMAT')
        expect(result.error.message).toContain('Cannot determine data format')
      }
    })

    it('should use extension fallback when mime type is unknown', async () => {
      // Mock detection returns unknown mime type but file has .json extension
      const mockDetection = {
        detectFromFile: vi.fn().mockResolvedValue(
          ok({
            format: { mime: 'application/octet-stream' }, // Unknown mime type
            source: 'content-analysis',
            reliability: 'low',
          })
        ),
      }
      mockDetectionOps.mockReturnValue(mockDetection)

      const mockJSON = {
        parseFile: vi.fn().mockResolvedValue(ok({ data: 'test' })),
        parseString: vi.fn(),
        writeFile: vi.fn(),
      }
      mockJSONOps.mockReturnValue(mockJSON)

      const operations = createUnifiedDataOperations()
      const result = await operations.parseAuto('/path/to/data.json')

      // Should succeed using extension fallback
      expect(result.isOk()).toBe(true)
      expect(mockJSON.parseFile).toHaveBeenCalledWith('/path/to/data.json')
    })
  })

  describe('parseAutoFromContent - Content-based Detection', () => {
    it('should detect and parse JSON content', async () => {
      const jsonContent = '{"name": "test", "value": 42}'
      const expectedData = { name: 'test', value: 42 }

      const mockJSON = {
        parseFile: vi.fn(),
        parseString: vi.fn().mockReturnValue(ok(expectedData)),
        writeFile: vi.fn(),
      }
      mockJSONOps.mockReturnValue(mockJSON)

      const operations = createUnifiedDataOperations()
      const result = await operations.parseAutoFromContent(jsonContent)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual(expectedData)
      }

      expect(mockJSON.parseString).toHaveBeenCalledWith(jsonContent)
    })

    it('should detect and parse CSV content', async () => {
      const csvContent = 'name,age\nJohn,30\nJane,25'
      const expectedData = [
        { name: 'John', age: '30' },
        { name: 'Jane', age: '25' },
      ]

      const mockCSV = {
        parseFile: vi.fn(),
        parseString: vi.fn().mockReturnValue(ok(expectedData)),
        writeFile: vi.fn(),
      }
      mockCSVOps.mockReturnValue(mockCSV)

      const operations = createUnifiedDataOperations()
      const result = await operations.parseAutoFromContent(csvContent)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toEqual(expectedData)
      }

      expect(mockCSV.parseString).toHaveBeenCalledWith(csvContent)
    })

    it('should use filename hint for format detection', async () => {
      const content = 'ambiguous content'

      const mockJSON = {
        parseFile: vi.fn(),
        parseString: vi.fn().mockReturnValue(ok({ data: 'parsed' })),
        writeFile: vi.fn(),
      }
      mockJSONOps.mockReturnValue(mockJSON)

      const operations = createUnifiedDataOperations()
      const result = await operations.parseAutoFromContent(content, 'data.json')

      expect(result.isOk()).toBe(true)
      expect(mockJSON.parseString).toHaveBeenCalledWith(content)
    })

    it('should return error for Excel content parsing', async () => {
      const operations = createUnifiedDataOperations()
      const result = await operations.parseAutoFromContent('content', 'file.xlsx')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.code).toBe('DATA_UNSUPPORTED_FORMAT')
        expect(result.error.message).toContain('Excel format cannot be parsed from string')
      }
    })

    it('should handle format detection failure', async () => {
      const ambiguousContent = 'completely ambiguous content'

      const operations = createUnifiedDataOperations()
      const result = await operations.parseAutoFromContent(ambiguousContent)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.code).toBe('DATA_FORMAT_DETECTION_FAILED')
        expect(result.error.message).toContain('Cannot determine data format from content')
      }
    })
  })

  describe('writeAuto - Auto-Detection for Writing', () => {
    it('should write JSON files correctly', async () => {
      const data = { users: [{ id: 1, name: 'Alice' }] }

      const mockJSON = {
        parseFile: vi.fn(),
        parseString: vi.fn(),
        writeFile: vi.fn().mockResolvedValue(ok(undefined)),
      }
      mockJSONOps.mockReturnValue(mockJSON)

      const operations = createUnifiedDataOperations()
      const result = await operations.writeAuto('/path/to/output.json', data)

      expect(result.isOk()).toBe(true)
      expect(mockJSON.writeFile).toHaveBeenCalledWith('/path/to/output.json', data)
    })

    it('should write CSV files correctly', async () => {
      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ]

      const mockCSV = {
        parseFile: vi.fn(),
        parseString: vi.fn(),
        writeFile: vi.fn().mockResolvedValue(ok(undefined)),
      }
      mockCSVOps.mockReturnValue(mockCSV)

      const operations = createUnifiedDataOperations()
      const result = await operations.writeAuto('/path/to/output.csv', data)

      expect(result.isOk()).toBe(true)
      expect(mockCSV.writeFile).toHaveBeenCalledWith(data, '/path/to/output.csv')
    })

    it('should write Excel files correctly', async () => {
      const data = [{ Product: 'Laptop', Price: 999 }]

      const mockExcel = {
        parseFile: vi.fn(),
        parseBuffer: vi.fn(),
        writeFile: vi.fn().mockResolvedValue(ok(undefined)),
      }
      mockExcelOps.mockReturnValue(mockExcel)

      const operations = createUnifiedDataOperations()
      const result = await operations.writeAuto('/path/to/output.xlsx', data)

      expect(result.isOk()).toBe(true)
      expect(mockExcel.writeFile).toHaveBeenCalledWith(data, '/path/to/output.xlsx')
    })

    it('should default to JSON for files without extension', async () => {
      const data = { test: 'data' }

      const mockJSON = {
        parseFile: vi.fn(),
        parseString: vi.fn(),
        writeFile: vi.fn().mockResolvedValue(ok(undefined)),
      }
      mockJSONOps.mockReturnValue(mockJSON)

      const operations = createUnifiedDataOperations()
      const result = await operations.writeAuto('/path/to/output', data)

      expect(result.isOk()).toBe(true)
      expect(mockJSON.writeFile).toHaveBeenCalledWith('/path/to/output.json', data)
    })

    it('should validate data type for CSV output', async () => {
      const invalidData = 'not an array'

      const operations = createUnifiedDataOperations()
      const result = await operations.writeAuto('/path/to/output.csv', invalidData)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.code).toBe('DATA_UNSUPPORTED_FORMAT')
        expect(result.error.message).toContain('CSV write requires array data')
      }
    })

    it('should validate data type for Excel output', async () => {
      const invalidData = { not: 'an array' }

      const operations = createUnifiedDataOperations()
      const result = await operations.writeAuto('/path/to/output.xlsx', invalidData)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.code).toBe('DATA_UNSUPPORTED_FORMAT')
        expect(result.error.message).toContain('Excel write requires array data')
      }
    })
  })

  describe('Format Conversion', () => {
    it('should convert data to JSON format', () => {
      const data = [{ name: 'John', age: 30 }]

      const operations = createUnifiedDataOperations()
      const result = operations.convertFormat(data, 'json')

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const parsed = JSON.parse(result.value)
        expect(parsed).toEqual(data)
      }
    })

    it('should convert data to CSV format', () => {
      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ]

      const operations = createUnifiedDataOperations()
      const result = operations.convertFormat(data, 'csv')

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const lines = result.value.split('\n')
        expect(lines[0]).toBe('name,age')
        expect(lines[1]).toBe('John,30')
        expect(lines[2]).toBe('Jane,25')
      }
    })

    it('should handle empty array for CSV conversion', () => {
      const operations = createUnifiedDataOperations()
      const result = operations.convertFormat([], 'csv')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.code).toBe('DATA_CONVERSION_FAILED')
      }
    })

    it('should reject Excel conversion', () => {
      const data = [{ name: 'John' }]

      const operations = createUnifiedDataOperations()
      const result = operations.convertFormat(data, 'excel')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.code).toBe('DATA_UNSUPPORTED_FORMAT')
      }
    })

    it('should handle invalid data for CSV conversion', () => {
      const invalidData = 'not an array'

      const operations = createUnifiedDataOperations()
      const result = operations.convertFormat(invalidData, 'csv')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.code).toBe('DATA_CONVERSION_FAILED')
      }
    })
  })

  describe('Default Instance', () => {
    it('should provide default data operations instance', () => {
      // Test that data object has all expected methods
      expect(typeof data.parseAuto).toBe('function')
      expect(typeof data.parseAutoFromContent).toBe('function')
      expect(typeof data.writeAuto).toBe('function')
      expect(typeof data.convertFormat).toBe('function')
    })
  })
})

describe('Configuration and Initialization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create operations with custom configuration', () => {
    const config: UnifiedDataConfig = {
      csv: { delimiter: ';' },
      json: { indent: 4 },
      excel: { sheetName: 'CustomSheet' },
      autoDetect: false,
      defaultFormat: 'csv',
    }

    const _operations = createUnifiedDataOperations(config)

    // Verify operations were created with custom config
    expect(mockCSVOps).toHaveBeenCalledWith({ delimiter: ';' })
    expect(mockJSONOps).toHaveBeenCalledWith({ indent: 4 })
    expect(mockExcelOps).toHaveBeenCalledWith({ sheetName: 'CustomSheet' })
  })

  it('should create operations with default configuration', () => {
    const _operations = createUnifiedDataOperations()

    // Verify operations were created with default config
    expect(mockCSVOps).toHaveBeenCalledWith(undefined)
    expect(mockJSONOps).toHaveBeenCalledWith(undefined)
    expect(mockExcelOps).toHaveBeenCalledWith(undefined)
    expect(mockDetectionOps).toHaveBeenCalledWith(undefined)
  })

  it('should expose format-specific operations', () => {
    const operations = createUnifiedDataOperations()

    expect(typeof operations.parseCSV).toBe('function')
    expect(typeof operations.parseJSON).toBe('function')
    expect(typeof operations.parseExcel).toBe('function')
    expect(typeof operations.parseCSVFromContent).toBe('function')
    expect(typeof operations.parseJSONFromContent).toBe('function')
    expect(typeof operations.parseExcelFromContent).toBe('function')
  })

  it('should expose format detection operations', () => {
    const operations = createUnifiedDataOperations()

    expect(typeof operations.detectFormat).toBe('function')
    expect(typeof operations.detectFormatFromContent).toBe('function')
  })
})

describe('Error Handling Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle exceptions during auto-parsing gracefully', async () => {
    const mockDetection = {
      detectFromFile: vi.fn().mockRejectedValue(new Error('Detection crashed')),
    }
    mockDetectionOps.mockReturnValue(mockDetection)

    const operations = createUnifiedDataOperations()
    const result = await operations.parseAuto('/path/to/file.json')

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.code).toBe('DATA_PARSING_FAILED')
      expect(result.error.message).toContain('Auto-parsing failed for file')
    }
  })

  it('should handle exceptions during content parsing gracefully', async () => {
    const mockJSON = {
      parseFile: vi.fn(),
      parseString: vi.fn().mockImplementation(() => {
        throw new Error('JSON parsing crashed')
      }),
      writeFile: vi.fn(),
    }
    mockJSONOps.mockReturnValue(mockJSON)

    const operations = createUnifiedDataOperations()
    // Use valid JSON that will be detected as JSON but fail during parsing
    const result = await operations.parseAutoFromContent('{"valid": "json"}')

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.code).toBe('DATA_PARSING_FAILED')
      expect(result.error.message).toContain('Auto-parsing failed for content')
    }
  })

  it('should handle exceptions during auto-writing gracefully', async () => {
    const mockJSON = {
      parseFile: vi.fn(),
      parseString: vi.fn(),
      writeFile: vi.fn().mockRejectedValue(new Error('Write operation crashed')),
    }
    mockJSONOps.mockReturnValue(mockJSON)

    const operations = createUnifiedDataOperations()
    const result = await operations.writeAuto('/path/to/output.json', { data: 'test' })

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.code).toBe('DATA_CONVERSION_FAILED')
      expect(result.error.message).toContain('Auto-writing failed for file')
    }
  })
})
