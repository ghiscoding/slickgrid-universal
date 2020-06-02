## Excel Export Service
#### @slickgrid-universal/excel-export

Simple Export to Excel Service that allows to exporting as ".xls" or ".xlsx".

### Dependencies
This package requires [excel-builder-webpacker](https://www.npmjs.com/package/excel-builder-webpacker) which itself requires [jszip](https://www.npmjs.com/package/jszip) and [lodash](https://www.npmjs.com/package/lodash), the later not being a small lib, so make sure you are fine the bundle size. For our use case, the extra bundle size is totally worth the feature.

### Installation
Follow the instruction provided in the main [README](https://github.com/ghiscoding/slickgrid-universal#installation), you can see a demo by looking at the [GitHub Demo](https://ghiscoding.github.io/slickgrid-universal) page and click on "Export to CSV" from the Grid Menu (aka hamburger menu).

### Usage
In order to use the Service, you will need to register it in your grid options via the `registerExternalServices` as shown below.

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
      registerExternalServices: [new ExcelExportService()],
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
      registerExternalServices: [this.excelExportService],
    }
  }

  exportToExcel() {
    this.excelExportService.exportToExcel({ filename: 'export', format: FileType.xlsx });
  }
}
```
