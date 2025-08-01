## Embracing ESM-only builds ⚡

This new release is focused around 2 things, we now ship ESM-only builds (in other words, CommonJS builds are fully dropped and only ESM will remain), this move will cut the npm download size by half. The other big change is an internal one which is an organizational one, I'm moving all framework wrappers directly into Slickgrid-Universal (Angular, Aurelia, React and Vue wrappers are now **all** located under the Slickgrid-Universal [frameworks/](https://github.com/ghiscoding/slickgrid-universal/tree/master/frameworks/) folder). This change will help tremendously with the project maintenance (any new PR will now run against all frameworks all at once (catching bugs early), publishing a new version is now a single click execution for all frameworks all at once, and finally having a single codebase to test & troubleshoot all wrappers, etc... will be so much easier to handle). With this new structure change, Slickgrid-Universal name now makes so much more sense. 🌐

The other great thing about having everything under the same roof/project is that every package will now be released at the same time with the exact same version number across the board. Everything will be released under v9.0 and whenever any new feature/bugfix comes in, then every package will be bumped to v9.1 and so on (no more version discrepancies).

Wait, what happened to version 6 to 8?

I'm skipping versions 6-8 and going straight to v9.0 because some of the wrappers (Angular-Slickgrid, Aurelia-Slickgrid) were already at v8.x and so the next available major version bump for everything was v9.0

#### Major Changes - Quick Summary
- minimum requirements bump
  - Vue v3.5+
  - Node v20+
- upgrade Vanilla-Calendar-Pro to v3 with [flat config](#date-editorfilter-flat-config)
- [`i18next` is now totally optional](#i18next-is-now-optional)
  - requires i18next v25+ (when installed)
- skipping v6-8 and going straight to v9.0
- now using `clipboard` API, used in ExcelCopyBuffer/ContextMenu/CellCopy, which might require end user permissions (an override is available)
- removing Arrow pointer from Custom Tooltip addon (because it was often offset with the cell text)

> **Note:** if you come from an earlier version, please make sure to follow each migrations in their respected order (review previous migration guides)

## Changes

### Removed @deprecated code

1. `colspanCallback` was deprecated and removed, please use the `globalItemMetadataProvider` instead

```diff
gridOptions.value = {
- colspanCallback: this.renderDifferentColspan.bind(this),
+ dataView: {
+   globalItemMetadataProvider: {
+     getRowMetadata: this.renderDifferentColspan.bind(this)
+   }
+ }
}
```

2. `groupingService` from `SlickgridVueInstance` was deprecate and removed, but I would be very surprised if anyone used it. Simply use `headerGroupingService` instead.

```diff
let vueGrid: SlickgridVueInstance;

function vueGridReady(sgv: SlickgridVueInstance) {
  vueGrid = sgv;
-  vueGrid.groupingService.renderPreHeaderRowGroupingTitles();
+  vueGrid.headerGroupingService.renderPreHeaderRowGroupingTitles();
}
```

3. Row Detail changes
- `itemDetail` property is removed, just use `item` (there's no reason to keep duplicate props)
- `parent` property renamed to `parentRef`
- `OnRowBackToViewportRangeArgs` and `OnRowOutOfViewportRangeArgs` were equal, so it was merged into a new `OnRowBackOrOutOfViewportRangeArgs` interface

```diff
gridOptions.value = {
  enableRowDetailView: true,
  // RowDetail and/or RowSpan don't render well with "transform", you should use "top"
  rowTopOffsetRenderType: 'top',
  rowDetailView: {
-   onAsyncResponse: (e, args) => console.log('before toggling row detail', args.itemDetail),
+   onAsyncResponse: (e, args) => console.log('before toggling row detail', args.item),
  },
};

// `parent` renamed as `parentRef`
function callParentMethod(model: any) {
-  this.parent!.someParentFunction(`We just called Parent Method from the Row Detail Child Component on ${model.title}`);
+  this.parentRef!.someParentFunction(`We just called Parent Method from the Row Detail Child Component on ${model.title}`);
}
```

4. Draggable Grouping `setDroppedGroups` to load grid with initial Groups was deprecated and now removed, simply use `initialGroupBy` instead

```diff
gridOptions.value = {
  enableDraggableGrouping: true,
  // frozenColumn: 2,
  draggableGrouping: {
-   setDroppedGroups: () => ['duration', 'cost'],
+   initialGroupBy: ['duration', 'cost'],
  },
};
```

5. for Header Menu, we had 2 similar events `onHeaderMenuHideColumns` and `onHideColumns` that were basically doing the same thing, and so I dropped `onHeaderMenuHideColumns`

```diff
- onHeaderMenuHideColumns
+ onHideColumns
```

### Grid Options

`rowTopOffsetRenderType` default is changing from `'top'` to `'transform'` and the reason is because `transform` is known to have better styling perf,  especially on large dataset, and that is also what Ag-Grid uses by default.

| previous default | new default |
| --------------- | ------------ |
| `rowTopOffsetRenderType: 'top'` | `rowTopOffsetRenderType: 'transform'` |

- if you are using Cypress to get to the row X in the grid, which is what we do ourselves, then you will need to adjust your E2E tests

| Cypress before | Cypress after  |
| -------------- | -------------- |
| `cy.get([style="top: ${GRID_ROW_HEIGHT * 0}px;"])` | `cy.get([style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"])` |
| | OR `cy.get([data-row=0])` |

> Please note that you will have to change the option back to `rowTopOffsetRenderType: 'top'` when using either RowSpan and/or Row Detail features.

## Column Functionalities

### Date Editor/Filter (flat config)
Vanilla-Calendar-Pro was upgraded to v3.0 and their main breaking change was the move to flat config (instead of complex object config) and this mean that if you use any of their options, you'll have to update them to use their new flat options.

The biggest change that you will most probably have to update is the min/max date setting when using the `'today'` shortcut as shown below:

```diff
import { type VanillaCalendarOption } from '@slickgrid-universal/common';

prepareGrid() {
  columnDefinitions.value = [{
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
> for a complete list of option changes, visit the Vanilla-Calendar-Pro [migration](https://github.com/uvarov-frontend/vanilla-calendar-pro/wiki/%5BMigration-from-v2.*.*%5D-New-API-for-all-options-and-actions-in-v3.0.0) page, which details every single options with their new associated option names.

## Grid Functionalities

## Services

The `GridService` has CRUD methods that were sometime returning a single item and other times an array of items, and for that reason we had to rely on code like `onItemAdded.subscribe(item => { const items = Array.isArray(item) ? item : [item] }`. So for that reason, I decided to change the event names to plural and always return an array of items which is a lot more predictable.

- `onItemAdded` renamed to `onItemsAdded`
- `onItemDeleted` renamed to `onItemsDeleted`
- `onItemUpdated` renamed to `onItemsUpdated`
- `onItemUpserted` renamed to `onItemsUpserted`

---

## Future Changes (next major to be expected around Node 20 EOL)
### Code being `@deprecated` (to be removed in the future, but not until another year)
#### You can start using these new properties and options (shown below) in v9.0 and above.

So when I created the project, I used a few TypeScript Enums and I thought that was pretty good, but what I didn't know at the time was that all of these Enums were ending up in the final transpiled JS bundle and that ends up taking space (but `type` do not). So in the next major, I'm planning to remove most of these Enums and replace them with string literal types (`type` instead of `enum` because `type` aren't transpiled and `enum` are). So you should consider using string types as much, and as soon, as possible in all your new grids and eventually make the changes in your older grids. Note that at the moment, these are only tagged as deprecations and they will only be dropped in the future (not now, but still, you should consider making this change in the near future), for example:

```diff
columns = [{
  id: 'age', ...
- type: FieldType.number,
+ type: 'number',
}];
```

> Note that using the string types (ie: `'number'`) instead of `FieldType.number`, ... was already doable for the past couple years, so this is far from being something new.

Below is a list of Enums being deprecated and you should think about migrating sooner than later, or at the minimum use them in your new grids, because they will be removed in the next major release (whenever that happens, but that won't be before another year). Note that the list below is only a summary of these deprecations and replacements (a suggestion is to do a Search on any of these group name prefixes, e.g.: `FieldType.` and start replacing them).

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

##### deprecating `editorOptions` and `filterOptions`, they are being renamed as a more generic `options` names

in order to make it easier to merge and simplify editor/filter options, I'm renaming these props to a single `options` property name which will make them more easily transportable (you will be able to reuse the same `options` for both the editor/filter if you wanted too). You can start using `options` in v9.0 and above (or keep using `editorOptions`, `filterOptions` until v10).

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

Since I have 2 CSS utilities that do exactly the same, I'm dropping `mdi-..px` in favor of `font-..px` since that makes more sense to represent font sizes since it works on any type of elements (not just icons). 

You can do a "Search and Replace" in VSCode via Regular Expressions to replace them all easily (**make sure to use `regex` in VSCode Search & Replace**):

| Search (regex)   | Replace     |
| ---------------- | ----------- |
| `mdi-([0-9]*)px` | `font-$1px` |

For example:
```diff
- <span class="mdi mdi-check mdi-22px"></span> Checkmark Icon
+ <span class="mdi mdi-check font-22px"></span> Checkmark Icon
```