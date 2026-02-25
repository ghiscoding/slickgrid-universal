## Simplification and Modernization ⚡

One of the biggest change of this release is to hide columns by using the `hidden` column property (used by Column Picker, Grid Menu, etc...). Previously we were removing columns from the original columns array and then we were typically calling `setColumns()` to update the grid, but this meant that we had to keep references for all visible and non-visible columns. With this new release we now keep the full columns array at all time and instead we just change column(s) visibility via their `hidden` column properties by using `grid.updateColumnById('id', { hidden: true })` and finally we update the grid via `grid.updateColumns()`. Also, what I'm trying to emphasis is that you should really stop using `grid.setColumns()` in v10+, and if you want to hide some columns when declaring the columns, then just update their `hidden` properties, see more details below...

This new release also brings significant improvements to accessibility (a11y), making grids more usable for keyboard and screen reader users out of the box. For example, you can now use Tab/Shift+Tab to focus the Header Menu or Grid Menu, and then navigate menu commands with the arrow keys, making keyboard navigation much more intuitive and accessible.

#### Major Changes - Quick Summary
- [`hidden` columns](#hidden-columns)
- improvements to accessibility (see above)
- [What's next?](#whats-next-...version-11)

> **Note:** if you come from an earlier version, please make sure to follow each migrations in their respective order (review previous migration guides)

### Column Definitions

#### Hidden Columns

_if you're not dynamically hiding columns and you're not using `colspan` or `rowspan` then you won't be impacted by this change._

For years, I had to keep some references in a Shared Service via `shared.allColumns` and `shared.visibleColumns`, mostly for translating locales which was mostly being used by Column Picker and Grid Menu to keep track of which columns to hide/show and in which order they were; then later we called `grid.setColumns()` to update the columns in the grid... but that had side effects since SlickGrid never kept the entire column definitions list (until now). However with v10, we simply start using `hidden` property on the column(s) to hide/show some of them, then we are now able to keep the full columns reference at all time. We can translate them more easily and we no longer need to use `grid.setColumns()`, what we'll do instead is to start using `grid.updateColumnById('colId', { hidden: true })`. If you want to get visible columns, you can now just call `grid.getVisibleColumns()` which behind the scene is simply filtering `columns.filter(c => !c.hidden)`. This new approach does also have new side effects for colspan/rowspan, because previously if we were to hide a column then the column to the right was taking over the spanning, however with the new approach, if we hide a column then its spanning will now disappear with it (so I had to make code changes to handle that too)... If you want more details, you can see full explanations of all changes in the [PR #2281](https://github.com/ghiscoding/slickgrid-universal/pull/2281)

**Summary Note** `grid.getColumns()` now includes hidden columns — code that assumed only visible columns will need updates by filtering with `!col.hidden` or simply switch to `grid.getVisibleColumns()` (see below).

#### New Approach with column `hidden` property

| Before | After |
| ------- | ------ |
| `grid.setColumns(visibleCols)` | `grid.updateColumnById('colId', { hidden: true });`  and `grid.updateColumns();` |
| `sharedService.allColumns` | `grid.getColumns()` _... is now including all columns_ |
| `sharedService.visibleColumns` or `grid.getColumns()`| `grid.getVisibleColumns()` |

## Grid Functionalities

_following changes should be transparent to most users, I'm just listing them in case of side effects._

1. Reimplementing `SlickCompositeEditorComponent` modal and migrating from a `<div>` to a `<dialog>` which is native code, it has better accessibility (aria) support and a baseline support showing as "widely available". A fallback to `<div>` is also available in case `<dialog>` doens't work for everybody (e.g. it doesn't work in Salesforce LWC, hence the available fallback)
2. Reimplementing Grid Menu to use CSS flexbox instead of using `calc(100% - 18px)` to position the button which wasn't ideal, neither customizable, but the new approach is to simply use CSS flexbox which is a much better approach to properly align everything.

## Changes

### Removed `@deprecated` code

_following changes should be transparent to most users_

1. `applyHtmlCode()` was removed and replaced with `applyHtmlToElement()`
2. Grid Option `throwWhenFrozenNotAllViewable` was removed and replaced with `invalidColumnFreezeWidthCallback`

### Selection Models, keeping only `SlickHybridSelectionModel`

1. rename `rowSelectionOptions` to `selectionOptions`
2. drop both `SlickCellSelectionModel`/`SlickRowSelectionModel` and keep only `SlickHybridSelectionModel`
3. drop both `enableHybridSelection`/`enableRowSelection` merge them into a new `enableSelection` grid option

`SlickHybridSelectionModel` was previously introduced in order to merge and allow using both Cell/Row Selections separately and/or in combo on the same grid. It was introduced in v9.x to test it out and after testing it for a few months, it's now safe to drop the older `SlickCellSelectionModel` / `SlickRowSelectionModel` models and keep only the hybrid model (for smaller build & less code to maintain). Also, since we now have the Hybrid model and it's now accepting options for different selection models, I think it's better to rename `rowSelectionOptions` to `selectionOptions` since it now makes more sense with the hybrid approach and you will need to update your code when using Row Selection, see below:

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

## New Features

### Auto-Enabled External Resources

This change does not require any code change from the end user, but it is nonetheless a change to be aware of. The reason I decided to implement this, is that I often forget to enable the resource associated flag and typically if you load the resource then you probably want to use it, hence auto-enabling the resource seems to make sense. For example, if your register `ExcelExportService` then the library will now auto-enable the resource with its associated flag (which in this case is `enableExcelExport:true`)... unless you have already enabled/disabled the flag yourself, then in that case the internal assignment will simply be skipped and yours will prevail. Also just to be clear, the list of auto-enabled external resources is rather small, it will auto-enable the following resources:

- ExcelExportService → `enableExcelExport: true`
- PdfExportService → `enablePdfExport: true`
- TextExportService → `enableTextExport: true`
- CompositeEditorComponent → `enableCompositeEditor: true`
- RowDetailView → `enableRowDetailView: true`

### Menu with Commands (slot renderer)

All menu plugins (Cell Menu, Context Menu, Header Menu and Grid Menu) now have a new `commandListBuilder: (items) => items` which is now allowing you to filter/sort and maybe override built-in commands UI. With this new feature in place, I'm deprecating all `hide...` properties and also `positionOrder` since you can now do that with the builder. You could also use a new `hideCommands` which accepts an array of built-in command names. This will remove a large amount of `hide...` properties (about 30) that keeps increasing anytime a new built-in command gets added (in other words, this will simplify maintenance for both you and me).

These are currently just deprecations in v10.x but it's strongly recommended to start using the new `commandListBuilder` and/or `hideCommands` to move away from the deprecated properties which will be removed in v11.x (next year). For example if we want to hide some built-in commands:

```diff
gridOptions = {
  gridMenu: {
    // @deprecated properties
-   hideExportCsvCommand: true,
-   hideTogglePreHeaderCommand: true,

    // hide via command name(s)
+   hideCommands: ['export-csv', 'toggle-preheader'],

    // or hide via builder
+   commandListBuilder: (cmdItems) => cmdItems.filter(x => x !== 'divider' && x.command !== 'export-csv' && x.command !== 'toggle-preheader')
  }
}
```

There's also a new Renderer similar to Slots but implemented with native code to make it cross-platform compatible. The usage is actually very similar to how you would use a cell Formatter. You can see a new [Example 40](https://ghiscoding.github.io/slickgrid-universal/#/example40) demoing this new feature and also the command builder mentioned above.

### Tooltips Outside the Grid

You can now use the custom tooltip plugin to display tooltips on elements outside the grid (e.g., buttons, dialogs, etc.) by enabling the `observeAllTooltips` option. This allows the plugin to observe elements anywhere in your page that have `title` or `data-slick-tooltip` attributes. See Custom Tooltip [documentation](../grid-functionalities/custom-tooltip.md)

#### Enable Global Tooltip Observation
```ts
this.gridOptions = {
  externalResources: [new SlickCustomTooltip()],
  customTooltip: {
    observeAllTooltips: true, // enable tooltip observation outside the grid
    // observeTooltipContainer: 'body', // <-- you can also define where to observe (defaults to `body`)
  },
};
```

---

{% hint style="note" %}
**Info** the changes in the next few lines were all mentioned in the previous ["Migration Guide v9.0"](migration-to-9.x). So, if you have already made these changes then you could skip the section below **but** scroll down further to read the last section ["What's next? ...version 11?"](#whats-next-...version-11).
{% endhint %}

### Interfaces / Enums changes

Removing most Enums and replacing them with string literal types (use `type` instead of `enum` because again `type` aren't transpiled and `enum` are). Making this change will help decrease the build size by transpiling a lot less code.

```diff
columns = [{
  id: 'age', ...
- type: FieldType.number,
+ type: 'number',
}];
```

Below is a list of Enums that you need to replace with their associated string literals. A suggestion is to do a Search on any of these group name prefixes, e.g.: `FieldType.` and replace them all

**Hint** You can use VSCode search & replace, but make sure it's set to Regular Expression search pattern

| Search (regex)             | Replace  |
| -------------------------- | -------- |
| `FieldType\.([a-z_]+)(.*)` | `'$1'$2` |

Below is an abbreviated list of Enums to update, make sure to update them all

| Enum Name   | from `enum`         | to string `type`    | Note |
| ----------- | ------------------- | ------------------- | ---- |
| `DelimiterType` | `DelimiterType.comma` | `','` |
|             | `DelimiterType.colon` | `':'` |
|             | `DelimiterType.space` | `' '` |
| ... | ... | ... |
| `EventNamingStyle` | `EventNamingStyle.camelCase` | `'camelCase'` |
|             | `EventNamingStyle.kebabCase` | `'kebabCase'` |
|             | `EventNamingStyle.lowerCase` | `'lowerCase'` |
| ... | ... | ... |
| `FieldType`  | `FieldType.boolean` | `'boolean'`         |
|             | `FieldType.number`   | `'number'`          |
|             | `FieldType.dateIso`   | `'dateIso'`          |
| ... | ... | ... |
| `FileType` | `FileType.csv`      | `'csv'`             |
|             | `FileType.xlsx`     | `'xlsx'`            |
| ... | ... | ... |
| `GridStateType`  | `GridStateType.columns` | `'columns'`  |
|             | `GridStateType.filters`   | `'filters'`   |
|             | `GridStateType.sorters`   | `'sorters'`   |
| ... | ... | ... |
| `OperatorType`  | `OperatorType.greaterThan` | `'>'`  or `'GT'` |    See [Operator](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/enums/operator.type.ts) list for all available operators |
|             | `OperatorType.lessThanOrEqual`   | `'<='` or `'LE'`  |
|             | `OperatorType.contains`   | `'Contains'` or `'CONTAINS'`  | Operators are written as PascalCase |
|             | `OperatorType.equal`   | `'='` or `'EQ'` |
|             | `OperatorType.rangeExclusive`   | `'RangeExclusive'`  |
| ... | ... | ... |
| `SortDirection`  | `SortDirection.ASC` | `'ASC'` or `'asc'`  |
|             | `SortDirection.DESC`   | `'DESC'` or `'desc'`  |
| ... | ... | ... |

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

I decided to remove all `text-color-...` and rename them all to `color-...` which is much shorter and easier to use.

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

---

## What's next? ...version 11?

Wait, are you seriously talking about version 11 when version 10 actually just shipped? Thats right, I'm already thinking ahead and planning the next major version, which will be in about a year from now (2027 Q1). I can already say that the main focus will be around the use of native [CSS anchor positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning) to replace JS code for positioning menus, tooltips, etc... which will help decreasing the build size further by using more native code. CSS anchoring has been around for a while in Chrome, but its addition in Firefox(147) is quite recent, so for that reason I'm postponing its usage to next year. There's also the new [Sanitizer API](https://developer.mozilla.org/en-US/docs/Web/API/Sanitizer) that I'm hoping to see more availability by next year.

### Code being `@deprecated` (to be removed in the future, 2027-Q1)
#### You can already start using these new options and props (shown below) in v10.0 and above.

Deprecating `ExtensionName` enum which will be replaced by its string literal type, for example:

**Hint** You can use VSCode search & replace, but make sure it's set to Regular Expression search pattern

| Search (regex)                 | Replace  |
| ------------------------------ | -------- |
| `ExtensionName\.([a-z_]+)(.*)` | `'$1'$2` |

Below is an abbreviated list of Enums to update, make sure to update them all

| Enum Name        | from `enum`                 | to string `type`    |
| ---------------- | --------------------------- | ------------------- |
| `ExtensionName`  | `ExtensionName.autoTooltip` | `'autoTooltip'`     |
|                  | `ExtensionName.gridMenu`    | `'gridMenu'`        |
|                  | `ExtensionName.rowDetail`   | `'rowDetail'`       |
| ... | ... | ... |

Also as mentioned above in the section [Menu with Commands](#menu-with-commands-slot-renderer), all menu `hide...` flags are being deprecated in favor of the new `hideCommands: [...]`, for example:

```diff
gridOptions = {
  gridMenu: {
    // @deprecated properties
-   hideExportCsvCommand: true,
-   hideTogglePreHeaderCommand: true,

    // hide via command name(s)
+   hideCommands: ['export-csv', 'toggle-preheader'],

    // or hide via builder
+   commandListBuilder: (cmdItems) => cmdItems.filter(x => x !== 'divider' && x.command !== 'export-csv' && x.command !== 'toggle-preheader')
  }
}
```