# @slickgrid-universal/pdf-export

## PDF Export Service

Export your SlickGrid data to PDF format using [`jsPDF`](https://www.npmjs.com/package/jspdf) - a popular, well-supported PDF library for JavaScript.

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
- Powered by jsPDF (widely used, extensible, and feature-rich)

`jsPDF` is a minimal PDF library that's perfect for grid exports:

## Why `jsPDF`?

`jsPDF` is a widely used JavaScript PDF generation library:
- Well-maintained and actively developed
- Supports a wide range of PDF features
- Extensible with plugins (such as autotable)
- Large community and documentation
- Supports unicode and emojis

## License

MIT
