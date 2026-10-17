## Single-viewport pinning rewrite

SlickGrid v11 replaces the legacy frozen-pane renderer with a single-viewport docking renderer and single-scrollbar. Frozen columns/rows is being replaced by a new Pinnning feature and as a bonus we also have a new Sticky columns/rows.

The old `frozenColumn`, `frozenRow`, and `frozenBottom` options are no longer valid and users have to migrate to the new `pinning` grid option. The new Pinning feature allows you to pin any single column, the column index no longer matters and it's no longer a frozen range but is rather individual pinning (hence the new name). Update your grid options, persisted grid state.

#### Major Changes - Quick Summary

- [Remove SortableJS](#remove-sortablejs)
- [Replace frozen options with `pinning`](#replace-frozen-options-with-pinning)
- [Migrate Grid State and Presets](#grid-state-and-presets)
- [Import optional package styles separately](#import-optional-package-styles-separately)
- [Remove row positioning and Row Detail rendering options](#row-positioning-rowtopoffsetrendertype)
- [Removed Deprecated Code](#removed-deprecated-code)
- [Code Changes](#code-changes)

> **Note:** If you are upgrading from a version earlier than v10, follow the previous migration guides in order before applying these v11 changes.

> **Important:** v11 intentionally does not provide a compatibility layer for the old full-height frozen panes. The migration is a configuration and DOM contract change, not only a visual update.

Also note that we also have a new Sticky docking that was also introduced in v11, it shares similarities with Pinning, but it is an entirely new feature. See the [Sticky Docking guide](../grid-functionalities/sticky.md) for its configuration and behavior.

### Remove SortableJS

Column header reordering and draggable grouping now use native drag and drop instead of SortableJS.
Remove SortableJS and `@types/sortablejs` from your application dependencies when no other
application feature uses them. Applications using script tags can also remove their SortableJS
include.

Column reordering supports RTL and stays within the dragged column's header region. Hidden and
non-reorderable columns keep their positions, including in grids with draggable grouping.

For custom integrations, `SlickDraggableGrouping.setupColumnReorder()` now returns
`{ columnReorderDragInstance }`, whose `destroy()` method removes the native drag listeners.
The SortableJS instance getters and `destroySortableInstances()` are replaced by
`destroyColumnReorderDrag()`.

The exported `setupColumnReorderDrag()` helper accepts `headers: HTMLElement[]` and an optional
`canAutoScroll(draggedEl)` callback. Its `onDragEnd(reorderedIds, originalIds)` callback provides
both DOM orders; pass them to `reconcileColumnOrder(columns, reorderedIds, originalIds)` to keep
columns in the slots they occupied when the drag started.

### Replace frozen options with `pinning`

The old options configured a single contiguous left boundary to freeze columns and/or top (or bottom) rows. The new usage is to typically provide an array of columns indexes to pin, but you can define a single integer to define a range (which is similar to the legacy frozen options), this mean that `frozenColumn: 2` will migrate to `columns: { left: [0, 1, 2] }`, or just keep the shorthand boundary as `columns: { left: 2 }` (an integer is interpreted as "pin columns from index 0 to x").

The new Pinning feature is a lot more flexible, it now allows the user to pin all sides (left/right/top/bottom) in the same grid (which wasn't possible before) and also allows you to pin individual columns or rows and even allow you to skip some columns if you wish (e.g. `columns: { left: [0, 2, 4] }`).

```diff
const gridOptions: GridOption = {
- frozenColumn: 2,
- frozenRow: 3,
- frozenBottom: false,
+ pinning: {
+   columns: {
+     left: 2, // using an integer means "from column 0 to 2"
+     // OR the equivalent array assignment
+     left: [0, 1, 2],
+     right: 1,
+   },
+   rows: {
+     top: [0, 1, 2],
+     bottom: [],
+   },
+ },
};
```

For non-contiguous pinning, use stable column ids or indexes and row indexes or dataset ids. For runtime changes, update the nested option or use `GridService.setPinning()` and
`GridService.clearPinning()`.

See the [Pinning guide](../grid-functionalities/pinning.md) for reference semantics, validation,
Header Menu commands, and runtime APIs.

### Column pinning

Per-column permanent pinning moves from the old frozen-column behavior to `Column.pinned`.
`Column.pinnable: false` replaces the old per-column lock behavior for the built-in Header Menu.
Saved Grid State and presets store all permanent pinning under `pinning`, separately from the
`CurrentColumn` layout entries. Migrate persisted state as described below.

> Note, the `pinnable` flag is currently only used to show/hide the "Column Pinning" command from the Header Menu. It will not block a column from being pinnable using the `pinning` grid option, it is again simply used by the Header Menu.

```ts
const columns: Column[] = [
  { id: 'account', field: 'account', name: 'Account', pinned: 'left', pinnable: false },
  { id: 'amount', field: 'amount', name: 'Amount' },
  { id: 'actions', field: 'actions', name: 'Actions', pinned: 'right' },
];
```

See the [Pinning guide](../grid-functionalities/pinning.md) for the complete column options and
runtime methods.

### Grid State and Presets

In v10, `GridState.pinning` stored the frozen column boundary and row count/side in
`frozenColumn`, `frozenRow`, and `frozenBottom`. In v11, both Grid State and Grid Presets use the
nested `pinning` shape from `GridOption.pinning` for all four sides. Update saved state and presets
that still use the old fields. The row IDs below are illustrative; use references for your dataset:

```diff
pinning: {
- frozenColumn: 2,
- frozenRow: 3,
- frozenBottom: true,
+ columns: { left: ['account', 'contact', 'status'], right: [] },
+ rows: { top: [], bottom: ['row-98', 'row-99', 'row-100'] },
}
```

The `frozenColumn` value was an inclusive left boundary, so `2` represented columns at indexes 0
through 2. In the new shape, use `pinning.columns.left: 2` for the equivalent boundary or provide
column IDs/indexes explicitly; IDs keep saved pinning stable if columns are reordered. `frozenRow`
was a row count. Map it to explicit row references under `pinning.rows.top` or `pinning.rows.bottom`,
depending on `frozenBottom`. For bottom-pinned rows, derive the references from the end of the saved
dataset or use stable dataset IDs.

The returned `GridState.pinning` always includes all four sides as arrays, with `[]` for empty
sides. Column arrays contain string `Column.id` values, including numeric IDs converted to strings;
numeric boundaries/counts and column index arrays are accepted as preset inputs but are not emitted
in saved state. Row arrays preserve their configured index or dataset ID references so ID-based
pins keep following their records through sorting and filtering. Use `{ id: number }` for numeric
dataset IDs to distinguish them from row indexes.

Column layouts in `CurrentColumn[]` contain order, width, visibility, and CSS classes. Pinning is
saved only in `GridState.pinning`; `Column.pinned` remains available on column definitions and is
serialized as column IDs under `pinning.columns.left/right`. If you saved an earlier v11 preview
with `columns[].pinned`, ensure their IDs are represented under `pinning.columns.left/right`, then
remove the per-column `pinned` properties. When restoring state dynamically, apply the column layout
first, then apply the saved `pinning` through `gridService.setPinning()`.
Sticky columns and rows are scroll-dependent and are not included in saved Grid State or presets.
See the [Grid State and Presets guide](../grid-functionalities/grid-state-preset.md) for the current
shape.

### Header Menu commands

For simplification, the previous frozen error callbacks were merged into a single grid option `errorCallback` for all error messages. The specific messages remain configurable through the new pinning error messages (`invalidColumnPinningWidthMessage`, `invalidColumnPinningPickerMessage`, and `invalidColumnPinningSequenceMessage`):

```diff
const gridOptions: GridOption = {
- invalidColumnFreezePickerCallback: (msg) => alert(msg),
- invalidColumnFreezeWidthCallback: (msg) => alert(msg),
+ errorCallback: (msg) => alert(msg),
};
```

Frozen-column Header Menu commands are now pinning commands. Update custom menu configuration and
handlers to use the new names:

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

The Header Menu now shows the Pinning Commands root menu by default, even when no `pinning` state is configured. It groups the single-column, bulk pin, and unpin actions. Legacy frozen-column and frozen-row controls were not shown by default. Hide this root menu to keep the previous behavior:
`headerMenu.hideCommands: ['pinning-commands']`; individual command IDs still hide specific actions. `Column.pinnable: false` continues to hide pinning commands for a particular column.

#### Pinning locale keys and labels

Update custom locale files that still use the frozen-column keys. The pinning menu now has distinct
labels for directional and bulk actions:

| Previous locale key / default locale property | Current locale key / default locale property | Label change |
| --- | --- | --- |
| `FREEZE_COLUMNS` / `TEXT_FREEZE_COLUMNS` | `PIN_COLUMNS_LEFT` / `TEXT_PIN_COLUMNS_LEFT`; `PIN_COLUMNS_RIGHT` / `TEXT_PIN_COLUMNS_RIGHT` | Replaced the single freeze action with directional bulk pin actions. |
| `UNFREEZE_COLUMNS` / `TEXT_UNFREEZE_COLUMNS` | `UNPIN_COLUMNS` / `TEXT_UNPIN_COLUMNS` | “Unfreeze Columns” becomes “Unpin All Columns.” |
| `PIN_COLUMN` / `TEXT_PIN_COLUMN` | Same keys | Retained for the menu root; its label is now “Column Pinning” (French: “Épinglage de colonne”). |
| No previous key | `PIN_LEFT` / `TEXT_PIN_LEFT`; `PIN_RIGHT` / `TEXT_PIN_RIGHT` | New labels for pinning the selected column to either side. |
| `UNPIN_COLUMN` / `TEXT_UNPIN_COLUMN` | Same keys | Retained for unpinning the selected column. |

If you customize Header Menu labels through `headerMenu.commandLabels`, replace the removed
`pinningColumnsCommand` and `pinningColumnsCommandKey` with `pinningColumnsLeftCommand` and
`pinningColumnsRightCommand`. The English root label remains “Column Pinning”; bulk actions keep
plural labels such as “Pin Columns Left” and “Unpin All Columns.”

See the [Pinning guide](../grid-functionalities/pinning.md) for current command ids, labels,
translation keys, and menu behavior.

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

| Former pane/viewport selector | Current class or structure | Migration note |
| --- | --- | --- |
| `.slick-pane-header` | `.slick-header-root` | The single header root. |
| `.slick-pane-top` | `.slick-content-root` | The single content root. |
| `.slick-pane-left`, `.slick-pane-right`, `.slick-pane-bottom` | No separate pane equivalents; see the row cell regions below. | Docking no longer creates independent pane containers. |
| `.slick-viewport-top`, `.slick-viewport-left` | `.slick-viewport` | These direction classes remain on the sole viewport, but no longer identify separate viewports. |
| `.slick-viewport-right`, `.slick-viewport-bottom` | No equivalent. | Scroll owners are identified with the scroller classes below. |
| Former viewport selected as horizontal/vertical scroll owner | `.slick-horizontal-scroller`, `.slick-vertical-scroller` | Stable markers for the active scroll owners. Docked grids put `.slick-horizontal-scroller` on `.slick-docking-horizontal-scroller`. |
| `.grid-canvas-left`, `.grid-canvas-right` | `.grid-canvas` | One body canvas. Docked rows place cells in the sibling regions below. |
| Split row cells in the pane canvases | `.slick-row-docked` with `.slick-pinned-left-cells`, `.slick-scrolling-cells`, and `.slick-pinned-right-cells` | One row contains sibling regions for pinned and scrolling cells. |
| No previous row overlay selector | `.slick-docking-overlay` | Optional layer for configured pinned or sticky rows. |

Use `.slick-horizontal-scroller` for the active horizontal scroll owner and
`.slick-vertical-scroller` for the vertical scroll owner. Docked grids use the dedicated
`.slick-docking-horizontal-scroller` for horizontal scrolling.

#### Pinning and docking Sass/CSS variables

| Previous Sass variable | Current Sass variable | Previous CSS custom property | Current CSS custom property | Migration note |
| --- | --- | --- | --- | --- |
| `$slick-pane-top-border-top` | `$slick-content-border-top` | `--slick-pane-top-border-top` | `--slick-content-border-top` | Renamed to describe the content root rather than the removed pane. |
| `$slick-frozen-border-bottom` | `$slick-pinned-border-bottom` | `--slick-frozen-border-bottom` | `--slick-pinned-border-bottom` | Renamed for the bottom edge of pinned rows. |
| `$slick-frozen-border-right` | `$slick-pinned-border-color` | `--slick-frozen-border-right` | `--slick-pinned-border-color` | Renamed and generalized as the color used by pinned edge separators. |
| `$slick-preheader-border-right` | `$slick-preheader-border-color` | `--slick-preheader-border-right` | `--slick-preheader-border-color` | Replaced the directional right border with a shared preheader separator color. |
| `$slick-preheader-border-left`, `$slick-preheader-border-left-first-element`, `$slick-preheader-border-right-last-element`, `$slick-preheader-border-top`, `$slick-preheader-border-bottom` | No equivalent | `--slick-preheader-border-left`, `--slick-preheader-border-left-first-element`, `--slick-preheader-border-right-last-element`, `--slick-preheader-border-top`, `--slick-preheader-border-bottom` | No equivalent | Per-side and first/last overrides were removed with the old pane-specific preheader borders. |
| `$slick-frozen-overflow-right` | No equivalent | `--slick-frozen-overflow-right` | No equivalent | The old independent viewport overflow override was removed with the multi-pane layout. |
| No previous variable | No Sass variable | No previous variable | `--slick-pinned-border-box-shadow-left`, `--slick-pinned-border-box-shadow-right` | New CSS-only hooks for customizing the left and right pinned-edge separators. |

The current Sass variables supply fallback values for the corresponding CSS custom properties.
Update theme overrides to the current names and remove overrides marked “No equivalent.”

The legacy `-1000px` header offset and `HEADER_WIDTH_SLACK` workaround are gone. Remove manual
pane scroll synchronization and update old `$slick-frozen-*` Sass variables to their current
`$slick-pinned-*` equivalents.

## Removed Deprecated Code
### Row Positioning `rowTopOffsetRenderType`

The `rowTopOffsetRenderType` grid option and the Row Detail `renderMode` option have been removed.
The related `RowDetailViewRenderMode` and `RowDetailViewInlineRenderMode` types have also been removed.
Rows use transform positioning, and Row Detail panels always render in a sibling overlay layer of the grid canvas. Remove these options regardless of their previous values (`'top'` or `'transform'`, and `'inline'` or `'overlay'`):

```diff
const gridOptions: GridOption = {
- rowTopOffsetRenderType: 'transform',
  rowDetailView: {
-   renderMode: 'overlay',
    // ... other Row Detail options
  },
};
```

Transform positioning now stricly uses `transform: translateY(25px)` instead of `top: 25px` for better scrolling performance. RowSpan host rows and the rows they cover retain internal `top` positioning so pinned columns remain above overlapping spanning cells; no configuration is required.

If custom CSS or tests relied on `.slick-cell + .dynamic-cell-detail`, target
`.dynamic-cell-detail` directly because the overlay is mounted in a sibling layer. See the
[Row Detail guide](../grid-functionalities/row-detail.md) for details.

## Code Changes
### Rename `changeColumnsArrangement()`

```diff
- gridStateService.changeColumnsArrangement(columnPreset, false);
+ gridStateService.applyColumnLayout(columnPreset, false);
```

The method now describes its responsibility more accurately: it applies visibility, order, widths, and dynamic extension columns.

### Import optional package styles separately

In v11, styles for optional packages moved out of the common theme stylesheets so applications do not load CSS for features they do not use. If your application uses Composite Editor, Custom Tooltip, or Row Detail, add the corresponding package as a direct dependency and import its stylesheet after the common theme. Import only the packages used by your application. If you use any of these 3 optional packages, then you now have to import (or `@use`) these CSS or SCSS files.

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

The base Row Detail package was also renamed from `@slickgrid-universal/row-detail-view-plugin` to
`@slickgrid-universal/row-detail-plugin`, and its stylesheet entry was shortened from
`slick-row-detail-view` to `slick-row-detail`. Update the dependency, TypeScript imports, and any
stylesheet paths that use the old names. The Angular, Aurelia, React, and Vue adapter package names
(for example, `@slickgrid-universal/angular-row-detail-plugin`) are unchanged. See
[Required Styles for Extra Packages](../styling/styling.md#required-styles-for-extra-packages) for
theme-specific paths and additional details.

## Final Note

If the project is useful to you, please give it a star ⭐ on the
[Slickgrid-Universal](https://github.com/ghiscoding/slickgrid-universal) umbrella project.
