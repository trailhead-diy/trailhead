// Pure delegation to @trailhead/streams domain package
export * from '@trailhead/streams';

// Re-export for backward compatibility with stubs
// TODO: Replace with actual domain package functions when available

// Compatibility layer - stubs for now
export const createReadStream = (data: any[]) => data;
export const createWriteStream = (_stream: any) => [];
export const createTransformStream = (fn: any) => fn;
export const createFilterStream = (fn: any) => fn;
export const createMapStream = (fn: any) => fn;
export const createBatchStream = (_size: number) => (data: any) => data;
export const createStatsStream = () => (item: any) => item;
export const pipeline = () => Promise.resolve();
export const streamToBuffer = () => Promise.resolve(Buffer.alloc(0));
export const streamToString = () => Promise.resolve('');
export const createCSVParseStream = (fn: any) => fn;
export const createCSVStringifyStream = (fn: any) => fn;
export const createJSONLParseStream = (fn: any) => fn;
export const createJSONLStringifyStream = (fn: any) => fn;
export const createLineStream = (fn: any) => fn;
export const createChunkStream = (_size: number) => (data: any) => data;

// Convenience object for cleaner imports (backward compatibility)
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
