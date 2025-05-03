[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![lerna--lite](https://img.shields.io/badge/maintained%20with-lerna--lite-e137ff)](https://github.com/ghiscoding/lerna-lite)
[![npm](https://img.shields.io/npm/v/@slickgrid-universal/excel-export.svg)](https://www.npmjs.com/package/@slickgrid-universal/excel-export)
[![npm](https://img.shields.io/npm/dy/@slickgrid-universal/excel-export)](https://www.npmjs.com/package/@slickgrid-universal/excel-export)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/@slickgrid-universal/excel-export?color=success&label=gzip)](https://bundlephobia.com/result?p=@slickgrid-universal/excel-export)

[![Actions Status](https://github.com/ghiscoding/slickgrid-universal/workflows/CI%20Build/badge.svg)](https://github.com/ghiscoding/slickgrid-universal/actions)
[![Cypress.io](https://img.shields.io/badge/tested%20with-Cypress-04C38E.svg)](https://www.cypress.io/)
[![jest](https://jestjs.io/img/jest-badge.svg)](https://github.com/facebook/jest)
[![codecov](https://codecov.io/gh/ghiscoding/slickgrid-universal/branch/master/graph/badge.svg)](https://codecov.io/gh/ghiscoding/slickgrid-universal)

## Excel Export Service
#### @slickgrid-universal/excel-export

Simple Export to Excel Service, which requires [`excel-builder-vanilla`](https://github.com/ghiscoding/excel-builder-vanilla) external dependency, which allows exporting your grid data as `.xls` or `.xlsx` files.

### Internal Dependencies
- [@slickgrid-universal/common](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/common)
- [@slickgrid-universal/utils](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/utils)

### External Dependencies
This package requires [excel-builder-vanilla](https://www.npmjs.com/package/excel-builder-vanilla) which itself also has a single dependency [fflate](https://www.npmjs.com/package/fflate) to compress the data before sending it to the browser.

### Installation
Follow the instruction provided in the main [README](https://github.com/ghiscoding/slickgrid-universal#installation), you can see a demo by looking at the [GitHub Demo](https://ghiscoding.github.io/slickgrid-universal/#/example02) page and click on "Export to Excel" from the Context Menu or the Grid Menu (aka hamburger menu).

You can also use nearly all Excel-Builder-Vanilla options, see their [Excel-Builder-Vanilla - Documentation](https://ghiscoding.gitbook.io/excel-builder-vanilla/) and also take a look at Slickgrid-Universal [Excel Export - Documentation](https://ghiscoding.gitbook.io/slickgrid-universal/grid-functionalities/export-to-excel) on how to use both.

### Usage
In order to use the Service, you will need to register it in your grid options via the `externalResources` as shown below.

##### ViewModel
```ts
import { ExcelExportService } from '@slickgrid-universal/excel-export';

export class MyExample {
  initializeGrid {
    this.gridOptions = {
      enableExcelExport: true,
      // you need to register it as an external resource
      externalResources: [new ExcelExportService()],

      // set any options
      excelExportOptions: {
        sanitizeDataExport: true
      },
    }
  }
}
```

If you wish to reference the service to use it with external export button, then simply create a reference while instantiating it.
```ts
import { ExcelExportService } from '@slickgrid-universal/excel-export';

export class MyExample {
  excelExportService: ExcelExportService;

  constructor() {
    this.excelExportService = new ExcelExportService();
  }

  initializeGrid {
    this.gridOptions = {
      enableExcelExport: true,
      excelExportOptions: {
        sanitizeDataExport: true
      },
      externalResources: [this.excelExportService],
    }
  }

  exportToExcel() {
    this.excelExportService.exportToExcel({ filename: 'export', format: 'xlsx' });
  }
}
```

### CSP (Content Security Policy)
Please note that this Excel Export service is using `fflate` (it compresses the data before sending it to the browser) and for better performance it uses Web Workers and for that reason you might need to adjust your CSP rules. You simply need to add a CSP rule to avoid the error `worker-src 'self' blob:;`

```html
<meta http-equiv="Content-Security-Policy"
  content="default-src 'self'; ...other rules...  worker-src 'self' blob:;" />
```