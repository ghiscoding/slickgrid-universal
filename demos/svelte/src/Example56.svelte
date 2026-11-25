<script lang="ts">
  import { ExcelExportService } from '@slickgrid-universal/excel-export';
  import { PdfExportService } from '@slickgrid-universal/pdf-export';
  import { SlickgridSvelte, type Column, type GridOption, type SlickgridSvelteInstance } from 'slickgrid-svelte';
  import './example56.scss';

  const NB_ITEMS = 150;

  interface TaskItem {
    id: number;
    title: string;
    status: 'Todo' | 'In Progress' | 'Done';
    notes: string;
  }

  let gridOptions = $state.raw<GridOption>();
  let columns = $state.raw<Column[]>([]);
  let dataset = $state.raw<TaskItem[]>([]);
  let isCompact = false; // only read by the row metadata provider, not by the template
  const excelExportService = new ExcelExportService();
  const pdfExportService = new PdfExportService();
  let svelteGrid!: SlickgridSvelteInstance;

  defineGrid();
  dataset = getData(NB_ITEMS);

  function gridReady(grid: SlickgridSvelteInstance) {
    svelteGrid = grid;
  }

  function toggleDensity() {
    isCompact = !isCompact;
    svelteGrid?.slickGrid?.invalidateRowHeights?.();
  }

  function scrollToRow90() {
    svelteGrid?.slickGrid?.scrollRowToTop(90);
  }

  function defineGrid() {
    columns = [
      { id: 'id', name: '#', field: 'id', minWidth: 60, maxWidth: 70 },
      { id: 'title', name: 'Task', field: 'title', minWidth: 180, width: 220 },
      { id: 'status', name: 'Status', field: 'status', minWidth: 120, width: 140 },
      {
        id: 'rowHeight',
        name: 'Height',
        field: 'rowHeight',
        exportWithFormatter: true,
        formatter: (row, _cell, _value, _coldef, _dataContext, grid) => {
          return `${grid.getItemMetadaWhenExists(row)?.height ?? 0}px`;
        },
        minWidth: 90,
        width: 90,
      },
      { id: 'notes', name: 'Notes', field: 'notes', cssClass: 'cell-wrap', width: 420, maxWidth: 520 },
    ];

    gridOptions = {
      enableCellNavigation: true,
      enableTextSelectionOnCells: true,
      enableVariableRowHeight: true,
      rowHeight: 40,
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
      pinning: { rows: { top: [0, 1] } },
      gridHeight: 560,
      gridWidth: 1080,
      dataView: {
        globalItemMetadataProvider: {
          getRowMetadata: (item: TaskItem) => {
            if (item.notes === 'Short note.') {
              return { height: isCompact ? 40 : 33 };
            }

            const lineCount = getEstimatedLineCount(item.notes);
            const verticalPadding = 8;
            const lineHeight = isCompact ? 21 : 18;
            const minRowHeight = isCompact ? 46 : 40;
            const baseHeight = Math.max(minRowHeight, verticalPadding + lineCount * lineHeight);

            return { height: baseHeight };
          },
        },
      },
    };
  }

  function getEstimatedLineCount(text: string): number {
    return Math.max(1, Math.ceil(text.length / 55));
  }

  function getData(itemCount: number): TaskItem[] {
    const statuses: Array<TaskItem['status']> = ['Todo', 'In Progress', 'Done'];
    const notesPool = [
      'Short note.',
      'Need to validate keyboard navigation and ensure screen reader output remains stable across pinned panes.',
      'Review row height invalidation path when data changes quickly due to live updates from backend polling.',
      'Longer QA note: validate scrolling behavior at top and bottom boundaries, compare rendered range against expected rows, and confirm no visual clipping for wrapped cells.',
    ];

    const data: TaskItem[] = [];
    for (let i = 0; i < itemCount; i++) {
      data.push({
        id: i,
        title: `Task ${i}`,
        status: statuses[i % statuses.length],
        notes: notesPool[i % notesPool.length],
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
  Example 56: Variable Row Height (item metadata)
  <span class="float-end">
    <a
      style="font-size: 18px"
      target="_blank"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example56.svelte"
    >
      <span class="mdi mdi-link-variant"></span> code
    </a>
  </span>
</h2>

<div class="subtitle">
  Variable row heights via <code>ItemMetadata.height</code> fallback, with compact mode rebuilding heights through
  <code>invalidateRowHeights()</code>.
</div>

<div class="row" style="margin-bottom: 6px">
  <div class="col-md-12">
    <button class="btn btn-outline-secondary btn-sm btn-icon mx-1" data-test="export-excel-btn" onclick={exportToExcel}>
      <i class="mdi mdi-file-excel-outline text-success"></i> Export to Excel
    </button>
    <button class="btn btn-outline-secondary btn-sm btn-icon mx-1" data-test="export-pdf-btn" onclick={exportToPdf}>
      <i class="mdi mdi-file-pdf-outline text-danger"></i> Export to PDF
    </button>
    <button class="btn btn-outline-secondary btn-sm btn-icon" onclick={toggleDensity} data-test="toggle-density">
      <span class="mdi mdi-flip-vertical"></span>
      <span> Toggle Compact Density</span>
    </button>
    <button class="btn btn-outline-secondary btn-sm ms-2 btn-icon" onclick={scrollToRow90} data-test="scroll-row-90-example56">
      <span class="mdi mdi-arrow-down"></span>
      <span> Scroll To row 90</span>
    </button>
  </div>
</div>

<SlickgridSvelte options={gridOptions} {columns} {dataset} gridId="grid56" onSvelteGridCreated={gridReady}></SlickgridSvelte>
