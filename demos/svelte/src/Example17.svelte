<script lang="ts">
  import { ExcelExportService } from '@slickgrid-universal/excel-export';
  import { SlickgridSvelte, toCamelCase, type Column, type GridOption } from 'slickgrid-svelte';
  import templateUrl from './data/users.csv?url';

  let gridCreated = $state(false);
  let hideSubTitle = $state(false);
  let options = $state.raw<GridOption>();
  let columns = $state.raw<Column[]>([]);
  let dataset = $state.raw<any[]>([]);
  let uploadFileRef = $state('');

  function toggleGrid() {
    gridCreated = !gridCreated;
  }

  function handleFileImport(event: Event) {
    const file = (event.currentTarget as HTMLInputElement).files?.[0];
    if (file?.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = () => dynamicallyCreateGrid(String(reader.result ?? ''));
      reader.readAsText(file);
    } else {
      alert('File must be a CSV file');
    }
  }

  function handleDefaultCsv() {
    const staticDataCsv = `First Name,Last Name,Age,Type\nBob,Smith,33,Teacher\nJohn,Doe,20,Student\nJane,Doe,21,Student`;
    dynamicallyCreateGrid(staticDataCsv);
    uploadFileRef = '';
  }

  function dynamicallyCreateGrid(csvContent: string) {
    // dispose of any previous grid before creating a new one
    gridCreated = false;

    const dataRows = csvContent.trim().split(/\r?\n/);
    const colDefs: Column[] = [];
    const outputData: any[] = [];

    // create column definitions
    dataRows.forEach((dataRow, rowIndex) => {
      const cellValues = dataRow.split(',');
      const dataEntryObj: any = {};

      if (rowIndex === 0) {
        // the 1st row is considered to be the header titles, we can create the column definitions from it
        for (const cellVal of cellValues) {
          const camelFieldName = toCamelCase(cellVal);
          colDefs.push({
            id: camelFieldName,
            name: cellVal,
            field: camelFieldName,
            filterable: true,
            sortable: true,
          });
        }
      } else {
        // at this point all column defs were created and we can loop through them and
        // we can now start adding data as an object and then simply push it to the dataset array
        cellValues.forEach((cellVal, colIndex) => {
          dataEntryObj[colDefs[colIndex].id] = cellVal;
        });

        // a unique "id" must be provided, if not found then use the row index and push it to the dataset
        if ('id' in dataEntryObj) {
          outputData.push(dataEntryObj);
        } else {
          outputData.push({ ...dataEntryObj, id: rowIndex });
        }
      }
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

    dataset = outputData;
    columns = colDefs;
    gridCreated = true;
  }

  function toggleSubTitle() {
    hideSubTitle = !hideSubTitle;
  }
</script>

<h2>
  Example 17: Dynamically Create Grid from CSV / Excel import
  <span class="float-end">
    <a
      style="font-size: 18px"
      target="_blank"
      rel="noreferrer"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example17.svelte"
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
    Allow creating a grid dynamically by importing an external CSV or Excel file. This script demo will read the CSV file and will consider
    the first row as the column header and create the column definitions accordingly, while the next few rows will be considered the
    dataset. Note that this example is demoing a CSV file import but in your application you could easily implemnt an Excel file uploading.
  </div>
{/if}

<div>A default CSV file can be download <a id="template-dl" href={templateUrl}>here</a>.</div>

<div class="d-flex mt-5 align-items-end">
  <div class="file-upload">
    <label for="formFile" class="form-label">Choose a CSV file…</label>
    <input
      id="formFile"
      class="form-control"
      type="file"
      data-test="file-upload-input"
      bind:value={uploadFileRef}
      onchange={handleFileImport}
    />
  </div>
  <span class="mx-3">or</span>
  <div>
    <button id="uploadBtn" data-test="static-data-btn" class="btn btn-outline-secondary" onclick={handleDefaultCsv}>
      Use default CSV data
    </button>
    &nbsp;/
    <button class="btn btn-outline-danger btn-sm ms-2" data-test="toggle-grid-btn" disabled={columns.length === 0} onclick={toggleGrid}>
      {gridCreated ? 'Destroy Grid' : 'Recreate Grid'}
    </button>
  </div>
</div>

<hr />

{#if gridCreated}
  <SlickgridSvelte gridId="grid17" {columns} {options} {dataset} />
{/if}

<style>
  .file-upload {
    max-width: 300px;
  }
</style>
