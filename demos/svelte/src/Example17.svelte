<script lang="ts">
  import { ExcelExportService } from '@slickgrid-universal/excel-export';
  import { SlickgridSvelte, toCamelCase, type Column, type GridOption, type SlickgridSvelteInstance } from 'slickgrid-svelte';

  let columns: Column[] = [];
  let dataset: any[] = [];
  let options: GridOption = {};
  let grid: SlickgridSvelteInstance | undefined;
  let gridCreated = false;
  let showSubTitle = true;
  const templateUrl = '/data/users.csv';

  function handleDefaultCsv() {
    createGrid('First Name,Last Name,Age,Type\nBob,Smith,33,Teacher\nJohn,Doe,20,Student\nJane,Doe,21,Student');
  }
  function handleFileImport(event: Event) {
    const file = (event.currentTarget as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => createGrid(String(reader.result ?? ''));
    reader.readAsText(file);
  }
  function createGrid(csv: string) {
    gridCreated = false;
    const rows = csv
      .trim()
      .split(/\r?\n/)
      .map((row) => row.split(','));
    const headers = rows[0] ?? [];
    columns = headers.map((name) => {
      const field = toCamelCase(name);
      return { id: field, name, field, filterable: true, sortable: true };
    });
    dataset = rows.slice(1).map((cells, index) => {
      const item: Record<string, unknown> = {};
      cells.forEach((value, columnIndex) => (item[String(columns[columnIndex]?.id)] = value));
      return { ...item, id: item.id ?? index + 1 };
    });
    options = {
      gridHeight: 300,
      gridWidth: 800,
      enableFiltering: true,
      enableExcelExport: true,
      externalResources: [new ExcelExportService()],
      headerRowHeight: 35,
      rowHeight: 33,
    };
    gridCreated = true;
  }
  function toggleGrid() {
    gridCreated = !gridCreated;
  }
  function toggleSubTitle() {
    showSubTitle = !showSubTitle;
    grid?.resizerService.resizeGrid(0);
  }
</script>

<h2>
  Example 17: Dynamically Create Grid from CSV / Excel import
  <span class="float-end"
    ><a
      style="font-size:18px"
      target="_blank"
      rel="noreferrer"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/frameworks/angular-slickgrid/src/demos/examples/example17.component.ts"
      ><span class="mdi mdi-link-variant"></span> code</a
    ></span
  >
  <button
    class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
    type="button"
    data-test="toggle-subtitle"
    aria-label="Toggle example sub-title details"
    onclick={toggleSubTitle}><span class="mdi mdi-information-outline"></span></button
  >
</h2>
{#if showSubTitle}<div class="subtitle">
    Create a grid dynamically by importing a CSV file. The first row becomes the column headers and following rows become dataset records.
  </div>{/if}
<div>A default CSV file can be downloaded <a id="template-dl" href={templateUrl}>here</a>.</div>
<div class="d-flex mt-5 align-items-end">
  <div class="file-upload">
    <label for="formFile" class="form-label">Choose a CSV file…</label><input
      id="formFile"
      class="form-control"
      type="file"
      data-test="file-upload-input"
      accept=".csv,text/csv"
      onchange={handleFileImport}
    />
  </div>
  <span class="mx-3">or</span>
  <div>
    <button id="uploadBtn" data-test="static-data-btn" class="btn btn-outline-secondary" onclick={handleDefaultCsv}
      >Use default CSV data</button
    >
    <button class="btn btn-outline-secondary" data-test="toggle-grid-btn" disabled={!columns.length} onclick={toggleGrid}
      >{gridCreated ? 'Destroy Grid' : 'Recreate Grid'}</button
    >
  </div>
</div>
<hr />
{#if gridCreated}<SlickgridSvelte
    gridId="grid17"
    {columns}
    {options}
    {dataset}
    onSvelteGridCreated={(instance) => (grid = instance)}
  />{/if}
