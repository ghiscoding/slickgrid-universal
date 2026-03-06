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

- [`jsPDF`](https://www.npmjs.com/package/jspdf) to build and export to PDF.
- [`jspdf-autotable`](https://www.npmjs.com/package/jspdf-autotable) (optional) – renders a proper HTML-style table with borders, padding, and per-column styles. When detected at runtime the service automatically uses it; otherwise it falls back to a simple text-based layout.

## Installation

```bash
npm install @slickgrid-universal/pdf-export

# optional – for enhanced table rendering with borders, per-column styles and more
npm install jspdf-autotable
```

## Usage

```typescript
import { PdfExportService } from '@slickgrid-universal/pdf-export';
import { jsPDF } from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';

applyPlugin(jsPDF); // register AutoTable once at startup (if installed)

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
- Per-column text alignment
- Grouped column headers (pre-header row)
- Customizable header, pre-header, and alternate row colors
- PDF document properties (metadata)
- Powered by `jsPDF` (widely used, extensible, and feature-rich)
- Optional enhanced table rendering via `jspdf-autotable`

## License

MIT
