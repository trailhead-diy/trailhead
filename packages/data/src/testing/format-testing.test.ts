/**
 * Test suite for format-testing utilities
 * Validates format conversion, detection, and validation functionality
 */

import { describe, test, expect } from 'vitest'
import { resultMatchers } from '@esteban-url/core/testing'

// Setup Result matchers for testing
expect.extend(resultMatchers)
import {
  createMockFormatDetector,
  testFormatConversion,
  validateFormat,
  formatFixtures,
  assertFormatDetection,
  assertFormatConversion,
  assertFormatValidation,
} from './format-testing.js'

describe('Format Testing Utilities', () => {
  describe('createMockFormatDetector', () => {
    test('should detect format from file path extension', async () => {
      const detector = createMockFormatDetector()

      const result = await detector.detectFormat('/path/to/file.json')
      expect(result).toBeOk()
      expect(result.value.format).toBe('json')
      expect(result.value.confidence).toBe(0.9)
    })

    test('should detect format from content', () => {
      const detector = createMockFormatDetector()

      const result = detector.detectFormatFromContent('{"name": "test"}')
      expect(result).toBeOk()
      expect(result.value.format).toBe('json')
      expect(result.value.confidence).toBe(0.7)
    })

    test('should use custom detector', () => {
      const detector = createMockFormatDetector()
      detector.addCustomDetector('json', (content) => content.includes('customJson'))

      const result = detector.detectFormatFromContent('customJson content')
      expect(result).toBeOk()
      expect(result.value.format).toBe('json')
      expect(result.value.confidence).toBe(0.8)
    })

    test('should return error for unknown format', async () => {
      const detector = createMockFormatDetector()

      const result = await detector.detectFormat('/path/to/file.unknown')
      expect(result).toBeErr()
      expect(result.error.code).toBe('UNKNOWN_FORMAT')
    })
  })

  describe('testFormatConversion', () => {
    test('should convert JSON to YAML', async () => {
      const jsonContent = '{"name": "test", "value": 42}'
      const result = await testFormatConversion(jsonContent, 'json', 'yaml')

      expect(result).toBeOk()
      expect(result.value).toContain('name: test')
      expect(result.value).toContain('value: 42')
    })

    test('should convert JSON to CSV', async () => {
      const jsonContent = '[{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]'
      const result = await testFormatConversion(jsonContent, 'json', 'csv')

      expect(result).toBeOk()
      expect(result.value).toContain('name,age')
      expect(result.value).toContain('Alice')
      expect(result.value).toContain('Bob')
    })

    test('should convert JSON to XML', async () => {
      const jsonContent = '{"name": "test", "value": 42}'
      const result = await testFormatConversion(jsonContent, 'json', 'xml')

      expect(result).toBeOk()
      expect(result.value).toContain('<name>test</name>')
      expect(result.value).toContain('<value>42</value>')
    })

    test('should convert JSON to TOML', async () => {
      const jsonContent = '{"name": "test", "value": 42}'
      const result = await testFormatConversion(jsonContent, 'json', 'toml')

      expect(result).toBeOk()
      expect(result.value).toContain('name = "test"')
      expect(result.value).toContain('value = "42"')
    })

    test('should convert CSV to JSON', async () => {
      const csvContent = 'name,age\nAlice,30\nBob,25'
      const result = await testFormatConversion(csvContent, 'csv', 'json')

      expect(result).toBeOk()
      const parsed = JSON.parse(result.value)
      expect(parsed.length).toBe(2)
      expect(parsed[0]).toEqual({ name: 'Alice', age: '30' })
    })

    test('should convert YAML to JSON', async () => {
      const yamlContent = 'name: test\nvalue: 42'
      const result = await testFormatConversion(yamlContent, 'yaml', 'json')

      expect(result).toBeOk()
      const parsed = JSON.parse(result.value)
      expect(parsed.name).toBe('test')
      expect(parsed.value).toBe('42')
    })

    test('should convert XML to JSON', async () => {
      const xmlContent = '<root><name>test</name><value>42</value></root>'
      const result = await testFormatConversion(xmlContent, 'xml', 'json')

      expect(result).toBeOk()
      const parsed = JSON.parse(result.value)
      expect(parsed.root.name).toBe('test')
      expect(parsed.root.value).toBe('42')
    })

    test('should convert TOML to JSON', async () => {
      const tomlContent = 'name = "test"\nvalue = 42'
      const result = await testFormatConversion(tomlContent, 'toml', 'json')

      expect(result).toBeOk()
      const parsed = JSON.parse(result.value)
      expect(parsed.name).toBe('test')
      expect(parsed.value).toBe('42')
    })

    test('should handle conversion errors', async () => {
      const invalidJson = '{"invalid": json}'
      const result = await testFormatConversion(invalidJson, 'json', 'yaml')

      expect(result).toBeErr()
      expect(result.error.code).toBe('CONVERSION_FAILED')
    })

    test('should provide default conversion for unsupported formats', async () => {
      const textContent = 'Plain text content'
      const result = await testFormatConversion(textContent, 'text', 'markdown')

      expect(result).toBeOk()
      expect(result.value).toContain('# Converted from text to markdown')
      expect(result.value).toContain(textContent)
    })
  })

  describe('validateFormat', () => {
    test('should validate JSON format', () => {
      const validJson = '{"name": "test", "value": 42}'
      const result = validateFormat(validJson, 'json')

      expect(result).toBeOk()
      expect(result.value.valid).toBe(true)
      expect(result.value.errors.length).toBe(0)
    })

    test('should reject invalid JSON', () => {
      const invalidJson = '{"name": "test", invalid}'
      const result = validateFormat(invalidJson, 'json')

      expect(result).toBeOk()
      expect(result.value.valid).toBe(false)
      expect(result.value.errors.length).toBeGreaterThan(0)
    })

    test('should validate CSV format', () => {
      const validCsv = 'name,age\nAlice,30\nBob,25'
      const result = validateFormat(validCsv, 'csv')

      expect(result).toBeOk()
      expect(result.value.valid).toBe(true)
    })

    test('should reject invalid CSV', () => {
      const invalidCsv = 'name,age\nAlice,30\nBob,25,extra'
      const result = validateFormat(invalidCsv, 'csv')

      expect(result).toBeOk()
      expect(result.value.valid).toBe(false)
      expect(result.value.errors.length).toBeGreaterThan(0)
    })

    test('should validate XML format', () => {
      const validXml = '<root><name>test</name></root>'
      const result = validateFormat(validXml, 'xml')

      expect(result).toBeOk()
      expect(result.value.valid).toBe(true)
    })

    test('should reject invalid XML', () => {
      const invalidXml = '<root><name>test</value></root>'
      const result = validateFormat(invalidXml, 'xml')

      expect(result).toBeOk()
      expect(result.value.valid).toBe(false)
      expect(result.value.errors.length).toBeGreaterThan(0)
    })

    test('should validate YAML format', () => {
      const validYaml = 'name: test\nvalue: 42'
      const result = validateFormat(validYaml, 'yaml')

      expect(result).toBeOk()
      expect(result.value.valid).toBe(true)
    })

    test('should validate TOML format', () => {
      const validToml = 'name = "test"\nvalue = 42'
      const result = validateFormat(validToml, 'toml')

      expect(result).toBeOk()
      expect(result.value.valid).toBe(true)
    })

    test('should validate INI format', () => {
      const validIni = '[section]\nname=test\nvalue=42'
      const result = validateFormat(validIni, 'ini')

      expect(result).toBeOk()
      expect(result.value.valid).toBe(true)
    })

    test('should always validate markdown and text', () => {
      const markdown = '# Test Document\n\nThis is a test.'
      const markdownResult = validateFormat(markdown, 'markdown')
      expect(markdownResult).toBeOk()
      expect(markdownResult.value.valid).toBe(true)

      const text = 'Plain text content'
      const textResult = validateFormat(text, 'text')
      expect(textResult).toBeOk()
      expect(textResult.value.valid).toBe(true)
    })
  })

  describe('formatFixtures', () => {
    test('should provide valid fixtures for all formats', () => {
      expect(formatFixtures.json.simple).toContain('test')
      expect(formatFixtures.yaml.simple).toContain('name: test')
      expect(formatFixtures.csv.simple).toContain('name,age,email')
      expect(formatFixtures.xml.simple).toContain('<name>test</name>')
      expect(formatFixtures.toml.simple).toContain('name = "test"')
      expect(formatFixtures.ini.simple).toContain('[section]')
      expect(formatFixtures.markdown.simple).toContain('# Test Document')
    })

    test('should provide complex fixtures', () => {
      expect(formatFixtures.json.complex).toContain('users')
      expect(formatFixtures.yaml.complex).toContain('users:')
      expect(formatFixtures.csv.withQuotes).toContain('"Alice Smith"')
      expect(formatFixtures.xml.complex).toContain('<users>')
      expect(formatFixtures.toml.complex).toContain('[database]')
      expect(formatFixtures.ini.complex).toContain('[database]')
      expect(formatFixtures.markdown.complex).toContain('# API Documentation')
    })

    test('should provide invalid fixtures', () => {
      expect(formatFixtures.json.invalid).toContain('invalid json')
      expect(formatFixtures.yaml.invalid).toContain('invalid:')
      expect(formatFixtures.csv.invalid).toContain('Alice,30')
      expect(formatFixtures.xml.invalid).toContain('</value>')
      expect(formatFixtures.toml.invalid).toContain('name = "test')
      expect(formatFixtures.ini.invalid).toContain('[section')
    })
  })

  describe('Assertion Functions', () => {
    describe('assertFormatDetection', () => {
      test('should pass for valid detection', () => {
        const detector = createMockFormatDetector()
        const result = detector.detectFormatFromContent('{"test": true}')

        expect(() => assertFormatDetection(result, 'json')).not.toThrow()
      })

      test('should fail for wrong format', () => {
        const detector = createMockFormatDetector()
        const result = detector.detectFormatFromContent('{"test": true}')

        expect(() => assertFormatDetection(result, 'yaml')).toThrow()
      })

      test('should fail for low confidence', () => {
        const detector = createMockFormatDetector()
        const result = detector.detectFormatFromContent('test,value')

        expect(() => assertFormatDetection(result, 'csv', 0.6)).toThrow()
      })
    })

    describe('assertFormatConversion', () => {
      test('should pass for successful conversion', async () => {
        const result = await testFormatConversion('{"test": true}', 'json', 'yaml')

        expect(() => assertFormatConversion(result)).not.toThrow()
      })

      test('should fail for conversion error', async () => {
        const result = await testFormatConversion('invalid json', 'json', 'yaml')

        expect(() => assertFormatConversion(result)).toThrow()
      })
    })

    describe('assertFormatValidation', () => {
      test('should pass for valid format', () => {
        const result = validateFormat('{"test": true}', 'json')

        expect(() => assertFormatValidation(result, true)).not.toThrow()
      })

      test('should pass for invalid format', () => {
        const result = validateFormat('invalid json', 'json')

        expect(() => assertFormatValidation(result, false)).not.toThrow()
      })

      test('should fail for wrong validation result', () => {
        const result = validateFormat('{"test": true}', 'json')

        expect(() => assertFormatValidation(result, false)).toThrow()
      })
    })
  })

  describe('Integration Tests', () => {
    test('should handle complete format workflow', async () => {
      const detector = createMockFormatDetector()

      // 1. Detect format
      const detectionResult = detector.detectFormatFromContent(formatFixtures.json.simple)
      expect(detectionResult).toBeOk()
      expect(detectionResult.value.format).toBe('json')

      // 2. Validate format
      const validationResult = validateFormat(formatFixtures.json.simple, 'json')
      expect(validationResult).toBeOk()
      expect(validationResult.value.valid).toBe(true)

      // 3. Convert format
      const conversionResult = await testFormatConversion(
        formatFixtures.json.simple,
        'json',
        'yaml'
      )
      expect(conversionResult).toBeOk()
      expect(conversionResult.value).toContain('name: test')

      // 4. Validate converted format
      const convertedValidation = validateFormat(conversionResult.value, 'yaml')
      expect(convertedValidation).toBeOk()
      expect(convertedValidation.value.valid).toBe(true)
    })

    test('should handle error cases gracefully', async () => {
      // Invalid JSON conversion
      const invalidConversion = await testFormatConversion('invalid json', 'json', 'yaml')
      expect(invalidConversion).toBeErr()

      // Invalid format validation
      const invalidValidation = validateFormat('invalid json', 'json')
      expect(invalidValidation).toBeOk()
      expect(invalidValidation.value.valid).toBe(false)

      // Unknown format detection
      const detector = createMockFormatDetector()
      const unknownFormat = await detector.detectFormat('file.unknown')
      expect(unknownFormat).toBeErr()
    })
  })
})
