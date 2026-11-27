<script lang="ts">
  import { ExcelExportService } from '@slickgrid-universal/excel-export';
  import {
    addWhiteSpaces,
    Aggregators,
    decimalFormatted,
    Filters,
    findItemInTreeStructure,
    Formatters,
    isNumber,
    SlickgridSvelte,
    type Column,
    type Formatter,
    type GridOption,
    type SlickDataView,
    type SlickgridSvelteInstance,
  } from 'slickgrid-svelte';

  let grid: SlickgridSvelteInstance;
  let datasetHierarchical: any[] = $state.raw(mockDataset());
  let isExcludingChildWhenFiltering = $state(false);
  let isAutoApproveParentItemWhenTreeColumnIsValid = $state(true);
  let isAutoRecalcTotalsOnFilterChange = $state(false);
  let isRemoveLastInsertedPopSongDisabled = $state(true);
  let lastInsertedPopSongId: number | undefined;
  let searchString = $state('');
  let showSubTitle = $state(true);

  const treeFormatter: Formatter = (_row, _cell, value, _columnDef, dataContext, slickGrid) => {
    const treeLevelPropName = slickGrid.getOptions()?.treeDataOptions?.levelPropName || '__treeLevel';
    if (value === null || value === undefined || dataContext === undefined) {
      return '';
    }
    const dataView = slickGrid.getData<SlickDataView>();
    const data = dataView.getItems();
    const identifierPropName = dataView.getIdPropertyName() || 'id';
    const idx = dataView.getIdxById(dataContext[identifierPropName]) as number;
    const prefix = getFileIcon(value);
    const treeLevel = dataContext[treeLevelPropName];
    const exportIndentationLeadingChar = '.';

    value = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const spacer = `<span class="display-inline-block width-${15 * treeLevel}px"></span>`;
    const indentSpacer = addWhiteSpaces(5 * treeLevel);
    const spanValue = `<span class="slick-tree-title">${value}</span>`;

    if (data[idx + 1]?.[treeLevelPropName] > data[idx][treeLevelPropName] || data[idx]['__hasChildren']) {
      const folderPrefix = `<i class="mdi font-22px ${dataContext.__collapsed ? 'mdi-folder' : 'mdi-folder-open'}"></i>`;
      if (dataContext.__collapsed) {
        return `<span class="hidden">${exportIndentationLeadingChar}</span>${spacer}${indentSpacer} <span class="slick-tree-toggle collapsed" level="${treeLevel}"></span>${folderPrefix} ${prefix} ${spanValue}`;
      } else {
        return `<span class="hidden">${exportIndentationLeadingChar}</span>${spacer}${indentSpacer} <span class="slick-tree-toggle expanded" level="${treeLevel}"></span>${folderPrefix} ${prefix} ${spanValue}`;
      }
    } else {
      return `<span class="hidden">${exportIndentationLeadingChar}</span>${spacer}${indentSpacer} <span class="slick-tree-toggle" level="${treeLevel}"></span>${prefix} ${spanValue}`;
    }
  };

  const columns: Column[] = [
    { id: 'file', name: 'Files', field: 'file', width: 150, formatter: treeFormatter, filterable: true, sortable: true },
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
    { id: 'description', name: 'Description', field: 'description', minWidth: 90, filterable: true, sortable: true },
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
      formatter: (_row, _cell, value, column, dataContext, slickGrid) => {
        // Tree Totals, if exists, will be found under `__treeTotals` prop
        if (dataContext?.__treeTotals !== undefined) {
          const fieldId = column.field;
          const treeLevel = dataContext[slickGrid.getOptions()?.treeDataOptions?.levelPropName || '__treeLevel'];
          const sumVal = dataContext?.__treeTotals?.['sum'][fieldId];
          const avgVal = dataContext?.__treeTotals?.['avg'][fieldId];

          if (avgVal !== undefined && sumVal !== undefined) {
            return isNaN(sumVal)
              ? ''
              : `<span class="text-primary bold">sum: ${decimalFormatted(sumVal, 0, 2)} MB</span> / <span class="avg-total">avg: ${decimalFormatted(avgVal, 0, 2)} MB</span> <span class="total-suffix">(${treeLevel === 0 ? 'total' : 'sub-total'})</span>`;
          } else if (sumVal !== undefined) {
            return isNaN(sumVal)
              ? ''
              : `<span class="text-primary bold">sum: ${decimalFormatted(sumVal, 0, 2)} MB</span> <span class="total-suffix">(${treeLevel === 0 ? 'total' : 'sub-total'})</span>`;
          }
        }
        // reaching this line means it's a regular dataContext without totals
        return !isNumber(value) ? '' : `${value} MB`;
      },
    },
  ];

  // options are mutated then re-applied with `setOptions()` (never replaced), so a plain object is enough
  const options: GridOption = {
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
    enableCellNavigation: true,
    enableFiltering: true,
    enableTreeData: true, // you must enable this flag for the filtering & sorting to work as expected
    multiColumnSort: false, // multi-column sorting is not supported with Tree Data, so you need to disable it
    treeDataOptions: {
      columnId: 'file',
      childrenPropName: 'files',
      excludeChildrenWhenFilteringTree: false, // defaults to false

      // skip any other filter criteria(s) if the column holding the Tree (file) passes its own filter criteria
      // (e.g. filtering with "Files = music AND Size > 7", the row "Music" and children will only show up when this flag is enabled
      // this flag only works with the other flag set to `excludeChildrenWhenFilteringTree: false`
      autoApproveParentItemWhenTreeColumnIsValid: true,

      // Aggregators are also supported and must always be an array even when single one is provided
      aggregators: [new Aggregators.Avg('size'), new Aggregators.Sum('size')],

      // should we auto-recalc Tree Totals (when using Aggregators) anytime a filter changes
      // it is disabled by default for perf reason, by default it will only calculate totals on first load
      autoRecalcTotalsOnFilterChange: false,
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

  function getFileIcon(value: string) {
    let prefix = '';
    if (value.includes('.pdf')) {
      prefix = '<span class="mdi icon mdi-file-pdf-outline"></span>';
    } else if (value.includes('.txt')) {
      prefix = '<span class="mdi icon mdi-file-document-outline"></span>';
    } else if (value.includes('.xls')) {
      prefix = '<span class="mdi icon mdi-file-excel-outline"></span>';
    } else if (value.includes('.mp3')) {
      prefix = '<span class="mdi icon mdi-file-music-outline"></span>';
    }
    return prefix;
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

  function ready(instance: SlickgridSvelteInstance) {
    grid = instance;
  }

  function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    requestAnimationFrame(() => grid?.resizerService.resizeGrid());
  }

  function changeAutoApproveParentItem() {
    isAutoApproveParentItemWhenTreeColumnIsValid = !isAutoApproveParentItemWhenTreeColumnIsValid;
    options.treeDataOptions!.autoApproveParentItemWhenTreeColumnIsValid = isAutoApproveParentItemWhenTreeColumnIsValid;
    grid.slickGrid.setOptions(options);
    grid.filterService.refreshTreeDataFilters();
  }

  function changeAutoRecalcTotalsOnFilterChange() {
    isAutoRecalcTotalsOnFilterChange = !isAutoRecalcTotalsOnFilterChange;
    options.treeDataOptions!.autoRecalcTotalsOnFilterChange = isAutoRecalcTotalsOnFilterChange;
    grid.slickGrid.setOptions(options);

    // since it doesn't take current filters in consideration, we better clear them
    grid.filterService.clearFilters();
    grid.treeDataService.enableAutoRecalcTotalsFeature();
  }

  function changeExcludeChildWhenFiltering() {
    isExcludingChildWhenFiltering = !isExcludingChildWhenFiltering;
    options.treeDataOptions!.excludeChildrenWhenFilteringTree = isExcludingChildWhenFiltering;
    grid.slickGrid.setOptions(options);
    grid.filterService.refreshTreeDataFilters();
  }

  function clearSearch() {
    searchString = '';
    searchStringChanged('');
  }

  function searchStringChanged(val: string) {
    searchString = val;
    grid.filterService.updateFilters([{ columnId: 'file', searchTerms: [val] }], true, false, true);
  }

  /**
   * A simple method to add a new item inside the first group that we find.
   * After adding the item, it will sort by parent/child recursively
   */
  function addNewFile() {
    const newId = grid.dataView.getLength() + 50;

    // find first parent object and add the new item as a child
    const tmpDatasetHierarchical = [...datasetHierarchical];
    const popFolderItem = findItemInTreeStructure(tmpDatasetHierarchical, (x) => x.file === 'pop', 'files');

    if (popFolderItem && Array.isArray(popFolderItem.files)) {
      popFolderItem.files.push({
        id: newId,
        file: `pop-${newId}.mp3`,
        dateModified: new Date(),
        size: newId + 3,
      });
      lastInsertedPopSongId = newId;
      isRemoveLastInsertedPopSongDisabled = false;

      // overwrite hierarchical dataset which will also trigger a grid sort and rendering
      datasetHierarchical = tmpDatasetHierarchical;

      // scroll into the position, after insertion cycle, where the item was added
      setTimeout(() => {
        const rowIndex = grid.dataView.getRowById(popFolderItem.id) as number;
        grid.slickGrid.scrollRowIntoView(rowIndex + 3);
      }, 10);
    }
  }

  function deleteFile() {
    const tmpDatasetHierarchical = [...datasetHierarchical];
    const popFolderItem = findItemInTreeStructure(datasetHierarchical, (x) => x.file === 'pop', 'files');
    const songItemFound = findItemInTreeStructure(datasetHierarchical, (x) => x.id === lastInsertedPopSongId, 'files');

    if (popFolderItem && songItemFound) {
      const songIdx = popFolderItem.files.findIndex((f: any) => f.id === songItemFound.id);
      if (songIdx >= 0) {
        popFolderItem.files.splice(songIdx, 1);
        lastInsertedPopSongId = undefined;
        isRemoveLastInsertedPopSongDisabled = true;

        // overwrite hierarchical dataset which will also trigger a grid sort and rendering
        datasetHierarchical = tmpDatasetHierarchical;
      }
    }
  }

  function clearFilters() {
    grid.filterService.clearFilters();
  }

  function collapseAll() {
    grid.treeDataService.toggleTreeDataCollapse(true);
  }

  function expandAll() {
    grid.treeDataService.toggleTreeDataCollapse(false);
  }

  function logHierarchicalStructure() {
    console.log('exploded array', grid.treeDataService.datasetHierarchical);
  }

  function logFlatStructure() {
    console.log('flat array', grid.treeDataService.dataset);
  }
</script>

<h2>
  Example 28: Tree Data with Aggregators
  <small>
    <span class="mdi mdi-file-tree font-27px"></span> (from a Hierarchical Dataset -
    <a href="https://ghiscoding.gitbook.io/svelte-slickgrid/grid-functionalities/tree-data-grid" target="_blank" rel="noreferrer">Wiki</a>)
  </small>
  <span class="float-end">
    <a
      style="font-size: 18px"
      target="_blank"
      rel="noreferrer"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example28.svelte"
    >
      <span class="mdi mdi-link-variant"></span> code
    </a>
  </span>
  <button
    class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
    type="button"
    aria-label="Toggle example sub-title details"
    data-test="toggle-subtitle"
    onclick={toggleSubTitle}
  >
    <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
  </button>
</h2>

{#if showSubTitle}
  <div class="subtitle">
    <ul>
      <li>It is assumed that your dataset will have Parent/Child references AND also Tree Level (indent) property.</li>
      <ul>
        <li>
          If you do not have the Tree Level (indent), you could call "convertParentChildArrayToHierarchicalView()" then call
          "convertHierarchicalViewToParentChildArray()"
        </li>
        <li>
          You could also pass the result of "convertParentChildArrayToHierarchicalView()" to the "datasetHierarchical" prop as defined in
          the next Hierarchical Example
        </li>
      </ul>
    </ul>
  </div>
{/if}

<div class="row">
  <div class="col-md-7">
    <button data-test="add-item-btn" class="btn btn-xs btn-icon btn-primary" onclick={addNewFile}>
      <span class="mdi mdi-plus color-white"></span>
      <span>Add New Pop Song</span>
    </button>
    <button
      data-test="remove-item-btn"
      class="btn btn-outline-secondary btn-xs btn-icon mx-1"
      disabled={isRemoveLastInsertedPopSongDisabled}
      onclick={deleteFile}
    >
      <span class="mdi mdi-minus"></span>
      <span>Remove Last Inserted Pop Song</span>
    </button>
    <button data-test="collapse-all-btn" class="btn btn-outline-secondary btn-xs btn-icon" onclick={collapseAll}>
      <span class="mdi mdi-arrow-collapse"></span>
      <span>Collapse All</span>
    </button>
    <button data-test="expand-all-btn" class="btn btn-outline-secondary btn-xs btn-icon mx-1" onclick={expandAll}>
      <span class="mdi mdi-arrow-expand"></span>
      <span>Expand All</span>
    </button>
    <button class="btn btn-outline-secondary btn-xs btn-icon" data-test="clear-filters-btn" onclick={clearFilters}>
      <span class="mdi mdi-close"></span>
      <span>Clear Filters</span>
    </button>
    <button class="btn btn-outline-secondary btn-xs btn-icon" title="console.log of the Flat dataset" onclick={logFlatStructure}>
      <span>Log Flat Structure</span>
    </button>
    <button
      class="btn btn-outline-secondary btn-xs btn-icon mx-1"
      title="console.log of the Hierarchical Tree dataset"
      onclick={logHierarchicalStructure}
    >
      <span>Log Hierarchical Structure</span>
    </button>
  </div>

  <div class="col-md-5">
    <div class="input-group input-group-sm">
      <input
        value={searchString}
        type="text"
        class="form-control search-string"
        placeholder="search value"
        autocomplete="off"
        data-test="search-string"
        oninput={(event) => searchStringChanged(event.currentTarget.value)}
      />
      <button
        class="btn btn-sm btn-outline-secondary d-flex align-items-center"
        aria-label="Clear search"
        data-test="clear-search-string"
        onclick={clearSearch}
      >
        <span class="icon mdi mdi-close-thick"></span>
      </button>
    </div>
  </div>
</div>

<div>
  <label class="checkbox-inline control-label" for="excludeChildWhenFiltering" style="margin-left: 20px">
    <input
      id="excludeChildWhenFiltering"
      type="checkbox"
      data-test="exclude-child-when-filtering"
      checked={isExcludingChildWhenFiltering}
      onclick={changeExcludeChildWhenFiltering}
    />
    <span
      title="for example if we filter the word 'pop' and we exclude children, then only the folder 'pop' will show up without any content unless we uncheck this flag"
    >
      Exclude Children when Filtering Tree
    </span>
  </label>
  <label class="checkbox-inline control-label" for="autoApproveParentItem" style="margin-left: 20px">
    <input
      id="autoApproveParentItem"
      type="checkbox"
      data-test="auto-approve-parent-item"
      checked={isAutoApproveParentItemWhenTreeColumnIsValid}
      onclick={changeAutoApproveParentItem}
    />
    <span
      title="for example in this demo if we filter with 'music' and size '> 70' nothing will show up unless we have this flag enabled
          because none of the files have both criteria at the same time, however the column with the tree 'file' does pass the filter criteria 'music'
          and with this flag we tell the lib to skip any other filter(s) as soon as the with the tree (file in this demo) passes its own filter criteria"
    >
      Skip Other Filter Criteria when Parent with Tree is valid
    </span>
  </label>
  <label class="checkbox-inline control-label" for="autoRecalcTotalsOnFilterChange" style="margin-left: 20px">
    <input
      id="autoRecalcTotalsOnFilterChange"
      type="checkbox"
      data-test="auto-recalc-totals"
      checked={isAutoRecalcTotalsOnFilterChange}
      onclick={changeAutoRecalcTotalsOnFilterChange}
    />
    <span
      title="Should we recalculate Tree Data Totals (when Aggregators are defined) while filtering? This feature is disabled by default."
    >
      auto-recalc Tree Data totals on filter changed
    </span>
  </label>
</div>

<br />

<div id="grid-container" class="col-sm-12">
  <SlickgridSvelte gridId="grid28" {options} {columns} {datasetHierarchical} onSvelteGridCreated={ready} />
</div>

<style>
  :global(#grid28 .slick-cell) {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  :global(#grid28 .avg-total) {
    color: #a365ff;
  }
  :global(#grid28 .bold) {
    font-weight: bold;
  }
  :global(#grid28 .total-suffix) {
    margin-left: 10px;
  }
  :global(#grid28 .hidden) {
    display: none;
  }
  :global(#grid28 .mdi-file-pdf-outline) {
    color: #f14668;
    opacity: 0.9;
  }
  :global(#grid28 .mdi-folder),
  :global(#grid28 .mdi-folder-open) {
    color: #ffa500;
    opacity: 0.9;
  }
  :global(#grid28 .mdi-file-music-outline) {
    color: #3298dc;
    opacity: 0.9;
  }
  :global(#grid28 .mdi-file-excel-outline) {
    color: #1e9f75;
    opacity: 0.9;
  }
  :global(#grid28 .mdi-file-document-outline),
  :global(#grid28 .mdi-file-question-outline) {
    color: #686868;
    opacity: 0.9;
  }
  :global(#grid28 .display-inline-block) {
    display: inline-block;
  }
  :global(#grid28 .width-15px) {
    width: 15px;
  }
  :global(#grid28 .width-30px) {
    width: 30px;
  }
  :global(#grid28 .width-45px) {
    width: 45px;
  }
  :global(#grid28 .width-60px) {
    width: 60px;
  }
  :global(#grid28 .width-75px) {
    width: 75px;
  }
  :global(#grid28 .width-90px) {
    width: 90px;
  }
</style>
