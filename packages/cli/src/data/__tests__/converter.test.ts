import { describe, it, expect } from 'vitest';
import { createDataConverter, detectFormat, conversionUtils } from '../converter.js';

describe('Data Converter', () => {
  const csvData = `name,age,email
John,30,john@example.com
Jane,25,jane@example.com`;

  const jsonData = `[
    {"name": "John", "age": 30, "email": "john@example.com"},
    {"name": "Jane", "age": 25, "email": "jane@example.com"}
  ]`;

  describe('createDataConverter', () => {
    it('should create a data converter', () => {
      const converter = createDataConverter();
      expect(converter).toBeDefined();
      expect(typeof converter.convert).toBe('function');
      expect(typeof converter.autoConvert).toBe('function');
    });
  });

  describe('convert', () => {
    it('should convert CSV to JSON', async () => {
      const converter = createDataConverter();
      const result = await converter.convert(csvData, 'csv', 'json');

      expect(result.success).toBe(true);
      if (result.success) {
        const parsed = JSON.parse(result.value as string);
        expect(parsed).toHaveLength(2);
        expect(parsed[0].name).toBe('John');
        expect(parsed[0].age).toBe(30);
        expect(parsed[0].email).toBe('john@example.com');
      }
    });

    it('should convert JSON to CSV', async () => {
      const converter = createDataConverter();
      const result = await converter.convert(jsonData, 'json', 'csv');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toContain('name');
        expect(result.value).toContain('age');
        expect(result.value).toContain('email');
        expect(result.value).toContain('John');
        expect(result.value).toContain('30');
        expect(result.value).toContain('john@example.com');
      }
    });

    it('should return same data when formats are identical', async () => {
      const converter = createDataConverter();
      const result = await converter.convert(csvData, 'csv', 'csv');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(csvData);
      }
    });

    it('should handle unsupported format', async () => {
      const converter = createDataConverter();
      const result = await converter.convert(csvData, 'csv', 'xml' as any);

      expect(result.success).toBe(false);
    });
  });

  describe('autoConvert', () => {
    it('should auto-detect CSV and convert to JSON', async () => {
      const converter = createDataConverter();
      const result = await converter.autoConvert(csvData, 'json');

      expect(result.success).toBe(true);
      if (result.success) {
        const parsed = JSON.parse(result.value as string);
        expect(parsed).toHaveLength(2);
        expect(parsed[0].name).toBe('John');
      }
    });

    it('should auto-detect JSON and convert to CSV', async () => {
      const converter = createDataConverter();
      const result = await converter.autoConvert(jsonData, 'csv');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toContain('name');
        expect(result.value).toContain('John');
      }
    });

    it('should fail when format cannot be detected', async () => {
      const converter = createDataConverter();
      const result = await converter.autoConvert('invalid data', 'json');

      expect(result.success).toBe(false);
    });
  });
});

describe('Format Detection', () => {
  describe('detectFormat', () => {
    it('should detect CSV format', () => {
      const csvData = `name,age,email
John,30,john@example.com
Jane,25,jane@example.com`;

      const result = detectFormat(csvData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.format).toBe('csv');
        expect(result.value.confidence).toBeGreaterThan(0.7);
      }
    });

    it('should detect JSON format', () => {
      const jsonData = `{"name": "John", "age": 30}`;

      const result = detectFormat(jsonData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.format).toBe('json');
        expect(result.value.confidence).toBeGreaterThan(0.8);
      }
    });

    it('should detect JSON array format', () => {
      const jsonData = `[{"name": "John"}, {"name": "Jane"}]`;

      const result = detectFormat(jsonData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.format).toBe('json');
        expect(result.value.confidence).toBeGreaterThan(0.8);
      }
    });

    it('should return unknown for unrecognized format', () => {
      const result = detectFormat('invalid data format');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.format).toBe('unknown');
        expect(result.value.confidence).toBe(0);
      }
    });

    it('should handle empty string', () => {
      const result = detectFormat('');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.format).toBe('unknown');
        expect(result.value.confidence).toBe(0);
      }
    });

    it('should handle semicolon-delimited CSV', () => {
      const csvData = `name;age;email
John;30;john@example.com
Jane;25;jane@example.com`;

      const result = detectFormat(csvData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.format).toBe('csv');
        expect(result.value.confidence).toBeGreaterThan(0.7);
      }
    });

    it('should handle tab-delimited CSV', () => {
      const csvData = `name\tage\temail
John\t30\tjohn@example.com
Jane\t25\tjane@example.com`;

      const result = detectFormat(csvData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.format).toBe('csv');
        expect(result.value.confidence).toBeGreaterThan(0.7);
      }
    });

    it('should prioritize JSON over CSV for ambiguous data', () => {
      const ambiguousData = `{"name": "John", "values": "1,2,3"}`;

      const result = detectFormat(ambiguousData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.format).toBe('json');
      }
    });
  });
});

describe('Conversion Utils', () => {
  describe('csvToJson', () => {
    it('should convert CSV to JSON', async () => {
      const csvData = `name,age
John,30
Jane,25`;

      const result = await conversionUtils.csvToJson(csvData);
      expect(result.success).toBe(true);
      if (result.success) {
        const parsed = JSON.parse(result.value);
        expect(parsed).toHaveLength(2);
        expect(parsed[0].name).toBe('John');
      }
    });
  });

  describe('jsonToCsv', () => {
    it('should convert JSON to CSV', async () => {
      const jsonData = `[{"name": "John", "age": 30}, {"name": "Jane", "age": 25}]`;

      const result = await conversionUtils.jsonToCsv(jsonData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toContain('name');
        expect(result.value).toContain('age');
        expect(result.value).toContain('John');
        expect(result.value).toContain('Jane');
      }
    });
  });

  describe('autoConvertTo', () => {
    it('should auto-detect and convert to JSON', async () => {
      const csvData = `name,age
John,30
Jane,25`;

      const result = await conversionUtils.autoConvertTo(csvData, 'json');
      expect(result.success).toBe(true);
      if (result.success) {
        const parsed = JSON.parse(result.value as string);
        expect(parsed).toHaveLength(2);
        expect(parsed[0].name).toBe('John');
      }
    });
  });

  describe('batchConvert', () => {
    it('should convert multiple data strings', async () => {
      const csvData1 = `name,age
John,30`;
      const csvData2 = `name,age
Jane,25`;

      const result = await conversionUtils.batchConvert([csvData1, csvData2], 'csv', 'json');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toHaveLength(2);
        const parsed1 = JSON.parse(result.value[0] as string);
        const parsed2 = JSON.parse(result.value[1] as string);
        expect(parsed1[0].name).toBe('John');
        expect(parsed2[0].name).toBe('Jane');
      }
    });

    it('should handle errors in batch conversion', async () => {
      const validData = `name,age
John,30`;
      const invalidData = `"unclosed quote,field`; // Malformed CSV with unclosed quote

      const result = await conversionUtils.batchConvert([validData, invalidData], 'csv', 'json');
      expect(result.success).toBe(false);
    });
  });
});
