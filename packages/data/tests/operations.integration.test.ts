import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { join } from 'path'
import { tmpdir } from 'os'
import { mkdtemp, rm, readFile } from 'fs/promises'
import { createUnifiedDataOperations } from '../src/operations.js'

describe('Unified Data Operations Integration', () => {
  const dataOps = createUnifiedDataOperations()
  const fixturesPath = join(__dirname, 'fixtures')
  let tempDir: string

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'data-ops-test-'))
  })

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  describe('parseAuto', () => {
    it('should auto-detect and parse CSV file', async () => {
      const result = await dataOps.parseAuto(join(fixturesPath, 'sample.csv'))

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const { data, metadata } = result.value
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBeGreaterThan(0)
        expect(metadata.format).toBe('csv')

        // Verify data structure
        const first = data[0] as Record<string, unknown>
        expect(first).toHaveProperty('id')
        expect(first).toHaveProperty('name')
      }
    })

    it('should auto-detect and parse JSON file', async () => {
      const result = await dataOps.parseAuto(join(fixturesPath, 'sample.json'))

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const { data, metadata } = result.value
        expect(data).toBeDefined()
        expect(metadata.format).toBe('json')

        // Verify JSON structure
        if (Array.isArray(data)) {
          expect(data.length).toBeGreaterThan(0)
        } else {
          expect(typeof data).toBe('object')
        }
      }
    })

    it('should return error for non-existent file', async () => {
      const result = await dataOps.parseAuto('/non/existent/file.csv')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.type).toBeDefined()
        expect(result.error.message).toBeDefined()
      }
    })

    it('should return error for unsupported format', async () => {
      // Create a file with unknown extension
      const unknownPath = join(tempDir, 'file.xyz')
      const { writeFile } = await import('fs/promises')
      await writeFile(unknownPath, 'some content')

      const result = await dataOps.parseAuto(unknownPath)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toBeDefined()
      }
    })
  })

  describe('parseAutoFromContent', () => {
    it('should detect and parse JSON content', async () => {
      const jsonContent = JSON.stringify([{ id: 1, name: 'Test' }])
      const result = await dataOps.parseAutoFromContent(jsonContent)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(Array.isArray(result.value.data)).toBe(true)
        expect(result.value.data[0].id).toBe(1)
      }
    })

    it('should detect and parse CSV content', async () => {
      const csvContent = 'id,name\n1,Alice\n2,Bob'
      const result = await dataOps.parseAutoFromContent(csvContent)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(Array.isArray(result.value.data)).toBe(true)
        expect(result.value.data.length).toBe(2)
      }
    })

    it('should use filename hint for ambiguous content', async () => {
      const content = '{"data": "test"}'
      const result = await dataOps.parseAutoFromContent(content, 'data.json')

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.data).toEqual({ data: 'test' })
      }
    })

    it('should return error for undetectable format', async () => {
      const ambiguousContent = '<html><body>Test</body></html>'
      const result = await dataOps.parseAutoFromContent(ambiguousContent)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('Cannot determine')
      }
    })
  })

  describe('writeAuto', () => {
    it('should write JSON file based on extension', async () => {
      const data = { name: 'Test', value: 42 }
      const outputPath = join(tempDir, 'output.json')

      const result = await dataOps.writeAuto(outputPath, data)

      expect(result.isOk()).toBe(true)

      // Verify file was written correctly
      const content = await readFile(outputPath, 'utf-8')
      const parsed = JSON.parse(content)
      expect(parsed.name).toBe('Test')
      expect(parsed.value).toBe(42)
    })

    it('should write CSV file based on extension', async () => {
      const data = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ]
      const outputPath = join(tempDir, 'output.csv')

      const result = await dataOps.writeAuto(outputPath, data)

      expect(result.isOk()).toBe(true)

      // Verify file was written
      const content = await readFile(outputPath, 'utf-8')
      expect(content).toContain('id')
      expect(content).toContain('name')
      expect(content).toContain('Alice')
    })

    it('should return error when writing non-array to CSV', async () => {
      const data = { name: 'Not an array' }
      const outputPath = join(tempDir, 'invalid.csv')

      const result = await dataOps.writeAuto(outputPath, data)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('array')
      }
    })

    it('should default to JSON for unknown extension', async () => {
      const data = { test: true }
      const outputPath = join(tempDir, 'output')

      const result = await dataOps.writeAuto(outputPath, data)

      expect(result.isOk()).toBe(true)

      // Should have created .json file
      const content = await readFile(`${outputPath}.json`, 'utf-8')
      expect(JSON.parse(content)).toEqual({ test: true })
    })

    describe('round-trip tests', () => {
      it('should round-trip JSON data correctly', async () => {
        const originalData = {
          users: [
            { id: 1, name: 'Alice', active: true },
            { id: 2, name: 'Bob', active: false },
          ],
          metadata: { version: '1.0' },
        }
        const filePath = join(tempDir, 'roundtrip.json')

        // Write
        const writeResult = await dataOps.writeAuto(filePath, originalData)
        expect(writeResult.isOk()).toBe(true)

        // Read back
        const readResult = await dataOps.parseAuto(filePath)
        expect(readResult.isOk()).toBe(true)

        if (readResult.isOk()) {
          expect(readResult.value.data).toEqual(originalData)
        }
      })

      it('should round-trip CSV data correctly', async () => {
        const originalData = [
          { id: 1, name: 'Alice', score: 95 },
          { id: 2, name: 'Bob', score: 87 },
        ]
        const filePath = join(tempDir, 'roundtrip.csv')

        // Write
        const writeResult = await dataOps.writeAuto(filePath, originalData)
        expect(writeResult.isOk()).toBe(true)

        // Read back
        const readResult = await dataOps.parseAuto(filePath)
        expect(readResult.isOk()).toBe(true)

        if (readResult.isOk()) {
          const { data } = readResult.value
          expect(data.length).toBe(2)
          // CSV loses type info, so compare strings
          expect(String(data[0].name)).toBe('Alice')
          expect(String(data[1].name)).toBe('Bob')
        }
      })
    })
  })

  describe('Excel round-trip', () => {
    it('should auto-detect and parse Excel file', async () => {
      const result = await dataOps.parseAuto(join(fixturesPath, 'sample.xlsx'))

      if (result.isErr()) {
        console.error('Excel parse error:', JSON.stringify(result.error, null, 2))
      }
      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        // Excel parseFile returns array directly or ParsedData structure
        const value = result.value
        const data = Array.isArray(value) ? value : value.data
        expect(Array.isArray(data)).toBe(true)
        expect(data.length).toBeGreaterThan(0)

        // Verify first row structure from BasicData sheet
        const first = data[0] as Record<string, unknown>
        expect(first).toHaveProperty('id')
        expect(first).toHaveProperty('name')
        expect(first).toHaveProperty('email')
      }
    })

    it('should round-trip Excel data correctly', async () => {
      const originalData = [
        { id: 1, product: 'Widget', price: 9.99 },
        { id: 2, product: 'Gadget', price: 19.99 },
      ]
      const filePath = join(tempDir, 'roundtrip.xlsx')

      // Write
      const writeResult = await dataOps.writeAuto(filePath, originalData)
      expect(writeResult.isOk()).toBe(true)

      // Read back
      const readResult = await dataOps.parseAuto(filePath)
      expect(readResult.isOk()).toBe(true)

      if (readResult.isOk()) {
        // Excel parseFile returns array directly or ParsedData structure
        const result = readResult.value
        const data = Array.isArray(result) ? result : result.data
        expect(Array.isArray(data)).toBe(true)
        // Should have header + 2 data rows = 3, or just 2 data rows
        expect(data.length).toBeGreaterThanOrEqual(2)

        // Verify data contains our values (Excel may use different key names)
        const allValues = data.flatMap((row: Record<string, unknown>) => Object.values(row))
        expect(allValues).toContain('Widget')
        expect(allValues).toContain('Gadget')
      }
    })
  })

  describe('detectFormat', () => {
    it('should detect CSV format from file', async () => {
      const result = await dataOps.detectFormat(join(fixturesPath, 'sample.csv'))

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toContain('csv')
      }
    })

    it('should detect JSON format from file', async () => {
      const result = await dataOps.detectFormat(join(fixturesPath, 'sample.json'))

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toContain('json')
      }
    })

    it('should detect Excel format from file', async () => {
      const result = await dataOps.detectFormat(join(fixturesPath, 'sample.xlsx'))

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        // detectFormat returns MIME type, xlsx files have this MIME type
        expect(result.value).toContain('spreadsheetml')
      }
    })
  })

  describe('convertFormat', () => {
    it('should convert array to JSON string', () => {
      const data = [{ id: 1 }, { id: 2 }]
      const result = dataOps.convertFormat(data, 'json')

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        const parsed = JSON.parse(result.value)
        expect(parsed).toEqual(data)
      }
    })

    it('should convert array to CSV string', () => {
      const data = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
      ]
      const result = dataOps.convertFormat(data, 'csv')

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toContain('name,age')
        expect(result.value).toContain('Alice,30')
        expect(result.value).toContain('Bob,25')
      }
    })

    it('should return error for non-array CSV conversion', () => {
      const data = { not: 'an array' }
      const result = dataOps.convertFormat(data, 'csv')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('array')
      }
    })

    it('should return error for Excel string conversion', () => {
      const data = [{ id: 1 }]
      const result = dataOps.convertFormat(data, 'excel')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toContain('Excel')
      }
    })
  })
})
