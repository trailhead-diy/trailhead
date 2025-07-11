// Delegate to @trailhead/config domain package
export * from '@trailhead/config/core';

// Keep CLI-specific templates
export {
  configTemplates,
  getTemplate,
  getTemplateNames,
  hasTemplate,
  dataProcessingTemplate,
  cliAppTemplate,
  fileWatcherTemplate,
  apiClientTemplate,
  buildToolTemplate,
  testRunnerTemplate,
} from './templates.js';

export type {
  ConfigTemplate,
  DataProcessingConfig,
  CliAppConfig,
  FileWatcherConfig,
  ApiClientConfig,
  BuildToolConfig,
  TestRunnerConfig,
} from './templates.js';

// Re-export z from zod for convenience
export { z } from 'zod';
