/**
 * SHA verification logic for Trailhead UI install script
 */

import * as path from 'node:path';
import { createHash } from 'node:crypto';
import ora from 'ora';
import type {
  CatalystHashData,
  VerificationResult,
  FileMismatch,
  InstallError,
  FileSystem,
  Hasher,
  Logger,
  Result,
  InstallConfig,
} from './types.js';
import { ok, err, CATALYST_COMPONENT_FILES, CATALYST_VERSION } from './types.js';
import { createError } from '@esteban-url/trailhead-cli/core';

// ============================================================================
// HASH CALCULATION (Pure Functions)
// ============================================================================

/**
 * Pure function: Calculate SHA-256 hash of file content
 */
export const calculateFileHash = async (
  fs: FileSystem,
  filePath: string
): Promise<Result<string, InstallError>> => {
  const readResult = await fs.readFile(filePath);
  if (!readResult.isOk()) return err(readResult.error);

  const hash = createHash('sha256').update(readResult.value, 'utf8').digest('hex');
  return ok(`sha256:${hash}`);
};

/**
 * Pure function: Calculate SHA-256 hash of string content
 */
export const calculateStringHash = (content: string): string => {
  const hash = createHash('sha256').update(content, 'utf8').digest('hex');
  return `sha256:${hash}`;
};

/**
 * Create default hasher implementation
 */
export const createDefaultHasher = (fs: FileSystem): Hasher => ({
  calculateFileHash: (filePath: string) => calculateFileHash(fs, filePath),
  calculateStringHash,
});

// ============================================================================
// CATALYST HASH DATA OPERATIONS
// ============================================================================

/**
 * Read catalyst-hashes.json file from project root
 */
export const readCatalystHashes = async (
  fs: FileSystem,
  projectRoot: string
): Promise<Result<CatalystHashData, InstallError>> => {
  const hashFilePath = path.join(projectRoot, 'scripts', 'catalyst-hashes.json');

  const existsResult = await fs.access(hashFilePath);
  if (!existsResult.isOk()) {
    return err(
      createError('VERIFICATION_ERROR', 'catalyst-hashes.json not found in scripts directory')
    );
  }

  const readResult = await fs.readJson<unknown>(hashFilePath);
  if (!readResult.isOk()) return err(readResult.error);

  const validateResult = validateCatalystHashData(readResult.value);
  if (!validateResult.isOk()) return err(validateResult.error);

  return ok(validateResult.value);
};

/**
 * Pure function: Validate CatalystHashData structure
 */
export const validateCatalystHashData = (data: unknown): Result<CatalystHashData, InstallError> => {
  if (!data || typeof data !== 'object') {
    return err(
      createError('VERIFICATION_ERROR', 'Invalid catalyst-hashes.json format: must be an object')
    );
  }

  const hashData = data as Record<string, unknown>;

  if (typeof hashData.version !== 'string') {
    return err(
      createError(
        'VERIFICATION_ERROR',
        'Invalid catalyst-hashes.json format: version must be a string'
      )
    );
  }

  if (!hashData.files || typeof hashData.files !== 'object') {
    return err(
      createError(
        'VERIFICATION_ERROR',
        'Invalid catalyst-hashes.json format: files must be an object'
      )
    );
  }

  const files = hashData.files as Record<string, unknown>;

  // Validate that all values are strings (hashes)
  for (const [fileName, hash] of Object.entries(files)) {
    if (typeof hash !== 'string') {
      return err(
        createError(
          'VERIFICATION_ERROR',
          `Invalid hash format for file ${fileName}: must be a string`
        )
      );
    }

    if (!hash.startsWith('sha256:')) {
      return err(
        createError(
          'VERIFICATION_ERROR',
          `Invalid hash format for file ${fileName}: must start with 'sha256:'`
        )
      );
    }
  }

  return ok({
    version: hashData.version,
    files: files as Record<string, string>,
  });
};

// ============================================================================
// VERIFICATION LOGIC (Functional Composition)
// ============================================================================

/**
 * Calculate hashes for all catalyst component files in user's directory
 */
export const calculateCatalystHashes = async (
  fs: FileSystem,
  hasher: Hasher,
  catalystDir: string,
  showProgress = false
): Promise<Result<Record<string, string>, InstallError>> => {
  const results: Record<string, string> = {};
  const spinner = showProgress ? ora('Calculating file hashes...').start() : null;

  let processed = 0;
  const total = CATALYST_COMPONENT_FILES.length;

  for (const fileName of CATALYST_COMPONENT_FILES) {
    if (spinner) {
      spinner.text = `Calculating hashes... (${processed + 1}/${total}) ${fileName}`;
    }

    const filePath = path.join(catalystDir, fileName);

    const existsResult = await fs.access(filePath);
    if (existsResult.isOk()) {
      const hashResult = await hasher.calculateFileHash(filePath);
      if (!hashResult.isOk()) {
        spinner?.fail('Failed to calculate hash');
        return err(hashResult.error);
      }

      results[fileName] = hashResult.value;
    }

    processed++;
  }

  spinner?.succeed(`Calculated hashes for ${processed} files`);

  return ok(results);
};

/**
 * Pure function: Compare expected hashes with actual hashes
 */
export const compareHashes = (
  expectedHashes: Record<string, string>,
  actualHashes: Record<string, string>
): VerificationResult => {
  const mismatches: FileMismatch[] = [];
  const missing: string[] = [];
  const extra: string[] = [];

  // Find mismatches and missing files
  for (const [fileName, expectedHash] of Object.entries(expectedHashes)) {
    const actualHash = actualHashes[fileName];

    if (!actualHash) {
      missing.push(fileName);
    } else if (actualHash !== expectedHash) {
      mismatches.push({
        fileName,
        expectedHash,
        actualHash,
      });
    }
  }

  // Find extra files
  for (const fileName of Object.keys(actualHashes)) {
    if (!expectedHashes[fileName]) {
      extra.push(fileName);
    }
  }

  const isValid = mismatches.length === 0 && missing.length === 0;

  return {
    isValid,
    mismatches,
    missing,
    extra,
  };
};

/**
 * Verify catalyst files against stored hashes
 */
export const verifyCatalystFiles = async (
  fs: FileSystem,
  hasher: Hasher,
  logger: Logger,
  config: InstallConfig,
  trailheadRoot: string
): Promise<Result<VerificationResult, InstallError>> => {
  const spinner = ora('Reading expected hashes...').start();

  try {
    // Read expected hashes from trailhead root (reference checksums)
    const expectedHashesResult = await readCatalystHashes(fs, trailheadRoot);
    if (!expectedHashesResult.isOk()) {
      spinner.fail('Failed to read expected hashes');
      return err(expectedHashesResult.error);
    }

    const expectedHashes = expectedHashesResult.value;

    // Check version
    if (expectedHashes.version !== CATALYST_VERSION) {
      spinner.warn(
        `Expected Catalyst version ${CATALYST_VERSION}, found ${expectedHashes.version}`
      );
    }

    // Calculate actual hashes from user's catalyst source directory
    spinner.text = 'Verifying Catalyst UI Kit files...';
    const actualHashesResult = await calculateCatalystHashes(fs, hasher, config.catalystDir, true);
    if (!actualHashesResult.isOk()) {
      spinner.fail('Failed to calculate file hashes');
      return err(actualHashesResult.error);
    }

    const actualHashes = actualHashesResult.value;

    // Compare hashes
    spinner.text = 'Comparing file hashes...';
    const verificationResult = compareHashes(expectedHashes.files, actualHashes);

    // Log results
    if (verificationResult.isValid) {
      spinner.succeed(
        `All ${Object.keys(actualHashes).length} Catalyst files verified successfully`
      );
    } else {
      spinner.warn('Catalyst file verification issues found');

      if (verificationResult.mismatches.length > 0) {
        logger.warning(`  ${verificationResult.mismatches.length} files have different hashes`);
        verificationResult.mismatches.forEach(mismatch => {
          logger.warning(`    • ${mismatch.fileName}`);
        });
      }

      if (verificationResult.missing.length > 0) {
        logger.warning(`  ${verificationResult.missing.length} files are missing`);
        verificationResult.missing.forEach(fileName => {
          logger.warning(`    • ${fileName}`);
        });
      }

      if (verificationResult.extra.length > 0) {
        logger.warning(`  ${verificationResult.extra.length} extra files found`);
        verificationResult.extra.forEach(fileName => {
          logger.warning(`    • ${fileName}`);
        });
      }
    }

    return ok(verificationResult);
  } catch (error) {
    spinner.fail('Failed to verify Catalyst files');
    return err(
      createError('VERIFICATION_ERROR', 'Failed to verify Catalyst files', { cause: error })
    );
  }
};

// ============================================================================
// HASH GENERATION FOR KNOWN CATALYST FILES
// ============================================================================

/**
 * Generate hash data for all catalyst component files
 * This is used by the generate-hashes.ts script
 */
export const generateCatalystHashData = async (
  fs: FileSystem,
  hasher: Hasher,
  catalystDir: string,
  version: string = CATALYST_VERSION
): Promise<Result<CatalystHashData, InstallError>> => {
  const hashesResult = await calculateCatalystHashes(fs, hasher, catalystDir, true);
  if (!hashesResult.isOk()) return err(hashesResult.error);

  const catalystHashData: CatalystHashData = {
    version,
    files: hashesResult.value,
  };

  return ok(catalystHashData);
};

/**
 * Write catalyst hash data to file
 */
export const writeCatalystHashes = async (
  fs: FileSystem,
  projectRoot: string,
  hashData: CatalystHashData
): Promise<Result<void, InstallError>> => {
  const hashFilePath = path.join(projectRoot, 'scripts', 'catalyst-hashes.json');
  return await fs.writeJson(hashFilePath, hashData, { spaces: 2 });
};

// ============================================================================
// VERIFICATION ERROR REPORTING
// ============================================================================

/**
 * Pure function: Generate detailed error report for verification failures
 */
export const generateVerificationErrorReport = (
  result: VerificationResult,
  expectedVersion: string
): string => {
  const lines: string[] = [];

  lines.push('🚨 Catalyst UI Kit Verification Failed');
  lines.push('');
  lines.push(`Expected version: ${expectedVersion}`);
  lines.push('');

  if (result.mismatches.length > 0) {
    lines.push(`❌ ${result.mismatches.length} files have different content:`);
    result.mismatches.forEach(mismatch => {
      lines.push(`   • ${mismatch.fileName}`);
    });
    lines.push('');
  }

  if (result.missing.length > 0) {
    lines.push(`❌ ${result.missing.length} files are missing:`);
    result.missing.forEach(fileName => {
      lines.push(`   • ${fileName}`);
    });
    lines.push('');
  }

  if (result.extra.length > 0) {
    lines.push(`⚠️  ${result.extra.length} extra files found:`);
    result.extra.forEach(fileName => {
      lines.push(`   • ${fileName}`);
    });
    lines.push('');
  }

  lines.push('💡 To fix this:');
  lines.push('   1. Download the latest Catalyst UI Kit from Tailwind Plus');
  lines.push('   2. Ensure you are using the TypeScript version');
  lines.push(`   3. Verify the files match version ${expectedVersion}`);
  lines.push('   4. Run the install script again');

  return lines.join('\n');
};

/**
 * Check if verification can proceed with warnings or should fail
 */
export const shouldFailVerification = (
  result: VerificationResult,
  allowMismatches: boolean = false
): boolean => {
  // Always fail if files are missing
  if (result.missing.length > 0) {
    return true;
  }

  // Fail on mismatches unless explicitly allowed
  if (result.mismatches.length > 0 && !allowMismatches) {
    return true;
  }

  return false;
};
