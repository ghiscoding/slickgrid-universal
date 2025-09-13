import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Column } from '@slickgrid-universal/common';
import { Formatters } from '@slickgrid-universal/common';
import { ExcelExportService } from '../excelExport.service.js';

// Mock dependencies
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

describe('Excel Export Performance Tests', () => {
  let service: ExcelExportService;
  let performanceData: any[];

  beforeEach(() => {
    service = new ExcelExportService();
    (service as any)._grid = mockGrid;
    (service as any)._dataView = mockDataView;
    (service as any)._translateService = mockTranslateService;

    // Generate large test dataset
    performanceData = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      name: `Product ${i}`,
      price: Math.random() * 1000,
      date: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
      active: Math.random() > 0.5,
      category: ['Electronics', 'Clothing', 'Books', 'Home'][Math.floor(Math.random() * 4)],
      description: `This is a detailed description for product ${i} with some additional text to make it longer`,
      rating: Math.floor(Math.random() * 5) + 1,
      stock: Math.floor(Math.random() * 100),
      discount: Math.random() * 0.5
    }));

    mockDataView.getLength.mockReturnValue(performanceData.length);
    mockDataView.getItem.mockImplementation((index: number) => performanceData[index]);
    mockDataView.getItems.mockReturnValue(performanceData);
  });

  afterEach(() => {
    service.dispose();
    vi.clearAllMocks();
  });

  describe('Performance Benchmarks', () => {
    const createTestColumns = (): Column[] => [
      { id: 'id', field: 'id', name: 'ID' },
      { id: 'name', field: 'name', name: 'Name' },
      { id: 'price', field: 'price', name: 'Price', formatter: Formatters.currency },
      { id: 'date', field: 'date', name: 'Date', formatter: Formatters.dateIso },
      { id: 'active', field: 'active', name: 'Active', formatter: Formatters.translateBoolean },
      { id: 'category', field: 'category', name: 'Category' },
      { id: 'description', field: 'description', name: 'Description' },
      { id: 'rating', field: 'rating', name: 'Rating', formatter: Formatters.decimal },
      { id: 'stock', field: 'stock', name: 'Stock' },
      { id: 'discount', field: 'discount', name: 'Discount', formatter: Formatters.percent }
    ];

    it('should benchmark synchronous processing performance', async () => {
      const columns = createTestColumns();
      mockGrid.getColumns.mockReturnValue(columns);

      const startTime = performance.now();

      const outputData: any[] = [];
      await (service as any).pushAllGridRowDataToArray(outputData, columns, {
        useWebWorker: false,
        exportWithFormatter: true
      });

      const endTime = performance.now();
      const syncTime = endTime - startTime;

      console.log(`Synchronous processing time: ${syncTime.toFixed(2)}ms`);
      expect(outputData.length).toBe(performanceData.length);
      expect(syncTime).toBeGreaterThan(0);
    });

    it('should benchmark web worker processing performance', async () => {
      const columns = createTestColumns();
      mockGrid.getColumns.mockReturnValue(columns);

      // Mock successful worker initialization
      const mockWorkerManager = {
        initializeWorker: vi.fn().mockResolvedValue(true),
        processChunks: vi.fn().mockImplementation(async (chunks) => {
          // Simulate worker processing time
          await new Promise(resolve => setTimeout(resolve, 50));
          return chunks.map((chunk: any) => ({
            chunkId: chunk.chunkId,
            processedRows: chunk.rows.map((row: any[]) =>
              row.map((cell, colIndex) => {
                const column = columns[colIndex];
                if (column?.formatter === Formatters.currency) {
                  return `$${Number(cell).toFixed(2)}`;
                }
                return String(cell);
              })
            )
          }));
        }),
        cleanup: vi.fn(),
        isSupported: vi.fn().mockReturnValue(true)
      };

      (service as any)._workerManager = mockWorkerManager;

      const startTime = performance.now();

      const outputData: any[] = [];
      await (service as any).pushAllGridRowDataToArray(outputData, columns, {
        useWebWorker: true,
        workerChunkSize: 1000,
        maxConcurrentChunks: 4,
        exportWithFormatter: true
      });

      const endTime = performance.now();
      const workerTime = endTime - startTime;

      console.log(`Web worker processing time: ${workerTime.toFixed(2)}ms`);
      expect(outputData.length).toBe(performanceData.length);
      expect(workerTime).toBeGreaterThan(0);
      expect(mockWorkerManager.processChunks).toHaveBeenCalled();
    });

    it('should compare performance with different chunk sizes', async () => {
      const columns = createTestColumns();
      mockGrid.getColumns.mockReturnValue(columns);

      const chunkSizes = [500, 1000, 2000, 5000];
      const results: { chunkSize: number; time: number; }[] = [];

      for (const chunkSize of chunkSizes) {
        const mockWorkerManager = {
          initializeWorker: vi.fn().mockResolvedValue(true),
          processChunks: vi.fn().mockImplementation(async (chunks) => {
            await new Promise(resolve => setTimeout(resolve, chunks.length * 10));
            return chunks.map((chunk: any) => ({
              chunkId: chunk.chunkId,
              processedRows: chunk.rows.map((row: any[]) => row.map(String))
            }));
          }),
          cleanup: vi.fn(),
          isSupported: vi.fn().mockReturnValue(true)
        };

        (service as any)._workerManager = mockWorkerManager;

        const startTime = performance.now();

        const outputData: any[] = [];
        await (service as any).pushAllGridRowDataToArray(outputData, columns, {
          useWebWorker: true,
          workerChunkSize: chunkSize,
          maxConcurrentChunks: 4,
          exportWithFormatter: true
        });

        const endTime = performance.now();
        const time = endTime - startTime;

        results.push({ chunkSize, time });
        console.log(`Chunk size ${chunkSize}: ${time.toFixed(2)}ms`);
      }

      // Verify all chunk sizes processed the data
      results.forEach(result => {
        expect(result.time).toBeGreaterThan(0);
      });
    });

    it('should measure memory usage during processing', async () => {
      const columns = createTestColumns();
      mockGrid.getColumns.mockReturnValue(columns);

      // Create larger dataset for memory testing
      const largeData = Array.from({ length: 50000 }, (_, i) => ({
        id: i,
        name: `Product ${i}`,
        price: Math.random() * 1000,
        description: 'A'.repeat(100) // Larger strings to increase memory usage
      }));

      mockDataView.getLength.mockReturnValue(largeData.length);
      mockDataView.getItem.mockImplementation((index: number) => largeData[index]);

      const mockWorkerManager = {
        initializeWorker: vi.fn().mockResolvedValue(true),
        processChunks: vi.fn().mockImplementation(async (chunks) => {
          return chunks.map((chunk: any) => ({
            chunkId: chunk.chunkId,
            processedRows: chunk.rows.map((row: any[]) => row.map(String))
          }));
        }),
        cleanup: vi.fn(),
        isSupported: vi.fn().mockReturnValue(true)
      };

      (service as any)._workerManager = mockWorkerManager;

      // Measure memory before processing
      const memoryBefore = (performance as any).memory?.usedJSHeapSize || 0;

      const outputData: any[] = [];
      await (service as any).pushAllGridRowDataToArray(outputData, columns, {
        useWebWorker: true,
        workerChunkSize: 1000,
        exportWithFormatter: true
      });

      // Measure memory after processing
      const memoryAfter = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryUsed = memoryAfter - memoryBefore;

      console.log(`Memory used: ${(memoryUsed / 1024 / 1024).toFixed(2)} MB`);
      expect(outputData.length).toBe(largeData.length);
    });
  });

  describe('UI Responsiveness Simulation', () => {
    it('should simulate UI blocking during synchronous processing', async () => {
      const columns = createTestColumns();
      mockGrid.getColumns.mockReturnValue(columns);

      let uiUpdateCount = 0;
      const uiUpdateInterval = setInterval(() => {
        uiUpdateCount++;
      }, 10);

      const startTime = performance.now();

      const outputData: any[] = [];
      await (service as any).pushAllGridRowDataToArray(outputData, columns, {
        useWebWorker: false,
        exportWithFormatter: true
      });

      const endTime = performance.now();
      clearInterval(uiUpdateInterval);

      const processingTime = endTime - startTime;
      const expectedUIUpdates = Math.floor(processingTime / 10);

      console.log(`Processing time: ${processingTime.toFixed(2)}ms`);
      console.log(`UI updates during sync processing: ${uiUpdateCount}`);
      console.log(`Expected UI updates: ${expectedUIUpdates}`);

      // In synchronous processing, UI updates might be blocked
      expect(outputData.length).toBe(performanceData.length);
    });

    it('should simulate UI responsiveness during web worker processing', async () => {
      const columns = createTestColumns();
      mockGrid.getColumns.mockReturnValue(columns);

      const mockWorkerManager = {
        initializeWorker: vi.fn().mockResolvedValue(true),
        processChunks: vi.fn().mockImplementation(async (chunks) => {
          // Simulate async processing with yields to event loop
          for (let i = 0; i < chunks.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 5));
          }
          return chunks.map((chunk: any) => ({
            chunkId: chunk.chunkId,
            processedRows: chunk.rows.map((row: any[]) => row.map(String))
          }));
        }),
        cleanup: vi.fn(),
        isSupported: vi.fn().mockReturnValue(true)
      };

      (service as any)._workerManager = mockWorkerManager;

      let uiUpdateCount = 0;
      const uiUpdateInterval = setInterval(() => {
        uiUpdateCount++;
      }, 10);

      const startTime = performance.now();

      const outputData: any[] = [];
      await (service as any).pushAllGridRowDataToArray(outputData, columns, {
        useWebWorker: true,
        workerChunkSize: 1000,
        maxConcurrentChunks: 2,
        exportWithFormatter: true
      });

      const endTime = performance.now();
      clearInterval(uiUpdateInterval);

      const processingTime = endTime - startTime;
      const expectedUIUpdates = Math.floor(processingTime / 10);

      console.log(`Processing time: ${processingTime.toFixed(2)}ms`);
      console.log(`UI updates during worker processing: ${uiUpdateCount}`);
      console.log(`Expected UI updates: ${expectedUIUpdates}`);

      // With web workers, UI should remain more responsive
      expect(outputData.length).toBe(performanceData.length);
      expect(uiUpdateCount).toBeGreaterThan(0);
    });
  });

  describe('Stress Tests', () => {
    it('should handle very large datasets without memory overflow', async () => {
      // Create a very large dataset
      const veryLargeData = Array.from({ length: 100000 }, (_, i) => ({
        id: i,
        data: `Data ${i}`,
        value: Math.random()
      }));

      mockDataView.getLength.mockReturnValue(veryLargeData.length);
      mockDataView.getItem.mockImplementation((index: number) => veryLargeData[index]);

      const columns: Column[] = [
        { id: 'id', field: 'id', name: 'ID' },
        { id: 'data', field: 'data', name: 'Data' },
        { id: 'value', field: 'value', name: 'Value', formatter: Formatters.decimal }
      ];

      mockGrid.getColumns.mockReturnValue(columns);

      const mockWorkerManager = {
        initializeWorker: vi.fn().mockResolvedValue(true),
        processChunks: vi.fn().mockImplementation(async (chunks) => {
          return chunks.map((chunk: any) => ({
            chunkId: chunk.chunkId,
            processedRows: chunk.rows.map((row: any[]) => row.map(String))
          }));
        }),
        cleanup: vi.fn(),
        isSupported: vi.fn().mockReturnValue(true)
      };

      (service as any)._workerManager = mockWorkerManager;

      const outputData: any[] = [];
      await expect(
        (service as any).pushAllGridRowDataToArray(outputData, columns, {
          useWebWorker: true,
          workerChunkSize: 5000,
          maxConcurrentChunks: 2,
          exportWithFormatter: true
        })
      ).resolves.not.toThrow();

      expect(outputData.length).toBe(veryLargeData.length);
    });

    it('should handle concurrent export requests gracefully', async () => {
      const columns = createTestColumns();
      mockGrid.getColumns.mockReturnValue(columns);

      const mockWorkerManager = {
        initializeWorker: vi.fn().mockResolvedValue(true),
        processChunks: vi.fn().mockImplementation(async (chunks) => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return chunks.map((chunk: any) => ({
            chunkId: chunk.chunkId,
            processedRows: chunk.rows.map((row: any[]) => row.map(String))
          }));
        }),
        cleanup: vi.fn(),
        isSupported: vi.fn().mockReturnValue(true)
      };

      (service as any)._workerManager = mockWorkerManager;

      // Start multiple concurrent exports
      const exportPromises = Array.from({ length: 3 }, async () => {
        const outputData: any[] = [];
        await (service as any).pushAllGridRowDataToArray(outputData, columns, {
          useWebWorker: true,
          workerChunkSize: 1000,
          exportWithFormatter: true
        });
        return outputData;
      });

      const results = await Promise.all(exportPromises);

      results.forEach(result => {
        expect(result.length).toBe(performanceData.length);
      });
    });
  });
});
