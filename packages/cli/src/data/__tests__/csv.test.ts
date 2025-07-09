import { describe, it, expect } from 'vitest';
import { createCSVProcessor, csvUtils } from '../csv.js';

describe('CSV Processor', () => {
  const csvData = `name,age,email
John,30,john@example.com
Jane,25,jane@example.com
Bob,35,bob@example.com`;

  const csvDataNoHeader = `John,30,john@example.com
Jane,25,jane@example.com
Bob,35,bob@example.com`;

  describe('createCSVProcessor', () => {
    it('should create a CSV processor with default options', () => {
      const processor = createCSVProcessor();
      expect(processor).toBeDefined();
      expect(typeof processor.parseString).toBe('function');
      expect(typeof processor.stringify).toBe('function');
    });

    it('should create a CSV processor with custom options', () => {
      const processor = createCSVProcessor({
        delimiter: ';',
        hasHeader: false,
        dynamicTyping: false,
      });
      expect(processor).toBeDefined();
    });
  });

  describe('parseString', () => {
    it('should parse CSV string with headers', () => {
      const processor = createCSVProcessor();
      const result = processor.parseString(csvData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toHaveLength(3);
        expect(result.value[0]).toEqual({
          name: 'John',
          age: 30,
          email: 'john@example.com',
        });
      }
    });

    it('should parse CSV string without headers', () => {
      const processor = createCSVProcessor({ hasHeader: false });
      const result = processor.parseString(csvDataNoHeader);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toHaveLength(3);
        expect(result.value[0]).toEqual(['John', 30, 'john@example.com']);
      }
    });

    it('should handle malformed CSV with error tolerance', () => {
      const malformedCsv = `name,age,email
John,30,john@example.com
Jane,25,jane@example.com,extra_field
Bob,35,bob@example.com`;

      const processor = createCSVProcessor({ errorTolerant: true });
      const result = processor.parseString(malformedCsv);

      expect(result.success).toBe(true);
    });

    it('should fail on malformed CSV without error tolerance', () => {
      const malformedCsv = `name,age,email
John,30,john@example.com
Jane,25,jane@example.com,extra_field
Bob,35,bob@example.com`;

      const processor = createCSVProcessor({ errorTolerant: false });
      const result = processor.parseString(malformedCsv);

      expect(result.success).toBe(false);
    });

    it('should handle custom delimiter', () => {
      const semicolonCsv = `name;age;email
John;30;john@example.com
Jane;25;jane@example.com`;

      const processor = createCSVProcessor({ delimiter: ';' });
      const result = processor.parseString(semicolonCsv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0].name).toBe('John');
      }
    });

    it('should handle comments in CSV', () => {
      const csvWithComments = `# This is a comment
name,age,email
John,30,john@example.com
# Another comment
Jane,25,jane@example.com`;

      const processor = createCSVProcessor({ comments: '#' });
      const result = processor.parseString(csvWithComments);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toHaveLength(2);
      }
    });

    it('should apply transformations', () => {
      const processor = createCSVProcessor({
        transform: (value, field) => {
          if (field === 'name') {
            return value.toUpperCase();
          }
          return value;
        },
      });

      const result = processor.parseString(csvData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value[0].name).toBe('JOHN');
      }
    });
  });

  describe('parseToObjects', () => {
    it('should parse CSV to array of objects', () => {
      const processor = createCSVProcessor();
      const result = processor.parseToObjects(csvData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toHaveLength(3);
        expect(result.value[0]).toEqual({
          name: 'John',
          age: 30,
          email: 'john@example.com',
        });
      }
    });
  });

  describe('parseToArrays', () => {
    it('should parse CSV to array of arrays', () => {
      const processor = createCSVProcessor();
      const result = processor.parseToArrays(csvData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toHaveLength(4); // Including header
        expect(result.value[0]).toEqual(['name', 'age', 'email']);
        expect(result.value[1]).toEqual(['John', 30, 'john@example.com']);
      }
    });
  });

  describe('fromObjects', () => {
    it('should convert objects to CSV', () => {
      const processor = createCSVProcessor();
      const objects = [
        { name: 'John', age: 30, email: 'john@example.com' },
        { name: 'Jane', age: 25, email: 'jane@example.com' },
      ];

      const result = processor.fromObjects(objects);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toContain('name,age,email');
        expect(result.value).toContain('John,30,john@example.com');
      }
    });
  });

  describe('fromArrays', () => {
    it('should convert arrays to CSV', () => {
      const processor = createCSVProcessor();
      const arrays = [
        ['name', 'age', 'email'],
        ['John', '30', 'john@example.com'],
        ['Jane', '25', 'jane@example.com'],
      ];

      const result = processor.fromArrays(arrays);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toContain('name,age,email');
        expect(result.value).toContain('John,30,john@example.com');
      }
    });
  });

  describe('detectFormat', () => {
    it('should detect CSV format', () => {
      const processor = createCSVProcessor();
      const result = processor.detectFormat(csvData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.delimiter).toBe(',');
        expect(result.value.hasHeader).toBe(true);
        expect(result.value.rowCount).toBe(4);
        expect(result.value.columnCount).toBe(3);
      }
    });

    it('should detect semicolon delimiter', () => {
      const semicolonCsv = `name;age;email
John;30;john@example.com`;

      const processor = createCSVProcessor();
      const result = processor.detectFormat(semicolonCsv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.delimiter).toBe(';');
      }
    });
  });

  describe('validate', () => {
    it('should validate valid CSV', () => {
      const processor = createCSVProcessor();
      const result = processor.validate(csvData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(true);
      }
    });

    it('should reject malformed CSV', () => {
      const processor = createCSVProcessor();
      const malformedCsv = `name,age,email
John,30,john@example.com
Jane,25,jane@example.com,extra,field,too,many
Bob,35,bob@example.com`;

      const result = processor.validate(malformedCsv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(false);
      }
    });
  });

  describe('stringify', () => {
    it('should stringify data to CSV', () => {
      const processor = createCSVProcessor();
      const data = [
        { name: 'John', age: 30, email: 'john@example.com' },
        { name: 'Jane', age: 25, email: 'jane@example.com' },
      ];

      const result = processor.stringify(data);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toContain('name,age,email');
        expect(result.value).toContain('John,30,john@example.com');
      }
    });
  });
});

describe('CSV Utils', () => {
  describe('detectDelimiter', () => {
    it('should detect comma delimiter', () => {
      const csvData = 'name,age,email\nJohn,30,john@example.com';
      const result = csvUtils.detectDelimiter(csvData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(',');
      }
    });

    it('should detect semicolon delimiter', () => {
      const csvData = 'name;age;email\nJohn;30;john@example.com';
      const result = csvUtils.detectDelimiter(csvData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(';');
      }
    });

    it('should detect tab delimiter', () => {
      const csvData = 'name\tage\temail\nJohn\t30\tjohn@example.com';
      const result = csvUtils.detectDelimiter(csvData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe('\t');
      }
    });

    it('should fail when no delimiter is found', () => {
      const csvData = 'no delimiters here';
      const result = csvUtils.detectDelimiter(csvData);

      expect(result.success).toBe(false);
    });
  });

  describe('escapeField', () => {
    it('should escape field with delimiter', () => {
      const result = csvUtils.escapeField('Hello, World', ',');
      expect(result).toBe('"Hello, World"');
    });

    it('should escape field with quotes', () => {
      const result = csvUtils.escapeField('Say "Hello"', ',');
      expect(result).toBe('"Say ""Hello"""');
    });

    it('should not escape simple field', () => {
      const result = csvUtils.escapeField('Hello', ',');
      expect(result).toBe('Hello');
    });
  });

  describe('unescapeField', () => {
    it('should unescape quoted field', () => {
      const result = csvUtils.unescapeField('"Hello, World"');
      expect(result).toBe('Hello, World');
    });

    it('should unescape field with escaped quotes', () => {
      const result = csvUtils.unescapeField('"Say ""Hello"""');
      expect(result).toBe('Say "Hello"');
    });

    it('should not unescape unquoted field', () => {
      const result = csvUtils.unescapeField('Hello');
      expect(result).toBe('Hello');
    });
  });

  describe('convertDelimiter', () => {
    it('should convert comma to semicolon', () => {
      const csvData = 'name,age,email\nJohn,30,john@example.com';
      const result = csvUtils.convertDelimiter(csvData, ',', ';');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toContain('name;age;email');
        expect(result.value).toContain('John;30;john@example.com');
      }
    });

    it('should convert semicolon to comma', () => {
      const csvData = 'name;age;email\nJohn;30;john@example.com';
      const result = csvUtils.convertDelimiter(csvData, ';', ',');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toContain('name,age,email');
        expect(result.value).toContain('John,30,john@example.com');
      }
    });

    it('should handle malformed input', () => {
      const malformedCsv = 'invalid,csv,data\nwith,wrong,number,of,fields';
      const result = csvUtils.convertDelimiter(malformedCsv, ',', ';');

      expect(result.success).toBe(false);
    });
  });
});
