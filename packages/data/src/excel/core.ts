import { ok, err } from '@trailhead/core';
import { readFile as fsReadFile, writeFile as fsWriteFile } from '@trailhead/fs';
import * as XLSX from 'xlsx';
import type { ExcelProcessingOptions, DataResult, ExcelFormatInfo } from '../types.js';
import type { CreateExcelOperations, ExcelParseOptions, ExcelWriteOptions } from './types.js';
import { defaultExcelConfig } from './types.js';
import { createExcelError, mapLibraryError } from '../errors.js';

// ========================================
// Excel Core Operations
// ========================================

export const createExcelOperations: CreateExcelOperations = (config = {}) => {
  const excelConfig = { ...defaultExcelConfig, ...config };

  const parseBuffer = (buffer: Buffer, options: ExcelProcessingOptions = {}): DataResult<any[]> => {
    try {
      const mergedOptions = { ...excelConfig, ...options };

      if (!buffer || buffer.length === 0) {
        return err(createExcelError('Empty buffer provided'));
      }

      const parseOptions: ExcelParseOptions = {
        type: 'buffer',
        cellDates: mergedOptions.cellDates,
        dateNF: mergedOptions.dateNF,
        cellNF: mergedOptions.cellNF,
        cellStyles: mergedOptions.cellStyles,
        cellHTML: mergedOptions.cellHTML,
        sheetStubs: mergedOptions.sheetStubs,
        password: mergedOptions.password,
        raw: !mergedOptions.dynamicTyping,
      };

      const workbook = XLSX.read(buffer, parseOptions);

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        return err(createExcelError('No worksheets found in Excel file'));
      }

      let worksheetName = mergedOptions.worksheetName;
      if (!worksheetName) {
        if (
          mergedOptions.worksheetIndex !== undefined &&
          mergedOptions.worksheetIndex < workbook.SheetNames.length
        ) {
          worksheetName = workbook.SheetNames[mergedOptions.worksheetIndex];
        } else {
          worksheetName = workbook.SheetNames[0];
        }
      }

      const worksheet = workbook.Sheets[worksheetName];
      if (!worksheet) {
        return err(
          createExcelError(
            `Worksheet "${worksheetName}" not found`,
            `Available worksheets: ${workbook.SheetNames.join(', ')}`,
            undefined,
            { worksheetName, availableWorksheets: workbook.SheetNames }
          )
        );
      }

      const jsonOptions: any = {
        header: mergedOptions.hasHeader ? 1 : undefined,
        defval: mergedOptions.defval,
        raw: !mergedOptions.dynamicTyping,
        range: mergedOptions.range,
      };

      const data = XLSX.utils.sheet_to_json(worksheet, jsonOptions);

      if (mergedOptions.maxRows && data.length > mergedOptions.maxRows) {
        return err(
          createExcelError(
            'Row limit exceeded',
            `Found ${data.length} rows, maximum allowed: ${mergedOptions.maxRows}`,
            undefined,
            { rowCount: data.length, maxRows: mergedOptions.maxRows }
          )
        );
      }

      return ok(data);
    } catch (error) {
      return err(mapLibraryError('SheetJS', 'parseBuffer', error));
    }
  };

  const parseFile = async (
    filePath: string,
    options: ExcelProcessingOptions = {}
  ): Promise<DataResult<any[]>> => {
    const fileOps = fsReadFile();
    const fileResult = await fileOps(filePath);
    if (fileResult.isErr()) {
      return err(fileResult.error);
    }

    // Convert string to Buffer for Excel processing
    const buffer = Buffer.from(fileResult.value, 'binary');
    return parseBuffer(buffer, options);
  };

  const parseWorksheet = (
    buffer: Buffer,
    worksheetName: string,
    options: ExcelProcessingOptions = {}
  ): DataResult<any[]> => {
    const mergedOptions = { ...options, worksheetName };
    return parseBuffer(buffer, mergedOptions);
  };

  const parseWorksheetByIndex = (
    buffer: Buffer,
    worksheetIndex: number,
    options: ExcelProcessingOptions = {}
  ): DataResult<any[]> => {
    const mergedOptions = { ...options, worksheetIndex };
    return parseBuffer(buffer, mergedOptions);
  };

  const stringify = async (
    data: any[],
    options: ExcelProcessingOptions = {}
  ): Promise<DataResult<Buffer>> => {
    try {
      const mergedOptions = { ...excelConfig, ...options };

      if (!Array.isArray(data)) {
        return err(createExcelError('Data must be an array'));
      }

      if (data.length === 0) {
        return err(createExcelError('Cannot create Excel file from empty data'));
      }

      const worksheet = XLSX.utils.json_to_sheet(data, {
        header: mergedOptions.hasHeader ? undefined : [],
        skipHeader: !mergedOptions.hasHeader,
      });

      const workbook = XLSX.utils.book_new();
      const sheetName = mergedOptions.worksheetName || 'Sheet1';
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      const writeOptions: ExcelWriteOptions = {
        bookType: 'xlsx',
        compression: true,
      };

      const buffer = XLSX.write(workbook, { type: 'buffer', ...writeOptions });
      return ok(Buffer.from(buffer));
    } catch (error) {
      return err(mapLibraryError('SheetJS', 'stringify', error));
    }
  };

  const writeFile = async (
    data: any[],
    filePath: string,
    options: ExcelProcessingOptions = {}
  ): Promise<DataResult<void>> => {
    const stringifyResult = await stringify(data, options);
    if (stringifyResult.isErr()) {
      return err(stringifyResult.error);
    }

    const writeOps = fsWriteFile();
    return await writeOps(filePath, stringifyResult.value.toString('binary'));
  };

  const validate = (buffer: Buffer): DataResult<boolean> => {
    try {
      if (!buffer || buffer.length === 0) {
        return ok(false);
      }

      XLSX.read(buffer, { type: 'buffer', bookSheets: true });
      return ok(true);
    } catch {
      return ok(false);
    }
  };

  const detectFormat = (buffer: Buffer): DataResult<ExcelFormatInfo> => {
    try {
      if (!buffer || buffer.length === 0) {
        return err(createExcelError('Empty buffer provided for format detection'));
      }

      const workbook = XLSX.read(buffer, { type: 'buffer', bookSheets: true });

      const worksheetNames = workbook.SheetNames;
      const worksheetCount = worksheetNames.length;

      let hasData = false;
      for (const sheetName of worksheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        if (worksheet && Object.keys(worksheet).length > 1) {
          // More than just metadata
          hasData = true;
          break;
        }
      }

      return ok({
        worksheetNames,
        worksheetCount,
        hasData,
      });
    } catch (error) {
      return err(mapLibraryError('SheetJS', 'detectFormat', error));
    }
  };

  const parseToObjects = (
    buffer: Buffer,
    options: ExcelProcessingOptions = {}
  ): DataResult<Record<string, any>[]> => {
    const mergedOptions = { ...options, hasHeader: true };
    return parseBuffer(buffer, mergedOptions) as DataResult<Record<string, any>[]>;
  };

  const parseToArrays = (
    buffer: Buffer,
    options: ExcelProcessingOptions = {}
  ): DataResult<any[][]> => {
    const mergedOptions = { ...options, hasHeader: false };
    return parseBuffer(buffer, mergedOptions) as DataResult<any[][]>;
  };

  const fromObjects = async (
    objects: Record<string, any>[],
    options: ExcelProcessingOptions = {}
  ): Promise<DataResult<Buffer>> => {
    const mergedOptions = { ...options, hasHeader: true };
    return await stringify(objects, mergedOptions);
  };

  const fromArrays = async (
    arrays: any[][],
    options: ExcelProcessingOptions = {}
  ): Promise<DataResult<Buffer>> => {
    const mergedOptions = { ...options, hasHeader: false };
    return await stringify(arrays, mergedOptions);
  };

  const getWorksheetNames = (buffer: Buffer): DataResult<string[]> => {
    try {
      if (!buffer || buffer.length === 0) {
        return err(createExcelError('Empty buffer provided'));
      }

      const workbook = XLSX.read(buffer, { type: 'buffer', bookSheets: true });
      return ok(workbook.SheetNames);
    } catch (error) {
      return err(mapLibraryError('SheetJS', 'getWorksheetNames', error));
    }
  };

  const createWorkbook = async (
    worksheets: { name: string; data: any[][] }[]
  ): Promise<DataResult<Buffer>> => {
    try {
      if (!worksheets || worksheets.length === 0) {
        return err(createExcelError('No worksheets provided'));
      }

      const workbook = XLSX.utils.book_new();

      for (const { name, data } of worksheets) {
        if (!Array.isArray(data) || data.length === 0) {
          continue; // Skip empty worksheets
        }

        const worksheet = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, name);
      }

      if (workbook.SheetNames.length === 0) {
        return err(createExcelError('No valid worksheets to create'));
      }

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      return ok(Buffer.from(buffer));
    } catch (error) {
      return err(mapLibraryError('SheetJS', 'createWorkbook', error));
    }
  };

  return {
    parseBuffer,
    parseFile,
    parseWorksheet,
    parseWorksheetByIndex,
    stringify,
    writeFile,
    validate,
    detectFormat,
    parseToObjects,
    parseToArrays,
    fromObjects,
    fromArrays,
    getWorksheetNames,
    createWorkbook,
  };
};
