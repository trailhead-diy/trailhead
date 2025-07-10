import ExcelJS from 'exceljs';
import { writeFile } from 'fs/promises';
import type { Result } from '../core/errors/types.js';
import type { CLIError } from '../core/errors/types.js';
import { ok, err } from 'neverthrow';
import { createError, fileSystemError } from '../core/errors/factory.js';
import type { ExcelProcessor, ExcelProcessingOptions } from './types.js';

const defaultOptions: ExcelProcessingOptions = {
  worksheetIndex: 0,
  hasHeader: true,
  dynamicTyping: true,
  autoTrim: true,
  skipEmptyLines: true,
  dateNF: 'yyyy-mm-dd',
  cellNF: false,
  cellHTML: false,
  cellStyles: false,
  cellDates: true,
  sheetStubs: false,
  blankrows: false,
  bookVBA: false,
  errorTolerant: false,
};

const parseBuffer = (
  _buffer: Buffer,
  _options?: ExcelProcessingOptions
): Result<any[], CLIError> => {
  // Direct buffer parsing not currently supported - would need async implementation
  return err(
    createError(
      'EXCEL_BUFFER_PARSE_ERROR',
      'Direct buffer parsing not supported. Use parseFile for Excel files.',
      { recoverable: true }
    )
  );
};

const parseFile = async (
  filePath: string,
  options?: ExcelProcessingOptions
): Promise<Result<any[], CLIError>> => {
  const opts = { ...defaultOptions, ...options };

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    let worksheet: ExcelJS.Worksheet;

    if (opts.worksheetName) {
      const ws = workbook.getWorksheet(opts.worksheetName);
      if (!ws) {
        return err(
          createError('EXCEL_WORKSHEET_NOT_FOUND', `Worksheet '${opts.worksheetName}' not found`, {
            recoverable: true,
          })
        );
      }
      worksheet = ws;
    } else {
      const wsIndex = opts.worksheetIndex ?? 0;
      worksheet = workbook.worksheets[wsIndex];
      if (!worksheet) {
        return err(
          createError('EXCEL_WORKSHEET_NOT_FOUND', `Worksheet at index ${wsIndex} not found`, {
            recoverable: true,
          })
        );
      }
    }

    const rows: any[] = [];
    const headerRow = opts.header ?? (opts.hasHeader ? 1 : 0);

    worksheet.eachRow({ includeEmpty: !opts.skipEmptyLines }, (row, rowNumber) => {
      if (opts.hasHeader && rowNumber <= headerRow) {
        return; // Skip header rows
      }

      const rowData: any[] = [];
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        let value = cell.value;

        // Handle different cell types
        if (value && typeof value === 'object') {
          // Check for hyperlink
          if ('hyperlink' in value && 'text' in value) {
            const hyperlinkValue = value as any;
            value = opts.cellHTML
              ? `<a href="${hyperlinkValue.hyperlink}">${hyperlinkValue.text}</a>`
              : hyperlinkValue.text;
          }
          // Check for rich text
          else if ('richText' in value) {
            const richTextValue = value as any;
            value = richTextValue.richText.map((rt: any) => rt.text).join('');
          }
          // Check for formula
          else if ('formula' in value) {
            const formulaValue = value as any;
            value = formulaValue.result ?? formulaValue.formula;
          }
        }

        // Apply dynamic typing
        if (opts.dynamicTyping && typeof value === 'string') {
          // Try to parse numbers
          const numValue = Number(value);
          if (!isNaN(numValue) && isFinite(numValue)) {
            value = numValue;
          }
          // Try to parse booleans
          else if (value.toLowerCase() === 'true') {
            value = true;
          } else if (value.toLowerCase() === 'false') {
            value = false;
          }
        }

        // Apply trim
        if (opts.autoTrim && typeof value === 'string') {
          value = value.trim();
        }

        rowData[colNumber - 1] = value ?? opts.defval;
      });

      // Skip empty rows if configured
      if (
        opts.skipEmptyLines &&
        rowData.every(cell => cell === undefined || cell === null || cell === '')
      ) {
        return;
      }

      rows.push(rowData);
    });

    return ok(rows);
  } catch (error) {
    return err(
      fileSystemError(
        'read',
        filePath,
        `Failed to read Excel file: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error }
      )
    );
  }
};

const parseWorksheet = (
  _buffer: Buffer,
  _worksheetName: string,
  _options?: ExcelProcessingOptions
): Result<any[], CLIError> => {
  return err(
    createError(
      'EXCEL_BUFFER_PARSE_ERROR',
      'Direct buffer parsing not supported. Use parseFile for Excel files.',
      { recoverable: true }
    )
  );
};

const parseWorksheetByIndex = (
  _buffer: Buffer,
  _worksheetIndex: number,
  _options?: ExcelProcessingOptions
): Result<any[], CLIError> => {
  return err(
    createError(
      'EXCEL_BUFFER_PARSE_ERROR',
      'Direct buffer parsing not supported. Use parseFile for Excel files.',
      { recoverable: true }
    )
  );
};

const stringify = async (
  data: any[],
  options?: ExcelProcessingOptions
): Promise<Result<Buffer, CLIError>> => {
  const opts = { ...defaultOptions, ...options };

  try {
    const workbook = new ExcelJS.Workbook();
    const worksheetName = opts.worksheetName || 'Sheet1';
    const worksheet = workbook.addWorksheet(worksheetName);

    if (data.length === 0) {
      const buffer = await workbook.xlsx.writeBuffer();
      return ok(buffer as Buffer);
    }

    // Add header row if specified
    if (opts.hasHeader && Array.isArray(data[0])) {
      // If first row contains strings, use them as headers
      const firstRow = data[0];
      if (firstRow.every((cell: any) => typeof cell === 'string')) {
        worksheet.addRow(firstRow);
        data = data.slice(1);
      }
    }

    // Add data rows
    data.forEach(row => {
      if (Array.isArray(row)) {
        worksheet.addRow(row);
      } else if (typeof row === 'object' && row !== null) {
        // Convert object to array based on keys
        const values = Object.values(row);
        worksheet.addRow(values);
      }
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      if (column.values) {
        const lengths = column.values.map(v => (v ? v.toString().length : 0));
        const maxLength = Math.max(...lengths.filter(v => typeof v === 'number'));
        column.width = Math.min(Math.max(maxLength + 2, 10), 50);
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return ok(buffer as Buffer);
  } catch (error) {
    return err(
      createError(
        'EXCEL_SERIALIZE_ERROR',
        `Excel serialization error: ${error instanceof Error ? error.message : String(error)}`,
        { recoverable: true }
      )
    );
  }
};

const writeExcelFile = async (
  data: any[],
  filePath: string,
  options?: ExcelProcessingOptions
): Promise<Result<void, CLIError>> => {
  const stringifyResult = await stringify(data, options);

  if (stringifyResult.isErr()) {
    return err(stringifyResult.error);
  }

  try {
    await writeFile(filePath, stringifyResult.value);
    return ok(undefined);
  } catch (error) {
    return err(
      fileSystemError(
        'write',
        filePath,
        `Failed to write Excel file: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error }
      )
    );
  }
};

const validate = (buffer: Buffer): Result<boolean, CLIError> => {
  try {
    // Basic validation - check if it starts with Excel file signature
    const signature = buffer.subarray(0, 8);

    // XLSX files start with PK (ZIP archive signature)
    const isXLSX = signature[0] === 0x50 && signature[1] === 0x4b;

    // XLS files have a different signature
    const isXLS =
      signature[0] === 0xd0 &&
      signature[1] === 0xcf &&
      signature[2] === 0x11 &&
      signature[3] === 0xe0;

    return ok(isXLSX || isXLS);
  } catch (error) {
    return err(
      createError(
        'EXCEL_VALIDATION_ERROR',
        `Excel validation error: ${error instanceof Error ? error.message : String(error)}`,
        { recoverable: true }
      )
    );
  }
};

const parseToObjects = (
  _buffer: Buffer,
  _options?: ExcelProcessingOptions
): Result<Record<string, any>[], CLIError> => {
  return err(
    createError(
      'EXCEL_BUFFER_PARSE_ERROR',
      'Direct buffer parsing not supported. Use parseFile for Excel files.',
      { recoverable: true }
    )
  );
};

const parseToArrays = (
  _buffer: Buffer,
  _options?: ExcelProcessingOptions
): Result<any[][], CLIError> => {
  return err(
    createError(
      'EXCEL_BUFFER_PARSE_ERROR',
      'Direct buffer parsing not supported. Use parseFile for Excel files.',
      { recoverable: true }
    )
  );
};

const fromObjects = async (
  objects: Record<string, any>[],
  options?: ExcelProcessingOptions
): Promise<Result<Buffer, CLIError>> => {
  const opts = { ...defaultOptions, ...options };

  try {
    const workbook = new ExcelJS.Workbook();
    const worksheetName = opts.worksheetName || 'Sheet1';
    const worksheet = workbook.addWorksheet(worksheetName);

    if (objects.length === 0) {
      const buffer = await workbook.xlsx.writeBuffer();
      return ok(buffer as Buffer);
    }

    // Get headers from the first object
    const headers = Object.keys(objects[0]);

    // Add header row if specified
    if (opts.hasHeader) {
      worksheet.addRow(headers);
    }

    // Add data rows
    objects.forEach(obj => {
      const row = headers.map(header => obj[header]);
      worksheet.addRow(row);
    });

    // Auto-fit columns
    worksheet.columns.forEach((column, index) => {
      if (index < headers.length) {
        column.header = headers[index];
        const values = objects.map(obj => obj[headers[index]]);
        const lengths = values.map(v => (v ? v.toString().length : 0));
        const maxLength = Math.max(headers[index].length, ...lengths);
        column.width = Math.min(Math.max(maxLength + 2, 10), 50);
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return ok(buffer as Buffer);
  } catch (error) {
    return err(
      createError(
        'EXCEL_SERIALIZE_ERROR',
        `Excel serialization error: ${error instanceof Error ? error.message : String(error)}`,
        { recoverable: true }
      )
    );
  }
};

const fromArrays = async (
  arrays: any[][],
  options?: ExcelProcessingOptions
): Promise<Result<Buffer, CLIError>> => {
  return stringify(arrays, options);
};

const detectFormat = (
  buffer: Buffer
): Result<{ worksheetNames: string[]; worksheetCount: number; hasData: boolean }, CLIError> => {
  try {
    // This is a simplified detection - in practice, we'd need to actually parse the file
    const isValid = validate(buffer);

    if (isValid.isErr() || !isValid.value) {
      return err(
        createError('EXCEL_FORMAT_DETECTION_ERROR', 'Not a valid Excel file', { recoverable: true })
      );
    }

    // For now, return basic info - actual implementation would parse the file
    return ok({
      worksheetNames: ['Sheet1'], // Would need actual parsing to get real names
      worksheetCount: 1,
      hasData: true,
    });
  } catch (error) {
    return err(
      createError(
        'EXCEL_FORMAT_DETECTION_ERROR',
        `Excel format detection error: ${error instanceof Error ? error.message : String(error)}`,
        { recoverable: true }
      )
    );
  }
};

const getWorksheetNames = (_buffer: Buffer): Result<string[], CLIError> => {
  return err(
    createError(
      'EXCEL_BUFFER_PARSE_ERROR',
      'Direct buffer parsing not supported. Use parseFile for Excel files.',
      { recoverable: true }
    )
  );
};

const createWorkbook = async (
  worksheets: { name: string; data: any[][] }[]
): Promise<Result<Buffer, CLIError>> => {
  try {
    const workbook = new ExcelJS.Workbook();

    for (const ws of worksheets) {
      const worksheet = workbook.addWorksheet(ws.name);

      ws.data.forEach(row => {
        worksheet.addRow(row);
      });

      // Auto-fit columns
      worksheet.columns.forEach(column => {
        if (column.values) {
          const lengths = column.values.map(v => (v ? v.toString().length : 0));
          const maxLength = Math.max(...lengths.filter(v => typeof v === 'number'));
          column.width = Math.min(Math.max(maxLength + 2, 10), 50);
        }
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return ok(buffer as Buffer);
  } catch (error) {
    return err(
      createError(
        'EXCEL_WORKBOOK_CREATION_ERROR',
        `Excel workbook creation error: ${error instanceof Error ? error.message : String(error)}`,
        { recoverable: true }
      )
    );
  }
};

export function createExcelProcessor(options?: ExcelProcessingOptions): ExcelProcessor {
  const mergedOptions = { ...defaultOptions, ...options };

  return {
    parseBuffer: (buffer: Buffer, opts?: ExcelProcessingOptions) =>
      parseBuffer(buffer, { ...mergedOptions, ...opts }),
    parseFile: (filePath: string, opts?: ExcelProcessingOptions) =>
      parseFile(filePath, { ...mergedOptions, ...opts }),
    parseWorksheet: (buffer: Buffer, worksheetName: string, opts?: ExcelProcessingOptions) =>
      parseWorksheet(buffer, worksheetName, { ...mergedOptions, ...opts }),
    parseWorksheetByIndex: (
      buffer: Buffer,
      worksheetIndex: number,
      opts?: ExcelProcessingOptions
    ) => parseWorksheetByIndex(buffer, worksheetIndex, { ...mergedOptions, ...opts }),
    stringify: (data: any[], opts?: ExcelProcessingOptions) =>
      stringify(data, { ...mergedOptions, ...opts }),
    writeFile: (data: any[], filePath: string, opts?: ExcelProcessingOptions) =>
      writeExcelFile(data, filePath, { ...mergedOptions, ...opts }),
    validate: (buffer: Buffer) => validate(buffer),
    detectFormat: (buffer: Buffer) => detectFormat(buffer),
    parseToObjects: (buffer: Buffer, opts?: ExcelProcessingOptions) =>
      parseToObjects(buffer, { ...mergedOptions, ...opts }),
    parseToArrays: (buffer: Buffer, opts?: ExcelProcessingOptions) =>
      parseToArrays(buffer, { ...mergedOptions, ...opts }),
    fromObjects: (objects: Record<string, any>[], opts?: ExcelProcessingOptions) =>
      fromObjects(objects, { ...mergedOptions, ...opts }),
    fromArrays: (arrays: any[][], opts?: ExcelProcessingOptions) =>
      fromArrays(arrays, { ...mergedOptions, ...opts }),
    getWorksheetNames: (buffer: Buffer) => getWorksheetNames(buffer),
    createWorkbook: (worksheets: { name: string; data: any[][] }[]) => createWorkbook(worksheets),
  };
}

const convertRange = async (
  filePath: string,
  range: string,
  outputPath: string
): Promise<Result<void, CLIError>> => {
  try {
    const processor = createExcelProcessor({ range });
    const parseResult = await processor.parseFile(filePath);

    if (parseResult.isErr()) {
      return err(parseResult.error);
    }

    return processor.writeFile(parseResult.value, outputPath);
  } catch (error) {
    return err(
      createError(
        'EXCEL_RANGE_CONVERSION_ERROR',
        `Excel range conversion error: ${error instanceof Error ? error.message : String(error)}`,
        { recoverable: true }
      )
    );
  }
};

const mergeWorksheets = async (
  worksheetPaths: string[],
  outputPath: string
): Promise<Result<void, CLIError>> => {
  try {
    const worksheets: { name: string; data: any[][] }[] = [];
    const processor = createExcelProcessor();

    for (let i = 0; i < worksheetPaths.length; i++) {
      const parseResult = await processor.parseFile(worksheetPaths[i]);
      if (parseResult.isErr()) {
        return err(parseResult.error);
      }

      worksheets.push({
        name: `Sheet${i + 1}`,
        data: parseResult.value,
      });
    }

    const workbookResult = await processor.createWorkbook(worksheets);
    if (workbookResult.isErr()) {
      return err(workbookResult.error);
    }

    try {
      await writeFile(outputPath, workbookResult.value);
      return ok(undefined);
    } catch (error) {
      return err(
        fileSystemError(
          'write',
          outputPath,
          `Failed to write merged workbook: ${error instanceof Error ? error.message : String(error)}`,
          { cause: error }
        )
      );
    }
  } catch (error) {
    return err(
      createError(
        'EXCEL_MERGE_ERROR',
        `Excel merge error: ${error instanceof Error ? error.message : String(error)}`,
        { recoverable: true }
      )
    );
  }
};

const splitWorkbook = async (
  filePath: string,
  outputDir: string
): Promise<Result<string[], CLIError>> => {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const outputFiles: string[] = [];
    const processor = createExcelProcessor();

    for (let i = 0; i < workbook.worksheets.length; i++) {
      const worksheet = workbook.worksheets[i];
      const rows: any[][] = [];

      worksheet.eachRow(row => {
        const rowData: any[] = [];
        row.eachCell({ includeEmpty: true }, cell => {
          rowData.push(cell.value);
        });
        rows.push(rowData);
      });

      const outputPath = `${outputDir}/${worksheet.name || `Sheet${i + 1}`}.xlsx`;
      const writeResult = await processor.writeFile(rows, outputPath);

      if (writeResult.isErr()) {
        return err(writeResult.error);
      }

      outputFiles.push(outputPath);
    }

    return ok(outputFiles);
  } catch (error) {
    return err(
      createError(
        'EXCEL_SPLIT_ERROR',
        `Excel split error: ${error instanceof Error ? error.message : String(error)}`,
        { recoverable: true }
      )
    );
  }
};

export const excelUtils = {
  convertRange,
  mergeWorksheets,
  splitWorkbook,
};
