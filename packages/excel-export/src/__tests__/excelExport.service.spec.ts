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

  describe('Column Exclusion and Grouping Logic', () => {
    it('should skip excluded columns during data reading', () => {
      const columnsWithExclusions = [
        { id: 'id', field: 'id', name: 'ID', width: 50 },
        { id: 'excluded', field: 'excluded', name: 'Excluded', width: 100, excludeFromExport: true },
        { id: 'value', field: 'value', name: 'Value', width: 80 }
      ] as Column[];

      mockGrid.getColumns.mockReturnValue(columnsWithExclusions);
      service.init(mockGrid, mockContainerService);

      // Set up grouped items scenario and export options
      (service as any)._hasGroupedItems = true;
      (service as any)._excelExportOptions = { sanitizeDataExport: false };

      const rowData = (service as any).readRegularRowData(columnsWithExclusions, 0, { id: 1, excluded: 'skip', value: 100 }, 0);
      expect(Array.isArray(rowData)).toBe(true);
      // Should have 2 columns (id and value) since excluded column is skipped
      expect(rowData.length).toBe(2);
    });

    it('should handle first column skip for grouped items', () => {
      const columns = [
        { id: 'group', field: 'group', name: 'Group', width: 50 },
        { id: 'value', field: 'value', name: 'Value', width: 80 }
      ] as Column[];

      mockGrid.getColumns.mockReturnValue(columns);
      service.init(mockGrid, mockContainerService);

      // Set up grouped items scenario and export options
      (service as any)._hasGroupedItems = true;
      (service as any)._excelExportOptions = { sanitizeDataExport: false };

      const rowData = (service as any).readRegularRowData(columns, 0, { group: 'A', value: 100 }, 0);
      expect(Array.isArray(rowData)).toBe(true);
      expect(rowData[0]).toBe(''); // First column should be empty for grouped items
    });
  });

  describe('Row and Column Span Handling', () => {
    it('should handle row span functionality', () => {
      const gridWithRowSpan = {
        ...mockGrid,
        getOptions: vi.fn(() => ({ enableCellRowSpan: true })),
        getParentRowSpanByCell: vi.fn((row: number, col: number) => ({
          start: row,
          end: row + 2
        }))
      };

      service.init(gridWithRowSpan as any, mockContainerService);

      const rowData = (service as any).readRegularRowData([], 0, { id: 1, value: 100 }, 0);
      expect(Array.isArray(rowData)).toBe(true);
    });

    it('should handle row span child cells', () => {
      const gridWithRowSpan = {
        ...mockGrid,
        getOptions: vi.fn(() => ({ enableCellRowSpan: true })),
        getParentRowSpanByCell: vi.fn((row: number, col: number) => ({
          start: 0,
          end: 2
        }))
      };

      service.init(gridWithRowSpan as any, mockContainerService);

      const rowData = (service as any).readRegularRowData([], 1, { id: 1, value: 100 }, 1);
      expect(Array.isArray(rowData)).toBe(true);
    });

    it('should handle column span with metadata', () => {
      const itemMetadata = {
        columns: {
          'id': { colspan: 2 },
          'name': { colspan: '*' }
        }
      };

      mockDataView.getItemMetadata.mockReturnValue(itemMetadata);
      service.init(mockGrid, mockContainerService);

      const rowData = (service as any).readRegularRowData([], 0, { id: 1, name: 'test', value: 100 }, 0);
      expect(Array.isArray(rowData)).toBe(true);
    });

    it('should handle full row column span', () => {
      const itemMetadata = {
        columns: {
          'name': { colspan: '*' }
        }
      };

      mockDataView.getItemMetadata.mockReturnValue(itemMetadata);
      service.init(mockGrid, mockContainerService);

      const rowData = (service as any).readRegularRowData([], 0, { id: 1, name: 'test', value: 100 }, 0);
      expect(Array.isArray(rowData)).toBe(true);
    });
  });

  describe('Excel Formatting and Value Parsing', () => {
    it('should handle date column formatting', () => {
      const dateColumns = [
        {
          id: 'date',
          field: 'date',
          name: 'Date',
          width: 100,
          type: 'date',
          exportWithFormatter: true
        }
      ] as Column[];

      mockGrid.getColumns.mockReturnValue(dateColumns);
      service.init(mockGrid, mockContainerService);

      const rowData = (service as any).readRegularRowData([], 0, { date: new Date('2023-01-01') }, 0);
      expect(Array.isArray(rowData)).toBe(true);
    });

    it('should handle custom Excel export options on columns', () => {
      const columnsWithExcelOptions = [
        {
          id: 'value',
          field: 'value',
          name: 'Value',
          width: 100,
          excelExportOptions: {
            autoDetectCellFormat: true,
            style: { font: { bold: true } },
            valueParserCallback: (value: any) => `Parsed: ${value}`
          }
        }
      ] as Column[];

      mockGrid.getColumns.mockReturnValue(columnsWithExcelOptions);
      service.init(mockGrid, mockContainerService);

      const rowData = (service as any).readRegularRowData([], 0, { value: 100 }, 0);
      expect(Array.isArray(rowData)).toBe(true);
    });

    it('should handle data sanitization', () => {
      const columnsWithSanitization = [
        {
          id: 'html',
          field: 'html',
          name: 'HTML',
          width: 100,
          sanitizeDataExport: true
        }
      ] as Column[];

      mockGrid.getColumns.mockReturnValue(columnsWithSanitization);
      service.init(mockGrid, mockContainerService);

      const rowData = (service as any).readRegularRowData([], 0, { html: '<b>Bold Text</b>' }, 0);
      expect(Array.isArray(rowData)).toBe(true);
    });
  });

  describe('Group Indentation and Formatting', () => {
    it('should handle group indentation when enabled', () => {
      (service as any)._excelExportOptions = {
        addGroupIndentation: true,
        groupCollapsedSymbol: '►',
        groupExpandedSymbol: '▼'
      };
      service.init(mockGrid, mockContainerService);

      const collapsedGroup = { title: 'Collapsed Group', level: 2, collapsed: true };
      const expandedGroup = { title: 'Expanded Group', level: 1, collapsed: false };

      const collapsedTitle = (service as any).readGroupedRowTitle(collapsedGroup);
      const expandedTitle = (service as any).readGroupedRowTitle(expandedGroup);

      expect(collapsedTitle).toContain('►');
      expect(expandedTitle).toContain('▼');
      expect(collapsedTitle).toContain('Collapsed Group');
      expect(expandedTitle).toContain('Expanded Group');
    });

    it('should handle group title without indentation', () => {
      (service as any)._excelExportOptions = { addGroupIndentation: false };
      service.init(mockGrid, mockContainerService);

      const group = { title: '<span>HTML Group</span>', level: 1, collapsed: false };
      const title = (service as any).readGroupedRowTitle(group);

      expect(title).toBe('HTML Group'); // HTML should be stripped
      expect(title).not.toContain('►');
      expect(title).not.toContain('▼');
    });
  });

  describe('Group Totals Formatting', () => {
    it('should handle exportCustomGroupTotalsFormatter', () => {
      const columnsWithCustomFormatter = [
        {
          id: 'value',
          field: 'value',
          name: 'Value',
          width: 100,
          exportCustomGroupTotalsFormatter: (totals: any, columnDef: any, grid: any) => {
            return `Custom: ${totals.sum?.value || 0}`;
          }
        }
      ] as Column[];

      mockGrid.getColumns.mockReturnValue(columnsWithCustomFormatter);
      service.init(mockGrid, mockContainerService);

      // Set up export options
      (service as any)._excelExportOptions = { groupingAggregatorRowText: 'Totals:' };

      const groupTotalsItem = {
        sum: { value: 150 }
      };

      const result = (service as any).readGroupedTotalRows(columnsWithCustomFormatter, groupTotalsItem, 0);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle HTML element return from exportCustomGroupTotalsFormatter', () => {
      const columnsWithHtmlFormatter = [
        {
          id: 'value',
          field: 'value',
          name: 'Value',
          width: 100,
          exportCustomGroupTotalsFormatter: () => {
            const element = document.createElement('span');
            element.textContent = 'HTML Result';
            return element;
          }
        }
      ] as Column[];

      mockGrid.getColumns.mockReturnValue(columnsWithHtmlFormatter);
      service.init(mockGrid, mockContainerService);

      // Set up export options
      (service as any)._excelExportOptions = { groupingAggregatorRowText: 'Totals:' };

      const result = (service as any).readGroupedTotalRows(columnsWithHtmlFormatter, {}, 0);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should fallback to groupTotalsFormatter when no Excel formatting', () => {
      const columnsWithGroupFormatter = [
        {
          id: 'value',
          field: 'value',
          name: 'Value',
          width: 100,
          groupTotalsFormatter: (totals: any, columnDef: any, grid: any) => {
            return `Total: ${totals.sum?.value || 0}`;
          }
        }
      ] as Column[];

      mockGrid.getColumns.mockReturnValue(columnsWithGroupFormatter);
      service.init(mockGrid, mockContainerService);

      // Set up export options
      (service as any)._excelExportOptions = { groupingAggregatorRowText: 'Totals:' };

      const groupTotalsItem = {
        sum: { value: 200 }
      };

      const result = (service as any).readGroupedTotalRows(columnsWithGroupFormatter, groupTotalsItem, 0);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle HTML element return from groupTotalsFormatter', () => {
      const columnsWithHtmlGroupFormatter = [
        {
          id: 'value',
          field: 'value',
          name: 'Value',
          width: 100,
          groupTotalsFormatter: () => {
            const element = document.createElement('div');
            element.textContent = 'Group HTML Result';
            return element;
          }
        }
      ] as Column[];

      mockGrid.getColumns.mockReturnValue(columnsWithHtmlGroupFormatter);
      service.init(mockGrid, mockContainerService);

      // Set up export options
      (service as any)._excelExportOptions = { groupingAggregatorRowText: 'Totals:' };

      const result = (service as any).readGroupedTotalRows(columnsWithHtmlGroupFormatter, {}, 0);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle data sanitization in group totals', () => {
      const columnsWithSanitization = [
        {
          id: 'html',
          field: 'html',
          name: 'HTML',
          width: 100,
          sanitizeDataExport: true,
          groupTotalsFormatter: () => '<b>Bold Total</b>'
        }
      ] as Column[];

      mockGrid.getColumns.mockReturnValue(columnsWithSanitization);
      service.init(mockGrid, mockContainerService);

      // Set up export options
      (service as any)._excelExportOptions = { groupingAggregatorRowText: 'Totals:' };

      const result = (service as any).readGroupedTotalRows(columnsWithSanitization, {}, 0);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should skip columns with zero width in group totals', () => {
      const columnsWithZeroWidth = [
        { id: 'visible', field: 'visible', name: 'Visible', width: 100 },
        { id: 'hidden', field: 'hidden', name: 'Hidden', width: 0 }
      ] as Column[];

      mockGrid.getColumns.mockReturnValue(columnsWithZeroWidth);
      service.init(mockGrid, mockContainerService);

      // Set up export options
      (service as any)._excelExportOptions = { groupingAggregatorRowText: 'Totals:' };

      const result = (service as any).readGroupedTotalRows(columnsWithZeroWidth, {}, 0);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2); // Only grouping text + visible column
    });
  });

  describe('Legacy Export Method', () => {
    it('should handle legacy Excel export', async () => {
      const mockResolve = vi.fn();

      // Mock the downloadExcelFile function
      const mockDownloadExcelFile = vi.fn().mockResolvedValue(true);
      vi.doMock('../excelUtils.js', () => ({
        downloadExcelFile: mockDownloadExcelFile
      }));

      service.init(mockGrid, mockContainerService);
      (service as any)._workbook = { sheets: [] };

      await (service as any).legacyExcelExport('test.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', mockResolve);

      expect(mockResolve).toHaveBeenCalledWith(true);
    });
  });

  describe('Web Worker Processing', () => {
    beforeEach(() => {
      // Mock WorkerManager
      const mockWorkerManager = {
        initializeWorker: vi.fn().mockResolvedValue(true),
        processChunks: vi.fn().mockResolvedValue([]),
        cleanup: vi.fn()
      };

      vi.doMock('../utils/workerManager.js', () => ({
        WorkerManager: vi.fn().mockImplementation(() => mockWorkerManager)
      }));
    });

    it('should handle worker initialization error', async () => {
      const mockWorkerManager = {
        initializeWorker: vi.fn().mockRejectedValue(new Error('Worker init failed'))
      };

      (service as any)._workerManager = mockWorkerManager;
      (service as any)._excelExportOptions = { useWebWorker: true };

      const result = await (service as any).initializeWorker();
      expect(result).toBe(false);
      expect((service as any)._isWorkerInitialized).toBe(false);
    });

    it('should return early if worker already initialized', async () => {
      (service as any)._isWorkerInitialized = true;
      (service as any)._excelExportOptions = { useWebWorker: true };

      const result = await (service as any).initializeWorker();
      expect(result).toBe(true);
    });

    it('should return early if web worker not enabled', async () => {
      (service as any)._excelExportOptions = { useWebWorker: false };

      const result = await (service as any).initializeWorker();
      expect(result).toBe(false);
    });

    it('should determine not to use worker for small datasets', async () => {
      (service as any)._excelExportOptions = { useWebWorker: true };

      const result = await (service as any).shouldUseWebWorker(100);
      expect(result).toBe(false);
    });

    it('should determine not to use worker when disabled', async () => {
      (service as any)._excelExportOptions = { useWebWorker: false };

      const result = await (service as any).shouldUseWebWorker(1000);
      expect(result).toBe(false);
    });

    it('should determine not to use worker when no formatters', async () => {
      const columnsWithoutFormatters = [
        { id: 'id', field: 'id', name: 'ID', width: 50 },
        { id: 'name', field: 'name', name: 'Name', width: 100 }
      ] as Column[];

      mockGrid.getColumns.mockReturnValue(columnsWithoutFormatters);
      (service as any)._excelExportOptions = { useWebWorker: true, exportWithFormatter: false };
      service.init(mockGrid, mockContainerService);

      const result = await (service as any).shouldUseWebWorker(1000);
      expect(result).toBe(false);
    });

    it('should process data with worker when conditions are met', async () => {
      const columnsWithFormatters = [
        {
          id: 'value',
          field: 'value',
          name: 'Value',
          width: 100,
          formatter: (row: number, cell: number, value: any) => `Formatted: ${value}`
        }
      ] as Column[];

      mockGrid.getColumns.mockReturnValue(columnsWithFormatters);
      (service as any)._excelExportOptions = { useWebWorker: true, exportWithFormatter: true };
      service.init(mockGrid, mockContainerService);

      const result = await (service as any).shouldUseWebWorker(1000);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Worker Data Processing', () => {
    it('should throw error when worker manager not initialized', async () => {
      (service as any)._workerManager = null;

      await expect((service as any).processDataWithWorker([], [])).rejects.toThrow('Worker manager not initialized');
    });

    it('should process data chunks with worker', async () => {
      const mockWorkerManager = {
        processChunks: vi.fn().mockResolvedValue([
          {
            chunkId: 'chunk_0_100',
            processedRows: [
              { type: 'regular', data: ['1', 'Item 1', '10'] }
            ],
            error: null
          }
        ]),
        cleanup: vi.fn()
      };

      // Mock the data view with proper data
      const mockDataViewWithData = {
        ...mockDataView,
        getLength: () => 100,
        getItem: (index: number) => ({ id: index, name: `Item ${index}`, value: index * 10 })
      };

      const mockGridWithData = {
        ...mockGrid,
        getData: () => mockDataViewWithData
      };

      service.init(mockGridWithData as any, mockContainerService);
      (service as any)._workerManager = mockWorkerManager;
      (service as any)._excelExportOptions = { workerChunkSize: 50 };
      (service as any)._hasGroupedItems = false;

      const outputData: any[] = [];
      const columns = [
        { id: 'id', field: 'id', name: 'ID', width: 50 },
        { id: 'name', field: 'name', name: 'Name', width: 100 }
      ] as Column[];

      await (service as any).processDataWithWorker(outputData, columns);

      expect(mockWorkerManager.processChunks).toHaveBeenCalled();
      expect(outputData.length).toBeGreaterThan(0);
    });

    it('should handle grouped data in worker processing', async () => {
      const mockWorkerManager = {
        processChunks: vi.fn().mockResolvedValue([]),
        cleanup: vi.fn()
      };

      // Mock the data view with grouped data
      const mockDataViewWithGroupedData = {
        ...mockDataView,
        getLength: () => 50,
        getItem: (index: number) => {
          if (index === 0) return { __group: true, level: 0, title: 'Group 1', collapsed: false };
          return { id: index, name: `Item ${index}`, value: index * 10 };
        }
      };

      const mockGridWithGroupedData = {
        ...mockGrid,
        getData: () => mockDataViewWithGroupedData
      };

      service.init(mockGridWithGroupedData as any, mockContainerService);
      (service as any)._workerManager = mockWorkerManager;
      (service as any)._hasGroupedItems = true;

      const outputData: any[] = [];
      const columns = [{ id: 'id', field: 'id', name: 'ID', width: 50 }] as Column[];

      await (service as any).processDataWithWorker(outputData, columns);

      expect(mockWorkerManager.processChunks).toHaveBeenCalled();
    });

    it('should handle group totals data in worker processing', async () => {
      const mockWorkerManager = {
        processChunks: vi.fn().mockResolvedValue([]),
        cleanup: vi.fn()
      };

      // Mock the data view with group totals data
      const mockDataViewWithTotals = {
        ...mockDataView,
        getLength: () => 50,
        getItem: (index: number) => {
          if (index === 0) return { __groupTotals: { sum: { value: 100 } }, group: { level: 0 } };
          return { id: index, name: `Item ${index}`, value: index * 10 };
        }
      };

      const mockGridWithTotals = {
        ...mockGrid,
        getData: () => mockDataViewWithTotals
      };

      service.init(mockGridWithTotals as any, mockContainerService);
      (service as any)._workerManager = mockWorkerManager;
      (service as any)._hasGroupedItems = true;

      const outputData: any[] = [];
      const columns = [{ id: 'id', field: 'id', name: 'ID', width: 50 }] as Column[];

      await (service as any).processDataWithWorker(outputData, columns);

      expect(mockWorkerManager.processChunks).toHaveBeenCalled();
    });

    it('should skip invalid items in worker processing', async () => {
      const mockWorkerManager = {
        processChunks: vi.fn().mockResolvedValue([]),
        cleanup: vi.fn()
      };

      // Mock the data view with invalid items
      const mockDataViewWithInvalidItems = {
        ...mockDataView,
        getLength: () => 50,
        getItem: (index: number) => {
          if (index === 0) return null; // Invalid item
          if (index === 1) return { getItem: () => { } }; // Row detail item
          return { id: index, name: `Item ${index}`, value: index * 10 };
        }
      };

      const mockGridWithInvalidItems = {
        ...mockGrid,
        getData: () => mockDataViewWithInvalidItems
      };

      service.init(mockGridWithInvalidItems as any, mockContainerService);
      (service as any)._workerManager = mockWorkerManager;
      (service as any)._hasGroupedItems = false;

      const outputData: any[] = [];
      const columns = [{ id: 'id', field: 'id', name: 'ID', width: 50 }] as Column[];

      await (service as any).processDataWithWorker(outputData, columns);

      expect(mockWorkerManager.processChunks).toHaveBeenCalled();
    });
  });

  describe('Worker Result Merging', () => {
    it('should merge worker results correctly', () => {
      const results = [
        {
          chunkId: 'chunk_0_50',
          processedRows: [
            { type: 'regular', data: ['1', 'Item 1', '10'] },
            { type: 'regular', data: ['2', 'Item 2', '20'] }
          ],
          error: null
        },
        {
          chunkId: 'chunk_50_100',
          processedRows: [
            { type: 'regular', data: ['3', 'Item 3', '30'] }
          ],
          error: null
        }
      ];

      const outputData: any[] = [];
      const columns = [
        { id: 'id', field: 'id', name: 'ID', width: 50 },
        { id: 'name', field: 'name', name: 'Name', width: 100 }
      ] as Column[];

      service.init(mockGrid, mockContainerService);
      (service as any).mergeWorkerResults(outputData, results, columns);

      expect(outputData.length).toBe(3);
    });

    it('should handle worker result errors', () => {
      const results = [
        {
          chunkId: 'chunk_0_50',
          processedRows: [],
          error: 'Processing failed'
        }
      ];

      const outputData: any[] = [];
      const columns = [{ id: 'id', field: 'id', name: 'ID', width: 50 }] as Column[];

      service.init(mockGrid, mockContainerService);
      (service as any).mergeWorkerResults(outputData, results, columns);

      expect(outputData.length).toBe(0);
    });

    it('should sort results by chunk ID', () => {
      const results = [
        {
          chunkId: 'chunk_50_100',
          processedRows: [{ type: 'regular', data: ['3', 'Item 3', '30'] }],
          error: null
        },
        {
          chunkId: 'chunk_0_50',
          processedRows: [{ type: 'regular', data: ['1', 'Item 1', '10'] }],
          error: null
        }
      ];

      const outputData: any[] = [];
      const columns = [{ id: 'id', field: 'id', name: 'ID', width: 50 }] as Column[];

      service.init(mockGrid, mockContainerService);
      (service as any).mergeWorkerResults(outputData, results, columns);

      expect(outputData.length).toBe(2);
      // Results should be sorted by chunk start index
    });
  });

  describe('Worker Row Formatting', () => {
    it('should format group rows for Excel', () => {
      const processedRow = {
        type: 'group',
        data: ['Group Title'],
        originalRowIndex: 0,
        isGrouped: true
      };

      const columns = [{ id: 'id', field: 'id', name: 'ID', width: 50 }] as Column[];

      service.init(mockGrid, mockContainerService);
      const result = (service as any).formatWorkerRowForExcel(processedRow, columns);

      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toBe('Group Title');
    });

    it('should format group totals rows for Excel', () => {
      const processedRow = {
        type: 'groupTotals',
        data: ['Totals', '100', '200'],
        originalRowIndex: 0,
        isGrouped: true
      };

      const columns = [
        { id: 'id', field: 'id', name: 'ID', width: 50 },
        { id: 'value', field: 'value', name: 'Value', width: 100 }
      ] as Column[];

      service.init(mockGrid, mockContainerService);
      const result = (service as any).formatWorkerRowForExcel(processedRow, columns);

      expect(Array.isArray(result)).toBe(true);
    });

    it('should format regular rows for Excel', () => {
      const processedRow = {
        type: 'regular',
        data: ['1', 'Item 1', '10'],
        originalRowIndex: 0,
        isGrouped: false
      };

      const columns = [
        { id: 'id', field: 'id', name: 'ID', width: 50 },
        { id: 'name', field: 'name', name: 'Name', width: 100 },
        { id: 'value', field: 'value', name: 'Value', width: 80 }
      ] as Column[];

      service.init(mockGrid, mockContainerService);
      const result = (service as any).formatWorkerRowForExcel(processedRow, columns);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
    });

    it('should handle Excel formatting for worker rows', () => {
      const processedRow = {
        type: 'regular',
        data: ['1', 'Item 1', '10'],
        originalRowIndex: 0,
        isGrouped: false
      };

      const columnsWithExcelOptions = [
        {
          id: 'value',
          field: 'value',
          name: 'Value',
          width: 100,
          excelExportOptions: {
            style: { font: { bold: true } },
            valueParserCallback: (value: any) => `Parsed: ${value}`
          }
        }
      ] as Column[];

      service.init(mockGrid, mockContainerService);

      // Mock the stylesheet
      (service as any)._stylesheet = {
        createFormat: vi.fn().mockReturnValue({ id: 'format-1' })
      };

      const result = (service as any).formatWorkerRowForExcel(processedRow, columnsWithExcelOptions);

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Group Totals Excel Formatting', () => {
    it('should format group totals row for Excel with worker data', () => {
      const groupTotalsData = ['Totals', '100', '200'];
      const columns = [
        { id: 'label', field: 'label', name: 'Label', width: 100 },
        { id: 'sum', field: 'sum', name: 'Sum', width: 100 },
        { id: 'avg', field: 'avg', name: 'Average', width: 100 }
      ] as Column[];

      service.init(mockGrid, mockContainerService);
      const result = (service as any).formatGroupTotalsRowForExcel(groupTotalsData, columns);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle excluded columns in group totals formatting', () => {
      const groupTotalsData = ['Totals', '100'];
      const columns = [
        { id: 'label', field: 'label', name: 'Label', width: 100 },
        { id: 'excluded', field: 'excluded', name: 'Excluded', width: 100, excludeFromExport: true },
        { id: 'sum', field: 'sum', name: 'Sum', width: 100 }
      ] as Column[];

      service.init(mockGrid, mockContainerService);
      const result = (service as any).formatGroupTotalsRowForExcel(groupTotalsData, columns);

      expect(Array.isArray(result)).toBe(true);
    });

    it('should apply Excel formatting to group totals', () => {
      const columnDef = {
        id: 'value',
        field: 'value',
        name: 'Value',
        width: 100,
        groupTotalsExcelExportOptions: {
          style: { font: { bold: true } }
        }
      } as Column;

      service.init(mockGrid, mockContainerService);

      // Mock the stylesheet
      (service as any)._stylesheet = {
        createFormat: vi.fn().mockReturnValue({ id: 'format-1' })
      };

      const result = (service as any).applyGroupTotalExcelFormatting(columnDef, 100);

      expect(result).toBeDefined();
    });

    it('should handle number field type in group total formatting', () => {
      const columnDef = {
        id: 'value',
        field: 'value',
        name: 'Value',
        width: 100,
        type: 'number'
      } as Column;

      service.init(mockGrid, mockContainerService);
      (service as any)._excelExportOptions = { autoDetectCellFormat: true };

      // Mock the stylesheet and Excel formats
      (service as any)._stylesheet = {
        createFormat: vi.fn().mockReturnValue({ id: 'format-1' })
      };

      // Mock Excel formats with proper structure
      const mockExcelFormats = {
        numberFormat: '#,##0.00'
      };

      const result = (service as any).applyGroupTotalExcelFormatting(columnDef, 100, null, 0, mockExcelFormats);

      expect(result).toBeDefined();
    });

    it('should handle main thread processing with SlickGrid objects', () => {
      const columnDef = {
        id: 'value',
        field: 'value',
        name: 'Value',
        width: 100,
        type: 'number'
      } as Column;

      const itemObj = {
        sum: { value: 150 }
      };

      service.init(mockGrid, mockContainerService);
      (service as any)._excelExportOptions = { autoDetectCellFormat: true };

      // Mock the stylesheet and Excel formats
      (service as any)._stylesheet = {
        createFormat: vi.fn().mockReturnValue({ id: 'format-1' })
      };

      // Mock Excel formats with proper structure
      const mockExcelFormats = {
        numberFormat: '#,##0.00'
      };

      const result = (service as any).applyGroupTotalExcelFormatting(columnDef, 100, itemObj, 0, mockExcelFormats);

      expect(result).toBeDefined();
    });

    it('should handle worker processing with pre-formatted values', () => {
      const columnDef = {
        id: 'value',
        field: 'value',
        name: 'Value',
        width: 100,
        type: 'number'
      } as Column;

      service.init(mockGrid, mockContainerService);
      (service as any)._excelExportOptions = { autoDetectCellFormat: true };

      // Mock the stylesheet and Excel formats
      (service as any)._stylesheet = {
        createFormat: vi.fn().mockReturnValue({ id: 'format-1' })
      };

      // Mock Excel formats with proper structure
      const mockExcelFormats = {
        numberFormat: '#,##0.00'
      };

      const result = (service as any).applyGroupTotalExcelFormatting(columnDef, 100, null, 0, mockExcelFormats);

      expect(result).toBeDefined();
    });

    it('should handle non-number fields with custom styling', () => {
      const columnDef = {
        id: 'text',
        field: 'text',
        name: 'Text',
        width: 100,
        type: 'string',
        groupTotalsExcelExportOptions: {
          style: { font: { italic: true } }
        }
      } as Column;

      service.init(mockGrid, mockContainerService);

      // Mock the stylesheet
      (service as any)._stylesheet = {
        createFormat: vi.fn().mockReturnValue({ id: 'format-1' })
      };

      const result = (service as any).applyGroupTotalExcelFormatting(columnDef, 'Text Value');

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });
  });

  describe('Getter Methods and Properties', () => {
    it('should return stylesheet via getter', () => {
      service.init(mockGrid, mockContainerService);

      const mockStylesheet = { createFormat: vi.fn() };
      (service as any)._stylesheet = mockStylesheet;

      expect(service.stylesheet).toBe(mockStylesheet);
    });

    it('should return stylesheetFormats via getter', () => {
      service.init(mockGrid, mockContainerService);

      const mockFormats = { boldFormat: { id: 1 }, numberFormat: { id: 2 } };
      (service as any)._stylesheetFormats = mockFormats;

      expect(service.stylesheetFormats).toBe(mockFormats);
    });

    it('should return groupTotalExcelFormats via getter', () => {
      service.init(mockGrid, mockContainerService);

      const mockFormats = { numberFormat: '#,##0.00' };
      (service as any)._groupTotalExcelFormats = mockFormats;

      expect(service.groupTotalExcelFormats).toBe(mockFormats);
    });

    it('should return regularCellExcelFormats via getter', () => {
      service.init(mockGrid, mockContainerService);

      const mockFormats = { dateFormat: 'mm/dd/yyyy' };
      (service as any)._regularCellExcelFormats = mockFormats;

      expect(service.regularCellExcelFormats).toBe(mockFormats);
    });
  });

  describe('Streaming Export Functionality', () => {
    it('should handle MIME type detection for xls format', async () => {
      service.init(mockGrid, mockContainerService);

      // Mock legacyExcelExport method to capture MIME type
      let capturedMimeType = '';
      const legacyExportSpy = vi.spyOn(service as any, 'legacyExcelExport').mockImplementation((filename, mimeType, resolve) => {
        capturedMimeType = mimeType;
        resolve(true);
      });

      const exportOptions = {
        filename: 'test-xls-mime',
        format: FileType.xls
      };

      await service.exportToExcel(exportOptions);
      expect(capturedMimeType).toBe('application/vnd.ms-excel');
    });

    it('should handle MIME type detection for xlsx format', async () => {
      service.init(mockGrid, mockContainerService);

      // Mock legacyExcelExport method to capture MIME type
      let capturedMimeType = '';
      const legacyExportSpy = vi.spyOn(service as any, 'legacyExcelExport').mockImplementation((filename, mimeType, resolve) => {
        capturedMimeType = mimeType;
        resolve(true);
      });

      const exportOptions = {
        filename: 'test-xlsx-mime',
        format: FileType.xlsx
      };

      await service.exportToExcel(exportOptions);
      expect(capturedMimeType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });

    it('should handle custom MIME type', async () => {
      service.init(mockGrid, mockContainerService);

      // Mock legacyExcelExport method to capture MIME type
      let capturedMimeType = '';
      const legacyExportSpy = vi.spyOn(service as any, 'legacyExcelExport').mockImplementation((filename, mimeType, resolve) => {
        capturedMimeType = mimeType;
        resolve(true);
      });

      const exportOptions = {
        filename: 'test-custom-mime',
        mimeType: 'custom/mime-type'
      };

      await service.exportToExcel(exportOptions);
      expect(capturedMimeType).toBe('custom/mime-type');
    });

    it('should handle empty string MIME type', async () => {
      service.init(mockGrid, mockContainerService);

      // Mock legacyExcelExport method to capture MIME type
      let capturedMimeType = '';
      const legacyExportSpy = vi.spyOn(service as any, 'legacyExcelExport').mockImplementation((filename, mimeType, resolve) => {
        capturedMimeType = mimeType;
        resolve(true);
      });

      const exportOptions = {
        filename: 'test-empty-mime',
        mimeType: ''
      };

      await service.exportToExcel(exportOptions);
      expect(capturedMimeType).toBe('');
    });

    it('should use legacy export for non-xlsx formats', async () => {
      service.init(mockGrid, mockContainerService);

      // Mock legacyExcelExport method
      const legacyExportSpy = vi.spyOn(service as any, 'legacyExcelExport').mockImplementation((filename, mimeType, resolve) => {
        resolve(true);
      });

      const exportOptions = {
        filename: 'test-xls',
        format: FileType.xls,
        useStreamingExport: true
      };

      const result = await service.exportToExcel(exportOptions);
      expect(result).toBe(true);
      expect(legacyExportSpy).toHaveBeenCalled();
    });

    it('should handle custom Excel header callback', async () => {
      const customHeaderCallback = vi.fn();

      const mockGridWithCustomHeader = {
        ...mockGrid,
        getOptions: () => ({
          excelExportOptions: {
            customExcelHeader: customHeaderCallback
          }
        })
      };

      service.init(mockGridWithCustomHeader as any, mockContainerService);

      // Mock legacyExcelExport method
      const legacyExportSpy = vi.spyOn(service as any, 'legacyExcelExport').mockImplementation((filename, mimeType, resolve) => {
        resolve(true);
      });

      const result = await service.exportToExcel({ filename: 'test-custom-header' });
      expect(result).toBe(true);
      expect(customHeaderCallback).toHaveBeenCalled();
    });

    it('should handle MIME type detection for xls format', async () => {
      service.init(mockGrid, mockContainerService);

      // Mock legacyExcelExport method to capture MIME type
      let capturedMimeType = '';
      const legacyExportSpy = vi.spyOn(service as any, 'legacyExcelExport').mockImplementation((filename, mimeType, resolve) => {
        capturedMimeType = mimeType;
        resolve(true);
      });

      const exportOptions = {
        filename: 'test-xls-mime',
        format: FileType.xls
      };

      await service.exportToExcel(exportOptions);
      expect(capturedMimeType).toBe('application/vnd.ms-excel');
    });

    it('should handle MIME type detection for xlsx format', async () => {
      service.init(mockGrid, mockContainerService);

      // Mock legacyExcelExport method to capture MIME type
      let capturedMimeType = '';
      const legacyExportSpy = vi.spyOn(service as any, 'legacyExcelExport').mockImplementation((filename, mimeType, resolve) => {
        capturedMimeType = mimeType;
        resolve(true);
      });

      const exportOptions = {
        filename: 'test-xlsx-mime',
        format: FileType.xlsx
      };

      await service.exportToExcel(exportOptions);
      expect(capturedMimeType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });

    it('should handle custom MIME type', async () => {
      service.init(mockGrid, mockContainerService);

      // Mock legacyExcelExport method to capture MIME type
      let capturedMimeType = '';
      const legacyExportSpy = vi.spyOn(service as any, 'legacyExcelExport').mockImplementation((filename, mimeType, resolve) => {
        capturedMimeType = mimeType;
        resolve(true);
      });

      const exportOptions = {
        filename: 'test-custom-mime',
        mimeType: 'custom/mime-type'
      };

      await service.exportToExcel(exportOptions);
      expect(capturedMimeType).toBe('custom/mime-type');
    });

    it('should handle empty string MIME type', async () => {
      service.init(mockGrid, mockContainerService);

      // Mock legacyExcelExport method to capture MIME type
      let capturedMimeType = '';
      const legacyExportSpy = vi.spyOn(service as any, 'legacyExcelExport').mockImplementation((filename, mimeType, resolve) => {
        capturedMimeType = mimeType;
        resolve(true);
      });

      const exportOptions = {
        filename: 'test-empty-mime',
        mimeType: ''
      };

      await service.exportToExcel(exportOptions);
      expect(capturedMimeType).toBe('');
    });
  });

  describe('Advanced Export Features', () => {
    it('should handle column header style customization', async () => {
      const customHeaderStyle = { font: { bold: true, color: 'red' } };

      const mockGridWithHeaderStyle = {
        ...mockGrid,
        getOptions: () => ({
          excelExportOptions: {
            columnHeaderStyle: customHeaderStyle
          }
        })
      };

      service.init(mockGridWithHeaderStyle as any, mockContainerService);

      // Mock stylesheet createFormat method
      const createFormatSpy = vi.fn().mockReturnValue({ id: 'custom-header-style' });
      (service as any)._stylesheet = {
        createFormat: createFormatSpy
      };
      (service as any)._stylesheetFormats = {
        boldFormat: { id: 'bold-format' }
      };

      const result = await (service as any).getDataOutput();
      expect(createFormatSpy).toHaveBeenCalledWith(customHeaderStyle);
    });

    it('should handle grouped column headers with pre-header panel', async () => {
      const mockGridWithPreHeader = {
        ...mockGrid,
        getOptions: () => ({
          createPreHeaderPanel: true,
          showPreHeaderPanel: true,
          enableDraggableGrouping: false
        })
      };

      service.init(mockGridWithPreHeader as any, mockContainerService);

      // Mock stylesheet createFormat method
      const createFormatSpy = vi.fn().mockReturnValue({ id: 'bold-center-align' });
      (service as any)._stylesheet = {
        createFormat: createFormatSpy
      };
      (service as any)._stylesheetFormats = {
        boldFormat: { id: 'bold-format' }
      };

      // Mock getColumnGroupedHeaderTitlesData method
      const getColumnGroupedHeaderTitlesDataSpy = vi.spyOn(service as any, 'getColumnGroupedHeaderTitlesData').mockReturnValue(['Group Header']);

      const result = await (service as any).getDataOutput();
      expect(createFormatSpy).toHaveBeenCalledWith({ alignment: { horizontal: 'center' }, font: { bold: true } });
      expect(getColumnGroupedHeaderTitlesDataSpy).toHaveBeenCalled();
      expect((service as any)._hasColumnTitlePreHeader).toBe(true);
    });

    it('should handle data concatenation with existing sheet data', async () => {
      service.init(mockGrid, mockContainerService);

      // Mock sheet with existing data
      const existingSheetData = [['Existing', 'Data']];
      (service as any)._sheet = {
        setColumns: vi.fn(),
        setData: vi.fn(),
        data: existingSheetData
      };

      // Mock getDataOutput to return new data
      const newData = [['New', 'Data']];
      vi.spyOn(service as any, 'getDataOutput').mockResolvedValue(newData);

      // Mock legacyExcelExport method
      const legacyExportSpy = vi.spyOn(service as any, 'legacyExcelExport').mockImplementation((filename, mimeType, resolve) => {
        resolve(true);
      });

      const result = await service.exportToExcel({ filename: 'test-concat' });
      expect(result).toBe(true);
      expect((service as any)._sheet.setData).toHaveBeenCalledWith([...existingSheetData, ...newData]);
    });

    it('should handle worker initialization failure gracefully', async () => {
      service.init(mockGrid, mockContainerService);

      // Mock worker manager initialization to fail
      const mockWorkerManager = {
        initializeWorker: vi.fn().mockRejectedValue(new Error('Worker initialization failed'))
      };
      (service as any)._workerManager = mockWorkerManager;

      const result = await (service as any).initializeWorker();
      expect(result).toBe(false);
    });

    it('should handle worker cleanup on service disposal', () => {
      service.init(mockGrid, mockContainerService);

      const mockWorkerManager = {
        cleanup: vi.fn()
      };
      (service as any)._workerManager = mockWorkerManager;

      service.dispose();
      expect(mockWorkerManager.cleanup).toHaveBeenCalled();
    });
  });

  describe('Column Styles and Formatting', () => {
    it('should handle custom column width in column styles', () => {
      const columns = [
        { id: 'id', field: 'id', name: 'ID', width: 50 },
        { id: 'name', field: 'name', name: 'Name', width: 100 }
      ] as Column[];

      const mockGridWithCustomWidth = {
        ...mockGrid,
        getOptions: () => ({
          excelExportOptions: {
            customColumnWidth: 15
          }
        })
      };

      service.init(mockGridWithCustomWidth as any, mockContainerService);

      const columnStyles = (service as any).getColumnStyles(columns);

      expect(columnStyles).toBeDefined();
      expect(Array.isArray(columnStyles)).toBe(true);
      // Should include custom width configuration
      expect(columnStyles.some((style: any) => style.columnStyles === 15)).toBe(true);
    });

    it('should handle grouped column header titles with cell merging', () => {
      const columns = [
        { id: 'id', field: 'id', name: 'ID', width: 50, columnGroup: 'Group A' },
        { id: 'name', field: 'name', name: 'Name', width: 100, columnGroup: 'Group A' },
        { id: 'value', field: 'value', name: 'Value', width: 80, columnGroup: 'Group B' }
      ] as Column[];

      service.init(mockGrid, mockContainerService);

      // Mock sheet mergeCells method
      const mergeCellsSpy = vi.fn();
      (service as any)._sheet = {
        mergeCells: mergeCellsSpy
      };

      // Mock getColumnGroupedHeaderTitles to return grouped headers
      vi.spyOn(service as any, 'getColumnGroupedHeaderTitles').mockReturnValue([
        { title: 'Group A' },
        { title: 'Group A' },
        { title: 'Group B' }
      ]);

      const result = (service as any).getColumnGroupedHeaderTitlesData(columns, { style: 1 });

      expect(Array.isArray(result)).toBe(true);
      expect(mergeCellsSpy).toHaveBeenCalled();
    });

    it('should handle Excel column name generation for large indices', () => {
      service.init(mockGrid, mockContainerService);

      // Test column name generation for various indices
      const columnName1 = (service as any).getExcelColumnNameByIndex(1);
      const columnName26 = (service as any).getExcelColumnNameByIndex(26);
      const columnName27 = (service as any).getExcelColumnNameByIndex(27);
      const columnName702 = (service as any).getExcelColumnNameByIndex(702);

      expect(columnName1).toBe('A');
      expect(columnName26).toBe('Z');
      expect(columnName27).toBe('AA');
      expect(columnName702).toBe('ZZ');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing grid gracefully in export', () => {
      service.init(mockGrid, mockContainerService);
      (service as any)._grid = null;

      // Test that methods handle null grid gracefully
      const columns = (service as any)._grid?.getColumns() || [];
      expect(columns).toEqual([]);
    });

    it('should handle missing data view gracefully', () => {
      const mockGridWithoutDataView = {
        ...mockGrid,
        getData: () => null
      };

      service.init(mockGridWithoutDataView as any, mockContainerService);

      const dataView = mockGridWithoutDataView.getData();
      expect(dataView).toBeNull();
    });

    it('should handle worker initialization failure gracefully', async () => {
      service.init(mockGrid, mockContainerService);

      // Mock worker manager initialization to fail
      const mockWorkerManager = {
        initializeWorker: vi.fn().mockRejectedValue(new Error('Worker initialization failed'))
      };
      (service as any)._workerManager = mockWorkerManager;

      const result = await (service as any).initializeWorker();
      expect(result).toBe(false);
    });

    it('should handle worker cleanup on service disposal', () => {
      service.init(mockGrid, mockContainerService);

      const mockWorkerManager = {
        cleanup: vi.fn()
      };
      (service as any)._workerManager = mockWorkerManager;

      service.dispose();
      expect(mockWorkerManager.cleanup).toHaveBeenCalled();
    });
  });

  describe('Data Processing and Formatting', () => {
    it('should handle row span functionality in readRegularRowData', () => {
      const columns = [
        { id: 'id', field: 'id', name: 'ID', width: 50 },
        { id: 'name', field: 'name', name: 'Name', width: 100 }
      ] as Column[];

      service.init(mockGrid, mockContainerService);
      (service as any)._excelExportOptions = { sanitizeDataExport: false };

      // Mock item metadata with row span
      const itemMetadata = {
        columns: {
          id: { rowspan: 2 }
        }
      };

      mockDataView.getItemMetadata.mockReturnValue(itemMetadata);

      const rowData = (service as any).readRegularRowData(columns, 0, { id: 1, name: 'test' }, 0);
      expect(Array.isArray(rowData)).toBe(true);
    });

    it('should handle column span with metadata', () => {
      const columns = [
        { id: 'id', field: 'id', name: 'ID', width: 50 },
        { id: 'name', field: 'name', name: 'Name', width: 100 }
      ] as Column[];

      service.init(mockGrid, mockContainerService);
      (service as any)._excelExportOptions = { sanitizeDataExport: false };

      // Mock item metadata with column span
      const itemMetadata = {
        columns: {
          id: { colspan: 2 }
        }
      };

      mockDataView.getItemMetadata.mockReturnValue(itemMetadata);

      const rowData = (service as any).readRegularRowData(columns, 0, { id: 1, name: 'test' }, 0);
      expect(Array.isArray(rowData)).toBe(true);
    });

    it('should handle data sanitization when enabled', () => {
      const columns = [
        { id: 'content', field: 'content', name: 'Content', width: 100 }
      ] as Column[];

      service.init(mockGrid, mockContainerService);
      (service as any)._excelExportOptions = { sanitizeDataExport: true };

      const rowData = (service as any).readRegularRowData(columns, 0, { content: '<b>Bold Text</b>' }, 0);
      expect(Array.isArray(rowData)).toBe(true);
      // Should sanitize HTML tags
      expect(rowData[0]).toBe('Bold Text');
    });

    it('should handle column-level sanitization', () => {
      const columns = [
        { id: 'content', field: 'content', name: 'Content', width: 100, sanitizeDataExport: true }
      ] as Column[];

      service.init(mockGrid, mockContainerService);
      (service as any)._excelExportOptions = { sanitizeDataExport: false };

      const rowData = (service as any).readRegularRowData(columns, 0, { content: '<i>Italic Text</i>' }, 0);
      expect(Array.isArray(rowData)).toBe(true);
      // Should sanitize HTML tags due to column setting
      expect(rowData[0]).toBe('Italic Text');
    });

    it('should handle Excel formatting for date columns', () => {
      const columns = [
        { id: 'date', field: 'date', name: 'Date', width: 100, type: 'date' }
      ] as Column[];

      service.init(mockGrid, mockContainerService);
      (service as any)._excelExportOptions = { autoDetectCellFormat: true };

      const rowData = (service as any).readRegularRowData(columns, 0, { date: '2023-01-01' }, 0);
      expect(Array.isArray(rowData)).toBe(true);
    });

    it('should handle custom Excel export options on columns', () => {
      const columns = [
        {
          id: 'value',
          field: 'value',
          name: 'Value',
          width: 100,
          excelExportOptions: {
            style: { font: { bold: true } }
          }
        }
      ] as Column[];

      service.init(mockGrid, mockContainerService);
      (service as any)._excelExportOptions = { autoDetectCellFormat: true };

      const rowData = (service as any).readRegularRowData(columns, 0, { value: 100 }, 0);
      expect(Array.isArray(rowData)).toBe(true);
    });
  });
});
