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

You can optionally install the Export to PDF resource, which allows you to export your grid data to a PDF file. The export uses the [jsPDF](https://github.com/parallax/jsPDF) library and supports custom headers, footers, column grouping, and more. This is an opt-in Service: you must download `@slickgrid-universal/pdf-export` and instantiate it in your grid options via `externalResources`.

### Demo
[Demo Page](https://ghiscoding.github.io/slickgrid-universal/#/example-pdf) / [Demo Component](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vanilla/src/examples/example-pdf.ts)

### Grid Menu (hamburger menu)
The Grid Menu can include an "Export to PDF" command. You can show/hide this option with `hideExportPdfCommand` (defaults to false).

### Grid Options
You can set options for the entire grid, such as enabling PDF export and customizing export behavior.
```ts
import { PdfExportService } from '@slickgrid-universal/pdf-export';

initializeGrid() {
  this.gridOptions = {
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
```ts
this.gridOptions = {
  createPreHeaderPanel: true,
  showPreHeaderPanel: true,
  pdfExportOptions: {
    // ...other options
  },
  externalResources: [new PdfExportService()],
};
```

### Export from a Button Click Event
You can export from the Grid Menu or trigger export from your own button:
```html
<button class="btn btn-default btn-sm" (click)="exportToPdf()">
   Download to PDF
</button>
```
```ts
import { PdfExportService } from '@slickgrid-universal/pdf-export';

export class MySample {
  pdfExportService = new PdfExportService();

  initializeGrid() {
    this.gridOptions = {
      enablePdfExport: true,
      externalResources: [this.pdfExportService],
    };
  }

  exportToFile() {
    this.pdfExportService.exportToPdf({
      filename: 'myExport',
      pageOrientation: 'portrait',
      pageSize: 'a4',
    });
  }
}
```

### Show Loading Process Spinner
You can subscribe to `onBeforeExportToPdf` and `onAfterExportToPdf` events to show/hide a spinner during export.
```ts
export class MyExample {
  processing = false;

  constructor() {
    const gridContainerElm = document.querySelector<HTMLDivElement>(`.grid2`);
    gridContainerElm.addEventListener('onbeforeexporttopdf', () => this.processing = true);
    gridContainerElm.addEventListener('onafterexporttopdf', () => this.processing = false);
  }
}
```

### UI Sample
The Export to PDF supports Unicode, custom formatting, and grouped headers. See the demo for a preview.

---
For more advanced options, see the [pdfExportOption.interface.ts](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/interfaces/pdfExportOption.interface.ts).
