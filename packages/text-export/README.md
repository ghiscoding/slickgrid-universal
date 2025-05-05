[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![lerna--lite](https://img.shields.io/badge/maintained%20with-lerna--lite-e137ff)](https://github.com/ghiscoding/lerna-lite)
[![npm](https://img.shields.io/npm/v/@slickgrid-universal/text-export.svg)](https://www.npmjs.com/package/@slickgrid-universal/text-export)
[![npm](https://img.shields.io/npm/dy/@slickgrid-universal/text-export)](https://www.npmjs.com/package/@slickgrid-universal/text-export)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/@slickgrid-universal/text-export?color=success&label=gzip)](https://bundlephobia.com/result?p=@slickgrid-universal/text-export)

[![Actions Status](https://github.com/ghiscoding/slickgrid-universal/workflows/CI%20Build/badge.svg)](https://github.com/ghiscoding/slickgrid-universal/actions)
[![Cypress.io](https://img.shields.io/badge/tested%20with-Cypress-04C38E.svg)](https://www.cypress.io/)
[![jest](https://jestjs.io/img/jest-badge.svg)](https://github.com/facebook/jest)
[![codecov](https://codecov.io/gh/ghiscoding/slickgrid-universal/branch/master/graph/badge.svg)](https://codecov.io/gh/ghiscoding/slickgrid-universal)

## Text Export Service (text file)
#### @slickgrid-universal/text-export

Simple Export to File Service that allows to export as CSV or Text (`.csv` or `.txt`), user can also choose which data separator to use for the export (comma, colon, semicolon, ...).

There are a couple of reasons to use this package (it could be used instead of the `excel-export`)
- if you want to export to a text file with any type of separator (tab, colon, semicolon, comma)
- if you have a very large dataset, this export consumes a lot less memory in comparison to the `excel-export`

### Internal Dependencies
- [@slickgrid-universal/common](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/common)
- [@slickgrid-universal/utils](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/utils)

### External Dependencies
This package requires [text-encoding-utf-8](https://www.npmjs.com/package/text-encoding-utf-8) which is use to ensure proper UTF-8 encoding, even emoji will be exported without issues.

### Installation
Follow the instruction provided in the main [README](https://github.com/ghiscoding/slickgrid-universal#installation), you can see a demo by looking at the [GitHub Demo](https://ghiscoding.github.io/slickgrid-universal) page and click on "Export to CSV" from the Grid Menu (aka hamburger menu).

### Usage
In order to use the Service, you will need to register it in your grid options via the `externalResources` as shown below.

##### ViewModel
```ts
import { TextExportService } from '@slickgrid-universal/text-export';

export class MyExample {
  initializeGrid {
    this.gridOptions = {
      enableTextExport: true,
      textExportOptions: {
        sanitizeDataExport: true
      },
      externalResources: [new TextExportService()],
    }
  }
}
```

If you wish to reference the service to use it with external export button, then simply create a reference while instantiating it.
```ts
import { TextExportService } from '@slickgrid-universal/text-export';

export class MyExample {
  exportService: TextExportService;

  constructor() {
    this.exportService = new TextExportService();
  }

  initializeGrid {
    this.gridOptions = {
      enableTextExport: true,
      textExportOptions: {
        sanitizeDataExport: true
      },
      externalResources: [this.exportService],
    }
  }

  exportToFile() {
    this.exportService.exportToFile({ filename: 'export', format: 'csv' });
  }
}
```
