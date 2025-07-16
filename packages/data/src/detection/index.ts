export { createDetectionOperations } from './core.js'
export { defaultDetectionConfig } from './types.js'
export { FORMAT_DATABASE } from './database.js'
export type {
  MagicNumberPattern,
  ExtensionMapping,
  FormatDatabase,
  CreateDetectionOperations,
  DetectionStrategy,
  MagicNumberDetector,
  ExtensionDetector,
} from './types.js'

// Re-export main types from formats types
export type { DetectionOperations } from '../formats-types.js'
