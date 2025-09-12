import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WorkerManager, type WorkerManagerOptions } from '../utils/workerManager.js';
import type { WorkerChunk, WorkerChunkResult, WorkerRowData, SerializableColumn } from '../utils/formatterSerializer.js';

// Mock Worker for testing
class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  onmessageerror: ((event: MessageEvent) => void) | null = null;

  constructor(public scriptURL: string) { }

  postMessage(data: any) {
    // Simulate async worker response
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage(new MessageEvent('message', { data: this.mockResponse(data) }));
      }
    }, 10);
  }

  terminate() {
    // Mock termination
  }

  private mockResponse(data: any) {
    if (data.type === 'PROCESS_CHUNK') {
      const chunk = data.payload as WorkerChunk;
      return {
        type: 'CHUNK_RESULT',
        payload: {
          chunkId: chunk.chunkId,
          processedRows: chunk.rows.map((row: WorkerRowData) => ({
            type: row.type,
            data: row.type === 'regular' ?
              Object.values(row.data).map(cell => typeof cell === 'number' ? `$${cell.toFixed(2)}` : String(cell)) :
              [String(row.data)],
            originalRowIndex: row.originalRowIndex
          }))
        }
      };
    }
    return { type: 'UNKNOWN' };
  }
}

// Mock global Worker
global.Worker = MockWorker as any;
global.URL = {
  createObjectURL: vi.fn(() => 'blob:mock-url'),
  revokeObjectURL: vi.fn()
} as any;

// Mock Blob
global.Blob = class MockBlob {
  constructor(parts: any[], options?: any) { }
} as any;

describe('WorkerManager - Unit Tests', () => {
  let workerManager: WorkerManager;

  beforeEach(() => {
    workerManager = new WorkerManager();
    vi.clearAllMocks();
  });

  afterEach(() => {
    workerManager.cleanup();
  });

  describe('Worker Support Detection', () => {
    it('should detect worker support correctly', () => {
      expect(workerManager.isSupported()).toBe(true);
    });

    it('should handle missing Worker constructor', () => {
      const originalWorker = global.Worker;
      delete (global as any).Worker;

      const manager = new WorkerManager();
      expect(manager.isSupported()).toBe(false);

      global.Worker = originalWorker;
    });
  });

  describe('Worker Initialization', () => {
    it('should initialize worker successfully', async () => {
      const result = await workerManager.initializeWorker();
      expect(result).toBe(true);
    });

    it('should handle worker initialization failure', async () => {
      // Mock Worker constructor to throw
      const originalWorker = global.Worker;
      global.Worker = vi.fn(() => {
        throw new Error('Worker creation failed');
      }) as any;

      const result = await workerManager.initializeWorker();
      expect(result).toBe(false);

      global.Worker = originalWorker;
    });

    it('should reinitialize worker if called multiple times', async () => {
      const result1 = await workerManager.initializeWorker();
      expect(result1).toBe(true);

      // Clear the spy calls from the first initialization
      vi.clearAllMocks();
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL');

      const result2 = await workerManager.initializeWorker();
      expect(result2).toBe(true);

      // Should create another blob URL since the method doesn't guard against reinitialization
      expect(createObjectURLSpy).toHaveBeenCalled();
    });
  });

  describe('Single Chunk Processing', () => {
    beforeEach(async () => {
      await workerManager.initializeWorker();
    });

    it('should process a single chunk successfully', async () => {
      const chunk: WorkerChunk = {
        chunkId: 'test-chunk-1',
        startRow: 0,
        endRow: 1,
        rows: [
          {
            type: 'regular',
            data: { price: 100, name: 'Product A' },
            originalRowIndex: 0
          },
          {
            type: 'regular',
            data: { price: 200, name: 'Product B' },
            originalRowIndex: 1
          }
        ],
        columns: [
          { id: 'price', field: 'price', formatter: 'BUILTIN:currency' },
          { id: 'name', field: 'name', formatter: null }
        ] as SerializableColumn[],
        gridOptions: { locale: 'en-US' },
        exportOptions: {}
      };

      const result = await workerManager.processChunk(chunk);

      expect(result.chunkId).toBe('test-chunk-1');
      expect(result.processedRows).toHaveLength(2);
      expect(result.processedRows[0].data).toEqual(['$100.00', 'Product A']);
      expect(result.processedRows[1].data).toEqual(['$200.00', 'Product B']);
    });

    it('should handle chunk processing timeout', async () => {
      const chunk: WorkerChunk = {
        chunkId: 'timeout-chunk',
        startRow: 0,
        endRow: 0,
        rows: [{
          type: 'regular',
          data: { test: 1 },
          originalRowIndex: 0
        }],
        columns: [{ id: 'test', field: 'test', formatter: null }] as SerializableColumn[],
        gridOptions: {},
        exportOptions: {}
      };

      // Create a new worker manager with short timeout
      const timeoutManager = new WorkerManager({ workerTimeout: 100 });

      // Mock a worker that never responds
      const originalWorker = global.Worker;
      global.Worker = class extends MockWorker {
        postMessage() {
          // Never call onmessage - simulate timeout
        }
      } as any;

      await timeoutManager.initializeWorker();

      await expect(timeoutManager.processChunk(chunk)).rejects.toThrow('Worker timeout');

      timeoutManager.cleanup();

      global.Worker = originalWorker;
    });

    it('should handle worker error during processing', async () => {
      const chunk: WorkerChunk = {
        chunkId: 'error-chunk',
        startRow: 0,
        endRow: 0,
        rows: [{
          type: 'regular',
          data: { test: 1 },
          originalRowIndex: 0
        }],
        columns: [{ id: 'test', field: 'test', formatter: null }] as SerializableColumn[],
        gridOptions: {},
        exportOptions: {}
      };

      // Mock a worker that sends error
      const originalWorker = global.Worker;
      global.Worker = class extends MockWorker {
        postMessage(data: any) {
          setTimeout(() => {
            if (this.onmessage) {
              this.onmessage(new MessageEvent('message', {
                data: {
                  type: 'CHUNK_ERROR',
                  payload: {
                    chunkId: data.payload.chunkId,
                    error: 'Processing failed'
                  }
                }
              }));
            }
          }, 10);
        }
      } as any;

      await workerManager.cleanup();
      await workerManager.initializeWorker();

      await expect(workerManager.processChunk(chunk)).rejects.toThrow('Processing failed');

      global.Worker = originalWorker;
    });
  });

  describe('Multiple Chunk Processing', () => {
    beforeEach(async () => {
      await workerManager.initializeWorker();
    });

    it('should process multiple chunks concurrently', async () => {
      const chunks: WorkerChunk[] = [
        {
          chunkId: 'chunk-1',
          startRow: 0,
          endRow: 1,
          rows: [
            { type: 'regular', data: { price: 100, name: 'A' }, originalRowIndex: 0 },
            { type: 'regular', data: { price: 200, name: 'B' }, originalRowIndex: 1 }
          ],
          columns: [
            { id: 'price', field: 'price', formatter: 'BUILTIN:currency' },
            { id: 'name', field: 'name', formatter: null }
          ] as SerializableColumn[],
          gridOptions: {},
          exportOptions: {}
        },
        {
          chunkId: 'chunk-2',
          startRow: 2,
          endRow: 3,
          rows: [
            { type: 'regular', data: { price: 300, name: 'C' }, originalRowIndex: 2 },
            { type: 'regular', data: { price: 400, name: 'D' }, originalRowIndex: 3 }
          ],
          columns: [
            { id: 'price', field: 'price', formatter: 'BUILTIN:currency' },
            { id: 'name', field: 'name', formatter: null }
          ] as SerializableColumn[],
          gridOptions: {},
          exportOptions: {}
        }
      ];

      const results = await workerManager.processChunks(chunks);

      expect(results).toHaveLength(2);
      expect(results[0].chunkId).toBe('chunk-1');
      expect(results[1].chunkId).toBe('chunk-2');
      expect(results[0].processedRows[0].data).toEqual(['$100.00', 'A']);
      expect(results[1].processedRows[0].data).toEqual(['$300.00', 'C']);
    });

    it('should respect concurrency limits', async () => {
      const chunks: WorkerChunk[] = Array.from({ length: 5 }, (_, i) => ({
        chunkId: `chunk-${i}`,
        startRow: i,
        endRow: i,
        rows: [{ type: 'regular', data: { price: i * 100, name: `Item ${i}` }, originalRowIndex: i }],
        columns: [
          { id: 'price', field: 'price', formatter: 'BUILTIN:currency' },
          { id: 'name', field: 'name', formatter: null }
        ] as SerializableColumn[],
        gridOptions: {},
        exportOptions: {}
      }));

      const startTime = Date.now();
      const results = await workerManager.processChunks(chunks); // Uses default concurrency
      const endTime = Date.now();

      expect(results).toHaveLength(5);
      // With concurrent processing, it should complete in reasonable time
      expect(endTime - startTime).toBeGreaterThan(10); // At least some processing time
      expect(endTime - startTime).toBeLessThan(1000); // But not too long
    });

    it('should handle mixed success and failure in batch processing', async () => {
      const chunks: WorkerChunk[] = [
        {
          chunkId: 'success-chunk',
          startRow: 0,
          endRow: 0,
          rows: [{ type: 'regular', data: { test: 100 }, originalRowIndex: 0 }],
          columns: [{ id: 'test', field: 'test', formatter: null }] as SerializableColumn[],
          gridOptions: {},
          exportOptions: {}
        },
        {
          chunkId: 'error-chunk',
          startRow: 1,
          endRow: 1,
          rows: [{ type: 'regular', data: { test: 200 }, originalRowIndex: 1 }],
          columns: [{ id: 'test', field: 'test', formatter: null }] as SerializableColumn[],
          gridOptions: {},
          exportOptions: {}
        }
      ];

      // Mock worker that fails on specific chunk
      const originalWorker = global.Worker;
      global.Worker = class extends MockWorker {
        postMessage(data: any) {
          setTimeout(() => {
            if (this.onmessage) {
              if (data.payload.chunkId === 'error-chunk') {
                this.onmessage(new MessageEvent('message', {
                  data: {
                    type: 'CHUNK_ERROR',
                    payload: {
                      chunkId: data.payload.chunkId,
                      error: 'Simulated error'
                    }
                  }
                }));
              } else {
                this.onmessage(new MessageEvent('message', { data: this.mockResponse(data) }));
              }
            }
          }, 10);
        }
      } as any;

      await workerManager.cleanup();
      await workerManager.initializeWorker();

      await expect(workerManager.processChunks(chunks)).rejects.toThrow();

      global.Worker = originalWorker;
    });
  });

  describe('Worker Cleanup', () => {
    it('should cleanup worker resources properly', async () => {
      await workerManager.initializeWorker();

      // Mock the worker to verify it gets terminated
      const terminateSpy = vi.spyOn(workerManager['worker']!, 'terminate');

      workerManager.cleanup();

      expect(terminateSpy).toHaveBeenCalled();
      expect(workerManager['worker']).toBeNull();
    });

    it('should handle cleanup when worker not initialized', () => {
      expect(() => workerManager.cleanup()).not.toThrow();
    });

    it('should handle multiple cleanup calls', async () => {
      await workerManager.initializeWorker();

      expect(() => {
        workerManager.cleanup();
        workerManager.cleanup();
      }).not.toThrow();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle worker creation failure gracefully', async () => {
      const originalWorker = global.Worker;
      global.Worker = vi.fn(() => {
        throw new Error('Worker not supported');
      }) as any;

      const result = await workerManager.initializeWorker();
      expect(result).toBe(false);

      global.Worker = originalWorker;
    });

    it('should handle blob URL creation failure', async () => {
      const originalCreateObjectURL = URL.createObjectURL;
      URL.createObjectURL = vi.fn(() => {
        throw new Error('Blob creation failed');
      });

      const result = await workerManager.initializeWorker();
      expect(result).toBe(false);

      URL.createObjectURL = originalCreateObjectURL;
    });
  });

  describe('Fallback Processing', () => {
    it('should execute worker task when fallback is disabled', async () => {
      const workerManager = new WorkerManager({ enableFallback: false });
      const workerTask = vi.fn().mockResolvedValue('worker-result');
      const fallbackTask = vi.fn().mockResolvedValue('fallback-result');

      const result = await workerManager.processWithFallback(workerTask, fallbackTask);

      expect(result).toBe('worker-result');
      expect(workerTask).toHaveBeenCalled();
      expect(fallbackTask).not.toHaveBeenCalled();
    });

    it('should execute worker task when worker is available and fallback is enabled', async () => {
      const workerManager = new WorkerManager({ enableFallback: true });
      await workerManager.initializeWorker();

      const workerTask = vi.fn().mockResolvedValue('worker-result');
      const fallbackTask = vi.fn().mockResolvedValue('fallback-result');

      const result = await workerManager.processWithFallback(workerTask, fallbackTask);

      expect(result).toBe('worker-result');
      expect(workerTask).toHaveBeenCalled();
      expect(fallbackTask).not.toHaveBeenCalled();
    });

    it('should fallback to main thread when worker task fails', async () => {
      const workerManager = new WorkerManager({ enableFallback: true });
      await workerManager.initializeWorker();

      const workerTask = vi.fn().mockRejectedValue(new Error('Worker failed'));
      const fallbackTask = vi.fn().mockResolvedValue('fallback-result');

      const result = await workerManager.processWithFallback(workerTask, fallbackTask);

      expect(result).toBe('fallback-result');
      expect(workerTask).toHaveBeenCalled();
      expect(fallbackTask).toHaveBeenCalled();
    });

    it('should fallback when worker is not supported', async () => {
      // Create a worker manager with no worker support
      const originalWorker = global.Worker;
      global.Worker = undefined as any;

      const workerManager = new WorkerManager({ enableFallback: true });
      const workerTask = vi.fn().mockResolvedValue('worker-result');
      const fallbackTask = vi.fn().mockResolvedValue('fallback-result');

      const result = await workerManager.processWithFallback(workerTask, fallbackTask);

      expect(result).toBe('fallback-result');
      expect(workerTask).not.toHaveBeenCalled();
      expect(fallbackTask).toHaveBeenCalled();

      global.Worker = originalWorker;
    });
  });

  describe('Support Detection', () => {
    it('should return correct support status', () => {
      expect(workerManager.isSupported()).toBe(true);
    });

    it('should return false when workers are not supported', () => {
      const originalWorker = global.Worker;
      global.Worker = undefined as any;

      const unsupportedManager = new WorkerManager();
      expect(unsupportedManager.isSupported()).toBe(false);

      global.Worker = originalWorker;
    });
  });
});
