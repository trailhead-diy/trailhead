// New simplified configuration API
export { createConfig } from './config.js';
export type { CreateConfigOptions, ConfigLoader, ConfigLoadResult } from './types.js';

// Re-export z from zod for convenience
export { z } from 'zod';
