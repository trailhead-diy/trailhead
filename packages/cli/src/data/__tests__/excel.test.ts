import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { tmpdir } from 'os';
import { join } from 'path';
import { writeFile, unlink, mkdir, rmdir } from 'fs/promises';
import { existsSync } from 'fs';
import ExcelJS from 'exceljs';
import { createExcelProcessor, excelUtils } from '../excel.js';

describe('Excel Processing', () => {
  let tempDir: string;
  let testFilePath: string;

  beforeEach(async () => {
    tempDir = join(tmpdir(), `excel-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
    testFilePath = join(tempDir, 'test.xlsx');
  });

  afterEach(async () => {
    try {
      if (existsSync(testFilePath)) {
        await unlink(testFilePath);
      }
      await rmdir(tempDir);
    } catch {
      // Ignore cleanup errors
    }
  });

  const createTestWorkbook = async (
    data: any[][],
    worksheetName: string = 'Sheet1'
  ): Promise<Buffer> => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(worksheetName);

    data.forEach(row => {
      worksheet.addRow(row);
    });

    return (await workbook.xlsx.writeBuffer()) as Buffer;
  };

  describe('createExcelProcessor', () => {
    it('should create a processor with default options', () => {
      const processor = createExcelProcessor();
      expect(processor).toBeDefined();
      expect(typeof processor.parseFile).toBe('function');
      expect(typeof processor.stringify).toBe('function');
      expect(typeof processor.validate).toBe('function');
    });

    it('should create a processor with custom options', () => {
      const processor = createExcelProcessor({
        worksheetName: 'CustomSheet',
        hasHeader: false,
        dynamicTyping: false,
      });
      expect(processor).toBeDefined();
    });
  });

  describe('parseFile', () => {
    it('should parse Excel file with simple data', async () => {
      const testData = [
        ['Name', 'Age', 'City'],
        ['John', 30, 'New York'],
        ['Jane', 25, 'Boston'],
        ['Bob', 35, 'Chicago'],
      ];

      const buffer = await createTestWorkbook(testData);
      await writeFile(testFilePath, buffer);

      const processor = createExcelProcessor();
      const result = await processor.parseFile(testFilePath);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toHaveLength(3); // Excluding header
        expect(result.value[0]).toEqual(['John', 30, 'New York']);
        expect(result.value[1]).toEqual(['Jane', 25, 'Boston']);
        expect(result.value[2]).toEqual(['Bob', 35, 'Chicago']);
      }
    });

    it('should handle Excel file without headers', async () => {
      const testData = [
        ['John', 30, 'New York'],
        ['Jane', 25, 'Boston'],
      ];

      const buffer = await createTestWorkbook(testData);
      await writeFile(testFilePath, buffer);

      const processor = createExcelProcessor({ hasHeader: false });
      const result = await processor.parseFile(testFilePath);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0]).toEqual(['John', 30, 'New York']);
      }
    });

    it('should handle empty Excel file', async () => {
      const buffer = await createTestWorkbook([]);
      await writeFile(testFilePath, buffer);

      const processor = createExcelProcessor();
      const result = await processor.parseFile(testFilePath);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual([]);
      }
    });

    it('should handle file not found', async () => {
      const processor = createExcelProcessor();
      const result = await processor.parseFile('/nonexistent/file.xlsx');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('FS_READ_ERROR');
      }
    });

    it('should handle specific worksheet by name', async () => {
      const workbook = new ExcelJS.Workbook();
      const ws1 = workbook.addWorksheet('Sheet1');
      const ws2 = workbook.addWorksheet('Data');

      ws1.addRow(['Wrong', 'Data']);
      ws2.addRow(['Name', 'Value']);
      ws2.addRow(['Test', 42]);

      const buffer = (await workbook.xlsx.writeBuffer()) as Buffer;
      await writeFile(testFilePath, buffer);

      const processor = createExcelProcessor({ worksheetName: 'Data' });
      const result = await processor.parseFile(testFilePath);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0]).toEqual(['Test', 42]);
      }
    });

    it('should handle non-existent worksheet', async () => {
      const buffer = await createTestWorkbook([['data']]);
      await writeFile(testFilePath, buffer);

      const processor = createExcelProcessor({ worksheetName: 'NonExistent' });
      const result = await processor.parseFile(testFilePath);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('EXCEL_WORKSHEET_NOT_FOUND');
      }
    });

    it('should apply dynamic typing', async () => {
      const testData = [
        ['Name', 'Age', 'Score', 'Active'],
        ['John', '30', '95.5', 'true'],
        ['Jane', '25', '87.2', 'false'],
      ];

      const buffer = await createTestWorkbook(testData);
      await writeFile(testFilePath, buffer);

      const processor = createExcelProcessor({ dynamicTyping: true });
      const result = await processor.parseFile(testFilePath);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value[0]).toEqual(['John', 30, 95.5, true]);
        expect(result.value[1]).toEqual(['Jane', 25, 87.2, false]);
      }
    });

    it('should skip empty lines when configured', async () => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');

      worksheet.addRow(['Name', 'Age']);
      worksheet.addRow(['John', 30]);
      worksheet.addRow([]); // Empty row
      worksheet.addRow(['Jane', 25]);

      const buffer = (await workbook.xlsx.writeBuffer()) as Buffer;
      await writeFile(testFilePath, buffer);

      const processor = createExcelProcessor({ skipEmptyLines: true });
      const result = await processor.parseFile(testFilePath);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0]).toEqual(['John', 30]);
        expect(result.value[1]).toEqual(['Jane', 25]);
      }
    });
  });

  describe('stringify', () => {
    it('should create Excel buffer from array data', async () => {
      const testData = [
        ['Name', 'Age', 'City'],
        ['John', 30, 'New York'],
        ['Jane', 25, 'Boston'],
      ];

      const processor = createExcelProcessor();
      const result = await processor.stringify(testData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBeInstanceOf(Buffer);
        expect(result.value.length).toBeGreaterThan(0);
      }
    });

    it('should handle empty data', async () => {
      const processor = createExcelProcessor();
      const result = await processor.stringify([]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBeInstanceOf(Buffer);
      }
    });

    it('should handle object data', async () => {
      const testData = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ];

      const processor = createExcelProcessor();
      const result = await processor.stringify(testData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBeInstanceOf(Buffer);
      }
    });
  });

  describe('writeFile', () => {
    it('should write Excel file', async () => {
      const testData = [
        ['Name', 'Age'],
        ['John', 30],
        ['Jane', 25],
      ];

      const processor = createExcelProcessor();
      const result = await processor.writeFile(testData, testFilePath);

      expect(result.success).toBe(true);
      expect(existsSync(testFilePath)).toBe(true);
    });

    it('should handle write permission errors', async () => {
      const testData = [['data']];
      const invalidPath = '/root/readonly.xlsx';

      const processor = createExcelProcessor();
      const result = await processor.writeFile(testData, invalidPath);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('FS_WRITE_ERROR');
      }
    });
  });

  describe('validate', () => {
    it('should validate XLSX buffer', async () => {
      const buffer = await createTestWorkbook([['test']]);

      const processor = createExcelProcessor();
      const result = processor.validate(buffer);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(true);
      }
    });

    it('should reject invalid buffer', () => {
      const invalidBuffer = Buffer.from('not an excel file');

      const processor = createExcelProcessor();
      const result = processor.validate(invalidBuffer);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(false);
      }
    });

    it('should handle empty buffer', () => {
      const emptyBuffer = Buffer.alloc(0);

      const processor = createExcelProcessor();
      const result = processor.validate(emptyBuffer);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe(false);
      }
    });
  });

  describe('fromObjects', () => {
    it('should create Excel from objects', async () => {
      const objects = [
        { name: 'John', age: 30, city: 'New York' },
        { name: 'Jane', age: 25, city: 'Boston' },
      ];

      const processor = createExcelProcessor();
      const result = await processor.fromObjects(objects);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBeInstanceOf(Buffer);
      }
    });

    it('should handle empty objects array', async () => {
      const processor = createExcelProcessor();
      const result = await processor.fromObjects([]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBeInstanceOf(Buffer);
      }
    });

    it('should create Excel with headers', async () => {
      const objects = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ];

      const processor = createExcelProcessor({ hasHeader: true });
      const result = await processor.fromObjects(objects);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBeInstanceOf(Buffer);
      }
    });
  });

  describe('fromArrays', () => {
    it('should create Excel from arrays', async () => {
      const arrays = [
        ['Name', 'Age'],
        ['John', 30],
        ['Jane', 25],
      ];

      const processor = createExcelProcessor();
      const result = await processor.fromArrays(arrays);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBeInstanceOf(Buffer);
      }
    });
  });

  describe('createWorkbook', () => {
    it('should create workbook with multiple worksheets', async () => {
      const worksheets = [
        {
          name: 'Users',
          data: [
            ['Name', 'Age'],
            ['John', 30],
          ],
        },
        {
          name: 'Products',
          data: [
            ['Product', 'Price'],
            ['Widget', 10.99],
          ],
        },
      ];

      const processor = createExcelProcessor();
      const result = await processor.createWorkbook(worksheets);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBeInstanceOf(Buffer);
      }
    });

    it('should handle empty worksheets', async () => {
      const processor = createExcelProcessor();
      const result = await processor.createWorkbook([]);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBeInstanceOf(Buffer);
      }
    });
  });

  describe('detectFormat', () => {
    it('should detect valid Excel format', async () => {
      const buffer = await createTestWorkbook([['test']]);

      const processor = createExcelProcessor();
      const result = processor.detectFormat(buffer);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.worksheetNames).toEqual(['Sheet1']);
        expect(result.value.worksheetCount).toBe(1);
        expect(result.value.hasData).toBe(true);
      }
    });

    it('should handle invalid format', () => {
      const invalidBuffer = Buffer.from('not excel');

      const processor = createExcelProcessor();
      const result = processor.detectFormat(invalidBuffer);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('EXCEL_FORMAT_DETECTION_ERROR');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle buffer parsing errors gracefully', () => {
      const processor = createExcelProcessor();
      const result = processor.parseBuffer(Buffer.from('test'));

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('EXCEL_BUFFER_PARSE_ERROR');
        expect(result.error.message).toContain('Direct buffer parsing not supported');
      }
    });

    it('should handle worksheet parsing errors', () => {
      const processor = createExcelProcessor();
      const result = processor.parseWorksheet(Buffer.from('test'), 'Sheet1');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('EXCEL_BUFFER_PARSE_ERROR');
      }
    });

    it('should handle worksheet by index parsing errors', () => {
      const processor = createExcelProcessor();
      const result = processor.parseWorksheetByIndex(Buffer.from('test'), 0);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('EXCEL_BUFFER_PARSE_ERROR');
      }
    });
  });

  describe('excelUtils', () => {
    describe('mergeWorksheets', () => {
      it('should merge multiple Excel files', async () => {
        const file1Path = join(tempDir, 'file1.xlsx');
        const file2Path = join(tempDir, 'file2.xlsx');
        const outputPath = join(tempDir, 'merged.xlsx');

        const buffer1 = await createTestWorkbook([['Name'], ['John']]);
        const buffer2 = await createTestWorkbook([['Age'], [30]]);

        await writeFile(file1Path, buffer1);
        await writeFile(file2Path, buffer2);

        const result = await excelUtils.mergeWorksheets([file1Path, file2Path], outputPath);

        expect(result.success).toBe(true);
        expect(existsSync(outputPath)).toBe(true);

        // Clean up
        await unlink(file1Path);
        await unlink(file2Path);
        await unlink(outputPath);
      });

      it('should handle merge errors', async () => {
        const result = await excelUtils.mergeWorksheets(['/nonexistent.xlsx'], '/output.xlsx');

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe('FS_READ_ERROR');
        }
      });
    });

    describe('splitWorkbook', () => {
      it('should split workbook into separate files', async () => {
        const workbook = new ExcelJS.Workbook();
        workbook.addWorksheet('Users').addRow(['John']);
        workbook.addWorksheet('Products').addRow(['Widget']);

        const buffer = (await workbook.xlsx.writeBuffer()) as Buffer;
        await writeFile(testFilePath, buffer);

        const result = await excelUtils.splitWorkbook(testFilePath, tempDir);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value).toHaveLength(2);
          expect(existsSync(join(tempDir, 'Users.xlsx'))).toBe(true);
          expect(existsSync(join(tempDir, 'Products.xlsx'))).toBe(true);

          // Clean up
          await unlink(join(tempDir, 'Users.xlsx'));
          await unlink(join(tempDir, 'Products.xlsx'));
        }
      });

      it('should handle split errors', async () => {
        const result = await excelUtils.splitWorkbook('/nonexistent.xlsx', tempDir);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.code).toBe('EXCEL_SPLIT_ERROR');
        }
      });
    });
  });

  describe('Integration Tests', () => {
    it('should round-trip data correctly', async () => {
      const originalData = [
        ['Name', 'Age', 'Score'],
        ['John', 30, 95.5],
        ['Jane', 25, 87.2],
      ];

      const processor = createExcelProcessor();

      // Create Excel file
      const writeResult = await processor.writeFile(originalData, testFilePath);
      expect(writeResult.success).toBe(true);

      // Read Excel file
      const readResult = await processor.parseFile(testFilePath);
      expect(readResult.success).toBe(true);

      if (readResult.success) {
        expect(readResult.value).toHaveLength(2); // Excluding header
        expect(readResult.value[0]).toEqual(['John', 30, 95.5]);
        expect(readResult.value[1]).toEqual(['Jane', 25, 87.2]);
      }
    });

    it('should handle complex data types', async () => {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Complex');

      // Add header
      worksheet.addRow(['Text', 'Number', 'Date', 'Boolean', 'Formula']);

      // Add data with different types
      const _row = worksheet.addRow([
        'Hello',
        42,
        new Date('2023-01-01'),
        true,
        { formula: '2+2', result: 4 },
      ]);

      const buffer = (await workbook.xlsx.writeBuffer()) as Buffer;
      await writeFile(testFilePath, buffer);

      const processor = createExcelProcessor();
      const result = await processor.parseFile(testFilePath);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toHaveLength(1);
        const [text, number, _date, boolean, formula] = result.value[0];
        expect(text).toBe('Hello');
        expect(number).toBe(42);
        expect(boolean).toBe(true);
        expect(formula).toBe(4); // Formula result
      }
    });
  });
});
