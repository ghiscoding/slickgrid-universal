import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WorkerManager, type WorkerChunk } from '../utils/workerManager.js';

// Mock Worker for testing
class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;

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
      return {
        type: 'CHUNK_PROCESSED',
        chunkId: data.chunkId,
        processedRows: data.rows.map((row: any[]) =>
          row.map(cell => typeof cell === 'number' ? `$${cell.toFixed(2)}` : String(cell))
        )
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

    it('should not reinitialize if already initialized', async () => {
      await workerManager.initializeWorker();
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL');

      await workerManager.initializeWorker();

      // Should not create another blob URL
      expect(createObjectURLSpy).not.toHaveBeenCalled();
    });
  });

  describe('Single Chunk Processing', () => {
    beforeEach(async () => {
      await workerManager.initializeWorker();
    });

    it('should process a single chunk successfully', async () => {
      const chunk: WorkerChunk = {
        chunkId: 'test-chunk-1',
        rows: [
          [100, 'Product A'],
          [200, 'Product B']
        ],
        columns: [
          { id: 'price', field: 'price', formatter: 'BUILTIN:currency' },
          { id: 'name', field: 'name', formatter: null }
        ],
        gridOptions: { locale: 'en-US' }
      };

      const result = await workerManager.processChunk(chunk);

      expect(result.chunkId).toBe('test-chunk-1');
      expect(result.processedRows).toHaveLength(2);
      expect(result.processedRows[0]).toEqual(['$100.00', 'Product A']);
      expect(result.processedRows[1]).toEqual(['$200.00', 'Product B']);
    });

    it('should handle chunk processing timeout', async () => {
      const chunk: WorkerChunk = {
        chunkId: 'timeout-chunk',
        rows: [[1, 'test']],
        columns: [{ id: 'test', field: 'test', formatter: null }],
        gridOptions: {}
      };

      // Mock a worker that never responds
      const originalWorker = global.Worker;
      global.Worker = class extends MockWorker {
        postMessage() {
          // Never call onmessage - simulate timeout
        }
      } as any;

      await workerManager.cleanup();
      await workerManager.initializeWorker();

      await expect(workerManager.processChunk(chunk, 100)).rejects.toThrow('Worker timeout');

      global.Worker = originalWorker;
    });

    it('should handle worker error during processing', async () => {
      const chunk: WorkerChunk = {
        chunkId: 'error-chunk',
        rows: [[1, 'test']],
        columns: [{ id: 'test', field: 'test', formatter: null }],
        gridOptions: {}
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
                  chunkId: data.chunkId,
                  error: 'Processing failed'
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
          rows: [[100, 'A'], [200, 'B']],
          columns: [
            { id: 'price', field: 'price', formatter: 'BUILTIN:currency' },
            { id: 'name', field: 'name', formatter: null }
          ],
          gridOptions: {}
        },
        {
          chunkId: 'chunk-2',
          rows: [[300, 'C'], [400, 'D']],
          columns: [
            { id: 'price', field: 'price', formatter: 'BUILTIN:currency' },
            { id: 'name', field: 'name', formatter: null }
          ],
          gridOptions: {}
        }
      ];

      const results = await workerManager.processChunks(chunks, 2);

      expect(results).toHaveLength(2);
      expect(results[0].chunkId).toBe('chunk-1');
      expect(results[1].chunkId).toBe('chunk-2');
      expect(results[0].processedRows[0]).toEqual(['$100.00', 'A']);
      expect(results[1].processedRows[0]).toEqual(['$300.00', 'C']);
    });

    it('should respect concurrency limits', async () => {
      const chunks: WorkerChunk[] = Array.from({ length: 5 }, (_, i) => ({
        chunkId: `chunk-${i}`,
        rows: [[i * 100, `Item ${i}`]],
        columns: [
          { id: 'price', field: 'price', formatter: 'BUILTIN:currency' },
          { id: 'name', field: 'name', formatter: null }
        ],
        gridOptions: {}
      }));

      const startTime = Date.now();
      const results = await workerManager.processChunks(chunks, 2); // Max 2 concurrent
      const endTime = Date.now();

      expect(results).toHaveLength(5);
      // With 2 concurrent workers and 5 chunks, it should take at least 3 "rounds"
      // This is a rough timing test - in real scenarios, timing would be more predictable
      expect(endTime - startTime).toBeGreaterThan(20); // At least 2 rounds of 10ms each
    });

    it('should handle mixed success and failure in batch processing', async () => {
      const chunks: WorkerChunk[] = [
        {
          chunkId: 'success-chunk',
          rows: [[100, 'Success']],
          columns: [{ id: 'test', field: 'test', formatter: null }],
          gridOptions: {}
        },
        {
          chunkId: 'error-chunk',
          rows: [[200, 'Error']],
          columns: [{ id: 'test', field: 'test', formatter: null }],
          gridOptions: {}
        }
      ];

      // Mock worker that fails on specific chunk
      const originalWorker = global.Worker;
      global.Worker = class extends MockWorker {
        postMessage(data: any) {
          setTimeout(() => {
            if (this.onmessage) {
              if (data.chunkId === 'error-chunk') {
                this.onmessage(new MessageEvent('message', {
                  data: {
                    type: 'CHUNK_ERROR',
                    chunkId: data.chunkId,
                    error: 'Simulated error'
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
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL');

      workerManager.cleanup();

      expect(revokeObjectURLSpy).toHaveBeenCalled();
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
});
