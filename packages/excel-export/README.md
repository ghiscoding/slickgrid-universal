[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)
[![npm](https://img.shields.io/npm/v/@slickgrid-universal/excel-export.svg?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/excel-export)
[![npm](https://img.shields.io/npm/dy/@slickgrid-universal/excel-export?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/excel-export)

[![CircleCI](https://circleci.com/gh/ghiscoding/slickgrid-universal/tree/master.svg?style=shield)](https://circleci.com/gh/ghiscoding/workflows/slickgrid-universal/tree/master)
[![Cypress.io](https://img.shields.io/badge/tested%20with-Cypress-04C38E.svg)](https://www.cypress.io/)
[![jest](https://jestjs.io/img/jest-badge.svg)](https://github.com/facebook/jest)
[![codecov](https://codecov.io/gh/ghiscoding/slickgrid-universal/branch/master/graph/badge.svg)](https://codecov.io/gh/ghiscoding/slickgrid-universal)

## Excel Export Service
#### @slickgrid-universal/excel-export

Simple Export to Excel Service that allows to exporting as ".xls" or ".xlsx".

### External Dependencies
This package requires [excel-builder-webpacker](https://www.npmjs.com/package/excel-builder-webpacker) which itself requires [jszip](https://www.npmjs.com/package/jszip) and [lodash](https://www.npmjs.com/package/lodash), the later not being a small lib, so make sure that you are fine with the bundle size. For our use case, the extra bundle size is totally worth the feature.

### Installation
Follow the instruction provided in the main [README](https://github.com/ghiscoding/slickgrid-universal#installation), you can see a demo by looking at the [GitHub Demo](https://ghiscoding.github.io/slickgrid-universal) page and click on "Export to CSV" from the Grid Menu (aka hamburger menu).

### Usage
In order to use the Service, you will need to register it in your grid options via the `registerExternalResources` as shown below.

##### ViewModel
```ts
import { ExcelExportService } from '@slickgrid-universal/excel-export';

export class MyExample {
  prepareGrid {
    this.gridOptions = {
      enableExcelExport: true,
      excelExportOptions: {
        sanitizeDataExport: true
      },
      registerExternalResources: [new ExcelExportService()],
    }
  }
}
```

If you wish to reference the service to use it with external export button, then simply create a reference while instantiating it.
```ts
import { ExcelExportService } from '@slickgrid-universal/excel-export';

export class MyExample {
  excelExportService = new ExcelExportService();

  prepareGrid {
    this.gridOptions = {
      enableExcelExport: true,
      excelExportOptions: {
        sanitizeDataExport: true
      },
      registerExternalResources: [this.excelExportService],
    }
  }

  exportToExcel() {
    this.excelExportService.exportToExcel({ filename: 'export', format: FileType.xlsx });
  }
}
```
