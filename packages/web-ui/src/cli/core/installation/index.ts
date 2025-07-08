/**
 * Installation module exports
 */

// Re-export types
export * from './types.js';

// Re-export orchestrator functions
export {
  performInstallation,
  performDryRunInstallation,
  type InstallOptions,
} from './orchestrator.js';

// Re-export theme installer functions
export { installThemeSystem, installThemeComponents } from './theme-installer.js';

// Re-export component installer functions
export {
  installCatalystComponents,
  installComponentWrappers,
  installUtilityFiles,
} from './component-installer.js';
