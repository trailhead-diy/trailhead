import { describe, it, expect } from 'vitest'
import { createCSVOperations } from './core.js'

describe('CSV Core Operations', () => {
  const csvOps = createCSVOperations()

  describe('parseString', () => {
    it('should parse valid CSV data', () => {
      const csvData = 'name,age\nJohn,30\nJane,25'
      const result = csvOps.parseString(csvData)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toHaveLength(2)
        expect(result.value[0]).toEqual({ name: 'John', age: '30' })
        expect(result.value[1]).toEqual({ name: 'Jane', age: '25' })
      }
    })

    it('should handle empty CSV data', () => {
      const result = csvOps.parseString('')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toBe('Empty CSV data provided')
      }
    })

    it('should parse CSV without headers', () => {
      const csvData = 'John,30\nJane,25'
      const result = csvOps.parseToArrays(csvData)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toHaveLength(2)
        expect(result.value[0]).toEqual(['John', '30'])
        expect(result.value[1]).toEqual(['Jane', '25'])
      }
    })
  })

  describe('stringify', () => {
    it('should stringify array of objects to CSV', () => {
      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ]
      const result = csvOps.stringify(data)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toContain('"name","age"')
        expect(result.value).toContain('"John","30"')
        expect(result.value).toContain('"Jane","25"')
      }
    })

    it('should handle empty array', () => {
      const result = csvOps.stringify([])

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe('')
      }
    })

    it('should reject non-array input', () => {
      const result = csvOps.stringify('not an array' as any)

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toBe('Data must be an array')
      }
    })
  })

  describe('validate', () => {
    it('should validate valid CSV data', () => {
      const csvData = 'name,age\nJohn,30'
      const result = csvOps.validate(csvData)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe(true)
      }
    })

    it('should reject empty data', () => {
      const result = csvOps.validate('')

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value).toBe(false)
      }
    })
  })

  describe('detectFormat', () => {
    it('should detect CSV format with comma delimiter', () => {
      const csvData = 'name,age,city\nJohn,30,NYC\nJane,25,LA'
      const result = csvOps.detectFormat(csvData)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.delimiter).toBe(',')
        expect(result.value.hasHeader).toBe(true)
        expect(result.value.columnCount).toBe(3)
        expect(result.value.rowCount).toBe(3) // Including header
      }
    })

    it('should detect CSV format with semicolon delimiter', () => {
      const csvData = 'name;age;city\nJohn;30;NYC\nJane;25;LA'
      const result = csvOps.detectFormat(csvData)

      expect(result.isOk()).toBe(true)
      if (result.isOk()) {
        expect(result.value.delimiter).toBe(';')
        expect(result.value.columnCount).toBe(3)
      }
    })

    it('should handle empty data in format detection', () => {
      const result = csvOps.detectFormat('')

      expect(result.isErr()).toBe(true)
      if (result.isErr()) {
        expect(result.error.message).toBe('Empty data provided for format detection')
      }
    })
  })
})
