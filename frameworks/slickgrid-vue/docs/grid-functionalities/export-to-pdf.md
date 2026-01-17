#### index
- [Grid Options](#grid-options)
- [Column Definition & Options](#column-definition-and-options)
- [Custom Header & Footer](#custom-header--footer)
- [Styling the PDF](#styling-the-pdf)
- [Grouped Column Headers](#grouped-column-headers)
- [Export from Button Click](#export-from-a-button-click-event)
- [Show Loading Process Spinner](#show-loading-process-spinner)
- [UI Sample](#ui-sample)

### Description
You can Export to PDF, which will create a PDF file using the [jsPDF](https://github.com/parallax/jsPDF) library. This is an opt-in Service: you must download `@slickgrid-universal/pdf-export` and instantiate it in your grid options via `externalResources`.

### Demo
[Demo Page](https://ghiscoding.github.io/slickgrid-vue-demos/#/ExamplePDF) / [Demo Component](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/ExamplePDF.vue)

### Grid Menu (hamburger menu)
The Grid Menu can include an "Export to PDF" command. You can show/hide this option with `hideExportPdfCommand` (defaults to false).

### Grid Options
You can set options for the entire grid, such as enabling PDF export and customizing export behavior.
```vue
<script setup lang="ts">
import { PdfExportService } from '@slickgrid-universal/pdf-export';
import { ref } from 'vue';

const gridOptions = ref<GridOption>();

function defineGrid() {
  gridOptions.value = {
    enablePdfExport: true,
    pdfExportOptions: {
      exportWithFormatter: true,
      filename: 'myExport',
      pageOrientation: 'portrait', // or 'landscape'
      pageSize: 'a4', // 'a4', 'letter', etc.
      documentTitle: 'My PDF Title',
      sanitizeDataExport: true,
    },
    externalResources: [new PdfExportService()],
    gridMenu: {
      hideExportPdfCommand: false, // optional
    }
  };
}
</script>
```

### Column Definition and Options
- `excludeFromExport`: skip this column in the export
- `exportWithFormatter`: use the column's formatter for export (column-level overrides grid option)
- `exportCustomFormatter`: use a different formatter for export
- `sanitizeDataExport`: remove HTML/script from exported data
- `pdfExportOptions`: per-column PDF export options (see interface for details)

### Custom Header & Footer
You can add a custom header or footer to your PDF using the `documentTitle` option or by customizing the export logic.

### Styling the PDF
You can customize font size, orientation, margins, and more via `pdfExportOptions`:

#### Simulating PDF Zoom / Fit More Columns
jsPDF does not have a true "zoom" feature, but you can fit more columns or make the export appear smaller by reducing the font size and/or column widths in your `pdfExportOptions`. For example, setting `fontSize` and `headerFontSize` to 80% of their defaults will make the content appear "zoomed out" and fit more columns on the page:

```ts
pdfExportOptions: {
  fontSize: 8, // 80% of default (10)
  headerFontSize: 9, // 80% of default (11)
  // Optionally, set column widths to a smaller value
  // width: <your calculated value>
}
```

You can also use `pageOrientation: 'landscape'` or a larger `pageSize` to fit more content horizontally.

```ts
pdfExportOptions: {
  fontSize: 10,
  headerFontSize: 11,
  margin: 40,
  documentTitle: 'My PDF Title',
  repeatHeadersOnEachPage: true,
}
```

### Grouped Column Headers
If your grid uses column grouping, you can enable pre-header rows in the PDF export:
```vue
<script setup lang="ts">
const gridOptions = ref<GridOption>();
function defineGrid() {
  gridOptions.value = {
    createPreHeaderPanel: true,
    showPreHeaderPanel: true,
    pdfExportOptions: {
      // ...other options
    },
    externalResources: [new PdfExportService()],
  };
}
</script>
```

### Export from a Button Click Event
You can export from the Grid Menu or trigger export from your own button:
```vue
<button class="btn btn-default btn-sm" @click="exportToPdf()">
   Download to PDF
</button>
```
```vue
<script setup lang="ts">
import { PdfExportService } from '@slickgrid-universal/pdf-export';
import { ref } from 'vue';

const pdfExportService = new PdfExportService();
const gridOptions = ref<GridOption>();

function defineGrid() {
  gridOptions.value = {
    enablePdfExport: true,
    externalResources: [pdfExportService],
  };
}

function exportToFile() {
  pdfExportService.exportToPdf({
    filename: 'myExport',
    pageOrientation: 'portrait',
    pageSize: 'a4',
  });
}
</script>
```

### Show Loading Process Spinner
You can subscribe to `onBeforeExportToPdf` and `onAfterExportToPdf` events to show/hide a spinner during export.
```vue
<template>
  <span v-if="processing">
    <i class="mdi mdi-sync mdi-spin"></i>
  </span>
  <SlickgridVue gridId="grid5"
      v-model:columns="columnDefinitions"
      v-model:options="gridOptions"
      v-model:data="dataset"
      @onBeforeExportToPdf="changeProcessing(true)"
      @onAfterExportToPdf="changeProcessing(false)"
  />
</template>
```

### UI Sample
The Export to PDF supports Unicode, custom formatting, and grouped headers. See the demo for a preview.

---
For more advanced options, see the [pdfExportOption.interface.ts](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/interfaces/pdfExportOption.interface.ts).
