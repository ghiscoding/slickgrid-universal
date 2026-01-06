<script setup lang="ts">
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { SlickgridVue, toCamelCase, type Column, type GridOption } from 'slickgrid-vue';
import { ref, type Ref } from 'vue';

const gridCreated = ref(false);
const gridOptions = ref<GridOption>();
const columnDefinitions: Ref<Column[]> = ref([]);
const dataset = ref<any[]>([]);
const templateUrl = ref(new URL('./data/users.csv', import.meta.url).href);
const uploadFileRef = ref('');
const showSubTitle = ref(true);

function disposeGrid() {
  gridCreated.value = false;
}

function handleFileImport(event: any) {
  const file: File = event.target.files[0];
  if (file.name.endsWith('.csv')) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const content = e.target.result;
      dynamicallyCreateGrid(content);
    };
    reader.readAsText(file);
  } else {
    alert('File must be a CSV file');
  }
}

function handleDefaultCsv() {
  const staticDataCsv = `First Name,Last Name,Age,Type\nBob,Smith,33,Teacher\nJohn,Doe,20,Student\nJane,Doe,21,Student`;
  dynamicallyCreateGrid(staticDataCsv);
  uploadFileRef.value = '';
}

function dynamicallyCreateGrid(csvContent: string) {
  // dispose of any previous grid before creating a new one
  gridCreated.value = false;

  const dataRows = csvContent?.split('\n');
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

  gridOptions.value = {
    gridHeight: 300,
    gridWidth: 800,
    enableFiltering: true,
    enableExcelExport: true,
    externalResources: [new ExcelExportService()],
    headerRowHeight: 35,
    rowHeight: 33,
  };

  dataset.value = outputData;
  columnDefinitions.value = colDefs;
  gridCreated.value = true;
}

function toggleSubTitle() {
  showSubTitle.value = !showSubTitle.value;
  const action = showSubTitle.value ? 'remove' : 'add';
  document.querySelector('.subtitle')?.classList[action]('hidden');
}
</script>

<template>
  <h2>
    Example 17: Dynamically Create Grid from CSV / Excel import
    <span class="float-end">
      <a
        style="font-size: 18px"
        target="_blank"
        href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example17.vue"
      >
        <span class="mdi mdi-link-variant"></span> code
      </a>
    </span>
    <button class="ms-2 btn btn-outline-secondary btn-sm btn-icon" type="button" data-test="toggle-subtitle" @click="toggleSubTitle()">
      <span class="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
    </button>
  </h2>

  <div class="subtitle">
    Allow creating a grid dynamically by importing an external CSV or Excel file. This script demo will read the CSV file and will consider
    the first row as the column header and create the column definitions accordingly, while the next few rows will be considered the
    dataset. Note that this example is demoing a CSV file import but in your application you could easily implemnt an Excel file uploading.
  </div>

  <div>A default CSV file can be download <a id="template-dl" :href="templateUrl">here</a>.</div>

  <div class="d-flex mt-5 align-items-end">
    <div class="file-upload">
      <label for="formFile" class="form-label">Choose a CSV file…</label>
      <input class="form-control" type="file" data-test="file-upload-input" :value="uploadFileRef" @change="handleFileImport" />
    </div>
    <span class="mx-3">or</span>
    <div>
      <button id="uploadBtn" data-test="static-data-btn" class="btn btn-outline-secondary" @click="handleDefaultCsv">
        Use default CSV data
      </button>
      &nbsp;/
      <button class="btn btn-outline-danger btn-sm ms-2" @click="disposeGrid()">Destroy Grid</button>
    </div>
  </div>

  <hr />

  <slickgrid-vue
    v-if="gridCreated"
    v-model:options="gridOptions"
    v-model:columns="columnDefinitions"
    v-model:dataset="dataset"
    grid-id="grid17"
  >
  </slickgrid-vue>
</template>

<style lang="scss">
.file-upload {
  max-width: 300px;
}
</style>
