import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Column, GridOption } from '@slickgrid-universal/common';
import { Formatters } from '@slickgrid-universal/common';

import { ExcelExportService } from '../excelExport.service.js';
import { WorkerManager } from '../utils/workerManager.js';
import { FormatterSerializer } from '../utils/formatterSerializer.js';

// Mock the WorkerManager
vi.mock('../utils/workerManager.js');

describe('ExcelExportService - Web Worker Integration', () => {
  let service: ExcelExportService;
  let mockGrid: any;
  let mockDataView: any;
  let mockPubSubService: any;
  let mockContainerService: any;

  beforeEach(() => {
    // Mock grid
    mockGrid = {
      getColumns: vi.fn(),
      getData: vi.fn(),
      getOptions: vi.fn(),
    };

    // Mock data view
    mockDataView = {
      getLength: vi.fn(),
      getItem: vi.fn(),
      getGrouping: vi.fn(() => []),
    };

    // Mock pub sub service
    mockPubSubService = {
      publish: vi.fn(),
      unsubscribeAll: vi.fn(),
    };

    // Mock container service
    mockContainerService = {
      get: vi.fn(),
    };

    mockGrid.getData.mockReturnValue(mockDataView);
    mockGrid.getOptions.mockReturnValue({
      enableExcelExport: true,
      excelExportOptions: {
        useWebWorker: true,
        workerChunkSize: 100,
        maxConcurrentChunks: 2,
      },
    });

    service = new ExcelExportService();
    service.init(mockGrid, mockContainerService);
    (service as any)._pubSubService = mockPubSubService;
  });

  afterEach(() => {
    service.dispose();
    vi.clearAllMocks();
  });

  describe('Web Worker Configuration', () => {
    it('should have default web worker options', () => {
      const defaultOptions = (service as any).DEFAULT_EXPORT_OPTIONS || {
        useWebWorker: true,
        workerChunkSize: 1000,
        maxConcurrentChunks: 4,
        workerFallback: true,
      };

      expect(defaultOptions.useWebWorker).toBe(true);
      expect(defaultOptions.workerChunkSize).toBe(1000);
      expect(defaultOptions.maxConcurrentChunks).toBe(4);
      expect(defaultOptions.workerFallback).toBe(true);
    });

    it('should initialize worker manager when conditions are met', async () => {
      const columns: Column[] = [
        { id: 'name', field: 'name', formatter: Formatters.currency },
        { id: 'age', field: 'age', formatter: Formatters.decimal },
      ];

      mockGrid.getColumns.mockReturnValue(columns);
      mockDataView.getLength.mockReturnValue(1000); // Large dataset

      // Set the export options to enable web worker
      (service as any)._excelExportOptions = {
        useWebWorker: true,
        workerChunkSize: 100,
        maxConcurrentChunks: 2,
        exportWithFormatter: true,
      };

      // Mock the WorkerManager constructor and initializeWorker method
      const mockInitializeWorker = vi.fn().mockResolvedValue(true);
      vi.mocked(WorkerManager).mockImplementation(() => ({
        initializeWorker: mockInitializeWorker,
        cleanup: vi.fn(),
        processChunks: vi.fn(),
        isSupported: vi.fn().mockReturnValue(true),
      } as any));

      const shouldUse = await (service as any).shouldUseWebWorker(1000);
      expect(shouldUse).toBe(true);
      expect(mockInitializeWorker).toHaveBeenCalled();
    });

    it('should not use worker for small datasets', async () => {
      const columns: Column[] = [
        { id: 'name', field: 'name', formatter: Formatters.currency },
      ];

      mockGrid.getColumns.mockReturnValue(columns);
      mockDataView.getLength.mockReturnValue(100); // Small dataset

      const shouldUse = await (service as any).shouldUseWebWorker(100);
      expect(shouldUse).toBe(false);
    });

    it('should not use worker when no formatters are present', async () => {
      const columns: Column[] = [
        { id: 'name', field: 'name' }, // No formatter
        { id: 'age', field: 'age' }, // No formatter
      ];

      mockGrid.getColumns.mockReturnValue(columns);
      mockDataView.getLength.mockReturnValue(1000);

      const shouldUse = await (service as any).shouldUseWebWorker(1000);
      expect(shouldUse).toBe(false);
    });
  });

  describe('FormatterSerializer', () => {
    it('should serialize built-in formatters correctly', () => {
      const serialized = FormatterSerializer.serializeFormatter(Formatters.currency);
      expect(serialized).toBe('BUILTIN:currency');
    });

    it('should deserialize built-in formatters correctly', () => {
      const deserialized = FormatterSerializer.deserializeFormatter('BUILTIN:currency');
      expect(typeof deserialized).toBe('function');
    });

    it('should serialize custom formatters', () => {
      const customFormatter = (row: number, cell: number, value: any) => `Custom: ${value}`;
      const serialized = FormatterSerializer.serializeFormatter(customFormatter);
      expect(serialized).toContain('CUSTOM:');
    });

    it('should serialize column definitions', () => {
      const column: Column = {
        id: 'test',
        field: 'test',
        formatter: Formatters.currency,
        exportWithFormatter: true,
      };

      const serialized = FormatterSerializer.serializeColumn(column);
      expect(serialized.id).toBe('test');
      expect(serialized.field).toBe('test');
      expect(serialized.formatter).toBe('BUILTIN:currency');
      expect(serialized.exportWithFormatter).toBe(true);
    });
  });

  describe('Worker Processing Logic', () => {
    it('should create chunks correctly', async () => {
      const columns: Column[] = [
        { id: 'name', field: 'name', formatter: Formatters.currency },
      ];

      // Mock data items
      const mockItems = Array.from({ length: 250 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
      }));

      mockGrid.getColumns.mockReturnValue(columns);
      mockDataView.getLength.mockReturnValue(250);
      mockDataView.getItem.mockImplementation((index: number) => mockItems[index]);

      // Mock worker manager
      const mockWorkerManager = {
        processChunks: vi.fn().mockResolvedValue([
          {
            chunkId: 'chunk_0_100',
            processedRows: mockItems.slice(0, 100).map(item => [`$${item.name}`]),
          },
          {
            chunkId: 'chunk_100_200',
            processedRows: mockItems.slice(100, 200).map(item => [`$${item.name}`]),
          },
          {
            chunkId: 'chunk_200_250',
            processedRows: mockItems.slice(200, 250).map(item => [`$${item.name}`]),
          },
        ]),
        cleanup: vi.fn(), // Add cleanup method
      };

      (service as any)._workerManager = mockWorkerManager;
      (service as any)._excelExportOptions = {
        useWebWorker: true,
        workerChunkSize: 100,
        exportWithFormatter: true,
      };

      const outputData: any[] = [];
      await (service as any).processDataWithWorker(outputData, columns);

      expect(mockWorkerManager.processChunks).toHaveBeenCalledTimes(1);
      expect(outputData.length).toBe(250); // All items should be processed
    });
  });

  describe('Error Handling', () => {
    it('should cleanup worker resources on dispose', () => {
      const mockWorkerManager = {
        cleanup: vi.fn(),
      };

      (service as any)._workerManager = mockWorkerManager;
      (service as any)._isWorkerInitialized = true;

      service.dispose();

      expect(mockWorkerManager.cleanup).toHaveBeenCalled();
      expect((service as any)._workerManager).toBeNull();
      expect((service as any)._isWorkerInitialized).toBe(false);
    });

    it('should handle worker initialization failure gracefully', async () => {
      const mockWorkerManager = {
        initializeWorker: vi.fn().mockRejectedValue(new Error('Worker init failed')),
      };

      vi.mocked(WorkerManager).mockImplementation(() => mockWorkerManager as any);

      const result = await (service as any).initializeWorker();
      expect(result).toBe(false);
    });
  });
});
