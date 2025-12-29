import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { join } from 'path'
import { tmpdir } from 'os'
import { mkdtemp, rm, writeFile } from 'fs/promises'
import { createCSVOperations } from '../src/csv/core.js'

describe('CSV Integration Tests', () => {
  const csvOps = createCSVOperations()
  const fixturesPath = join(__dirname, 'fixtures')
  let tempDir: string

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'csv-test-'))
  })

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  describe('parseFile', () => {
    it('should parse CSV file with headers', async () => {
      const result = await csvOps.parseFile(join(fixturesPath, 'sample.csv'))

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const { data, metadata } = result.value
        expect(data.length).toBe(5)
        expect(metadata.totalRows).toBe(5)
        expect(metadata.format).toBe('csv')
        expect(metadata.hasHeaders).toBe(true)

        // Check first record
        const first = data[0] as Record<string, unknown>
        expect(first.id).toBe('1')
        expect(first.name).toBe('Alice')
        expect(first.email).toBe('alice@example.com')
      }
    })

    it('should parse CSV with dynamic typing enabled', async () => {
      const typedOps = createCSVOperations({ dynamicTyping: true })
      const result = await typedOps.parseFile(join(fixturesPath, 'sample.csv'))

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const first = result.value.data[0] as Record<string, unknown>
        expect(first.id).toBe(1) // Number, not string
        expect(first.age).toBe(30)
        expect(first.active).toBe(true) // Boolean
      }
    })

    it('should return error for non-existent file', async () => {
      const result = await csvOps.parseFile('/non/existent/file.csv')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBeDefined()
      }
    })

    it('should handle empty file', async () => {
      const emptyPath = join(tempDir, 'empty.csv')
      await writeFile(emptyPath, '')

      const result = await csvOps.parseFile(emptyPath)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('Empty')
      }
    })
  })

  describe('writeFile', () => {
    it('should stringify data correctly', () => {
      // Test the stringify function since writeFile depends on @trailhead/cli/fs
      const data = [
        { name: 'Test1', value: 100 },
        { name: 'Test2', value: 200 },
      ]

      const result = csvOps.stringify(data)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const content = result.value
        expect(content).toContain('name')
        expect(content).toContain('value')
        expect(content).toContain('Test1')
        expect(content).toContain('100')
      }
    })

    it('should round-trip data correctly via stringify/parseString', () => {
      // Use in-memory operations to test data roundtrip without fs dependency
      const originalData = [
        { id: 1, name: 'Alice', score: 95.5 },
        { id: 2, name: 'Bob', score: 87.3 },
      ]

      const stringifyResult = csvOps.stringify(originalData)
      expect(stringifyResult.isOk()).toBe(true)

      if (stringifyResult.isOk()) {
        const parseResult = csvOps.parseString(stringifyResult.value, { dynamicTyping: true })
        expect(parseResult.isOk()).toBe(true)

        if (parseResult.isOk()) {
          const readData = parseResult.value.data as typeof originalData
          expect(readData.length).toBe(2)
          expect(readData[0].name).toBe('Alice')
          expect(readData[1].score).toBe(87.3)
        }
      }
    })
  })

  describe('parseString', () => {
    it('should parse CSV string with custom delimiter', () => {
      const csvData = 'name;value\nTest;100'
      const result = csvOps.parseString(csvData, { delimiter: ';' })

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const first = result.value.data[0] as Record<string, unknown>
        expect(first.name).toBe('Test')
        expect(first.value).toBe('100')
      }
    })

    it('should handle quoted fields with special characters', () => {
      const csvData = 'name,description\nTest,"Contains, comma"\nAnother,"Has ""quotes"""\n'
      const result = csvOps.parseString(csvData)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const data = result.value.data as Record<string, unknown>[]
        expect(data[0].description).toBe('Contains, comma')
        expect(data[1].description).toBe('Has "quotes"')
      }
    })
  })

  describe('detectFormat', () => {
    it('should detect CSV format characteristics', () => {
      const csvData = 'a,b,c\n1,2,3\n4,5,6'
      const result = csvOps.detectFormat(csvData)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.delimiter).toBe(',')
        expect(result.value.columnCount).toBe(3)
        expect(result.value.rowCount).toBe(3)
      }
    })

    it('should detect semicolon delimiter', () => {
      const csvData = 'a;b;c\n1;2;3'
      const result = csvOps.detectFormat(csvData)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.delimiter).toBe(';')
      }
    })
  })

  describe('validate', () => {
    it('should validate well-formed CSV', () => {
      const result = csvOps.validate('a,b,c\n1,2,3')
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe(true)
      }
    })

    it('should return false for empty data', () => {
      const result = csvOps.validate('')
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe(false)
      }
    })
  })
})
