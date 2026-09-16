## Single-viewport pinning, stickiness and modernization

SlickGrid v11 replaces the legacy frozen-pane renderer with a single-viewport docking renderer.
This is a breaking change: pinned and sticky columns and rows now share one viewport, one native
vertical scrollbar, and one DOM row per data item.

The old `frozenColumn`, `frozenRow`, and `frozenBottom` options are no longer valid. Update your
grid options, persisted grid state, custom menu commands, and DOM/CSS selectors as part of the
migration. The examples below show the application changes; feature details belong in the linked
guides.

#### Major Changes - Quick Summary

- [Replace frozen options with `pinning`](#replace-frozen-options-with-pinning)
- [Pin or stick individual columns](#column-pinning-and-stickiness)
- [Sticky rows and docking budgets](#sticky-rows-and-docking-options)
- [Rename `changeColumnsArrangement()`](#rename-changecolumnsarrangement)
- [Header Menu pin/unpin commands](#header-menu-commands)
- [Single-viewport DOM and CSS changes](#single-viewport-dom-and-css)
- [Row Detail and row positioning](#row-detail-and-row-positioning)

> **Note:** If you are upgrading from a version earlier than v10, follow the previous migration
> guides in order before applying these v11 changes.

> **Important:** v11 intentionally does not provide a compatibility layer for the old full-height
> frozen panes. The migration is a configuration and DOM contract change, not only a visual update.

### Replace frozen options with `pinning`

The old options configured a single contiguous left boundary to freeze columns and/or top (or bottom) rows, v11 uses one nested option for both axes. `frozenColumn: 2` can become an explicit list, `columns: { left: [0, 1, 2] }`, or keep the shorthand boundary as `columns: { left: 2 }` (which is interpreted as "pin columns from index 0 to 2").

The new Pinning feature is a lot more flexible, it now allows the user to pin all sides (left/right/top/bottom) in the same grid (which wasn't possible before) and also allows you to pin individual columns or rows and even allow you to skip some (e.g. `columns: { left: [0, 2, 4] }`).

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

For non-contiguous pinning, use stable column ids or indexes and row indexes or dataset ids. For
runtime changes, update the nested option or use `GridService.setPinning()` and
`GridService.clearPinning()`.

See the [Pinning guide](../grid-functionalities/pinning.md) for reference semantics, validation,
Header Menu commands, and runtime APIs.

### Column pinning and stickiness

Per-column permanent pinning moves from the old frozen-column behavior to `Column.pinned`.
Scroll-activated docking is new in v11 and uses `Column.sticky`. `Column.pinnable: false` replaces
the old per-column lock behavior for the built-in Header Menu. Sticky columns do not need a
separate `stickable` option.

```ts
const columns: Column[] = [
  { id: 'account', field: 'account', name: 'Account', pinned: 'left', pinnable: false },
  { id: 'amount', field: 'amount', name: 'Amount' },
  { id: 'actions', field: 'actions', name: 'Actions', pinned: 'right' },
];
```

See the [Pinning guide](../grid-functionalities/pinning.md) and
[Sticky Docking guide](../grid-functionalities/sticky.md) for the complete column options and
runtime methods.

### Sticky rows and docking options

Sticky rows and viewport-aware docking budgets are new v11 features. They are configured separately
from permanent pinning with `stickyRows` and the optional `docking` option.

See the [Sticky Docking guide](../grid-functionalities/sticky.md) for `stickyRows`, overflow
strategies, row stacking, variable row heights, and permanent-pin interaction.

`DockingController` is an internal implementation detail and is not part of the public v11 API.

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
+   hideClearPinningCommand: false,
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

Header Menu order can change as commands are added or removed. Replace positional selectors with
label- or command-based selectors:

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
`.slick-vertical-scroller` for the vertical scroll owner. Pinned/sticky grids use the dedicated
`.slick-docking-horizontal-scroller` for horizontal scrolling.

The legacy `-1000px` header offset and `HEADER_WIDTH_SLACK` workaround are gone. Remove manual
pane scroll synchronization and update old `$slick-frozen-*` Sass variables to their current
`$slick-pinned-*` equivalents.

### Row Detail and row positioning

Overlay Row Detail is the v11 rendering mode. Remove inline Row Detail compatibility settings:

```diff
rowDetailView: {
- renderMode: 'inline',
+ renderMode: 'overlay',
}
- rowTopOffsetRenderType: 'top',
```

If custom CSS or tests relied on `.slick-cell + .dynamic-cell-detail`, target
`.dynamic-cell-detail` directly because the overlay is mounted in a sibling layer. See the
[Row Detail guide](../grid-functionalities/row-detail.md) for details.

### Migration checklist

- Replace `frozenColumn`, `frozenRow`, and `frozenBottom` with `pinning`.
- Migrate saved pinning state to the nested shape.
- Add `Column.pinned` or `Column.sticky` where column docking is needed.
- Rename `changeColumnsArrangement()` and `validateColumnFreeze()` calls.
- Update custom menu handlers, selectors, and CSS that reference frozen panes.
- Remove inline Row Detail compatibility settings.
- Review the [Pinning](../grid-functionalities/pinning.md), [Sticky Docking](../grid-functionalities/sticky.md),
  [Grid State](../grid-functionalities/grid-state-preset.md), and [Row Detail](../grid-functionalities/row-detail.md)
  guides for affected custom behavior.

If the project is useful to you, please give it a star ⭐ on the
[Slickgrid-Universal](https://github.com/ghiscoding/slickgrid-universal) umbrella project.
