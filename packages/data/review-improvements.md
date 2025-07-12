# @trailhead/data Package - Review Improvements

**Current Compliance Score**: 9.5/10  
**Target Score**: 9.8/10  
**Priority**: Low-Medium (Performance and Modern Features)

## High Priority Improvements

### 1. Streaming Support for Large Datasets (High)

**Why Important**: Current implementation loads entire files into memory, which fails for large datasets and impacts CLI performance.

**Implementation Guidelines**:

```typescript
// Streaming CSV operations
export const createStreamingCSVOperations = (config = {}) => ({
  parseStream: (inputStream: ReadableStream<string>) => {
    return new TransformStream({
      start(controller) {
        this.parser = Papa.parse(Papa.NODE_STREAM_INPUT, {
          ...config,
          step: (results, parser) => {
            if (results.errors.length > 0) {
              controller.error(
                createDataError({
                  subtype: 'PARSE_ERROR',
                  message: 'CSV parsing error in stream',
                  context: { errors: results.errors },
                })
              );
              return;
            }
            controller.enqueue(results.data);
          },
        });
      },

      transform(chunk, controller) {
        this.parser.parse(chunk);
      },

      flush(controller) {
        this.parser.parse(Papa.STREAM_EOF);
        controller.terminate();
      },
    });
  },

  // Process large files in chunks
  async processLargeFile<T>(
    filePath: string,
    processor: (batch: T[], batchIndex: number) => Promise<DataResult<void>>,
    options: StreamingOptions = {}
  ): Promise<DataResult<ProcessingSummary>> {
    const batchSize = options.batchSize || 1000;
    const fileStream = fs.createReadStream(filePath);
    const csvStream = this.parseStream(fileStream);

    let batch: T[] = [];
    let batchIndex = 0;
    let totalRows = 0;
    let errors: DataError[] = [];

    try {
      for await (const row of csvStream) {
        batch.push(row as T);
        totalRows++;

        if (batch.length >= batchSize) {
          const result = await processor(batch, batchIndex++);
          if (result.isErr()) {
            errors.push(result.error);
            if (options.failFast) {
              return err(result.error);
            }
          }

          batch = [];

          // Report progress
          options.onProgress?.(totalRows, batchIndex);
        }
      }

      // Process remaining rows
      if (batch.length > 0) {
        const result = await processor(batch, batchIndex);
        if (result.isErr()) {
          errors.push(result.error);
        }
      }

      return ok({
        totalRows,
        batchesProcessed: batchIndex + (batch.length > 0 ? 1 : 0),
        errors: errors.length,
        successful: errors.length === 0,
      });
    } catch (error) {
      return err(
        createDataError({
          subtype: 'STREAMING_FAILED',
          message: `Streaming operation failed: ${error.message}`,
          cause: error,
        })
      );
    }
  },
});

// Streaming Excel operations
export const createStreamingExcelOperations = (config = {}) => ({
  async *readWorksheetStream(
    filePath: string,
    sheetName?: string
  ): AsyncGenerator<ExcelRow, void, undefined> {
    const workbook = new ExcelJS.stream.xlsx.WorkbookReader(filePath);

    for await (const worksheet of workbook) {
      if (sheetName && worksheet.name !== sheetName) continue;

      for await (const row of worksheet) {
        yield {
          rowNumber: row.number,
          values: row.values,
          cellCount: row.cellCount,
        };
      }

      if (sheetName) break; // Only process specified sheet
    }
  },

  // Write large datasets to Excel incrementally
  async writeStreamToExcel<T>(
    data: AsyncIterable<T>,
    filePath: string,
    options: ExcelStreamOptions = {}
  ): Promise<DataResult<ExcelWriteSummary>> {
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
      filename: filePath,
      useStyles: options.useStyles || false,
    });

    const worksheet = workbook.addWorksheet(options.sheetName || 'Sheet1');

    let rowCount = 0;
    try {
      // Add headers if provided
      if (options.headers) {
        worksheet.addRow(options.headers);
        rowCount++;
      }

      // Stream data rows
      for await (const item of data) {
        const row = options.rowMapper ? options.rowMapper(item) : Object.values(item);
        worksheet.addRow(row);
        rowCount++;

        // Commit periodically to manage memory
        if (rowCount % 1000 === 0) {
          await worksheet.commit();
          options.onProgress?.(rowCount);
        }
      }

      await workbook.commit();

      return ok({
        filePath,
        rowsWritten: rowCount,
        fileSize: await fs.stat(filePath).then(s => s.size),
      });
    } catch (error) {
      return err(
        createDataError({
          subtype: 'EXCEL_WRITE_FAILED',
          message: `Excel streaming write failed: ${error.message}`,
          cause: error,
        })
      );
    }
  },
});
```

**Implementation Steps**:

1. Implement streaming CSV parser using Transform streams
2. Add batch processing utilities for large datasets
3. Create streaming Excel reader/writer using ExcelJS streams
4. Add progress reporting and cancellation support
5. Implement memory-efficient JSON streaming for large arrays

**Expected Outcome**: Handle files 100x+ larger, reduce memory usage by 90%+, better CLI responsiveness

### 2. Worker Thread Support for CPU-Intensive Operations (Medium)

**Why Important**: Data transformations can block the main thread, making CLI unresponsive for large operations.

**Implementation Guidelines**:

```typescript
// Worker thread data processing
export const createWorkerDataProcessor = () => ({
  async processInWorker<T, R>(
    data: T[],
    processingScript: string,
    options: WorkerOptions = {}
  ): Promise<DataResult<R[]>> {
    const workerCount = options.workerCount || os.cpus().length;
    const chunkSize = Math.ceil(data.length / workerCount);

    const workers: Worker[] = [];
    const promises: Promise<DataResult<R[]>>[] = [];

    try {
      // Create workers and distribute work
      for (let i = 0; i < workerCount; i++) {
        const startIndex = i * chunkSize;
        const endIndex = Math.min(startIndex + chunkSize, data.length);
        const chunk = data.slice(startIndex, endIndex);

        if (chunk.length === 0) continue;

        const worker = new Worker(processingScript);
        workers.push(worker);

        const promise = new Promise<DataResult<R[]>>(resolve => {
          worker.postMessage({ chunk, options: options.processingOptions });

          worker.on('message', result => {
            resolve(ok(result));
          });

          worker.on('error', error => {
            resolve(
              err(
                createDataError({
                  subtype: 'WORKER_PROCESSING_FAILED',
                  message: `Worker processing failed: ${error.message}`,
                  cause: error,
                })
              )
            );
          });
        });

        promises.push(promise);
      }

      // Wait for all workers to complete
      const results = await Promise.all(promises);

      // Combine results
      const allResults: R[] = [];
      const errors: DataError[] = [];

      for (const result of results) {
        if (result.isErr()) {
          errors.push(result.error);
        } else {
          allResults.push(...result.value);
        }
      }

      if (errors.length > 0) {
        return err(
          createDataError({
            subtype: 'WORKER_PROCESSING_PARTIAL_FAILURE',
            message: `${errors.length} workers failed`,
            context: { errors },
          })
        );
      }

      return ok(allResults);
    } finally {
      // Clean up workers
      workers.forEach(worker => worker.terminate());
    }
  },

  // Pre-built worker scripts for common operations
  getTransformWorkerScript: () => `
    const { parentPort } = require('worker_threads');
    
    parentPort.on('message', ({ chunk, options }) => {
      try {
        const results = chunk.map(item => {
          // Apply transformation function
          return options.transform(item);
        });
        parentPort.postMessage(results);
      } catch (error) {
        parentPort.postMessage({ error: error.message });
      }
    });
  `,

  getValidationWorkerScript: () => `
    const { parentPort } = require('worker_threads');
    
    parentPort.on('message', ({ chunk, options }) => {
      try {
        const results = chunk.filter(item => {
          return options.validator(item);
        });
        parentPort.postMessage(results);
      } catch (error) {
        parentPort.postMessage({ error: error.message });
      }
    });
  `,
});

// High-performance data transformations
export const createHighPerformanceTransforms = () => ({
  // Parallel data transformation
  async transformParallel<T, R>(
    data: T[],
    transformer: (item: T) => R,
    options: ParallelOptions = {}
  ): Promise<DataResult<R[]>> {
    if (data.length < (options.threshold || 10000)) {
      // Use single-threaded for small datasets
      return ok(data.map(transformer));
    }

    // Use worker threads for large datasets
    const workerScript = this.createTransformWorker(transformer);
    return this.processInWorker(data, workerScript, options);
  },

  // Memory-efficient aggregations
  async aggregateStream<T, R>(
    dataStream: AsyncIterable<T>,
    aggregator: (accumulator: R, item: T) => R,
    initialValue: R
  ): Promise<DataResult<R>> {
    let result = initialValue;

    try {
      for await (const item of dataStream) {
        result = aggregator(result, item);
      }
      return ok(result);
    } catch (error) {
      return err(
        createDataError({
          subtype: 'AGGREGATION_FAILED',
          message: `Stream aggregation failed: ${error.message}`,
          cause: error,
        })
      );
    }
  },
});
```

### 3. Schema Validation Integration (Medium)

**Why Important**: Data processing often needs validation, but currently requires separate validation package usage.

**Implementation Guidelines**:

```typescript
// Data schema validation integration
export const createValidatedDataOperations = <T>(schema: DataSchema<T>) => ({
  async parseAndValidateCSV(
    filePath: string,
    options: CSVParseOptions = {}
  ): Promise<DataResult<ValidatedData<T>>> {
    // Parse CSV
    const parseResult = await csvOps.parseFile(filePath, options);
    if (parseResult.isErr()) return err(parseResult.error);

    // Validate each row
    const validRows: T[] = [];
    const invalidRows: ValidationError[] = [];

    for (const [index, row] of parseResult.value.entries()) {
      const validationResult = schema.validate(row);
      if (validationResult.isOk()) {
        validRows.push(validationResult.value);
      } else {
        invalidRows.push({
          row: index + 1,
          data: row,
          errors: validationResult.error,
        });
      }
    }

    return ok({
      validData: validRows,
      invalidData: invalidRows,
      summary: {
        totalRows: parseResult.value.length,
        validRows: validRows.length,
        invalidRows: invalidRows.length,
        validationRate: validRows.length / parseResult.value.length,
      },
    });
  },

  // Stream validation for large datasets
  createValidationStream(): TransformStream<unknown, T> {
    return new TransformStream({
      transform(chunk, controller) {
        const validationResult = schema.validate(chunk);
        if (validationResult.isOk()) {
          controller.enqueue(validationResult.value);
        } else {
          // Emit validation error event
          this.emit('validation-error', {
            data: chunk,
            error: validationResult.error,
          });
        }
      },
    });
  },
});
```

## Medium Priority Improvements

### 4. Enhanced Error Context and Recovery (Medium)

**Why Important**: Data operations often fail due to format issues; better error context helps users fix problems.

**Implementation Guidelines**:

```typescript
// Enhanced error reporting with data context
export const createEnhancedErrorReporting = () => ({
  createDataError: (context: DataErrorContext) => ({
    ...createBaseDataError(context),

    // Add data samples for debugging
    dataSample: context.dataSample
      ? JSON.stringify(context.dataSample, null, 2).slice(0, 500) + '...'
      : undefined,

    // Suggest fixes based on error type
    suggestions: generateErrorSuggestions(context),

    // Provide recovery options
    recoveryOptions: generateRecoveryOptions(context),
  }),

  // Auto-fix common data issues
  suggestFixes: (error: DataError, data: unknown) => {
    const fixes: DataFix[] = [];

    if (error.subtype === 'CSV_DELIMITER_MISMATCH') {
      fixes.push({
        description: 'Try different delimiter',
        fix: () => detectCSVDelimiter(data as string),
        confidence: 0.8,
      });
    }

    if (error.subtype === 'ENCODING_ERROR') {
      fixes.push({
        description: 'Try UTF-8 with BOM',
        fix: () => convertEncoding(data as Buffer, 'utf8'),
        confidence: 0.6,
      });
    }

    return fixes;
  },
});
```

### 5. Performance Monitoring and Optimization (Medium)

**Why Important**: Data operations performance varies greatly with input size and format; monitoring helps optimize usage.

**Implementation Guidelines**:

```typescript
// Performance monitoring for data operations
export const createPerformanceMonitor = () => ({
  async measureOperation<T>(
    operation: () => Promise<DataResult<T>>,
    context: OperationContext
  ): Promise<DataResult<T & { performance: PerformanceMetrics }>> {
    const startTime = performance.now();
    const startMemory = process.memoryUsage();

    const result = await operation();

    const endTime = performance.now();
    const endMemory = process.memoryUsage();

    const metrics: PerformanceMetrics = {
      duration: endTime - startTime,
      memoryUsed: endMemory.heapUsed - startMemory.heapUsed,
      peakMemory: endMemory.heapUsed,
      operation: context.operation,
      dataSize: context.dataSize,
    };

    // Log slow operations
    if (metrics.duration > 5000) {
      console.warn(`Slow data operation detected: ${context.operation} took ${metrics.duration}ms`);
    }

    if (result.isOk()) {
      return ok({ ...result.value, performance: metrics });
    } else {
      return err(result.error);
    }
  },
});
```

## Low Priority Improvements

### 6. Format Conversion Utilities (Low)

**Why Important**: Converting between data formats is a common need but currently requires manual work.

**Implementation Guidelines**:

```typescript
// Cross-format conversion utilities
export const createFormatConverter = () => ({
  async csvToExcel(csvPath: string, excelPath: string): Promise<DataResult<void>> {
    const csvData = await csvOps.parseFile(csvPath);
    if (csvData.isErr()) return err(csvData.error);

    return excelOps.writeFile(csvData.value, excelPath);
  },

  async excelToCSV(
    excelPath: string,
    csvPath: string,
    sheetName?: string
  ): Promise<DataResult<void>> {
    const excelData = await excelOps.readFile(excelPath, sheetName);
    if (excelData.isErr()) return err(excelData.error);

    return csvOps.writeFile(excelData.value, csvPath);
  },
});
```

### 7. Data Quality Utilities (Low)

**Why Important**: Data quality assessment helps users understand their data before processing.

**Implementation Guidelines**:

```typescript
// Data quality assessment
export const createDataQualityAnalyzer = () => ({
  async analyzeDataset<T>(data: T[]): Promise<DataQualityReport> {
    return {
      rowCount: data.length,
      columnAnalysis: analyzeColumns(data),
      duplicateCount: findDuplicates(data).length,
      missingValueCount: countMissingValues(data),
      qualityScore: calculateQualityScore(data),
    };
  },
});
```

## Implementation Roadmap

### Phase 1 (2-3 weeks) - Performance Focus

- [ ] Streaming support for CSV and Excel
- [ ] Worker thread processing for large datasets
- [ ] Memory optimization

### Phase 2 (1-2 weeks) - Integration and Validation

- [ ] Schema validation integration
- [ ] Enhanced error reporting
- [ ] Performance monitoring

### Phase 3 (1-2 weeks) - Convenience Features

- [ ] Format conversion utilities
- [ ] Data quality analysis
- [ ] Advanced transformation utilities

## Success Metrics

- **Memory Efficiency**: 90%+ reduction in memory usage for large files
- **Performance**: Handle 100x+ larger datasets without CLI blocking
- **Error Experience**: Clear error messages with actionable suggestions
- **Integration**: Seamless validation integration with @trailhead/validation
- **Developer Experience**: Comprehensive examples and migration guides

## Risk Mitigation

- **Memory Leaks**: Comprehensive testing with large datasets
- **Worker Thread Overhead**: Intelligent thresholds for worker usage
- **Streaming Complexity**: Maintain simple API despite complex implementation
- **Breaking Changes**: All improvements maintain backward compatibility
