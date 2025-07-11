import type { MagicNumberPattern, ExtensionMapping, FormatDatabase } from './types.js';
import type { FileFormatInfo } from '../types.js';

// ========================================
// Helper Functions
// ========================================

const createFormat = (
  ext: string,
  mime: string,
  description: string,
  category: FileFormatInfo['category']
): FileFormatInfo => ({
  ext,
  mime,
  description,
  category,
  confidence: 1.0,
});

const createMagicPattern = (
  signature: number[],
  format: FileFormatInfo,
  offset: number = 0,
  mask?: number[]
): MagicNumberPattern => ({
  signature: new Uint8Array(signature),
  offset,
  mask: mask ? new Uint8Array(mask) : undefined,
  format,
});

// ========================================
// Format Definitions
// ========================================

// Image formats
const JPEG_FORMAT = createFormat('jpg', 'image/jpeg', 'JPEG Image', 'image');
const PNG_FORMAT = createFormat('png', 'image/png', 'PNG Image', 'image');
const GIF_FORMAT = createFormat('gif', 'image/gif', 'GIF Image', 'image');
const BMP_FORMAT = createFormat('bmp', 'image/bmp', 'Bitmap Image', 'image');
const WEBP_FORMAT = createFormat('webp', 'image/webp', 'WebP Image', 'image');
const SVG_FORMAT = createFormat('svg', 'image/svg+xml', 'SVG Vector Image', 'image');
const ICO_FORMAT = createFormat('ico', 'image/x-icon', 'Icon', 'image');
const TIFF_FORMAT = createFormat('tiff', 'image/tiff', 'TIFF Image', 'image');

// Document formats
const PDF_FORMAT = createFormat('pdf', 'application/pdf', 'PDF Document', 'document');
const DOC_FORMAT = createFormat('doc', 'application/msword', 'Microsoft Word Document', 'document');
const DOCX_FORMAT = createFormat(
  'docx',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'Microsoft Word Document (OOXML)',
  'document'
);
const XLS_FORMAT = createFormat(
  'xls',
  'application/vnd.ms-excel',
  'Microsoft Excel Spreadsheet',
  'document'
);
const XLSX_FORMAT = createFormat(
  'xlsx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'Microsoft Excel Spreadsheet (OOXML)',
  'document'
);

// Archive formats
const ZIP_FORMAT = createFormat('zip', 'application/zip', 'ZIP Archive', 'archive');
const RAR_FORMAT = createFormat('rar', 'application/vnd.rar', 'RAR Archive', 'archive');
const TAR_FORMAT = createFormat('tar', 'application/x-tar', 'TAR Archive', 'archive');
const GZIP_FORMAT = createFormat('gz', 'application/gzip', 'GZIP Archive', 'archive');
const SEVENZ_FORMAT = createFormat('7z', 'application/x-7z-compressed', '7-Zip Archive', 'archive');

// Audio formats
const MP3_FORMAT = createFormat('mp3', 'audio/mpeg', 'MP3 Audio', 'audio');
const WAV_FORMAT = createFormat('wav', 'audio/wav', 'WAV Audio', 'audio');
const FLAC_FORMAT = createFormat('flac', 'audio/flac', 'FLAC Audio', 'audio');
const OGG_FORMAT = createFormat('ogg', 'audio/ogg', 'OGG Audio', 'audio');

// Video formats
const MP4_FORMAT = createFormat('mp4', 'video/mp4', 'MP4 Video', 'video');
const AVI_FORMAT = createFormat('avi', 'video/x-msvideo', 'AVI Video', 'video');
const MOV_FORMAT = createFormat('mov', 'video/quicktime', 'QuickTime Video', 'video');
const WEBM_FORMAT = createFormat('webm', 'video/webm', 'WebM Video', 'video');

// Data formats
const JSON_FORMAT = createFormat('json', 'application/json', 'JSON Data', 'data');
const XML_FORMAT = createFormat('xml', 'application/xml', 'XML Data', 'data');
const CSV_FORMAT = createFormat('csv', 'text/csv', 'CSV Data', 'data');
const YAML_FORMAT = createFormat('yaml', 'application/x-yaml', 'YAML Data', 'data');

// Executable formats
const EXE_FORMAT = createFormat(
  'exe',
  'application/x-msdownload',
  'Windows Executable',
  'executable'
);
const ELF_FORMAT = createFormat('', 'application/x-executable', 'Linux Executable', 'executable');

// ========================================
// Magic Number Patterns
// ========================================

export const MAGIC_PATTERNS: readonly MagicNumberPattern[] = [
  // Image formats
  createMagicPattern([0xff, 0xd8, 0xff], JPEG_FORMAT),
  createMagicPattern([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], PNG_FORMAT),
  createMagicPattern([0x47, 0x49, 0x46, 0x38, 0x37, 0x61], GIF_FORMAT), // GIF87a
  createMagicPattern([0x47, 0x49, 0x46, 0x38, 0x39, 0x61], GIF_FORMAT), // GIF89a
  createMagicPattern([0x42, 0x4d], BMP_FORMAT),
  createMagicPattern([0x52, 0x49, 0x46, 0x46], WEBP_FORMAT), // RIFF header for WebP
  createMagicPattern([0x00, 0x00, 0x01, 0x00], ICO_FORMAT),
  createMagicPattern([0x49, 0x49, 0x2a, 0x00], TIFF_FORMAT), // Little-endian
  createMagicPattern([0x4d, 0x4d, 0x00, 0x2a], TIFF_FORMAT), // Big-endian

  // Document formats
  createMagicPattern([0x25, 0x50, 0x44, 0x46], PDF_FORMAT), // %PDF
  createMagicPattern([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1], DOC_FORMAT), // MS Office compound document
  createMagicPattern([0x50, 0x4b, 0x03, 0x04], DOCX_FORMAT), // ZIP-based Office docs

  // Archive formats
  createMagicPattern([0x50, 0x4b, 0x03, 0x04], ZIP_FORMAT),
  createMagicPattern([0x50, 0x4b, 0x05, 0x06], ZIP_FORMAT), // Empty ZIP
  createMagicPattern([0x50, 0x4b, 0x07, 0x08], ZIP_FORMAT), // Spanned ZIP
  createMagicPattern([0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x00], RAR_FORMAT), // Rar! header
  createMagicPattern([0x52, 0x61, 0x72, 0x21, 0x1a, 0x07, 0x01, 0x00], RAR_FORMAT), // RAR5
  createMagicPattern([0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c], SEVENZ_FORMAT),
  createMagicPattern([0x1f, 0x8b], GZIP_FORMAT),

  // Audio formats
  createMagicPattern([0x49, 0x44, 0x33], MP3_FORMAT), // ID3 tag
  createMagicPattern([0xff, 0xfb], MP3_FORMAT), // MPEG Layer III
  createMagicPattern([0xff, 0xf3], MP3_FORMAT), // MPEG Layer III
  createMagicPattern([0xff, 0xf2], MP3_FORMAT), // MPEG Layer III
  createMagicPattern([0x52, 0x49, 0x46, 0x46], WAV_FORMAT), // RIFF header
  createMagicPattern([0x66, 0x4c, 0x61, 0x43], FLAC_FORMAT), // fLaC
  createMagicPattern([0x4f, 0x67, 0x67, 0x53], OGG_FORMAT), // OggS

  // Video formats
  createMagicPattern([0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], MP4_FORMAT, 4), // ftyp
  createMagicPattern([0x00, 0x00, 0x00, 0x1c, 0x66, 0x74, 0x79, 0x70], MP4_FORMAT, 4), // ftyp
  createMagicPattern([0x52, 0x49, 0x46, 0x46], AVI_FORMAT), // RIFF for AVI
  createMagicPattern([0x1a, 0x45, 0xdf, 0xa3], WEBM_FORMAT), // Matroska/WebM

  // Executable formats
  createMagicPattern([0x4d, 0x5a], EXE_FORMAT), // MZ header
  createMagicPattern([0x7f, 0x45, 0x4c, 0x46], ELF_FORMAT), // ELF header
];

// ========================================
// Extension Mappings
// ========================================

export const EXTENSION_MAPPINGS: readonly ExtensionMapping[] = [
  // Images
  { extension: '.jpg', format: JPEG_FORMAT, reliability: 'medium' },
  { extension: '.jpeg', format: JPEG_FORMAT, reliability: 'medium' },
  { extension: '.png', format: PNG_FORMAT, reliability: 'medium' },
  { extension: '.gif', format: GIF_FORMAT, reliability: 'medium' },
  { extension: '.bmp', format: BMP_FORMAT, reliability: 'medium' },
  { extension: '.webp', format: WEBP_FORMAT, reliability: 'medium' },
  { extension: '.svg', format: SVG_FORMAT, reliability: 'high' },
  { extension: '.ico', format: ICO_FORMAT, reliability: 'medium' },
  { extension: '.tiff', format: TIFF_FORMAT, reliability: 'medium' },
  { extension: '.tif', format: TIFF_FORMAT, reliability: 'medium' },

  // Documents
  { extension: '.pdf', format: PDF_FORMAT, reliability: 'high' },
  { extension: '.doc', format: DOC_FORMAT, reliability: 'medium' },
  { extension: '.docx', format: DOCX_FORMAT, reliability: 'medium' },
  { extension: '.xls', format: XLS_FORMAT, reliability: 'medium' },
  { extension: '.xlsx', format: XLSX_FORMAT, reliability: 'medium' },

  // Archives
  { extension: '.zip', format: ZIP_FORMAT, reliability: 'medium' },
  { extension: '.rar', format: RAR_FORMAT, reliability: 'high' },
  { extension: '.7z', format: SEVENZ_FORMAT, reliability: 'high' },
  { extension: '.tar', format: TAR_FORMAT, reliability: 'medium' },
  { extension: '.gz', format: GZIP_FORMAT, reliability: 'medium' },

  // Audio
  { extension: '.mp3', format: MP3_FORMAT, reliability: 'medium' },
  { extension: '.wav', format: WAV_FORMAT, reliability: 'medium' },
  { extension: '.flac', format: FLAC_FORMAT, reliability: 'high' },
  { extension: '.ogg', format: OGG_FORMAT, reliability: 'medium' },

  // Video
  { extension: '.mp4', format: MP4_FORMAT, reliability: 'medium' },
  { extension: '.avi', format: AVI_FORMAT, reliability: 'medium' },
  { extension: '.mov', format: MOV_FORMAT, reliability: 'medium' },
  { extension: '.webm', format: WEBM_FORMAT, reliability: 'medium' },

  // Data
  { extension: '.json', format: JSON_FORMAT, reliability: 'high' },
  { extension: '.xml', format: XML_FORMAT, reliability: 'medium' },
  { extension: '.csv', format: CSV_FORMAT, reliability: 'medium' },
  { extension: '.yaml', format: YAML_FORMAT, reliability: 'medium' },
  { extension: '.yml', format: YAML_FORMAT, reliability: 'medium' },

  // Executable
  { extension: '.exe', format: EXE_FORMAT, reliability: 'high' },
];

// ========================================
// MIME Type Mappings
// ========================================

export const MIME_TYPE_MAP = new Map<string, FileFormatInfo>([
  ['image/jpeg', JPEG_FORMAT],
  ['image/png', PNG_FORMAT],
  ['image/gif', GIF_FORMAT],
  ['image/bmp', BMP_FORMAT],
  ['image/webp', WEBP_FORMAT],
  ['image/svg+xml', SVG_FORMAT],
  ['image/x-icon', ICO_FORMAT],
  ['image/tiff', TIFF_FORMAT],
  ['application/pdf', PDF_FORMAT],
  ['application/msword', DOC_FORMAT],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', DOCX_FORMAT],
  ['application/vnd.ms-excel', XLS_FORMAT],
  ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', XLSX_FORMAT],
  ['application/zip', ZIP_FORMAT],
  ['application/vnd.rar', RAR_FORMAT],
  ['application/x-7z-compressed', SEVENZ_FORMAT],
  ['application/x-tar', TAR_FORMAT],
  ['application/gzip', GZIP_FORMAT],
  ['audio/mpeg', MP3_FORMAT],
  ['audio/wav', WAV_FORMAT],
  ['audio/flac', FLAC_FORMAT],
  ['audio/ogg', OGG_FORMAT],
  ['video/mp4', MP4_FORMAT],
  ['video/x-msvideo', AVI_FORMAT],
  ['video/quicktime', MOV_FORMAT],
  ['video/webm', WEBM_FORMAT],
  ['application/json', JSON_FORMAT],
  ['application/xml', XML_FORMAT],
  ['text/csv', CSV_FORMAT],
  ['application/x-yaml', YAML_FORMAT],
  ['application/x-msdownload', EXE_FORMAT],
  ['application/x-executable', ELF_FORMAT],
]);

// ========================================
// Format Database
// ========================================

export const FORMAT_DATABASE: FormatDatabase = {
  magicNumbers: MAGIC_PATTERNS,
  extensions: EXTENSION_MAPPINGS,
  mimeTypes: MIME_TYPE_MAP,
};
