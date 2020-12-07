[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)
[![npm](https://img.shields.io/npm/v/@slickgrid-universal/text-export.svg?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/text-export)
[![npm](https://img.shields.io/npm/dy/@slickgrid-universal/text-export?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/text-export)

[![CircleCI](https://circleci.com/gh/ghiscoding/slickgrid-universal/tree/master.svg?style=shield)](https://circleci.com/gh/ghiscoding/workflows/slickgrid-universal/tree/master)
[![Cypress.io](https://img.shields.io/badge/tested%20with-Cypress-04C38E.svg)](https://www.cypress.io/)
[![jest](https://jestjs.io/img/jest-badge.svg)](https://github.com/facebook/jest)
[![codecov](https://codecov.io/gh/ghiscoding/slickgrid-universal/branch/master/graph/badge.svg)](https://codecov.io/gh/ghiscoding/slickgrid-universal)

## Export Service (text file) 
#### @slickgrid-universal/text-export

Simple Export to File Service that allows to export as CSV or Text, user can also choose which separator to use (comma, colon, semicolon, ...). 

There are a couple of reasons to use this package (instead of the `excel-export`)
- if you want to export to a text file with any type of separator (tab, colon, semicolon, comma)
- if you have a very large dataset, this export consumes a lot less memory compare to the `excel-export`

### Dependencies
This package requires [text-encoding-utf-8](https://www.npmjs.com/package/text-encoding-utf-8) which is use to ensure proper UTF-8 encoding, even emoji will be exported without issues.

### Installation
Follow the instruction provided in the main [README](https://github.com/ghiscoding/slickgrid-universal#installation), you can see a demo by looking at the [GitHub Demo](https://ghiscoding.github.io/slickgrid-universal) page and click on "Export to CSV" from the Grid Menu (aka hamburger menu).

### Usage
In order to use the Service, you will need to register it in your grid options via the `registerExternalServices` as shown below.

##### ViewModel
```ts
import { TextExportService } from '@slickgrid-universal/text-export';

export class MyExample {
  prepareGrid {
    this.gridOptions = {
      enableTextExport: true,
      exportOptions: {
        sanitizeDataExport: true
      },
      registerExternalServices: [new TextExportService()],
    }
  }
}
```

If you wish to reference the service to use it with external export button, then simply create a reference while instantiating it.
```ts
import { TextExportService } from '@slickgrid-universal/text-export';

export class MyExample {
  exportService = new TextExportService();

  prepareGrid {
    this.gridOptions = {
      enableTextExport: true,
      exportOptions: {
        sanitizeDataExport: true
      },
      registerExternalServices: [this.exportService],
    }
  }

  exportToFile() {
    this.exportService.exportToFile({ filename: 'export', format: FileType.csv });
  }
}
```
