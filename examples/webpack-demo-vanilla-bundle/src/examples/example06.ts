import {
  Column,
  GridOption,
  FieldType,
  Filters,
  findItemInHierarchicalStructure,
  Formatter,
  Formatters,
  SlickDataView,
} from '@slickgrid-universal/common';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { Slicker, SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';

import './example06.scss';
import { ExampleGridOptions } from './example-grid-options';

export class Example6 {
  columnDefinitions: Column[];
  gridOptions: GridOption;
  datasetFlat: any[];
  datasetHierarchical = [];
  sgb: SlickVanillaGridBundle;
  durationOrderByCount = false;
  searchString = '';

  attached() {
    this.initializeGrid();
    this.datasetFlat = [];
    this.datasetHierarchical = this.mockDataset();
    const gridContainerElm = document.querySelector<HTMLDivElement>('.grid6');
    this.sgb = new Slicker.GridBundle(gridContainerElm, this.columnDefinitions, { ...ExampleGridOptions, ...this.gridOptions }, null, this.datasetHierarchical);
  }

  dispose() {
    this.sgb?.dispose();
  }

  initializeGrid() {
    this.columnDefinitions = [
      {
        id: 'file', name: 'Files', field: 'file',
        type: FieldType.string, width: 150, formatter: this.treeFormatter,
        filterable: true, sortable: true,
      },
      {
        id: 'dateModified', name: 'Date Modified', field: 'dateModified',
        formatter: Formatters.dateIso, type: FieldType.dateUtc, outputType: FieldType.dateIso, minWidth: 90,
        exportWithFormatter: true, filterable: true, filter: { model: Filters.compoundDate }
      },
      {
        id: 'size', name: 'Size', field: 'size', minWidth: 90,
        type: FieldType.number, exportWithFormatter: true,
        filterable: true, filter: { model: Filters.compoundInputNumber },
        formatter: (row, cell, value) => isNaN(value) ? '' : `${value} MB`,
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
        sanitizeDataExport: true
      },
      registerExternalResources: [new ExcelExportService()],
      enableFiltering: true,
      enableTreeData: true, // you must enable this flag for the filtering & sorting to work as expected
      multiColumnSort: false,
      treeDataOptions: {
        columnId: 'file',
        childrenPropName: 'files',
        // you can optionally sort by a different column and/or sort direction
        // initialSort: {
        //   columnId: 'file',
        //   direction: 'DESC'
        // }
      }
    };
  }

  clearSearch() {
    this.searchFile(new KeyboardEvent('keyup', { code: '', bubbles: true, cancelable: true }));
    document.querySelector<HTMLInputElement>('input.search').value = '';
  }

  searchFile(event: KeyboardEvent) {
    this.searchString = (event.target as HTMLInputElement)?.value || '';
    this.updateFilter();
  }

  updateFilter() {
    this.sgb.filterService.updateFilters([{ columnId: 'file', searchTerms: [this.searchString] }], true, false, true);
  }

  treeFormatter: Formatter = (row, cell, value, columnDef, dataContext, grid) => {
    const gridOptions = grid.getOptions() as GridOption;
    const treeLevelPropName = gridOptions?.treeDataOptions?.levelPropName || '__treeLevel';
    if (value === null || value === undefined || dataContext === undefined) {
      return '';
    }
    const dataView = grid.getData() as SlickDataView;
    const data = dataView.getItems();
    const identifierPropName = dataView.getIdPropertyName() || 'id';
    const idx = dataView.getIdxById(dataContext[identifierPropName]);
    const prefix = this.getFileIcon(value);

    value = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const spacer = `<span style="display:inline-block; width:${(15 * dataContext[treeLevelPropName])}px;"></span>`;

    if (data[idx + 1] && data[idx + 1][treeLevelPropName] > data[idx][treeLevelPropName]) {
      const folderPrefix = `<i class="mdi icon ${dataContext.__collapsed ? 'mdi-folder' : 'mdi-folder-open'}"></i>`;
      if (dataContext.__collapsed) {
        return `${spacer} <span class="slick-group-toggle collapsed" level="${dataContext[treeLevelPropName]}"></span>${folderPrefix} ${prefix}&nbsp;${value}`;
      } else {
        return `${spacer} <span class="slick-group-toggle expanded" level="${dataContext[treeLevelPropName]}"></span>${folderPrefix} ${prefix}&nbsp;${value}`;
      }
    } else {
      return `${spacer} <span class="slick-group-toggle" level="${dataContext[treeLevelPropName]}"></span>${prefix}&nbsp;${value}`;
    }
  }

  getFileIcon(value: string) {
    let prefix = '';
    if (value.includes('.pdf')) {
      prefix = '<i class="mdi icon mdi-file-pdf-outline"></i>';
    } else if (value.includes('.txt')) {
      prefix = '<i class="mdi icon mdi-file-document-outline"></i>';
    } else if (value.includes('.xls')) {
      prefix = '<i class="mdi icon mdi-file-excel-outline"></i>';
    } else if (value.includes('.mp3')) {
      prefix = '<i class="mdi icon mdi-file-music-outline"></i>';
    }
    return prefix;
  }

  /**
   * A simple method to add a new item inside the first group that we find.
   * After adding the item, it will sort by parent/child recursively
   */
  addNewFile() {
    const newId = this.sgb.dataView.getLength() + 100;

    // find first parent object and add the new item as a child
    const popItem = findItemInHierarchicalStructure(this.datasetHierarchical, x => x.file === 'pop', 'files');

    if (popItem && Array.isArray(popItem.files)) {
      popItem.files.push({
        id: newId,
        file: `pop${Math.round(Math.random() * 1000)}.mp3`,
        dateModified: new Date(),
        size: Math.round(Math.random() * 100),
      });

      // overwrite hierarchical dataset which will also trigger a grid sort and rendering
      this.sgb.datasetHierarchical = this.datasetHierarchical;

      // scroll into the position where the item was added
      const rowIndex = this.sgb.dataView.getRowById(popItem.id);
      this.sgb.slickGrid.scrollRowIntoView(rowIndex + 3);
    }
  }

  collapseAll() {
    this.sgb.treeDataService.toggleTreeDataCollapse(true);
  }

  expandAll() {
    this.sgb.treeDataService.toggleTreeDataCollapse(false);
  }

  logExpandedStructure() {
    console.log('exploded array', this.sgb.treeDataService.datasetHierarchical /* , JSON.stringify(explodedArray, null, 2) */);
  }

  logFlatStructure() {
    console.log('flat array', this.sgb.treeDataService.dataset /* , JSON.stringify(outputFlatArray, null, 2) */);
  }

  mockDataset() {
    return [
      { id: 24, file: 'bucket-list.txt', dateModified: '2012-03-05T12:44:00.123Z', size: 0.5 },
      { id: 18, file: 'something.txt', dateModified: '2015-03-03T03:50:00.123Z', size: 90 },
      {
        id: 21, file: 'documents', files: [
          { id: 2, file: 'txt', files: [{ id: 3, file: 'todo.txt', dateModified: '2015-05-12T14:50:00.123Z', size: 0.7, }] },
          {
            id: 4, file: 'pdf', files: [
              { id: 22, file: 'map2.pdf', dateModified: '2015-07-21T08:22:00.123Z', size: 2.9, },
              { id: 5, file: 'map.pdf', dateModified: '2015-05-21T10:22:00.123Z', size: 3.1, },
              { id: 6, file: 'internet-bill.pdf', dateModified: '2015-05-12T14:50:00.123Z', size: 1.4, },
              { id: 23, file: 'phone-bill.pdf', dateModified: '2015-05-01T07:50:00.123Z', size: 1.4, },
            ]
          },
          { id: 9, file: 'misc', files: [{ id: 10, file: 'todo.txt', dateModified: '2015-02-26T16:50:00.123Z', size: 0.4, }] },
          { id: 7, file: 'xls', files: [{ id: 8, file: 'compilation.xls', dateModified: '2014-10-02T14:50:00.123Z', size: 2.3, }] },
        ]
      },
      {
        id: 11, file: 'music', files: [{
          id: 12, file: 'mp3', files: [
            { id: 16, file: 'rock', files: [{ id: 17, file: 'soft.mp3', dateModified: '2015-05-13T13:50:00Z', size: 98, }] },
            {
              id: 14, file: 'pop', files: [
                { id: 15, file: 'theme.mp3', dateModified: '2015-03-01T17:05:00Z', size: 47, },
                { id: 25, file: 'song.mp3', dateModified: '2016-10-04T06:33:44Z', size: 6.3, }
              ]
            },
          ]
        }]
      },
    ];
  }
}
