import { ExcelExportService } from '@slickgrid-universal/excel-export';
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
  SlickgridReact,
  type SlickgridReactInstance,
} from 'slickgrid-react';
import React, { useEffect, useRef, useState } from 'react';

import './example28.scss'; // provide custom CSS/SASS styling

const Example28: React.FC = () => {
  const [columnDefinitions, setColumnDefinitions] = useState<Column[]>([]);
  const [gridOptions, setGridOptions] = useState<GridOption | undefined>();
  const [datasetHierarchical, setDatasetHierarchical] = useState(mockDataset());
  const [lastInsertedPopSongId, setLastInsertedPopSongId] = useState<number | undefined>();
  const [searchString, setSearchString] = useState('');
  const [hideSubTitle, setHideSubTitle] = useState(false);

  const isExcludingChildWhenFilteringRef = useRef(false);
  const isAutoApproveParentItemWhenTreeColumnIsValidRef = useRef(true);
  const isAutoRecalcTotalsOnFilterChangeRef = useRef(false);
  const isRemoveLastInsertedPopSongDisabledRef = useRef(true);
  const reactGridRef = useRef<SlickgridReactInstance | null>(null);

  useEffect(() => {
    defineGrid();
  }, []);

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  /* Define grid Options and Columns */
  function defineGrid() {
    const columnDefinitions: Column[] = [
      {
        id: 'file',
        name: 'Files',
        field: 'file',
        width: 150,
        formatter: treeFormatter,
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
            const treeLevel = dataContext[gridOptions!.treeDataOptions?.levelPropName || '__treeLevel'];
            const sumVal = dataContext?.__treeTotals?.['sum'][fieldId];
            const avgVal = dataContext?.__treeTotals?.['avg'][fieldId];

            if (avgVal !== undefined && sumVal !== undefined) {
              // when found Avg & Sum, we'll display both
              return isNaN(sumVal)
                ? ''
                : `<span class="text-primary bold">sum: ${decimalFormatted(sumVal, 0, 2)} MB</span> / <span class="avg-total">avg: ${decimalFormatted(avgVal, 0, 2)} MB</span> <span class="total-suffix">(${treeLevel === 0 ? 'total' : 'sub-total'})</span>`;
            } else if (sumVal !== undefined) {
              // or when only Sum is aggregated, then just show Sum
              return isNaN(sumVal)
                ? ''
                : `<span class="text-primary bold">sum: ${decimalFormatted(sumVal, 0, 2)} MB</span> <span class="total-suffix">(${treeLevel === 0 ? 'total' : 'sub-total'})</span>`;
            }
          }
          // reaching this line means it's a regular dataContext without totals, so regular formatter output will be used
          return !isNumber(value) ? '' : `${value} MB`;
        },
      },
    ];

    const gridOptions: GridOption = {
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
      externalResources: [new ExcelExportService()],
      enableFiltering: true,
      enableTreeData: true, // you must enable this flag for the filtering & sorting to work as expected
      multiColumnSort: false, // multi-column sorting is not supported with Tree Data, so you need to disable it
      treeDataOptions: {
        columnId: 'file',
        childrenPropName: 'files',
        excludeChildrenWhenFilteringTree: isExcludingChildWhenFilteringRef.current, // defaults to false
        // initiallyCollapsed: true,

        // skip any other filter criteria(s) if the column holding the Tree (file) passes its own filter criteria
        // (e.g. filtering with "Files = music AND Size > 7", the row "Music" and children will only show up when this flag is enabled
        // this flag only works with the other flag set to `excludeChildrenWhenFilteringTree: false`
        autoApproveParentItemWhenTreeColumnIsValid: isAutoApproveParentItemWhenTreeColumnIsValidRef.current,

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
        autoRecalcTotalsOnFilterChange: isAutoRecalcTotalsOnFilterChangeRef.current,

        // add optional debounce time to limit number of execution that recalc is called, mostly useful on large dataset
        // autoRecalcTotalsDebounce: 250
      },
      // change header/cell row height for salesforce theme
      headerRowHeight: 35,
      rowHeight: 33,
      showCustomFooter: true,

      // we can also preset collapsed items via Grid Presets (parentId: 4 => is the "pdf" folder)
      presets: {
        treeData: { toggledItems: [{ itemId: 4, isCollapsed: true }] },
      },
    };

    setColumnDefinitions(columnDefinitions);
    setGridOptions(gridOptions);
  }

  function changeAutoApproveParentItem() {
    const newIsAutoApproveParentItemWhenTreeColumnIsValid = !isAutoApproveParentItemWhenTreeColumnIsValidRef.current;
    isAutoApproveParentItemWhenTreeColumnIsValidRef.current = newIsAutoApproveParentItemWhenTreeColumnIsValid;

    gridOptions!.treeDataOptions!.autoApproveParentItemWhenTreeColumnIsValid = newIsAutoApproveParentItemWhenTreeColumnIsValid;
    reactGridRef.current?.slickGrid.setOptions(gridOptions!);
    reactGridRef.current?.filterService.refreshTreeDataFilters();
    return true;
  }

  function changeAutoRecalcTotalsOnFilterChange() {
    const newIsAutoRecalcTotalsOnFilterChange = !isAutoRecalcTotalsOnFilterChangeRef.current;
    isAutoRecalcTotalsOnFilterChangeRef.current = newIsAutoRecalcTotalsOnFilterChange;

    gridOptions!.treeDataOptions!.autoRecalcTotalsOnFilterChange = newIsAutoRecalcTotalsOnFilterChange;
    reactGridRef.current?.slickGrid.setOptions(gridOptions!);

    // since it doesn't take current filters in consideration, we better clear them
    reactGridRef.current?.filterService.clearFilters();
    reactGridRef.current?.treeDataService.enableAutoRecalcTotalsFeature();
    return true;
  }

  function changeExcludeChildWhenFiltering() {
    const newIsExcludingChildWhenFiltering = !isExcludingChildWhenFilteringRef.current;
    isExcludingChildWhenFilteringRef.current = newIsExcludingChildWhenFiltering;
    gridOptions!.treeDataOptions!.excludeChildrenWhenFilteringTree = newIsExcludingChildWhenFiltering;
    reactGridRef.current?.slickGrid.setOptions(gridOptions!);
    reactGridRef.current?.filterService.refreshTreeDataFilters();
    return true;
  }

  function clearSearch() {
    setSearchString('');
    searchStringChanged('');
  }

  function searchStringChanged(val: string) {
    setSearchString(val);
    updateFilter(val);
  }

  function updateFilter(val: string) {
    reactGridRef.current?.filterService.updateFilters([{ columnId: 'file', searchTerms: [val] }], true, false, true);
  }

  const treeFormatter: Formatter = (_row, _cell, value, _columnDef, dataContext, gridOptions) => {
    const treeLevelPropName = (gridOptions.treeDataOptions && gridOptions.treeDataOptions.levelPropName) || '__treeLevel';
    if (value === null || value === undefined || dataContext === undefined) {
      return '';
    }
    const data = reactGridRef.current?.dataView.getItems() || [];
    const identifierPropName = reactGridRef.current?.dataView.getIdPropertyName() || 'id';
    const idx = reactGridRef.current?.dataView.getIdxById(dataContext[identifierPropName]) as number;
    const prefix = getFileIcon(value);
    const treeLevel = dataContext[treeLevelPropName];
    const exportIndentationLeadingChar = '.';

    value = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const spacer = `<span style="display:inline-block; width:${15 * treeLevel}px;"></span>`;
    const indentSpacer = addWhiteSpaces(5 * treeLevel);

    if (data[idx + 1]?.[treeLevelPropName] > data[idx][treeLevelPropName] || data[idx]['__hasChildren']) {
      const folderPrefix = `<span class="mdi icon color-alt-warning ${dataContext.__collapsed ? 'mdi-folder' : 'mdi-folder-open'}"></span>`;
      if (dataContext.__collapsed) {
        return `<span class="hidden">${exportIndentationLeadingChar}</span>${spacer}${indentSpacer} <span class="slick-group-toggle collapsed" level="${treeLevel}"></span>${folderPrefix} ${prefix} ${value}`;
      } else {
        return `<span class="hidden">${exportIndentationLeadingChar}</span>${spacer}${indentSpacer} <span class="slick-group-toggle expanded" level="${treeLevel}"></span>${folderPrefix} ${prefix} ${value}`;
      }
    } else {
      return `<span class="hidden">${exportIndentationLeadingChar}</span>${spacer}${indentSpacer} <span class="slick-group-toggle" level="${treeLevel}"></span>${prefix} ${value}`;
    }
  };

  function getFileIcon(value: string) {
    let prefix = '';
    if (value.includes('.pdf')) {
      prefix = '<span class="mdi mdi-file-pdf-outline text-danger"></span>';
    } else if (value.includes('.txt')) {
      prefix = '<span class="mdi mdi-file-document-outline"></span>';
    } else if (value.includes('.xls')) {
      prefix = '<span class="mdi mdi-file-excel-outline text-primary"></span>';
    } else if (value.includes('.mp3')) {
      prefix = '<span class="mdi mdi-file-music-outline text-info"></span>';
    }
    return prefix;
  }

  /**
   * A simple method to add a new item inside the first group that we find.
   * After adding the item, it will sort by parent/child recursively
   */
  function addNewFile() {
    const newId = (reactGridRef.current?.dataView.getLength() ?? 0) + 50;

    // find first parent object and add the new item as a child
    const tmpDatasetHierarchical = [...(datasetHierarchical ?? [])];
    const popFolderItem: any = findItemInTreeStructure(tmpDatasetHierarchical, (x) => x.file === 'pop', 'files');

    if (popFolderItem && Array.isArray(popFolderItem.files)) {
      popFolderItem.files.push({
        id: newId,
        file: `pop-${newId}.mp3`,
        dateModified: new Date(),
        size: newId + 3,
      });

      setLastInsertedPopSongId(newId);
      isRemoveLastInsertedPopSongDisabledRef.current = false;

      // overwrite hierarchical dataset which will also trigger a grid sort and rendering
      setDatasetHierarchical(tmpDatasetHierarchical);

      // scroll into the position, after insertion cycle, where the item was added
      setTimeout(() => {
        const rowIndex = reactGridRef.current?.dataView.getRowById(popFolderItem.id) as number;
        reactGridRef.current?.slickGrid.scrollRowIntoView(rowIndex + 3);
      }, 10);
    }
  }

  function deleteFile() {
    const tmpDatasetHierarchical = [...(datasetHierarchical || [])];
    const popFolderItem: any = findItemInTreeStructure(tmpDatasetHierarchical, (x) => x.file === 'pop', 'files');
    const songItemFound = findItemInTreeStructure(tmpDatasetHierarchical, (x) => x.id === lastInsertedPopSongId, 'files');

    if (popFolderItem && songItemFound) {
      const songIdx = popFolderItem.files.findIndex((f: any) => f.id === songItemFound.id);
      if (songIdx >= 0) {
        popFolderItem.files.splice(songIdx, 1);
        setLastInsertedPopSongId(undefined);
        isRemoveLastInsertedPopSongDisabledRef.current = true;

        // overwrite hierarchical dataset which will also trigger a grid sort and rendering
        setDatasetHierarchical(tmpDatasetHierarchical);
      }
    }
  }

  function collapseAll() {
    reactGridRef.current?.treeDataService.toggleTreeDataCollapse(true);
  }

  function expandAll() {
    reactGridRef.current?.treeDataService.toggleTreeDataCollapse(false);
  }

  function logHierarchicalStructure() {
    console.log('exploded array', reactGridRef.current?.treeDataService.datasetHierarchical /* , JSON.stringify(explodedArray, null, 2) */);
  }

  function logFlatStructure() {
    console.log('flat array', reactGridRef.current?.treeDataService.dataset /* , JSON.stringify(outputFlatArray, null, 2) */);
  }

  function mockDataset() {
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
              { id: 3, file: 'todo.txt', description: 'things to do someday maybe', dateModified: '2015-05-12T14:50:00.123Z', size: 0.7 },
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
          { id: 9, file: 'misc', files: [{ id: 10, file: 'warranties.txt', dateModified: '2015-02-26T16:50:00.123Z', size: 0.4 }] },
          { id: 7, file: 'xls', files: [{ id: 8, file: 'compilation.xls', dateModified: '2014-10-02T14:50:00.123Z', size: 2.3 }] },
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
          { id: 29, file: 'cheesecake', description: 'strawberry cheesecake', dateModified: '2012-04-04T13:52:00.123Z', size: 0.2 },
          {
            id: 30,
            file: 'chocolate-cake',
            description: 'tasty sweet chocolate cake',
            dateModified: '2012-05-05T09:22:00.123Z',
            size: 0.2,
          },
          { id: 31, file: 'coffee-cake', description: 'chocolate coffee cake', dateModified: '2012-01-01T08:08:48.123Z', size: 0.2 },
        ],
      },
    ];
  }

  function toggleSubTitle() {
    const newHideSubTitle = !hideSubTitle;
    setHideSubTitle(newHideSubTitle);
    const action = newHideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    reactGridRef.current?.resizerService.resizeGrid(0);
  }

  return !gridOptions ? (
    ''
  ) : (
    <div id="demo-container" className="container-fluid">
      <h2>
        Example 28: Tree Data with Aggregators <small>(from a Hierarchical Dataset)</small>
        <span className="float-end font18">
          see&nbsp;
          <a
            target="_blank"
            href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example28.tsx"
          >
            <span className="mdi mdi-link-variant"></span> code
          </a>
        </span>
        <button
          className="ms-2 btn btn-outline-secondary btn-sm btn-icon"
          type="button"
          data-test="toggle-subtitle"
          onClick={() => toggleSubTitle()}
        >
          <span className="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
        </button>
      </h2>

      <div className="subtitle">
        <ul>
          <li>It is assumed that your dataset will have Parent/Child references AND also Tree Level (indent) property.</li>
          <ul>
            <li>
              If you do not have the Tree Level (indent), you could call "convertParentChildArrayToHierarchicalView()" then call
              "convertHierarchicalViewToParentChildArray()"
            </li>
            <li>
              You could also pass the result of "convertParentChildArrayToHierarchicalView()" to "dataset-hierarchical.bind" as defined in
              the next Hierarchical Example
            </li>
          </ul>
        </ul>
      </div>

      <div className="row">
        <div className="col-md-7">
          <button onClick={() => addNewFile()} data-test="add-item-btn" className="btn btn-xs btn-icon btn-primary mx-1">
            <span className="mdi mdi-shape-square-plus me-1 text-white"></span>
            <span className="text-white">Add New Pop Song</span>
          </button>
          <button
            onClick={() => deleteFile()}
            data-test="remove-item-btn"
            className="btn btn-outline-secondary btn-xs btn-icon"
            disabled={isRemoveLastInsertedPopSongDisabledRef.current}
          >
            <span className="mdi mdi-minus me-1"></span>
            <span>Remove Last Inserted Pop Song</span>
          </button>
          <button onClick={() => collapseAll()} data-test="collapse-all-btn" className="btn btn-outline-secondary btn-xs btn-icon mx-1">
            <span className="mdi mdi-arrow-collapse me-1"></span>
            <span>Collapse All</span>
          </button>
          <button onClick={() => expandAll()} data-test="expand-all-btn" className="btn btn-outline-secondary btn-xs btn-icon">
            <span className="mdi mdi-arrow-expand me-1"></span>
            <span>Expand All</span>
          </button>
          <button
            className="btn btn-outline-secondary btn-xs btn-icon mx-1"
            data-test="clear-filters-btn"
            onClick={() => reactGridRef.current?.filterService.clearFilters()}
          >
            <span className="mdi mdi-close me-1"></span>
            <span>Clear Filters</span>
          </button>
          <button onClick={() => logFlatStructure()} className="btn btn-outline-secondary btn-xs btn-icon mx-1">
            <span>Log Flat Structure</span>
          </button>
          <button onClick={() => logHierarchicalStructure()} className="btn btn-outline-secondary btn-xs btn-icon">
            <span>Log Hierarchical Structure</span>
          </button>
        </div>

        <div className="col-md-5">
          <div className="input-group input-group-sm">
            <input
              type="text"
              className="form-control search-string"
              data-test="search-string"
              value={searchString}
              onInput={($event) => searchStringChanged(($event.target as HTMLInputElement).value)}
            />
            <button
              className="btn btn-outline-secondary d-flex align-items-center"
              data-test="clear-search-string"
              onClick={() => clearSearch()}
            >
              <span className="icon mdi mdi-close"></span>
            </button>
          </div>
        </div>
      </div>

      <div>
        <label className="checkbox-inline control-label" htmlFor="excludeChildWhenFiltering" style={{ marginLeft: '20px' }}>
          <input
            type="checkbox"
            id="excludeChildWhenFiltering"
            data-test="exclude-child-when-filtering"
            className="me-1"
            defaultChecked={isExcludingChildWhenFilteringRef.current}
            onClick={() => changeExcludeChildWhenFiltering()}
          />
          <span title="for example if we filter the word 'pop' and we exclude children, then only the folder 'pop' will show up without any content unless we uncheck this flag">
            Exclude Children when Filtering Tree
          </span>
        </label>
        <label className="checkbox-inline control-label" htmlFor="autoApproveParentItem" style={{ marginLeft: '20px' }}>
          <input
            type="checkbox"
            id="autoApproveParentItem"
            data-test="auto-approve-parent-item"
            className="me-1"
            defaultChecked={isAutoApproveParentItemWhenTreeColumnIsValidRef.current}
            onClick={() => changeAutoApproveParentItem()}
          />
          <span
            title="for example in this demo if we filter with 'music' and size '> 70' nothing will show up unless we have this flag enabled
            because none of the files have both criteria at the same time, however the column with the tree 'file' does pass the filter criteria 'music'
            and with this flag we tell the lib to skip any other filter(s) as soon as the with the tree (file in this demo) passes its own filter criteria"
          >
            Skip Other Filter Criteria when Parent with Tree is valid
          </span>
        </label>
        <label className="checkbox-inline control-label" htmlFor="autoRecalcTotalsOnFilterChange" style={{ marginLeft: '20px' }}>
          <input
            type="checkbox"
            id="autoRecalcTotalsOnFilterChange"
            data-test="auto-recalc-totals"
            className="me-1"
            defaultChecked={isAutoRecalcTotalsOnFilterChangeRef.current}
            onClick={() => changeAutoRecalcTotalsOnFilterChange()}
          />
          <span title="Should we recalculate Tree Data Totals (when Aggregators are defined) while filtering? This feature is disabled by default.">
            auto-recalc Tree Data totals on filter changed
          </span>
        </label>
      </div>

      <br />

      <div id="grid-container" className="col-sm-12">
        <SlickgridReact
          gridId="grid28"
          columns={columnDefinitions}
          options={gridOptions}
          datasetHierarchical={datasetHierarchical}
          onReactGridCreated={($event) => reactGridReady($event.detail)}
        />
      </div>
    </div>
  );
};

export default Example28;
