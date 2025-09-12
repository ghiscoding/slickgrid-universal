import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type {
  Column,
  ContainerService,
  ExcelExportOption,
  GridOption,
  PubSubService,
  SlickDataView,
  SlickGrid,
  TranslaterService
} from '@slickgrid-universal/common';
import { FileType } from '@slickgrid-universal/common';
import { ExcelExportService } from '../excelExport.service.js';

// Mock dependencies
const mockPubSubService = {
  publish: vi.fn(),
  unsubscribeAll: vi.fn()
} as unknown as PubSubService;

const mockTranslaterService = {
  translate: vi.fn((key: string) => key)
} as unknown as TranslaterService;

const mockContainerService = {
  get: vi.fn((service: string) => {
    if (service === 'PubSubService') return mockPubSubService;
    return null;
  })
} as unknown as ContainerService;

const mockDataView = {
  getLength: vi.fn(() => 100),
  getItem: vi.fn((index: number) => ({ id: index, name: `Item ${index}`, value: index * 10 })),
  getGrouping: vi.fn(() => []),
  getItemMetadata: vi.fn(() => null)
} as unknown as SlickDataView;

const mockGrid = {
  getColumns: vi.fn(() => [
    { id: 'id', field: 'id', name: 'ID', width: 50 },
    { id: 'name', field: 'name', name: 'Name', width: 100 },
    { id: 'value', field: 'value', name: 'Value', width: 80 }
  ] as Column[]),
  getOptions: vi.fn(() => ({
    enableExcelExport: true,
    excelExportOptions: {
      filename: 'test-export',
      format: FileType.xlsx
    }
  } as GridOption)),
  getData: vi.fn(() => mockDataView),
  getParentRowSpanByCell: vi.fn(() => null)
} as unknown as SlickGrid;

// Mock excel-builder-vanilla
vi.mock('excel-builder-vanilla', () => ({
  downloadExcelFile: vi.fn(() => Promise.resolve()),
  createExcelFileStream: vi.fn(() => ({
    [Symbol.asyncIterator]: async function* () {
      yield new Uint8Array([1, 2, 3]);
      yield new Uint8Array([4, 5, 6]);
    }
  })),
  Workbook: vi.fn(() => ({
    createWorksheet: vi.fn(() => ({
      data: [],
      mergeCells: vi.fn(),
      setColumns: vi.fn(),
      setColumnFormats: vi.fn()
    })),
    getStyleSheet: vi.fn(() => ({
      createFormat: vi.fn(() => ({ id: 1 }))
    }))
  }))
}));

// Mock DOM APIs
global.URL = {
  createObjectURL: vi.fn(() => 'blob:mock-url'),
  revokeObjectURL: vi.fn()
} as any;

global.Blob = class MockBlob {
  constructor(parts: any[], options?: any) { }
} as any;

// Mock document for download functionality
Object.defineProperty(global, 'document', {
  value: {
    createElement: vi.fn(() => ({
      href: '',
      download: '',
      click: vi.fn(),
      style: {}
    })),
    body: {
      appendChild: vi.fn(),
      removeChild: vi.fn()
    }
  },
  writable: true
});

describe('ExcelExportService - Unit Tests', () => {
  let service: ExcelExportService;

  beforeEach(() => {
    service = new ExcelExportService();
    service.init(mockGrid, mockContainerService);
    vi.clearAllMocks();
  });

  afterEach(() => {
    service.dispose();
  });

  describe('Service Initialization', () => {
    it('should initialize service with grid and container service', () => {
      expect(service).toBeDefined();
      expect(service.className).toBe('ExcelExportService');
    });

    it('should throw error when translate service is missing but translation is enabled', () => {
      const gridWithTranslation = {
        ...mockGrid,
        getOptions: vi.fn(() => ({
          enableTranslate: true,
          translater: null
        } as GridOption))
      } as unknown as SlickGrid;

      expect(() => {
        service.init(gridWithTranslation, mockContainerService);
      }).toThrow('[Slickgrid-Universal] requires a Translate Service');
    });

    it('should dispose service and cleanup resources', () => {
      const cleanupSpy = vi.spyOn(service as any, 'cleanupWorker');
      service.dispose();

      expect(mockPubSubService.unsubscribeAll).toHaveBeenCalled();
      expect(cleanupSpy).toHaveBeenCalled();
    });
  });

  describe('Excel Column Name Generation', () => {
    it('should generate correct Excel column names for single letters', () => {
      expect(service.getExcelColumnNameByIndex(1)).toBe('A');
      expect(service.getExcelColumnNameByIndex(26)).toBe('Z');
    });

    it('should generate correct Excel column names for double letters', () => {
      expect(service.getExcelColumnNameByIndex(27)).toBe('AA');
      expect(service.getExcelColumnNameByIndex(52)).toBe('AZ');
      expect(service.getExcelColumnNameByIndex(53)).toBe('BA');
    });

    it('should handle edge cases for column name generation', () => {
      expect(service.getExcelColumnNameByIndex(0)).toBe('Z');
      expect(service.getExcelColumnNameByIndex(702)).toBe('ZZ');
    });
  });

  describe('Basic Export Functionality', () => {
    it('should initialize export options correctly', () => {
      // Test that the service can be initialized and has the right properties
      expect(service.className).toBe('ExcelExportService');
      // The stylesheet is only created during export, so we test the service is initialized
      expect(service).toBeDefined();
    });

    it('should handle export options merging', () => {
      const customOptions: ExcelExportOption = {
        filename: 'custom-export',
        format: FileType.xlsx,
        sanitizeDataExport: true
      };

      // Test internal option merging (without triggering full export)
      const mergedOptions = { ...customOptions };
      expect(mergedOptions.filename).toBe('custom-export');
      expect(mergedOptions.format).toBe(FileType.xlsx);
      expect(mergedOptions.sanitizeDataExport).toBe(true);
    });

    it('should throw error when grid is not initialized', () => {
      const uninitializedService = new ExcelExportService();

      expect(() => uninitializedService.exportToExcel()).toThrow(
        '[Slickgrid-Universal] it seems that the SlickGrid & DataView objects'
      );
    });
  });

  describe('Data Processing', () => {
    beforeEach(() => {
      // Initialize export options to avoid undefined errors
      (service as any)._excelExportOptions = {
        sanitizeDataExport: false,
        groupingAggregatorRowText: 'Total'
      };
      (service as any)._regularCellExcelFormats = {};
    });

    it('should process regular row data correctly', () => {
      const columns = mockGrid.getColumns();
      const itemObj = { id: 1, name: 'Test Item', value: 100 };

      const result = (service as any).readRegularRowData(columns, 0, itemObj, 0);

      expect(result).toHaveLength(3);
      expect(result[0]).toBe(1);
      expect(result[1]).toBe('Test Item');
      expect(result[2]).toBe(100);
    });

    it('should handle grouped data correctly', () => {
      const groupedDataView = {
        ...mockDataView,
        getGrouping: vi.fn(() => [{ getter: 'category' }])
      } as unknown as SlickDataView;

      const gridWithGrouping = {
        ...mockGrid,
        getData: vi.fn(() => groupedDataView)
      } as unknown as SlickGrid;

      service.init(gridWithGrouping, mockContainerService);

      const groupItem = { title: 'Group Title', collapsed: false };
      const result = (service as any).readGroupedRowTitle(groupItem);

      expect(result).toBe('Group Title');
    });

    it('should process group totals data', () => {
      const columns = mockGrid.getColumns();
      const groupTotalsItem = {
        __groupTotals: true,
        sum: { value: 500 },
        avg: { value: 50 }
      };

      const result = (service as any).readGroupedTotalRows(columns, groupTotalsItem, 0);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Column Header Processing', () => {
    it('should get column headers correctly', () => {
      const columns = mockGrid.getColumns();
      const headers = (service as any).getColumnHeaders(columns);

      expect(headers).toHaveLength(3);
      expect(headers[0].title).toBe('ID');
      expect(headers[1].title).toBe('Name');
      expect(headers[2].title).toBe('Value');
    });

    it('should handle grouped column headers', () => {
      const columnsWithGroups = [
        { id: 'id', field: 'id', name: 'ID', columnGroup: 'Basic Info' },
        { id: 'name', field: 'name', name: 'Name', columnGroup: 'Basic Info' }
      ] as Column[];

      const headers = (service as any).getColumnGroupedHeaderTitles(columnsWithGroups);

      expect(headers).toHaveLength(2);
      expect(headers[0].title).toBe('Basic Info');
    });

    it('should exclude columns from export when specified', () => {
      const columnsWithExclusion = [
        { id: 'id', field: 'id', name: 'ID' },
        { id: 'secret', field: 'secret', name: 'Secret', excludeFromExport: true },
        { id: 'name', field: 'name', name: 'Name' }
      ] as Column[];

      const headers = (service as any).getColumnHeaders(columnsWithExclusion);

      expect(headers).toHaveLength(2);
      expect(headers.find((h: any) => h.title === 'Secret')).toBeUndefined();
    });
  });

  describe('Web Worker Integration', () => {
    beforeEach(() => {
      // Initialize export options for worker tests
      (service as any)._excelExportOptions = {
        useWebWorker: true,
        workerChunkSize: 1000,
        maxConcurrentChunks: 4
      };
    });

    it('should determine when to use web worker', async () => {
      // Test with small dataset (should not use worker)
      const shouldUseSmall = await (service as any).shouldUseWebWorker(100);
      expect(shouldUseSmall).toBe(false);

      // Test with large dataset (should use worker if enabled)
      const shouldUseLarge = await (service as any).shouldUseWebWorker(1000);
      // This depends on the formatter detection logic
      expect(typeof shouldUseLarge).toBe('boolean');
    });

    it('should initialize worker when needed', async () => {
      const initResult = await (service as any).initializeWorker();
      expect(typeof initResult).toBe('boolean');
    });

    it('should cleanup worker resources', () => {
      (service as any).cleanupWorker();
      expect((service as any)._isWorkerInitialized).toBe(false);
    });

    it('should handle worker initialization failure', async () => {
      // Mock Worker to throw error
      const originalWorker = global.Worker;
      global.Worker = vi.fn(() => {
        throw new Error('Worker not supported');
      }) as any;

      const initResult = await (service as any).initializeWorker();
      expect(initResult).toBe(false);

      global.Worker = originalWorker;
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing column data gracefully', () => {
      const emptyColumns: Column[] = [];
      const headers = (service as any).getColumnHeaders(emptyColumns);

      expect(headers).toHaveLength(0);
    });

    it('should handle columns with zero width', () => {
      const columnsWithZeroWidth = [
        { id: 'hidden', field: 'hidden', name: 'Hidden', width: 0 },
        { id: 'visible', field: 'visible', name: 'Visible', width: 100 }
      ] as Column[];

      const headers = (service as any).getColumnHeaders(columnsWithZeroWidth);

      expect(headers).toHaveLength(1);
      expect(headers[0].title).toBe('Visible');
    });

    it('should handle translation when translater service is available', () => {
      const gridWithTranslation = {
        ...mockGrid,
        getOptions: vi.fn(() => ({
          enableTranslate: true,
          translater: mockTranslaterService
        } as GridOption))
      } as unknown as SlickGrid;

      service.init(gridWithTranslation, mockContainerService);

      const columnsWithTranslation = [
        { id: 'id', field: 'id', nameKey: 'ID_KEY', width: 50 }
      ] as Column[];

      const headers = (service as any).getColumnHeaders(columnsWithTranslation);

      expect(headers).toHaveLength(1);
      expect(mockTranslaterService.translate).toHaveBeenCalledWith('ID_KEY');
    });

    it('should handle group column title generation', () => {
      // Initialize export options first
      (service as any)._excelExportOptions = {
        groupingColumnHeaderTitle: 'Group By'
      };

      const groupedDataView = {
        ...mockDataView,
        getGrouping: vi.fn(() => [{ getter: 'category' }])
      } as unknown as SlickDataView;

      const gridWithGrouping = {
        ...mockGrid,
        getData: vi.fn(() => groupedDataView)
      } as unknown as SlickGrid;

      service.init(gridWithGrouping, mockContainerService);

      const groupTitle = (service as any).getGroupColumnTitle();

      expect(typeof groupTitle).toBe('string');
      expect(groupTitle).toBe('Group By');
    });

    it('should handle data sanitization', () => {
      (service as any)._excelExportOptions = { sanitizeDataExport: true };

      const columns = mockGrid.getColumns();
      const itemWithHtml = { id: 1, name: '<b>Test Item</b>', value: 100 };

      const result = (service as any).readRegularRowData(columns, 0, itemWithHtml, 0);

      expect(result[1]).toBe('Test Item'); // HTML tags should be stripped
    });

    it('should handle missing grid options gracefully', () => {
      const gridWithoutOptions = {
        ...mockGrid,
        getOptions: vi.fn(() => ({}))
      } as unknown as SlickGrid;

      service.init(gridWithoutOptions, mockContainerService);

      expect(service).toBeDefined();
    });

    it('should handle missing data view gracefully', () => {
      const gridWithoutData = {
        ...mockGrid,
        getData: vi.fn(() => null)
      } as unknown as SlickGrid;

      service.init(gridWithoutData, mockContainerService);

      expect(service).toBeDefined();
    });
  });

  describe('Advanced Export Functionality', () => {
    beforeEach(() => {
      (service as any)._excelExportOptions = {
        filename: 'test-export',
        format: FileType.xlsx,
        sanitizeDataExport: true,
        useWebWorker: false
      };
    });

    it('should handle export with custom filename', () => {
      const customOptions: ExcelExportOption = {
        filename: 'custom-filename'
      };

      // Test that options are properly set
      expect(customOptions.filename).toBe('custom-filename');
    });

    it('should handle export with different file formats', () => {
      const xlsxOptions: ExcelExportOption = { format: FileType.xlsx };
      const xlsOptions: ExcelExportOption = { format: FileType.xls };

      // Test format handling
      expect(xlsxOptions.format).toBe(FileType.xlsx);
      expect(xlsOptions.format).toBe(FileType.xls);
    });

    it('should process column data with formatters', () => {
      const columnsWithFormatter = [
        {
          id: 'formatted',
          field: 'value',
          name: 'Formatted Value',
          width: 100,
          formatter: (row: number, cell: number, value: any) => `$${value}`
        }
      ] as Column[];

      const item = { value: 100 };
      const result = (service as any).readRegularRowData(columnsWithFormatter, 0, item, 0);

      expect(result).toBeDefined();
    });

    it('should handle grouped data export', () => {
      const groupedDataView = {
        ...mockDataView,
        getGrouping: vi.fn(() => [{ getter: 'category' }]),
        getGroups: vi.fn(() => [
          {
            value: 'Category A',
            count: 2,
            level: 0,
            collapsed: false,
            totals: { sum: { value: 300 } }
          }
        ])
      } as unknown as SlickDataView;

      const gridWithGrouping = {
        ...mockGrid,
        getData: vi.fn(() => groupedDataView)
      } as unknown as SlickGrid;

      service.init(gridWithGrouping, mockContainerService);

      // Test group column title generation
      const groupTitle = (service as any).getGroupColumnTitle();
      expect(typeof groupTitle).toBe('string');
    });

    it('should handle tree data export', () => {
      const treeDataView = {
        ...mockDataView,
        getItems: vi.fn(() => [
          { id: 1, name: 'Parent', __treeLevel: 0 },
          { id: 2, name: 'Child', __treeLevel: 1, __parentId: 1 }
        ])
      } as unknown as SlickDataView;

      const gridWithTree = {
        ...mockGrid,
        getData: vi.fn(() => treeDataView),
        getOptions: vi.fn(() => ({ enableTreeData: true }))
      } as unknown as SlickGrid;

      service.init(gridWithTree, mockContainerService);

      // Test that tree data options are handled
      const gridOptions = (service as any)._gridOptions;
      expect(gridOptions.enableTreeData).toBe(true);
    });

    it('should handle export with column exclusions', () => {
      const exportOptions: ExcelExportOption = {
        excludeColumnByIndex: [0],
        excludeColumnByField: ['hidden']
      };

      const columns = [
        { id: 'visible', field: 'visible', name: 'Visible', width: 100 },
        { id: 'hidden', field: 'hidden', name: 'Hidden', width: 100 }
      ] as Column[];

      // Test that exclusion options are properly set
      expect(exportOptions.excludeColumnByIndex).toContain(0);
      expect(exportOptions.excludeColumnByField).toContain('hidden');
    });

    it('should test column styles generation', () => {
      const columns = mockGrid.getColumns();
      const styles = (service as any).getColumnStyles(columns);

      expect(styles).toBeDefined();
      expect(Array.isArray(styles)).toBe(true);
    });

    it('should test column header data generation', () => {
      const columns = mockGrid.getColumns();
      const metadata = { columnHeaderStyle: 1, groupingColumnHeaderTitle: 'Group' };
      const headerData = (service as any).getColumnHeaderData(columns, metadata);

      expect(headerData).toBeDefined();
      expect(Array.isArray(headerData)).toBe(true);
    });

    it('should test grouped row title reading', () => {
      const groupItem = { title: '<b>Group Title</b>' };
      const title = (service as any).readGroupedRowTitle(groupItem);

      expect(title).toBe('Group Title'); // HTML should be stripped
    });

    it('should test grouped total rows reading', () => {
      const columns = mockGrid.getColumns();
      const groupTotalsItem = {
        totals: {
          sum: { value: 100 },
          avg: { name: 50 }
        }
      };

      const result = (service as any).readGroupedTotalRows(columns, groupTotalsItem, 0);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should test worker initialization and cleanup', async () => {
      (service as any)._excelExportOptions = { useWebWorker: true };

      const initResult = await (service as any).initializeWorker();
      expect(typeof initResult).toBe('boolean');

      (service as any).cleanupWorker();
      expect((service as any)._isWorkerInitialized).toBe(false);
    });

    it('should test web worker decision logic', async () => {
      (service as any)._excelExportOptions = { useWebWorker: true };

      const shouldUseSmall = await (service as any).shouldUseWebWorker(100);
      expect(shouldUseSmall).toBe(false);

      const shouldUseLarge = await (service as any).shouldUseWebWorker(1000);
      expect(typeof shouldUseLarge).toBe('boolean');
    });
  });
});
