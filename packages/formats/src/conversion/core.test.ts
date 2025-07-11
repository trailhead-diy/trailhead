import { describe, it, expect } from 'vitest';
import { createConversionOperations } from './core.js';

describe('Conversion Core Operations', () => {
  const conversionOps = createConversionOperations();

  describe('checkConversion', () => {
    it('should check supported conversion', () => {
      const result = conversionOps.checkConversion('jpg', 'png');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.fromFormat).toBe('jpg');
        expect(result.value.toFormat).toBe('png');
        expect(result.value.supported).toBe(true);
        expect(result.value.quality).toBe('lossy');
      }
    });

    it('should handle same format conversion', () => {
      const result = conversionOps.checkConversion('jpg', 'jpg');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.supported).toBe(true);
        expect(result.value.quality).toBe('lossless');
      }
    });

    it('should handle unsupported conversion', () => {
      const result = conversionOps.checkConversion('jpg', 'exe');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.supported).toBe(false);
      }
    });

    it('should handle empty formats', () => {
      const result = conversionOps.checkConversion('', 'png');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('Both source and target formats are required');
      }
    });

    it('should normalize format extensions', () => {
      const result = conversionOps.checkConversion('.JPG', '.PNG');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.fromFormat).toBe('jpg');
        expect(result.value.toFormat).toBe('png');
      }
    });
  });

  describe('getSupportedFormats', () => {
    it('should get all supported formats', () => {
      const result = conversionOps.getSupportedFormats();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.length).toBeGreaterThan(0);
        expect(result.value).toContain('jpg');
        expect(result.value).toContain('png');
      }
    });

    it('should get supported formats for category', () => {
      const result = conversionOps.getSupportedFormats('image');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toContain('jpg');
        expect(result.value).toContain('png');
        expect(result.value).toContain('svg');
      }
    });

    it('should handle unknown category', () => {
      const result = conversionOps.getSupportedFormats('unknown' as any);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(0);
      }
    });
  });

  describe('getConversionChain', () => {
    it('should get direct conversion chain', () => {
      const result = conversionOps.getConversionChain('jpg', 'png');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(['jpg', 'png']);
      }
    });

    it('should get same format chain', () => {
      const result = conversionOps.getConversionChain('jpg', 'jpg');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual(['jpg']);
      }
    });

    it('should handle unsupported conversion chain', () => {
      const result = conversionOps.getConversionChain('jpg', 'exe');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('Unsupported format');
      }
    });
  });

  describe('estimateConversionQuality', () => {
    it('should estimate quality for supported conversion', () => {
      const result = conversionOps.estimateConversionQuality('wav', 'mp3');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe('lossy');
      }
    });

    it('should return lossless for same format', () => {
      const result = conversionOps.estimateConversionQuality('png', 'png');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe('lossless');
      }
    });

    it('should estimate quality for unknown conversion', () => {
      const result = conversionOps.estimateConversionQuality('unknown1', 'unknown2');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        // Should provide some estimate
        expect(['lossless', 'lossy', 'transcode']).toContain(result.value);
      }
    });

    it('should handle lossless conversions', () => {
      const result = conversionOps.estimateConversionQuality('wav', 'flac');

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe('lossless');
      }
    });
  });
});
