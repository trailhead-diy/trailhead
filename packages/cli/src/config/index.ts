// Pure delegation to @trailhead/config domain package
export * from '@trailhead/config';

// Re-export for backward compatibility
import { createConfigOperations as createConfig } from '@trailhead/config';
export { createConfig };

// Re-export z from zod for convenience
export { z } from 'zod';

// Backward compatibility aliases
export type { ConfigResult as ConfigLoadResult } from '@trailhead/config';
