/**
 * @file File-type integration tests
 */

import { describe, it, expect } from 'vitest';
import {
  getSupportedExtensions,
  getSupportedMimeTypes,
  isExtensionSupported,
  isMimeTypeSupported,
  validateFormat,
} from '../index.js';

describe('File-type Integration', () => {
  describe('getSupportedExtensions', () => {
    it('returns a ReadonlySet of extensions', () => {
      const extensions = getSupportedExtensions();
      expect(extensions).toBeInstanceOf(Set);
      expect(extensions.size).toBeGreaterThan(0);
      expect(extensions.has('jpg')).toBe(true);
      expect(extensions.has('png')).toBe(true);
      expect(extensions.has('pdf')).toBe(true);
    });
  });

  describe('getSupportedMimeTypes', () => {
    it('returns a ReadonlySet of MIME types', () => {
      const mimeTypes = getSupportedMimeTypes();
      expect(mimeTypes).toBeInstanceOf(Set);
      expect(mimeTypes.size).toBeGreaterThan(0);
      expect(mimeTypes.has('image/jpeg')).toBe(true);
      expect(mimeTypes.has('image/png')).toBe(true);
      expect(mimeTypes.has('application/pdf')).toBe(true);
    });
  });

  describe('isExtensionSupported', () => {
    it('returns true for supported extensions', () => {
      expect(isExtensionSupported('jpg')).toBe(true);
      expect(isExtensionSupported('png')).toBe(true);
      expect(isExtensionSupported('pdf')).toBe(true);
    });

    it('handles extensions with dots', () => {
      expect(isExtensionSupported('.jpg')).toBe(true);
      expect(isExtensionSupported('.png')).toBe(true);
    });

    it('is case insensitive', () => {
      expect(isExtensionSupported('JPG')).toBe(true);
      expect(isExtensionSupported('PNG')).toBe(true);
    });

    it('returns false for unsupported extensions', () => {
      expect(isExtensionSupported('invalid')).toBe(false);
      expect(isExtensionSupported('xyz')).toBe(false);
    });
  });

  describe('isMimeTypeSupported', () => {
    it('returns true for supported MIME types', () => {
      expect(isMimeTypeSupported('image/jpeg')).toBe(true);
      expect(isMimeTypeSupported('image/png')).toBe(true);
      expect(isMimeTypeSupported('application/pdf')).toBe(true);
    });

    it('returns false for unsupported MIME types', () => {
      expect(isMimeTypeSupported('invalid/type')).toBe(false);
      expect(isMimeTypeSupported('application/xyz')).toBe(false);
    });
  });

  describe('validateFormat', () => {
    it('validates supported formats', () => {
      const result = validateFormat('jpg');
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe('jpg');
      }
    });

    it('rejects unsupported formats', () => {
      const result = validateFormat('invalid');
      expect(result.isOk()).toBe(false);
      if (!result.isOk()) {
        expect(result.error.code).toBe('UNSUPPORTED_FORMAT');
      }
    });

    it('validates against allowed formats list', () => {
      const result = validateFormat('jpg', ['png', 'gif']);
      expect(result.isOk()).toBe(false);
      if (!result.isOk()) {
        expect(result.error.code).toBe('FORMAT_NOT_ALLOWED');
      }
    });
  });
});
