<script lang="ts">
  import { ExcelExportService } from '@slickgrid-universal/excel-export';
  import {
    Filters,
    Formatters,
    SlickgridSvelte,
    type Column,
    type GridOption,
    type SlickgridSvelteInstance,
    type TreeToggledItem,
    type TreeToggleStateChange,
  } from 'slickgrid-svelte';

  const NB_ITEMS = 500;
  const columns: Column[] = [
    {
      id: 'title',
      name: 'Title',
      field: 'title',
      width: 220,
      cssClass: 'cell-title',
      filterable: true,
      sortable: true,
      exportWithFormatter: false,
      queryFieldSorter: 'id',
      formatter: Formatters.tree,
      exportCustomFormatter: Formatters.treeExport,
    },
    { id: 'duration', name: 'Duration', field: 'duration', minWidth: 90, filterable: true },
    {
      id: 'percentComplete',
      name: '% Complete',
      field: 'percentComplete',
      minWidth: 120,
      maxWidth: 200,
      exportWithFormatter: false,
      sortable: true,
      filterable: true,
      filter: { model: Filters.compoundSlider, operator: '>=' },
      formatter: Formatters.percentCompleteBarWithText,
      type: 'number',
    },
    {
      id: 'start',
      name: 'Start',
      field: 'start',
      minWidth: 60,
      type: 'dateIso',
      filterable: true,
      sortable: true,
      filter: { model: Filters.compoundDate },
      formatter: Formatters.dateIso,
    },
    {
      id: 'finish',
      name: 'Finish',
      field: 'finish',
      minWidth: 60,
      type: 'dateIso',
      filterable: true,
      sortable: true,
      filter: { model: Filters.compoundDate },
      formatter: Formatters.dateIso,
    },
    {
      id: 'effortDriven',
      name: 'Effort Driven',
      field: 'effortDriven',
      width: 80,
      minWidth: 20,
      maxWidth: 80,
      cssClass: 'cell-effort-driven',
      exportWithFormatter: false,
      formatter: Formatters.checkmarkMaterial,
      cannotTriggerInsert: true,
      filterable: true,
      filter: {
        collection: [
          { value: '', label: '' },
          { value: true, label: 'True' },
          { value: false, label: 'False' },
        ],
        model: Filters.singleSelect,
      },
    },
  ];
  const options: GridOption = {
    autoResize: { container: '#demo-container', rightPadding: 10 },
    enableAutoSizeColumns: true,
    enableAutoResize: true,
    enableCellNavigation: true,
    enableFiltering: true,
    enableTreeData: true,
    treeDataOptions: {
      columnId: 'title',
      toggleOnNodeTitle: true,
      parentPropName: 'parentId',
      levelPropName: 'treeLevel',
      indentMarginLeft: 15,
      initiallyCollapsed: true,
      titleFormatter: (_row, _cell, value, _def, dataContext) => {
        const prefix =
          dataContext.treeLevel > 0 ? '<span class="mdi mdi-subdirectory-arrow-right mdi-v-align-sub color-se-secondary"></span>' : '';
        return `${prefix}<span class="bold">${value}</span> <span style="font-size:11px; margin-left: 15px;">(parentId: ${dataContext.parentId})</span>`;
      },
    },
    multiColumnSort: false,
    showCustomFooter: true,
    headerRowHeight: 45,
    rowHeight: 40,
    presets: { filters: [{ columnId: 'percentComplete', searchTerms: [25], operator: '>=' }] },
    enableExcelExport: true,
    excelExportOptions: { exportWithFormatter: true, sanitizeDataExport: true },
    externalResources: [new ExcelExportService()],
    contextMenu: {
      iconCollapseAllGroupsCommand: 'mdi mdi-arrow-collapse',
      iconExpandAllGroupsCommand: 'mdi mdi-arrow-expand',
      iconClearGroupingCommand: 'mdi mdi-close',
      iconCopyCellValueCommand: 'mdi mdi-content-copy',
      iconExportCsvCommand: 'mdi mdi-file-document-outline',
      iconExportExcelCommand: 'mdi mdi-file-excel-outline',
      iconExportTextDelimitedCommand: 'mdi mdi-file-document-outline',
    },
    gridMenu: {
      iconCssClass: 'mdi mdi-menu',
      iconClearAllFiltersCommand: 'mdi mdi-filter-remove-outline',
      iconClearAllSortingCommand: 'mdi mdi-swap-vertical',
      iconExportCsvCommand: 'mdi mdi-file-document-outline',
      iconExportExcelCommand: 'mdi mdi-file-excel-outline',
      iconExportTextDelimitedCommand: 'mdi mdi-file-document-outline',
      iconRefreshDatasetCommand: 'mdi mdi-sync',
      iconToggleFilterCommand: 'mdi mdi-flip-vertical',
      iconTogglePreHeaderCommand: 'mdi mdi-flip-vertical',
    },
    headerMenu: {
      iconClearFilterCommand: 'mdi mdi-filter-remove-outline',
      iconClearSortCommand: 'mdi mdi-swap-vertical',
      iconSortAscCommand: 'mdi mdi-arrow-up',
      iconSortDescCommand: 'mdi mdi-arrow-down',
      iconColumnHideCommand: 'mdi mdi-close',
    },
  };

  let dataset = $state.raw<any[]>([]);
  let grid!: SlickgridSvelteInstance;
  let loadingClass = $state('');
  let isLargeDataset = false;
  let hasNoExpandCollapseChanged = $state(true);
  let treeToggleItems: TreeToggledItem[] = [];
  let showSubtitle = $state(true);

  function loadData(rowCount: number) {
    isLargeDataset = rowCount > 5000; // we'll show a spinner when it's large, else don't show since it should be fast enough
    let indent = 0;
    const parents: number[] = [];
    const data: any[] = [];
    for (let i = 0; i < rowCount; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor(Math.random() * 29);
      let parentId: number | null;

      // for demo & E2E testing purposes, "Task 0" is empty and "Task 1" is a parent of "Task 2" and "Task 3" (which also contains "Task 4")
      if (i === 1 || i === 0) {
        indent = 0;
        parents.pop();
      }
      if (i === 3) {
        indent = 1;
      } else if (i === 2 || i === 4 || (Math.random() > 0.8 && i > 0 && indent < 3 && i - 1 !== 0 && i - 1 !== 2)) {
        indent++;
        parents.push(i - 1);
      } else if (Math.random() < 0.3 && indent > 0) {
        indent--;
        parents.pop();
      }
      parentId = parents.length ? parents[parents.length - 1] : null;
      data.push({
        id: i,
        parentId,
        title: `Task ${i}`,
        duration: '5 days',
        percentComplete: Math.round(Math.random() * 100),
        start: new Date(randomYear, randomMonth, randomDay),
        finish: new Date(randomYear, randomMonth + 1, randomDay),
        effortDriven: i % 5 === 0,
      });
    }
    dataset = data;
    return data;
  }

  /**
   * A simple method to add a new item inside the first group that has children which is "Task 1"
   * After adding the item, it will resort by parent/child recursively but keep current sort column
   */
  function addNewRow() {
    const newId = grid.dataView.getItemCount();
    const parent = grid.dataView.getItemById(1);
    if (parent?.__hasChildren) {
      grid.gridService.addItem({
        id: newId,
        parentId: parent.id,
        title: `Task ${newId}`,
        duration: '1 day',
        percentComplete: 99,
        start: new Date(),
        finish: new Date(),
        effortDriven: false,
      });
    }
  }
  function updateFirstRow() {
    // we MUST read the item from the DataView first (it includes the Tree Data props, like `__treeLevel`) and then update it
    const item = grid.dataView.getItemById<any>(0);
    grid.gridService.updateItem({
      ...item,
      duration: '11 days',
      percentComplete: 77,
      start: new Date(),
      finish: new Date(),
      effortDriven: false,
    });
  }
  function collapseAll() {
    grid.treeDataService.toggleTreeDataCollapse(true);
  }
  function collapseAllWithoutEvent() {
    grid.treeDataService.toggleTreeDataCollapse(true, false);
  }
  function expandAll() {
    grid.treeDataService.toggleTreeDataCollapse(false);
  }
  function dynamicallyChangeFilter() {
    grid.filterService.updateFilters([{ columnId: 'percentComplete', operator: '<', searchTerms: [40] }]);
  }
  function logFlatStructure() {
    console.log('flat array', grid.treeDataService.dataset);
  }
  function logHierarchicalStructure() {
    console.log('exploded array', grid.treeDataService.datasetHierarchical);
  }
  function setMaxVisibleDepthFromInput() {
    const input = document.querySelector<HTMLInputElement>('#maxVisibleDepthInput');
    const value = Number.parseInt(input?.value ?? '', 10);
    grid.treeDataService.setMaxVisibleDepth(Number.isFinite(value) ? value : undefined);
  }
  function clearMaxVisibleDepth() {
    const input = document.querySelector<HTMLInputElement>('#maxVisibleDepthInput');
    if (input) {
      input.value = '';
    }
    grid.treeDataService.clearMaxVisibleDepth();
  }
  function dynamicallyToggledFirstParent() {
    const child = dataset.find((item) => item.treeLevel === 1);
    const parent = child ? grid.dataView.getItemByIdx(child.parentId) : undefined;
    if (child && parent) {
      grid.treeDataService.dynamicallyToggleItemState([{ itemId: parent.id, isCollapsed: !parent.__collapsed }]);
    }
  }
  function reapplyToggledItems() {
    grid.treeDataService.applyToggledItemStateChanges(treeToggleItems);
  }
  function showSpinner() {
    if (isLargeDataset) {
      loadingClass = 'mdi mdi-load mdi-spin-1s font-24px color-alt-success';
    }
  }
  function hideSpinner() {
    setTimeout(() => (loadingClass = ''), 200); // delay the hide spinner a bit to avoid show/hide too quickly
  }
  function handleOnTreeFullToggleEnd(treeToggleExecution: TreeToggleStateChange) {
    console.log('Tree Data changes', treeToggleExecution);
    hideSpinner();
  }
  /** Whenever a parent is being toggled, we'll keep a reference of all of these changes so that we can reapply them whenever we want */
  function handleOnTreeItemToggled(treeToggleExecution: TreeToggleStateChange) {
    hasNoExpandCollapseChanged = false;
    treeToggleItems = treeToggleExecution.toggledItems as TreeToggledItem[];
    console.log('Tree Data changes', treeToggleExecution);
  }
  function toggleSubtitle() {
    showSubtitle = !showSubtitle;
    requestAnimationFrame(() => grid?.resizerService.resizeGrid());
  }

  loadData(NB_ITEMS);
</script>

<h2>
  Example 27: Tree Data <small>
    <span class="mdi mdi-file-tree font-27px"></span> (from a flat dataset with <code>parentId</code> references -
    <a href="https://ghiscoding.gitbook.io/svelte-slickgrid/grid-functionalities/tree-data-grid" target="_blank" rel="noreferrer">Wiki</a>)
  </small>
  <span class="float-end">
    <a
      style="font-size:18px"
      target="_blank"
      rel="noreferrer"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example27.svelte"
    >
      <i class="mdi mdi-link-variant"></i> code
    </a>
  </span>
  <button
    class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
    type="button"
    data-test="toggle-subtitle"
    aria-label="Toggle example sub-title details"
    onclick={toggleSubtitle}
  >
    <i class="mdi mdi-information-outline"></i>
  </button>
</h2>
{#if showSubtitle}
  <div class="subtitle">
    <ul>
      <li>It is assumed that your dataset will have Parent/Child references AND also Tree Level (indent) property.</li>
      <ul>
        <li>
          If you do not have the Tree Level (indent), you could call "convertParentChildArrayToHierarchicalView()" then call
          "convertHierarchicalViewToParentChildArray()"
        </li>
        <li>
          You could also pass the result of "convertParentChildArrayToHierarchicalView()" to "datasetHierarchical" as defined in the next
          Hierarchical Example
        </li>
      </ul>
    </ul>
  </div>
{/if}
<div class="row" style="margin-bottom: 4px">
  <div class="col-md-12">
    <button class="btn btn-outline-secondary btn-xs btn-icon" data-test="add-500-rows-btn" onclick={() => loadData(500)}>500 rows</button>
    <button class="btn btn-outline-secondary btn-xs btn-icon mx-1" data-test="add-75k-rows-btn" onclick={() => loadData(75000)}>
      75k rows
    </button>
    <button class="btn btn-outline-secondary btn-xs btn-icon me-1" data-test="add-250k-rows-btn" onclick={() => loadData(250000)}>
      250k rows
    </button>
    <button class="btn btn-outline-secondary btn-xs btn-icon" data-test="change-filter-dynamically" onclick={dynamicallyChangeFilter}>
      <span class="mdi mdi-filter-outline"></span>
      <span>Dynamically Change Filter (% complete &lt; 40)</span>
    </button>
    <button class="btn btn-outline-secondary btn-xs btn-icon mx-1" data-test="collapse-all-noevent-btn" onclick={collapseAllWithoutEvent}>
      <span class="mdi mdi-arrow-collapse"></span>
      <span>Collapse All (without triggering event)</span>
    </button>
    <button
      class="btn btn-outline-secondary btn-xs btn-icon"
      data-test="dynamically-toggle-first-parent-btn"
      onclick={dynamicallyToggledFirstParent}
    >
      <span>Dynamically Toggle First Parent</span>
    </button>
    <button
      data-test="reapply-toggled-items-btn"
      class="btn btn-outline-secondary btn-xs btn-icon mx-1"
      disabled={hasNoExpandCollapseChanged}
      onclick={reapplyToggledItems}
    >
      <span class="mdi mdi-history"></span>
      <span>Reapply Previous Toggled Items</span>
    </button>
    <div class={loadingClass}></div>
  </div>
</div>

<div class="row">
  <div class="col-md-12">
    <button data-test="add-item-btn" class="btn btn-primary btn-xs btn-icon" onclick={addNewRow}>
      <span class="mdi mdi-plus color-white"></span>
      <span>Add New Item to "Task 1" group</span>
    </button>
    <button data-test="update-item-btn" class="btn btn-outline-secondary btn-xs btn-icon mx-1" onclick={updateFirstRow}>
      <span class="icon mdi mdi-pencil"></span>
      <span>Update 1st Row Item</span>
    </button>
    <button data-test="collapse-all-btn" class="btn btn-outline-secondary btn-xs btn-icon" onclick={collapseAll}>
      <span class="mdi mdi-arrow-collapse"></span>
      <span>Collapse All</span>
    </button>
    <button data-test="expand-all-btn" class="btn btn-outline-secondary btn-xs btn-icon mx-1" onclick={expandAll}>
      <span class="mdi mdi-arrow-expand"></span>
      <span>Expand All</span>
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
  <div class="d-inline-block ms-2 mt-2">
    <div class="input-group input-group-sm mb-0">
      <input
        id="maxVisibleDepthInput"
        class="form-control"
        type="number"
        placeholder="Max Visible Depth (e.g. 1)"
        aria-label="Max Visible Depth"
      />
      <button
        class="btn btn-outline-secondary btn-xs btn-icon"
        data-test="set-max-visible-depth-btn"
        type="button"
        onclick={setMaxVisibleDepthFromInput}
      >
        <span class="mdi mdi-check" aria-hidden="true"></span>
        Set
      </button>
      <button
        class="btn btn-outline-secondary btn-xs btn-icon"
        data-test="clear-max-visible-depth-btn"
        type="button"
        onclick={clearMaxVisibleDepth}
      >
        <span class="mdi mdi-close" aria-hidden="true"></span>
        Clear
      </button>
    </div>
  </div>
</div>

<br />

<div id="grid-container" class="col-sm-12">
  <SlickgridSvelte
    gridId="grid27"
    {columns}
    {options}
    {dataset}
    onBeforeFilterChange={showSpinner}
    onFilterChanged={hideSpinner}
    onBeforeFilterClear={showSpinner}
    onFilterCleared={hideSpinner}
    onBeforeSortChange={showSpinner}
    onSortChanged={hideSpinner}
    onTreeFullToggleStart={showSpinner}
    onTreeFullToggleEnd={(e) => handleOnTreeFullToggleEnd(e.detail)}
    onTreeItemToggled={(e) => handleOnTreeItemToggled(e.detail)}
    onSvelteGridCreated={(instance) => (grid = instance)}
  />
</div>

<style>
  :global(#grid27 .slick-cell) {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  #maxVisibleDepthInput {
    height: 22px;
    width: 100%;
    max-width: 150px;
  }
</style>
