import { ok, err } from '@trailhead/core';
import type {
  StreamResult,
  StreamOperations,
  DataStreamingOperations,
  CreateDataStreamingOperations,
  StreamingConfig,
} from './types.js';
import {
  getStreamOperations,
  isStreamingEnabled,
  createStreamingNotAvailableError,
  createStreamOpsUnavailableError,
} from './utils.js';
import { createCSVStreamingOperations } from './csv-streaming.js';
import { createJSONStreamingOperations } from './json-streaming.js';
import { createExcelStreamingOperations } from './excel-streaming.js';

// ========================================
// Streaming Operations Exports
// ========================================

export type {
  // Core streaming types
  StreamResult,
  StreamingConfig,
  StreamingCSVConfig,
  StreamingJSONConfig,
  StreamingExcelConfig,
  StreamOperations,

  // Operation interfaces
  CSVStreamingOperations,
  JSONStreamingOperations,
  ExcelStreamingOperations,
  DataStreamingOperations,

  // Factory types
  CreateCSVStreamingOperations,
  CreateJSONStreamingOperations,
  CreateExcelStreamingOperations,
  CreateDataStreamingOperations,

  // Progress and metrics
  StreamProgress,
  StreamMetrics,
  StreamEventHandlers,
} from './types.js';

export {
  // Utility functions
  checkStreamAvailability,
  getStreamOperations,
  isStreamingEnabled,
  defaultStreamingConfig,
  createProgressTracker,
} from './utils.js';

export {
  // Individual streaming operation factories
  createCSVStreamingOperations,
} from './csv-streaming.js';

export { createJSONStreamingOperations } from './json-streaming.js';

export { createExcelStreamingOperations } from './excel-streaming.js';

// ========================================
// Main Data Streaming Factory
// ========================================

export const createDataStreamingOperations: CreateDataStreamingOperations = async (
  providedStreamOps?: StreamOperations,
  config?: StreamingConfig
) => {
  try {
    // Check if streaming is enabled and available
    if (!isStreamingEnabled(config)) {
      return err(
        createStreamingNotAvailableError({
          enabled: config?.enabled,
          availabilityChecked: true,
        })
      );
    }

    // Get stream operations (either provided or auto-detected)
    const streamOps = providedStreamOps || (await getStreamOperations());
    if (!streamOps) {
      return err(createStreamOpsUnavailableError());
    }

    // Create individual streaming operations
    const csvStreamingOps = createCSVStreamingOperations(streamOps, config);
    const jsonStreamingOps = createJSONStreamingOperations(streamOps, config);
    const excelStreamingOps = createExcelStreamingOperations(streamOps, config);

    const dataStreamingOperations: DataStreamingOperations = {
      csv: csvStreamingOps,
      json: jsonStreamingOps,
      excel: excelStreamingOps,
      stream: streamOps,
    };

    return ok(dataStreamingOperations);
  } catch (error) {
    return err(createStreamOpsUnavailableError({ originalError: error }));
  }
};

// ========================================
// Convenience Factory Functions
// ========================================

export const createCSVStreaming = async (
  config?: StreamingConfig
): Promise<StreamResult<import('./types.js').CSVStreamingOperations>> => {
  const streamOps = await getStreamOperations();
  if (!streamOps) {
    return err(
      createStreamOpsUnavailableError({
        message: 'CSV streaming requires @trailhead/streams to be installed',
      })
    );
  }
  return ok(createCSVStreamingOperations(streamOps, config));
};

export const createJSONStreaming = async (
  config?: StreamingConfig
): Promise<StreamResult<import('./types.js').JSONStreamingOperations>> => {
  const streamOps = await getStreamOperations();
  if (!streamOps) {
    return err(
      createStreamOpsUnavailableError({
        message: 'JSON streaming requires @trailhead/streams to be installed',
      })
    );
  }
  return ok(createJSONStreamingOperations(streamOps, config));
};

export const createExcelStreaming = async (
  config?: StreamingConfig
): Promise<StreamResult<import('./types.js').ExcelStreamingOperations>> => {
  const streamOps = await getStreamOperations();
  if (!streamOps) {
    return err(
      createStreamOpsUnavailableError({
        message: 'Excel streaming requires @trailhead/streams to be installed',
      })
    );
  }
  return ok(createExcelStreamingOperations(streamOps, config));
};
