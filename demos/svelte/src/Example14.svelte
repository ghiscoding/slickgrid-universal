<script lang="ts">
  import { ExcelExportService } from '@slickgrid-universal/excel-export';
  import { PdfExportService } from '@slickgrid-universal/pdf-export';
  import { SlickgridSvelte, type Column, type GridOption, type ItemMetadata, type SlickgridSvelteInstance } from 'slickgrid-svelte';
  import { tick } from 'svelte';

  const NB_ITEMS = 500;
  let grid1: SlickgridSvelteInstance | undefined;
  let grid2: SlickgridSvelteInstance | undefined;
  let hideSubTitle = $state(false);
  let isColspanSpreading = false;

  const columns1: Column[] = [
    { id: 'title', name: 'Title', field: 'title', sortable: true, columnGroup: 'Common Factor' },
    { id: 'duration', name: 'Duration', field: 'duration', columnGroup: 'Common Factor' },
    { id: 'start', name: 'Start', field: 'start', columnGroup: 'Period' },
    { id: 'finish', name: 'Finish', field: 'finish', columnGroup: 'Period' },
    { id: '%', name: '% Complete', field: 'percentComplete', selectable: false, columnGroup: 'Analysis' },
    { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', type: 'boolean', columnGroup: 'Analysis' },
  ];
  const columns2: Column[] = [
    {
      id: 'sel',
      name: '#',
      field: 'num',
      behavior: 'select',
      cssClass: 'cell-selection',
      width: 40,
      resizable: false,
      selectable: false,
    },
    ...columns1,
  ];
  const options1: GridOption = {
    enableAutoResize: false,
    enableCellNavigation: true,
    enableColumnReorder: false,
    enableSorting: true,
    createPreHeaderPanel: true,
    showPreHeaderPanel: true,
    preHeaderPanelHeight: 28,
    gridHeight: 275,
    gridWidth: 800,
    rowHeight: 33,
    enablePdfExport: true,
    enableExcelExport: true,
    excelExportOptions: { exportWithFormatter: false },
    externalResources: [new ExcelExportService(), new PdfExportService()],
    explicitInitialization: true,
    dataView: {
      globalItemMetadataProvider: {
        getRowMetadata: (item: any, row: number) => renderDifferentColspan(item, row),
      },
    },
    gridMenu: {
      iconButtonContainer: 'preheader', // we can display the grid menu icon in either the preheader or in the column header (default)
    },
    spreadHiddenColspan: isColspanSpreading,
  };
  let options2 = $state.raw<GridOption>({
    enableCellNavigation: true,
    enableColumnReorder: false,
    createPreHeaderPanel: true,
    showPreHeaderPanel: true,
    preHeaderPanelHeight: 25,
    explicitInitialization: true,
    gridHeight: 275,
    gridWidth: 800,
    rowHeight: 33,
    pinning: { columns: { left: 2 } },
    enablePdfExport: true,
    enableExcelExport: true,
    excelExportOptions: { exportWithFormatter: false },
    externalResources: [new ExcelExportService(), new PdfExportService()],
  });
  const dataset1 = getData(NB_ITEMS);
  const dataset2 = getData(NB_ITEMS);

  function getData(count: number) {
    return Array.from({ length: count }, (_value, i) => ({
      id: i,
      num: i,
      title: `Task ${i}`,
      duration: '5 days with some long text to test column span',
      percentComplete: Math.round(Math.random() * 100),
      start: '01/01/2009',
      finish: '01/05/2009',
      effortDriven: i % 5 === 0,
    }));
  }

  function setPinnedColumns2(pinnedCols: number) {
    grid2?.slickGrid.setOptions({ pinning: { columns: { left: pinnedCols } } });
    options2 = grid2?.slickGrid.getOptions() ?? options2;
  }

  /**
   * A callback to render different row column span
   * Your callback will always have the "item" argument which you can use to decide on the colspan
   * Your return must always be in the form of:: return { columns: {}}
   */
  function renderDifferentColspan(item: any, row: number): ItemMetadata {
    if (item.id % 2 === 1 || row % 2 === 1) {
      return {
        columns: {
          duration: {
            colspan: 3, // "duration" will span over 3 columns
          },
        },
      };
    }
    return {
      columns: {
        0: {
          colspan: '*', // starting at column index 0, we will span accross all column (*)
        },
      },
    };
  }

  function spreadColspan() {
    isColspanSpreading = !isColspanSpreading;
    grid1?.slickGrid?.setOptions({ spreadHiddenColspan: isColspanSpreading });
    grid1?.slickGrid?.resetActiveCell();
    grid1?.slickGrid?.invalidate();
  }

  async function toggleSubTitle() {
    hideSubTitle = !hideSubTitle;
    await tick();
    grid2?.resizerService.resizeGrid(0);
  }
</script>

<h2>
  Example 14: Column Span &amp; Header Grouping
  <span class="float-end">
    <a
      style="font-size: 18px"
      target="_blank"
      rel="noreferrer"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example14.svelte"
    >
      <span class="mdi mdi-link-variant"></span> code
    </a>
  </span>
  <button
    class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
    type="button"
    data-test="toggle-subtitle"
    aria-label="Toggle example sub-title details"
    onclick={toggleSubTitle}
  >
    <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
  </button>
</h2>

{#if !hideSubTitle}
  <div class="subtitle">
    This example demonstrates how to easily span a row over multiple columns &amp; how to group header titles.
    <ul>
      <li>
        Note that you can add Sort but remember that it will sort by the data which the row contains, even if the data is visually hidden by
        colspan it will still sort it
      </li>
    </ul>
  </div>
{/if}

<h3>
  Grid 1 <small>(with Header Grouping &amp; Colspan)</small>
  <button
    class="btn btn-outline-secondary btn-sm btn-icon ms-2"
    onclick={spreadColspan}
    data-test="spread-colspan-button"
    title="Should we always spread the same visible column count with or without hidden columns?"
  >
    <span>Toggle Spreading of ColSpan with/without Hidden Columns</span>
  </button>
</h3>

<SlickgridSvelte
  gridId="grid1"
  columns={columns1}
  options={options1}
  dataset={dataset1}
  onSvelteGridCreated={(instance) => (grid1 = instance)}
/>

<hr />

<h3>Grid 2 <small>(with Header Grouping &amp; Pinned Columns)</small></h3>

<div class="col-sm 12">
  <button class="btn btn-outline-secondary btn-sm btn-icon" onclick={() => setPinnedColumns2(-1)} data-test="remove-pinned-column-button">
    <i class="mdi mdi-close"></i> Remove Pinned Columns
  </button>
  <button class="btn btn-outline-secondary btn-sm btn-icon" onclick={() => setPinnedColumns2(2)} data-test="set-3pinned-columns">
    <i class="mdi mdi-pin-outline"></i> Set 3 Pinned Columns
  </button>
</div>

<SlickgridSvelte
  gridId="grid2"
  columns={columns2}
  options={options2}
  dataset={dataset2}
  onSvelteGridCreated={(instance) => (grid2 = instance)}
/>
