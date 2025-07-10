/**
 * Central registry of supported formats and their metadata
 */

import type { FormatRegistry, SupportedFormat } from './types.js';

export const FORMAT_REGISTRY: FormatRegistry = {
  json: {
    extensions: ['.json'],
    mimeTypes: ['application/json'],
    description: 'JavaScript Object Notation',
    parser: 'JSON.parse',
  },
  json5: {
    extensions: ['.json5'],
    mimeTypes: ['application/json5'],
    description: 'JSON5 (JSON for Humans)',
    parser: 'json5',
  },
  yaml: {
    extensions: ['.yaml', '.yml'],
    mimeTypes: ['application/yaml', 'text/yaml'],
    description: "YAML Ain't Markup Language",
    parser: 'yaml',
  },
  csv: {
    extensions: ['.csv'],
    mimeTypes: ['text/csv'],
    description: 'Comma-Separated Values',
    parser: 'papaparse',
  },
  tsv: {
    extensions: ['.tsv'],
    mimeTypes: ['text/tab-separated-values'],
    description: 'Tab-Separated Values',
    parser: 'papaparse',
  },
  xml: {
    extensions: ['.xml'],
    mimeTypes: ['application/xml', 'text/xml'],
    description: 'Extensible Markup Language',
    parser: 'fast-xml-parser',
  },
  toml: {
    extensions: ['.toml'],
    mimeTypes: ['application/toml'],
    description: "Tom's Obvious, Minimal Language",
    parser: 'toml',
  },
} as const;

export const SUPPORTED_FORMATS = Object.keys(FORMAT_REGISTRY) as SupportedFormat[];

export const ALL_EXTENSIONS = Object.values(FORMAT_REGISTRY)
  .flatMap(format => format.extensions)
  .sort();

export const ALL_MIME_TYPES = Object.values(FORMAT_REGISTRY)
  .flatMap(format => format.mimeTypes)
  .sort();
