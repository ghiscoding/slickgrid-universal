## Cleaner Code / Smaller Code ⚡

One of the biggest change in this release is to hide columns by using the `hidden` column property (used by Column Picker, Grid Menu, etc...). Previously we were removing columns from the original columns array and we then called `setColumns()` to update the grid, but this mean that we had to keep references for all columns and visible columns. With this new release we now keep the full columns array at all time and instead we just change column(s) visibility via their `hidden` column properties by using `grid.updateColumnById('id', { hidden: true })` and finally we update the grid via `grid.updateColumns()`. What I'm trying to emphasis is that you should really stop using `grid.setColumns()`, and if you want to hide some columns when declaring the columns, then just update their `hidden` properties, see more details below...

#### Major Changes - Quick Summary
- [`hidden` columns](#hidden-columns)

> **Note:** if you come from an earlier version, please make sure to follow each migrations in their respected order (review previous migration guides)

### Column Definitions

#### Hidden Columns

_if you're not dynamically hiding columns and you're not using `colspan` or `rowspan` then you won't be impacted by this change._

For years, I had to keep some references in a Shared Service and keep both `shared.allColumns` and `shared.visibleColumns`, for translating locales and also used by Column Picker and Grid Menu to keep track of which columns to hide/show and in which order they were; then later we called `grid.setColumns()` to update the columns in the grid... but that had side effects since SlickGrid never kept the entire column definitions list (until now), but if we just start using `hidden` property on the column(s) to hide some of them, then we are now able to keep the full columns reference at all time, we translate them more easily and we no longer need to use `grid.setColumns()`, instead we'll now use `grid.updateColumnById('gender', { hidden: true })`. If you want to get visible columns, you can now simply call `grid.getVisibleColumns()` which behind the scene is simply doing a `columns.filter(c => !c.hidden)`. This new approach does have side effects for colspan/rowspan though, because previously if we were to hide a column then the next column to the right would previously taking over the spannings, but with the new approach if we hide a column then its spannings will now disappear with it... If you want more details, you can see full explanations of the complete change in the [PR #2281](https://github.com/ghiscoding/slickgrid-universal/pull/2281)

##### New Approach with column `hidden` property

| Before | After |
| ------- | ------ |
| `grid.setColumns(visibleCols)` | `grid.updateColumnById('gender', { hidden: true });`  and `grid.updateColumns();` |
| `sharedService.allColumns` | `grid.getColumns()` _... is now including all columns_ |
| `sharedService.visibleColumns` or `grid.getColumns()`| `grid.getVisibleColumns()` |

### Grid Functionalities

_Changes that should be transparent to most users, I'm just listing it in case of side effects._

1. Reimplementing `SlickCompositeEditorComponent` modal and migrate from a `<div>` to a `<dialog>` which is native code, it has better accessibility (aria) support and a baseline support showing as "widely available".
2. Reimplementing Grid Menu to use CSS flexbox instead of using `calc(100% - 18px)` which wasn't ideal neither customizable, we could simply use CSS flexbox which is a much better approach to properly align everything.

## Changes

### Removed `@deprecated` code

1. `applyHtmlCode()` was removed and replaced with `applyHtmlToElement()`
2. Grid Option `throwWhenFrozenNotAllViewable` was removed and replaced with `invalidColumnFreezeWidthCallback`

### Selection Models, keep only `SlickHybridSelectionModel`

1. rename `rowSelectionOptions` to `selectionOptions`
2. drop both `SlickCellSelectionModel`/`SlickRowSelectionModel` and keep only `SlickHybridSelectionModel`
3. drop both `enableHybridSelection`/`enableRowSelection` merge them into a new `enableSelection` grid option

`SlickHybridSelectionModel` was introduced to merge and allow using both Cell/Row Selections separately and/or together in the same grid. It was introduced in v9.x to test it out and it's now safe to drop the older `SlickCellSelectionModel` / `SlickRowSelectionModel` models. Also since we now have the Hybrid model and it's now accepting options for different selection models, I think it's better to rename `rowSelectionOptions` to `selectionOptions` for that reason.

```diff
gridOptions = {
- enableHybridSelection: true,
- enableRowSelection: true,
+  enableSelection: true,

- rowSelectionOptions: {
+ selectionOptions: {
    selectActiveRow: false,

    // type can be: ['cell','row','mixed'] defaults to 'mixed'
+   selectionType: 'mixed',
  }
};
```

### Interfaces / Enums changes

Removing most Enums and replacing them with string literal types (`type` instead of `enum` because again `type` aren't transpiled and `enum` are). Making this change will help decrease the build size by transpiling a lot less code.

```diff
columns = [{
  id: 'age', ...
- type: FieldType.number,
+ type: 'number',
}];
```

Below is a list of Enums being deprecated and you should think about migrating them sooner rather than later, or at the minimum use them in your new grids, because they will be removed in the next major release (whenever that happens, probably next year). Please note that the list below is only a summary of all deprecations and replacements (a suggestion is to do a Search on any of these group name prefixes, e.g.: `FieldType.` and start replacing them).

| Enum Name   | from `enum`         | to string `type`    | Note |
| ----------- | ------------------- | ------------------- | ---- |
| `DelimiterType` | `DelimiterType.comma` | `','` |
|             | `DelimiterType.colon` | `':'` |
|             | `DelimiterType.space` | `' '` |
|  | ... | ... |
| `EventNamingStyle` | `EventNamingStyle.camelCase` | `'camelCase'` |
|             | `EventNamingStyle.kebabCase` | `'kebabCase'` |
|             | `EventNamingStyle.lowerCase` | `'lowerCase'` |
|  | ... | ... |
| `FieldType`  | `FieldType.boolean` | `'boolean'`         |
|             | `FieldType.number`   | `'number'`          |
|             | `FieldType.dateIso`   | `'dateIso'`          |
|  | ... | ... |
| `FileType` | `FileType.csv`      | `'csv'`             |
|             | `FileType.xlsx`     | `'xlsx'`            |
|  | ... | ... |
| `GridStateType`  | `GridStateType.columns` | `'columns'`  |
|             | `GridStateType.filters`   | `'filters'`   |
|             | `GridStateType.sorters`   | `'sorters'`   |
|  | ... | ... |
| `OperatorType`  | `OperatorType.greaterThan` | `'>'`  or `'GT'` |    See [Operator](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/enums/operator.type.ts) list for all available operators |
|             | `OperatorType.lessThanOrEqual`   | `'<='` or `'LE'`  |
|             | `OperatorType.contains`   | `'Contains'` or `'CONTAINS'`  | Operators are written as PascalCase |
|             | `OperatorType.equal`   | `'='` or `'EQ'` |
|             | `OperatorType.rangeExclusive`   | `'RangeExclusive'`  |
|  | ... | ... |
| `SortDirection`  | `SortDirection.ASC` | `'ASC'` or `'asc'`  |
|             | `SortDirection.DESC`   | `'DESC'` or `'desc'`  |
|  | ... | ... |

#### renaming `editorOptions` and `filterOptions` to a more generic `options` property

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

#### renaming all `text-color-xyz` to `color-xyz`

I decided to deprecate all `text-color-...` and renaming them all to `color-...` which is much shorter and easier to use.

You can do a "Search and Replace" in VSCode via Regular Expressions to replace them all easily:

| Search        | Replace  |
| ------------- | -------- |
| `text-color-` | `color-` |

For example:
```diff
- <span class="text-color-primary">Primary Text</span>
+ <span class="color-primary">Primary Text</span>
```

#### renaming all `mdi-[0-9]px` to `font-[0-9]px`

Since I had 2 CSS utilities that do exactly the same, I'm dropping all `mdi-..px` in favor of `font-..px` because it makes more sense to represent font sizes that also work on any type of elements (not just icons).

You can do a "Search and Replace" in VSCode via Regular Expressions to replace them all easily (**make sure to use `regex` in VSCode Search & Replace**):

| Search (regex)   | Replace     |
| ---------------- | ----------- |
| `mdi-([0-9]*)px` | `font-$1px` |

For example:
```diff
- <span class="mdi mdi-check mdi-22px"></span> Checkmark Icon
+ <span class="mdi mdi-check font-22px"></span> Checkmark Icon
```

## What's next?

Wait, are we already talking about the version 11 when version 10 just shipped? That is correct, I'm already thinking about the next major version, which will be in about a year from now. I can already say that the main focus will be around the use of native [CSS anchor positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning) to replace JS code for positioning menus, tooltips, etc... which will help decreasing the build size by using fully native code. CSS anchoring has been around in Chrome for a while but is quite recent in Firefox, so for that reason I'm postponing it for next year.

