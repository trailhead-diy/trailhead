import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

/**
 * Create a temporary directory for testing
 */
export async function createTestTempDir(): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'trailhead-cli-test-'));
  return tempDir;
}

/**
 * Clean up test temporary directory
 */
export async function cleanup(tempDir: string): Promise<void> {
  try {
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors in tests
  }
}

/**
 * Create a test file with specific content
 */
export async function createTestFile(
  tempDir: string,
  fileName: string,
  content: string,
): Promise<string> {
  const filePath = path.join(tempDir, fileName);
  await fs.writeFile(filePath, content);
  return filePath;
}

/**
 * Create a test directory structure
 */
export async function createTestStructure(
  tempDir: string,
  structure: Record<string, string>,
): Promise<void> {
  for (const [filePath, content] of Object.entries(structure)) {
    const fullPath = path.join(tempDir, filePath);
    const dir = path.dirname(fullPath);
    
    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });
    
    // Write file
    await fs.writeFile(fullPath, content);
  }
}
