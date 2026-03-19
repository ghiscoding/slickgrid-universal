#### index
- [Grid Options](#grid-options)
- [Column Definition & Options](#column-definition-and-options)
- [Custom Header & Footer](#custom-header--footer)
- [Styling the PDF](#styling-the-pdf)
- [Grouped Column Headers](#grouped-column-headers)
- [Document Properties](#document-properties)
- [AutoTable Options Callback](#autotable-options-callback)
- [Export from Button Click](#export-from-button-click)
- [Show Loading Process Spinner](#show-loading-process-spinner)
- [UI Sample](#ui-sample)

### Description
You can Export to PDF, which will create a PDF file using the [jsPDF](https://github.com/parallax/jsPDF) library. This is an opt-in Service: you must download `@slickgrid-universal/pdf-export` and instantiate it in your grid options via `externalResources`.

#### jspdf-autotable (optional)

Install [`jspdf-autotable`](https://www.npmjs.com/package/jspdf-autotable) for enhanced table rendering with borders, per-column styles, proper cell padding, and more:
```bash
npm install jspdf-autotable
```

In bundled ES-module applications you may need to apply the AutoTable plugin explicitly at startup:
```ts
import { jsPDF } from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';

applyPlugin(jsPDF); // register AutoTable once
```
When `jspdf-autotable` is detected at runtime the service automatically uses it; otherwise it falls back to a simple text-based layout.

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
  - `textAlign`: per-column horizontal text alignment (`'left'` \| `'center'` \| `'right'`), maps to AutoTable's `halign` style

Example — right-aligning a numeric column:
```ts
const columns = [
  { id: 'description', name: 'Description', field: 'description' },
  {
    id: 'amount',
    name: 'Amount',
    field: 'amount',
    pdfExportOptions: { textAlign: 'right' },
  },
];
```

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

#### Custom Colors

Header, pre-header, and alternate-row colors are configurable as RGB tuples. These apply to both the AutoTable and manual fallback rendering paths:

| Option | Default | Description |
|--------|---------|-------------|
| `headerBackgroundColor` | `[66, 139, 202]` | Column header background |
| `headerTextColor` | `[255, 255, 255]` | Column header text |
| `preHeaderBackgroundColor` | `[108, 117, 125]` | Pre-header (group) background |
| `preHeaderTextColor` | `[255, 255, 255]` | Pre-header (group) text |
| `alternateRowColor` | `[245, 245, 245]` | Alternating data row fill |
| `cellPadding` | `4` | AutoTable cell padding (px) |

```ts
pdfExportOptions: {
  headerBackgroundColor: [40, 100, 180],
  headerTextColor: [255, 255, 255],
  preHeaderBackgroundColor: [80, 90, 100],
  preHeaderTextColor: [255, 255, 255],
  alternateRowColor: [240, 245, 250],
  cellPadding: 6,
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

### Document Properties

Set PDF document metadata (visible in the viewer's "Document Properties" dialog) via the `documentProperties` option:

```ts
pdfExportOptions: {
  documentProperties: {
    title: 'Balance Sheet Q1 2025',
    author: 'Jane Doe',
    subject: 'Financial Report',
    keywords: 'balance,sheet,Q1,2025',
    creator: 'My Application',
  },
}
```

### AutoTable Options Callback

Use the `autoTableOptions` callback to customize any AutoTable option (themes, hooks, margins, etc.) without subclassing the service:

```ts
pdfExportOptions: {
  autoTableOptions: (opts) => {
    opts.theme = 'striped';
    opts.didDrawCell = (data) => { /* custom cell drawing */ };
    return opts;
  },
}
```

The callback receives the fully-built AutoTable options object and must return the (optionally modified) object.

### Export from Button Click
You can export from the Grid Menu or trigger export from your own button:
```tsx
<button class="btn btn-default btn-sm" onClick={() => exportToPdf()}>
   Download to PDF
</button>
```
```tsx
const Example: React.FC = () => {
  const [pdfExportService] = useState(new PdfExportService());

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
