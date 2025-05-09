## Embracing ESM-only builds ⚡ (WIP)

This new release is focused around 2 things, we now ship ESM-only builds (in other words, CommonJS builds are fully dropped and only ESM will remain), this move will cut the npm download size by half. The other big change is an internal one which is an organizational one, I'm moving all framework wrappers directly into Slickgrid-Universal (Angular, Aurelia, React and Vue wrappers are now all located under the [frameworks/](https://github.com/ghiscoding/slickgrid-universal/tree/master/frameworks/) folder), this will help tremendously with the project maintenance (any new PR will now run against all frameworks all at once (catching bugs early), publishing a new version is becoming a single execution for all frameworks all at once, and finally having a single codebase to test & troubleshoot any wrapper, etc... will be so much easier to handle). Now Slickgrid-Universal name totally makes sense with this new structure change 🌐

The other great thing about having everything under the same roof/project is that every package will be released at the exact same time with the exact same versions across the board. Everything will be released under v9.0 and whenever a new feature/bugfix comes in, then every package will be bumped to v9.1 and so on (no more version discrepancies).

#### Major Changes - Quick Summary
- minimum requirements bump
  - Aurelia 2
  - Node v20+
  - i18next v25+
- upgrade Vanilla-Calendar-Pro to v3 with [flat config](#date-editorfilter-flat-config)
- [shorter attribute names](#shorter-attribute-names)
- now using `clipboard` API, used in ExcelCopyBuffer/ContextMenu/CellCopy, which might requires end user permissions
- removing Arrow pointer from Custom Tooltip addon (because it was often offset with the cell text)

> **Note:** if you come from an earlier version, please make sure to follow each migrations in their respected order (review previous migration guides)

## Changes

### Removed @deprecated code

1. `colspanCallback` was deprecated and removed, please use the `globalItemMetadataProvider` instead

```diff
gridOptions = {
- colspanCallback: this.renderDifferentColspan.bind(this),
+ dataView: {
+   globalItemMetadataProvider: {
+     getRowMetadata: this.renderDifferentColspan.bind(this)
+   }
+ }
}
```

2. `groupingService` from `AureliaGridInstance` was deprecate and removed, but I would be very surprised if anyone used it. Simply use `headerGroupingService` instead.

```diff
function aureliaGridReady(aureliaGrid: AureliaGridInstance) {
  this.aureliaGrid = aureliaGrid;
-  aureliaGrid.groupingService.renderPreHeaderRowGroupingTitles();
+  aureliaGrid.headerGroupingService.renderPreHeaderRowGroupingTitles();
}
```

3. Row Detail changes
- `itemDetail` property is removed, just use `item` (there's no reason to keep duplicate props)
- `parent` property renamed to `parentRef`
- `OnRowBackToViewportRangeArgs` and `OnRowOutOfViewportRangeArgs` were equal, so it was merged into a new `OnRowBackOrOutOfViewportRangeArgs` interface

```diff
export class Component {
  gridOptions = {
    enableRowDetailView: true,
    rowTopOffsetRenderType: 'top', // RowDetail and/or RowSpan don't render well with "transform", you should use "top"
    rowDetailView: {
-     onAsyncResponse: (e, args) => console.log('before toggling row detail', args.itemDetail),
+     onAsyncResponse: (e, args) => console.log('before toggling row detail', args.item),
    },
  };

  // `parent` renamed as `parentRef`
  callParentMethod(model: any) {
-   this.parent!.someParentFunction(`We just called Parent Method from the Row Detail Child Component on ${model.title}`);
+   this.parentRef!.someParentFunction(`We just called Parent Method from the Row Detail Child Component on ${model.title}`);
  }
}
```

4. Draggable Grouping `setDroppedGroups` to load grid with initial Groups was deprecated and now removed, simply use `initialGroupBy` instead

```diff
this.gridOptions = {
  enableDraggableGrouping: true,
  // frozenColumn: 2,
  draggableGrouping: {
-   setDroppedGroups: () => ['duration', 'cost'],
+   initialGroupBy: ['duration', 'cost'],
  },
};
```

5. for Header Menu, we had 2 similar events `onHeaderMenuHideColumns` and `onHideColumns` that were doing the same thing, so `onHeaderMenuHideColumns` was dropped

```diff
- onHeaderMenuHideColumns
+ onHideColumns
```

### Grid Options

`rowTopOffsetRenderType` default is changing from `'top'` to `'transform'` and the reason is because `transform` is known to have better styling perf,  especially on large dataset, and that is also what Ag-Grid uses by default.

| previous default | new default |
| --------------- | ------------ |
| `rowTopOffsetRenderType: 'top'` | `rowTopOffsetRenderType: 'transform'` |

- if you are using Cypress to get the row X in the grid, which is what we do ourselves, then you will need to adjust your tests

| Cypress before | Cypress after  |
| -------------- | -------------- |
| `cy.get([style="top: ${GRID_ROW_HEIGHT * 0}px;"])` | `cy.get([style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"])` |
| | OR `cy.get([data-row=0])` |

> Please note that you will have to change the default to `rowTopOffsetRenderType: 'top'` when using either RowSpan and/or Row Detail features.

### Shorter Attribute Names
We are changing the `columnDefinitions` and `gridOptions` attribute names to much simpler single word names. Basically, I'm not exactly sure why I chose the long name in the past, but going forward, I think it would be much simpler to use single name attributes (which can help slightly with build size)

```diff
<aurelia-slickgrid
  grid-id="grid2"
- column-definitions.bind="columnDefinitions"
- grid-options.bind="gridOptions"
+ columns.bind="columnDefinitions"
+ options.bind="gridOptions"
  dataset.bind="dataset"
></aurelia-slickgrid>
```

## Column Functionalities

### Date Editor/Filter (flat config)
Vanilla-Calendar-Pro was upgraded to v3.0 and the main breaking change is that they migrated to flat config (instead of complex object config) and this mean that if you use any of their option, then you'll have to update them to be flat.

The biggest change that you will most probably have to update is the min/max date setting when using the `'today'` shortcut as shown below:

```diff
import { type VanillaCalendarOption } from '@slickgrid-universal/common';

prepareGrid() {
  this.columnDefinitions = [{
    id: 'finish', field: 'finish', name: 'Finish',
    editor: {
      model: Editors.date,
-      editorOptions: { range: { min: 'today' } } as VanillaCalendarOption,
+      editorOptions: { displayDateMin: 'today' } as VanillaCalendarOption,
    }
  }];
}
```

> [!NOTE]
> for a complete list of option changes, visit the Vanilla-Calendar-Pro [migration](https://github.com/uvarov-frontend/vanilla-calendar-pro/wiki/%5BMigration-from-v2.*.*%5D-New-API-for-all-options-and-actions-in-v3.0.0) page, which details every single options with their new option names.

## Grid Functionalities

## Services

The `GridService` has CRUD methods that were sometime returning a single item and other times an array of items and for that reason we had to rely on code like `onItemAdded.subscribe(item => { const items = Array.isArray(item) ? item : [item] }`. So for that reason, I decided to change the event names to plural and always return an array of items which is a lot more predictable.

- `onItemAdded` renamed to `onItemsAdded`
- `onItemDeleted` renamed to `onItemsDeleted`
- `onItemUpdated` renamed to `onItemsUpdated`
- `onItemUpserted` renamed to `onItemsUpserted`

---

## Future Changes (next major)
### Code being Deprecated (to be removed in the future, not before another year)
#### You can start using new properties and options shown below in v9.0 and above.

So when I created the project, I used a few TypeScript Enums and I though this was great but it turns out that all of these Enums end up in the final transpiled JS bundle. So in the next major, I'm planning to remove most of these Enums and replace them with string literal types (`type` instead of `enum`). So you should consider using string types as much and as soon as possible in all your new grids. Note that at the moment, they are only deprecations, and will only be dropped in the future (not now, but you should still consider this for the future), for example:

```diff
columns = [{
  id: 'age', ...
- type: FieldType.number,
+ type: 'number',
}];
```
> Note that migrating from `FieldType` to string types was already doable for the past couple years, so this one is far from new.

Below are a list of Enums being deprecated and you should think about migrating them eventually because they will be removed in the next major release (whenever that happens, but that won't be before another year). Note that the list below are only a summary of these deprecations and replacements.

| Enum Name   | from `enum`         | to string `type`    | Note |
| ----------- | ------------------- | ------------------- | ---- |
| `FileType`  | `FieldType.boolean` | `'boolean'`         |
|             | `FileType.number`   | `'number'`          |
| - | - | - |
| `FieldType` | `FileType.csv`      | `'csv'`             |
|             | `FileType.xlsx`     | `'xlsx'`            |
| - | - | - |
| `GridStateType`  | `GridStateType.columns` | `'columns'`  |
|             | `GridStateType.filters`   | `'filters'`   |
|             | `GridStateType.sorters`   | `'sorters'`   |
| - | - | - |
| `Operator`  | `Operator.greaterThan` | `'>'`  |    See [Operator](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/enums/operatorString.type.ts) list for all available opeators |
|             | `Operator.lessThanOrEqual`   | `'<='`   |
|             | `Operator.contains`   | `'Contains'` or `'CONTAINS'`  | Operators are written as PascalCase |
|             | `Operator.equal`   | `'EQ'`  |
|             | `Operator.rangeExclusive`   | `'RangeExclusive'`  |
| - | - | - |
| `SortDirection`  | `SortDirection.ASC` | `'ASC'` or `'asc'`  |
|             | `SortDirection.DESC`   | `'DESC'` or `'desc'`  |
| - | - | - |

##### deprecating `editorOptions` and `filterOptions`, they are being renamed as `options`

in order to make it easier to merge and simplify editor/filter options, I'm merging them into a single `options` property which will make it more easily transportable (you will be able to reuse the same `options` for both the editor/filter if need be). You can start using `options` in v9.0 and above.

```diff
import { type MultipleSelectOption } from '@slickgrid-universal/common';

this.columnDefinitions = [{
  id: 'duration', field: 'duration', name: 'Duration',
  editor: {
-   editorOptions: {
+   options: {
      maxHeight: 250, useSelectOptionLabelToHtml: true,
    } as MultipleSelectOption,
  },
  filter: {
-   filterOptions: {
+   options: {
      maxHeight: 250, useSelectOptionLabelToHtml: true,
    } as MultipleSelectOption,
  }
}];
```