[![npm](https://img.shields.io/npm/v/@slickgrid-universal/file-export.svg?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/file-export)
[![npm](https://img.shields.io/npm/dy/@slickgrid-universal/file-export?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/file-export)

## Export Service (text file) 
#### @slickgrid-universal/file-export

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
import { FileExportService } from '@slickgrid-universal/file-export';

export class MyExample {
  prepareGrid {
    this.gridOptions = {
      enableExport: true,
      exportOptions: {
        sanitizeDataExport: true
      },
      registerExternalServices: [new FileExportService()],
    }
  }
}
```

If you wish to reference the service to use it with external export button, then simply create a reference while instantiating it.
```ts
import { FileExportService } from '@slickgrid-universal/file-export';

export class MyExample {
  exportService = new FileExportService();

  prepareGrid {
    this.gridOptions = {
      enableExport: true,
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
