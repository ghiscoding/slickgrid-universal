# @slickgrid-universal/pdf-export

## PDF Export Service

Export your SlickGrid data to PDF format using tinypdf - a minimal, zero-dependency PDF library (~70x smaller than jsPDF).

## Installation

```bash
npm install @slickgrid-universal/pdf-export
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
- Minimal bundle size (~70x smaller than jsPDF)
- Zero dependencies

## Why tinypdf?

tinypdf is a minimal PDF library that's perfect for grid exports:
- **3.3 KB** vs 229 KB (jsPDF) - ~70x smaller
- **Zero dependencies**
- Simple API focused on tables and text
- Fast and efficient

## License

MIT
