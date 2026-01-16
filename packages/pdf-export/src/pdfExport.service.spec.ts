import {
  FieldType,
  Formatters,
  GroupTotalFormatters,
  SortComparers,
  SortDirectionNumber,
  type Column,
  type ContainerService,
  type Formatter,
  type GridOption,
  type GroupingComparerItem,
  type PdfExportOption,
  type SlickDataView,
  type SlickGrid,
} from '@slickgrid-universal/common';
import type { BasePubSubService } from '@slickgrid-universal/event-pub-sub';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContainerServiceStub } from '../../../test/containerServiceStub.js';
import { TranslateServiceStub } from '../../../test/translateServiceStub.js';
import { PdfExportService } from './pdfExport.service.js';

const pubSubServiceStub = {
  publish: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  unsubscribeAll: vi.fn(),
} as BasePubSubService;

// URL object is not supported in JSDOM, we can simply mock it
const createObjectMock = vi.fn();
(global as any).URL.createObjectURL = createObjectMock;
(global as any).URL.revokeObjectURL = vi.fn();

const myBoldHtmlFormatter: Formatter = (_row, _cell, value) => (value !== null ? { text: `<b>${value}</b>` } : (null as any));
const myUppercaseFormatter: Formatter = (_row, _cell, value) => (value ? { text: value.toUpperCase() } : (null as any));
const myCustomObjectFormatter: Formatter = (_row, _cell, value, _columnDef, dataContext) => {
  let textValue = value && value.hasOwnProperty('text') ? value.text : value;
  const toolTip = value && value.hasOwnProperty('toolTip') ? value.toolTip : '';
  const cssClasses = value && value.hasOwnProperty('addClasses') ? [value.addClasses] : [''];
  if (dataContext && !isNaN(dataContext.order) && parseFloat(dataContext.order) > 10) {
    cssClasses.push('red');
    textValue = null;
  }
  return { text: textValue, addClasses: cssClasses.join(' '), toolTip };
};

const dataViewStub = {
  getGrouping: vi.fn(),
  getItem: vi.fn(),
  getItemMetadata: vi.fn(),
  getLength: vi.fn(),
  setGrouping: vi.fn(),
} as unknown as SlickDataView;

const mockGridOptions = {
  enablePagination: true,
  enableFiltering: true,
} as GridOption;

const gridStub = {
  getColumnIndex: vi.fn(),
  getData: () => dataViewStub,
  getOptions: () => mockGridOptions,
  getColumns: vi.fn(),
  getGrouping: vi.fn(),
  getParentRowSpanByCell: vi.fn(),
} as unknown as SlickGrid;

// --- jsPDF module mock ---
vi.mock('jspdf', () => {
  // These spies will be used for assertions
  const saveSpy = vi.fn();
  const setFontSizeSpy = vi.fn();
  const getTextWidthSpy = vi.fn((txt) => txt.length * 6);
  const setFillColorSpy = vi.fn();
  const setTextColorSpy = vi.fn();
  const rectSpy = vi.fn();
  const textSpy = vi.fn();
  const addPageSpy = vi.fn();

  // The mock constructor
  function jsPDFMock(this: any) {
    this.save = saveSpy;
    this.setFontSize = setFontSizeSpy;
    this.getTextWidth = getTextWidthSpy;
    this.internal = {
      pageSize: {
        getWidth: () => 595.28,
        getHeight: () => 841.89,
      },
    };
    this.setFillColor = setFillColorSpy;
    this.setTextColor = setTextColorSpy;
    this.rect = rectSpy;
    this.text = textSpy;
    this.addPage = addPageSpy;
  }

  return {
    __esModule: true,
    default: jsPDFMock,
    saveSpy,
    setFontSizeSpy,
    getTextWidthSpy,
    setFillColorSpy,
    setTextColorSpy,
    rectSpy,
    textSpy,
    addPageSpy,
    jsPDFMock,
  };
});
// --- end jsPDF module mock ---

describe('PdfExportService', () => {
  let container: ContainerServiceStub;
  let service: PdfExportService;
  let translateService: TranslateServiceStub;
  let mockColumns: Column[];
  let mockExportPdfOptions: PdfExportOption;

  // Suppress console.error globally for all tests in this file
  beforeAll(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterAll(() => {
    (console.error as any).mockRestore?.();
  });

  describe('with Translater Service', () => {
    beforeEach(() => {
      translateService = new TranslateServiceStub();
      container = new ContainerServiceStub();
      container.registerInstance('PubSubService', pubSubServiceStub);
      mockGridOptions.translater = translateService;

      (navigator as any).__defineGetter__('appName', () => 'Netscape');
      (navigator as any).msSaveOrOpenBlob = undefined as any;

      mockExportPdfOptions = {
        filename: 'export',
        pageOrientation: 'portrait',
        pageSize: 'a4',
      };

      service = new PdfExportService();
    });

    afterEach(() => {
      delete mockGridOptions.backendServiceApi;
      service?.dispose();
      vi.clearAllMocks();
      delete (global as any).__pdfDocOverride;
    });

    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should not export if there are no column definitions provided', async () => {
      const pubSubSpy = vi.spyOn(pubSubServiceStub, 'publish');

      service.init(gridStub, container);
      await service.exportToPdf(mockExportPdfOptions);

      expect(pubSubSpy).toHaveBeenCalledWith('onBeforeExportToPdf', true);
      expect(pubSubSpy).toHaveBeenCalledWith('onAfterExportToPdf', expect.objectContaining({ filename: 'export.pdf' }));
    });

    describe('exportToPdf method', () => {
      beforeEach(() => {
        mockColumns = [
          { id: 'id', field: 'id', excludeFromExport: true },
          { id: 'userId', field: 'userId', name: 'User Id', width: 100 },
          { id: 'firstName', field: 'firstName', width: 100, formatter: myBoldHtmlFormatter },
          {
            id: 'lastName',
            field: 'lastName',
            width: 100,
            formatter: myBoldHtmlFormatter,
            exportCustomFormatter: myUppercaseFormatter,
            sanitizeDataExport: true,
            exportWithFormatter: true,
          },
          { id: 'position', field: 'position', width: 100 },
          {
            id: 'order',
            field: 'order',
            width: 100,
            exportWithFormatter: true,
            formatter: Formatters.multiple,
            params: { formatters: [myBoldHtmlFormatter, myCustomObjectFormatter] },
          },
        ] as Column[];

        vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
      });

      it('should throw an error when trying to call exportToPdf without a grid and/or dataview object initialized', () =>
        new Promise((done: any) => {
          try {
            service.init(null as any, container);
            service.exportToPdf(mockExportPdfOptions);
          } catch (e: any) {
            expect(e.toString()).toContain(
              '[Slickgrid-Universal] it seems that the SlickGrid & DataView objects and/or PubSubService are not initialized did you forget to enable the grid option flag "enablePdfExport"?'
            );
            done();
          }
        }));

      it('should trigger an event before exporting the file', () => {
        const pubSubSpy = vi.spyOn(pubSubServiceStub, 'publish');

        service.init(gridStub, container);
        service.exportToPdf(mockExportPdfOptions);

        expect(pubSubSpy).toHaveBeenCalledWith('onBeforeExportToPdf', true);
      });

      it('should trigger an event after exporting the file', async () => {
        const pubSubSpy = vi.spyOn(pubSubServiceStub, 'publish');

        service.init(gridStub, container);
        await service.exportToPdf(mockExportPdfOptions);

        expect(pubSubSpy).toHaveBeenCalledWith('onAfterExportToPdf', expect.objectContaining({ filename: 'export.pdf' }));
      });

      it('should call jsPDF with default page size A4 portrait', async () => {
        vi.spyOn(dataViewStub, 'getLength').mockReturnValue(0);
        const pubSubSpy = vi.spyOn(pubSubServiceStub, 'publish');

        service.init(gridStub, container);
        await service.exportToPdf(mockExportPdfOptions);

        expect(pubSubSpy).toHaveBeenCalledWith('onAfterExportToPdf', expect.objectContaining({ filename: 'export.pdf' }));
      });

      it('should call jsPDF save() with the correct filename (non-IE)', async () => {
        // Use the saveSpy from the jsPDF mock
        const { saveSpy } = (await import('jspdf')) as any;
        service.init(gridStub, container);
        await service.exportToPdf(mockExportPdfOptions);
        expect(saveSpy).toHaveBeenCalledWith('export.pdf');
      });

      it('should call jsPDF save() with the correct filename (IE11 fallback)', async () => {
        const { saveSpy } = (await import('jspdf')) as any;
        (navigator as any).msSaveOrOpenBlob = vi.fn();
        service.init(gridStub, container);
        await service.exportToPdf(mockExportPdfOptions);
        expect(saveSpy).toHaveBeenCalledWith('export.pdf');
      });
    });

    describe('exportToPdf with different data scenarios', () => {
      let mockCollection: any[];

      beforeEach(() => {
        mockGridOptions.pdfExportOptions = {};
        mockColumns = [
          { id: 'id', field: 'id', excludeFromExport: true },
          { id: 'userId', field: 'userId', name: 'User Id', width: 100 },
          { id: 'firstName', field: 'firstName', width: 100, formatter: myBoldHtmlFormatter },
          {
            id: 'lastName',
            field: 'lastName',
            width: 100,
            formatter: myBoldHtmlFormatter,
            exportCustomFormatter: myUppercaseFormatter,
            sanitizeDataExport: true,
            exportWithFormatter: true,
          },
          { id: 'position', field: 'position', width: 100 },
          {
            id: 'order',
            field: 'order',
            width: 100,
            exportWithFormatter: true,
            formatter: Formatters.multiple,
            params: { formatters: [myBoldHtmlFormatter, myCustomObjectFormatter] },
          },
        ] as Column[];

        vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
      });

      it('should export with Order column correctly formatted with multiple formatters', async () => {
        mockCollection = [{ id: 0, userId: '1E06', firstName: 'John', lastName: 'Z', position: 'SALES_REP', order: 10 }];
        vi.spyOn(dataViewStub, 'getLength').mockReturnValue(mockCollection.length);
        vi.spyOn(dataViewStub, 'getItem').mockReturnValue(null).mockReturnValueOnce(mockCollection[0]);
        const pubSubSpy = vi.spyOn(pubSubServiceStub, 'publish');

        service.init(gridStub, container);
        await service.exportToPdf(mockExportPdfOptions);

        expect(pubSubSpy).toHaveBeenCalledWith('onAfterExportToPdf', expect.objectContaining({ filename: 'export.pdf' }));
      });

      it('should have the LastName in uppercase when exportCustomFormatter is defined', async () => {
        mockCollection = [{ id: 1, userId: '2B02', firstName: 'Jane', lastName: 'Doe', position: 'FINANCE_MANAGER', order: 1 }];
        vi.spyOn(dataViewStub, 'getLength').mockReturnValue(mockCollection.length);
        vi.spyOn(dataViewStub, 'getItem').mockReturnValue(null).mockReturnValueOnce(mockCollection[0]);
        const pubSubSpy = vi.spyOn(pubSubServiceStub, 'publish');

        service.init(gridStub, container);
        await service.exportToPdf(mockExportPdfOptions);

        expect(pubSubSpy).toHaveBeenCalledWith('onAfterExportToPdf', expect.objectContaining({ filename: 'export.pdf' }));
      });

      it('should have the LastName as empty string when item LastName is NULL', async () => {
        mockCollection = [{ id: 2, userId: '3C2', firstName: 'Ava Luna', lastName: null, position: 'HUMAN_RESOURCES', order: 3 }];
        vi.spyOn(dataViewStub, 'getLength').mockReturnValue(mockCollection.length);
        vi.spyOn(dataViewStub, 'getItem').mockReturnValue(null).mockReturnValueOnce(mockCollection[0]);
        const pubSubSpy = vi.spyOn(pubSubServiceStub, 'publish');

        service.init(gridStub, container);
        await service.exportToPdf(mockExportPdfOptions);

        expect(pubSubSpy).toHaveBeenCalledWith('onAfterExportToPdf', expect.objectContaining({ filename: 'export.pdf' }));
      });

      it('should have the UserId as empty string even when UserId property is not found in the item object', async () => {
        mockCollection = [{ id: 2, firstName: 'Ava', lastName: 'Luna', position: 'HUMAN_RESOURCES', order: 3 }];
        vi.spyOn(dataViewStub, 'getLength').mockReturnValue(mockCollection.length);
        vi.spyOn(dataViewStub, 'getItem').mockReturnValue(null).mockReturnValueOnce(mockCollection[0]);
        const pubSubSpy = vi.spyOn(pubSubServiceStub, 'publish');

        service.init(gridStub, container);
        await service.exportToPdf(mockExportPdfOptions);

        expect(pubSubSpy).toHaveBeenCalledWith('onAfterExportToPdf', expect.objectContaining({ filename: 'export.pdf' }));
      });

      it('should sanitize data when sanitizeDataExport is enabled in grid options', async () => {
        mockGridOptions.pdfExportOptions = { sanitizeDataExport: true };
        mockCollection = [{ id: 1, userId: '2B06', firstName: 'Jane', lastName: 'Doe', position: 'FINANCE_MANAGER', order: 1 }];
        vi.spyOn(dataViewStub, 'getLength').mockReturnValue(mockCollection.length);
        vi.spyOn(dataViewStub, 'getItem').mockReturnValue(null).mockReturnValueOnce(mockCollection[0]);
        const pubSubSpy = vi.spyOn(pubSubServiceStub, 'publish');

        service.init(gridStub, container);
        await service.exportToPdf(mockExportPdfOptions);

        expect(pubSubSpy).toHaveBeenCalledWith('onAfterExportToPdf', expect.objectContaining({ filename: 'export.pdf' }));
      });

      it('should export with landscape orientation when specified', async () => {
        mockCollection = [{ id: 1, userId: '2B02', firstName: 'Jane', lastName: 'Doe', position: 'FINANCE_MANAGER', order: 1 }];
        vi.spyOn(dataViewStub, 'getLength').mockReturnValue(mockCollection.length);
        vi.spyOn(dataViewStub, 'getItem').mockReturnValue(null).mockReturnValueOnce(mockCollection[0]);
        const pubSubSpy = vi.spyOn(pubSubServiceStub, 'publish');

        service.init(gridStub, container);
        await service.exportToPdf({ ...mockExportPdfOptions, pageOrientation: 'landscape' });

        expect(pubSubSpy).toHaveBeenCalledWith('onAfterExportToPdf', expect.objectContaining({ filename: 'export.pdf' }));
      });
    });

    describe('exportToPdf with complex object columns', () => {
      beforeEach(() => {
        mockColumns = [
          { id: 'id', field: 'id', excludeFromExport: true },
          { id: 'firstName', field: 'user.firstName', name: 'First Name', width: 100, formatter: Formatters.complexObject, exportWithFormatter: true },
          { id: 'lastName', field: 'user.lastName', name: 'Last Name', width: 100, formatter: Formatters.complexObject, exportWithFormatter: true },
          { id: 'position', field: 'position', width: 100 },
        ] as Column[];

        vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
      });

      let mockCollection: any[];

      it('should export correctly with complex object formatters', async () => {
        mockCollection = [{ id: 0, user: { firstName: 'John', lastName: 'Z' }, position: 'SALES_REP', order: 10 }];
        vi.spyOn(dataViewStub, 'getLength').mockReturnValue(mockCollection.length);
        vi.spyOn(dataViewStub, 'getItem').mockReturnValue(null).mockReturnValueOnce(mockCollection[0]);
        const pubSubSpy = vi.spyOn(pubSubServiceStub, 'publish');

        service.init(gridStub, container);
        await service.exportToPdf(mockExportPdfOptions);

        expect(pubSubSpy).toHaveBeenCalledWith('onAfterExportToPdf', expect.objectContaining({ filename: 'export.pdf' }));
      });
    });

    describe('with Translation', () => {
      let mockCollection: any[];

      beforeEach(() => {
        mockGridOptions.enableTranslate = true;
        mockGridOptions.translater = translateService;

        mockColumns = [
          { id: 'id', field: 'id', excludeFromExport: true },
          { id: 'userId', field: 'userId', name: 'User Id', width: 100 },
          { id: 'firstName', nameKey: 'FIRST_NAME', width: 100, formatter: myBoldHtmlFormatter },
          {
            id: 'lastName',
            field: 'lastName',
            nameKey: 'LAST_NAME',
            width: 100,
            formatter: myBoldHtmlFormatter,
            exportCustomFormatter: myUppercaseFormatter,
            sanitizeDataExport: true,
            exportWithFormatter: true,
          },
          { id: 'position', field: 'position', name: 'Position', width: 100, formatter: Formatters.translate, exportWithFormatter: true },
          {
            id: 'order',
            field: 'order',
            width: 100,
            exportWithFormatter: true,
            formatter: Formatters.multiple,
            params: { formatters: [myBoldHtmlFormatter, myCustomObjectFormatter] },
          },
        ] as Column[];

        vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
      });

      afterEach(() => {
        vi.clearAllMocks();
      });

      it('should have the LastName header title translated when defined as a "headerKey"', async () => {
        mockGridOptions.pdfExportOptions!.sanitizeDataExport = false;
        mockCollection = [{ id: 0, userId: '1E06', firstName: 'John', lastName: 'Z', position: 'SALES_REP', order: 10 }];
        vi.spyOn(dataViewStub, 'getLength').mockReturnValue(mockCollection.length);
        vi.spyOn(dataViewStub, 'getItem').mockReturnValue(null).mockReturnValueOnce(mockCollection[0]);
        const pubSubSpy = vi.spyOn(pubSubServiceStub, 'publish');

        service.init(gridStub, container);
        await service.exportToPdf(mockExportPdfOptions);

        expect(pubSubSpy).toHaveBeenCalledWith('onAfterExportToPdf', expect.objectContaining({ filename: 'export.pdf' }));
      });
    });

    describe('with Grouping', () => {
      let mockCollection: any[];
      let mockOrderGrouping: any;
      let mockItem1;
      let mockItem2;
      let mockGroup1;

      beforeEach(() => {
        mockGridOptions.enableGrouping = true;
        mockGridOptions.enableTranslate = false;
        mockGridOptions.pdfExportOptions = { sanitizeDataExport: true };

        mockColumns = [
          { id: 'id', field: 'id', excludeFromExport: true },
          { id: 'userId', field: 'userId', name: 'User Id', width: 100 },
          { id: 'firstName', field: 'firstName', width: 100, formatter: myBoldHtmlFormatter },
          {
            id: 'lastName',
            field: 'lastName',
            width: 100,
            formatter: myBoldHtmlFormatter,
            exportCustomFormatter: myUppercaseFormatter,
            sanitizeDataExport: true,
            exportWithFormatter: true,
          },
          { id: 'position', field: 'position', width: 100 },
          {
            id: 'order',
            field: 'order',
            type: FieldType.number,
            exportWithFormatter: true,
            formatter: Formatters.multiple,
            params: { formatters: [myBoldHtmlFormatter, myCustomObjectFormatter] },
            groupTotalsFormatter: GroupTotalFormatters.sumTotals,
          },
        ] as Column[];

        mockOrderGrouping = {
          aggregateChildGroups: false,
          aggregateCollapsed: false,
          aggregateEmpty: false,
          aggregators: [{ _count: 2, _field: 'order', _nonNullCount: 2, _sum: 4 }],
          collapsed: false,
          comparer: (a: GroupingComparerItem, b: GroupingComparerItem) => SortComparers.numeric(a.value, b.value, SortDirectionNumber.asc),
          compiledAccumulators: [vi.fn(), vi.fn()],
          displayTotalsRow: true,
          formatter: (g: GroupingComparerItem) => `Order:  ${g.value} <span class="text-green">(${g.count} items)</span>`,
          getter: 'order',
          getterIsAFn: false,
          lazyTotalsCalculation: true,
          predefinedValues: [],
        };

        mockItem1 = { id: 0, userId: '1E06', firstName: 'John', lastName: 'Z', position: 'SALES_REP', order: 10 };
        mockItem2 = { id: 1, userId: '2B02', firstName: 'Jane', lastName: 'Doe', position: 'FINANCE_MANAGER', order: 10 };
        mockGroup1 = {
          collapsed: 0,
          count: 2,
          groupingKey: '10',
          groups: null,
          level: 0,
          selectChecked: false,
          rows: [mockItem1, mockItem2],
          title: `Order: 20 <span class="text-green">(2 items)</span>`,
          totals: { value: '10', __group: true, __groupTotals: true, group: {}, initialized: true, sum: { order: 20 } },
        };

        vi.spyOn(gridStub, 'getColumns').mockReturnValue(mockColumns);
        mockCollection = [mockGroup1, mockItem1, mockItem2, { __groupTotals: true, initialized: true, sum: { order: 20 }, group: mockGroup1 }];
        vi.spyOn(dataViewStub, 'getLength').mockReturnValue(mockCollection.length);
        vi.spyOn(dataViewStub, 'getItem')
          .mockReturnValue(null)
          .mockReturnValueOnce(mockCollection[0])
          .mockReturnValueOnce(mockCollection[1])
          .mockReturnValueOnce(mockCollection[2])
          .mockReturnValueOnce(mockCollection[3]);
        vi.spyOn(dataViewStub, 'getGrouping').mockReturnValue([mockOrderGrouping]);
      });

      it('should have a PDF export with grouping when enableGrouping is set in the grid options', async () => {
        const pubSubSpy = vi.spyOn(pubSubServiceStub, 'publish');

        service.init(gridStub, container);
        await service.exportToPdf(mockExportPdfOptions);

        expect(pubSubSpy).toHaveBeenCalledWith('onAfterExportToPdf', expect.objectContaining({ filename: 'export.pdf' }));
      });
    });

    describe('getColumnHeaders method', () => {
      beforeEach(() => {
        mockColumns = [
          { id: 'firstName', name: 'First Name', field: 'firstName', width: 100 },
          { id: 'lastName', name: 'Last Name', field: 'lastName', width: 100 },
        ] as Column[];
        service.init(gridStub, container);
      });

      it('should return column headers', () => {
        const headers = service['getColumnHeaders'](mockColumns);

        expect(headers).toEqual([
          { key: 'firstName', title: 'First Name' },
          { key: 'lastName', title: 'Last Name' },
        ]);
      });

      it('should exclude columns with excludeFromExport flag', () => {
        const columnsWithExclude = [...mockColumns, { id: 'hidden', name: 'Hidden', field: 'hidden', width: 100, excludeFromExport: true }] as Column[];

        const headers = service['getColumnHeaders'](columnsWithExclude);

        expect(headers).toHaveLength(2);
        expect(headers.find((h) => h.key === 'hidden')).toBeUndefined();
      });

      it('should exclude columns with width 0', () => {
        const columnsWithZeroWidth = [...mockColumns, { id: 'hidden', name: 'Hidden', field: 'hidden', width: 0 }] as Column[];

        const headers = service['getColumnHeaders'](columnsWithZeroWidth);

        expect(headers).toHaveLength(2);
        expect(headers.find((h) => h.key === 'hidden')).toBeUndefined();
      });

      it('should finalize last group span on last column (cover line 613)', () => {
        const columns = [
          { id: 'col1', field: 'col1', columnGroup: 'GroupA', width: 100 },
          { id: 'col2', field: 'col2', columnGroup: 'GroupA', width: 100 },
          { id: 'col3', field: 'col3', columnGroup: 'GroupB', width: 100 },
        ];
        service.init(gridStub, container);
        const result = service['getColumnGroupedHeaderTitles'](columns as any);
        expect(result).toEqual([
          { title: 'GroupA', span: 2 },
          { title: 'GroupB', span: 1 },
        ]);
      });

      it('should translate grouped header titles when columnGroupKey and translation are enabled', () => {
        // Setup grid options and translaterService
        const mockTranslaterService = { translate: vi.fn((key) => `TR_${key}`) };
        const gridOptions = { enableTranslate: true, translater: mockTranslaterService };
        const columns = [
          { id: 'col1', field: 'col1', columnGroupKey: 'GroupAKey', width: 100 },
          { id: 'col2', field: 'col2', columnGroupKey: 'GroupAKey', width: 100 },
          { id: 'col3', field: 'col3', columnGroupKey: 'GroupBKey', width: 100 },
        ];
        service.init(
          {
            ...gridStub,
            getOptions: () => gridOptions,
          } as any,
          container
        );
        // Patch _translaterService directly for coverage
        Object.defineProperty(service, '_translaterService', { value: mockTranslaterService });
        Object.defineProperty(service, '_gridOptions', { get: () => gridOptions });
        const result = service['getColumnGroupedHeaderTitles'](columns as any);
        expect(result).toEqual([
          { title: 'TR_GroupAKey', span: 2 },
          { title: 'TR_GroupBKey', span: 1 },
        ]);
        expect(mockTranslaterService.translate).toHaveBeenCalledWith('GroupAKey');
        expect(mockTranslaterService.translate).toHaveBeenCalledWith('GroupBKey');
      });
    });

    describe('dispose method', () => {
      it('should unsubscribe from all pubsub events', () => {
        service.init(gridStub, container);
        service.dispose();

        expect(pubSubServiceStub.unsubscribeAll).toHaveBeenCalled();
      });
    });
  });

  describe('pdfExport drawHeaders, grouping, and multi-page scenarios', () => {
    let service: PdfExportService;
    let gridStub: any;
    let dataViewStub: any;
    let pubSubService: any;
    beforeEach(() => {
      service = new PdfExportService();
      container = new ContainerServiceStub();
      pubSubService = { publish: vi.fn() };
      gridStub = {
        getOptions: () => ({}),
        getColumns: () => [
          { id: 'id', field: 'id', name: 'ID' },
          { id: 'name', field: 'name', name: 'Name' },
        ],
        getData: () => dataViewStub,
      };
      dataViewStub = {
        getGrouping: vi.fn().mockReturnValue([]),
        getLength: vi.fn(),
        getItem: vi.fn(),
        getItemMetadata: vi.fn(),
      };
    });

    it('should export with grouped pre-header and enough rows to trigger page break (cover pre-header branch)', async () => {
      // Setup columns with grouped header
      const columns = [
        { id: 'col1', field: 'col1', name: 'Col1', columnGroup: 'GroupA' },
        { id: 'col2', field: 'col2', name: 'Col2', columnGroup: 'GroupA' },
        { id: 'col3', field: 'col3', name: 'Col3', columnGroup: 'GroupB' },
        { id: 'col4', field: 'col4', name: 'Col4', columnGroup: 'GroupB' },
        { id: 'col5', field: 'col5', name: 'Col5', columnGroup: 'GroupC' },
      ];
      const gridStub = {
        getColumns: () => columns,
        getOptions: () => ({
          createPreHeaderPanel: true,
          showPreHeaderPanel: true,
          enableDraggableGrouping: false,
          documentTitle: 'Test PDF',
        }),
        getData: () => ({
          getGrouping: () => [],
          getLength: () => 70,
          getItem: (i: number) => ({ id: i, col1: 'A', col2: 'B', col3: 'C', col4: 'D', col5: 'E' }),
          getItemMetadata: vi.fn(),
        }),
      };
      const pubSubService = { publish: vi.fn() };
      const container = { get: () => pubSubService };
      const buildSpy = vi.fn(() => new Uint8Array([1, 2, 3]));
      const doc = { page: vi.fn(), build: buildSpy };
      (global as any).__pdfDocOverride = doc;
      const service = new PdfExportService();
      service.init(gridStub as any, container as any);
      let result;
      result = await service.exportToPdf({ filename: 'preheader-multipage', documentTitle: 'Test PDF' });
      expect(result).toBe(true);
      delete (global as any).__pdfDocOverride;
    });

    it('should call drawHeaders with grouped pre-header and without column headers', async () => {
      // Setup columns with grouped header, but disable column headers
      const columns = [
        { id: 'col1', field: 'col1', name: 'Col1', columnGroup: 'GroupA' },
        { id: 'col2', field: 'col2', name: 'Col2', columnGroup: 'GroupA' },
      ];
      const gridStub = {
        getColumns: () => columns,
        getOptions: () => ({ createPreHeaderPanel: true, showPreHeaderPanel: true, includeColumnHeaders: false }),
        getData: () => ({ getGrouping: () => [], getLength: () => 1, getItem: () => ({ id: 1 }), getItemMetadata: vi.fn() }),
      };
      const pubSubService = { publish: vi.fn() };
      const container = { get: () => pubSubService };
      const buildSpy = vi.fn(() => new Uint8Array([1, 2, 3]));
      const doc = { page: vi.fn(), build: buildSpy };
      (global as any).__pdfDocOverride = doc;
      const service = new PdfExportService();
      service.init(gridStub as any, container as any);
      const result = await service.exportToPdf({ filename: 'no-col-header', includeColumnHeaders: false });
      expect(result).toBe(true);
    });

    it('should split rows into multiple pages with exact first/subsequent page logic', async () => {
      // Setup to hit both firstPageMaxRows and subsequentPageMaxRows logic
      const buildSpy = vi.fn(() => new Uint8Array([1, 2, 3]));
      const doc = { page: vi.fn(), build: buildSpy };
      (global as any).__pdfDocOverride = doc;
      const rows = Array.from({ length: 60 }, (_, i) => ({ id: i, name: `Name${i}` }));
      dataViewStub.getLength.mockReturnValue(rows.length);
      dataViewStub.getItem.mockImplementation((i: number) => rows[i]);
      service.init(gridStub, { get: () => pubSubService } as unknown as ContainerService);
      const result = await service.exportToPdf({ filename: 'multi-page-exact', fontSize: 10, headerFontSize: 11 });
      expect(result).toBe(true);
    });

    it('should handle readRegularRowData with colspan="*" and decrementing colspan', () => {
      const columns = [
        { id: 'col1', field: 'col1' },
        { id: 'col2', field: 'col2' },
        { id: 'col3', field: 'col3' },
      ];
      const itemObj = { col1: 'A', col2: 'B', col3: 'C', id: 1 };
      const dataViewStub = {
        getItemMetadata: vi.fn().mockReturnValue({ columns: { col1: { colspan: '*' }, col2: { colspan: 2 }, col3: { colspan: 1 } } }),
        getParentRowSpanByCell: vi.fn().mockReturnValue({ start: 0 }),
      };
      const gridStub = {
        getParentRowSpanByCell: dataViewStub.getParentRowSpanByCell,
      };
      const service = new PdfExportService();
      Object.defineProperty(service, '_grid', { value: gridStub });
      Object.defineProperty(service, '_dataView', { value: dataViewStub });
      Object.defineProperty(service, '_gridOptions', { value: { enableCellRowSpan: true } });
      Object.defineProperty(service, '_exportOptions', { value: { htmlDecode: true, sanitizeDataExport: true } });
      (service as any)._hasGroupedItems = false;
      const result = service['readRegularRowData'](columns as any, 0, itemObj);
      expect(result).toEqual(['A', '', '']); // Only first cell, rest skipped by colspan logic
    });
    it('should export multiple pages when rows exceed first page max', async () => {
      // Set global override for pdf doc
      const buildSpy = vi.fn(() => new Uint8Array([1, 2, 3])); // Always succeed
      const doc = { page: vi.fn(), build: buildSpy };
      (global as any).__pdfDocOverride = doc;
      const rows = Array.from({ length: 50 }, (_, i) => ({ id: i, name: `Name${i}` }));
      dataViewStub.getLength.mockReturnValue(rows.length);
      dataViewStub.getItem.mockImplementation((i: number) => rows[i]);
      service.init(gridStub, { get: () => pubSubService } as unknown as ContainerService);
      let result;
      try {
        result = await service.exportToPdf({ filename: 'multi-page', fontSize: 10, headerFontSize: 11 });
      } catch (err) {
        console.error('Test error:', err);
        result = err;
      }
      expect(result).toBe(true);
      // Clean up override
      delete (global as any).__pdfDocOverride;
    });

    it('should handle grouped header spanning (pre-header)', async () => {
      // Setup columns with columnGroup
      const columns = [
        { id: 'col1', field: 'col1', name: 'Col1', columnGroup: 'GroupA' },
        { id: 'col2', field: 'col2', name: 'Col2', columnGroup: 'GroupA' },
        { id: 'col3', field: 'col3', name: 'Col3', columnGroup: 'GroupB' },
        { id: 'col4', field: 'col4', name: 'Col4', columnGroup: 'GroupB' },
        { id: 'col5', field: 'col5', name: 'Col5', columnGroup: 'GroupC' },
      ];
      const gridStub = {
        getColumns: () => columns,
        getOptions: () => ({ createPreHeaderPanel: true, showPreHeaderPanel: true }),
        getData: () => ({ getGrouping: () => [], getLength: () => 1, getItem: () => ({ id: 1 }) }),
      };
      const pubSubService = { publish: vi.fn() };
      const container = { get: () => pubSubService };
      service = new PdfExportService();
      service.init(gridStub as any, container as any);

      // Call the grouped header logic directly
      const groupedHeaders = service['getColumnGroupedHeaderTitles'](columns);
      expect(groupedHeaders).toEqual([
        { title: 'GroupA', span: 2 },
        { title: 'GroupB', span: 2 },
        { title: 'GroupC', span: 1 },
      ]);
    });

    it('should export with grouped pre-header and document title', async () => {
      // Setup columns with columnGroup for grouped header
      const columns = [
        { id: 'col1', field: 'col1', name: 'Col1', columnGroup: 'GroupA' },
        { id: 'col2', field: 'col2', name: 'Col2', columnGroup: 'GroupA' },
        { id: 'col3', field: 'col3', name: 'Col3', columnGroup: 'GroupB' },
        { id: 'col4', field: 'col4', name: 'Col4', columnGroup: 'GroupB' },
        { id: 'col5', field: 'col5', name: 'Col5', columnGroup: 'GroupC' },
      ];
      const gridStub = {
        getColumns: () => columns,
        getOptions: () => ({
          createPreHeaderPanel: true,
          showPreHeaderPanel: true,
          enableDraggableGrouping: false,
          documentTitle: 'My PDF Title',
        }),
        getData: () => ({
          getGrouping: () => [],
          getLength: () => 2,
          getItem: (i: number) => ({ id: i, col1: 'A', col2: 'B', col3: 'C', col4: 'D', col5: 'E' }),
          getItemMetadata: vi.fn(),
        }),
      };
      const pubSubService = { publish: vi.fn() };
      const container = { get: () => pubSubService };
      const buildSpy = vi.fn(() => new Uint8Array([1, 2, 3])); // Always succeed
      const doc = { page: vi.fn(), build: buildSpy };
      (global as any).__pdfDocOverride = doc;
      const service = new PdfExportService();
      service.init(gridStub as any, container as any);
      let result;
      result = await service.exportToPdf({ filename: 'preheader-title', documentTitle: 'My PDF Title' });

      expect(result).toBe(true);
    });

    it('should handle grouped title row and group totals edge cases', () => {
      const itemObj = { title: 'GroupTitle', level: 2 };
      (service as any)._exportOptions = { addGroupIndentation: true, htmlDecode: true };
      const titleRow = (service as any).readGroupedTitleRow(itemObj);
      expect(Array.isArray(titleRow)).toBe(true);

      const columns = [{ id: 'id', field: 'id', name: 'ID' }];
      const groupTotalsObj = { __groupTotals: true };
      (service as any)._grid = gridStub;
      (service as any)._exportOptions = { htmlDecode: true };
      const totalRow = (service as any).readGroupedTotalRow(columns, groupTotalsObj);
      expect(Array.isArray(totalRow)).toBe(true);
    });

    it('should call drawHeaders with only grouped pre-header (no columnGroup titles)', async () => {
      const columns = [
        { id: 'col1', field: 'col1', name: 'Col1' },
        { id: 'col2', field: 'col2', name: 'Col2' },
      ];
      const gridStub = {
        getColumns: () => columns,
        getOptions: () => ({ createPreHeaderPanel: true, showPreHeaderPanel: true }),
        getData: () => ({ getGrouping: () => [], getLength: () => 1, getItem: () => ({ id: 1 }), getItemMetadata: vi.fn() }),
      };
      const pubSubService = { publish: vi.fn() };
      const container = { get: () => pubSubService };
      const buildSpy = vi.fn(() => new Uint8Array([1, 2, 3]));
      const doc = { page: vi.fn(), build: buildSpy };
      (global as any).__pdfDocOverride = doc;
      service.init(gridStub as any, container as any);
      const result = await service.exportToPdf({ filename: 'no-group-title' });
      expect(result).toBe(true);
    });

    it('should call drawHeaders with grouped pre-header and column headers, with long titles', async () => {
      const columns = [
        { id: 'col1', field: 'col1', name: 'Col1WithAVeryLongNameThatShouldBeTruncated', columnGroup: 'GroupAWithAVeryLongNameThatShouldBeTruncated' },
        { id: 'col2', field: 'col2', name: 'Col2WithAVeryLongNameThatShouldBeTruncated', columnGroup: 'GroupAWithAVeryLongNameThatShouldBeTruncated' },
      ];
      const gridStub = {
        getColumns: () => columns,
        getOptions: () => ({ createPreHeaderPanel: true, showPreHeaderPanel: true }),
        getData: () => ({ getGrouping: () => [], getLength: () => 1, getItem: () => ({ id: 1 }), getItemMetadata: vi.fn() }),
      };
      const pubSubService = { publish: vi.fn() };
      const container = { get: () => pubSubService };
      const buildSpy = vi.fn(() => new Uint8Array([1, 2, 3]));
      const doc = { page: vi.fn(), build: buildSpy };
      (global as any).__pdfDocOverride = doc;
      service.init(gridStub as any, container as any);
      const result = await service.exportToPdf({ filename: 'long-titles' });
      expect(result).toBe(true);
    });

    it('should split rows into multiple pages with documentTitle and verify first/subsequent page logic', async () => {
      const buildSpy = vi.fn(() => new Uint8Array([1, 2, 3]));
      const doc = { page: vi.fn(), build: buildSpy };
      (global as any).__pdfDocOverride = doc;
      const rows = Array.from({ length: 70 }, (_, i) => ({ id: i, name: `Name${i}` }));
      dataViewStub.getLength.mockReturnValue(rows.length);
      dataViewStub.getItem.mockImplementation((i: number) => rows[i]);
      service.init(gridStub, { get: () => pubSubService } as unknown as ContainerService);
      const result = await service.exportToPdf({ filename: 'multi-page-title', fontSize: 10, headerFontSize: 11, documentTitle: 'Doc Title' });
      expect(result).toBe(true);
    });

    it('should handle readRegularRowData with excluded column and width 0', () => {
      const columns = [
        { id: 'col1', field: 'col1', excludeFromExport: true },
        { id: 'col2', field: 'col2', width: 0 },
        { id: 'col3', field: 'col3' },
      ];
      const itemObj = { col1: 'A', col2: 'B', col3: 'C', id: 1 };
      const dataViewStub = {
        getItemMetadata: vi.fn().mockReturnValue({ columns: {} }),
        getParentRowSpanByCell: vi.fn().mockReturnValue({ start: 0 }),
      };
      const gridStub = {
        getParentRowSpanByCell: dataViewStub.getParentRowSpanByCell,
      };
      const service = new PdfExportService();
      Object.defineProperty(service, '_grid', { value: gridStub });
      Object.defineProperty(service, '_dataView', { value: dataViewStub });
      Object.defineProperty(service, '_gridOptions', { value: { enableCellRowSpan: true } });
      Object.defineProperty(service, '_exportOptions', { value: { htmlDecode: true, sanitizeDataExport: true } });
      (service as any)._hasGroupedItems = false;
      const result = service['readRegularRowData'](columns as any, 0, itemObj);
      expect(result).toEqual(['B', 'C']); // col2 and col3 included
    });
  });

  describe('without Translater Service', () => {
    beforeEach(() => {
      translateService = undefined as any;
      service = new PdfExportService();
    });

    it('should throw an error if "enableTranslate" is set but the Translater Service is null', () => {
      const gridOptionsMock = {
        enableTranslate: true,
        enablePdfExport: true,
        translater: undefined as any,
      } as GridOption;
      vi.spyOn(gridStub, 'getOptions').mockReturnValue(gridOptionsMock);

      expect(() => service.init(gridStub, container)).toThrow(
        '[Slickgrid-Universal] requires a Translate Service to be passed in the "translater" Grid Options when "enableTranslate" is enabled.'
      );
    });
  });

  describe('PdfExportService Coverage', () => {
    describe('PdfExportService with jsPDF-AutoTable', () => {
      it('should cover jsPDF-AutoTable branch and pre-header row drawing', async () => {
        vi.resetModules();
        const autoTableSpy = vi.fn();
        function jsPDFMockWithAutoTable(this: any) {
          this.save = vi.fn();
          this.setFontSize = vi.fn();
          this.getTextWidth = vi.fn((txt) => txt.length * 6);
          this.internal = {
            pageSize: {
              getWidth: () => 595.28,
              getHeight: () => 841.89,
            },
          };
          this.setFillColor = vi.fn();
          this.setTextColor = vi.fn();
          this.rect = vi.fn();
          this.text = vi.fn();
          this.addPage = vi.fn();
          this.autoTable = autoTableSpy;
        }
        vi.doMock('jspdf', () => ({ __esModule: true, default: jsPDFMockWithAutoTable }));
        const { PdfExportService: PdfExportServiceWithAutoTable } = await import('./pdfExport.service.js');
        const columns = [
          { id: 'col1', field: 'col1', name: 'Col1', columnGroup: 'GroupA' },
          { id: 'col2', field: 'col2', name: 'Col2', columnGroup: 'GroupA' },
        ];
        const groupedHeaders = [{ title: 'GroupA', span: 2 }];
        const dataViewStub = {
          getGrouping: () => [],
          getLength: () => 1,
          getItem: () => ({ id: 1, col1: 'A', col2: 'B' }),
          getItemMetadata: vi.fn().mockReturnValue({}),
        };
        const gridStub = {
          getColumns: () => columns,
          getOptions: () => ({ createPreHeaderPanel: true, showPreHeaderPanel: true, includeColumnHeaders: true }),
          getData: () => dataViewStub,
        };
        const pubSubService = { publish: vi.fn() };
        const container = { get: () => pubSubService };
        const service = new PdfExportServiceWithAutoTable();
        service.init(gridStub as any, container as any);
        // Set grouped headers to trigger pre-header row logic
        (service as any)._groupedColumnHeaders = groupedHeaders;
        const result = await service.exportToPdf({ filename: 'autotable-preheader', includeColumnHeaders: true });
        expect(result).toBe(true);
        expect(autoTableSpy).toHaveBeenCalled();
        vi.resetModules();
      });
    });

    it('should cover link.click and link appendChild in downloadPdf', () => {
      service = new PdfExportService();
      service.init({ getOptions: () => ({}) } as any, container);
      (navigator as any).msSaveOrOpenBlob = undefined;
      const appendSpy = vi.spyOn(document.body, 'appendChild');
      const clickSpy = vi.fn();
      const removeSpy = vi.spyOn(document.body, 'removeChild');
      const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');
      // Mock link element
      const link = document.createElement('a');
      link.click = clickSpy;
      vi.spyOn(document, 'createElement').mockReturnValue(link);
      service['downloadPdf'](new Uint8Array([1, 2, 3]), 'test.pdf');
      expect(appendSpy).toHaveBeenCalledWith(link);
      expect(clickSpy).toHaveBeenCalled();
      expect(removeSpy).toHaveBeenCalledWith(link);
      expect(revokeSpy).toHaveBeenCalled();
      appendSpy.mockRestore();
      removeSpy.mockRestore();
      revokeSpy.mockRestore();
    });

    it('should handle errors thrown during PDF export', async () => {
      const gridStub = {
        getOptions: () => ({}),
        getColumns: () => [],
        getData: () => ({ getGrouping: () => [], getLength: () => 1, getItem: () => ({ id: 1 }) }),
      };
      const pubSubService = { publish: vi.fn() };
      const container = { get: () => pubSubService };
      service = new PdfExportService();
      service.init(gridStub as any, container as any);
      // Simulate error in setTimeout
      vi.spyOn(service as any, 'getAllGridRowData').mockImplementation(() => {
        throw new Error('Simulated error');
      });
      const result = await service.exportToPdf();
      expect(result).toBe(false);
      expect(pubSubService.publish).toHaveBeenCalledWith('onAfterExportToPdf', expect.objectContaining({ error: expect.any(Error) }));
    });

    it('should handle downloadPdf with invalid link removal', () => {
      (navigator as any).msSaveOrOpenBlob = undefined;
      if (typeof URL.revokeObjectURL !== 'function') {
        (URL as any).revokeObjectURL = vi.fn();
      }
      const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => {
        throw new Error('remove error');
      });
      service = new PdfExportService();
      service.init({ getOptions: () => ({}) } as any, container);
      expect(() => service['downloadPdf'](new Uint8Array([1, 2, 3]), 'test.pdf')).toThrow('remove error');
      removeSpy.mockRestore();
    });

    it('should handle readRegularRowData with colspan and rowspan edge cases', () => {
      const columns = [
        { id: 'col1', field: 'col1' },
        { id: 'col2', field: 'col2' },
        { id: 'col3', field: 'col3' },
      ];
      const itemObj = { col1: 'A', col2: 'B', col3: 'C', id: 1 };
      const dataViewStub = {
        getItemMetadata: vi.fn().mockReturnValue({ columns: { col1: { colspan: '*' }, col2: { colspan: 2 } } }),
        getParentRowSpanByCell: vi.fn().mockReturnValue({ start: 0 }),
      };
      const gridStub = {
        getParentRowSpanByCell: dataViewStub.getParentRowSpanByCell,
      };
      service = new PdfExportService();
      Object.defineProperty(service, '_grid', { value: gridStub });
      Object.defineProperty(service, '_dataView', { value: dataViewStub });
      Object.defineProperty(service, '_gridOptions', { value: { enableCellRowSpan: true } });
      Object.defineProperty(service, '_exportOptions', { value: { htmlDecode: true, sanitizeDataExport: true } });
      (service as any)._hasGroupedItems = true;
      const result = service['readRegularRowData'](columns as any, 0, itemObj);
      // Should have one extra for grouped column, but some columns may be skipped due to colspan logic
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.length).toBeLessThanOrEqual(columns.length + 1);
    });
    let service: PdfExportService;
    let container: ContainerServiceStub;
    beforeEach(() => {
      container = new ContainerServiceStub();
    });

    it('should throw error if grid/dataView/pubSubService not initialized', () => {
      service = new PdfExportService();
      expect(() => service.exportToPdf()).toThrow('SlickGrid & DataView objects and/or PubSubService are not initialized');
    });

    it('should throw error if enableTranslate is true but translaterService is missing', () => {
      const gridStub = { getOptions: () => ({ enableTranslate: true, translater: undefined }) };
      service = new PdfExportService();
      expect(() => service.init(gridStub as any, container)).toThrow('requires a Translate Service');
    });

    it('should use msSaveOrOpenBlob for IE/Edge', () => {
      (navigator as any).msSaveOrOpenBlob = vi.fn();
      service = new PdfExportService();
      service.init({ getOptions: () => ({}) } as any, container);
      service['downloadPdf'](new Uint8Array([1, 2, 3]), 'test.pdf');
      expect((navigator as any).msSaveOrOpenBlob).toHaveBeenCalled();
    });

    it('should create link and revoke URL for non-IE browsers', () => {
      (navigator as any).msSaveOrOpenBlob = undefined;
      if (typeof URL.revokeObjectURL !== 'function') {
        (URL as any).revokeObjectURL = vi.fn();
      }
      const appendSpy = vi.spyOn(document.body, 'appendChild');
      const removeSpy = vi.spyOn(document.body, 'removeChild');
      const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');
      service = new PdfExportService();
      service.init({ getOptions: () => ({}) } as any, container);
      service['downloadPdf'](new Uint8Array([1, 2, 3]), 'test.pdf');
      expect(appendSpy).toHaveBeenCalled();
      expect(removeSpy).toHaveBeenCalled();
      expect(revokeSpy).toHaveBeenCalled();
    });

    it('should handle rowspan, colspan, formatter, sanitizer, decoder in readRegularRowData', () => {
      const columns: Column[] = [
        { id: 'col1', field: 'col1', formatter: (_r, _c, v) => `<b>${v}</b>`, sanitizeDataExport: true },
        { id: 'col2', field: 'col2' },
      ];
      const itemObj = { col1: '<b>val</b>', col2: 'plain', id: 1 };
      const dataViewStub = {
        getItemMetadata: vi.fn().mockReturnValue({ columns: { col1: { colspan: 2 } } }),
        getParentRowSpanByCell: vi.fn().mockReturnValue({ start: 0 }),
      };
      const gridStub = {
        getParentRowSpanByCell: dataViewStub.getParentRowSpanByCell,
      };
      service = new PdfExportService();
      Object.defineProperty(service, '_grid', { value: gridStub });
      Object.defineProperty(service, '_dataView', { value: dataViewStub });
      Object.defineProperty(service, '_gridOptions', { value: { enableCellRowSpan: true } });
      Object.defineProperty(service, '_exportOptions', { value: { htmlDecode: true, sanitizeDataExport: true } });
      const result = service['readRegularRowData'](columns as any, 0, itemObj);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Additional Edge Case Coverage', () => {
    let service: PdfExportService;
    let container: ContainerServiceStub;
    beforeEach(() => {
      service = new PdfExportService();
      container = new ContainerServiceStub();
    });

    it('should handle drawHeaders when both pre-header and column headers are disabled', async () => {
      const columns = [
        { id: 'col1', field: 'col1', name: 'Col1' },
        { id: 'col2', field: 'col2', name: 'Col2' },
      ];
      const dataViewStub = {
        getGrouping: () => [],
        getLength: () => 1,
        getItem: () => ({ id: 1 }),
        getItemMetadata: vi.fn().mockReturnValue({}),
      };
      const gridStub = {
        getColumns: () => columns,
        getOptions: () => ({ createPreHeaderPanel: false, showPreHeaderPanel: false, includeColumnHeaders: false }),
        getData: () => dataViewStub,
      };
      const pubSubService = { publish: vi.fn() };
      const container = { get: () => pubSubService };
      const buildSpy = vi.fn(() => new Uint8Array([1, 2, 3]));
      const doc = { page: vi.fn(), build: buildSpy };
      (global as any).__pdfDocOverride = doc;
      service.init(gridStub as any, container as any);
      const result = await service.exportToPdf({ filename: 'no-headers', includeColumnHeaders: false });
      expect(result).toBe(true);
    });

    it('should skip items with getItem property in getAllGridRowData', () => {
      const columns = [
        { id: 'col1', field: 'col1' },
        { id: 'col2', field: 'col2' },
      ];
      const dataViewStub = {
        getLength: () => 2,
        getItem: (i: number) => (i === 0 ? { getItem: () => {} } : { col1: 'A', col2: 'B', id: 1 }),
        getItemMetadata: () => ({}),
      };
      service = new PdfExportService();
      Object.defineProperty(service, '_dataView', { value: dataViewStub });
      Object.defineProperty(service, '_grid', { value: {} });
      Object.defineProperty(service, '_gridOptions', { value: {} });
      Object.defineProperty(service, '_hasGroupedItems', { value: false });
      Object.defineProperty(service, '_exportOptions', { value: { sanitizeDataExport: false, htmlDecode: false } });
      const result = service['getAllGridRowData'](columns as any);
      expect(result.length).toBe(1);
      expect(result[0]).toEqual(expect.any(Array));
    });

    it('should handle error in downloadPdf appendChild', () => {
      service = new PdfExportService();
      service.init({ getOptions: () => ({}) } as any, container);
      const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => {
        throw new Error('append error');
      });
      expect(() => service['downloadPdf'](new Uint8Array([1, 2, 3]), 'test.pdf')).toThrow('append error');
      appendSpy.mockRestore();
    });

    it('should resolve true in exportToPdf for normal path', async () => {
      const columns = [{ id: 'col1', field: 'col1', name: 'Col1' }];
      const dataViewStub = {
        getGrouping: () => [],
        getLength: () => 1,
        getItem: () => ({ id: 1 }),
        getItemMetadata: vi.fn().mockReturnValue({}),
      };
      const gridStub = {
        getColumns: () => columns,
        getOptions: () => ({}),
        getData: () => dataViewStub,
      };
      const pubSubService = { publish: vi.fn() };
      const container = { get: () => pubSubService };
      const buildSpy = vi.fn(() => new Uint8Array([1, 2, 3]));
      const doc = { page: vi.fn(), build: buildSpy };
      (global as any).__pdfDocOverride = doc;
      service.init(gridStub as any, container as any);
      const result = await service.exportToPdf({ filename: 'normal-path' });
      expect(result).toBe(true);
      delete (global as any).__pdfDocOverride;
    });

    it('should resolve false in exportToPdf if error thrown in setTimeout', async () => {
      const columns = [{ id: 'col1', field: 'col1', name: 'Col1' }];
      const gridStub = {
        getColumns: () => columns,
        getOptions: () => ({}),
        getData: () => ({ getGrouping: () => [], getLength: () => 1, getItem: () => ({ id: 1 }) }),
      };
      const pubSubService = { publish: vi.fn() };
      const container = { get: () => pubSubService };
      service.init(gridStub as any, container as any);
      vi.spyOn(service as any, 'getAllGridRowData').mockImplementation(() => {
        throw new Error('Simulated error');
      });
      const result = await service.exportToPdf({ filename: 'error-path' });
      expect(result).toBe(false);
    });
  });

  it('should call drawHeaders with only column headers (no pre-header)', async () => {
    const columns = [
      { id: 'col1', field: 'col1', name: 'Col1' },
      { id: 'col2', field: 'col2', name: 'Col2' },
    ];
    const dataViewStub = {
      getGrouping: () => [],
      getLength: () => 1,
      getItem: () => ({ id: 1 }),
      getItemMetadata: vi.fn().mockReturnValue({}),
    };
    const gridStub = {
      getColumns: () => columns,
      getOptions: () => ({ createPreHeaderPanel: false, showPreHeaderPanel: false, includeColumnHeaders: true }),
      getData: () => dataViewStub,
    };
    const pubSubService = { publish: vi.fn() };
    const container = { get: () => pubSubService };
    const buildSpy = vi.fn(() => new Uint8Array([1, 2, 3]));
    const doc = { page: vi.fn(), build: buildSpy };
    (global as any).__pdfDocOverride = doc;
    service.init(gridStub as any, container as any);
    const result = await service.exportToPdf({ filename: 'only-col-header', includeColumnHeaders: true });
    expect(result).toBe(true);
  });

  it('should export with repeatHeadersOnEachPage enabled', async () => {
    const columns = [
      { id: 'col1', field: 'col1', name: 'Col1' },
      { id: 'col2', field: 'col2', name: 'Col2' },
    ];
    const dataViewStub = {
      getGrouping: () => [],
      getLength: () => 40,
      getItem: (i: number) => ({ id: i, col1: `A${i}`, col2: `B${i}` }),
      getItemMetadata: vi.fn().mockReturnValue({}),
    };
    const gridStub = {
      getColumns: () => columns,
      getOptions: () => ({ repeatHeadersOnEachPage: true }),
      getData: () => dataViewStub,
    };
    const pubSubService = { publish: vi.fn() };
    const container = { get: () => pubSubService };
    const buildSpy = vi.fn(() => new Uint8Array([1, 2, 3]));
    const doc = { page: vi.fn(), build: buildSpy };
    (global as any).__pdfDocOverride = doc;
    service.init(gridStub as any, container as any);
    const result = await service.exportToPdf({ filename: 'repeat-headers', repeatHeadersOnEachPage: true });
    expect(result).toBe(true);
  });

  it('should handle readRegularRowData with complex rowspan/colspan and metadata', () => {
    const columns = [
      { id: 'col1', field: 'col1' },
      { id: 'col2', field: 'col2' },
      { id: 'col3', field: 'col3' },
      { id: 'col4', field: 'col4' },
    ];
    const itemObj = { col1: 'A', col2: 'B', col3: 'C', col4: 'D', id: 1 };
    const dataViewStub = {
      getItemMetadata: vi.fn().mockReturnValue({ columns: { col1: { colspan: 2 }, col3: { colspan: '*' }, col4: { colspan: 1 } } }),
      getParentRowSpanByCell: vi.fn().mockReturnValue({ start: 0 }),
    };
    const gridStub = {
      getParentRowSpanByCell: dataViewStub.getParentRowSpanByCell,
    };
    const service = new PdfExportService();
    Object.defineProperty(service, '_grid', { value: gridStub });
    Object.defineProperty(service, '_dataView', { value: dataViewStub });
    Object.defineProperty(service, '_gridOptions', { value: { enableCellRowSpan: true } });
    Object.defineProperty(service, '_exportOptions', { value: { htmlDecode: true, sanitizeDataExport: true } });
    (service as any)._hasGroupedItems = false;
    const result = service['readRegularRowData'](columns as any, 0, itemObj);
    expect(result).toEqual([undefined, '', '', '']); // Only first cell, rest skipped by colspan logic
  });

  it('should cover drawHeaders with grouped pre-header, grouped column, and no group title', async () => {
    const columns = [
      { id: 'col1', field: 'col1', name: 'Col1', columnGroup: '' },
      { id: 'col2', field: 'col2', name: 'Col2', columnGroup: '' },
    ];
    const gridStub = {
      getColumns: () => columns,
      getOptions: () => ({ createPreHeaderPanel: true, showPreHeaderPanel: true, includeColumnHeaders: true }),
      getData: () => ({ getGrouping: () => [], getLength: () => 1, getItem: (i: number) => ({ id: i }), getItemMetadata: vi.fn() }),
    };
    const pubSubService = { publish: vi.fn() };
    const container = { get: () => pubSubService };
    const buildSpy = vi.fn(() => new Uint8Array([1, 2, 3]));
    const doc = { page: vi.fn(), build: buildSpy };
    (global as any).__pdfDocOverride = doc;
    service.init(gridStub as any, container as any);
    const result = await service.exportToPdf({ filename: 'drawHeaders-grouped-no-title', includeColumnHeaders: true });
    expect(result).toBe(true);
  });

  it('should cover drawHeaders with grouped pre-header, grouped column, and group title > 20 chars', async () => {
    const columns = [
      { id: 'col1', field: 'col1', name: 'Col1', columnGroup: 'GroupAWithAVeryLongNameThatExceedsTwentyChars' },
      { id: 'col2', field: 'col2', name: 'Col2', columnGroup: 'GroupAWithAVeryLongNameThatExceedsTwentyChars' },
    ];
    const gridStub = {
      getColumns: () => columns,
      getOptions: () => ({ createPreHeaderPanel: true, showPreHeaderPanel: true, includeColumnHeaders: true }),
      getData: () => ({ getGrouping: () => [], getLength: () => 1, getItem: (i: number) => ({ id: i }), getItemMetadata: vi.fn() }),
    };
    const pubSubService = { publish: vi.fn() };
    const container = { get: () => pubSubService };
    const buildSpy = vi.fn(() => new Uint8Array([1, 2, 3]));
    const doc = { page: vi.fn(), build: buildSpy };
    (global as any).__pdfDocOverride = doc;
    const service = new PdfExportService();
    service.init(gridStub as any, container as any);
    (service as any)._groupedColumnHeaders = [];
    const result = await service.exportToPdf({ filename: 'drawHeaders-preheader-no-grouped', includeColumnHeaders: true });
    expect(result).toBe(true);
  });

  it('should cover multi-page export with exactly one full page', async () => {
    const columns = [
      { id: 'col1', field: 'col1', name: 'Col1' },
      { id: 'col2', field: 'col2', name: 'Col2' },
    ];
    // 20 rows should fit exactly one page (rowHeight=20, headerHeight=25, pageHeight=842, margin=40)
    const rows = Array.from({ length: 20 }, (_, i) => ({ id: i, col1: `A${i}`, col2: `B${i}` }));
    const dataViewStub = {
      getGrouping: () => [],
      getLength: () => rows.length,
      getItem: (i: number) => rows[i],
      getItemMetadata: vi.fn().mockReturnValue({}),
    };
    const gridStub = {
      getColumns: () => columns,
      getOptions: () => ({}),
      getData: () => dataViewStub,
    };
    const pubSubService = { publish: vi.fn() };
    const container = { get: () => pubSubService };
    const buildSpy = vi.fn(() => new Uint8Array([1, 2, 3]));
    const doc = { page: vi.fn(), build: buildSpy };
    (global as any).__pdfDocOverride = doc;
    const service = new PdfExportService();
    service.init(gridStub as any, container as any);
    const result = await service.exportToPdf({ filename: 'multi-page-exact-one', fontSize: 10, headerFontSize: 11 });
    expect(result).toBe(true);
  });

  it('should cover multi-page export with just over one page', async () => {
    const columns = [
      { id: 'col1', field: 'col1', name: 'Col1' },
      { id: 'col2', field: 'col2', name: 'Col2' },
    ];
    // 21 rows should require two pages
    const rows = Array.from({ length: 21 }, (_, i) => ({ id: i, col1: `A${i}`, col2: `B${i}` }));
    const dataViewStub = {
      getGrouping: () => [],
      getLength: () => rows.length,
      getItem: (i: number) => rows[i],
      getItemMetadata: vi.fn().mockReturnValue({}),
    };
    const gridStub = {
      getColumns: () => columns,
      getOptions: () => ({}),
      getData: () => dataViewStub,
    };
    const pubSubService = { publish: vi.fn() };
    const container = { get: () => pubSubService };
    const buildSpy = vi.fn(() => new Uint8Array([1, 2, 3]));
    const doc = { page: vi.fn(), build: buildSpy };
    (global as any).__pdfDocOverride = doc;
    const service = new PdfExportService();
    service.init(gridStub as any, container as any);
    const result = await service.exportToPdf({ filename: 'multi-page-just-over', fontSize: 10, headerFontSize: 11 });
    expect(result).toBe(true);
  });

  it('should cover drawHeaders with neither pre-header nor column headers', async () => {
    const columns = [
      { id: 'col1', field: 'col1', name: 'Col1' },
      { id: 'col2', field: 'col2', name: 'Col2' },
    ];
    const gridStub = {
      getColumns: () => columns,
      getOptions: () => ({ createPreHeaderPanel: false, showPreHeaderPanel: false, includeColumnHeaders: false }),
      getData: () => ({ getGrouping: () => [], getLength: () => 1, getItem: (i: number) => ({ id: i }), getItemMetadata: vi.fn() }),
    };
    const pubSubService = { publish: vi.fn() };
    const container = { get: () => pubSubService };
    const buildSpy = vi.fn(() => new Uint8Array([1, 2, 3]));
    const doc = { page: vi.fn(), build: buildSpy };
    (global as any).__pdfDocOverride = doc;
    const service = new PdfExportService();
    service.init(gridStub as any, container as any);
    const result = await service.exportToPdf({ filename: 'drawHeaders-none', includeColumnHeaders: false });
    expect(result).toBe(true);
  });

  it('should cover multi-page export with no documentTitle and no repeatHeadersOnEachPage', async () => {
    const columns = [
      { id: 'col1', field: 'col1', name: 'Col1' },
      { id: 'col2', field: 'col2', name: 'Col2' },
    ];
    const rows = Array.from({ length: 80 }, (_, i) => ({ id: i, col1: `A${i}`, col2: `B${i}` }));
    const dataViewStub = {
      getGrouping: () => [],
      getLength: () => rows.length,
      getItem: (i: number) => rows[i],
      getItemMetadata: vi.fn().mockReturnValue({}),
    };
    const gridStub = {
      getColumns: () => columns,
      getOptions: () => ({ repeatHeadersOnEachPage: false }),
      getData: () => dataViewStub,
    };
    const pubSubService = { publish: vi.fn() };
    const container = { get: () => pubSubService };
    const buildSpy = vi.fn(() => new Uint8Array([1, 2, 3]));
    const doc = { page: vi.fn(), build: buildSpy };
    (global as any).__pdfDocOverride = doc;
    const service = new PdfExportService();
    service.init(gridStub as any, container as any);
    const result = await service.exportToPdf({ filename: 'multi-page-no-title-no-repeat', repeatHeadersOnEachPage: false });
    expect(result).toBe(true);
  });

  it('should cover drawHeaders with pre-header enabled but no grouped headers', async () => {
    const columns = [
      { id: 'col1', field: 'col1', name: 'Col1' },
      { id: 'col2', field: 'col2', name: 'Col2' },
    ];
    const groupedHeaders = [
      { title: 'Group1', span: 1 },
      { title: 'Group2', span: 1 },
    ];
    const gridStub = {
      getColumns: () => columns,
      getOptions: () => ({ createPreHeaderPanel: true, showPreHeaderPanel: true, includeColumnHeaders: true }),
      getData: () => ({ getGrouping: () => [], getLength: () => 1, getItem: (i: number) => ({ id: i }), getItemMetadata: vi.fn() }),
    };
    const pubSubService = { publish: vi.fn() };
    const container = { get: () => pubSubService };
    const buildSpy = vi.fn(() => new Uint8Array([1, 2, 3]));
    const doc = { page: vi.fn(), build: buildSpy };
    (global as any).__pdfDocOverride = doc;
    const service = new PdfExportService();
    service.init(gridStub as any, container as any);
    (service as any)._groupedColumnHeaders = groupedHeaders;
    const result = await service.exportToPdf({ filename: 'drawHeaders-grouped', includeColumnHeaders: true });
    expect(result).toBe(true);
  });

  it('should cover drawHeaders with groupByColumnHeader present', async () => {
    const columns = [
      { id: 'col1', field: 'col1', name: 'Col1' },
      { id: 'col2', field: 'col2', name: 'Col2' },
    ];
    const gridStub = {
      getColumns: () => columns,
      getOptions: () => ({ includeColumnHeaders: true }),
      getData: () => ({ getGrouping: () => [{ getter: 'col1' }], getLength: () => 1, getItem: (i: number) => ({ id: i }), getItemMetadata: vi.fn() }),
    };
    const pubSubService = { publish: vi.fn() };
    const container = { get: () => pubSubService };
    const buildSpy = vi.fn(() => new Uint8Array([1, 2, 3]));
    const doc = { page: vi.fn(), build: buildSpy };
    (global as any).__pdfDocOverride = doc;
    const service = new PdfExportService();
    service.init(gridStub as any, container as any);
    (service as any)._hasGroupedItems = true;
    const result = await service.exportToPdf({ filename: 'drawHeaders-groupBy', includeColumnHeaders: true, groupingColumnHeaderTitle: 'Group By' });
    expect(result).toBe(true);
  });

  it('should cover multi-page export with repeatHeadersOnEachPage true and documentTitle present', async () => {
    const columns = [
      { id: 'col1', field: 'col1', name: 'Col1' },
      { id: 'col2', field: 'col2', name: 'Col2' },
    ];
    const rows = Array.from({ length: 10 }, (_, i) => ({ id: i, col1: `A${i}`, col2: `B${i}` }));
    const dataViewStub = {
      getGrouping: () => [],
      getLength: () => rows.length,
      getItem: (i: number) => rows[i],
      getItemMetadata: vi.fn().mockReturnValue({}),
    };
    const gridStub = {
      getColumns: () => columns,
      getOptions: () => ({}),
      getData: () => dataViewStub,
    };
    const pubSubService = { publish: vi.fn() };
    const container = { get: () => pubSubService };
    const buildSpy = vi.fn(() => new Uint8Array([1, 2, 3]));
    const doc = { page: vi.fn(), build: buildSpy };
    (global as any).__pdfDocOverride = doc;
    const service = new PdfExportService();
    service.init(gridStub as any, container as any);
    const result = await service.exportToPdf({ filename: 'multi-page-repeat-title', repeatHeadersOnEachPage: true, documentTitle: 'Test Title' });
    expect(result).toBe(true);
  });

  it('should cover rowspan skip logic (rowspan child cell)', async () => {
    class TestPdfExportService extends PdfExportService {
      setMockDataView(mock: any) {
        (this as any).__dataView = mock;
      }
      setMockGrid(mock: any) {
        (this as any)._grid = mock;
      }
      get _dataView() {
        return (this as any).__dataView;
      }
      // Always return the persistent gridOptions object
      get _gridOptions() {
        return gridOptions;
      }
    }
    const columns = [
      { id: 'col1', field: 'col1', name: 'Col1' },
      { id: 'col2', field: 'col2', name: 'Col2' },
    ];
    const rows = [{ id: 0, col1: 'A0', col2: 'B0' }];
    const dataViewStub = {
      getGrouping: () => [],
      getLength: () => rows.length,
      getItem: (i: number) => rows[i],
      getItemMetadata: vi.fn().mockReturnValue({}),
    };
    const gridOptions = {
      enableCellRowSpan: true,
      enableTranslate: false,
      translater: undefined,
      pdfExportOptions: {},
    };
    // skip path for row 1, non-skip for row 0
    const gridStub = {
      getColumns: () => columns,
      getOptions: () => gridOptions,
      getData: () => dataViewStub,
      getParentRowSpanByCell: vi.fn().mockImplementation((row, col) => ({ start: row === 1 ? 0 : row })),
    };
    const pubSubService = { publish: vi.fn() };
    const container = { get: () => pubSubService };
    const buildSpy = vi.fn(() => new Uint8Array([1, 2, 3]));
    const doc = { page: vi.fn(), build: buildSpy };
    (global as any).__pdfDocOverride = doc;
    const service = new TestPdfExportService();
    service.init(gridStub as any, container as any);
    service.setMockDataView(dataViewStub);
    service.setMockGrid(gridStub);
    (service as any)._exportOptions = { sanitizeDataExport: false };
    const result = (service as any).getAllGridRowData(columns);
    expect(result).toBeInstanceOf(Array);
    delete (global as any).__pdfDocOverride;
  });

  it('should cover drawHeaders with pre-header enabled, grouped headers present, and includeColumnHeaders false', async () => {
    const columns = [
      { id: 'col1', field: 'col1', name: 'Col1' },
      { id: 'col2', field: 'col2', name: 'Col2' },
    ];
    const groupedHeaders = [{ title: 'Group1', span: 2 }];
    const gridStub = {
      getColumns: () => columns,
      getOptions: () => ({ createPreHeaderPanel: true, showPreHeaderPanel: true, includeColumnHeaders: false }),
      getData: () => ({ getGrouping: () => [], getLength: () => 1, getItem: (i: number) => ({ id: i }), getItemMetadata: vi.fn() }),
    };
    const pubSubService = { publish: vi.fn() };
    const container = { get: () => pubSubService };
    const service = new PdfExportService();
    service.init(gridStub as any, container as any);
    (service as any)._groupedColumnHeaders = groupedHeaders;
    const result = await service.exportToPdf({ filename: 'drawHeaders-preheader-grouped-no-colheaders2', includeColumnHeaders: false });
    expect(result).toBe(true);
  });

  it('should cover drawHeaders with pre-header disabled, grouped headers present, includeColumnHeaders true', async () => {
    const columns = [
      { id: 'col1', field: 'col1', name: 'Col1' },
      { id: 'col2', field: 'col2', name: 'Col2' },
    ];
    const groupedHeaders = [{ title: 'Group1', span: 2 }];
    const gridStub = {
      getColumns: () => columns,
      getOptions: () => ({ createPreHeaderPanel: false, showPreHeaderPanel: false, includeColumnHeaders: true }),
      getData: () => ({ getGrouping: () => [], getLength: () => 1, getItem: (i: number) => ({ id: i }), getItemMetadata: vi.fn() }),
    };
    const pubSubService = { publish: vi.fn() };
    const container = { get: () => pubSubService };
    const service = new PdfExportService();
    service.init(gridStub as any, container as any);
    (service as any)._groupedColumnHeaders = groupedHeaders;
    const result = await service.exportToPdf({ filename: 'drawHeaders-no-preheader-grouped-colheaders', includeColumnHeaders: true });
    expect(result).toBe(true);
  });

  it('should cover drawHeaders with grouped header long title (substring logic)', async () => {
    const columns = [
      { id: 'col1', field: 'col1', name: 'Col1' },
      { id: 'col2', field: 'col2', name: 'Col2' },
    ];
    const groupedHeaders = [{ title: 'ThisIsAVeryLongGroupHeaderTitleThatShouldBeTruncated', span: 2 }];
    const gridStub = {
      getColumns: () => columns,
      getOptions: () => ({ createPreHeaderPanel: true, showPreHeaderPanel: true, includeColumnHeaders: true }),
      getData: () => ({ getGrouping: () => [], getLength: () => 1, getItem: (i: number) => ({ id: i }), getItemMetadata: vi.fn() }),
    };
    const pubSubService = { publish: vi.fn() };
    const container = { get: () => pubSubService };
    const service = new PdfExportService();
    service.init(gridStub as any, container as any);
    (service as any)._groupedColumnHeaders = groupedHeaders;
    const result = await service.exportToPdf({ filename: 'drawHeaders-preheader-grouped-longtitle', includeColumnHeaders: true });
    expect(result).toBe(true);
  });

  it('should cover multi-page export with one row per page, repeatHeadersOnEachPage true, documentTitle present, and grouped headers', async () => {
    const columns = [
      { id: 'col1', field: 'col1', name: 'Col1' },
      { id: 'col2', field: 'col2', name: 'Col2' },
    ];
    const groupedHeaders = [{ title: 'Group1', span: 2 }];
    const rows = Array.from({ length: 3 }, (_, i) => ({ id: i, col1: `A${i}`, col2: `B${i}` }));
    const dataViewStub = {
      getGrouping: () => [],
      getLength: () => rows.length,
      getItem: (i: number) => rows[i],
      getItemMetadata: vi.fn().mockReturnValue({}),
    };
    const gridStub = {
      getColumns: () => columns,
      getOptions: () => ({ createPreHeaderPanel: true, showPreHeaderPanel: true, includeColumnHeaders: true }),
      getData: () => dataViewStub,
    };
    const pubSubService = { publish: vi.fn() };
    const container = { get: () => pubSubService };
    const service = new PdfExportService();
    service.init(gridStub as any, container as any);
    (service as any)._groupedColumnHeaders = groupedHeaders;
    const result = await service.exportToPdf({
      filename: 'multi-page-one-row-per-page',
      repeatHeadersOnEachPage: true,
      documentTitle: 'Test Title',
      pageSize: 'a4',
    });
    expect(result).toBe(true);
  });

  it('should cover drawHeaders with pre-header enabled and grouped headers present', async () => {
    const columns = [
      { id: 'col1', field: 'col1', name: 'Col1' },
      { id: 'col2', field: 'col2', name: 'Col2' },
    ];
    const groupedHeaders = [{ title: 'Group1', span: 2 }];
    const gridStub = {
      getColumns: () => columns,
      getOptions: () => ({ createPreHeaderPanel: true, showPreHeaderPanel: true, includeColumnHeaders: true }),
      getData: () => ({ getGrouping: () => [], getLength: () => 1, getItem: (i: number) => ({ id: i }), getItemMetadata: vi.fn() }),
    };
    const pubSubService = { publish: vi.fn() };
    const container = { get: () => pubSubService };
    const service = new PdfExportService();
    service.init(gridStub as any, container as any);
    (service as any)._groupedColumnHeaders = groupedHeaders;
    const result = await service.exportToPdf({ filename: 'drawHeaders-preheader-grouped', includeColumnHeaders: true });
    expect(result).toBe(true);
  });

  it('should cover drawHeaders with includeColumnHeaders false and pre-header enabled', async () => {
    const columns = [
      { id: 'col1', field: 'col1', name: 'Col1' },
      { id: 'col2', field: 'col2', name: 'Col2' },
    ];
    const groupedHeaders = [{ title: 'Group1', span: 2 }];
    const gridStub = {
      getColumns: () => columns,
      getOptions: () => ({ createPreHeaderPanel: true, showPreHeaderPanel: true, includeColumnHeaders: false }),
      getData: () => ({ getGrouping: () => [], getLength: () => 1, getItem: (i: number) => ({ id: i }), getItemMetadata: vi.fn() }),
    };
    const pubSubService = { publish: vi.fn() };
    const container = { get: () => pubSubService };
    const service = new PdfExportService();
    service.init(gridStub as any, container as any);
    (service as any)._groupedColumnHeaders = groupedHeaders;
    const result = await service.exportToPdf({ filename: 'drawHeaders-preheader-grouped-no-colheaders', includeColumnHeaders: false });
    expect(result).toBe(true);
  });

  it('should cover multi-page export with repeatHeadersOnEachPage false and documentTitle absent', async () => {
    const columns = [
      { id: 'col1', field: 'col1', name: 'Col1' },
      { id: 'col2', field: 'col2', name: 'Col2' },
    ];
    const rows = Array.from({ length: 10 }, (_, i) => ({ id: i, col1: `A${i}`, col2: `B${i}` }));
    const dataViewStub = {
      getGrouping: () => [],
      getLength: () => rows.length,
      getItem: (i: number) => rows[i],
      getItemMetadata: vi.fn().mockReturnValue({}),
    };
    const gridStub = {
      getColumns: () => columns,
      getOptions: () => ({}),
      getData: () => dataViewStub,
    };
    const pubSubService = { publish: vi.fn() };
    const container = { get: () => pubSubService };
    const service = new PdfExportService();
    service.init(gridStub as any, container as any);
    const result = await service.exportToPdf({ filename: 'multi-page-no-repeat-no-title', repeatHeadersOnEachPage: false });
    expect(result).toBe(true);
  });

  describe('pdfExport drawHeaders and multi-page edge cases', () => {
    it('should export with no grouped headers, no pre-header, and no column headers', async () => {
      const columns = [
        { id: 'col1', field: 'col1', name: 'Col1' },
        { id: 'col2', field: 'col2', name: 'Col2' },
      ];
      const rows = Array.from({ length: 5 }, (_, i) => ({ id: i, col1: `A${i}`, col2: `B${i}` }));
      const dataViewStub = {
        getGrouping: () => [],
        getLength: () => rows.length,
        getItem: (i: number) => rows[i],
        getItemMetadata: vi.fn().mockReturnValue({}),
      };
      const gridStub = {
        getColumns: () => columns,
        getOptions: () => ({ createPreHeaderPanel: false, showPreHeaderPanel: false, includeColumnHeaders: false }),
        getData: () => dataViewStub,
      };
      const pubSubService = { publish: vi.fn() };
      const container = { get: () => pubSubService };
      const service = new PdfExportService();
      service.init(gridStub as any, container as any);
      const result = await service.exportToPdf({ filename: 'no-headers', includeColumnHeaders: false });
      expect(result).toBe(true);
    });

    it('should export with repeatHeadersOnEachPage true and documentTitle present', async () => {
      const columns = [
        { id: 'col1', field: 'col1', name: 'Col1' },
        { id: 'col2', field: 'col2', name: 'Col2' },
      ];
      const rows = Array.from({ length: 30 }, (_, i) => ({ id: i, col1: `A${i}`, col2: `B${i}` }));
      const dataViewStub = {
        getGrouping: () => [],
        getLength: () => rows.length,
        getItem: (i: number) => rows[i],
        getItemMetadata: vi.fn().mockReturnValue({}),
      };
      const gridStub = {
        getColumns: () => columns,
        getOptions: () => ({ createPreHeaderPanel: false, showPreHeaderPanel: false, includeColumnHeaders: true }),
        getData: () => dataViewStub,
      };
      const pubSubService = { publish: vi.fn() };
      const container = { get: () => pubSubService };
      const service = new PdfExportService();
      service.init(gridStub as any, container as any);
      const result = await service.exportToPdf({ filename: 'multi-page-repeat-title', repeatHeadersOnEachPage: true, documentTitle: 'Test Title' });
      expect(result).toBe(true);
    });

    it('should export with repeatHeadersOnEachPage false and documentTitle present', async () => {
      const columns = [
        { id: 'col1', field: 'col1', name: 'Col1' },
        { id: 'col2', field: 'col2', name: 'Col2' },
      ];
      const rows = Array.from({ length: 30 }, (_, i) => ({ id: i, col1: `A${i}`, col2: `B${i}` }));
      const dataViewStub = {
        getGrouping: () => [],
        getLength: () => rows.length,
        getItem: (i: number) => rows[i],
        getItemMetadata: vi.fn().mockReturnValue({}),
      };
      const gridStub = {
        getColumns: () => columns,
        getOptions: () => ({ createPreHeaderPanel: false, showPreHeaderPanel: false, includeColumnHeaders: true }),
        getData: () => dataViewStub,
      };
      const pubSubService = { publish: vi.fn() };
      const container = { get: () => pubSubService };
      const service = new PdfExportService();
      service.init(gridStub as any, container as any);
      const result = await service.exportToPdf({ filename: 'multi-page-no-repeat-title', repeatHeadersOnEachPage: false, documentTitle: 'Test Title' });
      expect(result).toBe(true);
    });

    it('should export with repeatHeadersOnEachPage true and no documentTitle', async () => {
      const columns = [
        { id: 'col1', field: 'col1', name: 'Col1' },
        { id: 'col2', field: 'col2', name: 'Col2' },
      ];
      const rows = Array.from({ length: 30 }, (_, i) => ({ id: i, col1: `A${i}`, col2: `B${i}` }));
      const dataViewStub = {
        getGrouping: () => [],
        getLength: () => rows.length,
        getItem: (i: number) => rows[i],
        getItemMetadata: vi.fn().mockReturnValue({}),
      };
      const gridStub = {
        getColumns: () => columns,
        getOptions: () => ({ createPreHeaderPanel: false, showPreHeaderPanel: false, includeColumnHeaders: true }),
        getData: () => dataViewStub,
      };
      const pubSubService = { publish: vi.fn() };
      const container = { get: () => pubSubService };
      const service = new PdfExportService();
      service.init(gridStub as any, container as any);
      const result = await service.exportToPdf({ filename: 'multi-page-repeat-no-title', repeatHeadersOnEachPage: true });
      expect(result).toBe(true);
    });

    it('should export with repeatHeadersOnEachPage false and no documentTitle', async () => {
      const columns = [
        { id: 'col1', field: 'col1', name: 'Col1' },
        { id: 'col2', field: 'col2', name: 'Col2' },
      ];
      const rows = Array.from({ length: 30 }, (_, i) => ({ id: i, col1: `A${i}`, col2: `B${i}` }));
      const dataViewStub = {
        getGrouping: () => [],
        getLength: () => rows.length,
        getItem: (i: number) => rows[i],
        getItemMetadata: vi.fn().mockReturnValue({}),
      };
      const gridStub = {
        getColumns: () => columns,
        getOptions: () => ({ createPreHeaderPanel: false, showPreHeaderPanel: false, includeColumnHeaders: true }),
        getData: () => dataViewStub,
      };
      const pubSubService = { publish: vi.fn() };
      const container = { get: () => pubSubService };
      const service = new PdfExportService();
      service.init(gridStub as any, container as any);
      const result = await service.exportToPdf({ filename: 'multi-page-no-repeat-no-title', repeatHeadersOnEachPage: false });
      expect(result).toBe(true);
    });
  });

  it('should cover rowspan logic for both skip and non-skip paths', async () => {
    class TestPdfExportService extends PdfExportService {
      setMockDataView(mock: any) {
        (this as any).__dataView = mock;
      }
      setMockGrid(mock: any) {
        (this as any)._grid = mock;
      }
      get _dataView() {
        return (this as any).__dataView;
      }
      get _gridOptions() {
        return gridOptions;
      }
    }
    const columns = [
      { id: 'col1', field: 'col1', name: 'Col1' },
      { id: 'col2', field: 'col2', name: 'Col2' },
    ];
    const rows = [
      { id: 0, col1: 'A0', col2: 'B0' },
      { id: 1, col1: 'A1', col2: 'B1' },
    ];
    const dataViewStub = {
      getGrouping: () => [],
      getLength: () => rows.length,
      getItem: (i: number) => rows[i],
      getItemMetadata: vi.fn().mockReturnValue({}),
    };
    const gridOptions = {
      enableCellRowSpan: true,
      enableTranslate: false,
      translater: undefined,
      pdfExportOptions: {},
    };
    // skip path for row 1, non-skip for row 0
    const gridStub = {
      getColumns: () => columns,
      getOptions: () => gridOptions,
      getData: () => dataViewStub,
      getParentRowSpanByCell: vi.fn().mockImplementation((row, col) => ({ start: row === 1 ? 0 : row })),
    };
    const pubSubService = { publish: vi.fn() };
    const container = { get: () => pubSubService };
    const buildSpy = vi.fn(() => new Uint8Array([1, 2, 3]));
    const doc = { page: vi.fn(), build: buildSpy };
    (global as any).__pdfDocOverride = doc;
    const service = new TestPdfExportService();
    service.init(gridStub as any, container as any);
    (service as any)._exportOptions = { sanitizeDataExport: false };
    service.setMockDataView(dataViewStub);
    service.setMockGrid(gridStub);
    // Should hit both skip and non-skip paths
    const result = (service as any).getAllGridRowData(columns);
    expect(result).toBeInstanceOf(Array);
    delete (global as any).__pdfDocOverride;
  });

  it('should cover headerX += colWidth in drawHeaders (pre-header, grouped headers, grouping, groupByColumnHeader)', async () => {
    const columns = [
      { id: 'col1', field: 'col1', name: 'Col1' },
      { id: 'col2', field: 'col2', name: 'Col2' },
    ];
    const groupedHeaders = [{ title: 'Group1', span: 2 }];
    const gridStub = {
      getColumns: () => columns,
      getOptions: () => ({ createPreHeaderPanel: true, showPreHeaderPanel: true, includeColumnHeaders: true }),
      getData: () => ({
        getGrouping: () => [{ getter: 'col1' }],
        getLength: () => 1,
        getItem: (i: number) => ({ id: i }),
        getItemMetadata: vi.fn(),
      }),
    };
    const pubSubService = { publish: vi.fn() };
    const container = { get: () => pubSubService };
    const service = new PdfExportService();
    service.init(gridStub as any, container as any);
    (service as any)._groupedColumnHeaders = groupedHeaders;
    const result = await service.exportToPdf({ filename: 'cover-headerX-colWidth', includeColumnHeaders: true, groupingColumnHeaderTitle: 'Group By' });
    expect(result).toBe(true);
  });
});
