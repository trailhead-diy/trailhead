import { cosmiconfig } from 'cosmiconfig';
import type { z } from 'zod';
import { Ok, Err } from '../core/errors/index.js';
import type { Result } from '../core/errors/index.js';
import type { ConfigSchema, LoadOptions } from './types.js';

export function defineConfig<T>(schema: z.ZodSchema<T>): ConfigSchema<T> {
  return {
    schema,
    async load(options: LoadOptions = {}): Promise<Result<T>> {
      const explorer = cosmiconfig(options.name ?? 'config', {
        searchPlaces: [
          'package.json',
          `.${options.name ?? 'config'}rc`,
          `.${options.name ?? 'config'}rc.json`,
          `.${options.name ?? 'config'}rc.js`,
          `.${options.name ?? 'config'}rc.ts`,
          `.${options.name ?? 'config'}rc.mjs`,
          `.${options.name ?? 'config'}rc.cjs`,
          `${options.name ?? 'config'}.config.js`,
          `${options.name ?? 'config'}.config.ts`,
          `${options.name ?? 'config'}.config.mjs`,
          `${options.name ?? 'config'}.config.cjs`,
        ],
      });

      try {
        const result = await explorer.search(options.searchFrom);
        if (!result) {
          // No config found, use schema defaults
          const parsed = schema.safeParse({});
          if (!parsed.success) {
            return Err({
              code: 'CONFIG_VALIDATION_ERROR',
              message: 'Invalid default configuration',
              recoverable: false,
            });
          }
          return Ok(parsed.data);
        }

        const parsed = schema.safeParse(result.config);
        if (!parsed.success) {
          return Err({
            code: 'CONFIG_VALIDATION_ERROR',
            message: `Invalid configuration in ${result.filepath}: ${parsed.error.message}`,
            recoverable: false,
          });
        }

        return Ok(parsed.data);
      } catch (error) {
        return Err({
          code: 'CONFIG_LOAD_ERROR',
          message: `Failed to load configuration: ${(error as Error).message}`,
          recoverable: false,
        });
      }
    },
  };
}

export async function loadConfig<T>(
  schema: z.ZodSchema<T>,
  options: LoadOptions = {},
): Promise<Result<T>> {
  const config = defineConfig(schema);
  return config.load(options);
}
