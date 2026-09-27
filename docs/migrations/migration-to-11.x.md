## Single-viewport pinning and modernization

SlickGrid v11 replaces the legacy frozen-pane renderer with a single-viewport docking renderer. This is a breaking change: pinned and sticky columns and rows now share one viewport, one native vertical scrollbar, and one DOM row per data item.

The old `frozenColumn`, `frozenRow`, and `frozenBottom` options are no longer valid. We now call this the Pinning feature because you can now pin any single column, the column index no longer matters and it's no longer a frozen range but rather an individual pinning (hence the new name). Update your grid options, persisted grid state, custom menu commands, and DOM/CSS selectors as part of the migration. The examples below show the application changes; feature details belong in the linked guides.

#### Major Changes - Quick Summary

- [Replace frozen options with `pinning`](#replace-frozen-options-with-pinning)
- [Column pinning](#column-pinning)
- [Rename `changeColumnsArrangement()`](#rename-changecolumnsarrangement)
- [Header Menu pin/unpin commands](#header-menu-commands)
- [Single-viewport DOM and CSS changes](#single-viewport-dom-and-css)
- [Row Positioning](#row-positioning)

> **Note:** If you are upgrading from a version earlier than v10, follow the previous migration
> guides in order before applying these v11 changes.

> **Important:** v11 intentionally does not provide a compatibility layer for the old full-height
> frozen panes. The migration is a configuration and DOM contract change, not only a visual update.

Also note that we also have a new Sticky docking that was introduced in v11, it shares similarities with Pinning, but it is an entirely new feature. See the [Sticky Docking guide](../grid-functionalities/sticky.md) for its configuration and behavior.

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

### Rename `changeColumnsArrangement()`

```diff
- gridStateService.changeColumnsArrangement(columnPreset, false);
+ gridStateService.applyColumnLayout(columnPreset, false);
```

The method now describes its responsibility more accurately: it applies visibility, order, widths,
and dynamic extension columns. This rename applies to all framework wrappers.

### Header Menu commands

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

The Header Menu now provides a `Column Pinning` sub-menu with directional pin, bulk pin, and
unpin commands. Use `headerMenu.showPinningCommands` to expose it before a pinning state exists,
and `headerMenu.hideCommands` for individual command visibility.

See the [Pinning guide](../grid-functionalities/pinning.md) for current command ids, labels,
translation keys, and menu behavior.

### E2E Tests with Cypress Header Menu selectors

Header Menu commands have changed order in the list. The Sort Asc/Desc are now showing at the top followed by the new "Column Pinning" (with sub-menu pinning commands). So if you were using positional selectors to retrieve specific Header Menu commands, you should migrate to a contain text selector instead (e.g. with Cypress shown below):

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

Use `.slick-horizontal-scroller` for the active horizontal scroll owner and
`.slick-vertical-scroller` for the vertical scroll owner. Docked grids use the dedicated
`.slick-docking-horizontal-scroller` for horizontal scrolling.

The legacy `-1000px` header offset and `HEADER_WIDTH_SLACK` workaround are gone. Remove manual
pane scroll synchronization and update old `$slick-frozen-*` Sass variables to their current
`$slick-pinned-*` equivalents.

### Row Positioning

We previously had a grid option `rowTopOffsetRenderType: 'top' | 'transform'` and that was mainly because `'transform'` was not working with certain features like Row Detail and/or ColSpan. However with v11, this limitation is gone we are dropping the grid option and internally we will use `'transform'` as the only row offset. Remove inline Row Detail compatibility settings:

```diff
rowDetailView: {
- renderMode: 'inline',
+ renderMode: 'overlay',
}
- rowTopOffsetRenderType: 'top', // for Row Detail or ColSpan
```

> What was that legacy grid option anyway? SlickGrid was built with virtual-scroll which is what made it extremely performant, and in order to know which row is where, it was using a top offset calculation (row X * `rowHeight`). For example the legacy approach for the second row was to use `<div class="slick-row" style="top: 25px">` (assuming `rowHeight: 25`), but the new approach is to use transform so it now uses  `<div class="slick-row" style="transform: translateY(25px)">`, the reason to use transform is simply because it's more precise and has much better performance compared to top.

If custom CSS or tests relied on `.slick-cell + .dynamic-cell-detail`, target
`.dynamic-cell-detail` directly because the overlay is mounted in a sibling layer. See the
[Row Detail guide](../grid-functionalities/row-detail.md) for details.

### Migration checklist

- Replace `frozenColumn`, `frozenRow`, and `frozenBottom` with `pinning`.
- Migrate saved pinning state to the nested shape.
- Add `Column.pinned` where permanent column docking is needed.
- Rename `changeColumnsArrangement()` to `applyColumnLayout()` and `validateColumnFreeze()` to
  `validateColumnPinning()`.
- Update custom menu handlers, selectors, and CSS that reference frozen panes.
- Remove inline Row Detail compatibility settings.
- Review the [Pinning](../grid-functionalities/pinning.md), [Grid State](../grid-functionalities/grid-state-preset.md),
  and [Row Detail](../grid-functionalities/row-detail.md) guides for affected custom behavior.

If the project is useful to you, please give it a star ⭐ on the
[Slickgrid-Universal](https://github.com/ghiscoding/slickgrid-universal) umbrella project.
