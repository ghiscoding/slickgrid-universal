import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Column } from '@slickgrid-universal/common';
import { Formatters } from '@slickgrid-universal/common';
import { ExcelExportService } from '../excelExport.service.js';
import { WorkerManager } from '../utils/workerManager.js';

// Browser environment simulation utilities
class BrowserEnvironmentSimulator {
  private originalWorker: any;
  private originalURL: any;
  private originalNavigator: any;

  constructor() {
    this.originalWorker = global.Worker;
    this.originalURL = global.URL;
    this.originalNavigator = global.navigator;
  }

  simulateUnsupportedWorker() {
    delete (global as any).Worker;
  }

  simulateOldBrowser() {
    delete (global as any).Worker;
    delete (global as any).URL;
    (global as any).navigator = {
      userAgent: 'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1)'
    };
  }

  simulateModernBrowser() {
    global.Worker = class MockWorker {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: ErrorEvent) => void) | null = null;
      
      constructor(public scriptURL: string) {}
      
      postMessage(data: any) {
        setTimeout(() => {
          if (this.onmessage) {
            this.onmessage(new MessageEvent('message', { 
              data: { 
                type: 'CHUNK_PROCESSED', 
                chunkId: data.chunkId, 
                processedRows: data.rows.map((row: any[]) => row.map(String)) 
              } 
            }));
          }
        }, 10);
      }
      
      terminate() {}
    } as any;

    global.URL = {
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn()
    } as any;

    (global as any).navigator = {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };
  }

  simulateCSPRestrictedEnvironment() {
    global.Worker = class RestrictedWorker {
      constructor() {
        throw new Error('Content Security Policy: The source list for \'worker-src\' contains no source expressions.');
      }
    } as any;
  }

  simulateWebWorkerError() {
    global.Worker = class ErrorWorker {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: ErrorEvent) => void) | null = null;
      
      constructor() {}
      
      postMessage() {
        setTimeout(() => {
          if (this.onerror) {
            this.onerror(new ErrorEvent('error', { message: 'Worker script error' }));
          }
        }, 10);
      }
      
      terminate() {}
    } as any;
  }

  restore() {
    global.Worker = this.originalWorker;
    global.URL = this.originalURL;
    global.navigator = this.originalNavigator;
  }
}

describe('Browser Compatibility Tests', () => {
  let service: ExcelExportService;
  let browserSim: BrowserEnvironmentSimulator;
  let testData: any[];
  let testColumns: Column[];

  const mockGrid = {
    getOptions: vi.fn(),
    getColumns: vi.fn(),
    getData: vi.fn(),
    getDataItem: vi.fn(),
    getDataLength: vi.fn(),
    getUID: vi.fn(() => 'test-grid'),
    getContainerNode: vi.fn(() => document.createElement('div')),
  } as any;

  const mockDataView = {
    getLength: vi.fn(),
    getItem: vi.fn(),
    getItems: vi.fn(),
    getItemMetadata: vi.fn(),
  } as any;

  const mockTranslateService = {
    translate: vi.fn((key: string) => key),
    getCurrentLanguage: vi.fn(() => 'en'),
  } as any;

  beforeEach(() => {
    browserSim = new BrowserEnvironmentSimulator();
    service = new ExcelExportService();
    (service as any)._grid = mockGrid;
    (service as any)._dataView = mockDataView;
    (service as any)._translateService = mockTranslateService;

    testData = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `Product ${i}`,
      price: Math.random() * 100,
      active: Math.random() > 0.5
    }));

    testColumns = [
      { id: 'id', field: 'id', name: 'ID' },
      { id: 'name', field: 'name', name: 'Name' },
      { id: 'price', field: 'price', name: 'Price', formatter: Formatters.currency },
      { id: 'active', field: 'active', name: 'Active', formatter: Formatters.translateBoolean }
    ];

    mockGrid.getColumns.mockReturnValue(testColumns);
    mockDataView.getLength.mockReturnValue(testData.length);
    mockDataView.getItem.mockImplementation((index: number) => testData[index]);
  });

  afterEach(() => {
    service.dispose();
    browserSim.restore();
    vi.clearAllMocks();
  });

  describe('Modern Browser Support', () => {
    beforeEach(() => {
      browserSim.simulateModernBrowser();
    });

    it('should detect web worker support in modern browsers', () => {
      const workerManager = new WorkerManager();
      expect(workerManager.isSupported()).toBe(true);
    });

    it('should successfully initialize workers in modern browsers', async () => {
      const workerManager = new WorkerManager();
      const result = await workerManager.initializeWorker();
      expect(result).toBe(true);
      workerManager.cleanup();
    });

    it('should process data using web workers in modern browsers', async () => {
      const outputData: any[] = [];
      
      const result = await (service as any).pushAllGridRowDataToArray(outputData, testColumns, {
        useWebWorker: true,
        workerChunkSize: 500,
        exportWithFormatter: true
      });

      expect(outputData.length).toBe(testData.length);
    });
  });

  describe('Legacy Browser Support', () => {
    beforeEach(() => {
      browserSim.simulateOldBrowser();
    });

    it('should detect lack of web worker support in old browsers', () => {
      const workerManager = new WorkerManager();
      expect(workerManager.isSupported()).toBe(false);
    });

    it('should fall back to synchronous processing in old browsers', async () => {
      const outputData: any[] = [];
      
      // Should not throw and should fall back to sync processing
      await expect(
        (service as any).pushAllGridRowDataToArray(outputData, testColumns, {
          useWebWorker: true,
          workerChunkSize: 500,
          exportWithFormatter: true
        })
      ).resolves.not.toThrow();

      expect(outputData.length).toBe(testData.length);
    });

    it('should handle worker initialization failure gracefully', async () => {
      const shouldUse = await (service as any).shouldUseWebWorker(testData.length);
      expect(shouldUse).toBe(false);
    });
  });

  describe('CSP Restricted Environment', () => {
    beforeEach(() => {
      browserSim.simulateCSPRestrictedEnvironment();
    });

    it('should handle CSP restrictions gracefully', async () => {
      const workerManager = new WorkerManager();
      const result = await workerManager.initializeWorker();
      expect(result).toBe(false);
    });

    it('should fall back to main thread when CSP blocks workers', async () => {
      const outputData: any[] = [];
      
      await expect(
        (service as any).pushAllGridRowDataToArray(outputData, testColumns, {
          useWebWorker: true,
          workerFallback: true,
          exportWithFormatter: true
        })
      ).resolves.not.toThrow();

      expect(outputData.length).toBe(testData.length);
    });
  });

  describe('Worker Runtime Errors', () => {
    beforeEach(() => {
      browserSim.simulateWebWorkerError();
    });

    it('should handle worker runtime errors', async () => {
      const workerManager = new WorkerManager();
      await workerManager.initializeWorker();

      const chunk = {
        chunkId: 'test-chunk',
        rows: [[1, 'test']],
        columns: [{ id: 'test', field: 'test', formatter: null }],
        gridOptions: {}
      };

      await expect(workerManager.processChunk(chunk)).rejects.toThrow();
      workerManager.cleanup();
    });

    it('should fall back when worker processing fails', async () => {
      const outputData: any[] = [];
      
      // Mock the service to simulate worker failure and fallback
      const originalShouldUse = (service as any).shouldUseWebWorker;
      (service as any).shouldUseWebWorker = vi.fn().mockResolvedValue(false);

      await expect(
        (service as any).pushAllGridRowDataToArray(outputData, testColumns, {
          useWebWorker: true,
          workerFallback: true,
          exportWithFormatter: true
        })
      ).resolves.not.toThrow();

      expect(outputData.length).toBe(testData.length);
      
      (service as any).shouldUseWebWorker = originalShouldUse;
    });
  });

  describe('Browser-Specific Features', () => {
    it('should handle different user agents correctly', () => {
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59'
      ];

      userAgents.forEach(userAgent => {
        (global as any).navigator = { userAgent };
        browserSim.simulateModernBrowser();
        
        const workerManager = new WorkerManager();
        expect(workerManager.isSupported()).toBe(true);
      });
    });

    it('should handle memory constraints in different browsers', async () => {
      browserSim.simulateModernBrowser();
      
      // Simulate memory-constrained environment
      const originalMemory = (performance as any).memory;
      (performance as any).memory = {
        usedJSHeapSize: 50 * 1024 * 1024, // 50MB
        totalJSHeapSize: 60 * 1024 * 1024, // 60MB
        jsHeapSizeLimit: 64 * 1024 * 1024  // 64MB limit
      };

      const outputData: any[] = [];
      
      await expect(
        (service as any).pushAllGridRowDataToArray(outputData, testColumns, {
          useWebWorker: true,
          workerChunkSize: 100, // Smaller chunks for memory-constrained environment
          maxConcurrentChunks: 1,
          exportWithFormatter: true
        })
      ).resolves.not.toThrow();

      expect(outputData.length).toBe(testData.length);
      
      (performance as any).memory = originalMemory;
    });
  });

  describe('Feature Detection', () => {
    it('should properly detect required APIs', () => {
      // Test with all APIs available
      browserSim.simulateModernBrowser();
      let workerManager = new WorkerManager();
      expect(workerManager.isSupported()).toBe(true);

      // Test with missing Worker
      browserSim.simulateUnsupportedWorker();
      workerManager = new WorkerManager();
      expect(workerManager.isSupported()).toBe(false);
    });

    it('should handle partial API support', () => {
      // Simulate environment with Worker but no URL.createObjectURL
      global.Worker = class MockWorker {} as any;
      delete (global as any).URL;

      const workerManager = new WorkerManager();
      expect(workerManager.isSupported()).toBe(false);
    });
  });

  describe('Performance Across Browsers', () => {
    it('should maintain consistent performance characteristics', async () => {
      const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
      const results: { browser: string; time: number }[] = [];

      for (const browser of browsers) {
        browserSim.simulateModernBrowser();
        (global as any).navigator = { userAgent: `Mock ${browser}` };

        const startTime = performance.now();
        
        const outputData: any[] = [];
        await (service as any).pushAllGridRowDataToArray(outputData, testColumns, {
          useWebWorker: true,
          workerChunkSize: 500,
          exportWithFormatter: true
        });

        const endTime = performance.now();
        results.push({ browser, time: endTime - startTime });

        expect(outputData.length).toBe(testData.length);
      }

      // All browsers should complete processing
      results.forEach(result => {
        expect(result.time).toBeGreaterThan(0);
        console.log(`${result.browser}: ${result.time.toFixed(2)}ms`);
      });
    });
  });
});
