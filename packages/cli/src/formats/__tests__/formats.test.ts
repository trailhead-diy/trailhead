/**
 * @file Format utilities tests
 */

import { describe, it, expect } from 'vitest';
import {
  formatUtils,
  getExtension,
  getMimeType,
  isSupported,
  detectFormatFromExtension,
  detectFormatFromMimeType,
  changeExtension,
  generateOutputFilename,
  validateFormat,
  detectFormat,
  getSupportedFormats,
  SUPPORTED_FORMATS,
  FORMAT_REGISTRY,
} from '../index.js';

describe('Format Utils', () => {
  describe('getExtension', () => {
    it('returns correct extension for supported formats', () => {
      expect(getExtension('json')).toBe('.json');
      expect(getExtension('csv')).toBe('.csv');
      expect(getExtension('yaml')).toBe('.yaml');
      expect(getExtension('xml')).toBe('.xml');
    });

    it('returns .json as fallback for invalid formats', () => {
      expect(getExtension('invalid' as any)).toBe('.json');
    });
  });

  describe('getMimeType', () => {
    it('returns correct MIME type for supported formats', () => {
      expect(getMimeType('json')).toBe('application/json');
      expect(getMimeType('csv')).toBe('text/csv');
      expect(getMimeType('yaml')).toBe('application/yaml');
      expect(getMimeType('xml')).toBe('application/xml');
    });

    it('returns fallback MIME type for invalid formats', () => {
      expect(getMimeType('invalid' as any)).toBe('application/octet-stream');
    });
  });

  describe('isSupported', () => {
    it('returns true for supported formats', () => {
      expect(isSupported('json')).toBe(true);
      expect(isSupported('csv')).toBe(true);
      expect(isSupported('yaml')).toBe(true);
      expect(isSupported('xml')).toBe(true);
    });

    it('returns false for unsupported formats', () => {
      expect(isSupported('invalid')).toBe(false);
      expect(isSupported('pdf')).toBe(false);
      expect(isSupported('')).toBe(false);
    });
  });

  describe('detectFormatFromExtension', () => {
    it('detects format from file extension', () => {
      expect(detectFormatFromExtension('data.json')).toBe('json');
      expect(detectFormatFromExtension('data.csv')).toBe('csv');
      expect(detectFormatFromExtension('config.yaml')).toBe('yaml');
      expect(detectFormatFromExtension('config.yml')).toBe('yaml');
      expect(detectFormatFromExtension('data.xml')).toBe('xml');
    });

    it('handles case insensitive extensions', () => {
      expect(detectFormatFromExtension('data.JSON')).toBe('json');
      expect(detectFormatFromExtension('data.CSV')).toBe('csv');
    });

    it('returns undefined for unknown extensions', () => {
      expect(detectFormatFromExtension('data.unknown')).toBe(undefined);
      expect(detectFormatFromExtension('data')).toBe(undefined);
    });
  });

  describe('detectFormatFromMimeType', () => {
    it('detects format from MIME type', () => {
      expect(detectFormatFromMimeType('application/json')).toBe('json');
      expect(detectFormatFromMimeType('text/csv')).toBe('csv');
      expect(detectFormatFromMimeType('application/yaml')).toBe('yaml');
      expect(detectFormatFromMimeType('text/yaml')).toBe('yaml');
    });

    it('handles MIME types with parameters', () => {
      expect(detectFormatFromMimeType('application/json; charset=utf-8')).toBe('json');
      expect(detectFormatFromMimeType('text/csv; boundary=something')).toBe('csv');
    });

    it('returns undefined for unknown MIME types', () => {
      expect(detectFormatFromMimeType('application/pdf')).toBe(undefined);
      expect(detectFormatFromMimeType('image/png')).toBe(undefined);
    });
  });

  describe('changeExtension', () => {
    it('changes file extension to match format', () => {
      expect(changeExtension('data.csv', 'json')).toBe('data.json');
      expect(changeExtension('output.txt', 'yaml')).toBe('output.yaml');
      expect(changeExtension('/path/to/file.xml', 'csv')).toBe('/path/to/file.csv');
    });

    it('handles files without extension', () => {
      expect(changeExtension('filename', 'json')).toBe('filename.json');
      expect(changeExtension('/path/to/filename', 'csv')).toBe('/path/to/filename.csv');
    });
  });

  describe('generateOutputFilename', () => {
    it('generates output filename with format extension', () => {
      expect(generateOutputFilename('input.csv', 'json')).toBe('input.json');
      expect(generateOutputFilename('data.xml', 'yaml')).toBe('data.yaml');
    });

    it('adds suffix when provided', () => {
      expect(generateOutputFilename('input.csv', 'json', '-processed')).toBe(
        'input-processed.json'
      );
      expect(generateOutputFilename('data.xml', 'yaml', '.out')).toBe('data.out.yaml');
    });

    it('handles paths correctly', () => {
      expect(generateOutputFilename('/path/to/input.csv', 'json')).toBe('/path/to/input.json');
      expect(generateOutputFilename('./relative/path.xml', 'yaml', '-out')).toBe(
        './relative/path-out.yaml'
      );
    });
  });

  describe('validateFormat', () => {
    it('validates JSON content', () => {
      const validJson = JSON.stringify({ test: 'value' });
      const result = validateFormat(validJson, 'json');

      expect(result.isValid).toBe(true);
      expect(result.format).toBe('json');
      expect(result.confidence).toBe(1.0);
      expect(result.errors).toEqual([]);
    });

    it('detects invalid JSON', () => {
      const invalidJson = '{ invalid json }';
      const result = validateFormat(invalidJson, 'json');

      expect(result.isValid).toBe(false);
      expect(result.format).toBe('json');
      expect(result.confidence).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('validates YAML patterns', () => {
      const validYaml = 'key: value\nother: data';
      const result = validateFormat(validYaml, 'yaml');

      expect(result.isValid).toBe(true);
      expect(result.format).toBe('yaml');
      expect(result.confidence).toBe(0.8);
    });

    it('validates CSV patterns', () => {
      const validCsv = 'name,age,city\nJohn,30,NYC\nJane,25,LA';
      const result = validateFormat(validCsv, 'csv');

      expect(result.isValid).toBe(true);
      expect(result.format).toBe('csv');
      expect(result.confidence).toBe(0.9);
    });

    it('validates XML patterns', () => {
      const validXml = '<root><item>value</item></root>';
      const result = validateFormat(validXml, 'xml');

      expect(result.isValid).toBe(true);
      expect(result.format).toBe('xml');
      expect(result.confidence).toBe(0.9);
    });
  });

  describe('detectFormat', () => {
    it('detects format from filename only', () => {
      const result = detectFormat({ filename: 'data.json' });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe('json');
      }
    });

    it('detects format from content when filename detection fails', () => {
      const jsonContent = JSON.stringify({ test: 'value' });
      const result = detectFormat({
        filename: 'data.unknown',
        content: jsonContent,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBe('json');
      }
    });

    it('validates content against filename format in strict mode', () => {
      const csvContent = 'name,age\nJohn,30';
      const result = detectFormat({
        filename: 'data.json',
        content: csvContent,
        strict: true,
      });

      expect(result.success).toBe(false);
    });

    it('returns error when no format can be detected', () => {
      const result = detectFormat({
        filename: 'data.unknown',
        content: 'random text content',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('getSupportedFormats', () => {
    it('returns all supported formats', () => {
      const formats = getSupportedFormats();

      expect(formats).toContain('json');
      expect(formats).toContain('csv');
      expect(formats).toContain('yaml');
      expect(formats).toContain('xml');
      expect(formats.length).toBeGreaterThan(0);
    });
  });

  describe('formatUtils convenience object', () => {
    it('exposes all utility functions', () => {
      expect(formatUtils.getExtension).toBe(getExtension);
      expect(formatUtils.getMimeType).toBe(getMimeType);
      expect(formatUtils.isSupported).toBe(isSupported);
      expect(formatUtils.detectFormatFromExtension).toBe(detectFormatFromExtension);
      expect(formatUtils.changeExtension).toBe(changeExtension);
    });

    it('can be used as a unified API', () => {
      expect(formatUtils.getExtension('json')).toBe('.json');
      expect(formatUtils.isSupported('csv')).toBe(true);
      expect(formatUtils.detectFormatFromExtension('test.yaml')).toBe('yaml');
    });
  });

  describe('constants', () => {
    it('exports format registry', () => {
      expect(FORMAT_REGISTRY).toBeDefined();
      expect(FORMAT_REGISTRY.json).toBeDefined();
      expect(FORMAT_REGISTRY.json.extensions).toContain('.json');
    });

    it('exports supported formats list', () => {
      expect(SUPPORTED_FORMATS).toBeDefined();
      expect(SUPPORTED_FORMATS).toContain('json');
      expect(SUPPORTED_FORMATS).toContain('csv');
    });
  });

  describe('edge cases', () => {
    it('handles empty strings gracefully', () => {
      expect(detectFormatFromExtension('')).toBe(undefined);
      expect(detectFormatFromMimeType('')).toBe(undefined);
    });

    it('handles files with multiple dots', () => {
      expect(detectFormatFromExtension('file.backup.json')).toBe('json');
      expect(changeExtension('file.backup.csv', 'yaml')).toBe('file.backup.yaml');
    });

    it('handles paths with no directory', () => {
      expect(generateOutputFilename('file.csv', 'json')).toBe('file.json');
      expect(changeExtension('file.xml', 'yaml')).toBe('file.yaml');
    });
  });
});
