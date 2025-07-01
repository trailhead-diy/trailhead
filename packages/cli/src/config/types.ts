import type { z } from 'zod';

export interface ConfigSchema<T = any> {
  schema: z.ZodSchema<T>;
  load: (options?: LoadOptions) => Promise<Result<T>>;
}

export interface LoadOptions {
  searchFrom?: string;
  name?: string;
}

import type { Result } from '../core/errors/index.js';
