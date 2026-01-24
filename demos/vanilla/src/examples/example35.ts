import { Filters, Formatters, type Column, type GridOption } from '@slickgrid-universal/common';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { TextExportService } from '@slickgrid-universal/text-export';
import { Slicker, type SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';
import './example35.scss';
import { ExampleGridOptions } from './example-grid-options.js';
import { showToast } from './utilities.js';

interface Chapter {
  id: string;
  chapterName?: string;
  label?: string;
  description?: string;
  dateModified?: Date | string;
  pageNumber: number;
  textColor?: string;
}

interface ChapterTree extends Chapter {
  chapters?: ChapterTree[];
}

export default class Example35 {
  columnDefinitions: Column<Chapter>[];
  gridOptions: GridOption;
  datasetFlat: Chapter[];
  datasetHierarchical: ChapterTree[] = [];
  sgb: SlickVanillaGridBundle;
  searchString = '';
  serverApiDelay = 1000;

  attached() {
    this.initializeGrid();
    this.datasetFlat = [];
    this.datasetHierarchical = this.mockDataset();
    const gridContainerElm = document.querySelector('.grid35') as HTMLDivElement;
    this.sgb = new Slicker.GridBundle(
      gridContainerElm,
      this.columnDefinitions,
      { ...ExampleGridOptions, ...this.gridOptions },
      undefined,
      this.datasetHierarchical
    );

    document.body.classList.add('salesforce-theme');
  }

  dispose() {
    this.sgb?.dispose();
    document.body.classList.remove('salesforce-theme');
  }

  initializeGrid() {
    this.columnDefinitions = [
      {
        id: 'chapterName',
        name: 'Chapter',
        field: 'chapterName',
        width: 150,
        formatter: Formatters.tree,
        filterable: true,
        sortable: true,
      },
      {
        id: 'label',
        name: 'Label',
        field: 'label',
        minWidth: 90,
        formatter: this.coloredTextFormatter,
        filterable: true,
        sortable: true,
      },
      {
        id: 'description',
        name: 'Description',
        field: 'description',
        minWidth: 90,
        formatter: this.coloredTextFormatter,
        filterable: true,
        sortable: true,
      },
      {
        id: 'pageNumber',
        name: 'Page Number',
        field: 'pageNumber',
        minWidth: 90,
        type: 'number',
        exportWithFormatter: true,
        excelExportOptions: { autoDetectCellFormat: false },
        filterable: true,
        filter: { model: Filters.compoundInputNumber },
      },
      {
        id: 'dateModified',
        name: 'Last Date Modified',
        field: 'dateModified',
        formatter: Formatters.date, // base date formatter which requires "params.dateFormat"
        params: {
          dateFormat: 'MMM DD, YYYY, h:mm:ss a',
        },
        type: 'dateUtc',
        outputType: 'dateTimeIso',
        minWidth: 90,
        exportWithFormatter: true,
        filterable: true,
        filter: { model: Filters.compoundDate },
      },
    ];

    this.gridOptions = {
      autoResize: {
        container: '.demo-container',
      },
      enableAutoSizeColumns: true,
      enableAutoResize: true,
      enableExcelExport: true,
      excelExportOptions: {
        exportWithFormatter: true,
        sanitizeDataExport: true,
      },
      enableTextExport: true,
      textExportOptions: {
        exportWithFormatter: true,
        sanitizeDataExport: true,
      },
      enableCheckboxSelector: true,
      enableSelection: true,
      multiSelect: false,
      checkboxSelector: {
        // columnIndexPosition: 1,
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: true,
        onRowToggleStart: (_e, args) => console.log('onBeforeRowToggle', args),
        onSelectAllToggleStart: () => this.sgb.treeDataService.toggleTreeDataCollapse(false, false),
      },
      externalResources: [new ExcelExportService(), new TextExportService()],
      enableFiltering: true,
      enableTreeData: true, // you must enable this flag for the filtering & sorting to work as expected
      multiColumnSort: false, // multi-column sorting is not supported with Tree Data, so you need to disable it
      rowHeight: 35,
      showCustomFooter: true,
      treeDataOptions: {
        columnId: 'chapterName',
        childrenPropName: 'chapters',
        initiallyCollapsed: true,

        // lazy loading function
        lazy: true,
        onLazyLoad: (node: ChapterTree, resolve: (value: ChapterTree[]) => void, reject: () => void) => {
          // simulate backend fetch
          setTimeout(() => {
            if (node.label === 'lazy fetch will FAIL') {
              reject(); // simulate a reject/failure
              showToast('Lazy fetching failed', 'danger');
            } else {
              resolve(this.getChaptersByParentNode(node));
            }
          }, this.serverApiDelay);
        },
      },
    };
  }

  clearSearch() {
    this.searchLabel(new KeyboardEvent('keyup', { code: '', bubbles: true, cancelable: true }));
    (document.querySelector('input.search') as HTMLInputElement).value = '';
  }

  searchLabel(event: KeyboardEvent) {
    this.searchString = (event.target as HTMLInputElement)?.value || '';
    this.updateFilter();
  }

  updateFilter() {
    this.sgb.filterService.updateFilters([{ columnId: 'label', searchTerms: [this.searchString] }], true, false, true);
  }

  clearFilters() {
    this.clearSearch();
    this.sgb.filterService.clearFilters();
  }

  collapseAll() {
    this.sgb.treeDataService.toggleTreeDataCollapse(true);
  }

  expandAll() {
    this.sgb.treeDataService.toggleTreeDataCollapse(false);
  }

  mockDataset(): ChapterTree[] {
    return [
      {
        id: this.generateGUID(),
        chapterName: 'Chapter 1',
        label: 'The intro',
        chapters: [],
        description: `it's all about the introduction`,
        pageNumber: 2,
        dateModified: '2024-03-05T12:44:00.123Z',
      },
      {
        id: this.generateGUID(),
        chapterName: 'Chapter 2',
        label: 'Where it all started',
        chapters: [],
        description: 'hometown to the big city',
        pageNumber: 50,
        dateModified: '2024-04-23T08:33:00.123Z',
      },
      {
        id: this.generateGUID(),
        chapterName: 'Chapter 3',
        label: 'Here I come...',
        chapters: [],
        description: 'here comes a wall',
        pageNumber: 78,
        dateModified: '2024-05-05T12:22:00.123Z',
      },
      {
        id: this.generateGUID(),
        chapterName: 'Chapter 4',
        label: 'Are we there yet?',
        chapters: [],
        description: 'soon...',
        pageNumber: 120,
        dateModified: '2024-04-29T10:24:00.123Z',
      },
      {
        id: this.generateGUID(),
        chapterName: 'Chapter 5',
        label: 'The finale',
        chapters: [],
        description: 'the end is near!',
        pageNumber: 155,
        dateModified: '2024-06-21T07:22:00.123Z',
      },
      {
        id: this.generateGUID(),
        chapterName: 'Chapter 6',
        label: 'End',
        pageNumber: 156,
        dateModified: '2024-06-22T07:22:00.123Z',
      },
      {
        id: this.generateGUID(),
        chapterName: 'Chapter X',
        label: 'lazy fetch will FAIL',
        chapters: [],
        description: '...demo an API call error!!!',
        pageNumber: 999,
        dateModified: '2024-09-28T00:22:00.123Z',
        textColor: 'color-danger',
      },
    ];
  }

  /** simulate a backend fetching to lazy load tree, node with `chapters: []` represent a parent that can be lazily loaded */
  getChaptersByParentNode(node: Chapter): ChapterTree[] {
    // typically you'll want to use the `node.id` to fetch its children,
    // but for our demo we'll just create some more book chapters
    const dotPrefixes = this.prefixDots(node.chapterName!.length - 6);
    return [
      {
        id: this.generateGUID(),
        chapterName: `${node.chapterName}.1`,
        label: `${dotPrefixes}${node.chapterName?.toLowerCase()}.1`,
        chapters: [],
        pageNumber: node.pageNumber + 1,
      },
      {
        id: this.generateGUID(),
        chapterName: `${node.chapterName}.2`,
        label: `${dotPrefixes}${node.chapterName?.toLowerCase()}.2`,
        chapters: [],
        pageNumber: node.pageNumber + 2,
      },
      {
        id: this.generateGUID(),
        chapterName: `${node.chapterName}.3`,
        label: `${dotPrefixes}${node.chapterName?.toLowerCase()}.3`,
        pageNumber: node.pageNumber + 3,
      },
    ];
  }

  coloredTextFormatter(_row, _cell, val, _column, dataContext) {
    if (dataContext.textColor) {
      const span = document.createElement('span');
      span.className = dataContext.textColor;
      span.textContent = val;
      return span;
    }
    return val;
  }

  /** Generate a UUID version 4 RFC compliant */
  protected generateGUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  protected prefixDots(count: number) {
    let result = '';
    for (let i = 0; i < count; i++) {
      result += '.';
    }
    return result;
  }
}
