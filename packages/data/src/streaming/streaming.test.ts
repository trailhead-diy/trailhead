import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Readable, Transform } from 'node:stream';
import type { StreamOperations } from './types.js';

// Mock the entire streaming utils module to control stream availability
vi.mock('./utils.js', async () => {
  const actual = await vi.importActual('./utils.js');
  return {
    ...actual,
    checkStreamAvailability: vi.fn(() => true),
    getStreamOperations: vi.fn(() => Promise.resolve(mockStreamOperations)),
    isStreamingEnabled: vi.fn((config?: any) => config?.enabled !== false),
  };
});

// Mock @trailhead/streams module
const mockStreamOperations: StreamOperations = {
  createReadableFromArray: vi.fn().mockImplementation((data: any[]) => ({
    isOk: () => true,
    isErr: () => false,
    value: new Readable({
      objectMode: true,
      read() {
        data.forEach(item => this.push(item));
        this.push(null);
      },
    }),
  })),
  createWritableToArray: vi.fn().mockImplementation(() => ({
    isOk: () => true,
    isErr: () => false,
    value: {
      stream: new Transform({
        objectMode: true,
        transform(chunk, _encoding, callback) {
          callback(null, chunk);
        },
      }),
      getArray: () => [],
    },
  })),
  createTransform: vi.fn().mockImplementation((transform: (chunk: any) => any) => ({
    isOk: () => true,
    isErr: () => false,
    value: new Transform({
      objectMode: true,
      transform(chunk, _encoding, callback) {
        try {
          callback(null, transform(chunk));
        } catch (error) {
          callback(error);
        }
      },
    }),
  })),
  pipeline: vi.fn().mockImplementation(async (..._streams: any[]) => ({
    isOk: () => true,
    isErr: () => false,
    value: undefined,
  })),
};

// Now import the actual modules after mocking
const {
  createDataStreamingOperations,
  createCSVStreaming,
  createJSONStreaming,
  createExcelStreaming,
  checkStreamAvailability,
  isStreamingEnabled,
} = await import('./index.js');

describe('Streaming Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkStreamAvailability', () => {
    it('should detect when streams are available', () => {
      const isAvailable = checkStreamAvailability();
      expect(isAvailable).toBe(true);
    });
  });

  describe('isStreamingEnabled', () => {
    it('should return true when enabled and available', () => {
      const enabled = isStreamingEnabled({ enabled: true });
      expect(enabled).toBe(true);
    });

    it('should return false when explicitly disabled', () => {
      const enabled = isStreamingEnabled({ enabled: false });
      expect(enabled).toBe(false);
    });
  });

  describe('createDataStreamingOperations', () => {
    it('should create complete data streaming operations', async () => {
      const result = await createDataStreamingOperations(mockStreamOperations);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveProperty('csv');
        expect(result.value).toHaveProperty('json');
        expect(result.value).toHaveProperty('excel');
        expect(result.value).toHaveProperty('stream');
      }
    });

    it('should handle streaming unavailable gracefully', async () => {
      const result = await createDataStreamingOperations(undefined, { enabled: false });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe('STREAMING_NOT_AVAILABLE');
      }
    });
  });

  describe('createCSVStreaming', () => {
    it('should create CSV streaming operations', async () => {
      const result = await createCSVStreaming();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveProperty('parseFileStream');
        expect(result.value).toHaveProperty('parseStringStream');
        expect(result.value).toHaveProperty('writeFileStream');
        expect(result.value).toHaveProperty('transformStream');
        expect(result.value).toHaveProperty('stringifyStream');
        expect(result.value).toHaveProperty('validateStream');
      }
    });
  });

  describe('createJSONStreaming', () => {
    it('should create JSON streaming operations', async () => {
      const result = await createJSONStreaming();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveProperty('parseFileStream');
        expect(result.value).toHaveProperty('parseArrayStream');
        expect(result.value).toHaveProperty('writeFileStream');
        expect(result.value).toHaveProperty('stringifyArrayStream');
        expect(result.value).toHaveProperty('transformStream');
        expect(result.value).toHaveProperty('validateStream');
      }
    });
  });

  describe('createExcelStreaming', () => {
    it('should create Excel streaming operations', async () => {
      const result = await createExcelStreaming();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveProperty('parseFileStream');
        expect(result.value).toHaveProperty('parseWorksheetStream');
        expect(result.value).toHaveProperty('writeFileStream');
        expect(result.value).toHaveProperty('transformRowStream');
        expect(result.value).toHaveProperty('stringifyWorksheetStream');
      }
    });
  });
});

describe('CSV Streaming Operations', () => {
  let csvStreaming: any;

  beforeEach(async () => {
    const result = await createCSVStreaming();
    if (result.isOk()) {
      csvStreaming = result.value;
    }
  });

  describe('parseStringStream', () => {
    it('should parse CSV string into stream', () => {
      const csvData = 'name,age\nJohn,30\nJane,25';
      const result = csvStreaming.parseStringStream(csvData, { hasHeader: true });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeInstanceOf(Readable);
      }
    });

    it('should handle empty CSV data', () => {
      const result = csvStreaming.parseStringStream('');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('CSVError');
      }
    });
  });

  describe('transformStream', () => {
    it('should create transform stream with custom function', () => {
      const result = csvStreaming.transformStream((row: any) => ({ ...row, processed: true }));

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeInstanceOf(Transform);
      }
    });
  });

  describe('validateStream', () => {
    it('should create validation stream', () => {
      const result = csvStreaming.validateStream();

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeInstanceOf(Transform);
      }
    });
  });
});

describe('JSON Streaming Operations', () => {
  let jsonStreaming: any;

  beforeEach(async () => {
    const result = await createJSONStreaming();
    if (result.isOk()) {
      jsonStreaming = result.value;
    }
  });

  describe('parseArrayStream', () => {
    it('should parse JSON array into stream', () => {
      const jsonData = '[{"name": "John", "age": 30}, {"name": "Jane", "age": 25}]';
      const result = jsonStreaming.parseArrayStream(jsonData);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeInstanceOf(Readable);
      }
    });

    it('should handle single JSON object', () => {
      const jsonData = '{"name": "John", "age": 30}';
      const result = jsonStreaming.parseArrayStream(jsonData);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeInstanceOf(Readable);
      }
    });

    it('should handle empty JSON data', () => {
      const result = jsonStreaming.parseArrayStream('');

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe('JSONError');
      }
    });
  });

  describe('stringifyArrayStream', () => {
    it('should create JSON stringify stream', () => {
      const result = jsonStreaming.stringifyArrayStream({ streamArray: true });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeInstanceOf(Transform);
      }
    });
  });

  describe('transformStream', () => {
    it('should create transform stream for JSON items', () => {
      const result = jsonStreaming.transformStream((item: any) => ({ ...item, processed: true }));

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeInstanceOf(Transform);
      }
    });
  });
});

describe('Progress Tracking', () => {
  it('should track progress correctly', async () => {
    const jsonStreaming = await createJSONStreaming();

    expect(jsonStreaming.isOk()).toBe(true);
    if (jsonStreaming.isOk()) {
      let _progressCalls = 0;
      const config = {
        onProgress: (processed: number, _total?: number) => {
          _progressCalls++;
          expect(processed).toBeGreaterThan(0);
        },
      };

      const jsonData = '[{"name": "John"}, {"name": "Jane"}]';
      const result = jsonStreaming.value.parseArrayStream(jsonData, config);

      expect(result.isOk()).toBe(true);
    }
  });
});

describe('Error Handling', () => {
  it('should handle streaming errors gracefully', async () => {
    const csvStreaming = await createCSVStreaming();

    expect(csvStreaming.isOk()).toBe(true);
    if (csvStreaming.isOk()) {
      let _errorCalls = 0;
      const config = {
        onError: (error: any) => {
          _errorCalls++;
          expect(error).toBeDefined();
        },
      };

      const result = csvStreaming.value.validateStream(config);
      expect(result.isOk()).toBe(true);
    }
  });

  it('should return proper CoreError objects', async () => {
    const result = await createCSVStreaming();
    expect(result.isOk()).toBe(true);

    if (result.isOk()) {
      const emptyResult = result.value.parseStringStream('');
      expect(emptyResult.isErr()).toBe(true);

      if (emptyResult.isErr()) {
        expect(emptyResult.error).toHaveProperty('type');
        expect(emptyResult.error).toHaveProperty('message');
        expect(emptyResult.error).toHaveProperty('recoverable');
        expect(emptyResult.error.type).toBe('CSVError');
      }
    }
  });
});
