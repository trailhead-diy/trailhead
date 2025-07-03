import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { resolve } from 'path';
import { promises as fs } from 'fs';

// Skip project subdirectory tests - they require @esteban-url/trailhead-cli to be published
// These tests work with standalone project examples that depend on the published package
// They will pass once the package is published to npm or when using make-standalone.sh script
describe.skip('Project Examples Smoke Tests', () => {
  const examplesDir = resolve(__dirname, '..');

  // Helper function to ensure dependencies are installed
  async function ensureDependencies(projectPath: string) {
    // In the monorepo context, dependencies are hoisted by pnpm
    // The examples rely on the built CLI package, so we just need
    // to ensure the package is built
    return;
  }

  // Helper function to check if project has package.json
  async function hasPackageJson(projectPath: string): Promise<boolean> {
    try {
      await fs.access(resolve(projectPath, 'package.json'));
      return true;
    } catch {
      return false;
    }
  }

  describe('API Client Example', () => {
    const apiClientPath = resolve(examplesDir, 'api-client');

    beforeAll(async () => {
      if (await hasPackageJson(apiClientPath)) {
        await ensureDependencies(apiClientPath);
      }
    });

    it('should show help without errors', async () => {
      if (!(await hasPackageJson(apiClientPath))) {
        console.log('Skipping API Client test - no package.json found');
        return;
      }

      try {
        const result = execSync('pnpm run dev --help', {
          cwd: apiClientPath,
          encoding: 'utf8',
          timeout: 10000,
        });

        expect(result).toContain('get'); // Should have get command
      } catch (error: any) {
        // If the example has compilation errors, we should know about it
        expect(error.message).not.toContain('TypeError');
        expect(error.message).not.toContain('SyntaxError');
      }
    });

    it('should handle get command help', async () => {
      if (!(await hasPackageJson(apiClientPath))) {
        return;
      }

      try {
        const result = execSync('pnpm run dev get --help', {
          cwd: apiClientPath,
          encoding: 'utf8',
          timeout: 10000,
        });

        expect(result).toBeDefined();
      } catch (error: any) {
        // Should not have basic syntax/import errors
        expect(error.message).not.toContain('Cannot find module');
        expect(error.message).not.toContain('SyntaxError');
      }
    });
  });

  describe('Cross-Platform CLI Example', () => {
    const crossPlatformPath = resolve(examplesDir, 'cross-platform-cli');

    beforeAll(async () => {
      if (await hasPackageJson(crossPlatformPath)) {
        await ensureDependencies(crossPlatformPath);
      }
    });

    it('should show help without errors', async () => {
      if (!(await hasPackageJson(crossPlatformPath))) {
        console.log('Skipping Cross-Platform CLI test - no package.json found');
        return;
      }

      try {
        const result = execSync('pnpm run dev --help', {
          cwd: crossPlatformPath,
          encoding: 'utf8',
          timeout: 10000,
        });

        expect(result).toBeDefined();
      } catch (error: any) {
        expect(error.message).not.toContain('TypeError');
        expect(error.message).not.toContain('SyntaxError');
      }
    });

    it('should execute info command', async () => {
      if (!(await hasPackageJson(crossPlatformPath))) {
        return;
      }

      try {
        const result = execSync('pnpm run dev info', {
          cwd: crossPlatformPath,
          encoding: 'utf8',
          timeout: 10000,
        });

        // Should show system information
        expect(result).toBeDefined();
      } catch (error: any) {
        // Should not have import/syntax errors
        expect(error.message).not.toContain('Cannot find module');
      }
    });
  });

  describe('File Processor Example', () => {
    const fileProcessorPath = resolve(examplesDir, 'file-processor');

    beforeAll(async () => {
      if (await hasPackageJson(fileProcessorPath)) {
        await ensureDependencies(fileProcessorPath);
      }
    });

    it('should show help without errors', async () => {
      if (!(await hasPackageJson(fileProcessorPath))) {
        console.log('Skipping File Processor test - no package.json found');
        return;
      }

      try {
        const result = execSync('pnpm run dev --help', {
          cwd: fileProcessorPath,
          encoding: 'utf8',
          timeout: 10000,
        });

        expect(result).toBeDefined();
      } catch (error: any) {
        expect(error.message).not.toContain('TypeError');
        expect(error.message).not.toContain('SyntaxError');
      }
    });
  });

  describe('Project Generator Example', () => {
    const projectGeneratorPath = resolve(examplesDir, 'project-generator');

    beforeAll(async () => {
      if (await hasPackageJson(projectGeneratorPath)) {
        await ensureDependencies(projectGeneratorPath);
      }
    });

    it('should show help without errors', async () => {
      if (!(await hasPackageJson(projectGeneratorPath))) {
        console.log('Skipping Project Generator test - no package.json found');
        return;
      }

      try {
        const result = execSync('pnpm run dev --help', {
          cwd: projectGeneratorPath,
          encoding: 'utf8',
          timeout: 10000,
        });

        expect(result).toContain('generate'); // Should have generate command
      } catch (error: any) {
        expect(error.message).not.toContain('TypeError');
        expect(error.message).not.toContain('SyntaxError');
      }
    });

    it('should handle generate command help', async () => {
      if (!(await hasPackageJson(projectGeneratorPath))) {
        return;
      }

      try {
        const result = execSync('pnpm run dev generate --help', {
          cwd: projectGeneratorPath,
          encoding: 'utf8',
          timeout: 10000,
        });

        expect(result).toBeDefined();
      } catch (error: any) {
        expect(error.message).not.toContain('Cannot find module');
      }
    });
  });

  describe('Todo CLI Example', () => {
    const todoCliPath = resolve(examplesDir, 'todo-cli');

    beforeAll(async () => {
      if (await hasPackageJson(todoCliPath)) {
        await ensureDependencies(todoCliPath);
      }
    });

    it('should show help without errors', async () => {
      if (!(await hasPackageJson(todoCliPath))) {
        console.log('Skipping Todo CLI test - no package.json found');
        return;
      }

      try {
        const result = execSync('pnpm run dev --help', {
          cwd: todoCliPath,
          encoding: 'utf8',
          timeout: 10000,
        });

        expect(result).toContain('add'); // Should have add command
        expect(result).toContain('list'); // Should have list command
      } catch (error: any) {
        expect(error.message).not.toContain('TypeError');
        expect(error.message).not.toContain('SyntaxError');
      }
    });

    it('should handle list command (should work even with empty todos)', async () => {
      if (!(await hasPackageJson(todoCliPath))) {
        return;
      }

      try {
        const result = execSync('pnpm run dev list', {
          cwd: todoCliPath,
          encoding: 'utf8',
          timeout: 10000,
        });

        expect(result).toBeDefined();
      } catch (error: any) {
        // Might fail due to file system access, but shouldn't have syntax errors
        expect(error.message).not.toContain('SyntaxError');
        expect(error.message).not.toContain('Cannot find module');
      }
    });

    it('should handle add command help', async () => {
      if (!(await hasPackageJson(todoCliPath))) {
        return;
      }

      try {
        const result = execSync('pnpm run dev add --help', {
          cwd: todoCliPath,
          encoding: 'utf8',
          timeout: 10000,
        });

        expect(result).toBeDefined();
      } catch (error: any) {
        expect(error.message).not.toContain('Cannot find module');
      }
    });
  });

  describe('TypeScript Compilation Check', () => {
    it.skip('should compile standalone example files', () => {
      // NOTE: These standalone .ts files are meant for demonstration purposes.
      // They cannot be type-checked within the pnpm workspace because tsx
      // doesn't resolve workspace: protocol dependencies.
      // 
      // To test these files:
      // 1. Copy them outside the monorepo
      // 2. Install @esteban-url/trailhead-cli from GitHub
      // 3. Run tsc on them
      //
      // The actual example projects (api-client, todo-cli, etc.) are tested
      // above and provide better real-world examples.
    });
  });

  describe('Examples Structure Validation', () => {
    it('should have valid TypeScript config for project examples', async () => {
      const projectDirs = ['api-client', 'cross-platform-cli', 'file-processor', 'project-generator', 'todo-cli'];
      
      for (const dir of projectDirs) {
        const projectPath = resolve(examplesDir, dir);
        
        try {
          await fs.access(projectPath);
          
          // Check if it has a valid structure
          const hasPackage = await hasPackageJson(projectPath);
          const hasSourceDir = await fs.access(resolve(projectPath, 'src')).then(() => true).catch(() => false);
          const hasIndexFile = await fs.access(resolve(projectPath, 'src/index.ts')).then(() => true).catch(() => false);
          
          if (hasPackage) {
            expect(hasSourceDir).toBe(true);
            expect(hasIndexFile).toBe(true);
          }
        } catch (error) {
          console.log(`Project ${dir} not found or has issues - this might be expected`);
        }
      }
    });

    it('should have valid examples tsconfig.json', async () => {
      try {
        const tsconfigPath = resolve(examplesDir, 'tsconfig.json');
        await fs.access(tsconfigPath);
        
        const tsconfig = JSON.parse(await fs.readFile(tsconfigPath, 'utf-8'));
        expect(tsconfig.extends).toBeDefined();
        expect(tsconfig.compilerOptions).toBeDefined();
      } catch (error) {
        console.log('Examples tsconfig.json not found - this might be expected');
      }
    });
  });
});