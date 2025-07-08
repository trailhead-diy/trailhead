import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import fg from 'fast-glob';
import { validateTemplatePath } from './validation.js';
import type { TemplateVariant, TemplateFile, TemplateLoaderConfig } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load and discover template files for a specific template variant
 *
 * Scans both variant-specific and shared template directories to build
 * a complete list of files needed for project generation. Combines
 * templates from both sources with proper precedence and metadata.
 *
 * @param variant - Template variant identifier ('basic', 'advanced')
 * @param config - Optional configuration for custom template paths
 * @returns Promise resolving to array of template file metadata objects
 *
 * @example
 * ```typescript
 * // Using default built-in templates
 * const files = await getTemplateFiles('advanced')
 *
 * // Using custom template directories
 * const customFiles = await getTemplateFiles('basic', {
 *   templatesDir: '/custom/templates',
 *   variantDirs: {
 *     basic: '/custom/templates/minimal'
 *   },
 *   additionalDirs: ['/extra/templates']
 * })
 *
 * console.log(`Found ${files.length} template files`)
 * files.forEach(file => {
 *   console.log(`${file.source} -> ${file.destination}`)
 *   if (file.isTemplate) console.log('  (will be processed with Handlebars)')
 *   if (file.executable) console.log('  (will be made executable)')
 * })
 * ```
 *
 * File discovery process:
 * 1. Determine template directories (built-in or custom)
 * 2. Load variant-specific files from variant directory
 * 3. Load shared files from shared directory
 * 4. Load files from additional directories if specified
 * 5. Combine all sets with variant files taking precedence
 * 6. Process file metadata (template detection, executable flags, path mapping)
 *
 * @see {@link loadTemplateFilesFromDirectory} for directory scanning logic
 * @see {@link TemplateFile} for file metadata structure
 * @see {@link TemplateLoaderConfig} for configuration options
 */
export async function getTemplateFiles(
  variant: TemplateVariant,
  config?: TemplateLoaderConfig
): Promise<TemplateFile[]> {
  const { paths, dirs } = resolveTemplatePaths(variant, config);

  const files: TemplateFile[] = [];

  // Load variant-specific files
  const variantFiles = await loadTemplateFilesFromDirectory(
    dirs.variant,
    variant,
    paths.base // Pass base templates directory for security validation
  );
  files.push(...variantFiles);

  // Load shared files
  const sharedFiles = await loadTemplateFilesFromDirectory(
    dirs.shared,
    'shared',
    paths.base // Pass base templates directory for security validation
  );
  files.push(...sharedFiles);

  // Load additional files if configured
  if (config?.additionalDirs) {
    for (const additionalDir of config.additionalDirs) {
      const additionalFiles = await loadTemplateFilesFromDirectory(
        additionalDir,
        'additional',
        paths.base // Pass base templates directory for security validation
      );
      files.push(...additionalFiles);
    }
  }

  // Filter files based on template variant
  const filteredFiles = files.filter(file => {
    const isMonorepo = false; // No monorepo support in simplified CLI generator

    // Skip monorepo-specific files for non-monorepo templates
    if (!isMonorepo) {
      const monorepoOnlyFiles = [
        'pnpm-workspace.yaml',
        'turbo.json',
        'package.root.json',
        '.changeset/config.json',
      ];

      if (monorepoOnlyFiles.some(filename => file.destination === filename)) {
        return false;
      }
    }

    return true;
  });

  return filteredFiles;
}

/**
 * Resolve template directory paths based on configuration
 *
 * Determines the actual filesystem paths to use for template loading,
 * supporting both built-in templates and custom template directories.
 *
 * @param variant - Template variant to load
 * @param config - Optional loader configuration with custom paths
 * @returns Object containing resolved paths and directory mappings
 *
 * @internal
 *
 * Resolution priority:
 * 1. Custom variant directories from config.variantDirs
 * 2. Custom base directory from config.templatesDir
 * 3. Built-in template directories (default)
 *
 * @example
 * ```typescript
 * const { paths, dirs } = resolveTemplatePaths('advanced', {
 *   templatesDir: '/custom/templates',
 *   variantDirs: { advanced: '/special/advanced' }
 * })
 * // dirs.variant will be '/special/advanced'
 * // dirs.shared will be '/custom/templates/shared'
 * ```
 */
export function resolveTemplatePaths(variant: TemplateVariant, config?: TemplateLoaderConfig) {
  // Default built-in template directory
  // When running from dist/lib, templates are at ../templates
  // When running tests from src/lib, we need to check multiple locations
  const candidatePaths = [
    resolve(__dirname, '../templates'), // dist/lib -> dist/templates
    resolve(__dirname, '../../templates'), // src/lib -> templates (during tests)
    resolve(__dirname, '../../dist/templates'), // src/lib -> dist/templates (during tests)
  ];

  // Find the first path that exists
  const defaultTemplatesDir = candidatePaths.find(path => existsSync(path)) || candidatePaths[0];

  // Use custom base directory if provided, otherwise use built-in
  const baseTemplatesDir = config?.templatesDir || defaultTemplatesDir;

  // Resolve variant directory
  const variantDir = config?.variantDirs?.[variant] || join(baseTemplatesDir, variant);

  // Resolve shared directory
  const sharedDir = config?.sharedDir || join(baseTemplatesDir, 'shared');

  return {
    paths: {
      base: baseTemplatesDir,
      default: defaultTemplatesDir,
    },
    dirs: {
      variant: variantDir,
      shared: sharedDir,
    },
  };
}

/**
 * Load template files from a specific directory with metadata processing
 *
 * Uses fast-glob to efficiently scan directory trees and extract file
 * metadata including template detection, executable flags, and path mapping.
 * Handles directory-not-found gracefully by returning empty arrays.
 *
 * @param dir - Absolute path to directory to scan
 * @param prefix - Prefix to use for source path identification in metadata
 * @returns Promise resolving to array of template file metadata
 *
 * @internal
 *
 * Processing steps:
 * 1. Scan directory with fast-glob for all files (including dotfiles)
 * 2. Convert absolute paths to relative paths within directory
 * 3. Generate metadata for each file:
 *    - Source path with prefix
 *    - Destination path (processed for special cases)
 *    - Template flag (.hbs extension detection)
 *    - Executable flag (path-based detection)
 *
 * Special file handling:
 * - `.hbs` files are marked as templates and extension is removed from destination
 * - Files in `bin/`, `scripts/`, `.husky/` are marked as executable
 * - Files starting with `_` are converted to dotfiles (e.g., `_gitignore` → `.gitignore`)
 * - `DOT_` prefix is converted to `.` (e.g., `DOT_env` → `.env`)
 *
 * @see {@link processDestinationPath} for path transformation logic
 * @see {@link isTemplateFile} for template detection logic
 * @see {@link isExecutableFile} for executable detection logic
 */
async function loadTemplateFilesFromDirectory(
  dir: string,
  prefix: string,
  baseTemplatesDir?: string
): Promise<TemplateFile[]> {
  try {
    // Only validate if baseTemplatesDir is provided
    if (baseTemplatesDir) {
      const dirValidation = validateTemplatePath(dir, baseTemplatesDir);
      if (!dirValidation.success) {
        console.warn(`Skipping invalid template directory: ${dir}`);
        return [];
      }
    }

    const pattern = join(dir, '**/*');
    const filePaths = await fg(pattern, {
      dot: true,
      onlyFiles: true,
      followSymbolicLinks: false,
      absolute: true, // Use absolute paths for security
    });

    return filePaths
      .map(filePath => {
        // Validate each file path if baseTemplatesDir is provided
        if (baseTemplatesDir) {
          const fileValidation = validateTemplatePath(filePath, baseTemplatesDir);
          if (!fileValidation.success) {
            console.warn(`Skipping invalid template file: ${filePath}`);
            return null;
          }
        }

        const relativePath = filePath.replace(dir + '/', '');

        // Additional validation of relative path
        if (relativePath.includes('..') || relativePath.startsWith('/')) {
          console.warn(`Skipping suspicious template file: ${relativePath}`);
          return null;
        }

        const executableValue = isExecutableFile(filePath);
        const templateFile: TemplateFile = {
          source: `${prefix}/${relativePath}`,
          destination: processDestinationPath(relativePath),
          isTemplate: isTemplateFile(filePath),
          executable: executableValue, // Always set executable property
        };

        return templateFile;
      })
      .filter((file): file is NonNullable<typeof file> => file !== null);
  } catch {
    // Directory doesn't exist, return empty array
    return [];
  }
}

/**
 * Process destination path (remove .hbs extension, handle special cases)
 */
function processDestinationPath(relativePath: string): string {
  let destination = relativePath;

  // Remove .hbs extension from template files
  if (destination.endsWith('.hbs')) {
    destination = destination.slice(0, -4);
  }

  // Handle special filename replacements
  destination = destination.replace(/^_/, '.'); // _gitignore -> .gitignore
  destination = destination.replace(/DOT_/, '.'); // DOT_env -> .env

  return destination;
}

/**
 * Check if file is a Handlebars template
 */
function isTemplateFile(filePath: string): boolean {
  return filePath.endsWith('.hbs');
}

/**
 * Check if file should be executable
 */
function isExecutableFile(filePath: string): boolean {
  const executablePaths = ['bin/', 'scripts/', '.husky/'];

  return (
    executablePaths.some(path => filePath.includes(path)) ||
    filePath.endsWith('.sh') ||
    filePath.includes('lefthook')
  );
}
