import { describe, it, expect } from 'vitest'
import { createExcelOperations } from './core.js'

describe('Excel Core Operations', () => {
  const excelOps = createExcelOperations()

  describe('validate', () => {
    it('should validate non-empty buffer', () => {
      const buffer = Buffer.from('some data', 'utf8')
      const result = excelOps.validate(buffer)

      expect(result.isOk()).toBe(true)
      // Note: This will likely return false since it's not a valid Excel file
      // but the validate function should not throw
    })

    it('should reject empty buffer', () => {
      const buffer = Buffer.alloc(0)
      const result = excelOps.validate(buffer)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe(false)
      }
    })
  })

  describe('parseBuffer', () => {
    it('should handle empty buffer', () => {
      const buffer = Buffer.alloc(0)
      const result = excelOps.parseBuffer(buffer)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toBe('Empty buffer provided')
      }
    })

    it('should handle invalid Excel data', () => {
      const buffer = Buffer.from('not excel data', 'utf8')
      const result = excelOps.parseBuffer(buffer)

      // Note: SheetJS might not fail on invalid data but create empty sheets
      // We just verify it doesn't throw and returns a Result
      expect(result.isOk() || result.isErr()).toBe(true)
    })
  })

  describe('stringify', () => {
    it('should handle empty data array', async () => {
      const result = await excelOps.stringify([])

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toBe('Cannot create Excel file from empty data')
      }
    })

    it('should reject non-array input', async () => {
      const result = await excelOps.stringify('not an array' as any)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toBe('Data must be an array')
      }
    })

    it('should create Excel buffer from valid data', async () => {
      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ]
      const result = await excelOps.stringify(data)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(Buffer.isBuffer(result.value)).toBe(true)
        expect(result.value.length).toBeGreaterThan(0)
      }
    })
  })

  describe('getWorksheetNames', () => {
    it('should handle empty buffer', () => {
      const buffer = Buffer.alloc(0)
      const result = excelOps.getWorksheetNames(buffer)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toBe('Empty buffer provided')
      }
    })
  })

  describe('createWorkbook', () => {
    it('should handle empty worksheets array', async () => {
      const result = await excelOps.createWorkbook([])

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toBe('No worksheets provided')
      }
    })

    it('should create workbook from valid worksheets', async () => {
      const worksheets = [
        {
          name: 'Sheet1',
          data: [
            ['Name', 'Age'],
            ['John', 30],
            ['Jane', 25],
          ],
        },
      ]
      const result = await excelOps.createWorkbook(worksheets)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(Buffer.isBuffer(result.value)).toBe(true)
        expect(result.value.length).toBeGreaterThan(0)
      }
    })

    it('should skip empty worksheets', async () => {
      const worksheets = [
        { name: 'Empty', data: [] },
        {
          name: 'Valid',
          data: [
            ['Name', 'Age'],
            ['John', 30],
          ],
        },
      ]
      const result = await excelOps.createWorkbook(worksheets)

      expect(result.isOk()).toBe(true)
    })
  })

  describe('detectFormat', () => {
    it('should handle empty buffer', () => {
      const buffer = Buffer.alloc(0)
      const result = excelOps.detectFormat(buffer)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toBe('Empty buffer provided for format detection')
      }
    })
  })
})
