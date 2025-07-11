import { describe, it, expect } from 'vitest';
import { createMimeOperations } from './core.js';

describe('MIME Core Operations', () => {
  const mimeOps = createMimeOperations();

  describe('getMimeType', () => {
    it('should get MIME type from file extension', () => {
      const result = mimeOps.getMimeType('test.jpg');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.full).toBe('image/jpeg');
        expect(result.value.type).toBe('image');
        expect(result.value.subtype).toBe('jpeg');
      }
    });

    it('should get MIME type from extension only', () => {
      const result = mimeOps.getMimeType('.png');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.full).toBe('image/png');
      }
    });

    it('should handle buffer input', () => {
      const buffer = Buffer.from('test content');
      const result = mimeOps.getMimeType(buffer);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // Should return default MIME type for buffer
        expect(result.value.full).toBe('application/octet-stream');
      }
    });

    it('should handle unknown extension', () => {
      const result = mimeOps.getMimeType('test.unknown123');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // Should return default MIME type for truly unknown extensions
        expect(result.value.full).toBe('application/octet-stream');
      }
    });
  });

  describe('getExtensions', () => {
    it('should get extensions for MIME type', () => {
      const result = mimeOps.getExtensions('image/jpeg');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toContain('jpeg');
      }
    });

    it('should handle unknown MIME type', () => {
      const result = mimeOps.getExtensions('application/x-unknown');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(0);
      }
    });

    it('should handle empty MIME type', () => {
      const result = mimeOps.getExtensions('');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('MIME type is required');
      }
    });
  });

  describe('isMimeType', () => {
    it('should check if MIME type belongs to category', () => {
      const result = mimeOps.isMimeType('image/jpeg', 'image');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(true);
      }
    });

    it('should return false for wrong category', () => {
      const result = mimeOps.isMimeType('image/jpeg', 'audio');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(false);
      }
    });

    it('should handle empty MIME type', () => {
      const result = mimeOps.isMimeType('', 'image');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('MIME type is required');
      }
    });
  });

  describe('normalizeMimeType', () => {
    it('should normalize MIME type', () => {
      const result = mimeOps.normalizeMimeType('IMAGE/JPEG; charset=utf-8');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe('image/jpeg');
      }
    });

    it('should handle simple MIME type', () => {
      const result = mimeOps.normalizeMimeType('text/plain');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe('text/plain');
      }
    });

    it('should handle empty MIME type', () => {
      const result = mimeOps.normalizeMimeType('');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('MIME type is required');
      }
    });
  });

  describe('parseMimeType', () => {
    it('should parse valid MIME type', () => {
      const result = mimeOps.parseMimeType('text/html; charset=utf-8');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.type).toBe('text');
        expect(result.value.subtype).toBe('html');
        expect(result.value.full).toBe('text/html');
        expect(result.value.category).toBe('document');
      }
    });

    it('should parse simple MIME type', () => {
      const result = mimeOps.parseMimeType('image/png');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.type).toBe('image');
        expect(result.value.subtype).toBe('png');
        expect(result.value.category).toBe('image');
      }
    });

    it('should handle invalid MIME type format', () => {
      const result = mimeOps.parseMimeType('invalid-mime-type');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('Invalid MIME type format');
      }
    });
  });
});
