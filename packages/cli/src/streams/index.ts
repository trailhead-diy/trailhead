// Delegate to @trailhead/streams domain package
export * from '@trailhead/streams/readable';
export * from '@trailhead/streams/writable';
export * from '@trailhead/streams/transform';
export * from '@trailhead/streams/duplex';

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
