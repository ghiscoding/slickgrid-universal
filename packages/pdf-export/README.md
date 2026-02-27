[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![lerna--lite](https://img.shields.io/badge/maintained%20with-lerna--lite-e137ff)](https://github.com/ghiscoding/lerna-lite)
[![npm](https://img.shields.io/npm/v/@slickgrid-universal/pdf-export.svg)](https://www.npmjs.com/package/@slickgrid-universal/pdf-export)
[![npm](https://img.shields.io/npm/dy/@slickgrid-universal/pdf-export)](https://www.npmjs.com/package/@slickgrid-universal/pdf-export)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/@slickgrid-universal/pdf-export?color=success&label=gzip)](https://bundlephobia.com/result?p=@slickgrid-universal/pdf-export)

## PDF Export Service

#### `@slickgrid-universal/pdf-export`

Export your SlickGrid data to PDF format using [`jsPDF`](https://www.npmjs.com/package/jspdf) - a popular, well-supported PDF library for JavaScript.

### External Dependencies

- [`jsPDF`](https://www.npmjs.com/package/jspdf) (required) – builds and exports PDF documents.
- [`jspdf-autotable`](https://www.npmjs.com/package/jspdf-autotable) (optional) – renders a proper HTML-style table with borders, padding, and per-column styles. When detected at runtime the service automatically uses it; otherwise it falls back to a simple text-based layout.

## Installation

```bash
npm install @slickgrid-universal/pdf-export

# optional – for enhanced table rendering
npm install jspdf-autotable
```

## Usage

```typescript
import { PdfExportService } from '@slickgrid-universal/pdf-export';

// Register the service
const pdfExportService = new PdfExportService();

// Initialize in grid options
const gridOptions = {
  enablePdfExport: true,
  pdfExportOptions: {
    filename: 'my-grid-export',
    pageOrientation: 'landscape',
    pageSize: 'a4',
    documentTitle: 'My Grid Data'
  },
  externalResources: [pdfExportService]
};

// Export to PDF
await pdfExportService.exportToPdf({
  filename: 'custom-export',
  pageOrientation: 'portrait'
});
```

### Using jspdf-autotable

When `jspdf-autotable` is installed, the service will automatically render a full HTML-style table.
In bundled ES-module applications you may need to apply the AutoTable plugin explicitly:

```typescript
import { jsPDF } from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';

applyPlugin(jsPDF); // register AutoTable once at startup
```

#### Per-column text alignment

Individual columns can specify a `pdfExportOptions.textAlign` that maps to AutoTable's `halign` column style. Both header and body cells are aligned to match:

```typescript
const columnDefinitions = [
  { id: 'description', name: 'Description', field: 'description' },
  {
    id: 'amount',
    name: 'Amount',
    field: 'amount',
    pdfExportOptions: { textAlign: 'right' }
  }
];
```

#### Customizing AutoTable options via callback

Use the `autoTableOptions` callback to add advanced AutoTable features (hooks, themes, custom margins, etc.) without subclassing:

```typescript
const gridOptions = {
  pdfExportOptions: {
    autoTableOptions: (opts) => {
      opts.theme = 'striped';
      opts.didDrawCell = (data) => { /* custom cell drawing */ };
      return opts;
    }
  }
};
```

### Grouped column headers (pre-header row)

When columns define a `columnGroup` property and the grid has `createPreHeaderPanel: true` / `showPreHeaderPanel: true`, the PDF export automatically renders a pre-header row above the regular column headers. Groups that span multiple columns are merged into a single cell.

This works in both the AutoTable path (using `colSpan`) and the manual fallback path. Pre-header colors are controlled via `preHeaderBackgroundColor` and `preHeaderTextColor`.

### Styling options

Header, pre-header, and alternate-row colors are configurable as RGB tuples and apply to both the AutoTable and manual fallback rendering paths:

```typescript
const gridOptions = {
  pdfExportOptions: {
    headerBackgroundColor: [40, 100, 180],   // default [66, 139, 202]
    headerTextColor: [255, 255, 255],        // default [255, 255, 255]
    preHeaderBackgroundColor: [80, 90, 100], // default [108, 117, 125]
    preHeaderTextColor: [255, 255, 255],     // default [255, 255, 255]
    alternateRowColor: [240, 245, 250],      // default [245, 245, 245]
    cellPadding: 6,                          // default 4 (AutoTable only)
  }
};
```

### Document properties (metadata)

You can set PDF document metadata (visible in the viewer's "Document Properties" dialog) via the `documentProperties` option:

```ts
gridOptions = {
  pdfExportOptions: {
    documentProperties: {
      title: 'Balance Sheet Q1 2025',
      author: 'Jane Doe',
      subject: 'Financial Report',
      keywords: 'balance,sheet,Q1,2025',
      creator: 'My Application',
    },
  },
};
```

## Options

See [PdfExportOption](../common/src/interfaces/pdfExportOption.interface.ts) for all available options.

## Features

- Export grid data to PDF
- Support for grouped data
- Configurable page size and orientation (A4, Letter, Legal)
- Portrait and landscape orientations
- Custom font sizes
- Support for formatters
- HTML entity decoding
- Data sanitization
- Per-column text alignment (via `pdfExportOptions.textAlign` on columns)
- Grouped column headers (pre-header row with `colSpan` merging)
- Customizable header, pre-header, and alternate row colors
- Configurable cell padding
- PDF document properties (metadata: title, author, subject, keywords, creator)
- Extensible AutoTable options via `autoTableOptions` callback
- Powered by `jsPDF` (widely used, extensible, and feature-rich)

## License

MIT
