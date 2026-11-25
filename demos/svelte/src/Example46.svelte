<script lang="ts">
  import { ExcelExportService } from '@slickgrid-universal/excel-export';
  import { TextExportService } from '@slickgrid-universal/text-export';
  import {
    Filters,
    Formatters,
    SlickgridSvelte,
    type Column,
    type Formatter,
    type GridOption,
    type SlickgridSvelteInstance,
  } from 'slickgrid-svelte';

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

  let gridOptions: GridOption;
  let columns: Column[] = [];
  let datasetHierarchical: any[] = [];
  let searchString = '';
  let toastMessage = '';
  let showSubTitle = true;
  let serverApiDelay = 1000;
  let grid: SlickgridSvelteInstance;

  const coloredTextFormatter: Formatter = (_row: number, _cell: number, val: any, _column: Column, dataContext: Chapter) => {
    if (dataContext.textColor) {
      const span = document.createElement('span');
      span.className = dataContext.textColor;
      span.textContent = val;
      return span;
    }
    return val;
  };

  /* Define grid Options and Columns */
  function defineGrid() {
    columns = [
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

    gridOptions = {
      autoResize: {
        autoHeight: false,
        container: '#demo-container',
        rightPadding: 10,
      },
      enableAutoSizeColumns: true,
      enableAutoResize: true,
      enableCellNavigation: true,
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
        onSelectAllToggleStart: () => grid.treeDataService.toggleTreeDataCollapse(false, false),
      },
      selectionOptions: {
        // True (Single Selection), False (Multiple Selections)
        selectActiveRow: false,
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
              resolve(getChaptersByParentNode(node));
            }
          }, serverApiDelay);
        },
      },
    };
  }

  function clearSearch() {
    searchString = '';
    searchStringChanged('');
  }

  function searchStringChanged(val: string) {
    searchString = val;
    updateFilter(val);
  }

  function updateFilter(val: string) {
    grid.filterService.updateFilters([{ columnId: 'label', searchTerms: [val] }], true, false, true);
  }

  function clearFilters() {
    clearSearch();
    grid.filterService.clearFilters();
  }

  function collapseAll() {
    grid.treeDataService.toggleTreeDataCollapse(true);
  }

  function expandAll() {
    grid.treeDataService.toggleTreeDataCollapse(false);
  }

  function mockDataset(): ChapterTree[] {
    return [
      {
        id: generateGUID(),
        chapterName: 'Chapter 1',
        label: 'The intro',
        chapters: [],
        description: `it's all about the introduction`,
        pageNumber: 2,
        dateModified: '2024-03-05T12:44:00.123Z',
      },
      {
        id: generateGUID(),
        chapterName: 'Chapter 2',
        label: 'Where it all started',
        chapters: [],
        description: 'hometown to the big city',
        pageNumber: 50,
        dateModified: '2024-04-23T08:33:00.123Z',
      },
      {
        id: generateGUID(),
        chapterName: 'Chapter 3',
        label: 'Here I come...',
        chapters: [],
        description: 'here comes a wall',
        pageNumber: 78,
        dateModified: '2024-05-05T12:22:00.123Z',
      },
      {
        id: generateGUID(),
        chapterName: 'Chapter 4',
        label: 'Are we there yet?',
        chapters: [],
        description: 'soon...',
        pageNumber: 120,
        dateModified: '2024-04-29T10:24:00.123Z',
      },
      {
        id: generateGUID(),
        chapterName: 'Chapter 5',
        label: 'The finale',
        chapters: [],
        description: 'the end is near!',
        pageNumber: 155,
        dateModified: '2024-06-21T07:22:00.123Z',
      },
      {
        id: generateGUID(),
        chapterName: 'Chapter 6',
        label: 'End',
        pageNumber: 156,
        dateModified: '2024-06-22T07:22:00.123Z',
      },
      {
        id: generateGUID(),
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
  function getChaptersByParentNode(node: Chapter): ChapterTree[] {
    // typically you'll want to use the `node.id` to fetch its children,
    // but for our demo we'll just create some more book chapters
    const dotPrefixes = prefixDots(node.chapterName!.length - 6);
    return [
      {
        id: generateGUID(),
        chapterName: `${node.chapterName}.1`,
        label: `${dotPrefixes}${node.chapterName?.toLowerCase()}.1`,
        chapters: [],
        pageNumber: node.pageNumber + 1,
      },
      {
        id: generateGUID(),
        chapterName: `${node.chapterName}.2`,
        label: `${dotPrefixes}${node.chapterName?.toLowerCase()}.2`,
        chapters: [],
        pageNumber: node.pageNumber + 2,
      },
      {
        id: generateGUID(),
        chapterName: `${node.chapterName}.3`,
        label: `${dotPrefixes}${node.chapterName?.toLowerCase()}.3`,
        pageNumber: node.pageNumber + 3,
      },
    ];
  }

  function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    queueMicrotask(() => grid.resizerService.resizeGrid());
  }

  /** Generate a UUID version 4 RFC compliant */
  function generateGUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function prefixDots(count: number) {
    let result = '';
    for (let i = 0; i < count; i++) {
      result += '.';
    }
    return result;
  }

  function gridReady(instance: SlickgridSvelteInstance) {
    grid = instance;
  }

  function showToast(message: string, _kind = 'info') {
    toastMessage = message;
    setTimeout(() => (toastMessage = ''), 3000);
  }

  defineGrid();
  datasetHierarchical = mockDataset();
</script>

<svelte:head><title>Example 46 - Tree Data with Lazy Loading</title></svelte:head>

<h2>
  Example 46: Tree Data with Lazy Loading
  <small
    ><span class="mdi mdi-file-tree font-27px"></span> (from a Hierarchical Dataset -
    <a href="https://ghiscoding.gitbook.io/slickgrid-vue/grid-functionalities/tree-data-grid" target="_blank">Wiki</a>)</small
  >
  <span class="float-end"
    ><a
      style="font-size: 18px"
      target="_blank"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example46.svelte"
      ><span class="mdi mdi-link-variant"></span> code</a
    ></span
  >
  <button
    class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
    type="button"
    data-test="toggle-subtitle"
    aria-label="Toggle example sub-title details"
    onclick={toggleSubTitle}><span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span></button
  >
</h2>

{#if showSubTitle}
  <div class="subtitle">
    <ul>
      <li>Lazy loading works with hierarchical tree data. Begin with the root collection and empty child arrays.</li>
      <li>Parents need an empty child array (for example <code>chapters: []</code>) to be detected as parent nodes.</li>
      <li>Expand All expands nodes already loaded; additional nodes are loaded when individually expanded.</li>
      <li>Clicking the last <b>Chapter X</b> demonstrates an API call failure.</li>
    </ul>
  </div>
{/if}

<div class="row">
  <div class="col-md-7">
    <button class="btn btn-outline-secondary btn-xs btn-icon" data-test="clear-filters-btn" onclick={clearFilters}
      ><span class="mdi mdi-close"></span><span>Clear Filters</span></button
    >
    <button data-test="collapse-all-btn" class="btn btn-outline-secondary btn-xs btn-icon" onclick={collapseAll}
      ><span class="mdi mdi-arrow-collapse"></span><span>Collapse All</span></button
    >
    <button data-test="expand-all-btn" class="btn btn-outline-secondary btn-xs btn-icon mx-1" onclick={expandAll}
      ><span class="mdi mdi-arrow-expand"></span><span>Expand All</span></button
    >
    <span class="ml-2"
      ><label for="server-delay">Simulated Server Delay (ms): </label><input
        id="server-delay"
        class="ms-1"
        type="number"
        data-test="server-delay"
        style="width: 60px"
        bind:value={serverApiDelay}
      /></span
    >
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
        oninput={(event) => searchStringChanged((event.currentTarget as HTMLInputElement).value)}
      />
      <button
        class="btn btn-sm btn-outline-secondary d-flex align-items-center"
        aria-label="Clear search string"
        data-test="clear-search-string"
        onclick={clearSearch}><span class="icon mdi mdi-close-thick"></span></button
      >
    </div>
  </div>
</div>
<br />
<div id="grid-container" class="col-sm-12">
  <SlickgridSvelte gridId="grid46" options={gridOptions} {columns} {datasetHierarchical} onSvelteGridCreated={gridReady} />
</div>
{#if toastMessage}<div class="toast show" role="alert">{toastMessage}</div>{/if}
