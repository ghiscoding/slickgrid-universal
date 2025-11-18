## Embracing ESM-only builds ⚡

This new release is focused around 2 things, it is now shipping ESM-only builds (in other words, CommonJS builds are fully dropped and only ESM remains), this move will cut the npm download size by half. The other big change is an internal one which is an organizational one, I'm moving all framework wrappers directly into Slickgrid-Universal (Angular, Aurelia, React and Vue wrappers are now **all** located under the Slickgrid-Universal [frameworks/](https://github.com/ghiscoding/slickgrid-universal/tree/master/frameworks/) folder). This change will help tremendously with the project's maintenance (any new PR will now run against all frameworks all at once (catching bugs early), publishing a new version is now a single click execution for all frameworks all at once, and finally having a single codebase to test & troubleshoot all wrappers, etc... will be so much easier to handle). With this new structure change, the Slickgrid-Universal name now makes so much more sense. 🌐

The other great thing about having everything under the same roof/project is that every package will now be released at the same time with the exact same version number across the board. Everything will be released under v9.0 and whenever any new feature/bugfix comes in, then every package will be bumped to v9.1 and so on (no more version discrepancies).

I also decided to align all SlickGrid examples in all frameworks and Angular-Slickgrid turned out to have many example offsets, so just be aware that the example numbering might have changed a little (ie: Row Detail is now Example 19 instead of 21). If the project is useful to you, please give it a ⭐ (on [Slickgrid-Universal](https://github.com/ghiscoding/slickgrid-universal)) and perhaps buy me a coffee [☕ (Ko-Fi)](https://ko-fi.com/ghiscoding), thanks.

#### Major Changes - Quick Summary
- minimum requirements bump
  - Angular v19+
  - Node v20+
- upgrade Vanilla-Calendar-Pro to v3 with [flat config](#date-editorfilter-flat-config)
- [shorter attribute names](#shorter-attribute-names)
- now using `clipboard` API, used in ExcelCopyBuffer/ContextMenu/CellCopy, which might require end user permissions (an override is available for any compatibility issues)
- removing arrow pointer from Custom Tooltip addon (because it was often offset with the cell text)
- Angular-Slickgrid project now moved under [Slickgrid-Universal](https://github.com/ghiscoding/slickgrid-universal/) GitHub project

> **Note:** if you come from an earlier version, please make sure to follow each migration in their respective order (review previous migration guides).

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

2. `groupingService` from `AngularGridInstance` was deprecate and removed, but I would be very surprised if anyone used it. Just use `headerGroupingService` instead.

```diff
function angularGridReady(angularGrid: AngularGridInstance) {
  this.angularGrid = angularGrid;
- angularGrid.groupingService.renderPreHeaderRowGroupingTitles();
+ angularGrid.headerGroupingService.renderPreHeaderRowGroupingTitles();
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
    // RowDetail and/or RowSpan don't render well with "transform", you should use "top"
    rowTopOffsetRenderType: 'top',
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

`rowTopOffsetRenderType` default is changing from `'top'` to `'transform'` and the reason is that `transform` is known to have better styling perf, especially on large datasets, and that is also what Ag-Grid uses by default.

| previous default | new default |
| --------------- | ------------ |
| `rowTopOffsetRenderType: 'top'` | `rowTopOffsetRenderType: 'transform'` |

- if you are using Cypress to get to the row number X in the grid, which is what I do myself, then you will need to adjust your E2E tests

| Cypress before | Cypress after  |
| -------------- | -------------- |
| `cy.get([style="top: ${GRID_ROW_HEIGHT * 0}px;"])` | `cy.get([style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"])` |
| | OR `cy.get([data-row=0])` |

> Please note that you will have to change the grid option back to `rowTopOffsetRenderType: 'top'` when using RowSpan and/or Row Detail features.

### Shorter Attribute Names
We are changing the `columnDefinitions` and `gridOptions` attribute names to much simpler single word names. Basically, I'm not exactly sure why I chose the long name in the past, but going forward, I think it would be much simpler to use single name attributes (which can help slightly with build size)

```diff
<angular-slickgrid gridId="grid1"
-  [columnDefinitions]="columnDefinitions"
-  [gridOptions]="gridOptions"
+  [columns]="columnDefinitions"
+  [options]="gridOptions"
></angular-slickgrid>
```

## Column Functionalities

### Date Editor/Filter (flat config)

Vanilla-Calendar-Pro was upgraded to v3.0, and it includes a breaking change in which they migrated their options to flat config (instead of complex object config), and this means that if you use any of their config options, you'll have to update them to use their new flat config structure and naming.

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
> for a complete list of option changes, visit the Vanilla-Calendar-Pro [migration](https://github.com/uvarov-frontend/vanilla-calendar-pro/wiki/%5BMigration-from-v2.*.*%5D-New-API-for-all-options-and-actions-in-v3.0.0) page, which details every single option and new associated option name.

## Grid Functionalities

## Services

The `GridService` has CRUD method events that were sometime returning a single item and other times an array of items, and so for that reason we had to rely on auto-detection code like `onItemAdded.subscribe(item => { const items = Array.isArray(item) ? item : [item] }`. To fix this, I decided to change all the event names to plural and always return an array of items which is a lot more predictable.

- `onItemAdded` renamed to `onItemsAdded`
- `onItemDeleted` renamed to `onItemsDeleted`
- `onItemUpdated` renamed to `onItemsUpdated`
- `onItemUpserted` renamed to `onItemsUpserted`

---

## Future Changes (next major to be expected around Node 20 EOL)
### Code being `@deprecated` (to be removed in the future, 2026-Q1)
#### You can already start using these new options and props (shown below) in v9.0 and above.

When I created the project, I started using a few TypeScript Enums and I thought that was pretty nice, but little did I know that all of these Enums were ending up in the final transpiled JS bundle which ends up taking extra space (but `type` do not). So in the next major, I'm planning to remove most of these Enums and replace them with string literal types (`type` instead of `enum` because again `type` aren't transpiled and `enum` are). So you should consider using string types as much, and as soon, as possible in all of your new grids and eventually make the changes in your older grids. At the moment, these are all tagged as deprecations and they will only be dropped in the future (not now, but still, you should consider making this change sooner rather than later), for example:

```diff
columns = [{
  id: 'age', ...
- type: FieldType.number,
+ type: 'number',
}];
```

> Note that using the string types (e.g.: `'number'`) instead of `FieldType.number`, ... which was already doable for the past couple years, so this is far from being something new.

Below is a list of Enums being deprecated and you should think about migrating them sooner than later, or at the minimum use them in your new grids, because they will be removed in the next major release (whenever that happens, probably next year). Please note that the list below is only a summary of all deprecations and replacements (a suggestion is to do a Search on any of these group name prefixes, e.g.: `FieldType.` and start replacing them).

| Enum Name   | from `enum`         | to string `type`    | Note |
| ----------- | ------------------- | ------------------- | ---- |
| `FieldType`  | `FieldType.boolean` | `'boolean'`         |
|             | `FieldType.number`   | `'number'`          |
|             | `FieldType.dateIso`   | `'dateIso'`          |
| - | - | - |
| `FileType` | `FileType.csv`      | `'csv'`             |
|             | `FileType.xlsx`     | `'xlsx'`            |
| - | - | - |
| `GridStateType`  | `GridStateType.columns` | `'columns'`  |
|             | `GridStateType.filters`   | `'filters'`   |
|             | `GridStateType.sorters`   | `'sorters'`   |
| - | - | - |
| `Operator`  | `Operator.greaterThan` | `'>'`  |    See [Operator](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/enums/operatorString.type.ts) list for all available operators |
|             | `Operator.lessThanOrEqual`   | `'<='`   |
|             | `Operator.contains`   | `'Contains'` or `'CONTAINS'`  | Operators are written as PascalCase |
|             | `Operator.equal`   | `'EQ'`  |
|             | `Operator.rangeExclusive`   | `'RangeExclusive'`  |
| - | - | - |
| `SortDirection`  | `SortDirection.ASC` | `'ASC'` or `'asc'`  |
|             | `SortDirection.DESC`   | `'DESC'` or `'desc'`  |
| - | - | - |

##### deprecating `editorOptions` and `filterOptions`, they are being renamed as a more generic `options` name

So, in order to make it easier to merge and simplify Editor/Filter options, I'm renaming the props to a single `options` property name which will make them more easily transportable (you will be able to reuse the same `options` for both the editor/filter if you wanted too). You can start using `options` in v9.0 and above (or keep using `editorOptions`, `filterOptions` until v10).

```diff
import { type MultipleSelectOption } from '@slickgrid-universal/common';

columnDefinitions = [{
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

// or reuse the same `options`
+ const msOptions = { maxHeight: 250, useSelectOptionLabelToHtml: true } as MultipleSelectOption;

columnDefinitions = [{
  id: 'duration', field: 'duration', name: 'Duration',
  editor: {
+   options: msOptions,
  },
  filter: {
+   options: msOptions,
  },
}];
```

##### deprecating `text-color-xyz` and renaming them all to `color-xyz`

I decided to deprecate all `text-color-...` and renaming them all to `color-...` which is much simpler to type and use. 

You can do a "Search and Replace" in VSCode via Regular Expressions to replace them all easily:

| Search        | Replace  |
| ------------- | -------- |
| `text-color-` | `color-` |

For example:
```diff
- <span class="text-color-primary">Primary Text</span>
+ <span class="color-primary">Primary Text</span>
```

##### deprecating `mdi-[0-9]px` and keeping only `font-[0-9]px`

Since I have 2 CSS utilities that do exactly the same, I'm dropping `mdi-..px` in favor of `font-..px` because it makes more sense to represent font sizes that also work on any type of element (not just icons).

You can do a "Search and Replace" in VSCode via Regular Expressions to replace them all easily (**make sure to use `regex` in VSCode Search & Replace**):

| Search (regex)   | Replace     |
| ---------------- | ----------- |
| `mdi-([0-9]*)px` | `font-$1px` |

For example:
```diff
- <span class="mdi mdi-check mdi-22px"></span> Checkmark Icon
+ <span class="mdi mdi-check font-22px"></span> Checkmark Icon
```