// New simplified configuration API
export { createConfig } from './config.js';
export type { CreateConfigOptions, ConfigLoader, ConfigLoadResult } from './types.js';

// Configuration templates
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
