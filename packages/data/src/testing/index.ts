/**
 * @trailhead/data/testing
 *
 * Unified data processing and format testing utilities.
 * Provides domain-focused utilities for testing data parsing, format detection, conversion, and processing operations.
 *
 * @example
 * ```typescript
 * import {
 *   createMockDataProcessor,
 *   createMockFormatDetector,
 *   dataFixtures,
 *   formatFixtures,
 *   assertDataTransformation,
 *   assertFormatDetection,
 *   testDataConversion,
 * } from '@trailhead/data/testing'
 *
 * // Create mock data processor
 * const processor = createMockDataProcessor()
 * processor.mockFormat('csv', dataFixtures.csv.usersList)
 *
 * // Test format detection
 * const detector = createMockFormatDetector()
 * const formatResult = await detector.detectFormat('data.json')
 * assertFormatDetection(formatResult, 'json')
 *
 * // Test data transformation
 * const result = await processor.transform('users.csv', 'json')
 * assertDataTransformation(result, 'json', 3) // Expect 3 records
 * ```
 */

import { ok, err, type Result, type CoreError } from '@trailhead/core'

// ========================================
// Data Types and Interfaces
// ========================================

/** Supported data format types for testing */
export type DataFormat = 'json' | 'csv' | 'xml' | 'yaml' | 'toml' | 'ini' | 'excel' | 'parquet'

/** Generic data record type for testing */
export interface DataRecord {
  [key: string]: any
}

/**
 * Parsed data set with records and metadata
 * @template T - Record type (defaults to DataRecord)
 */
export interface DataSet<T = DataRecord> {
  readonly format: DataFormat
  readonly records: T[]
  readonly metadata: {
    readonly totalRecords: number
    readonly columns: string[]
    readonly schema?: Record<string, string>
    readonly size?: number
  }
}

/** Configuration for data transformation operations */
export interface DataTransformation {
  readonly sourceFormat: DataFormat
  readonly targetFormat: DataFormat
  readonly rules: TransformationRule[]
  readonly options: Record<string, any>
}

/** Rule for transforming data records */
export interface TransformationRule {
  readonly type: 'rename' | 'transform' | 'filter' | 'aggregate' | 'join'
  readonly source: string
  readonly target?: string
  readonly condition?: (value: any, record: DataRecord) => boolean
  readonly transformer?: (value: any, record: DataRecord) => any
}

/**
 * Mock data processor interface for testing data operations
 *
 * Provides methods to detect formats, parse data, transform records,
 * convert formats, and validate against schemas.
 */
export interface MockDataProcessor {
  readonly supportedFormats: DataFormat[]
  detectFormat(data: string | Buffer): Result<DataFormat, CoreError>
  parseData<T = DataRecord>(
    data: string | Buffer,
    format: DataFormat
  ): Result<DataSet<T>, CoreError>
  transform<T = DataRecord>(
    dataset: DataSet<T>,
    transformation: DataTransformation
  ): Result<DataSet<T>, CoreError>
  convertFormat<T = DataRecord>(
    dataset: DataSet<T>,
    targetFormat: DataFormat
  ): Result<string | Buffer, CoreError>
  validateData<T = DataRecord>(
    dataset: DataSet<T>,
    schema: Record<string, any>
  ): Result<DataSet<T>, CoreError>
  mockFormat(format: DataFormat, sampleData: string | DataRecord[]): void
  mockTransformation(sourceFormat: DataFormat, targetFormat: DataFormat, result: any): void
  getProcessingHistory(): Array<{ operation: string; format: DataFormat; timestamp: number }>
  clearMocks(): void
}

// ========================================
// Mock Data Processor Creation
// ========================================

/**
 * Creates a mock data processor for testing data operations
 *
 * Provides a configurable processor for testing data parsing, transformation,
 * format conversion, and validation workflows. Supports mocking format data
 * and transformation results for predictable test behavior.
 *
 * @returns MockDataProcessor instance with all data processing methods
 *
 * @example
 * ```typescript
 * const processor = createMockDataProcessor();
 * processor.mockFormat('csv', 'id,name\n1,Alice\n2,Bob');
 *
 * const result = processor.parseData(data, 'csv');
 * if (result.isOk()) {
 *   console.log(result.value.records.length); // 2
 * }
 * ```
 */
export function createMockDataProcessor(): MockDataProcessor {
  const formatMocks = new Map<DataFormat, string | DataRecord[]>()
  const transformationMocks = new Map<string, any>()
  const processingHistory: Array<{ operation: string; format: DataFormat; timestamp: number }> = []

  const supportedFormats: DataFormat[] = [
    'json',
    'csv',
    'xml',
    'yaml',
    'toml',
    'ini',
    'excel',
    'parquet',
  ]

  return {
    supportedFormats,

    detectFormat(data: string | Buffer): Result<DataFormat, CoreError> {
      const content = data.toString()

      // Simple format detection based on content patterns
      if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
        return ok('json')
      }
      if (content.includes(',') && content.includes('\n')) {
        return ok('csv')
      }
      if (content.includes('<') && content.includes('>')) {
        return ok('xml')
      }
      if (content.includes('---') || content.includes(':')) {
        return ok('yaml')
      }

      return err({
        type: 'data-error' as const,
        domain: 'data',
        code: 'FORMAT_DETECTION_FAILED',
        message: 'Unable to detect data format',
        timestamp: new Date(),
        recoverable: true,
        component: 'MockDataProcessor',
        operation: 'detectFormat',
        severity: 'high' as const,
      } as CoreError)
    },

    parseData<T = DataRecord>(
      data: string | Buffer,
      format: DataFormat
    ): Result<DataSet<T>, CoreError> {
      processingHistory.push({ operation: 'parse', format, timestamp: Date.now() })

      try {
        const content = data.toString()

        // Check for mocked data
        const mockedData = formatMocks.get(format)
        if (mockedData) {
          let records: T[]

          if (typeof mockedData === 'string') {
            // Parse mocked string data
            switch (format) {
              case 'json':
                records = JSON.parse(mockedData) as T[]
                break
              case 'csv':
                const lines = mockedData.split('\n').filter((line) => line.trim())
                const headers = lines[0].split(',').map((h) => h.trim())
                records = lines.slice(1).map((line) => {
                  const values = line.split(',').map((v) => v.trim())
                  const record: any = {}
                  headers.forEach((header, index) => {
                    record[header] = values[index] || ''
                  })
                  return record
                }) as T[]
                break
              default:
                records = [] as T[]
            }
          } else {
            records = mockedData as T[]
          }

          return ok({
            format,
            records,
            metadata: {
              totalRecords: records.length,
              columns: records.length > 0 ? Object.keys(records[0] as any) : [],
              size: content.length,
            },
          })
        }

        // Default parsing behavior
        switch (format) {
          case 'json':
            const jsonData = JSON.parse(content)
            const jsonRecords = Array.isArray(jsonData) ? jsonData : [jsonData]
            return ok({
              format,
              records: jsonRecords as T[],
              metadata: {
                totalRecords: jsonRecords.length,
                columns: jsonRecords.length > 0 ? Object.keys(jsonRecords[0]) : [],
                size: content.length,
              },
            })

          case 'csv':
            const lines = content.split('\n').filter((line) => line.trim())
            if (lines.length === 0) {
              return ok({
                format,
                records: [] as T[],
                metadata: { totalRecords: 0, columns: [], size: content.length },
              })
            }

            const headers = lines[0].split(',').map((h) => h.trim())
            const csvRecords = lines.slice(1).map((line) => {
              const values = line.split(',').map((v) => v.trim())
              const record: any = {}
              headers.forEach((header, index) => {
                record[header] = values[index] || ''
              })
              return record
            })

            return ok({
              format,
              records: csvRecords as T[],
              metadata: {
                totalRecords: csvRecords.length,
                columns: headers,
                size: content.length,
              },
            })

          default:
            return err({
              type: 'data-error' as const,
              domain: 'data',
              code: 'UNSUPPORTED_FORMAT',
              message: `Format '${format}' not supported for parsing`,
              timestamp: new Date(),
              recoverable: true,
              component: 'MockDataProcessor',
              operation: 'parseData',
              severity: 'high' as const,
            } as CoreError)
        }
      } catch (error) {
        return err({
          type: 'data-error' as const,
          domain: 'data',
          code: 'PARSE_FAILED',
          message: `Failed to parse ${format} data: ${error}`,
          timestamp: new Date(),
          recoverable: true,
          component: 'MockDataProcessor',
          operation: 'parseData',
          severity: 'high' as const,
        } as CoreError)
      }
    },

    transform<T = DataRecord>(
      dataset: DataSet<T>,
      transformation: DataTransformation
    ): Result<DataSet<T>, CoreError> {
      processingHistory.push({
        operation: 'transform',
        format: dataset.format,
        timestamp: Date.now(),
      })

      try {
        let transformedRecords = [...dataset.records]

        for (const rule of transformation.rules) {
          switch (rule.type) {
            case 'rename':
              transformedRecords = transformedRecords.map((record) => {
                const newRecord = { ...(record as object) } as T
                if (rule.source in (newRecord as any) && rule.target) {
                  ;(newRecord as any)[rule.target] = (newRecord as any)[rule.source]
                  delete (newRecord as any)[rule.source]
                }
                return newRecord
              })
              break

            case 'transform':
              if (rule.transformer) {
                transformedRecords = transformedRecords.map((record) => {
                  const newRecord = { ...(record as object) } as T
                  if (rule.source in (newRecord as any)) {
                    ;(newRecord as any)[rule.source] = rule.transformer!(
                      (newRecord as any)[rule.source],
                      newRecord as DataRecord
                    )
                  }
                  return newRecord
                })
              }
              break

            case 'filter':
              if (rule.condition) {
                transformedRecords = transformedRecords.filter((record) =>
                  rule.condition!((record as any)[rule.source], record as DataRecord)
                )
              }
              break
          }
        }

        return ok({
          format: transformation.targetFormat,
          records: transformedRecords,
          metadata: {
            totalRecords: transformedRecords.length,
            columns: transformedRecords.length > 0 ? Object.keys(transformedRecords[0] as any) : [],
          },
        })
      } catch (error) {
        return err({
          type: 'data-error' as const,
          domain: 'data',
          code: 'TRANSFORMATION_FAILED',
          message: `Data transformation failed: ${error}`,
          timestamp: new Date(),
          recoverable: true,
          component: 'MockDataProcessor',
          operation: 'transform',
          severity: 'high' as const,
        } as CoreError)
      }
    },

    convertFormat<T = DataRecord>(
      dataset: DataSet<T>,
      targetFormat: DataFormat
    ): Result<string | Buffer, CoreError> {
      processingHistory.push({ operation: 'convert', format: targetFormat, timestamp: Date.now() })

      // Check for mocked conversion
      const mockKey = `${dataset.format}->${targetFormat}`
      const mockedResult = transformationMocks.get(mockKey)
      if (mockedResult) {
        return ok(mockedResult)
      }

      try {
        switch (targetFormat) {
          case 'json':
            return ok(JSON.stringify(dataset.records, null, 2))

          case 'csv':
            if (dataset.records.length === 0) {
              return ok('')
            }

            const headers = Object.keys(dataset.records[0] as any)
            const csvLines = [
              headers.join(','),
              ...dataset.records.map((record) =>
                headers.map((header) => (record as any)[header] || '').join(',')
              ),
            ]
            return ok(csvLines.join('\n'))

          case 'xml':
            const xmlRecords = dataset.records
              .map((record) => {
                const fields = Object.entries(record as any)
                  .map(([key, value]) => `    <${key}>${value}</${key}>`)
                  .join('\n')
                return `  <record>\n${fields}\n  </record>`
              })
              .join('\n')

            return ok(`<?xml version="1.0" encoding="UTF-8"?>\n<data>\n${xmlRecords}\n</data>`)

          default:
            return err({
              type: 'data-error' as const,
              domain: 'data',
              code: 'UNSUPPORTED_CONVERSION',
              message: `Conversion to '${targetFormat}' not supported`,
              timestamp: new Date(),
              recoverable: true,
              component: 'MockDataProcessor',
              operation: 'convertFormat',
              severity: 'high' as const,
            } as CoreError)
        }
      } catch (error) {
        return err({
          type: 'data-error' as const,
          domain: 'data',
          code: 'CONVERSION_FAILED',
          message: `Format conversion failed: ${error}`,
          timestamp: new Date(),
          recoverable: true,
          component: 'MockDataProcessor',
          operation: 'convertFormat',
          severity: 'high' as const,
        } as CoreError)
      }
    },

    validateData<T = DataRecord>(
      dataset: DataSet<T>,
      schema: Record<string, any>
    ): Result<DataSet<T>, CoreError> {
      processingHistory.push({
        operation: 'validate',
        format: dataset.format,
        timestamp: Date.now(),
      })

      try {
        const errors: string[] = []

        // Validate required fields
        for (const [field, requirements] of Object.entries(schema)) {
          for (let i = 0; i < dataset.records.length; i++) {
            const record = dataset.records[i] as any

            if (requirements.required && !(field in record)) {
              errors.push(`Record ${i}: Missing required field '${field}'`)
            }

            if (field in record && requirements.type) {
              const actualType = typeof record[field]
              if (actualType !== requirements.type) {
                errors.push(
                  `Record ${i}: Field '${field}' should be ${requirements.type}, got ${actualType}`
                )
              }
            }
          }
        }

        if (errors.length > 0) {
          return err({
            type: 'data-error' as const,
            domain: 'data',
            code: 'VALIDATION_FAILED',
            message: `Data validation failed: ${errors.join(', ')}`,
            timestamp: new Date(),
            recoverable: true,
            component: 'MockDataProcessor',
            operation: 'validateData',
            severity: 'high' as const,
          } as CoreError)
        }

        return ok(dataset)
      } catch (error) {
        return err({
          type: 'data-error' as const,
          domain: 'data',
          code: 'VALIDATION_ERROR',
          message: `Data validation error: ${error}`,
          timestamp: new Date(),
          recoverable: true,
          component: 'MockDataProcessor',
          operation: 'validateData',
          severity: 'high' as const,
        } as CoreError)
      }
    },

    mockFormat(format: DataFormat, sampleData: string | DataRecord[]): void {
      formatMocks.set(format, sampleData)
    },

    mockTransformation(sourceFormat: DataFormat, targetFormat: DataFormat, result: any): void {
      transformationMocks.set(`${sourceFormat}->${targetFormat}`, result)
    },

    getProcessingHistory(): Array<{ operation: string; format: DataFormat; timestamp: number }> {
      return [...processingHistory]
    },

    clearMocks(): void {
      formatMocks.clear()
      transformationMocks.clear()
      processingHistory.length = 0
    },
  }
}

// ========================================
// Data Test Fixtures
// ========================================

export const dataFixtures = {
  /**
   * Sample CSV data
   */
  csv: {
    usersList: `id,name,email,role,created_at
1,Alice Johnson,alice@example.com,admin,2023-01-15
2,Bob Smith,bob@example.com,user,2023-02-20
3,Carol Davis,carol@example.com,user,2023-03-10`,

    productsList: `id,name,price,category,in_stock
1,Laptop,999.99,electronics,true
2,Coffee Mug,12.99,kitchen,true
3,Desk Chair,199.99,furniture,false`,

    salesData: `date,product_id,quantity,revenue
2023-04-01,1,2,1999.98
2023-04-02,2,5,64.95
2023-04-03,1,1,999.99`,

    malformed: `id,name,email
1,Alice,alice@example.com
2,Bob
3,Carol,carol@example.com,extra_field`,
  },

  /**
   * Sample JSON data
   */
  json: {
    usersList: [
      {
        id: 1,
        name: 'Alice Johnson',
        email: 'alice@example.com',
        role: 'admin',
        created_at: '2023-01-15',
      },
      {
        id: 2,
        name: 'Bob Smith',
        email: 'bob@example.com',
        role: 'user',
        created_at: '2023-02-20',
      },
      {
        id: 3,
        name: 'Carol Davis',
        email: 'carol@example.com',
        role: 'user',
        created_at: '2023-03-10',
      },
    ],

    productsList: [
      { id: 1, name: 'Laptop', price: 999.99, category: 'electronics', in_stock: true },
      { id: 2, name: 'Coffee Mug', price: 12.99, category: 'kitchen', in_stock: true },
      { id: 3, name: 'Desk Chair', price: 199.99, category: 'furniture', in_stock: false },
    ],

    nestedData: {
      users: [
        { id: 1, profile: { name: 'Alice', preferences: { theme: 'dark', notifications: true } } },
        { id: 2, profile: { name: 'Bob', preferences: { theme: 'light', notifications: false } } },
      ],
      metadata: { version: '1.0', updated: '2023-04-15' },
    },

    malformed: '{"id": 1, "name": "Alice", "email": "alice@example.com"',
  },

  /**
   * Sample XML data
   */
  xml: {
    usersList: `<?xml version="1.0" encoding="UTF-8"?>
<users>
  <user id="1">
    <name>Alice Johnson</name>
    <email>alice@example.com</email>
    <role>admin</role>
  </user>
  <user id="2">
    <name>Bob Smith</name>
    <email>bob@example.com</email>
    <role>user</role>
  </user>
</users>`,

    configFile: `<?xml version="1.0" encoding="UTF-8"?>
<config>
  <database>
    <host>localhost</host>
    <port>5432</port>
    <name>myapp</name>
  </database>
  <server>
    <port>3000</port>
    <debug>true</debug>
  </server>
</config>`,
  },

  /**
   * Sample transformation rules
   */
  transformations: {
    renameFields: {
      sourceFormat: 'csv' as const,
      targetFormat: 'json' as const,
      rules: [
        { type: 'rename' as const, source: 'created_at', target: 'createdAt' },
        { type: 'rename' as const, source: 'in_stock', target: 'inStock' },
      ],
      options: {},
    },

    filterAndTransform: {
      sourceFormat: 'json' as const,
      targetFormat: 'json' as const,
      rules: [
        {
          type: 'filter' as const,
          source: 'role',
          condition: (value: string) => value === 'admin',
        },
        {
          type: 'transform' as const,
          source: 'email',
          transformer: (value: string) => value.toLowerCase(),
        },
      ],
      options: {},
    },

    aggregateData: {
      sourceFormat: 'csv' as const,
      targetFormat: 'json' as const,
      rules: [{ type: 'aggregate' as const, source: 'revenue', target: 'total_revenue' }],
      options: { groupBy: 'product_id' },
    },
  },

  /**
   * Validation schemas
   */
  schemas: {
    userSchema: {
      id: { type: 'number', required: true },
      name: { type: 'string', required: true },
      email: { type: 'string', required: true },
      role: { type: 'string', required: false },
    },

    productSchema: {
      id: { type: 'number', required: true },
      name: { type: 'string', required: true },
      price: { type: 'number', required: true },
      category: { type: 'string', required: false },
      in_stock: { type: 'boolean', required: false },
    },

    strictSchema: {
      id: { type: 'number', required: true },
      name: { type: 'string', required: true },
      email: { type: 'string', required: true },
      role: { type: 'string', required: true },
      created_at: { type: 'string', required: true },
    },
  },
}

// ========================================
// Data Testing Assertions
// ========================================

/**
 * Asserts that data parsing succeeded with expected format and record count
 *
 * @param result - Result from parseData operation
 * @param expectedFormat - Expected data format
 * @param expectedRecordCount - Optional expected number of records
 * @throws Error if result is error, format mismatch, or record count mismatch
 */
export function assertDataParsing<T>(
  result: Result<DataSet<T>, CoreError>,
  expectedFormat: DataFormat,
  expectedRecordCount?: number
): void {
  if (result.isErr()) {
    throw new Error(`Expected data parsing to succeed, but got error: ${result.error.message}`)
  }

  const dataset = result.value
  if (dataset.format !== expectedFormat) {
    throw new Error(`Expected format '${expectedFormat}', but got '${dataset.format}'`)
  }

  if (expectedRecordCount !== undefined && dataset.metadata.totalRecords !== expectedRecordCount) {
    throw new Error(
      `Expected ${expectedRecordCount} records, but got ${dataset.metadata.totalRecords}`
    )
  }
}

/**
 * Asserts that data transformation succeeded with expected format and count
 *
 * @param result - Result from transform operation
 * @param expectedFormat - Expected target format
 * @param expectedRecordCount - Optional expected number of records after transformation
 * @throws Error if result is error, format mismatch, or record count mismatch
 */
export function assertDataTransformation<T>(
  result: Result<DataSet<T>, CoreError>,
  expectedFormat: DataFormat,
  expectedRecordCount?: number
): void {
  if (result.isErr()) {
    throw new Error(
      `Expected data transformation to succeed, but got error: ${result.error.message}`
    )
  }

  const dataset = result.value
  if (dataset.format !== expectedFormat) {
    throw new Error(`Expected transformed format '${expectedFormat}', but got '${dataset.format}'`)
  }

  if (expectedRecordCount !== undefined && dataset.metadata.totalRecords !== expectedRecordCount) {
    throw new Error(
      `Expected ${expectedRecordCount} transformed records, but got ${dataset.metadata.totalRecords}`
    )
  }
}

/**
 * Asserts that format conversion produced expected output
 *
 * @param result - Result from convertFormat operation
 * @param expectedFormat - Target format for logging purposes
 * @param shouldContain - Optional strings that should appear in output
 * @throws Error if result is error or content doesn't contain expected strings
 */
export function assertFormatConversion(
  result: Result<string | Buffer, CoreError>,
  expectedFormat: DataFormat,
  shouldContain?: string[]
): void {
  if (result.isErr()) {
    throw new Error(`Expected format conversion to succeed, but got error: ${result.error.message}`)
  }

  const output = result.value.toString()

  if (shouldContain) {
    for (const expected of shouldContain) {
      if (!output.includes(expected)) {
        throw new Error(`Expected converted ${expectedFormat} to contain '${expected}'`)
      }
    }
  }
}

/**
 * Asserts that data validation succeeded
 *
 * @param result - Result from validateData operation
 * @throws Error if result is error
 */
export function assertDataValidation<T>(result: Result<DataSet<T>, CoreError>): void {
  if (result.isErr()) {
    throw new Error(`Expected data validation to succeed, but got error: ${result.error.message}`)
  }
}

/**
 * Asserts that data validation failed with expected error code
 *
 * @param result - Result from validateData operation
 * @param expectedErrorCode - Optional expected error code
 * @throws Error if result is success or error code mismatch
 */
export function assertValidationFailure<T>(
  result: Result<DataSet<T>, CoreError>,
  expectedErrorCode?: string
): void {
  if (result.isOk()) {
    throw new Error(`Expected data validation to fail, but it succeeded`)
  }

  if (expectedErrorCode && result.error.code !== expectedErrorCode) {
    throw new Error(
      `Expected validation error code '${expectedErrorCode}', but got '${result.error.code}'`
    )
  }
}

/**
 * Asserts that specific fields exist in data records
 *
 * @param dataset - DataSet to check
 * @param expectedFields - Array of field names that should exist
 * @throws Error if dataset is empty or fields are missing
 */
export function assertDataFields<T>(dataset: DataSet<T>, expectedFields: string[]): void {
  if (dataset.records.length === 0) {
    throw new Error('Cannot check fields on empty dataset')
  }

  const firstRecord = dataset.records[0] as any
  for (const field of expectedFields) {
    if (!(field in firstRecord)) {
      throw new Error(`Expected field '${field}' not found in data records`)
    }
  }
}

// ========================================
// Data Testing Utilities
// ========================================

/**
 * Tests data conversion between formats
 *
 * Parses source data and converts to target format, returning the converted output.
 *
 * @param sourceData - Raw data string to convert
 * @param sourceFormat - Format of source data
 * @param targetFormat - Desired output format
 * @returns Result containing converted data or error
 */
export async function testDataConversion(
  sourceData: string,
  sourceFormat: DataFormat,
  targetFormat: DataFormat
): Promise<Result<string | Buffer, CoreError>> {
  const processor = createMockDataProcessor()

  const parseResult = processor.parseData(sourceData, sourceFormat)
  if (parseResult.isErr()) {
    return err(parseResult.error)
  }

  return processor.convertFormat(parseResult.value, targetFormat)
}

/**
 * Tests data transformation with rules
 *
 * Parses source data and applies transformation rules to produce transformed dataset.
 *
 * @param sourceData - Raw data string to transform
 * @param sourceFormat - Format of source data
 * @param transformation - Transformation configuration with rules
 * @returns Result containing transformed dataset or error
 */
export async function testDataTransformationFlow<T = DataRecord>(
  sourceData: string,
  sourceFormat: DataFormat,
  transformation: DataTransformation
): Promise<Result<DataSet<T>, CoreError>> {
  const processor = createMockDataProcessor()

  const parseResult = processor.parseData<T>(sourceData, sourceFormat)
  if (parseResult.isErr()) {
    return err(parseResult.error)
  }

  return processor.transform(parseResult.value, transformation)
}

/**
 * Creates a complete data processing test scenario
 *
 * Sets up a mock processor with optional sample data and transformation mocks,
 * returning testing helpers for parsing, conversion, and validation.
 *
 * @param options - Scenario configuration
 * @param options.formats - Supported formats
 * @param options.sampleData - Sample data by format
 * @param options.transformations - Transformation mocks
 * @returns Test scenario with processor and helper methods
 */
export function createDataTestScenario(
  options: {
    formats?: DataFormat[]
    sampleData?: Record<DataFormat, string | DataRecord[]>
    transformations?: Array<{ source: DataFormat; target: DataFormat; result: any }>
  } = {}
): {
  processor: MockDataProcessor
  testParsing: (data: string, format: DataFormat) => Result<DataSet, CoreError>
  testConversion: (dataset: DataSet, targetFormat: DataFormat) => Result<string | Buffer, CoreError>
  testValidation: (dataset: DataSet, schema: Record<string, any>) => Result<DataSet, CoreError>
  cleanup: () => void
} {
  const processor = createMockDataProcessor()

  // Setup sample data mocks
  if (options.sampleData) {
    for (const [format, data] of Object.entries(options.sampleData)) {
      processor.mockFormat(format as DataFormat, data)
    }
  }

  // Setup transformation mocks
  if (options.transformations) {
    for (const transformation of options.transformations) {
      processor.mockTransformation(
        transformation.source,
        transformation.target,
        transformation.result
      )
    }
  }

  return {
    processor,

    testParsing(data: string, format: DataFormat): Result<DataSet, CoreError> {
      return processor.parseData(data, format)
    },

    testConversion(dataset: DataSet, targetFormat: DataFormat): Result<string | Buffer, CoreError> {
      return processor.convertFormat(dataset, targetFormat)
    },

    testValidation(dataset: DataSet, schema: Record<string, any>): Result<DataSet, CoreError> {
      return processor.validateData(dataset, schema)
    },

    cleanup(): void {
      processor.clearMocks()
    },
  }
}

// ========================================
// Format Testing Imports
// ========================================

export {
  createMockFormatDetector,
  testFormatConversion,
  validateFormat,
  assertFormatDetection,
  assertFormatConversion as assertFormatTransformation,
  assertFormatValidation,
  formatFixtures,
  formatTesting,
  type SupportedFormat,
  type FormatDetectionResult,
  type FormatConversionOptions,
  type MockFormatDetector,
} from './format-testing.js'

// Import for use in unified testing
import { formatTesting, formatFixtures } from './format-testing.js'

// ========================================
// Export Collections
// ========================================

/**
 * Data testing utilities grouped by functionality
 */
export const dataTesting = {
  // Processor creation
  createMockDataProcessor,
  createDataTestScenario,

  // Testing utilities
  testDataConversion,
  testDataTransformationFlow,

  // Fixtures and test data
  fixtures: dataFixtures,

  // Assertions
  assertDataParsing,
  assertDataTransformation,
  assertFormatConversion,
  assertDataValidation,
  assertValidationFailure,
  assertDataFields,
}

/**
 * Unified testing utilities combining data and format testing
 */
export const unifiedTesting = {
  // Data testing
  ...dataTesting,

  // Format testing
  ...formatTesting,

  // Combined fixtures
  allFixtures: {
    data: dataFixtures,
    formats: formatFixtures,
  },
}
