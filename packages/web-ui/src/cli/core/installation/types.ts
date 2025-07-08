/**
 * Domain types and interfaces for Trailhead UI install script
 */

// Import FrameworkType from framework-detection module and re-export it
import type { FrameworkType } from './framework-detection.js';
export type { FrameworkType };

// Import CLI framework types for error handling
import type { Result, CLIError } from '@esteban-url/trailhead-cli/core';
export type { Result, CLIError as InstallError };

// ============================================================================
// CORE DOMAIN TYPES
// ============================================================================

// Helper type for file filtering predicates
// Generic type allows filtering arrays of any type, not just strings
export type FileFilterPredicate<T = string> = (file: T) => boolean;

export interface InstallConfig {
  readonly catalystDir: string;
  readonly destinationDir: string;
  readonly componentsDir: string;
  readonly libDir: string;
  readonly projectRoot: string;
}

export interface CatalystHashData {
  readonly version: string;
  readonly files: Record<string, string>;
}

export interface VerificationResult {
  readonly isValid: boolean;
  readonly mismatches: readonly FileMismatch[];
  readonly missing: readonly string[];
  readonly extra: readonly string[];
}

export interface FileMismatch {
  readonly fileName: string;
  readonly expectedHash: string;
  readonly actualHash: string;
}

export interface DependencyUpdate {
  readonly added: Record<string, string>;
  readonly existing: Record<string, string>;
  readonly needsInstall: boolean;
}

export interface InstallationSummary {
  readonly filesInstalled: readonly string[];
  readonly dependenciesAdded: readonly string[];
  readonly conversionsApplied: boolean;
  readonly configCreated: boolean;
}

// Re-export Ok and Err from CLI package for compatibility
export { Ok, Err } from '@esteban-url/trailhead-cli/core';

// ============================================================================
// CLI OPTIONS AND FLAGS
// ============================================================================

export interface CLIOptions {
  readonly catalystDir?: string;
  readonly destinationDir?: string;
  readonly skipVerify?: boolean;
  readonly force?: boolean;
  readonly dryRun?: boolean;
  readonly verbose?: boolean;
  readonly help?: boolean;
  readonly framework?: string;
  readonly noConfig?: boolean;
  readonly overwrite?: boolean;
}

// ============================================================================
// DEPENDENCY INJECTION INTERFACES
// ============================================================================

// Re-export FileSystem from CLI package for compatibility
export type { FileSystem } from '@esteban-url/trailhead-cli/filesystem';

export interface ProcessRunner {
  execSync(command: string, options?: ExecOptions): Promise<Result<string, CLIError>>;
  isCommandAvailable(command: string): Promise<Result<boolean, CLIError>>;
  cwd(): string;
}

// Import Logger from framework
export type { Logger } from '@esteban-url/trailhead-cli/core';

export interface Hasher {
  calculateFileHash(filePath: string): Promise<Result<string, CLIError>>;
  calculateStringHash(content: string): string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface FileStats {
  readonly mtime: Date;
  readonly size?: number;
  readonly isDirectory: boolean;
}

export interface CopyOptions {
  readonly overwrite?: boolean;
  readonly filter?: (src: string) => boolean;
}

export interface WriteOptions {
  readonly spaces?: number;
}

export interface ExecOptions {
  readonly cwd?: string;
  readonly stdio?: 'inherit' | 'pipe';
}

// ============================================================================
// CONFIGURATION FILE TYPES
// ============================================================================

export interface InstallationTrailheadConfig {
  readonly catalystDir: string;
  readonly destinationDir: string;
  readonly componentsDir: string;
  readonly libDir: string;
}

export interface PackageJsonDeps {
  readonly dependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

// Import validation utilities from CLI framework instead of duplicating
export { string, object } from '@esteban-url/trailhead-cli/core';

// ============================================================================
// REQUIRED DEPENDENCIES CONSTANTS
// ============================================================================

// Core dependencies required by all frameworks
export const CORE_DEPENDENCIES = {
  '@headlessui/react': '^2.2.0',
  '@heroicons/react': '^2.0.0',
  'framer-motion': '^11.2.6',
  clsx: '^2.1.1',
  culori: '^4.0.1',
  'tailwind-merge': '^3.3.0',
  'next-themes': '^0.4.6',
  tailwindcss: '^4.0.0',
} as const;

// Framework-specific dependencies
export const FRAMEWORK_DEPENDENCIES = {
  vite: {
    '@tailwindcss/vite': '^4.0.0',
  },
  'redwood-sdk': {
    '@tailwindcss/vite': '^4.0.0',
  },
  nextjs: {},
  'generic-react': {},
} as const;

// Legacy constant for backward compatibility (includes all dependencies)
export const REQUIRED_DEPENDENCIES = {
  ...CORE_DEPENDENCIES,
  '@tailwindcss/vite': '^4.0.0',
} as const;

export const CATALYST_VERSION = '2025-06-05' as const;

export const CATALYST_COMPONENT_FILES = [
  'alert.tsx',
  'auth-layout.tsx',
  'avatar.tsx',
  'badge.tsx',
  'button.tsx',
  'checkbox.tsx',
  'combobox.tsx',
  'description-list.tsx',
  'dialog.tsx',
  'divider.tsx',
  'dropdown.tsx',
  'fieldset.tsx',
  'heading.tsx',
  'input.tsx',
  'link.tsx',
  'listbox.tsx',
  'navbar.tsx',
  'pagination.tsx',
  'radio.tsx',
  'select.tsx',
  'sidebar-layout.tsx',
  'sidebar.tsx',
  'stacked-layout.tsx',
  'switch.tsx',
  'table.tsx',
  'text.tsx',
  'textarea.tsx',
] as const;
