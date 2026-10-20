## Single-viewport pinning rewrite

SlickGrid v11 replaces the legacy frozen-pane renderer with a single-viewport docking renderer and single-scrollbar. Frozen columns/rows is being replaced by a new Pinnning feature and as a bonus we also have a new Sticky columns/rows.

The old `frozenColumn`, `frozenRow`, and `frozenBottom` options are no longer valid and users have to migrate to the new `pinning` grid option. The new Pinning feature allows you to pin any single column, the column index no longer matters and it's no longer a frozen range but is rather individual pinning (hence the new name). Update your grid options, persisted grid state.

#### Major Changes - Quick Summary

- [Remove SortableJS](#remove-sortablejs)
- [Replace frozen options with `pinning`](#replace-frozen-options-with-pinning)
- [Migrate Grid State and Presets](#grid-state-and-presets)
- [Import optional package styles separately](#import-optional-package-styles-separately)
- [Remove row positioning and Row Detail rendering options](#row-positioning-rowtopoffsetrendertype)
- [Update Row Detail DOM and CSS selectors](#row-detail-dom-and-css-selectors)
- [Removed Deprecated Code](#removed-deprecated-code)
- [Code Changes](#code-changes)

> **Note:** If you are upgrading from a version earlier than v10, follow the previous migration guides in order before applying these v11 changes.

> **Important:** v11 does not support the old frozen-pane options or renderer.

Also note that we also have a new Sticky docking that was also introduced in v11, it shares similarities with Pinning, but it is an entirely new feature. See the [Sticky Docking guide](../grid-functionalities/sticky.md) for its configuration and behavior.

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

### Column pinning

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

The pinning command menu is now enabled by default. To hide it, add `'pinning-commands'` to `headerMenu.hideCommands`. Replace custom locale keys `FREEZE_COLUMNS` and `UNFREEZE_COLUMNS` with the pinning keys listed in the [Pinning guide](../grid-functionalities/pinning.md#header-menu-commands).

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

## Removed Deprecated Code
### Row Positioning `rowTopOffsetRenderType`

For Row Detail and RowSpan users that previously required `rowTopOffsetRenderType: 'top'`, no longer require this grid option and is actually being dropped completely. The library now works fine with `rowTopOffsetRenderType: 'transform'` with all plugins, making this option redundant which is why it is being removed. Also please note that the Row Detail `renderMode` option is also removed for the same reason (overlay is now its default positioning).

```diff
const gridOptions: GridOption = {
- rowTopOffsetRenderType: 'transform',
  rowDetailView: {
-   renderMode: 'overlay',
    // ... other Row Detail options
  },
};
```

Grid row positioning now strictly uses `transform: translateY(25px)` (the legacy approach was `top: 25px`) for better precisions and scrolling performance. RowSpan host rows and the rows they cover retain internal `top` positioning so pinned columns remain above overlapping spanning cells; no configuration is required.

### Row Detail DOM and CSS selectors

After identifying that Row Detail has way too many containers and redundant CSS classes, v11 removes them to simplify the DOM. Update custom CSS and DOM selectors accordingly.

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

If the project is useful to you, please give it a star ⭐ on the [Slickgrid-Universal](https://github.com/ghiscoding/slickgrid-universal) umbrella project.
