import { ok, err, createCoreError } from '@esteban-url/core';
import type { Result, CoreError } from '@esteban-url/core';
import { execa } from 'execa';

// TODO: Replace with @esteban-url/git when workspace dependencies are resolved
// import { createGitOperations, createGitCommandOperations } from '@esteban-url/git';
// import type { GitRepository } from '@esteban-url/git';

interface GitRepository {
  path: string;
  isValid: boolean;
  workingDirectory: string;
  gitDirectory: string;
}

/**
 * Git operations specifically for project generation
 *
 * This module provides a unified interface for git operations needed during
 * project generation, handling the API inconsistencies in @esteban-url/git
 * and providing fallbacks for missing functionality.
 */

interface GitOperationsForGenerator {
  initRepository(projectPath: string): Promise<Result<GitRepository, CoreError>>;
  stageFiles(projectPath: string, files: string[]): Promise<Result<void, CoreError>>;
  createCommit(projectPath: string, message: string): Promise<Result<string, CoreError>>;
  configureUser(projectPath: string, name: string, email: string): Promise<Result<void, CoreError>>;
  getConfig(projectPath: string, key: string): Promise<Result<string, CoreError>>;
  verifyStatus(projectPath: string): Promise<Result<void, CoreError>>;
}

/**
 * Create git operations instance for project generation
 *
 * Using execa fallbacks until @esteban-url/git workspace dependencies are resolved
 */
export function createGeneratorGitOperations(): GitOperationsForGenerator {
  const initRepository = async (projectPath: string): Promise<Result<GitRepository, CoreError>> => {
    try {
      await execa('git', ['init'], {
        cwd: projectPath,
        stdio: 'pipe',
        shell: false,
        timeout: 10000,
      });

      // Return basic repository info
      const repo: GitRepository = {
        path: projectPath,
        isValid: true,
        workingDirectory: projectPath,
        gitDirectory: `${projectPath}/.git`,
      };

      return ok(repo);
    } catch (error) {
      return err(
        createCoreError('GIT_INIT_FAILED', 'Failed to initialize git repository', {
          cause: error,
          context: { projectPath },
        })
      );
    }
  };

  const stageFiles = async (
    projectPath: string,
    files: string[]
  ): Promise<Result<void, CoreError>> => {
    try {
      await execa('git', ['add', ...files], {
        cwd: projectPath,
        stdio: 'pipe',
        shell: false,
        timeout: 30000,
      });

      return ok(undefined);
    } catch (error) {
      return err(
        createCoreError('GIT_ADD_FAILED', 'Failed to stage files', {
          cause: error,
          context: { projectPath, files },
        })
      );
    }
  };

  const createCommit = async (
    projectPath: string,
    message: string
  ): Promise<Result<string, CoreError>> => {
    try {
      const result = await execa('git', ['commit', '-m', message], {
        cwd: projectPath,
        stdio: 'pipe',
        shell: false,
        timeout: 15000,
      });

      return ok(result.stdout || 'commit created');
    } catch (error) {
      return err(
        createCoreError('GIT_COMMIT_FAILED', 'Failed to create commit', {
          cause: error,
          context: { projectPath, message },
        })
      );
    }
  };

  // FIXME: @esteban-url/git missing config operations - using execa fallback
  const configureUser = async (
    projectPath: string,
    name: string,
    email: string
  ): Promise<Result<void, CoreError>> => {
    try {
      await execa('git', ['config', 'user.name', name], {
        cwd: projectPath,
        stdio: 'pipe',
        shell: false,
        timeout: 5000,
      });

      await execa('git', ['config', 'user.email', email], {
        cwd: projectPath,
        stdio: 'pipe',
        shell: false,
        timeout: 5000,
      });

      return ok(undefined);
    } catch (error) {
      return err(
        createCoreError('GIT_CONFIG_FAILED', 'Failed to configure git user', {
          cause: error,
          context: { projectPath, name, email },
        })
      );
    }
  };

  // FIXME: @esteban-url/git missing config operations - using execa fallback
  const getConfig = async (
    projectPath: string,
    key: string
  ): Promise<Result<string, CoreError>> => {
    try {
      const result = await execa('git', ['config', key], {
        cwd: projectPath,
        stdio: 'pipe',
        shell: false,
        timeout: 5000,
      });

      return ok(result.stdout.trim());
    } catch (error) {
      return err(
        createCoreError('GIT_CONFIG_GET_FAILED', `Failed to get git config ${key}`, {
          cause: error,
          context: { projectPath, key },
        })
      );
    }
  };

  // FIXME: @esteban-url/git missing status operations - using execa fallback
  const verifyStatus = async (projectPath: string): Promise<Result<void, CoreError>> => {
    try {
      await execa('git', ['status', '--porcelain'], {
        cwd: projectPath,
        stdio: 'pipe',
        shell: false,
        timeout: 10000,
      });

      return ok(undefined);
    } catch (error) {
      return err(
        createCoreError('GIT_STATUS_FAILED', 'Failed to get git status', {
          cause: error,
          context: { projectPath },
        })
      );
    }
  };

  return {
    initRepository,
    stageFiles,
    createCommit,
    configureUser,
    getConfig,
    verifyStatus,
  };
}

/**
 * Current Status: Using execa fallbacks due to workspace dependency resolution issues
 *
 * Documentation of improvements needed in @esteban-url/git module:
 *
 * 1. API Consistency Issues:
 *    - GitOperations.init() takes a path string
 *    - GitCommandOperations methods take a GitRepository object
 *    - This requires opening the repo after init to use commands
 *
 * 2. Missing Config Operations:
 *    - No git config get/set operations
 *    - Need GitConfigOperations with:
 *      - getConfig(repo: GitRepository, key: string): Promise<GitResult<string>>
 *      - setConfig(repo: GitRepository, key: string, value: string): Promise<GitResult<void>>
 *      - listConfig(repo: GitRepository): Promise<GitResult<Record<string, string>>>
 *
 * 3. Missing Status Operations:
 *    - GitStatusOperations exists but not used/exported properly
 *    - Need proper status() method that returns file status information
 *
 * 4. Error Type Inconsistency:
 *    - Some functions return 'GitError' but it's typed as 'any'
 *    - Should define proper GitError interface that extends CoreError
 *
 * 5. API Design Suggestions:
 *    - All operations should take GitRepository as first parameter
 *    - Or provide convenience functions that take path strings
 *    - Add GitRepository.fromPath(path: string) static method
 *
 * Example improved API:
 * ```typescript
 * const repo = await GitRepository.fromPath(projectPath);
 * await repo.init();
 * await repo.add(['.']);
 * await repo.commit('Initial commit');
 * await repo.config.set('user.name', 'John Doe');
 * const status = await repo.status();
 * ```
 */
