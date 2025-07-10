/**
 * Streaming support for large file processing with memory efficiency
 *
 * This module provides utilities for:
 * - Creating read/write streams with error handling
 * - Transform streams for data processing
 * - Specialized streams for CSV, JSON Lines, and other formats
 * - Stream pipeline management
 * - Memory-efficient batch processing
 */

// Types
export type {
  StreamOptions,
  ReadStreamOptions,
  WriteStreamOptions,
  TransformStreamOptions,
  StreamTransformer,
  StreamFilter,
  StreamMapper,
  StreamPipelineOptions,
  StreamProcessingResult,
  BatchProcessingOptions,
  StreamFactory,
  StreamStats,
} from './types.js';

// Core streaming utilities
export {
  createReadStream,
  createWriteStream,
  createTransformStream,
  createFilterStream,
  createMapStream,
  createBatchStream,
  createStatsStream,
  pipeline,
  streamToBuffer,
  streamToString,
} from './core.js';

// Data-specific streams
export type { CSVStreamOptions, JSONLStreamOptions, LineStreamOptions } from './data-streams.js';

export {
  createCSVParseStream,
  createCSVStringifyStream,
  createJSONLParseStream,
  createJSONLStringifyStream,
  createLineStream,
  createChunkStream,
} from './data-streams.js';

// Import functions for the convenience object
import {
  createReadStream,
  createWriteStream,
  createTransformStream,
  createFilterStream,
  createMapStream,
  createBatchStream,
  createStatsStream,
  pipeline,
  streamToBuffer,
  streamToString,
} from './core.js';

import {
  createCSVParseStream,
  createCSVStringifyStream,
  createJSONLParseStream,
  createJSONLStringifyStream,
  createLineStream,
  createChunkStream,
} from './data-streams.js';

// Convenience object for cleaner imports
export const streamUtils = {
  // Core
  createReadStream,
  createWriteStream,
  createTransformStream,
  createFilterStream,
  createMapStream,
  createBatchStream,
  createStatsStream,
  pipeline,
  streamToBuffer,
  streamToString,

  // Data streams
  createCSVParseStream,
  createCSVStringifyStream,
  createJSONLParseStream,
  createJSONLStringifyStream,
  createLineStream,
  createChunkStream,
} as const;
