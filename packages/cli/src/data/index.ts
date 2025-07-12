// Pure delegation to @trailhead/data domain package
export * from '@trailhead/data';

// Re-export with CLI-friendly names for backward compatibility
import { createCSVOperations, createJSONOperations, createExcelOperations } from '@trailhead/data';

export const createCSVProcessor = createCSVOperations;
export const createJSONProcessor = createJSONOperations;
export const createExcelProcessor = createExcelOperations;

// Simple CSV utilities for test compatibility
export const csvUtils = {
  detectDelimiter: (csvData: string) => {
    const commas = (csvData.match(/,/g) || []).length;
    const semicolons = (csvData.match(/;/g) || []).length;
    const tabs = (csvData.match(/\t/g) || []).length;

    if (tabs > commas && tabs > semicolons) {
      return { isOk: () => true, value: '\t' };
    } else if (semicolons > commas) {
      return { isOk: () => true, value: ';' };
    } else if (commas > 0) {
      return { isOk: () => true, value: ',' };
    }

    return { isOk: () => false, error: new Error('No delimiter found') };
  },

  escapeField: (field: string, delimiter: string) => {
    if (field.includes(delimiter) || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  },

  unescapeField: (field: string) => {
    if (field.startsWith('"') && field.endsWith('"')) {
      return field.slice(1, -1).replace(/""/g, '"');
    }
    return field;
  },

  convertDelimiter: (csvData: string, fromDelimiter: string, toDelimiter: string) => {
    try {
      const lines = csvData.split('\n');
      const convertedLines = lines.map(line => {
        if (line.trim()) {
          return line.split(fromDelimiter).join(toDelimiter);
        }
        return line;
      });
      return { isOk: () => true, value: convertedLines.join('\n') };
    } catch (error) {
      return { isOk: () => false, error };
    }
  },
};
