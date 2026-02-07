## Cleaner Code / Smaller Code ⚡

One of the biggest change of this release is to hide columns by using the `hidden` column property (now used by Column Picker, Grid Menu, etc...). Previously we were removing columns from the original columns array and we then called `setColumns()` to update the grid, but this meant that we had to keep references for all visbile and non-visible columns. With this new release we now keep the full columns array at all time and instead we just change column(s) visibility via their `hidden` column properties by using `grid.updateColumnById('id', { hidden: true })` and finally we update the grid via `grid.updateColumns()`. What I'm trying to emphasis is that you should really stop using `grid.setColumns()` in v10+, and if you want to hide some columns when declaring the columns, then just update their `hidden` properties, see more details below...

This release fully aligns Angular-Slickgrid with modern Angular patterns, including Angular 21 support, Standalone Components for simplified setup, and zoneless change detection support which allows you to drop the `zone.js` dependency for improved performance and smaller bundle sizes.

#### Major Changes - Quick Summary
- [`hidden` columns](#hidden-columns)
- [Row Detail (now optional)](#row-detail-now-optional)
- [ngx-translate@v17](#ngx-translate-v17x-now-required)
- [Migrating to Standalone Component](#migrating-to-standalone-component)

> **Note:** if you come from an earlier version, please make sure to follow each migrations in their respected order (review previous migration guides)

### Column Definitions

#### Hidden Columns

_if you're not dynamically hiding columns and you're not using `colspan` or `rowspan` then you won't be impacted by this change._

For years, I had to keep some references in a Shared Service via `shared.allColumns` and `shared.visibleColumns`, for translating locales and that is also being used by Column Picker and Grid Menu to keep track of which columns to hide/show and in which order they were; then later we called `grid.setColumns()` to update the columns in the grid... but that had side effects since SlickGrid never kept the entire column definitions list (until now). However with v10, we simply start using `hidden` property on the column(s) to hide/show some of them, then we are now able to keep the full columns reference at all time. We can translate them more easily and we no longer need to use `grid.setColumns()`, what we'll do instead is to start using `grid.updateColumnById('colId', { hidden: true })`. If you want to get visible columns, you can now simply call `grid.getVisibleColumns()` which behind the scene is simply doing a `columns.filter(c => !c.hidden)`. This new approach does also have side effects for colspan/rowspan, because previously if we were to hide a column then the next column to the right was previously taking over the spannings, but with the new approach if we hide a column then its spannings will now disappear with it (so I had to make code changes to handle that too)... If you want more details, you can see full explanations of the complete change in the [PR #2281](https://github.com/ghiscoding/slickgrid-universal/pull/2281)

##### New Approach with column `hidden` property

| Before | After |
| ------- | ------ |
| `grid.setColumns(visibleCols)` | `grid.updateColumnById('colId', { hidden: true });`  and `grid.updateColumns();` |
| `sharedService.allColumns` | `grid.getColumns()` _... is now including all columns_ |
| `sharedService.visibleColumns` or `grid.getColumns()`| `grid.getVisibleColumns()` |

### Grid Functionalities

_following changes should be transparent to most users, I'm just listing them in case of side effects._

1. Reimplementing `SlickCompositeEditorComponent` modal and migrate from a `<div>` to a `<dialog>` which is native code, it has better accessibility (aria) support and a baseline support showing as "widely available". A fallback to `<div>` is also available in case `<dialog>` doens't work for everybody (e.g. it doesn't work in Salesforce LWC, hence the available fallback)
2. Reimplementing Grid Menu to use CSS flexbox instead of using `calc(100% - 18px)` which wasn't ideal, neither customizable, but the new approach is to simply use CSS flexbox which is a much better approach to properly align everything.

#### Row Detail (now optional)

Since I don't think that Row Detail is being used by everyone, I'm making it an optional plugin (package). This should help decrease build size quite a bit for users who don't require it.

```diff
+ import { AngularSlickRowDetailView } from '@slickgrid-universal/angular-row-detail-plugin';

export class Example {
  defineGrid() {
    this.gridOptions = {
      enableRowDetailView: true,
+     externalResources: [AngularSlickRowDetailView],
      rowDetailView: {
        // ...
      }
    };
  }
}
```

## Changes

### Removed `@deprecated` code

_following changes should be transparent to most users_

1. `applyHtmlCode()` was removed and replaced with `applyHtmlToElement()`
2. Grid Option `throwWhenFrozenNotAllViewable` was removed and replaced with `invalidColumnFreezeWidthCallback`

### Selection Models, keep only `SlickHybridSelectionModel`

1. rename `rowSelectionOptions` to `selectionOptions`
2. drop both `SlickCellSelectionModel`/`SlickRowSelectionModel` and keep only `SlickHybridSelectionModel`
3. drop both `enableHybridSelection`/`enableRowSelection` merge them into a new `enableSelection` grid option

`SlickHybridSelectionModel` was previously introduced in order to merge and allow using both Cell/Row Selections separately and/or in combo on the same grid. It was introduced in v9.x to test it out and after testing it for a few months, it's now safe to drop the older `SlickCellSelectionModel` / `SlickRowSelectionModel` models and keep only the hybrid model. Also, since we now have the Hybrid model and it's now accepting options for different selection models, I think it's better to rename `rowSelectionOptions` to `selectionOptions` since it now makes more sense with the hybrid approach.

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

### External Resources are now auto-enabled

This change does not require any code update from the end user, but it is a change that you should probably be aware of nonetheless. The reason I decided to implement this is because I often forget to enable the associated flag myself and typically if you wanted to load the resource, then it's most probably because you also want it enabled. So for example, if your register `ExcelExportService` then the library will now auto-enable the resource with its associated flag (which in this case is `enableExcelExport:true`)... unless the flag is already is disabled (or enabled) by the user, if so then the assignment will simply be skipped. Also just to be clear, the list of auto-enabled external resources is rather small, it will auto-enable the following resources: ExcelExportService, PdfExportService, TextExportService, CompositeEditorComponent and RowDetailView.

### `ngx-translate` v17.x now required

Because of the Angular v21 upgrade, the user (you) will also need to upgrade [`ngx-translate`](https://ngx-translate.org/) to its latest version 17.x.

```diff
# package.json
"dependencies": {
-   "@ngx-translate/core": "^16.0.4",
-   "@ngx-translate/http-loader": "^16.0.1",
+   "@ngx-translate/core": "^17.0.0",
+   "@ngx-translate/http-loader": "^17.0.0",
}
```

For the complete list of changes, please follow `ngx-translate` migration from their website:
- https://ngx-translate.org/getting-started/migration-guide/

### Angular Zoneless Mode

Starting with v10, Angular-Slickgrid itself now runs in zoneless mode by default. However, your application can still use `zone.js` if you wish and this is entirely at your discretion. For more information about zoneless Angular, see the official Angular documentation: https://angular.dev/guide/zoneless

### Supporting Both Zone.js and Zoneless Users

Angular-Slickgrid now works out-of-the-box in zoneless Angular apps, but still supports applications using `zone.js`:

- If your app uses `zone.js`, you do not need to change anything, manual change detection (e.g., `markForCheck()`, `detectChanges()`) is still not required.
- If your app is zoneless, you do not need to add `zone.js` and should follow the zoneless setup instructions above.
- The library no longer calls `markForCheck()` or `detectChanges()` internally, so UI updates are handled automatically in both modes.
- If you have custom code that relies on manual change detection, review and update it as needed.
- For example, I had to use Signal to ensure UI changes were detected in my OData/GraphQL demos when using the `BackendServiceApi` with a `postProcess` callback and you might need changes when using Pagination as well (in my case I switched to Signals).

> **Tip:** In zoneless Angular, always use signals for any state that should update the UI. For example, if you have a property like `selectedLanguage`, declare it as a signal (`selectedLanguage = signal('en')`) and update it with `selectedLanguage.set('fr')`. In your template, use `selectedLanguage()` to display or bind the value. This ensures UI updates are automatic and you never need manual change detection.

For more details, review the official Angular documentation: https://angular.dev/guide/zoneless

### Migrating to Standalone Component

Angular-Slickgrid is now a Standalone Component and the `AngularSlickgridModule` was dropped, this also requires you to make some small changes in your App `main.ts` and in all your components that use Angular-Slickgrid.

```diff
- import { AngularSlickgridModule } from 'angular-slickgrid';
+ import { AngularSlickgridComponent, GridOption } from 'angular-slickgrid';

// optional global Grid Option
+ const gridOptionConfig: GridOption = {
+   // ...
+   sanitizer: (dirtyHtml) => DOMPurify.sanitize(dirtyHtml, { ADD_ATTR: ['level'], RETURN_TRUSTED_TYPE: true }),
+ };

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
-     AngularSlickgridModule.forRoot({
-       // ...
-       sanitizer: (dirtyHtml) => DOMPurify.sanitize(dirtyHtml, { ADD_ATTR: ['level'], RETURN_TRUSTED_TYPE: true }),
-     })
    ),
+   AngularSlickgridComponent,
+   { provide: 'defaultGridOption', useValue: gridOptionConfig },
    // ...
  ],
});

// ... Component
@Component({
  // ...
- imports: [AngularSlickgridModule],
+ imports: [AngularSlickgridComponent],
})
```

{% hint style="note" %}
**Info** the changes in the next few lines were all mentioned in the previous "Migration Guide v9.0". So, if you have already made these changes then you could skip the section below.
{% endhint %}

### Interfaces / Enums changes

Removing most Enums and replacing them with string literal types (`type` instead of `enum` because again `type` aren't transpiled and `enum` are). Making this change will help decrease the build size by transpiling a lot less code.

```diff
columns = [{
  id: 'age', ...
- type: FieldType.number,
+ type: 'number',
}];
```

Below is a list of Enums that you need to replace with their associated string literals. A suggestion is to do a Search on any of these group name prefixes, e.g.: `FieldType.` and start replacing them

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
|             | `FieldType.dateIso`  | `'dateIso'`          |
| ... | ... | ... |
| `FileType` | `FileType.csv`       | `'csv'`             |
|             | `FileType.xlsx`     | `'xlsx'`            |
| ... | ... | ... |
| `GridStateType`  | `GridStateType.columns` | `'columns'`  |
|             | `GridStateType.filters`      | `'filters'`   |
|             | `GridStateType.sorters`      | `'sorters'`   |
| ... | ... | ... |
| `OperatorType`  | `OperatorType.greaterThan` | `'>'`  or `'GT'` |    See [Operator](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/enums/operator.type.ts) list for all available operators |
|             | `OperatorType.lessThanOrEqual` | `'<='` or `'LE'`  |
|             | `OperatorType.contains`        | `'Contains'` or `'CONTAINS'`  | Operators are written as PascalCase |
|             | `OperatorType.equal`           | `'='` or `'EQ'` |
|             | `OperatorType.rangeExclusive`  | `'RangeExclusive'`  |
| ... | ... | ... |
| `SortDirection`  | `SortDirection.ASC`       | `'ASC'` or `'asc'`  |
|             | `SortDirection.DESC`           | `'DESC'` or `'desc'`  |
| ... | ... | ... |

**Hint** You can use VSCode search & replace, but make sure it's set to Regular Expression pattern

| Search (regex)                      | Replace |
| ------------------------------ | -------- |
| `FieldType\.([a-z_]+)(.*)` | `'$1'$2`      |

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

Wait, are we talking already about version 11 when version 10 just shipped? Thats right, I'm already thinking and planning ahead the next major version, which will be in about a year from now. I can already say that the main focus will be around the use of native [CSS anchor positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_anchor_positioning) to replace JS code for positioning menus, tooltips, etc... which will help decreasing the build size by using fully native code. CSS anchoring has been around in Chrome for a while but is quite recent in Firefox, so for that reason I'm postponing it for next year.

### Code being `@deprecated` (to be removed in the future, 2027-Q1)
#### You can already start using these new options and props (shown below) in v10.0 and above.

Deprecating `ExtensionName` enum which will be replaced by its string literal type, for example:

| Enum Name        | from `enum`                       | to string `type`      |
| ---------------- | --------------------------------- | --------------------- |
| `ExtensionName`  | `ExtensionName.autoTooltip`       | `'autoTooltip'`       |
|                  | `ExtensionName.draggableGrouping` | `'draggableGrouping'` |
|                  | `ExtensionName.rowDetail`         | `'rowDetail'`         |
| ... | ... | ... |

**Hint** You can use VSCode search & replace, but make sure it's set to Regular Expression pattern

| Search (regex)                 | Replace  |
| ------------------------------ | -------- |
| `ExtensionName\.([a-z_]+)(.*)` | `'$1'$2` |

### Potential but Postponed Code Change

Signals are becoming increasingly prevalent in Angular, however Angular-Slickgrid continues to use traditional `@Input`/`@Output` decorators. Users who prefer Signals can still use them by calling signal functions in templates: `[dataset]="dataset()"`.

For a library component, maintaining compatibility with both approaches is pragmatic and may not require a full migration. If we decide to migrate Angular-Slickgrid to use Signals internally, this change would be deferred to version 11 or later.