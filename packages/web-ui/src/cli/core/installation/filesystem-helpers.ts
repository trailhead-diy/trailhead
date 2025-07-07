/**
 * Filesystem helper functions that bridge CLI framework utilities with installation types
 */

import { pathExists as cliPathExists } from '@esteban-url/trailhead-cli/filesystem';
import { createError } from '@esteban-url/trailhead-cli/core';
import type { Result, InstallError } from './types.js';
import { Ok, Err } from './types.js';

/**
 * Check if path exists, converting CLI framework Result to InstallError format
 */
export const pathExists = async (filePath: string): Promise<Result<boolean, InstallError>> => {
  const result = await cliPathExists(filePath);
  if (result.success) {
    return Ok(result.value);
  } else {
    return Err(
      createError('FILESYSTEM_ERROR', 'Failed to check path existence', {
        details: `Path: ${filePath}`,
        cause: result.error,
      })
    );
  }
};
