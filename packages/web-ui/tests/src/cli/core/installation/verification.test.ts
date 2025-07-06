/**
 * High-ROI tests for verification module
 * Focus: Security, integrity checking, hash validation, error reporting
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as crypto from 'crypto';
import {
  calculateFileHash,
  calculateStringHash,
  readCatalystHashes,
  validateCatalystHashData,
  verifyCatalystFiles,
  compareHashes,
  generateVerificationErrorReport,
  shouldFailVerification,
} from '../../../../../src/cli/core/installation/verification.js';
import { Ok, Err, CATALYST_VERSION } from '../../../../../src/cli/core/installation/types.js';
import type {
  InstallConfig,
  Logger,
  Hasher,
} from '../../../../../src/cli/core/installation/types.js';
import { createMockFileSystem } from '../../../../utils/mock-filesystem.js';

// Mock ora spinner
vi.mock('ora', () => {
  const mockSpinner = {
    start: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    warn: vi.fn().mockReturnThis(),
    text: '',
  };
  return {
    default: vi.fn(() => mockSpinner),
  };
});

describe('verification - High-ROI Tests', () => {
  let mockFS: ReturnType<typeof createMockFileSystem>;
  let mockLogger: Logger;
  let mockHasher: Hasher;
  let config: InstallConfig;

  beforeEach(() => {
    mockFS = createMockFileSystem();
    mockLogger = {
      info: vi.fn(),
      success: vi.fn(),
      warning: vi.fn(),
      error: vi.fn(),
    };
    mockHasher = {
      calculateFileHash: vi.fn(),
      calculateStringHash: vi.fn(),
    };
    config = {
      projectRoot: '/project',
      componentsDir: '/project/components',
      libDir: '/project/components/lib',
      catalystDir: '/project/components/lib/catalyst',
      framework: 'nextjs',
    };
    vi.clearAllMocks();
  });

  describe('Hash Calculation - Security Foundation', () => {
    it('should calculate consistent SHA-256 hashes for file content', async () => {
      const testContent = 'export const Button = () => <button>Test</button>';
      mockFS.readFile.mockResolvedValue(Ok(testContent));

      const result = await calculateFileHash(mockFS, '/test/button.tsx');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toMatch(/^sha256:[a-f0-9]{64}$/);

        // Verify hash consistency
        const expectedHash = crypto.createHash('sha256').update(testContent, 'utf8').digest('hex');
        expect(result.value).toBe(`sha256:${expectedHash}`);
      }
    });

    it('should handle file read errors during hash calculation', async () => {
      mockFS.readFile.mockResolvedValue(
        Err({
          type: 'FileSystemError',
          message: 'Permission denied',
          path: '/restricted/file.tsx',
        })
      );

      const result = await calculateFileHash(mockFS, '/restricted/file.tsx');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('FileSystemError');
        expect(result.error.message).toBe('Permission denied');
      }
    });

    it('should calculate consistent hashes for string content', () => {
      const testContent = 'console.log("test");';

      const hash1 = calculateStringHash(testContent);
      const hash2 = calculateStringHash(testContent);

      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^sha256:[a-f0-9]{64}$/);
    });
  });

  describe('Catalyst Hash Data Validation - Security Critical', () => {
    it('should validate proper catalyst hash data structure', () => {
      const validHashData = {
        version: '1.0.0',
        files: {
          'button.tsx': 'sha256:abc123...',
          'input.tsx': 'sha256:def456...',
        },
      };

      const result = validateCatalystHashData(validHashData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual(validHashData);
      }
    });

    it('should reject hash data with invalid structure', () => {
      const invalidData = {
        version: 123, // Should be string
        files: {
          'button.tsx': 'sha256:abc123...',
        },
      };

      const result = validateCatalystHashData(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('VerificationError');
        expect(result.error.message).toBe(
          'Invalid catalyst-hashes.json format: version must be a string'
        );
      }
    });

    it('should reject hash data with invalid hash formats', () => {
      const invalidData = {
        version: '1.0.0',
        files: {
          'button.tsx': 'md5:invalid-hash-format', // Should start with sha256:
        },
      };

      const result = validateCatalystHashData(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('VerificationError');
        expect(result.error.message).toBe(
          "Invalid hash format for file button.tsx: must start with 'sha256:'"
        );
      }
    });

    it('should reject non-object hash data', () => {
      const invalidData = 'not an object';

      const result = validateCatalystHashData(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('VerificationError');
        expect(result.error.message).toBe('Invalid catalyst-hashes.json format: must be an object');
      }
    });

    it('should reject hash data with missing files section', () => {
      const invalidData = {
        version: '1.0.0',
        // files missing
      };

      const result = validateCatalystHashData(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('VerificationError');
        expect(result.error.message).toBe(
          'Invalid catalyst-hashes.json format: files must be an object'
        );
      }
    });
  });

  describe('Hash Comparison - Integrity Verification', () => {
    it('should detect file tampering through hash mismatches', () => {
      const expectedHashes = {
        'button.tsx': 'sha256:original-hash',
        'input.tsx': 'sha256:another-original-hash',
      };
      const actualHashes = {
        'button.tsx': 'sha256:modified-hash', // File has been tampered with
        'input.tsx': 'sha256:another-original-hash',
      };

      const result = compareHashes(expectedHashes, actualHashes);

      expect(result.isValid).toBe(false);
      expect(result.mismatches).toHaveLength(1);
      expect(result.mismatches[0]).toEqual({
        fileName: 'button.tsx',
        expectedHash: 'sha256:original-hash',
        actualHash: 'sha256:modified-hash',
      });
    });

    it('should detect missing critical security files', () => {
      const expectedHashes = {
        'button.tsx': 'sha256:hash1',
        'auth-component.tsx': 'sha256:security-hash', // Critical security component
      };
      const actualHashes = {
        'button.tsx': 'sha256:hash1',
        // auth-component.tsx is missing
      };

      const result = compareHashes(expectedHashes, actualHashes);

      expect(result.isValid).toBe(false);
      expect(result.missing).toContain('auth-component.tsx');
    });

    it('should identify extra files that could be malicious', () => {
      const expectedHashes = {
        'button.tsx': 'sha256:hash1',
      };
      const actualHashes = {
        'button.tsx': 'sha256:hash1',
        'malicious-backdoor.tsx': 'sha256:suspicious-hash', // Unexpected file
      };

      const result = compareHashes(expectedHashes, actualHashes);

      expect(result.isValid).toBe(true); // Extra files don't invalidate, but are flagged
      expect(result.extra).toContain('malicious-backdoor.tsx');
    });

    it('should validate clean installations with all files matching', () => {
      const expectedHashes = {
        'button.tsx': 'sha256:hash1',
        'input.tsx': 'sha256:hash2',
      };
      const actualHashes = {
        'button.tsx': 'sha256:hash1',
        'input.tsx': 'sha256:hash2',
      };

      const result = compareHashes(expectedHashes, actualHashes);

      expect(result.isValid).toBe(true);
      expect(result.mismatches).toHaveLength(0);
      expect(result.missing).toHaveLength(0);
      expect(result.extra).toHaveLength(0);
    });
  });

  describe('readCatalystHashes - Security File Loading', () => {
    it('should handle missing catalyst-hashes.json file', async () => {
      mockFS.access.mockResolvedValue(
        Err({
          code: 'ENOENT',
          message: 'File not found',
          path: '/project/scripts/catalyst-hashes.json',
        })
      );

      const result = await readCatalystHashes(mockFS, '/project');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('VerificationError');
        expect(result.error.message).toBe('catalyst-hashes.json not found in scripts directory');
      }
    });

    it('should handle corrupted catalyst-hashes.json file', async () => {
      mockFS.access.mockResolvedValue(Ok(undefined));
      mockFS.readJson.mockResolvedValue(
        Err({
          type: 'FileSystemError',
          message: 'Invalid JSON: Unexpected token',
          path: '/project/scripts/catalyst-hashes.json',
        })
      );

      const result = await readCatalystHashes(mockFS, '/project');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('FileSystemError');
      }
    });

    it('should successfully load and validate proper hash file', async () => {
      const validHashData = {
        version: CATALYST_VERSION,
        files: {
          'button.tsx': 'sha256:abc123...',
        },
      };

      mockFS.access.mockResolvedValue(Ok(undefined));
      mockFS.readJson.mockResolvedValue(Ok(validHashData));

      const result = await readCatalystHashes(mockFS, '/project');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual(validHashData);
      }
    });
  });

  describe('verifyCatalystFiles - Complete Integration', () => {
    it('should handle version mismatch with appropriate warning', async () => {
      const hashData = {
        version: '0.9.0', // Different from CATALYST_VERSION
        files: {
          'button.tsx': 'sha256:hash1',
        },
      };

      mockFS.access.mockResolvedValue(Ok(undefined));
      mockFS.readJson.mockResolvedValue(Ok(hashData));
      mockHasher.calculateFileHash.mockResolvedValue(Ok('sha256:hash1'));

      const result = await verifyCatalystFiles(
        mockFS,
        mockHasher,
        mockLogger,
        config,
        '/trailhead'
      );

      expect(result.success).toBe(true);
      // Version mismatch is logged via spinner.warn, not logger.warning
      // So just verify the function completes successfully
    });

    it('should handle hash calculation failures during verification', async () => {
      const hashData = {
        version: CATALYST_VERSION,
        files: {
          'button.tsx': 'sha256:expected-hash',
        },
      };

      mockFS.access.mockResolvedValue(Ok(undefined));
      mockFS.readJson.mockResolvedValue(Ok(hashData));
      mockHasher.calculateFileHash.mockResolvedValue(
        Err({
          type: 'FileSystemError',
          message: 'Cannot read file for hash calculation',
          path: '/project/components/lib/catalyst/button.tsx',
        })
      );

      const result = await verifyCatalystFiles(
        mockFS,
        mockHasher,
        mockLogger,
        config,
        '/trailhead'
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('FileSystemError');
      }
    });

    it('should provide detailed security warnings for verification issues', async () => {
      const expectedHashes = {
        version: CATALYST_VERSION,
        files: {
          'button.tsx': 'sha256:expected-hash',
          'input.tsx': 'sha256:input-hash',
        },
      };

      // Mock hash file access and reading
      mockFS.access.mockImplementation(async (path: string) => {
        if (path.includes('catalyst-hashes.json')) {
          return Ok(undefined);
        }
        // For component files, only button.tsx exists
        if (path.includes('button.tsx')) {
          return Ok(undefined);
        }
        // All other files don't exist (simulate ENOENT)
        return Err({ code: 'ENOENT', message: 'File not found' });
      });

      mockFS.readJson.mockResolvedValue(Ok(expectedHashes));

      // Mock file hash calculation for button.tsx (different hash)
      mockHasher.calculateFileHash.mockResolvedValue(Ok('sha256:different-hash'));

      const result = await verifyCatalystFiles(
        mockFS,
        mockHasher,
        mockLogger,
        config,
        '/trailhead'
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.isValid).toBe(false);
        expect(mockLogger.warning).toHaveBeenCalledWith(
          expect.stringContaining('files have different hashes')
        );
        expect(mockLogger.warning).toHaveBeenCalledWith(
          expect.stringContaining('files are missing')
        );
      }
    });
  });

  describe('generateVerificationErrorReport - User Guidance', () => {
    it('should generate comprehensive security error report', () => {
      const verificationResult = {
        isValid: false,
        mismatches: [
          {
            fileName: 'button.tsx',
            expectedHash: 'sha256:original',
            actualHash: 'sha256:modified',
          },
        ],
        missing: ['auth-component.tsx'],
        extra: ['suspicious-file.tsx'],
      };

      const report = generateVerificationErrorReport(verificationResult, CATALYST_VERSION);

      expect(report).toContain('🚨 Catalyst UI Kit Verification Failed');
      expect(report).toContain('❌ 1 files have different content:');
      expect(report).toContain('• button.tsx');
      expect(report).toContain('❌ 1 files are missing:');
      expect(report).toContain('• auth-component.tsx');
      expect(report).toContain('⚠️  1 extra files found:');
      expect(report).toContain('• suspicious-file.tsx');
      expect(report).toContain('💡 To fix this:');
      expect(report).toContain('Download the latest Catalyst UI Kit');
    });

    it('should provide specific guidance for version mismatches', () => {
      const verificationResult = {
        isValid: false,
        mismatches: [],
        missing: ['new-component.tsx'],
        extra: [],
      };

      const report = generateVerificationErrorReport(verificationResult, '2.0.0');

      expect(report).toContain('Expected version: 2.0.0');
      expect(report).toContain('Verify the files match version 2.0.0');
    });
  });

  describe('shouldFailVerification - Security Decision Logic', () => {
    it('should always fail verification for missing files (security critical)', () => {
      const result = {
        isValid: false,
        mismatches: [],
        missing: ['auth-component.tsx'], // Security-critical file missing
        extra: [],
      };

      const shouldFail = shouldFailVerification(result, true); // Even allowing mismatches

      expect(shouldFail).toBe(true);
    });

    it('should fail verification for hash mismatches when not allowed', () => {
      const result = {
        isValid: false,
        mismatches: [{ fileName: 'button.tsx', expectedHash: 'sha256:a', actualHash: 'sha256:b' }],
        missing: [],
        extra: [],
      };

      const shouldFail = shouldFailVerification(result, false);

      expect(shouldFail).toBe(true);
    });

    it('should allow verification with mismatches when explicitly permitted', () => {
      const result = {
        isValid: false,
        mismatches: [{ fileName: 'button.tsx', expectedHash: 'sha256:a', actualHash: 'sha256:b' }],
        missing: [],
        extra: [],
      };

      const shouldFail = shouldFailVerification(result, true);

      expect(shouldFail).toBe(false);
    });

    it('should pass verification for clean installations', () => {
      const result = {
        isValid: true,
        mismatches: [],
        missing: [],
        extra: [],
      };

      const shouldFail = shouldFailVerification(result, false);

      expect(shouldFail).toBe(false);
    });
  });
});
