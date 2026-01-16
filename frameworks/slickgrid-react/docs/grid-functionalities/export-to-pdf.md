#### index
- [Grid Options](#grid-options)
- [Column Definition & Options](#column-definition-and-options)
- [Custom Header & Footer](#custom-header--footer)
- [Styling the PDF](#styling-the-pdf)
- [Grouped Column Headers](#grouped-column-headers)
- [Export from Button Click](#export-from-button-click)
- [Show Loading Process Spinner](#show-loading-process-spinner)
- [UI Sample](#ui-sample)

### Description
You can Export to PDF, which will create a PDF file using the [jsPDF](https://github.com/parallax/jsPDF) library. This is an opt-in Service: you must download `@slickgrid-universal/pdf-export` and instantiate it in your grid options via `externalResources`.

### Demo
[Demo Page](https://ghiscoding.github.io/slickgrid-react-demos/#/ExamplePDF) / [Demo Component](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/ExamplePDF.tsx)

### Grid Menu (hamburger menu)
The Grid Menu can include an "Export to PDF" command. You can show/hide this option with `hideExportPdfCommand` (defaults to false).

### Grid Options
You can set options for the entire grid, such as enabling PDF export and customizing export behavior.
```tsx
import { PdfExportService } from '@slickgrid-universal/pdf-export';

const Example: React.FC = () => {
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [options, setOptions] = useState<GridOption>();

  useEffect(() => defineGrid(), []);

  function defineGrid() {
    setOptions({
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
    });
  }
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
```tsx
const Example: React.FC = () => {
  const [options, setOptions] = useState<GridOption>();
  function defineGrid() {
    setOptions({
      createPreHeaderPanel: true,
      showPreHeaderPanel: true,
      pdfExportOptions: {
        // ...other options
      },
      externalResources: [new PdfExportService()],
    });
  }
}
```

### Export from Button Click
You can export from the Grid Menu or trigger export from your own button:
```tsx
<button class="btn btn-default btn-sm" onClick={() => exportToPdf()}>
   Download to PDF
</button>
```
```tsx
const Example: React.FC = () => {
  const pdfExportService = new PdfExportService();
  function exportToFile() {
    pdfExportService.exportToPdf({
      filename: 'myExport',
      pageOrientation: 'portrait',
      pageSize: 'a4',
    });
  }
}
```

### Show Loading Process Spinner
You can subscribe to `onBeforeExportToPdf` and `onAfterExportToPdf` events to show/hide a spinner during export.
```tsx
return !options ? null : (
  {processing && <span>
    <i className="mdi mdi-sync mdi-spin"></i>
  </span>}

  <SlickgridReact gridId="grid5"
      columns={columns}
      options={options}
      dataset={dataset}
      paginationOptions={paginationOptions}
      onReactGridCreated={$event => reactGridReady($event.detail)}
      onBeforeExportToPdf={() => changeProcessing(true)}
      onAfterExportToPdf={() => changeProcessing(false)}
      onGridStateChanged={$event => gridStateChanged($event.detail)}
  />
);
```

### UI Sample
The Export to PDF supports Unicode, custom formatting, and grouped headers. See the demo for a preview.

---
For more advanced options, see the [pdfExportOption.interface.ts](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/interfaces/pdfExportOption.interface.ts).
