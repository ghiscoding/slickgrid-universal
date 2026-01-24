import { Component, ViewEncapsulation, type OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { TextExportService } from '@slickgrid-universal/text-export';
import {
  AngularSlickgridModule,
  Filters,
  Formatters,
  type AngularGridInstance,
  type Column,
  type Formatter,
  type GridOption,
} from '../../library';
import { showToast } from './utilities';

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

const coloredTextFormatter: Formatter = (_row: number, _cell: number, val: any, _column: Column, dataContext: Chapter) => {
  if (dataContext.textColor) {
    const span = document.createElement('span');
    span.className = dataContext.textColor;
    span.textContent = val;
    return span;
  }
  return val;
};

@Component({
  templateUrl: './example46.component.html',
  styleUrls: ['example46.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [AngularSlickgridModule, FormsModule],
})
export class Example46Component implements OnInit {
  angularGrid!: AngularGridInstance;
  dataViewObj: any;
  gridObj: any;
  gridOptions!: GridOption;
  columnDefinitions!: Column[];
  datasetHierarchical: any[] = [];
  hideSubTitle = false;
  searchString = '';
  serverApiDelay = 1000;

  ngOnInit(): void {
    // define the grid options & columns and then create the grid itself
    this.defineGrid();

    // mock a dataset
    this.datasetHierarchical = this.mockDataset();
  }

  defineGrid() {
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
        formatter: coloredTextFormatter,
        filterable: true,
        sortable: true,
      },
      {
        id: 'description',
        name: 'Description',
        field: 'description',
        minWidth: 90,
        formatter: coloredTextFormatter,
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
        autoHeight: false,
        container: '#demo-container',
        rightPadding: 10,
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
        onRowToggleStart: (e, args) => console.log('onBeforeRowToggle', args),
        onSelectAllToggleStart: () => this.angularGrid.treeDataService.toggleTreeDataCollapse(false, false),
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

  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;
    this.gridObj = angularGrid.slickGrid;
    this.dataViewObj = angularGrid.dataView;
  }

  clearSearch() {
    this.searchString = '';
    this.updateFilter();
  }

  searchStringChanged() {
    this.updateFilter();
  }

  updateFilter() {
    this.angularGrid.filterService.updateFilters([{ columnId: 'label', searchTerms: [this.searchString] }], true, false, true);
  }

  clearFilters() {
    this.clearSearch();
    this.angularGrid.filterService.clearFilters();
  }

  collapseAll() {
    this.angularGrid.treeDataService.toggleTreeDataCollapse(true);
  }

  expandAll() {
    this.angularGrid.treeDataService.toggleTreeDataCollapse(false);
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

  toggleSubTitle() {
    this.hideSubTitle = !this.hideSubTitle;
    const action = this.hideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    this.angularGrid.resizerService.resizeGrid(0);
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
