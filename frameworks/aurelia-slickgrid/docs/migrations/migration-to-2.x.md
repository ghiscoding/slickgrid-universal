### Services
- Aurelia-Slickgrid Services are no longer Singleton and are no longer available as Dependency Injection (DI) anymore, they are instead available in the Aurelia Grid Instance that can be obtained by the `onAureliaGridCreated` Event Emitter (see [below](/ghiscoding/aurelia-slickgrid/wiki/Migration-to-2.x#onaureliagridcreated-instance))
   - **this is the biggest change, so please make sure to review the [code sample below](/ghiscoding/aurelia-slickgrid/wiki/Migration-to-2.x#onaureliagridcreated-instance)**
- Event Dispatch `asg-on-grid-state-service-changed` renamed to `asg-on-grid-state-changed`
- `GridExtraUtil` no longer exist, it was containing only 1 function `getColumnDefinitionAndData()` that got moved into the `GridService` and renamed to `getColumnFromEventArguments`

### Slick Grid & DataView objects
The Event Aggregator `onGridCreated` and `onDataviewCreated` still exists but it is now much easier to get the Slick Grid & DataView objects directly from the new Aurelia Grid Instance Event Dispatch (it's an all in 1 emitter that includes Slick objects and Aurelia-Slickgrid Services)
- see [below](/ghiscoding/aurelia-slickgrid/wiki/Migration-to-2.x#onaureliagridcreated-instance)

### Column Definitions
- Column Definition `onCellClick` and `onCellChange` signature changed to be more in line with SlickGrid subscribed events and also to provide a way to stop event bubbling if user need that
   - both functions now have 2 arguments e.g.: `onCellChange?: (e: Event, args: OnEventArgs) => void;`, see full example [below](/ghiscoding/aurelia-slickgrid/wiki/Migration-to-2.x#column-definition-events)

### Grid Options
- For consistencies, all **Grid Menu** and **Header Menu** `showX` flags were renamed to `hideX` to align with some of the SlickGrid `hideX` (see [below](/ghiscoding/aurelia-slickgrid/wiki/Migration-to-2.x#grid-menu-showx-renamed-to-hidex))
- `exportWithFormatter` is no longer available directly in the Grid Options, it is now under `exportOptions` Grid Options (see [below](/ghiscoding/aurelia-slickgrid/wiki/Migration-to-2.x#exportwithformatter-flag))
- `i18n` is now a Grid Options which is easier to deal with instead of using the generic `params` (see [below](/ghiscoding/aurelia-slickgrid/wiki/Migration-to-2.x#i18n-now-directly-in-grid-options))


### Editors
- all the Editors options were previously passed through the generic `params` property. However this was removing the benefit of intellisense (VScode) and TypeScript Type checking. We moved all of these options into the `editor` that is now a complex object
- the Grid Option `editor` is now a complex object with the same structure as the `filter` Grid Option. This also mean that all the arguments that were previously passed to the generic `params` are now passed in the `editor` with `model` property
   - this also brings TypeScript types and intellisense to `collection`, `collectionFilterBy` and `collectionSortBy`
- Custom Editor is now also supported
- see code change [below](/ghiscoding/aurelia-slickgrid/wiki/Migration-to-2.x#editor-new-structure)


### Filters
- Select Filter (`FilterType.select`) with `selectOptions` got renamed to `collection`
- `searchTerm` was dropped in favor of **only** `searchTerms` to remove duplicate logic code.
- `FilterType` got removed and you can now use directly `Filters`, also to emphasis the change we renamed the `filter` property `type` to `model`
- see example [below](/ghiscoding/aurelia-slickgrid/wiki/Migration-to-2.x#filter-new-structure)

### Backend Service API
- For `BackendServiceApi`, the `service` property now as to contain a `new` instance of the Backend Service that you want to use (`GraphqlService` or `GridOdataService`). See explanation [below](/ghiscoding/aurelia-slickgrid/wiki/Migration-to-2.x#backend-service-api---service-with-new)
- All 3 `onX` service methods were renamed to `processOnX` to remove confusion with `onX` Event Emitters with the same names. (see [below](/ghiscoding/aurelia-slickgrid/wiki/Migration-to-2.x#backend-service-onx-methods-renamed-to-processonx))
   - this will probably **not** concern you, unless you built your own custom Backend Service API
- `BackendService` method `initOptions` got removed and replaced by `init` which has a different argument signature

### @deprecated code removed
- removed `onBackendEventApi` which was replaced by `backendServiceApi`
- removed Select Filter `selectOptions`, replaced by `collection`
- removed `FormElementType` which was replaced by `FilterType`
- removed `initOptions` function from `backendServiceApi`, which was replaced by `init` with a different signature
- remove `GridExtraUtil` Service

# Code Refactoring Samples & Other Explanations
### `onAureliaGridCreated` instance
This new instance will contain all the Aurelia-Slickgrid Services (that were previously available as DI). As you can see below, you simply need to remove all DI and get a reference of the service you want through the `AureliaGridInstance`

##### `AureliaGridInstance` interface
**Note:**
- `GridExtraService` is now exported as `GridService`
- `GroupingAndColspanService` is now exported as `GroupingService`
- `ControlAndPluginService` is now exported as `PluginService`

```typescript
export interface AureliaGridInstance {
  backendService?: BackendService;
  pluginService: ControlAndPluginService;
  exportService: ExportService;
  filterService: FilterService;
  gridService: GridService;
  gridEventService: GridEventService;
  gridStateService: GridStateService;
  groupingService: GroupingAndColspanService;
  resizerService: ResizerService;
  sortService: SortService;
}
```

##### code change
###### View
```diff
<aurelia-slickgrid gridId="grid"
        columnDefinitions.bind="columnDefinitions"
        gridOptions.bind="gridOptions"
        dataset.bind="dataset"
+        asg-on-aurelia-grid-greated="aureliaGridReady($event)">
</aurelia-slickgrid>
```

###### ViewModel
```diff
export class MyGridDemo implements OnInit {
+  aureliaGrid: AureliaGridInstance;
  columnDefinitions: Column[];
  gridOptions: GridOption;
  dataset: any[];

- constructor(private GridExtraService) {}

+  aureliaGridReady(aureliaGrid: AureliaGridInstance) {
+    this.aureliaGrid= aureliaGrid;
+  }

  addNewItem() {
    const newItem = {
      id: newId,
      title: 'Task ' + newId,
      effortDriven: true,
      // ...
    };
-    this.gridExtraService.addItemToDatagrid(newItem);
+    this.aureliaGrid.gridService.addItemToDatagrid(newItem);
  }

```

### Backend Service API - service with `new`
```diff
export class MyGrid {
-  constructor(private graphqlService: GraphqlService, private i18n: I18N) {
+  constructor(private i18n: I18N) {
  }
    this.gridOptions = {
      backendServiceApi: {
-        service: this.graphqlService,
+        service: new GraphqlService(),
        preProcess: () => this.displaySpinner(true),
        process: (query) => this.getCustomerApiCall(query),
        postProcess: (result: GraphqlResult) => this.displaySpinner(false)
      },
      params: {
        i18: this.translate
      }
    };
```

### `exportWithFormatter` flag
Previously available directly in the grid options but is now accessible **only** from the `exportOptions` property. Also worth to know that the `exportOptions` contains much more options, you can see the `exportOptions` interface [here](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/interfaces/excelExportOption.interface.ts).

```diff
this.gridOptions = {
-  exportWithFormatter: true
  exportOptions: {
+    exportWithFormatter: false,
  }
};
```

### `i18n` now directly in Grid Options
```diff
this.gridOptions = {
  enableTranslate: true,
-  params: {
-    i18n: this.translate
-  },
+  i18n: this.translate,
};
```

### `editor` new structure
```diff
import { Column, Editors, GridOption } from 'aurelia-slickgrid';

this.columnDefinitions = [
  {
    id: 'title', name: 'Title', field: 'title',
    type: FieldType.string,
-    editor: Editors.longText,
+    editor: {
+      model: Editors.longText
+    },
  },
  {
    id: 'title2', name: 'Title, Custom Editor', field: 'title',
    type: FieldType.string,
+    editor: {
      // new CUSTOM EDITOR added
+     model: CustomInputEditor  // no need to instantiate it
+    },
  },
  {
    id: 'prerequisites', name: 'Prerequisites', field: 'prerequisites',
    type: FieldType.string,
-    editor: Editors.multipleSelect,
+    editor: {
+      model: Editors.multipleSelect,
+      collection: Array.from(Array(12).keys()).map(k => ({ value: `Task ${k}`, label: `Task ${k}` })),
+      collectionSortBy: {
+        property: 'label',
+        sortDesc: true
+      },
+      collectionFilterBy: {
+        property: 'label',
+        value: 'Task 2'
+      }
+    },
-    params: {
-      collection: Array.from(Array(12).keys()).map(k => ({ value: `Task ${k}`, label: `Task ${k}` })),
-      collectionSortBy: {
-        property: 'label',
-        sortDesc: true
-      },
-      collectionFilterBy: {
-        property: 'label',
-        value: 'Task 2'
-      }
-    }
  }
];
```

### `filter` new structure
- `selectOptions` renamed to `collection`
- `FilterType` replaced by `Filters`
- `type` renamed to `model`
- `searchTerm` removed in favor of an array of `searchTerms`
- Custom Filter is now much simpler, just pass a new instance of your class

```diff
- import { Column, FilterType } from 'aurelia-slickgrid';
+ import { Column, Filters } from 'aurelia-slickgrid';

// column definitions
this.columnDefinitions = [
  {
     id: 'isActive', name: 'Is Active', field: 'isActive',
     type: FieldType.boolean,
     filterable: true,
     filter: {
-       selectOptions: [ { value: '', label: '' }, { value: true, label: 'true' }, { value: false, label: 'false' } ],
+       collection: [ { value: '', label: '' }, { value: true, label: 'true' }, { value: false, label: 'false' } ],
-       type: FilterType.multipleSelect,
+       model: Filters.multipleSelect,
       searchTerms: [], // default selection
     }
  },
  {
     id: 'description', name: 'Description', field: 'description',
     filter: {
-       type: FilterType.custom,
-       customFilter: CustomInputFilter
+       model: CustomInputFilter // create a new instance to make each Filter independent from each other
     }
   },
   {
     id: 'isActive', name: 'Is Active', field: 'isActive',
     type: FieldType.boolean,
     filterable: true,
     filter: {
       collection: [ { value: '', label: '' }, { value: true, label: 'true' }, { value: false, label: 'false' } ],
       type: FilterType.multipleSelect,
-       searchTerm: true, // default selection
+       searchTerms: [true], // default selection
     }
   }
];
```

### Column Definition Events
`onCellChange` and `onCellClick` now expose Event as the 1st argument to be in line with SlickGrid subscribed event
```diff
    this.columnDefinitions = [{
      id: 'delete',
      field: 'id',
      formatter: Formatters.deleteIcon,
-      onCellClick: (args: OnEventArgs) => {
+      onCellClick: (e: Event, args: OnEventArgs) => {
        alert(`Deleting: ${args.dataContext.title}`);
+        e.stopImmediatePropagation(); // you can stop event bubbling if you wish
      }
    }, {
      id: 'title',
      name: 'Title',
      field: 'title',
-      onCellChange: (args: OnEventArgs) => {
+      onCellChange: (e: Event, args: OnEventArgs) => {
        alert(`Updated Title: ${args.dataContext.title}`);
      }
    }
];
```

### Grid Menu `showX` renamed to `hideX`
Since these flags are now inverse, please do not forget to also inverse your `boolean` value.

Here is the entire list of Grid Menu
  - `showClearAllFiltersCommand` renamed to `hideClearAllFiltersCommand`
  - `showClearAllSortingCommand` renamed to `hideClearAllSortingCommand`
  - `showExportCsvCommand` renamed to `hideExportCsvCommand`
  - `showExportTextDelimitedCommand` renamed to `hideExportTextDelimitedCommand`
  - `showRefreshDatasetCommand` renamed to `hideRefreshDatasetCommand`
  - `showToggleFilterCommand` renamed to `hideToggleFilterCommand`

and here is the list for Header Menu
showColumnHideCommand
  - `showColumnHideCommand` renamed to `hideColumnHideCommand`
  - `showSortCommands` renamed to `hideSortCommands`

### Backend Service `onX` methods renamed to `processOnX`
Here is the entire list
   - `onFilterChanged` was renamed to `processOnFilterChanged`
   - `onPaginationChanged` was renamed to `processOnPaginationChanged`
   - `onSortChanged` was renamed to `processOnSortChanged`
