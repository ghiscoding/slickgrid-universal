## Single-viewport pinning, stickiness and modernization

SlickGrid v11 replaces the legacy frozen-pane renderer with a single-viewport docking
renderer. This is a major breaking change: a grid now has one native vertical scrollbar and
one DOM row per data item. The native vertical scrollbar is exposed through
`.slick-vertical-scroller`. An ordinary grid keeps its native horizontal scrollbar on
`.slick-viewport`; a grid with permanent pinning or sticky docking uses one dedicated
`.slick-docking-horizontal-scroller` instead. The active horizontal scroll element always also
has the generic `.slick-horizontal-scroller` class. Permanently pinned columns and rows, as well
as scroll-activated sticky columns and rows, are rendered inside that viewport.

The old `frozenColumn`, `frozenRow`, and `frozenBottom` options are no longer valid ways to
configure pinning. Update your grid options, persisted grid state, custom menu commands, and
DOM/CSS selectors as part of the migration.

#### Major Changes - Quick Summary

- [Replace frozen options with `pinning`](#replace-frozen-options-with-pinning)
- [Pin or stick individual columns](#column-pinning-and-stickiness)
- [Sticky rows and docking budgets](#sticky-rows-and-docking-options)
- [Grid State and renamed interfaces](#grid-state-and-renamed-interfaces)
- [Rename `changeColumnsArrangement()`](#rename-changecolumnsarrangement)
- [Header Menu pin/unpin commands](#header-menu-commands)
- [Single-viewport DOM and CSS changes](#single-viewport-dom-and-css)
- [Row Detail and row positioning](#row-detail-and-row-positioning)

> **Note:** If you are upgrading from a version earlier than v10, follow the previous migration
> guides in order before applying these v11 changes.

> **Important:** v11 intentionally does not provide a compatibility layer for the old full-height
> frozen panes. The migration is a configuration and DOM contract change, not only a visual update.

### Replace frozen options with `pinning`

The old options configured a single contiguous left boundary and optionally moved rows to the
bottom. v11 uses one nested option for both axes. The numeric left value keeps the old inclusive
boundary meaning (`2` pins indexes `0`, `1`, and `2`), while a numeric right value is a count
from the trailing edge.

```diff
const gridOptions: GridOption = {
- frozenColumn: 2,
- frozenRow: 3,
- frozenBottom: false,
+ pinning: {
+   columns: {
+     left: 2,
+     right: 1,
+   },
+   rows: {
+     top: [0, 1, 2],
+     bottom: [],
+   },
+ },
};
```

Column references can also be arrays of stable column ids or indexes. This supports
non-contiguous pinning and is preferred when columns can be hidden or reordered.

Pinning is independent: use explicit column IDs, indexes, or `Column.pinned` values when
individual columns should be pinned without including the columns between them. For applications
that used the legacy contiguous behavior, v11 also keeps a numeric left boundary under
`pinning.columns.left`. This provides the familiar “pin through index X” approach, similar to
`frozenColumn` in v10 and lower: `frozenColumn: 2` becomes `pinning.columns.left: 2` and pins
indexes `0`, `1`, and `2`. The numeric boundary is an optional migration-friendly shorthand;
explicit references remain the recommended form for independent pinning.

```ts
pinning: {
  columns: {
    left: ['selector', 'account'],
    right: ['total', 'actions'],
  },
  rows: {
    top: [0, 1],
    bottom: ['summary-row-id'],
  },
}
```

Row references are indexes or values from `datasetIdPropertyName` (which defaults to `id`).
An in-range numeric reference is interpreted as a row index first.

To change pinning at runtime, update the nested option rather than the removed frozen fields:

```ts
grid.setOptions({
  pinning: {
    columns: { left: ['account'], right: ['actions'] },
    rows: { top: [0, 1, 2], bottom: [] },
  },
});
```

`GridService.setPinning()` accepts the same nested `PinningOption` shape. Calling
`gridService.clearPinning()` clears both column edges and both row edges.

### Column pinning and stickiness

For the complete sticky-column and sticky-row guide, see [Sticky Columns and Rows](../grid-functionalities/sticky.md).

Use `Column.pinned` for a permanent per-column pin. The value is a physical edge (`left` or
`right`); `null` explicitly returns a column to the center band.

Set `Column.pinnable: false` when users must not be able to change that column's pinning from
the Header Menu. The option defaults to `true`, only controls the built-in UI, and leaves
programmatic pinning through the grid API available. v11 does not need a `Column.stickable`
counterpart because sticky columns do not have built-in Header Menu commands; use
`Column.sticky` or `setColumnStickiness()` when the application controls sticky behavior.

```ts
const columns: Column[] = [
  { id: 'account', field: 'account', name: 'Account', pinned: 'left', pinnable: false },
  { id: 'amount', field: 'amount', name: 'Amount' },
  { id: 'actions', field: 'actions', name: 'Actions', pinned: 'right' },
];
```

Use `Column.sticky` for scroll-activated docking. `true` uses the leading edge (`left` in LTR,
`right` in RTL), while `'left'`, `'right'`, and `'both'` select explicit physical edges.

```ts
{ id: 'country', field: 'country', name: 'Country', sticky: true }
{ id: 'quarter', field: 'quarter', name: 'Q1', sticky: 'both' }
```

The runtime methods are:

```ts
grid.getPinnedColumns();
grid.getPinnedColumns('left');
grid.setColumnPinning('actions', 'right');
grid.setColumnPinning('actions', null);
grid.setColumnStickiness('quarter', 'both');
grid.setColumnStickiness('quarter', false);
```

Permanent pins take precedence over sticky candidates. The docking resolver keeps center-column
virtualization enabled; only configured pinned or active sticky cells are materialized outside the
normal range.

### Sticky rows and docking options

Rows that should dock only after normal scrolling are configured separately from permanent
pinning. `stickyRows.top` and `stickyRows.bottom` use the corresponding edge, while
`stickyRows.both` chooses the nearest edge after the row would be clipped.

```ts
const gridOptions: GridOption = {
  stickyRows: {
    top: ['section-header'],
    bottom: ['summary'],
    both: ['total'],
  },
  docking: {
    maxColumnViewportWidthPercent: 60,
    maxRowViewportHeightPercent: 60,
    overflowStrategy: 'conveyor', // 'conveyor' | 'clamp' | 'priority'
    stickyHysteresis: 2,
  },
};
```

The `docking` option is optional. It controls the shared pixel budgets and overflow behavior for
permanent and sticky docking. Do not import `DockingController` for application code; it is an
internal implementation detail and its public export is provisional.

### Grid State and renamed interfaces

`CurrentPinning` no longer contains the three flat frozen properties. Grid state now serializes
the same nested shape as `GridOption.pinning`:

```diff
// v10
type CurrentPinning = {
- frozenColumn?: number;
- frozenRow?: number;
- frozenBottom?: boolean;
};

// v11
type CurrentPinning = {
+ columns?: { left?: number | Array<number | string>; right?: number | Array<number | string> };
+ rows?: { top?: Array<number | string>; bottom?: Array<number | string> };
};
```

Update saved views, presets, URL state, and `onGridStateChanged` handlers that read or write
`gridState.pinning`. A view that was saved with the old flat shape must be migrated before it is
passed to `GridService.setPinning()`.

`CurrentColumn` now has an optional `pinning` property. It stores the per-column side in column
layouts and lets a preset retain non-contiguous pins:

```ts
interface CurrentColumn {
  columnId: string;
  width?: number;
  hidden?: boolean;
  pinning?: 'left' | 'right' | null;
}
```

When both forms are present, `CurrentColumn.pinning` is the granular column-layout value and
`GridState.pinning` is the aggregate row/column state. Keep them consistent when persisting a
custom preset.

The new pinning and docking data types are consolidated in
`packages/common/src/interfaces/docking.interface.ts` and re-exported from the common interfaces
barrel. The v11 names are `ColumnPinningReferences`, `PinnedColumns`, `PinnedRows`,
`PinningOption`, `StickyRows`, and `DockingOption`. The resolver layout types are
`DockedColumn`, `ColumnDockingLayout`, `DockingRow`, `DockedRow`, and `RowDockingLayout`.
These replace any application-owned frozen-pane state types; `DockingController` itself remains
an internal implementation detail.

The public mapping is summarized below. Most names remain stable while their frozen-pane
properties are replaced; the one service method rename is intentional and breaking:

| v10 API | v11 API | Change |
| --- | --- | --- |
| `GridOption.frozenColumn`, `frozenRow`, `frozenBottom` | `GridOption.pinning` | One nested option for both axes |
| `CurrentPinning.frozenColumn`, `frozenRow`, `frozenBottom` | `CurrentPinning.columns` / `CurrentPinning.rows` | Saved state shape changed |
| `CurrentColumn` | `CurrentColumn.pinning` | Per-column pin side is persisted with the layout |
| `Column` | `Column.pinned` / `Column.sticky` | Permanent and scroll-activated column docking |
| `Column.lockPinned` | `Column.pinnable` | Set `pinnable: false` to hide Header Menu pinning commands; programmatic pinning remains available |
| `GridStateService.changeColumnsArrangement()` | `GridStateService.applyColumnLayout()` | Method renamed |

The following public interface members were also renamed or removed. The left-hand names below
are historical references for v11 and lower; they are not accepted by the v11 TypeScript
interfaces or runtime.

| v11 and lower | v11 | Change |
| --- | --- | --- |
| `GridOption.frozenHeaderWidthCalcDifferential` | removed | Header sizing no longer uses the legacy pane differential |
| `GridOption.frozenRightViewportMinWidth` | removed | Docking uses the shared viewport budget |
| `GridOption.skipFreezeColumnValidation` | `GridOption.skipPinningValidation` | Validation option renamed |
| `GridOption.invalidColumnFreezePickerMessage` | `GridOption.invalidColumnPinningPickerMessage` | Picker validation message renamed |
| `GridOption.invalidColumnFreezePickerCallback` | `GridOption.invalidColumnPinningPickerCallback` | Picker validation callback renamed |
| `GridOption.invalidColumnFreezeWidthMessage` | `GridOption.invalidColumnPinningWidthMessage` | Width validation message renamed |
| `GridOption.invalidColumnFreezeWidthCallback` | `GridOption.invalidColumnPinningWidthCallback` | Width validation callback renamed |
| `EmptyWarning.hideFrozenLeftWarning`, `hideFrozenRightWarning` | removed | Empty warnings are shown consistently in the single viewport |
| `EmptyWarning.frozenLeftViewportMarginLeft` | `EmptyWarning.pinnedLeftViewportMarginLeft` | Pinned-region margin renamed |
| `EmptyWarning.frozenRightViewportMarginLeft` | `EmptyWarning.pinnedRightViewportMarginLeft` | Pinned-region margin renamed |
| `GridMenuLabel.clearFrozenColumnsCommand` | `GridMenuLabel.clearPinningCommand` | Grid-menu label renamed |
| `GridMenuLabel.clearFrozenColumnsCommandKey` | `GridMenuLabel.clearPinningCommandKey` | Grid-menu translation key option renamed |
| `GridMenuOption.hideClearFrozenColumnsCommand` | `GridMenuOption.hideClearPinningCommand` | Grid-menu visibility option renamed |
| `GridMenuOption.iconClearFrozenColumnsCommand` | `GridMenuOption.iconClearPinningCommand` | Grid-menu icon option renamed |
| `HeaderMenuOption.hideFreezeColumnsCommand` | `HeaderMenuOption.hidePinningColumnsCommand` | Bulk pinning visibility option renamed |
| `HeaderMenuOption.iconFreezeColumns` | `HeaderMenuOption.iconPinningColumns` | Bulk pinning icon option renamed |
| `HeaderMenuOption.iconUnfreezeColumns` | `HeaderMenuOption.iconUnpinningColumns` | Bulk unpinning icon option renamed |
| `HeaderMenuLabel.freezeColumnsCommand` | `HeaderMenuLabel.pinningColumnsLeftCommand`, `HeaderMenuLabel.pinningColumnsRightCommand` | Bulk pinning labels split by direction |
| `HeaderMenuLabel.freezeColumnsCommandKey` | `PIN_COLUMNS_LEFT`, `PIN_COLUMNS_RIGHT` | Bulk pinning translation keys split by direction |
| `HeaderMenuLabel.unfreezeColumnsCommand` | `HeaderMenuLabel.unpinningColumnsCommand` | Bulk unpinning label renamed |
| `HeaderMenuLabel.unfreezeColumnsCommandKey` | `HeaderMenuLabel.unpinningColumnsCommandKey` | Bulk unpinning translation-key option renamed |
| `HeaderMenuCommand.freeze-columns` | `HeaderMenuCommand.pin-columns-left`, `HeaderMenuCommand.pin-columns-right` | Bulk pinning command ids split by direction |
| `HeaderMenuCommand.unfreeze-columns` | `HeaderMenuCommand.unpin-columns` | Bulk unpinning command id renamed |
| `Locale.TEXT_FREEZE_COLUMNS` | `Locale.TEXT_PIN_COLUMNS_LEFT`, `Locale.TEXT_PIN_COLUMNS_RIGHT` | Bulk pinning translation keys split by direction |
| `Locale.TEXT_UNFREEZE_COLUMNS` | `Locale.TEXT_UNPIN_COLUMNS` | Bulk unpinning translation key renamed |
| `$slick-frozen-border-bottom` | `$slick-pinned-border-bottom` | Pinned-row separator variable renamed |
| `$slick-frozen-border-right` | `$slick-pinned-border-color` plus `$slick-pinned-border-box-shadow-left/right` | Pinned-column separator now uses non-layout shadows |
| `$slick-pane-top-border-top` | `$slick-content-border-top` | Content-root border variable renamed |

For example, update the renamed menu and validation options together:

```diff
const gridOptions: GridOption = {
- skipFreezeColumnValidation: true, // v11 and lower
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
+   hidePinningColumnsCommand: false,
+   iconPinningColumns: 'mdi mdi-pin-outline',
+   iconUnpinningColumns: 'mdi mdi-pin-off-outline',
+ },
};
```

The old `freeze-columns`/`unfreeze-columns` command ids and
`FREEZE_COLUMNS`/`UNFREEZE_COLUMNS` translation keys are documented here for migration purposes;
v11 uses directional `pin-columns-left`/`pin-columns-right` commands alongside
`unpin-columns`. Their translation keys are `PIN_COLUMNS_LEFT`/`PIN_COLUMNS_RIGHT` and
`UNPIN_COLUMNS`. The public label properties are `pinningColumnsLeftCommand`,
`pinningColumnsRightCommand`, and `unpinningColumnsCommand`. The older
`pinningColumnsCommand` property is deprecated but remains a fallback for the left command;
`PIN_COLUMNS` is no longer an active translation key.

### Rename `changeColumnsArrangement()`

`GridStateService.changeColumnsArrangement()` was renamed to `applyColumnLayout()` because the
method applies visibility, order, widths, and dynamic extension columns; it does not merely
rearrange columns.

```diff
- gridStateService.changeColumnsArrangement(columnPreset, false);
+ gridStateService.applyColumnLayout(columnPreset, false);
```

The old method is removed in v11. This rename applies to all framework wrappers because they all
expose the same `GridStateService` API.

### Header Menu commands

Header menus now expose a `Column Pinning` root command with one directional pinning sub-menu.
For pinnable columns, the sub-menu always contains all five commands, regardless of the selected
column's current state. Set `pinnable: false` to remove the `Column Pinning` menu for a column.

- `pin-left` pins the selected column to the left edge;
- `pin-right` pins the selected column to the right edge;
- `pin-columns-left` (displayed as `Pin Columns Left`) pins every column from the left edge
  through the selected column;
- `pin-columns-right` (displayed as `Pin Columns Right`) pins every column from the right
  edge through the selected column;
- `unpin-column` clears the selected column's pin; and
- `unpin-columns` (displayed as `Unpin All Columns`) clears all pinned columns on both edges.

Each command group is separated from the next visible group. Hidden commands do not leave
duplicate or orphaned separators. All commands update `pinning.columns` and no longer create a second pane. The v10 `freeze-columns` /
`unfreeze-columns` ids are removed.

The new header-menu options and labels are:

```ts
headerMenu: {
  hidePinColumnCommand: false,
  hidePinningColumnsCommand: false,
  iconPinColumn: 'mdi mdi-pin-outline',
  iconPinLeft: 'mdi mdi-pin-outline',
  iconPinRight: 'mdi mdi-pin-outline',
  iconUnpinColumn: 'mdi mdi-pin-off-outline',
  commandLabels: {
    pinColumnCommand: 'Pin Column',
    pinLeftCommand: 'Pin Left',
    pinRightCommand: 'Pin Right',
    unpinColumnCommand: 'Unpin Column',
    pinningColumnsLeftCommand: 'Pin Columns Left',
    pinningColumnsRightCommand: 'Pin Columns Right',
    unpinningColumnsCommand: 'Unpin All Columns',
  },
}
```

`hidePinningColumnsCommand` controls the bulk command. Migrate the v10
`hideFreezeColumnsCommand` option and do not use legacy frozen-column callbacks or menu state to
implement new pinning behavior.

The old `$slick-frozen-*` Sass variables are no longer consumed by the v11 stylesheet. Rename
them to the corresponding `$slick-pinned-*` variables when customizing pinned-region styling.

### Single-viewport DOM and CSS

The old pane roots and their independent scroll containers are removed. The single live structure
uses `.slick-header-root` and `.slick-content-root` as its two outer roots; these are layout roots,
not left/right docking panes. Do not target selectors
such as `.slick-pane-left`, `.slick-pane-right`, `.slick-viewport-top`, `.slick-viewport-bottom`,
`.grid-canvas-left`, or `.grid-canvas-right` in application CSS or Cypress tests.

Each rendered row has one stable set of regions:

```html
<div class="slick-row" role="row">
  <div class="slick-pinned-left-cells">...</div>
  <div class="slick-scrolling-cells">...</div>
  <div class="slick-pinned-right-cells">...</div>
</div>
```

Headers, header filters, and footers expose equivalent `*-columns-left`, `*-columns-center`, and
`*-columns-right` wrappers. Use those semantic regions when styling or querying the grid. There
is one native horizontal scrollbar and one native vertical scrollbar, so code that manually
synchronized pane scroll positions must be removed.

The old `-1000px` header offset and `HEADER_WIDTH_SLACK` workaround are gone. Header and grouped
header coordinates are ordinary document coordinates; custom code must not add or subtract the
legacy 1000px adjustment.

#### Horizontal scroll element

The horizontal scroll element depends on whether docking is active:

- grids without pinning or sticky configuration keep `.slick-viewport.slick-viewport-top.slick-viewport-left`
  as the native horizontal scroll element and add `.slick-horizontal-scroller`;
- grids with permanent pinning or sticky docking use `.slick-docking-horizontal-scroller` as
  the scroll element and add `.slick-horizontal-scroller`, while the viewport remains the
  vertical scroll container.

Use `.slick-horizontal-scroller` in Cypress helpers and direct DOM scrolling code when you need
the active horizontal scroll element. The more specific `.slick-docking-horizontal-scroller`
class remains available when code specifically needs to identify the docking scrollbar. Do not
assume that the docking scrollbar exists on ordinary grids, and do not use the viewport to
horizontally scroll a grid that has active pinning or sticky docking.

The vertical scroll element is always exposed as `.slick-vertical-scroller`. On the current
single-viewport renderer this is the same element as `.slick-viewport`; pinned/sticky grids keep
the dedicated horizontal scroller separate from it.

### Row Detail and row positioning

Overlay Row Detail is the v11 rendering mode. The inline Row Detail renderer is a compatibility
path in v10 and is removed in v11. Remove `renderMode: 'inline'` and any explicit
`rowTopOffsetRenderType: 'top'`; the transform-based row positioning is the supported mode.

```diff
rowDetailView: {
- renderMode: 'inline',
+ renderMode: 'overlay',
}
- rowTopOffsetRenderType: 'top',
```

If custom CSS or tests relied on `.slick-cell + .dynamic-cell-detail`, target
`.dynamic-cell-detail` directly because the overlay is mounted in a sibling layer.

### Removed aliases and legacy state

The temporary `pinnedColumn` and `pinnedRows` grid-option aliases were removed. Use the nested
`pinning` option. Internal fields such as `frozenVisibleColumnId`, pane references, and frozen
validation branches are no longer part of the public contract and must not be used by framework
integrations or extensions.

### Migration checklist

- Replace `frozenColumn`, `frozenRow`, and `frozenBottom` with `pinning.columns` and `pinning.rows`.
- Convert numeric right-edge requirements to a trailing count or stable id array.
- Add `Column.pinned` or `Column.sticky` where pinning is per-column or scroll-activated.
- Set `Column.pinnable: false` for columns that users must not pin or unpin from the Header Menu.
- Migrate `GridState.pinning` and saved `CurrentPinning` values to the nested shape.
- Add `CurrentColumn.pinning` to custom column presets that preserve individual pin sides.
- Rename `changeColumnsArrangement()` to `applyColumnLayout()`.
- Update header-menu labels/options and custom command handlers for pin/unpin actions.
- Replace pane selectors, pane scroll synchronization, and `-1000px` header workarounds.
- Remove inline Row Detail and `rowTopOffsetRenderType: 'top'` compatibility settings.
- Update Cypress selectors to target docking regions and stable `data-row`/cell indexes.
- Validate RTL, column reorder, row/column spans, variable row heights, editors, and large data
  sets after migration; these features now share one viewport and docking resolver.

If the project is useful to you, please give it a star ⭐ on the
[Slickgrid-Universal](https://github.com/ghiscoding/slickgrid-universal) umbrella project.
