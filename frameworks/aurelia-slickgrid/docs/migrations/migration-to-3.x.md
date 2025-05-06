Before you start, make sure that you don't have any console log warnings (most of the deprecated code from `2.x` were already displaying some console warnings to advise you of what's being removed). So it will be easier to fix the console warnings first, then move on to the list of changes below.

## Biggest Breaking Changes
1. Export to File & Export to Excel are now decoupled and opt-in (see [Export Services](/ghiscoding/aurelia-slickgrid/wiki/Migration-to-3.x#export-services))
   - since both exports are opt-in, they are now also both disabled by default
2. Backend Service APIs are now decoupled and opt-in (see [Backend Service API](/ghiscoding/aurelia-slickgrid/wiki/Migration-to-3.x#backend-service-apis))
3. Remove event name prefixes `asg`, `sg` (in other words `asg-on-aurelia-grid-created` becomes `on-aurelia-grid-created`)
   - You can however put them back, in your grid options, to avoid having to do too many refactoring (see [Grid Events](https://github.com/ghiscoding/aurelia-slickgrid/wiki/Migration-to-3.x#grid-events))
4. Styling (css/sass) main files are now under the `@slickgrid-universal/common` monorepo (see [Stylings](https://github.com/ghiscoding/aurelia-slickgrid/wiki/Migration-to-3.x#stylings))

### @deprecated Code (removed)
_note: most of the deprecated code already sends you console warnings, so check your console first._
- removed all Grid Service methods having the word "toDatagrid" in their names
   - for example, `addItemToDatagrid`, `deleteDataGridItem`, ...
   - simply use the newer methods (named as `addItem`, `deleteItemById`, `updateItem`, ...), which have a lot more features and options.
- removed `registerPlugins` Grid Option since all useful plugins/controls already exist in the lib.
- removed `hideColumn(column)` please use `hideColumnById` or `hideColumnByIds` instead
- removed `hideColumnByIndex(idx)` please use `hideColumnById` or `hideColumnByIds` instead
- removed `BackendServiceOption` property named `columnDefinitions`, this is no longer a valid property which means that you cannot use it anymore with OData/GraphQL. This is no longer necessary since the Services can get the columns definition directly from the grid object.
- removed SASS variables
   - `$large-editor-textarea-height`
   - `$large-editor-textarea-width`

## Changes

### 3rd Party Libs
The 3rd party lib named `multiple-select.js` is no longer included within Aurelia-Slickgrid, it is now a separate npm package named [multiple-select-modified](https://www.npmjs.com/package/multiple-select-modified)

You might have referenced this library in your `main.ts` or `index.html`, you will need to adjust the path to the library
```diff
# main.ts
- import 'aurelia-slickgrid/dist/lib/multiple-select/multiple-select.css';
- import 'aurelia-slickgrid/dist/lib/multiple-select/multiple-select.js';
+ import 'multiple-select-modified/src/multiple-select.css';
+ import 'multiple-select-modified/src/multiple-select.js';
```
or in the View (with RequireJS)
```diff
- <link rel="stylesheet" type="text/css" href="../node_modules/aurelia-slickgrid/dist/lib/multiple-select/multiple-select.css">
+ <link rel="stylesheet" type="text/css" href="../node_modules/multiple-select-modified/src/multiple-select.css">
```

#### Flatpickr Localization (date picker)
If you use multiple locales, you will need to import Flatpickr Locale yourself and **after** Aurelia-Slickgrid is ready in your `main.ts` file with WebPack or in your App template with RequireJS. The reason we now have to do this, is to avoid bundling all the Flatpickr Locales (60+) in your prod build (the previous Aurelia-Slickgrid version was actually doing just that since I found that out recently).

##### with WebPack
```diff
// main.ts
import { Aurelia } from 'aurelia-framework';
import { GridOption } from 'aurelia-slickgrid';

export function configure(aurelia: Aurelia) {
  aurelia.use.plugin(PLATFORM.moduleName('aurelia-slickgrid'), (config: { options: GridOption }) => {
+    // load necessary Flatpickr Locale(s), but make sure it's imported AFTER loading Aurelia-Slickgrid plugin
+    import('flatpickr/dist/l10n/fr');
  });
```

##### with RequireJS
```diff
<template>
  <require from="bootstrap/css/bootstrap.css"></require>
+ <require from="https://npmcdn.com/flatpickr/dist/l10n/fr.js"></require>
</template>
```

### Interfaces
- renamed `CheckboxSelector` interface to `CheckboxSelectorOption`
- renamed `EditorValidatorOutput` interface to `EditorValidationResult`
- renamed `Sorter` interface to `SortComparer`
- renamed `Sorters` to `SortComparers` (often used when using the Grouping feature)

#### Backend Service APIs
Note that the `BackendServiceApi` is no longer exposed in the `AureliaGridInstance`, so if you wish to reference it (for example when you want to use it with an external export button), then create a reference while instantiating it or get it via the grid option `this.gridOptions.backendServiceApi.service`

### Column Definitions
- `headerKey` was replaced by `nameKey` (to align with SlickGrid `name` property when using I18N with translations)

### Aurelia CLI with RequireJS
If you use RequireJS it might not autodetect properly the new Slickgrid-Universal packages (this might be fixed in the future) and so you will need to modify your `aurelia-json` file to properly run.
- Take a look at the config of Aurelia-Slickgrid-Demos with RequireJS [aurelia.json](https://github.com/ghiscoding/aurelia-slickgrid-demos/blob/master/cli-requirejs-demo/aurelia_project/aurelia.json#L99) config file.

### Grid Events
Changed grid events prefixes Aurelia-Slickgrid (`asg`) and SlickGrid (`sg`).
**However** please note that you can always add them back to avoid having to refactor all your grids at once, the main changes are in the global grid options:
```diff
export const GlobalGridOptions: Partial<GridOption> = {
-  defaultAureliaEventPrefix: 'asg',
-  defaultSlickgridEventPrefix: 'sg',
+  defaultAureliaEventPrefix: '',
+  defaultSlickgridEventPrefix: '',
+  eventNamingStyle: EventNamingStyle.kebabCase,
}
```
So if you wish to keep `asg` and `sg` prefixes, then just add them back in your grid options:
```ts
this.gridOptions = {
  defaultAureliaEventPrefix: 'asg',
  defaultSlickgridEventPrefix: 'sg',
  // ...
}
```

#### Event Naming Convention (defaults to kebab case)
You might have notice the `eventNamingStyle` grid option, it is indeed a new option and with it you can change the names of the events following a defined naming convention. The default is kebab case (separated by hyphens) but you could also use the lower case option (which is an acceptable ES6 syntax), if you take that for example that would become:

So the **default is kebab case** event naming:
```ts
<aurelia-slickgrid on-click.delegate="handleOnClick($event.detail)">
```
But if you wish to use all lower case, you can change your grid options with
```diff
this.gridOptions {
+  eventNamingStyle: EventNamingStyle.lowerCase,
}
```
That would result in all lower case names
```diff
<aurelia-slickgrid
-  on-click.delegate="handleOnClick($event.detail)">
+  onclick.delegate="handleOnClick($event.detail)">
```

_Again note that all the documentation is written with event names following the default kebab case format (`on-click`)._

### Grid Options
- Grid Height/Width should now be passed through the Grid Options instead of the View, for example:
```diff
<aurelia-slickgrid grid-id="grid1" column-definitions.bind="columnDefinitions" grid-options.bind="gridOptions" dataset.bind="dataset"
-                   grid-height="225"
-                   grid-width="800">
</aurelia-slickgrid>
```
were moved to the Grid Options in the ViewModel
```diff
this.gridOptions = {
+   gridHeight: 225,
+   gridWidth: 800,
    // ...
};
```

### Header Menu
  - renamed `hideFilterCommands` to singular `hideFilterCommand` since there can only be 1 filter per column

### Stylings
The CSS/SASS Stylings now come from the `@slickgrid-universal/common` monorepo package, you need to adjust your imports
```diff
# with CSS (main.ts)
- import 'aurelia-slickgrid/dist/styles/css/slickgrid-theme-bootstrap.css';
+ import '@slickgrid-universal/common/dist/styles/css/slickgrid-theme-bootstrap.css';

# with SASS
- @import 'aurelia-slickgrid/dist/styles/sass/slickgrid-theme-bootstrap.scss';
+ @import '@slickgrid-universal/common/dist/styles/sass/slickgrid-theme-bootstrap.scss';
```

or with CSS in the `index.html` file
```html
<head>
  <link rel="stylesheet" type="text/css" href="../node_modules/multiple-select-modified/src/multiple-select.css">

  <!-- Slickgrid Bootstrap theme -->
  <link rel="stylesheet" type="text/css"
        href="../node_modules/@slickgrid-universal/common/dist/styles/css/slickgrid-theme-bootstrap.css">
</head>
```

## Services

### Grid Service
- `updateItem()` will no longer highlight the row by default (to get back this behavior add the option `highlightRow: true`)

#### OData Service
The `GridOdataService` is now an opt-in Service and is no longer exposed in the `AureliaGridInstance`, you need create a reference while instantiating it or get it via the grid option `this.gridOptions.backendServiceApi.service`
```diff
- import { GridOdataService, OdataServiceApi, OdataOption } from 'aurelia-slickgrid';
+ import { GridOdataService, OdataServiceApi, OdataOption } from '@slickgrid-universal/odata';

export class MyExample {
  prepareGrid {
    this.columnDefinitions = [ /*...*/ ];
    this.gridOptions = {
      backendServiceApi: {
        service: new GridOdataService(),
        options: { /*...*/ } as OdataServiceApi
    }
  }
}
```

#### GraphQL Service
The `GraphqlService` is now an opt-in Service and is no longer exposed in the `AureliaGridInstance`, you need create a reference while instantiating it or get it via the grid option `this.gridOptions.backendServiceApi.service`
```diff
- import { GraphqlService, GraphqlPaginatedResult, GraphqlServiceApi, } from 'aurelia-slickgrid';
+ import { GraphqlService, GraphqlPaginatedResult, GraphqlServiceApi, } from '@slickgrid-universal/graphql';

export class MyExample {
  prepareGrid {
    this.columnDefinitions = [ /*...*/ ];
    this.gridOptions = {
      backendServiceApi: {
        service: new GraphqlService(),
        options: { /*...*/ } as GraphqlServiceApi
    }
  }
}
```

### Export Services
#### Text File Export Service
Export Service was renamed to `TextExportService` (export extensions are `.txt`, `.csv`) and is now an opt-in Servicem it is also no longer exposed in the `AureliaGridInstance`. You need to use the new `@slickgrid-universal/text-export` packages and register the service(s) in your grid options as shown below.

Also note that Text Export Service grid options changed as well, a few options got deprecated and renamed to have the word "textExport" instead of just "export". Also to be clear, it's deprecated but still exist, this will give you time to refactor your code. Here's the list
- deprecate `exportOptions` and renamed to `textExportOptions`
- deprecate `enableExport` flag and renamed to `enableTextExport`
- the onBefore/onAfter events got renamed as well to `onBeforeExportToTextFile` and `onAfterExportToTextFile`
   - in the View that would equal to `on-before-export-to-text-file` and `on-after-export-to-text-file`

```diff
import { Column, GridOption } from 'aurelia-slickgrid';
+ import { ExcelExportService } from '@slickgrid-universal/excel-export';
+ import { TextExportService } from '@slickgrid-universal/text-export';

export class MyExample {
  prepareGrid {
    this.columnDefinitions = [ /*...*/ ];
    this.gridOptions = {
      enableExcelExport: true,
      excelExportOptions: { sanitizeDataExport: true },
-     enableExport: true,
-     exportOptions: { sanitizeDataExport: true },
+     enableTextExport: true,
+     textExportOptions: { sanitizeDataExport: true },

      // add 2x Export Services (you can add a single or both export services, it should always be an array
+     registerExternalResources: [new ExcelExportService(), new TextExportService()],
    }
  }
}
```

#### Excel Export Service
The `ExcelExportService` is also an opt-in Service and is no longer exposed in the `AureliaGridInstance`, so if you wish to reference it (for example when you want to use it with an external export button), then create a reference while instantiating it (the `excelExportOptions` are the same as before).
```diff
import { Column, GridOption } from 'aurelia-slickgrid';
+ import { ExcelExportService } from '@slickgrid-universal/excel-export';

export class MyExample {
+  excelExportService = new ExcelExportService(); // create a variable ref when you need to access it later

  prepareGrid {
    this.columnDefinitions = [ /*...*/ ];
    this.gridOptions = {
      enableExcelExport: true,
      excelExportOptions: { sanitizeDataExport: true },
+     registerExternalResources: [this.excelExportService],
    }
  }

  exportToExcel() {
-    this.aureliaGrid.excelExportService.exportToExcel({ filename: 'Export', format: FileType.xlsx });
+    this.excelExportService.exportToExcel({ filename: 'export', format: FileType.xlsx });
  }
}
```
