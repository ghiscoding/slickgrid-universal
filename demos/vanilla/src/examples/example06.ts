import {
  addWhiteSpaces,
  Aggregators,
  type Column,
  decimalFormatted,
  Filters,
  findItemInTreeStructure,
  type Formatter,
  Formatters,
  type GridOption,
  isNumber,
  type SlickDataView,
  // GroupTotalFormatters,
  // italicFormatter,
} from '@slickgrid-universal/common';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { TextExportService } from '@slickgrid-universal/text-export';
import { Slicker, type SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';

import './example06.scss';
import { ExampleGridOptions } from './example-grid-options.js';

export default class Example06 {
  columnDefinitions: Column[];
  gridOptions: GridOption;
  datasetFlat: any[];
  datasetHierarchical: any[] = [];
  sgb: SlickVanillaGridBundle;
  durationOrderByCount = false;
  isExcludingChildWhenFiltering = false;
  isAutoApproveParentItemWhenTreeColumnIsValid = true;
  isAutoRecalcTotalsOnFilterChange = false;
  isRemoveLastInsertedPopSongDisabled = true;
  lastInsertedPopSongId: number | undefined;
  searchString = '';

  attached() {
    this.initializeGrid();
    this.datasetFlat = [];
    this.datasetHierarchical = this.mockDataset();
    const gridContainerElm = document.querySelector('.grid6') as HTMLDivElement;
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
        id: 'file',
        name: 'Files',
        field: 'file',
        width: 150,
        formatter: this.treeFormatter,
        filterable: true,
        sortable: true,
      },
      {
        id: 'dateModified',
        name: 'Date Modified',
        field: 'dateModified',
        formatter: Formatters.dateIso,
        type: 'dateUtc',
        outputType: 'dateIso',
        minWidth: 90,
        exportWithFormatter: true,
        filterable: true,
        filter: { model: Filters.compoundDate },
      },
      {
        id: 'description',
        name: 'Description',
        field: 'description',
        minWidth: 90,
        filterable: true,
        sortable: true,
      },
      {
        id: 'size',
        name: 'Size',
        field: 'size',
        minWidth: 90,
        type: 'number',
        exportWithFormatter: true,
        excelExportOptions: { autoDetectCellFormat: false },
        filterable: true,
        filter: { model: Filters.compoundInputNumber },

        // Formatter option #1 (treeParseTotalFormatters)
        // if you wish to use any of the GroupTotalFormatters (or even regular Formatters), we can do so with the code below
        // use `treeTotalsFormatter` or `groupTotalsFormatter` to show totals in a Tree Data grid
        // provide any regular formatters inside the params.formatters

        // formatter: Formatters.treeParseTotals,
        // treeTotalsFormatter: GroupTotalFormatters.sumTotalsBold,
        // // groupTotalsFormatter: GroupTotalFormatters.sumTotalsBold,
        // params: {
        //   // we can also supply extra params for Formatters/GroupTotalFormatters like min/max decimals
        //   groupFormatterSuffix: ' MB', minDecimal: 0, maxDecimal: 2,
        // },

        // OR option #2 (custom Formatter)
        formatter: (_row, _cell, value, column, dataContext) => {
          // parent items will a "__treeTotals" property (when creating the Tree and running Aggregation, it mutates all items, all extra props starts with "__" prefix)
          const fieldId = column.field;

          // Tree Totals, if exists, will be found under `__treeTotals` prop
          if (dataContext?.__treeTotals !== undefined) {
            const treeLevel = dataContext[this.gridOptions?.treeDataOptions?.levelPropName || '__treeLevel'];
            const sumVal = dataContext?.__treeTotals?.['sum'][fieldId];
            const avgVal = dataContext?.__treeTotals?.['avg'][fieldId];

            if (avgVal !== undefined && sumVal !== undefined) {
              // when found Avg & Sum, we'll display both
              return isNaN(sumVal)
                ? ''
                : `<span class="text-color-primary bold">sum: ${decimalFormatted(sumVal, 0, 2)} MB</span> / <span class="avg-total">avg: ${decimalFormatted(avgVal, 0, 2)} MB</span> <span class="total-suffix">(${treeLevel === 0 ? 'total' : 'sub-total'})</span>`;
            } else if (sumVal !== undefined) {
              // or when only Sum is aggregated, then just show Sum
              return isNaN(sumVal)
                ? ''
                : `<span class="text-color-primary bold">sum: ${decimalFormatted(sumVal, 0, 2)} MB</span> <span class="total-suffix">(${treeLevel === 0 ? 'total' : 'sub-total'})</span>`;
            }
          }
          // reaching this line means it's a regular dataContext without totals, so regular formatter output will be used
          return !isNumber(value) ? '' : `${value} MB`;
        },
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
      gridMenu: {
        iconCssClass: 'mdi mdi-dots-grid',
      },
      externalResources: [new ExcelExportService(), new TextExportService()],
      enableFiltering: true,
      enableTreeData: true, // you must enable this flag for the filtering & sorting to work as expected
      multiColumnSort: false, // multi-column sorting is not supported with Tree Data, so you need to disable it
      rowHeight: 35,
      treeDataOptions: {
        columnId: 'file',
        childrenPropName: 'files',
        excludeChildrenWhenFilteringTree: this.isExcludingChildWhenFiltering, // defaults to false

        // skip any other filter criteria(s) if the column holding the Tree (file) passes its own filter criteria
        // (e.g. filtering with "Files = music AND Size > 7", the row "Music" and children will only show up when this flag is enabled
        // this flag only works with the other flag set to `excludeChildrenWhenFilteringTree: false`
        autoApproveParentItemWhenTreeColumnIsValid: this.isAutoApproveParentItemWhenTreeColumnIsValid,

        // you can also optionally sort by a different column and/or change sort direction
        // initialSort: {
        //   columnId: 'file',
        //   direction: 'DESC'
        // },

        // Aggregators are also supported and must always be an array even when single one is provided
        // Note: only 5 are currently supported: Avg, Sum, Min, Max and Count
        // Note 2: also note that Avg Aggregator will automatically give you the "avg", "count" and "sum" so if you need these 3 then simply calling Avg will give you better perf
        // aggregators: [new Aggregators.Sum('size')]
        aggregators: [
          new Aggregators.Avg('size'),
          new Aggregators.Sum('size') /* , new Aggregators.Min('size'), new Aggregators.Max('size') */,
        ],

        // should we auto-recalc Tree Totals (when using Aggregators) anytime a filter changes
        // it is disabled by default for perf reason, by default it will only calculate totals on first load
        autoRecalcTotalsOnFilterChange: this.isAutoRecalcTotalsOnFilterChange,

        // add optional debounce time to limit number of execution that recalc is called, mostly useful on large dataset
        // autoRecalcTotalsDebounce: 250
      },
      showCustomFooter: true,

      // we can also preset collapsed items via Grid Presets (parentId: 4 => is the "pdf" folder)
      presets: {
        treeData: { toggledItems: [{ itemId: 4, isCollapsed: true }] },
      },
    };
  }

  changeAutoApproveParentItem(checked: boolean) {
    this.isAutoApproveParentItemWhenTreeColumnIsValid = checked;
    this.gridOptions.treeDataOptions!.autoApproveParentItemWhenTreeColumnIsValid = this.isAutoApproveParentItemWhenTreeColumnIsValid;
    this.sgb.slickGrid?.setOptions(this.gridOptions);
    this.sgb.filterService.refreshTreeDataFilters();
    return true;
  }

  changeAutoRecalcTotalsOnFilterChange(checked: boolean) {
    this.isAutoRecalcTotalsOnFilterChange = checked;
    this.gridOptions.treeDataOptions!.autoRecalcTotalsOnFilterChange = this.isAutoRecalcTotalsOnFilterChange;
    this.sgb.slickGrid?.setOptions(this.gridOptions);

    // since it doesn't take current filters in consideration, we better clear them
    this.sgb.filterService.clearFilters();
    this.sgb.treeDataService.enableAutoRecalcTotalsFeature();
    return true;
  }

  changeExcludeChildWhenFiltering(checked: boolean) {
    this.isExcludingChildWhenFiltering = checked;
    this.gridOptions.treeDataOptions!.excludeChildrenWhenFilteringTree = this.isExcludingChildWhenFiltering;
    this.sgb.slickGrid?.setOptions(this.gridOptions);
    this.sgb.filterService.refreshTreeDataFilters();
    return true;
  }

  clearSearch() {
    this.searchFile(new KeyboardEvent('keyup', { code: '', bubbles: true, cancelable: true }));
    (document.querySelector('input.search') as HTMLInputElement).value = '';
  }

  executeCommand(_e, args) {
    // const columnDef = args.column;
    const command = args.command;

    switch (command) {
      case 'exports-csv':
      case 'exports-txt':
      case 'exports-xlsx':
        alert(`Exporting as ${args.item.title}`);
        break;
      default:
        alert('Command: ' + args.command);
        break;
    }
  }

  searchFile(event: KeyboardEvent) {
    this.searchString = (event.target as HTMLInputElement)?.value || '';
    this.updateFilter();
  }

  updateFilter() {
    this.sgb.filterService.updateFilters([{ columnId: 'file', searchTerms: [this.searchString] }], true, false, true);
  }

  treeFormatter: Formatter = (_row, _cell, value, _columnDef, dataContext, grid) => {
    const gridOptions = grid.getOptions();
    const treeLevelPropName = gridOptions?.treeDataOptions?.levelPropName || '__treeLevel';
    if (value === null || value === undefined || dataContext === undefined) {
      return '';
    }
    const dataView = grid.getData<SlickDataView>();
    const data = dataView.getItems();
    const identifierPropName = dataView.getIdPropertyName() || 'id';
    const idx = dataView.getIdxById(dataContext[identifierPropName]) as number;
    const prefix = this.getFileIcon(value);
    const treeLevel = dataContext[treeLevelPropName];
    const exportIndentationLeadingChar = '.';

    value = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const spacer = `<span class="display-inline-block width-${15 * treeLevel}px"></span>`;
    const indentSpacer = addWhiteSpaces(5 * treeLevel);

    if (data[idx + 1]?.[treeLevelPropName] > data[idx][treeLevelPropName] || data[idx]['__hasChildren']) {
      const folderPrefix = `<i class="mdi mdi-22px ${dataContext.__collapsed ? 'mdi-folder' : 'mdi-folder-open'}"></i>`;
      if (dataContext.__collapsed) {
        return `<span class="hidden">${exportIndentationLeadingChar}</span>${spacer}${indentSpacer} <span class="slick-group-toggle collapsed" level="${treeLevel}"></span>${folderPrefix} ${prefix} ${value}`;
      } else {
        return `<span class="hidden">${exportIndentationLeadingChar}</span>${spacer}${indentSpacer} <span class="slick-group-toggle expanded" level="${treeLevel}"></span>${folderPrefix} ${prefix} ${value}`;
      }
    } else {
      return `<span class="hidden">${exportIndentationLeadingChar}</span>${spacer}${indentSpacer} <span class="slick-group-toggle" level="${treeLevel}"></span>${prefix} ${value}`;
    }
  };

  getFileIcon(value: string) {
    let prefix = '';
    if (value.includes('.pdf')) {
      prefix = '<i class="mdi mdi-20px mdi-file-pdf-outline"></i>';
    } else if (value.includes('.txt')) {
      prefix = '<i class="mdi mdi-20px mdi-file-document-outline"></i>';
    } else if (value.includes('.csv') || value.includes('.xls')) {
      prefix = '<i class="mdi mdi-20px mdi-file-excel-outline"></i>';
    } else if (value.includes('.mp3')) {
      prefix = '<i class="mdi mdi-20px mdi-file-music-outline"></i>';
    } else if (value.includes('.')) {
      prefix = '<i class="mdi mdi-20px mdi-file-question-outline"></i>';
    }
    return prefix;
  }

  /**
   * A simple method to add a new item inside the first group that we find.
   * After adding the item, it will sort by parent/child recursively
   */
  addNewFile() {
    const newId = this.sgb.dataView!.getItemCount() + 50;

    // find first parent object and add the new item as a child
    const popFolderItem = findItemInTreeStructure(this.datasetHierarchical, (x) => x.file === 'pop', 'files');

    if (popFolderItem && Array.isArray(popFolderItem.files)) {
      popFolderItem.files.push({
        id: newId,
        file: `pop-${newId}.mp3`,
        dateModified: new Date(),
        size: newId + 3,
      });
      this.lastInsertedPopSongId = newId;
      this.isRemoveLastInsertedPopSongDisabled = false;

      // overwrite hierarchical dataset which will also trigger a grid sort and rendering
      this.sgb.datasetHierarchical = this.datasetHierarchical;

      // scroll into the position where the item was added with a delay since it needs to recreate the tree grid
      window.setTimeout(() => {
        const rowIndex = this.sgb.dataView?.getRowById(newId) as number;
        this.sgb.slickGrid?.scrollRowIntoView(rowIndex + 3);
      }, 0);
    }
  }

  deleteFile() {
    const popFolderItem = findItemInTreeStructure(this.datasetHierarchical, (x) => x.file === 'pop', 'files');
    const songItemFound = findItemInTreeStructure(this.datasetHierarchical, (x) => x.id === this.lastInsertedPopSongId, 'files');

    if (popFolderItem && songItemFound) {
      const songIdx = popFolderItem.files.findIndex((f) => f.id === songItemFound.id);
      if (songIdx >= 0) {
        popFolderItem.files.splice(songIdx, 1);
        this.lastInsertedPopSongId = undefined;
        this.isRemoveLastInsertedPopSongDisabled = true;

        // overwrite hierarchical dataset which will also trigger a grid sort and rendering
        this.sgb.datasetHierarchical = this.datasetHierarchical;
      }
    }
  }

  clearFilters() {
    this.sgb.filterService.clearFilters();
  }

  collapseAll() {
    this.sgb.treeDataService.toggleTreeDataCollapse(true);
  }

  expandAll() {
    this.sgb.treeDataService.toggleTreeDataCollapse(false);
  }

  logHierarchicalStructure() {
    console.log('hierarchical array', this.sgb.treeDataService.datasetHierarchical);
  }

  logFlatStructure() {
    console.log('flat array', this.sgb.treeDataService.dataset);
  }

  mockDataset() {
    return [
      { id: 24, file: 'bucket-list.txt', dateModified: '2012-03-05T12:44:00.123Z', size: 0.5 },
      { id: 18, file: 'something.txt', dateModified: '2015-03-03T03:50:00.123Z', size: 90 },
      {
        id: 21,
        file: 'documents',
        files: [
          {
            id: 2,
            file: 'txt',
            files: [
              {
                id: 3,
                file: 'todo.txt',
                description: 'things to do someday maybe',
                dateModified: '2015-05-12T14:50:00.123Z',
                size: 0.7,
              },
            ],
          },
          {
            id: 4,
            file: 'pdf',
            files: [
              { id: 22, file: 'map2.pdf', dateModified: '2015-07-21T08:22:00.123Z', size: 2.9 },
              { id: 5, file: 'map.pdf', dateModified: '2015-05-21T10:22:00.123Z', size: 3.1 },
              { id: 6, file: 'internet-bill.pdf', dateModified: '2015-05-12T14:50:00.123Z', size: 1.3 },
              { id: 23, file: 'phone-bill.pdf', dateModified: '2015-05-01T07:50:00.123Z', size: 1.5 },
            ],
          },
          {
            id: 9,
            file: 'misc',
            files: [{ id: 10, file: 'warranties.txt', dateModified: '2015-02-26T16:50:00.123Z', size: 0.4 }],
          },
          {
            id: 7,
            file: 'xls',
            files: [{ id: 8, file: 'compilation.xls', dateModified: '2014-10-02T14:50:00.123Z', size: 2.3 }],
          },
          { id: 55, file: 'unclassified.csv', dateModified: '2015-04-08T03:44:12.333Z', size: 0.25 },
          { id: 56, file: 'unresolved.csv', dateModified: '2015-04-03T03:21:12.000Z', size: 0.79 },
          { id: 57, file: 'zebra.dll', dateModified: '2016-12-08T13:22:12.432', size: 1.22 },
        ],
      },
      {
        id: 11,
        file: 'music',
        files: [
          {
            id: 12,
            file: 'mp3',
            files: [
              { id: 16, file: 'rock', files: [{ id: 17, file: 'soft.mp3', dateModified: '2015-05-13T13:50:00Z', size: 98 }] },
              {
                id: 14,
                file: 'pop',
                files: [
                  { id: 15, file: 'theme.mp3', description: 'Movie Theme Song', dateModified: '2015-03-01T17:05:00Z', size: 47 },
                  { id: 25, file: 'song.mp3', description: 'it is a song...', dateModified: '2016-10-04T06:33:44Z', size: 6.3 },
                ],
              },
              { id: 33, file: 'other', files: [] },
            ],
          },
        ],
      },
      {
        id: 26,
        file: 'recipes',
        description: 'Cake Recipes',
        dateModified: '2012-03-05T12:44:00.123Z',
        files: [
          {
            id: 29,
            file: 'cheesecake',
            description: 'strawberry cheesecake',
            dateModified: '2012-04-04T13:52:00.123Z',
            size: 0.2,
          },
          {
            id: 30,
            file: 'chocolate-cake',
            description: 'tasty sweet chocolate cake',
            dateModified: '2012-05-05T09:22:00.123Z',
            size: 0.2,
          },
          {
            id: 31,
            file: 'coffee-cake',
            description: 'chocolate coffee cake',
            dateModified: '2012-01-01T08:08:48.123Z',
            size: 0.2,
          },
        ],
      },
    ];
  }

  /**
   * for test purposes only, we can dynamically change the loaded Aggregator(s) but we'll have to reload the dataset
   * also note that it bypasses the grid preset which mean that "pdf" will not be collapsed when called this way
   */
  displaySumAggregatorOnly() {
    this.sgb.slickGrid!.setOptions({
      treeDataOptions: {
        columnId: 'file',
        childrenPropName: 'files',
        excludeChildrenWhenFilteringTree: this.isExcludingChildWhenFiltering, // defaults to false
        autoApproveParentItemWhenTreeColumnIsValid: this.isAutoApproveParentItemWhenTreeColumnIsValid,
        aggregators: [new Aggregators.Sum('size')],
      },
    });

    // reset dataset to clear all tree data stat mutations (basically recreate the grid entirely to start from scratch)
    this.sgb.datasetHierarchical = this.mockDataset();
  }
}
