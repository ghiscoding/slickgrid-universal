## Single-viewport Pinning rewrite

SlickGrid v11 replaces the legacy frozen-pane renderer with a single-viewport docking renderer and a single scrollbar. Frozen columns/rows are replaced by the new Pinning feature, and v11 also adds new Sticky columns/rows.

The `frozenColumn`, `frozenRow`, and `frozenBottom` options are removed in favor of the new `pinning` grid option. Pinning applies to individual columns, regardless of their index, instead of a contiguous frozen range. Update your grid options and persisted grid state accordingly.

### Major Changes - Quick Summary

- minimum requirements bump
  - i18next v26+
  - react-i18next v17+
- [Remove SortableJS](#remove-sortablejs)
- [Replace frozen options with `pinning`](#replace-frozen-options-with-pinning)
- [Migrate Grid State and Presets](#grid-state-and-presets)
- [Update single-viewport DOM and CSS selectors](#single-viewport-dom-and-css)
- [Replace menu `hide...` flags with `hideCommands`](#menu-command-visibility)
- [Removed Code](#removed-code)
- [Remove row positioning and Row Detail rendering options](#row-positioning-rowtopoffsetrendertype)
- [Update Row Detail DOM and CSS selectors](#row-detail-dom-and-css-selectors)
- [Context Menu and Cell Menu options removed](#context-menu-and-cell-menu-options-removed)
- [Menu command ordering](#menu-command-ordering)
- [Remove Native API Fallbacks](#remove-native-api-fallbacks)
- [Code Changes](#code-changes)
- [`onBeforeAppendCell` event removed](#onbeforeappendcell-event-removed)
- [Excluded columns are no longer rendered in column lists](#excluded-columns-are-no-longer-rendered-in-column-lists)
- [Import optional package styles separately](#import-optional-package-styles-separately)
- [Row Detail package renamed](#row-detail-package-renamed)
- [New `iconSet` grid option for the Fluent theme](#new-iconset-grid-option-for-the-fluent-theme)
- [Context Menu and Cell Menu options removed](#context-menu-and-cell-menu-options-removed)

> **Note:** If you are upgrading from a version earlier than v10, follow the previous migration guides in order before applying these v11 changes.

> **Important:** v11 does not support the old frozen-pane options or renderer.

v11 also introduces Sticky docking, a separate feature that shares similarities with Pinning. See the [Sticky Docking guide](../grid-functionalities/sticky.md) for its configuration and behavior.

### Remove SortableJS

Column header reordering and draggable grouping now use native drag and drop instead of SortableJS. Remove SortableJS and `@types/sortablejs` from your application dependencies when no other application feature uses them.

### Replace frozen options with `pinning`

Replace `frozenColumn`, `frozenRow`, and `frozenBottom` with the nested `pinning` option. A numeric `frozenColumn` value is an inclusive column boundary; convert frozen rows to explicit indexes or dataset IDs on the matching side.

```diff
const gridOptions: GridOption = {
- frozenColumn: 2,
- frozenRow: 3,
- frozenBottom: false,
+ pinning: {
+   columns: { left: 2 },
+   rows: { top: [0, 1, 2], bottom: [] },
+ },
};
```

For `frozenBottom: true`, map the frozen rows to `pinning.rows.bottom` instead. See the [Pinning guide](../grid-functionalities/pinning.md) for the new option shape and accepted references.

### Column Pinning

Use `Column.pinned` for configured column pins and `Column.pinnable: false` to hide pinning commands for that column. See the [Pinning guide](../grid-functionalities/pinning.md) for the column options.

```ts
const columns: Column[] = [
  { id: 'account', field: 'account', name: 'Account', pinned: 'left', pinnable: false },
  { id: 'amount', field: 'amount', name: 'Amount' },
  { id: 'actions', field: 'actions', name: 'Actions', pinned: 'right' },
];
```

### Grid State and Presets

Update persisted v10 Grid State and Grid Presets that still store `frozenColumn`, `frozenRow`, and `frozenBottom`:

```diff
pinning: {
- frozenColumn: 2,
- frozenRow: 3,
- frozenBottom: true,
+ columns: { left: ['account', 'contact', 'status'], right: [] },
+ rows: { top: [], bottom: ['row-98', 'row-99', 'row-100'] },
}
```

Map the old inclusive column boundary to `columns.left`. Convert each frozen row count to explicit row indexes or dataset IDs under `rows.top` or `rows.bottom`, according to `frozenBottom`. See [Grid State and Presets](../grid-functionalities/grid-state-preset.md) for the v11 state shape.

### Header Menu commands

The two frozen-column validation callbacks are merged into a single `errorCallback` grid option:

```diff
const gridOptions: GridOption = {
- invalidColumnFreezePickerCallback: (msg) => alert(msg),
- invalidColumnFreezeWidthCallback: (msg) => alert(msg),
+ errorCallback: (msg) => alert(msg),
};
```

Rename frozen-column options and custom command settings:

```diff
const gridOptions: GridOption = {
- skipFreezeColumnValidation: true,
- invalidColumnFreezeWidthMessage: '...',
- gridMenu: {
-   hideClearFrozenColumnsCommand: false,
-   iconClearFrozenColumnsCommand: 'mdi mdi-pin-off-outline',
- },
- headerMenu: {
-   hideFreezeColumnsCommand: false,
-   iconFreezeColumns: 'mdi mdi-pin-outline',
-   iconUnfreezeColumns: 'mdi mdi-pin-off-outline',
- },
+ skipPinningValidation: true,
+ invalidColumnPinningWidthMessage: '...',
+ gridMenu: {
+   hideCommands: ['clear-pinning'],
+   iconClearPinningCommand: 'mdi mdi-pin-off-outline',
+ },
+ headerMenu: {
+   iconPinningColumns: 'mdi mdi-pin-outline',
+   iconUnpinningColumns: 'mdi mdi-pin-off-outline',
+ },
};
```

The Pinning command menu is now enabled by default. To hide it, add `'pinning-commands'` to `headerMenu.hideCommands`. See the [Pinning guide](../grid-functionalities/pinning.md#header-menu-commands) for the command details.

#### Translation keys

If you use a Translate Service (e.g. i18n), rename the frozen translation keys in your translation files and add the new pinning keys. If you use custom locales instead (`locales` grid option), apply the same renames with the `TEXT_` prefix (e.g. `TEXT_FREEZE_COLUMNS` becomes `TEXT_PIN_COLUMNS_LEFT`).

| v10 key            | v11 key                                    | Default English text                   |
| ------------------ | ------------------------------------------ | -------------------------------------- |
| `CLEAR_PINNING`    | `CLEAR_ALL_PINNING`                        | Clear all Pinning                      |
| `FREEZE_COLUMNS`   | `PIN_COLUMNS_LEFT` and `PIN_COLUMNS_RIGHT` | Pin Left Through Here / Pin From Here To Right   |
| `UNFREEZE_COLUMNS` | `UNPIN_COLUMNS`                            | Unpin All Columns                      |
| _(new)_            | `PIN_COLUMN`                               | Column Pinning                         |
| _(new)_            | `PIN_LEFT` and `PIN_RIGHT`                 | Pin to Left / Pin to Right                   |
| _(new)_            | `UNPIN_COLUMN`                             | Unpin Column                           |

```diff
{
- "CLEAR_PINNING": "Unfreeze Columns/Rows",
- "FREEZE_COLUMNS": "Freeze Columns",
- "UNFREEZE_COLUMNS": "Unfreeze Columns",
+ "CLEAR_ALL_PINNING": "Clear all Pinning",
+ "PIN_COLUMN": "Column Pinning",
+ "PIN_COLUMNS_LEFT": "Pin Left Through Here",
+ "PIN_COLUMNS_RIGHT": "Pin From Here To Right",
+ "PIN_LEFT": "Pin to Left",
+ "PIN_RIGHT": "Pin to Right",
+ "UNPIN_COLUMN": "Unpin Column",
+ "UNPIN_COLUMNS": "Unpin All Columns",
}
```

The related Grid Menu and Header Menu `commandLabels` options were also renamed (e.g. `clearFrozenColumnsCommand` is now `clearPinningCommand` and `freezeColumnsCommand` is now `pinningColumnsLeftCommand`/`pinningColumnsRightCommand`), see [Command labels and translation keys](../grid-functionalities/pinning.md#command-labels-and-translation-keys) for the full list.

### E2E Tests with Cypress Header Menu selectors

Header Menu commands have changed order in the list. Sort Asc/Desc now appear at the top, followed by
the Pinning Commands root menu (labeled "Column Pinning"). If you use positional selectors to find
Header Menu commands, switch to a text selector as shown below:

```diff
cy.get('.slick-header-menu .slick-menu-command-list')
  .should('be.visible')
- .children('.slick-menu-item:nth-of-type(4)')
- .children('.slick-menu-content')
- .should('contain', 'Sort Descending')
+ .contains('Sort Descending')
  .click();
```

### Single-viewport DOM and CSS

The old pane roots and independent scroll containers are removed. Replace selectors such as
`.slick-pane-left`, `.slick-pane-right`, `.slick-viewport-top`, `.slick-viewport-bottom`,
`.grid-canvas-left`, and `.grid-canvas-right` with the single-viewport selectors documented in the
[Pinning guide](../grid-functionalities/pinning.md).

#### Main DOM class changes

| Replace | With |
| --- | --- |
| `.slick-pane-header` | `.slick-header-root` |
| `.slick-pane-top` | `.slick-content-root` |
| `.slick-pane-left`, `.slick-pane-right`, `.slick-pane-bottom` | No pane equivalents; use the docked row regions below. |
| `.slick-viewport-top`, `.slick-viewport-left` | `.slick-viewport` |
| `.slick-viewport-right`, `.slick-viewport-bottom` | No equivalent. |
| Old scroll-owner selectors | `.slick-horizontal-scroller`, `.slick-vertical-scroller` |
| `.grid-canvas-left`, `.grid-canvas-right` | `.grid-canvas` |
| Split row cells | `.slick-row-docked` with `.slick-pinned-left-cells`, `.slick-scrolling-cells`, and `.slick-pinned-right-cells` |

Use `.slick-docking-horizontal-scroller` when targeting the docking horizontal scroller. Remove
manual pane scroll synchronization and the legacy `-1000px` header offset / `HEADER_WIDTH_SLACK`
workaround.

#### Pinning and docking Sass/CSS variables

| Replace | With |
| --- | --- |
| `$slick-pane-top-border-top` / `--slick-pane-top-border-top` | `$slick-content-border-top` / `--slick-content-border-top` |
| `$slick-frozen-border-bottom` / `--slick-frozen-border-bottom` | `$slick-pinned-border-bottom` / `--slick-pinned-border-bottom` |
| `$slick-frozen-border-right` / `--slick-frozen-border-right` | `$slick-pinned-border-color` / `--slick-pinned-border-color` |
| `$slick-preheader-border-right` / `--slick-preheader-border-right` | `$slick-preheader-border-color` / `--slick-preheader-border-color` |
| Old preheader per-side border variables and `--slick-frozen-overflow-right` | Remove; no replacements. |

## Menu command visibility

Replace the removed per-command `hide...` flags in `gridMenu`, `contextMenu`, and `headerMenu`:

- `true` → add the command ID to `hideCommands`.
- `false` → remove it, built-in commands are shown by default (except for the 2 exceptions below).

**Exceptions (opt-in commands):**

- `hideToggleDarkModeCommand` was inverted and renamed to `gridMenu.showToggleDarkModeCommand` (defaults to `false`), because the Dark Mode toggle is hidden by default.
- `hideExportTextDelimitedCommand` was replaced by `textExportOptions.menuFormats` (defaults to `['csv']`), adding `'txt'` shows the "export-text-delimited" command in both the Grid Menu and Context Menu.

```diff
 gridMenu: {
-  hideToggleDarkModeCommand: false,
-  hideExportCsvCommand: true,
+  showToggleDarkModeCommand: true,
+  hideCommands: ['export-csv'],
 },
```

Since `menuFormats` applies to both menus, use `hideCommands: ['export-text-delimited']` in either menu to keep it hidden there.

**Precedence:** `hideCommands` always takes precedence, even over the 2 exceptions above (e.g. `hideCommands: ['toggle-dark-mode']` wins over `showToggleDarkModeCommand: true`). Feature/resource requirements and `commandListBuilder` behavior are unchanged; visibility is applied before the builder.

**Array replacement:** Supplied `hideCommands` and `textExportOptions.menuFormats` lists now replace inherited/previous lists, including in `grid.setOptions()`, instead of merging by index. Omit a property to preserve its value; use `[]` to clear it.

| Removed option | Command ID to add to `hideCommands` |
| --- | --- |
| `hideClearAllFiltersCommand` | `clear-filter` |
| `hideClearAllSortingCommand` | `clear-sorting` |
| `hideClearPinningCommand` | `clear-pinning` |
| `hideExportCsvCommand` | `export-csv` |
| `hideExportExcelCommand` | `export-excel` |
| `hideExportPdfCommand` | `export-pdf` |
| `hideExportTextDelimitedCommand` | `export-text-delimited` |
| `hideRefreshDatasetCommand` | `refresh-dataset` |
| `hideToggleDarkModeCommand` | `toggle-dark-mode` |
| `hideToggleFilterCommand` | `toggle-filter` |
| `hideTogglePreHeaderCommand` | `toggle-preheader` |
| `hideCopyCellValueCommand` | `copy` |
| `hideClearAllGrouping` | `clear-grouping` |
| `hideCollapseAllGroups` | `collapse-all-groups` |
| `hideExpandAllGroups` | `expand-all-groups` |
| `hideColumnResizeByContentCommand` | `column-resize-by-content` |
| `hideClearFilterCommand` | `clear-filter` |
| `hideClearSortCommand` | `clear-sort` |
| `hideFilterCommand` | `clear-filter` |
| `hideSortCommands` | `sort-commands` (or `sort-asc`, `sort-desc`, `clear-sort` individually) |
| `hideColumnHideCommand` | `hide-column` |

## Removed Code

### DataView CSP options and types removed

DataView filtering and aggregation are always CSP safe and do not use runtime code generation. Remove `inlineFilters` and `useCSPSafeFilter` from `gridOptions.dataView` or options passed directly to `new SlickDataView()`. Both options were deprecated and ignored in v10; no replacement options are needed.

The unused `FilterCspFn` and `FilterWithCspCachingFn` type aliases are also removed. Use `FilterFn<T>` for the item predicate passed to `setFilter()`.

For subclasses of `SlickDataView`, update protected method references:

| Removed method | Replacement |
| --- | --- |
| `compileFilterCSPSafe()` | `filterItems()` |
| `compileFilterWithCachingCSPSafe()` | `filterItemsWithCaching()` |
| `compileAccumulatorLoopCSPSafe()` | `compileAccumulatorLoop()` |

### `ExtensionName` enum replaced by a string literal type

The `ExtensionName` enum, deprecated in v10, is now removed and replaced by its string literal type to decrease the build size. If you already migrated to string literals in v10, no changes are needed for those values.

**Hint** You can use VSCode search & replace, but make sure it's set to Regular Expression search pattern.

| Search (regex)                      | Replace |
| ----------------------------------- | ------- |
| `\bExtensionName\.([A-Za-z_]+)\b` | `'$1'`  |

Below is an abbreviated list of enum values to update; make sure to update them all.

| Enum Name       | from `enum`                   | to string `type`  |
| --------------- | ----------------------------- | ----------------- |
| `ExtensionName` | `ExtensionName.autoTooltip`   | `'autoTooltip'`   |
|                 | `ExtensionName.gridMenu`      | `'gridMenu'`      |
|                 | `ExtensionName.rowDetailView` | `'rowDetailView'` |
| ...             | ...                           | ...               |

Remove unused `ExtensionName` imports after replacing the enum values. If you use `ExtensionName` as a type annotation, keep it as an `import type` instead. The `ExtensionNameTypeString` type is also removed; replace it with `ExtensionName`.

### Row Positioning `rowTopOffsetRenderType`

The `rowTopOffsetRenderType` grid option has been removed. Row Detail and RowSpan previously required `rowTopOffsetRenderType: 'top'`, but all plugins now work with transform-based positioning, which makes this option redundant. For the same reason, the Row Detail `renderMode` option was also removed, and overlay is now the only rendering mode.

```diff
const gridOptions: GridOption = {
- rowTopOffsetRenderType: 'transform',
  rowDetailView: {
-   renderMode: 'overlay',
    // ... other Row Detail options
  },
};
```

Grid row positioning now strictly uses `transform: translateY(25px)` (the legacy approach was `top: 25px`) for better precision and scrolling performance. RowSpan host rows and the rows they cover retain internal `top` positioning so pinned columns remain above overlapping spanning cells; no configuration is required.

### Row Detail DOM and CSS selectors

v11 simplifies the Row Detail DOM by removing redundant containers and CSS classes. Update your custom CSS and DOM selectors accordingly.

```diff
-<div class="slick-row-detail-overlay">
-  <div class="dynamic-cell-detail cellDetailView_1">
-    <div class="detail-container detailViewContainer_1">
-      <div class="innerDetailView_1">
-        <!-- Row Detail content -->
-      </div>
-    </div>
-  </div>
+<div class="slick-row-detail-container row-detail-1">
+  <!-- Row Detail content -->
 </div>
```

### Remove Native API Fallbacks

Previous releases included fallbacks for native APIs blocked by some restricted environments (e.g. Salesforce Locker Service). These fallbacks are no longer needed (e.g. Salesforce LWS is now the default), so the following are removed:

- Clipboard API: drop `clipboardWriteOverride` callback and use native Clipboard API
- queueMicrotask: drop `queueMicrotaskPolyfill` util and use native `queueMicrotask`
- Composite Editor: strictly use `<dialog>` and drop `CompositeEditorOption.domElementType: 'div' | 'dialog'`

### Tree Formatter - remove unrelated CSS class

The Tree Formatter originally used the `.slick-group-toggle` class, which is unrelated to grouping. In version 10 the dedicated `.slick-tree-toggle` class was introduced in order to transition to only the new class name. Starting with version 11, the formatter has been simplified by dropping the redundant `.slick-group-toggle` class, leaving only `.slick-tree-toggle` for tree‑specific styling, update your styling and tests if necessary.

## Code Changes

### `onBeforeAppendCell` event removed

The `onBeforeAppendCell` event and its prop were removed. The event fired for every rendered cell, which slowed down scrolling, and it was already superseded by Formatters. Return the CSS classes from your Formatter with `addClasses` instead:

```diff
- <SlickgridReact onBeforeAppendCell={(e) => handleBeforeAppendCell(e.detail)} />
+ const highValueFormatter: Formatter = (_row, _cell, value) => ({ text: String(value), addClasses: value > 50 ? 'high-value' : '' });
```

### Excluded columns are no longer rendered in column lists

Columns defined with `excludeFromColumnPicker: true` or `excludeFromGridMenu: true` are now omitted from the respective menu's DOM instead of being rendered with the `.hidden` CSS class. **For most users, this change is transparent and requires no action.**

If you use Cypress or Playwright E2E tests, update any selectors or item counts that relied on those hidden entries. Assert that excluded checkboxes do not exist instead of checking that they are hidden. Custom `columnSort` and `columnListBuilder` callbacks also now receive only eligible columns.

### Rename `changeColumnsArrangement()`

```diff
- gridStateService.changeColumnsArrangement(columnPreset, false);
+ gridStateService.applyColumnLayout(columnPreset, false);
```

The method now describes its responsibility more accurately: it applies visibility, order, widths, and dynamic extension columns.

### Import optional package styles separately

In v11, styles for optional packages moved out of the common theme stylesheets so applications don't load CSS for unused features. If you use Composite Editor, Custom Tooltip, or Row Detail, add the package as a direct dependency and import (or `@use`) its stylesheet after the common theme.

{% hint style="warning" %}
**Important:** if you use Composite Editor, Custom Tooltip, or Row Detail, make sure to import its stylesheet, otherwise its styling will be broken.
{% endhint %}

{% hint style="note" %}
This change reduces build size by keeping styles for unused features out of your builds. It also establishes a pattern for upcoming features such as Excel Formulas and Column Formulas: their CSS will ship with their feature packages instead of the base `@slickgrid-universal/common` package, so applications include those styles only when they use the features.
{% endhint %}

With plain CSS, select the stylesheet matching your theme (`default`, `bootstrap`, `fluent`, `material`, or `salesforce`):

```css
@import '@slickgrid-universal/common/dist/styles/css/slickgrid-theme-bootstrap.css';
@import '@slickgrid-universal/composite-editor-component/dist/styles/css/slick-composite-editor-bootstrap.css';
@import '@slickgrid-universal/custom-tooltip-plugin/dist/styles/css/slick-custom-tooltip-bootstrap.css';
@import '@slickgrid-universal/row-detail-plugin/dist/styles/css/slick-row-detail-bootstrap.css';
```

With Sass, load the common theme and the package styles in the same Sass compilation, with the theme
first. This lets package styles use the theme's configured Sass variables:

```scss
@use '@slickgrid-universal/common/dist/styles/sass/slickgrid-theme-bootstrap.scss' with (
  $slick-primary-color: green,
  $slick-editor-modal-container-width: 600px,
  $slick-tooltip-color: #123456
);
@use '@slickgrid-universal/composite-editor-component/dist/styles/sass/slick-composite-editor.scss';
@use '@slickgrid-universal/custom-tooltip-plugin/dist/styles/sass/slick-custom-tooltip.scss';
@use '@slickgrid-universal/row-detail-plugin/dist/styles/sass/slick-row-detail.scss';
```

### Row Detail package renamed

The base Row Detail package was renamed from `@slickgrid-universal/row-detail-view-plugin` to
`@slickgrid-universal/row-detail-plugin`, and its stylesheet entry was shortened from
`slick-row-detail-view` to `slick-row-detail`. Update the dependency, TypeScript imports, and any
stylesheet paths that use the old names. The Angular, Aurelia, React, and Vue adapter package names
(for example, `@slickgrid-universal/angular-row-detail-plugin`) are unchanged. See
[Required Styles for Extra Packages](../styling/styling.md#required-styles-for-extra-packages) for
theme-specific paths and additional details.

### New `iconSet` grid option for the Fluent theme

A new `iconSet` grid option (`'material'` by default, or `'fluent'`) now provides all the default menu icons (Grid Menu, Header Menu, Context Menu, Cell Menu). When using the Fluent theme, you can replace your own Fluent icon mapping with a single option, and any icon that you still define explicitly will keep taking precedence. Sort icons were also changed to up/down arrows rather than sort icons. See [Menu icon sets](../styling/styling.md#menu-icon-sets) for more details.

```diff
gridOptions = {
+ iconSet: 'fluent', // defaults to "material"
- gridMenu: {
-   iconCssClass: 'fi fi-navigation',
-   iconClearAllFiltersCommand: 'fi fi-filter-dismiss',
- },
- headerMenu: {
-   iconSortAscCommand: 'fi fi-sort-arrow-up',
-   iconSortDescCommand: 'fi fi-sort-arrow-down',
- },
};
```

## Context Menu and Cell Menu options removed

The deprecated `optionItems` list and `onOptionSelected` event have been removed. Use `commandItems` with string command identifiers, and handle selections through `onCommand` or each item's `action` callback. This also applies to nested menus.

Replace `MenuOptionItem` and `MenuOptionItemCallbackArgs` with `MenuCommandItem` and `MenuCommandItemCallbackArgs`. The option section settings (`optionTitle`, `optionTitleKey`, `hideOptionSection`, and Context Menu's `optionShownOverColumnIds`) have been removed; use the corresponding command settings. Merge separate option and command lists into one command list, using nested `commandItems` to group related actions. Framework `onOptionSelected` event bindings have also been removed.

```ts
const completedCommands: MenuCommandItem[] = [
  {
    command: 'mark-completed',
    title: 'Mark completed',
    action: (_event, args) => {
      const item = args.dataContext;
      if (item) {
        item.completed = true;
        args.grid.updateRow(args.row!);
      }
    },
  },
];

// Grid options: Context Menu
const contextMenu = { commandItems: completedCommands };

// Column definition: Cell Menu
const cellMenu = { commandItems: completedCommands };
```


## Menu command ordering

The deprecated `positionOrder` property has been removed from all menu items in v11. Header Menu's `filterShortcutsPositionOrder` has also been removed. Use `commandListBuilder` to reorder the final command list, including built-in commands. Cell Menu and nested `commandItems` lists can be ordered directly in their arrays.

For example, move the Grid Menu's CSV export command to the top while retaining its built-in action:

```ts
gridOptions = {
  gridMenu: {
    commandListBuilder: (items) => [
      ...items.filter(item => item !== 'divider' && item.command === 'export-csv'),
      ...items.filter(item => item === 'divider' || item.command !== 'export-csv'),
    ],
  },
};
```

Return items in the desired display order; no automatic numeric sorting is applied afterward. See the [v10 migration guide](migration-to-10.x.md#menu-with-commands-slot-renderer) for the original deprecation.

## Final Note

If the project is useful to you, please give it a star ⭐ on the [Slickgrid-Universal](https://github.com/ghiscoding/slickgrid-universal) umbrella project.
