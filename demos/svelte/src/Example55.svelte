<script lang="ts">
  import { ExcelExportService } from '@slickgrid-universal/excel-export';
  import { PdfExportService } from '@slickgrid-universal/pdf-export';
  import { SlickgridSvelte, type Column, type GridOption, type SlickgridSvelteInstance } from 'slickgrid-svelte';
  import './example55.scss';

  const NB_ITEMS = 200;

  interface StoryItem {
    id: number;
    title: string;
    owner: string;
    summary: string;
    rowHeight: number;
  }

  let gridOptions: GridOption = $state.raw({});
  let columns: Column[] = $state.raw([]);
  let dataset: StoryItem[] = $state.raw(getData(NB_ITEMS));
  const excelExportService = new ExcelExportService();
  const pdfExportService = new PdfExportService();
  let svelteGrid!: SlickgridSvelteInstance;

  defineGrid();

  function gridReady(grid: SlickgridSvelteInstance) {
    svelteGrid = grid;
  }

  function scrollToRow90() {
    svelteGrid?.slickGrid?.scrollRowToTop(90);
  }

  function defineGrid() {
    columns = [
      { id: 'id', name: '#', field: 'id', minWidth: 60, maxWidth: 70 },
      { id: 'title', name: 'Story', field: 'title', minWidth: 180, width: 220 },
      { id: 'owner', name: 'Owner', field: 'owner', minWidth: 110, width: 130 },
      {
        id: 'rowHeight',
        name: 'Height',
        field: 'rowHeight',
        exportWithFormatter: true,
        formatter: (_row, _cell, value) => `${value}px`,
        minWidth: 90,
        width: 90,
      },
      { id: 'summary', name: 'Summary', field: 'summary', cssClass: 'cell-wrap', minWidth: 360, width: 500, maxWidth: 620 },
    ];

    gridOptions = {
      enableCellNavigation: true,
      enableTextSelectionOnCells: true,
      enableVariableRowHeight: true,
      externalResources: [excelExportService, pdfExportService],
      excelExportOptions: {
        // export variable row height will also be reflected in the export
        // but it can be disabled by setting `includeVariableRowHeight` to false
        // includeVariableRowHeight: false, // export all rows at default height

        // we can opt-in to also use same column width grid vs Excel export (it's disabled by default)
        includeColumnWidth: true,
      },
      pdfExportOptions: {
        pageOrientation: 'landscape',
        // we can opt-in to also use same column width grid vs PDF export (it's disabled by default)
        includeColumnWidth: true,
      },
      rowHeight: 40,
      gridHeight: 560,
      gridWidth: 1080,
      rowHeightProvider: (_grid, _row, item: StoryItem) => item.rowHeight,
    };
  }

  function getData(itemCount: number): StoryItem[] {
    const owners = ['Alex', 'Priya', 'Mia', 'Sam', 'Chris'];
    const fragments = [
      'Refactor keyboard shortcut handling for better readability.',
      'Adjust pinned rows when view-model updates after grouping.',
      'Improve screen-reader labels on grid menu actions.',
      'Align batch editor validation with backend constraints.',
      'Capture edge-case around hidden columns and row-span.',
    ];

    const data: StoryItem[] = [];
    for (let i = 0; i < itemCount; i++) {
      const lineCount = (i % 4) + 1;
      const summary = Array.from({ length: lineCount }, (_, idx) => `${fragments[(i + idx) % fragments.length]}`).join(' ');
      const wordCount = summary.trim().split(/\s+/).length;
      const computedRowHeight = Math.max(45, 8 + lineCount * 16);
      data.push({
        id: i,
        title: `Story ${i}`,
        owner: owners[i % owners.length],
        summary,
        rowHeight: wordCount < 10 ? 33 : computedRowHeight,
      });
    }
    return data;
  }

  function exportToExcel() {
    excelExportService.exportToExcel({
      filename: 'Export',
      format: 'xlsx',
    });
  }

  function exportToPdf() {
    pdfExportService.exportToPdf({ filename: 'Export' });
  }
</script>

<h2>
  Example 55: Variable Row Height (provider)
  <span class="float-end">
    <a
      style="font-size: 18px"
      target="_blank"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example55.svelte"
    >
      <span class="mdi mdi-link-variant"></span> code
    </a>
  </span>
</h2>

<div class="subtitle">Variable row heights driven by <code>rowHeightProvider</code>.</div>

<div class="row" style="margin-bottom: 6px">
  <div class="col-md-12">
    <button class="btn btn-outline-secondary btn-sm btn-icon mx-1" data-test="export-excel-btn" onclick={exportToExcel}>
      <i class="mdi mdi-file-excel-outline text-success"></i> Export to Excel
    </button>
    <button class="btn btn-outline-secondary btn-sm btn-icon mx-1" data-test="export-pdf-btn" onclick={exportToPdf}>
      <i class="mdi mdi-file-pdf-outline text-danger"></i> Export to PDF
    </button>
    <button class="btn btn-outline-secondary btn-sm btn-icon" onclick={scrollToRow90} data-test="scroll-row-90-example55">
      <span class="mdi mdi-arrow-down"></span>
      <span> Scroll To row 90</span>
    </button>
  </div>
</div>

<SlickgridSvelte options={gridOptions} {columns} {dataset} gridId="grid55" onSvelteGridCreated={gridReady}></SlickgridSvelte>
