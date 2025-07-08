import { spawn } from 'node:child_process';
import { Result, Ok, Err, tryCatchAsync, CLIError } from '../core/index.js';
import { createGitError } from './errors.js';
import type { GitCommandResult, GitOptions } from './types.js';

/**
 * Default timeout for git operations (30 seconds)
 */
const DEFAULT_TIMEOUT = 30_000;

/**
 * Execute a git command using child_process.spawn
 */
export async function executeGitCommand(
  args: string[],
  options: GitOptions = {}
): Promise<Result<GitCommandResult, CLIError>> {
  const { cwd = process.cwd(), timeout = DEFAULT_TIMEOUT } = options;

  return tryCatchAsync(async () => {
    return new Promise<GitCommandResult>((resolve, reject) => {
      const command = `git ${args.join(' ')}`;
      const child = spawn('git', args, {
        cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false,
      });

      let stdout = '';
      let stderr = '';
      let timeoutId: NodeJS.Timeout | undefined;

      // Set up timeout
      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          child.kill('SIGTERM');
          reject(new Error(`Git command timed out after ${timeout}ms: ${command}`));
        }, timeout);
      }

      // Collect stdout
      child.stdout?.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      // Collect stderr
      child.stderr?.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      // Handle process completion
      child.on('close', exitCode => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        const result: GitCommandResult = {
          exitCode: exitCode ?? -1,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          command,
        };

        resolve(result);
      });

      // Handle process errors
      child.on('error', error => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        reject(new Error(`Failed to execute git command: ${error.message}`));
      });
    });
  });
}

/**
 * Execute a git command and return only stdout on success
 */
export async function executeGitCommandSimple(
  args: string[],
  options: GitOptions = {}
): Promise<Result<string, CLIError>> {
  const result = await executeGitCommand(args, options);

  if (!result.success) {
    return result;
  }

  const { exitCode, stdout, stderr, command } = result.value;

  if (exitCode !== 0) {
    const errorMessage = stderr || `Git command failed with exit code ${exitCode}`;
    return Err(createGitError(`${command}: ${errorMessage}`));
  }

  return Ok(stdout);
}

/**
 * Check if git is available and working directory is a git repository
 */
export async function validateGitEnvironment(
  options: GitOptions = {}
): Promise<Result<boolean, CLIError>> {
  // Check if git is available
  const gitVersionResult = await executeGitCommandSimple(['--version'], options);
  if (!gitVersionResult.success) {
    return Err(createGitError('Git is not available or not installed'));
  }

  // Check if current directory is a git repository
  const gitDirResult = await executeGitCommandSimple(['rev-parse', '--git-dir'], options);
  if (!gitDirResult.success) {
    return Err(createGitError('Current directory is not a git repository'));
  }

  return Ok(true);
}
