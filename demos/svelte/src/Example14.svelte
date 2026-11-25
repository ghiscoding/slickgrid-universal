<script lang="ts">
  import { ExcelExportService } from '@slickgrid-universal/excel-export';
  import { PdfExportService } from '@slickgrid-universal/pdf-export';
  import { SlickgridSvelte, type Column, type GridOption, type ItemMetadata, type SlickgridSvelteInstance } from 'slickgrid-svelte';

  let grid1: SlickgridSvelteInstance;
  let grid2: SlickgridSvelteInstance;
  let showSubTitle = true;
  let spread = false;
  const dataset1 = getData(500);
  const dataset2 = getData(500);
  const columns1: Column[] = [
    { id: 'title', name: 'Title', field: 'title', sortable: true, columnGroup: 'Common Factor' },
    { id: 'duration', name: 'Duration', field: 'duration', columnGroup: 'Common Factor' },
    { id: 'start', name: 'Start', field: 'start', columnGroup: 'Period' },
    { id: 'finish', name: 'Finish', field: 'finish', columnGroup: 'Period' },
    { id: '%', name: '% Complete', field: 'percentComplete', selectable: false, columnGroup: 'Analysis' },
    { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', type: 'boolean', columnGroup: 'Analysis' },
  ];
  const columns2: Column[] = [
    { id: 'sel', name: '#', field: 'num', behavior: 'select', cssClass: 'cell-selection', width: 40, resizable: false, selectable: false },
    ...columns1,
  ];
  const options1: GridOption = {
    gridHeight: 275,
    gridWidth: 800,
    enableAutoResize: false,
    enableCellNavigation: true,
    enableSorting: true,
    createPreHeaderPanel: true,
    showPreHeaderPanel: true,
    preHeaderPanelHeight: 28,
    rowHeight: 33,
    dataView: { globalItemMetadataProvider: { getRowMetadata: (item: any) => rowMetadata(item) } },
    gridMenu: { iconButtonContainer: 'preheader' },
    enablePdfExport: true,
    enableExcelExport: true,
    excelExportOptions: { exportWithFormatter: false },
    externalResources: [new ExcelExportService(), new PdfExportService()],
    spreadHiddenColspan: spread,
  };
  const options2: GridOption = {
    gridHeight: 275,
    gridWidth: 800,
    enableCellNavigation: true,
    createPreHeaderPanel: true,
    showPreHeaderPanel: true,
    preHeaderPanelHeight: 25,
    pinning: { columns: { left: 2 } },
    rowHeight: 33,
    enablePdfExport: true,
    enableExcelExport: true,
    excelExportOptions: { exportWithFormatter: false },
    externalResources: [new ExcelExportService(), new PdfExportService()],
  };

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
  function rowMetadata(item: any): ItemMetadata {
    return item.id % 2 === 1 ? { columns: { duration: { colspan: 3 } } } : { columns: { 0: { colspan: '*' } } };
  }
  function setPinnedColumns(count: number) {
    grid2.slickGrid.setOptions({ pinning: { columns: { left: count } } });
  }
  function toggleSpread() {
    spread = !spread;
    grid1.slickGrid.setOptions({ spreadHiddenColspan: spread });
    grid1.slickGrid.resetActiveCell();
    grid1.slickGrid.invalidate();
  }
  function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    queueMicrotask(() => grid2?.resizerService.resizeGrid(0));
  }
</script>

<h2>
  Example 14: Column Span &amp; Header Grouping <span class="float-end"
    ><a
      style="font-size:18px"
      target="_blank"
      rel="noreferrer"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/frameworks/angular-slickgrid/src/demos/examples/example14.component.ts"
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
{#if showSubTitle}<div class="subtitle">
    This example demonstrates how to span rows over multiple columns and group header titles.
    <ul>
      <li>Sorting still uses the row's data, including data visually hidden by a colspan.</li>
      <li>Header grouping works but can have layout issues on window resize.</li>
    </ul>
  </div>{/if}
<h3>
  Grid 1 <small>(with Header Grouping &amp; Colspan)</small>
  <button
    class="btn btn-outline-secondary btn-sm btn-icon ms-2"
    onclick={toggleSpread}
    data-test="spread-colspan-button"
    title="Should we always spread the same visible column count with or without hidden columns?"
    >Toggle Spreading of ColSpan with/without Hidden Columns</button
  >
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
<div class="col-sm-12">
  <button class="btn btn-outline-secondary btn-sm btn-icon" onclick={() => setPinnedColumns(-1)} data-test="remove-pinned-column-button"
    ><i class="mdi mdi-close"></i> Remove Pinned Columns</button
  >
  <button class="btn btn-outline-secondary btn-sm btn-icon" onclick={() => setPinnedColumns(2)} data-test="set-3pinned-columns"
    ><i class="mdi mdi-pin-outline"></i> Set 3 Pinned Columns</button
  >
</div>
<SlickgridSvelte
  gridId="grid2"
  columns={columns2}
  options={options2}
  dataset={dataset2}
  onSvelteGridCreated={(instance) => (grid2 = instance)}
/>
