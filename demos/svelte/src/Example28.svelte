<script lang="ts">
  import { ExcelExportService } from '@slickgrid-universal/excel-export';
  import {
    addWhiteSpaces,
    Aggregators,
    decimalFormatted,
    Filters,
    Formatters,
    isNumber,
    SlickgridSvelte,
    type Column,
    type Formatter,
    type GridOption,
    type SlickgridSvelteInstance,
  } from 'slickgrid-svelte';

  let grid: SlickgridSvelteInstance;
  let excludeChildren = false;
  let autoApproveParent = true;
  let autoRecalcTotals = false;
  let removeDisabled = true;
  let lastInsertedId: number | undefined;
  let searchString = '';
  let showSubtitle = true;
  let datasetHierarchical = makeDataset();

  const treeFormatter: Formatter = (_row, _cell, value, _columnDef, dataContext, slickGrid) => {
    if (value == null || !dataContext) {
      return '';
    }
    const levelName = slickGrid.getOptions().treeDataOptions?.levelPropName || '__treeLevel';
    const dataView = slickGrid.getData<any>();
    const data = dataView.getItems();
    const rowIndex = dataView.getIdxById(dataContext[dataView.getIdPropertyName() || 'id']);
    const level = dataContext[levelName] ?? 0;
    const escapedValue = `${value}`.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const spacer = `<span class="display-inline-block width-${15 * level}px"></span>${addWhiteSpaces(5 * level)}`;
    const nextItem = data[rowIndex + 1];
    const hasChildren = dataContext.__hasChildren || nextItem?.[levelName] > level;
    const folder = hasChildren ? `<i class="mdi font-22px ${dataContext.__collapsed ? 'mdi-folder' : 'mdi-folder-open'}"></i>` : '';
    const toggleClass = hasChildren ? (dataContext.__collapsed ? 'collapsed' : 'expanded') : '';
    return `<span class="hidden">.</span>${spacer} <span class="slick-tree-toggle ${toggleClass}" level="${level}"></span>${folder} ${fileIcon(`${value}`)} <span class="slick-tree-title">${escapedValue}</span>`;
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
      formatter: (_row, _cell, value, column, dataContext) => {
        if (dataContext?.__treeTotals !== undefined) {
          const level = dataContext.__treeLevel ?? 0;
          const sum = dataContext.__treeTotals.sum?.[column.field];
          const avg = dataContext.__treeTotals.avg?.[column.field];
          if (avg !== undefined && sum !== undefined) {
            return `<span class="text-primary bold">sum: ${decimalFormatted(sum, 0, 2)} MB</span> / <span class="avg-total">avg: ${decimalFormatted(avg, 0, 2)} MB</span> <span class="total-suffix">(${level === 0 ? 'total' : 'sub-total'})</span>`;
          }
          if (sum !== undefined) {
            return `<span class="text-primary bold">sum: ${decimalFormatted(sum, 0, 2)} MB</span> <span class="total-suffix">(${level === 0 ? 'total' : 'sub-total'})</span>`;
          }
        }
        return !isNumber(value) ? '' : `${value} MB`;
      },
    },
  ];

  const options: GridOption = {
    autoResize: { autoHeight: false, container: '#demo-container', rightPadding: 10 },
    enableAutoSizeColumns: true,
    enableAutoResize: true,
    enableExcelExport: true,
    excelExportOptions: { exportWithFormatter: true, sanitizeDataExport: true },
    externalResources: [new ExcelExportService()],
    enableCellNavigation: true,
    enableFiltering: true,
    enableTreeData: true,
    multiColumnSort: false,
    treeDataOptions: {
      columnId: 'file',
      childrenPropName: 'files',
      excludeChildrenWhenFilteringTree: excludeChildren,
      autoApproveParentItemWhenTreeColumnIsValid: autoApproveParent,
      aggregators: [new Aggregators.Avg('size'), new Aggregators.Sum('size')],
      autoRecalcTotalsOnFilterChange: autoRecalcTotals,
    },
    headerRowHeight: 35,
    rowHeight: 33,
    showCustomFooter: true,
    presets: { treeData: { toggledItems: [{ itemId: 4, isCollapsed: true }] } },
  };

  function fileIcon(value: string) {
    if (value.includes('.pdf')) {
      return '<span class="mdi icon mdi-file-pdf-outline"></span>';
    }
    if (value.includes('.txt')) {
      return '<span class="mdi icon mdi-file-document-outline"></span>';
    }
    if (value.includes('.xls')) {
      return '<span class="mdi icon mdi-file-excel-outline"></span>';
    }
    if (value.includes('.mp3')) {
      return '<span class="mdi icon mdi-file-music-outline"></span>';
    }
    return '';
  }

  function makeDataset() {
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
  function toggleSubtitle() {
    showSubtitle = !showSubtitle;
    requestAnimationFrame(() => grid?.resizerService.resizeGrid());
  }
  function updateTreeOption(
    key: 'excludeChildrenWhenFilteringTree' | 'autoApproveParentItemWhenTreeColumnIsValid' | 'autoRecalcTotalsOnFilterChange',
    value: boolean
  ) {
    options.treeDataOptions![key] = value;
    grid.slickGrid.setOptions(options);
    if (key === 'autoRecalcTotalsOnFilterChange') {
      grid.filterService.clearFilters();
      grid.treeDataService.enableAutoRecalcTotalsFeature();
    } else {
      grid.filterService.refreshTreeDataFilters();
    }
  }
  function changeExcludeChildren(event: Event) {
    excludeChildren = (event.currentTarget as HTMLInputElement).checked;
    updateTreeOption('excludeChildrenWhenFilteringTree', excludeChildren);
  }
  function changeAutoApprove(event: Event) {
    autoApproveParent = (event.currentTarget as HTMLInputElement).checked;
    updateTreeOption('autoApproveParentItemWhenTreeColumnIsValid', autoApproveParent);
  }
  function changeAutoRecalc(event: Event) {
    autoRecalcTotals = (event.currentTarget as HTMLInputElement).checked;
    updateTreeOption('autoRecalcTotalsOnFilterChange', autoRecalcTotals);
  }
  function searchChanged(value: string) {
    searchString = value;
    grid.filterService.updateFilters([{ columnId: 'file', searchTerms: value ? [value] : [] }], true, false, true);
  }
  function clearSearch() {
    searchChanged('');
  }
  function clearFilters() {
    grid.filterService.clearFilters();
    searchString = '';
  }
  function collapseAll() {
    grid.treeDataService.toggleTreeDataCollapse(true);
  }
  function expandAll() {
    grid.treeDataService.toggleTreeDataCollapse(false);
  }
  function findItem(node: any, predicate: (item: any) => boolean): any {
    if (predicate(node)) {
      return node;
    }
    for (const child of node.files ?? []) {
      const found = findItem(child, predicate);
      if (found) {
        return found;
      }
    }
    return undefined;
  }
  function addNewFile() {
    const folder = findItem(datasetHierarchical[0] ? { files: datasetHierarchical } : {}, (item) => item.file === 'pop');
    if (!folder?.files) {
      return;
    }
    const id = grid.dataView.getLength() + 50;
    folder.files.push({ id, file: `pop-${id}.mp3`, dateModified: new Date(), size: id + 3 });
    datasetHierarchical = [...datasetHierarchical];
    lastInsertedId = id;
    removeDisabled = false;
    setTimeout(() => {
      const row = grid.dataView.getRowById(folder.id);
      if (row !== undefined) {
        grid.slickGrid.scrollRowIntoView(row + 3);
      }
    }, 10);
  }
  function deleteFile() {
    const folder = findItem({ files: datasetHierarchical }, (item) => item.file === 'pop');
    const index = folder?.files?.findIndex((item: any) => item.id === lastInsertedId) ?? -1;
    if (index >= 0) {
      folder.files.splice(index, 1);
      datasetHierarchical = [...datasetHierarchical];
      lastInsertedId = undefined;
      removeDisabled = true;
    }
  }
</script>

<h2>
  Example 28: Tree Data with Aggregators <small
    ><span class="mdi mdi-file-tree font-27px"></span> (from a Hierarchical Dataset -
    <a href="https://ghiscoding.gitbook.io/slickgrid-vue/grid-functionalities/tree-data-grid" target="_blank" rel="noreferrer">Wiki</a
    >)</small
  >
  <span class="float-end"
    ><a
      style="font-size:18px"
      target="_blank"
      rel="noreferrer"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example28.svelte"
      ><i class="mdi mdi-link-variant"></i> code</a
    ></span
  >
  <button
    class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
    type="button"
    data-test="toggle-subtitle"
    aria-label="Toggle example sub-title details"
    onclick={toggleSubtitle}><i class="mdi mdi-information-outline"></i></button
  >
</h2>
{#if showSubtitle}<div class="subtitle">
    <ul>
      <li>Hierarchical data supports nested files and folders, filtering, sorting and tree total aggregations.</li>
      <li>Try the parent filter options and automatic total recalculation controls below.</li>
    </ul>
  </div>{/if}
<div class="row">
  <div class="col-md-7">
    <button data-test="add-item-btn" class="btn btn-xs btn-icon btn-primary" onclick={addNewFile}
      ><i class="mdi mdi-plus color-white"></i> Add New Pop Song</button
    >
    <button
      data-test="remove-item-btn"
      class="btn btn-outline-secondary btn-xs btn-icon mx-1"
      disabled={removeDisabled}
      onclick={deleteFile}><i class="mdi mdi-minus"></i> Remove Last Inserted Pop Song</button
    >
    <button data-test="collapse-all-btn" class="btn btn-outline-secondary btn-xs btn-icon" onclick={collapseAll}
      ><i class="mdi mdi-arrow-collapse"></i> Collapse All</button
    >
    <button data-test="expand-all-btn" class="btn btn-outline-secondary btn-xs btn-icon mx-1" onclick={expandAll}
      ><i class="mdi mdi-arrow-expand"></i> Expand All</button
    >
    <button class="btn btn-outline-secondary btn-xs btn-icon" data-test="clear-filters-btn" onclick={clearFilters}
      ><i class="mdi mdi-close"></i> Clear Filters</button
    >
  </div>
  <div class="col-md-5">
    <div class="input-group input-group-sm">
      <input
        type="text"
        class="form-control search-string"
        placeholder="search value"
        autocomplete="off"
        data-test="search-string"
        value={searchString}
        oninput={(event) => searchChanged((event.currentTarget as HTMLInputElement).value)}
      /><button
        class="btn btn-sm btn-outline-secondary d-flex align-items-center"
        aria-label="Clear search"
        data-test="clear-search-string"
        onclick={clearSearch}><i class="mdi mdi-close-thick"></i></button
      >
    </div>
  </div>
</div>
<div>
  <label class="checkbox-inline control-label ms-3" for="excludeChildWhenFiltering"
    ><input
      id="excludeChildWhenFiltering"
      type="checkbox"
      data-test="exclude-child-when-filtering"
      checked={excludeChildren}
      onchange={changeExcludeChildren}
    /> Exclude Children when Filtering Tree</label
  >
  <label class="checkbox-inline control-label ms-3" for="autoApproveParentItem"
    ><input
      id="autoApproveParentItem"
      type="checkbox"
      data-test="auto-approve-parent-item"
      checked={autoApproveParent}
      onchange={changeAutoApprove}
    /> Skip Other Filter Criteria when Parent with Tree is valid</label
  >
  <label class="checkbox-inline control-label ms-3" for="autoRecalcTotalsOnFilterChange"
    ><input
      id="autoRecalcTotalsOnFilterChange"
      type="checkbox"
      data-test="auto-recalc-totals"
      checked={autoRecalcTotals}
      onchange={changeAutoRecalc}
    /> auto-recalc Tree Data totals on filter changed</label
  >
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
    color: orange;
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
  :global(#grid28 .mdi-file-document-outline) {
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
