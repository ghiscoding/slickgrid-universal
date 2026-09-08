# Single-viewport pinning/stickiness POC — progress handoff

Last updated: 2026-09-07 (safe LOC cleanup complete; legacy freeze removal explicitly scheduled immediately after the first PR)

## Goal

Replace SlickGrid's multi-pane frozen-column/frozen-row architecture with an AG Grid-style docking model:

- exactly one live body viewport with one native horizontal scrollbar and one native vertical scrollbar;
- one virtualized DOM row per data row;
- each rendered row contains stable sibling left, center, and right cell regions;
- permanent pinning and scroll-activated stickiness use the same internal docking resolver;
- vertical and horizontal virtualization must remain viable for large datasets;
- this is intentionally a major-version breaking change; compatibility with the old freeze renderer is not a design goal.

The POC supports per-column pinning and the canonical nested `pinning` option.
`pinning.columns.left` accepts an inclusive edge-boundary number for contiguous
left pinning, while `pinning.columns.right` accepts a count from the trailing
edge. Either side also accepts arrays of stable column ids/indexes for
non-contiguous pinning. An inclusive legacy boundary such as `frozenColumn: 2`
is therefore simply written as `pinning.columns.left: 2`; users do not need to
expand it into an index array.
There is no separate `pinnedColumn` or `pinnedRows` grid option; those temporary
aliases were removed after the canonical shape was wired through core and state.
The POC does not target compatibility with the old frozen-pane UX.

The canonical grid-state shape is now a single nested `GridOption.pinning` object:
`{ columns: { left, right }, rows: { top, bottom } }`. `Column.pinned` remains the
per-column representation. `GridService.setPinning()` and `GridStateService` now read
and write the unified shape; sticky configuration remains separate because it has
different scroll-activated semantics. `CurrentColumn.pinning` also carries the
per-column side in column layouts, providing a hybrid preset representation for
consumers that do not want to persist a separate aggregate pinning object.

Vanilla Example 11 serializes the new nested `CurrentPinning` shape in its
saved views and intentionally opts into both pinning header commands to
exercise the new behavior. The single-column menu action calls
`SlickGrid.setColumnPinning` and updates `Column.pinned`; the bulk “Freeze
Columns” menu action now updates `pinning.columns.left`, which applies the same
left pins through the unified pinning resolver. Neither action
changes `frozenColumn` or invokes legacy freeze-width validation. The existing
`hideFreezeColumnsCommand` setting currently controls the bulk command, while
the new `hidePinColumnCommand` setting controls the single-column command.

The header commands are now pinning-aware: bulk actions emit
`freeze-columns`/`unfreeze-columns` for migration familiarity, while the
single-column actions emit `pin-column`/`unpin-column` and use `PIN_COLUMN`/
`UNPIN_COLUMN` labels. None recreates the old two-pane freeze layout.

The POC has now gone through visual hardening and selected Cypress migration. Unit tests,
coverage, the full Cypress matrix, framework validation, and documentation remain follow-up
work after the legacy freeze deletion pass.

## Refactoring status and immediate follow-up

The behavior-preserving cleanup pass is complete, but the refactoring is **not complete**.
The current pass only deduplicated docking-overlay event binding, shared header/footer
scroll forwarding, docking predicates, and repetitive comments. It intentionally did not
remove the legacy frozen implementation because the first PR is being used as the POC
checkpoint.

The legacy freeze/pane removal is the **immediate next task after creating the first PR**;
it must happen before adding more compatibility branches or treating the current code as
the final architecture. The old frozen options, pane fields, synchronized-scroll branches,
validation paths, state/menu plumbing, and frozen SCSS remain temporary and must be deleted
in that follow-up breaking-change pass.

Current working-tree library delta relative to `HEAD` (packages, excluding tests/demos) is
approximately `+2,886 / -387`, or **+2,499 net LOC**. This is a POC snapshot, not the
expected post-cleanup size. Recalculate the production LOC immediately after the legacy
deletion pass; do not use the earlier planning estimate as the final number.

## Maintainability acceptance gate

The original PR 1238 motivation must be reviewed before this work is accepted: frozen panes
made `slickGrid.ts` harder to maintain because ordinary operations had to know about left/right
headers, footers, viewports, and canvases. The single-viewport rewrite is successful only if it
removes that model; it is **not** sufficient to create the old panes and force their options
off at runtime.

The final implementation must satisfy all of the following:

- construct one header, header-row, footer-row, viewport, and canvas rather than creating
  left/right/top/bottom pane elements and detaching most of them;
- make ordinary header/footer creation and column-element lookup direct single-container
  operations, without `hasFrozenColumns()` / `hasFrozenRows()` target selection;
- delete the old frozen option fields, state/menu/service plumbing, pane fields, synchronized
  scroll branches, resize branches, and frozen SCSS instead of retaining a disabled
  compatibility path; this includes the obsolete `-1000px` header-container offset introduced
  for the legacy multi-pane/IE-era renderer;
- keep pinning-specific behavior in the DOM-free `DockingController` plus a small docking DOM
  layer that applies per-row left/center/right regions and pinned chrome offsets;
- remove the obsolete `HEADER_WIDTH_SLACK`/`1000px` header-coordinate workaround as part of the
  rewrite; header titles, grouped headers, and header regions now use ordinary coordinates;
- rename surviving singular DOM fields to neutral names (`_header`, `_headerRow`, `_footerRow`,
  `_viewport`, `_canvas`) so the old `L`/`R` pane model cannot leak back into normal code;
- complete sticky docking or remove any temporary feature-flag path; a dormant sticky API is
  not an acceptable final design.

Do not revive a `ViewportMgr` merely to conceal the old multi-pane renderer. In this design,
deleting the multi-pane renderer is simpler and better aligned with the major-version breaking
change. This gate is a required review item before tests, documentation, or release work begin.

## leftover TODOs identified by user
- [x] Unified grid options support pinning (left, right, top, bottom)
- [x] Header Menu exposes the migration-friendly "Freeze Columns" action and the new single-column "Pin Column" action
- [x] `CurrentColumn.pinning` provides a per-column Grid State/Preset representation alongside aggregate `GridState.pinning`
- [x] Row/body/header/footer docking regions have a predictable left/center/right DOM shape. Row
  regions use the compatibility-oriented names `.slick-pinned-left-cells`,
  `.slick-scrolling-cells`, and `.slick-pinned-right-cells`; they are per-row regions, not old
  full-height panes or independent scroll containers. Header, header-row, and footer regions use
  `.slick-*-columns-left/center/right` wrappers.
- [x] The optional `.slick-docking-overlay` is not created for a grid without row pinning or
  sticky-row configuration. Once row docking is configured, the overlay remains a stable row layer
  even when no row is currently active.
- rowspan z-index is problematic with new docking overlay, need further investigation
- using Cypress with `.scrollTo()` doesn't actually scroll the header titles & scrollbar, but the data is being scrolled
- [x] Legacy freeze validation callbacks are restored at the new pinning API boundary. Requests that
  pin every visible column or whose permanent left/right bands consume the viewport are rejected,
  preserve the previous state, and invoke the configured legacy alert callback/message.
- [x] Header regions expose `.slick-header-columns-left/center/right` (and equivalent header-row/
  footer-row classes), so consumers can identify each region without relying on removed pane roots.
- a11y issues with sticky example when using arrows to navigate, it jumps from a center column to a sticky column, is that expected? I would think that it should rather move the scroll instead and show next data cell instead (that is what we were doing in the legacy freezing, also need to verify new pinning feature).
- probably need more pinning Cypress test in vanilla example04.cy.ts to cover the new feature vs legacy frozen feature.
- why is context menu opened outside of the grid viewport in vanilla example04.cy.ts? The context menu position is unexpected (seemed to be the tests in describe "accessibility sub-menus tests").
- address comment brought up in SlickGrid for new pinning/sticky features:
  > I think the major version would indicate this well enough. yeah its a bit more than a break, its a feature deprecation sort of, but the replacement is subjectively better for me.
  > what the latest push in AI development made me think of though is that we might should start thinking about shipping curated skills along with the library. that would serve two purposes. first, LLMs would know better how to apply specific features from slickgrid on the consumer end. but secondly, the skills could also act as a verification of the docs and thus overall improve the development of new features as LLMs could check up on skills when touching existing features
- identify and document breaking changes (docs folder)
- **IMMEDIATE POST-PR MAJOR CLEANUP:** remove all legacy frozen grid options and the old
  multi-pane renderer immediately after the first POC PR is created. The audit found this
  is feasible, but it requires coordinated refactoring across `SlickGrid`,
  GridState/GridService, header grouping, resizer, extensions, framework wrappers, and
  frozen SCSS. The prior 950–1,560-line deletion estimate is only a planning range; the
  exact production LOC must be measured again after the deletion pass. Do not continue
  layering compatibility branches onto the current hybrid implementation.

## Starting point

- Branch: `master`
- Base commit: `e757539c2`
- Worktree was clean before this POC.
- The earlier `feat/viewport-mgr`/PR 1238 approach was inspected but not reused because it extends the old full-height pane architecture.
- GitHub Discussion 1237 was reviewed for arbitrary sticky rows/columns, pixel budgets, overflow policies, variable row heights, and hierarchical sticky-row semantics.
- AG Grid v36's single-scroll DOM change was used as the structural reference.

## Implemented architecture

### One live scroll viewport

`SlickGrid.activateSingleViewportLayout()` detaches the legacy right and bottom panes from the live DOM and changes the public/internal active collections to one viewport and one canvas:

- `_viewport = [_viewportTopL]`
- `_canvas = [_canvasTopL]`
- the active header/header-row/top-panel/footer collections likewise contain only their left/single instance.

Legacy pane fields still exist temporarily so unrelated old code compiles, but their elements are detached and do not own scrollbars.

### Per-row left/center/right regions

In the single-viewport docking renderer, every rendered row has this shape, including grids
with no active pinned columns (the side regions are then empty and have no active separator):

```html
<div class="slick-row slick-row-docked" role="row">
  <div class="slick-pinned-left-cells" role="presentation">...</div>
  <div class="slick-scrolling-cells" role="presentation">...</div>
  <div class="slick-pinned-right-cells" role="presentation">...</div>
</div>
```

There is no left/right row clone and no second body canvas. `renderRows()` now appends exactly one row node to `_canvasTopL`.

The same stable-region principle applies to chrome. The single header, header-row, and footer
roots each contain persistent `left`, `center`, and `right` semantic wrappers. They use
`display: contents`, so the wrappers do not introduce another layout or scrolling layer.

The center region retains horizontal cell virtualization. Pinned and active sticky cells are always materialized, while ordinary center cells continue to be created/cleaned according to the rendered pixel range.

### Horizontal positioning

The one native viewport scrolls the full-width canvas. The small number of rendered left/right row regions receive `translateX()` updates derived from that single `scrollLeft`:

- left region translation: `scrollLeft`;
- right region translation: `scrollLeft + viewportClientWidth - contentWidth`.

This is necessary for right-pinned cells to be visible immediately. Pure `position: sticky; right: 0` does not pull an element whose natural position starts beyond the right side of a wide canvas into the initial viewport.

The header, header-row, footer, and optional panel content receive whole-layer `translate3d(-scrollLeft, 0, 0)` transforms. Pinned chrome receives the inverse docking offset so it remains fixed at the edge. Horizontal virtual-cell rendering is queued behind the scroll task, and ordinary rows with only leading pinned columns avoid redundant per-scroll style writes because their left region already uses CSS sticky.

The old paired header coordinate trick (`-1000px` on the header root plus `+1000px` on
header-column rules) has been removed from the docking renderer. Header widths no longer include
the `HEADER_WIDTH_SLACK` value, and grouped/pre-header titles use the same normal coordinate
system. This is intentional cleanup for the major-version rewrite; the offset was layout
technical debt from the old pane renderer, not a pinning or virtualization requirement.

An attempted shared sticky-canvas coordinate system was **reverted** because it broke the far-right scroll geometry (visible blank space and header/body misalignment). The replacement preserves the canvas as a normal full-width element and moves horizontal scrolling to one dedicated scrollbar overlay aligned with the body viewport. The body viewport is now vertical-only; its canvas, the pinned-row overlay, headers, header row, footer, and optional panels all receive the same `translate3d(-scrollLeft, 0, 0)` from the dedicated scrollbar's scroll event. A pair of scoped CSS variables applies the inverse offset to left/right pinned regions and pinned chrome, so regular rows no longer receive individual JavaScript positioning writes during horizontal scrolling. This is the POC's current attempt to remove native-body/header visual tearing while retaining a single horizontal scrollbar and normal canvas scroll extent; it still needs visual confirmation.

The always-created right-region wrapper is now marked active only when right pinning has a non-zero width. This prevents a zero-width `slick-pinned-right-cells` region (present for the stable left/center/right row shape) from drawing a spurious pinned-border line in left-only pinning scenarios.

The pinned-row overlay now uses the full canvas/docking content width rather than the visible viewport width and is refreshed after every canvas-width update. Since the dedicated horizontal scrollbar translates the overlay by `-scrollLeft`, a viewport-sized (or stale) overlay would clip itself and expose a trailing blank square as soon as it scrolled right. The top pane remains the clipping boundary.

Example 04 keeps `enableAutoSizeColumns: true` to preserve the existing option
contract. The shared resizer service invokes `autosizeColumns()` after
browser/container resize, and the pinning layout must continue updating its
canvas, proxy scrollbar, and docked regions correctly when those widths change.

Example 04 now exercises both docking edges by default: the first three columns are pinned left and the final `Action` column is pinned right. A separate `Pinned Right` count control updates the right band dynamically; setting it to zero removes right pinning, and the existing remove button clears both edges.

### Unified docking resolver

New DOM-free `DockingController` resolves both axes:

- permanent left/right columns;
- center columns and their natural offsets;
- sticky left/right columns activated only after they have been fully seen and then clipped;
- permanent top/bottom rows;
- sticky rows activated after they have been fully seen and scroll past the top edge;
- viewport-percentage pixel budgets;
- `conveyor`, `clamp`, and `priority` sticky overflow policies;
- revision counters so DOM membership changes happen only when a docking boundary is crossed, not on every scroll pixel.

Scroll-activated sticky docking is now enabled through the same resolver as permanent pins.
Example 47 uses it for Q1–Q4 and its three summary rows. The transition path
still needs visual validation before this can be considered production-ready.

`sticky: true` means the leading edge (`left` in LTR and `right` in RTL). Explicit `'left'` and `'right'` remain physical edges.

### Sticky feasibility and quarterly-style groups

The current pinning implementation is a viable base for sticky columns/rows. Permanent
pins and scroll-activated sticky items already resolve into the same left/center/right and
top/bottom bands, and both kinds of item can be represented by the same per-row regions.
Completing the existing sticky path should therefore be an incremental change rather than a
second rendering architecture:

- keep the single native horizontal and vertical scrollbars;
- let the controller activate/deactivate sticky candidates only when a visibility boundary is
  crossed (not on every scroll pixel);
- keep center cells horizontally and vertically virtualized; only configured pinned/sticky
  cells and rows are materialized outside the normal range;
- use the same width/height budgets, hysteresis, resize invalidation, and overlay stacking
  already needed for permanent pins.

For a basic sticky-column/sticky-row feature (including coexistence with permanent pins), a
rough **+150 to +300 library LOC** is expected after the current POC is cleaned up. Most of
that work is transition edge cases: large scroll jumps, RTL, resize/reorder, variable row
heights, and deciding how sticky rows are pushed off when several candidates compete.

The user's quarterly example is also feasible, but there are two different scopes:

1. If Q1/Q2/etc. are ordinary columns with `sticky: 'left'` (or a runtime sticky callback),
   the basic estimate applies.
2. If Q1 is a group header spanning January–March and the group itself must remain visible,
   grouped-header metadata and a separate sticky group-header layout are required. That is
   approximately **+150 to +300 additional library LOC**, with explicit rules for groups that
   cross a pinned/center boundary and for push-off/replacement as the next quarter enters.

This is still compatible with permanent pinning: a permanent pin always wins its edge budget,
while sticky candidates use the remaining center viewport. The performance model remains
O(configured sticky candidates) per scroll event and O(1) DOM work between boundary crossings;
large datasets continue to render only the normal virtual range plus the small docked set.
Sticky activation is enabled for Example 47's quarterly columns. Permanent pinning and sticky
transition visuals still require the same acceptance review before the API is finalized.

### Pinned/sticky rows and virtual scrolling

Pinned row references are resolved to row indexes and cached. With a plain array, resolving a string ID may scan the dataset once; subsequent vertical scroll events are O(number of configured docked rows). With a SlickDataView, `getRowById()` is used when available.

The normal virtual rendered range is unchanged. Only configured top/bottom rows are additionally rendered, so a million-row dataset does not produce a million-row DOM.

Pinned and active sticky rows reuse their normal cached row element, but are reparented into a small overlay outside the scrolling canvas. Their vertical `top`/`bottom` coordinates are constant during scrolling; only the center cell region follows horizontal scroll. No additional tall top/bottom canvas is created.

Pinned rows now live outside the scrolling canvas, so their vertical coordinate does not
change as `scrollTop` changes. Transforms remain available for ordinary rows because a
growing transform on a row inside the scrolling canvas produced visible jumps during
virtual-page recycling. Virtual-page changes update row positions only after the physical
scroll position and page offset have both been committed, avoiding a transient mixed-coordinate
frame. Pinned region boundaries use the existing `--slick-frozen-border-right` and
`--slick-frozen-border-bottom` theme variables for body rows and column chrome. The horizontal
row boundary is emitted only on the last top-pinned row (or first bottom-pinned row), rather
than repeating across every pinned row. Per-scroll vertical updates no longer rewrite pinned rows; normal
virtual rows are repositioned only when a page offset actually changes. The overlay now
inherits the normal grid-cell typography, borders, alternating backgrounds, and selection
styles, and is stacked above hovered scrolling rows so the pinned content cannot show through.
Header-row and footer cells in pinned bands now receive explicit border-box widths, so filter
controls track left- and right-pinned column resizing equally.
Their width calculation now preserves content-box semantics and subtracts each element's
horizontal padding/border from the rendered header width, preventing fractional header/body
boundary offsets.
Pinned body-region borders no longer consume the measured content width (`content-box`), keeping
body cell widths consistent with the fractional header/filter widths.
Column-resize auto-scroll is now limited to center columns; resizing a permanently pinned
right column no longer forces the native horizontal viewport to jump to its maximum position.
Pinned body regions and header/filter/footer chrome now use opaque theme backgrounds and a
dedicated stacking layer, preventing center cells or hovered rows from painting over pinned
content during width updates.
For ordinary scrolling rows, the permanently left-pinned region uses native CSS sticky
positioning at the leading edge. The canvas and pinned-row overlay now share the same
CSS-variable horizontal transform as headers and filters, while scroll-activated sticky docking
remains disabled.

## New POC APIs

### Column definition

```ts
interface Column {
  pinned?: 'left' | 'right' | null;
  sticky?: 'left' | 'right' | 'both' | boolean;
}
```

Examples:

```ts
{ id: 'title', field: 'title', pinned: 'left' }
{ id: 'total', field: 'total', pinned: 'right' }
{ id: 'country', field: 'country', sticky: true }
{ id: 'quarter1', field: 'quarter1', sticky: 'both' }
```

### Grid options

```ts
interface GridOption {
  pinning?: {
    columns?: {
      left?: number | Array<number | string>;
      right?: number | Array<number | string>;
    };
    rows?: {
      top?: Array<number | string>;
      bottom?: Array<number | string>;
    };
  };
  stickyRows?: {
    top?: Array<number | string>;
    bottom?: Array<number | string>;
    both?: Array<number | string>;
  };
  docking?: {
    maxColumnViewportWidthPercent?: number; // default 60
    maxRowViewportHeightPercent?: number;  // default 60
    overflowStrategy?: 'conveyor' | 'clamp' | 'priority';
    stickyHysteresis?: number;              // default 2px
  };
}
```

Row references can currently be row indexes or values from `datasetIdPropertyName` (default `id`). Numeric references prefer row-index semantics when they are within the current data range.

The unified `GridOption.pinning` shape now owns both column bands and row bands
(`pinning.columns.left/right` and `pinning.rows.top/bottom`). `Column.pinned`
remains the per-column representation for explicit/non-contiguous pinning.
Runtime updates and state serialization use the nested shape so initial options,
dynamic updates, and grid-state persistence cannot drift apart.

### Runtime grid methods

```ts
grid.getPinnedColumns(side?);
grid.setColumnPinning(columnId, 'left' | 'right' | null);
grid.setColumnStickiness(columnId, true | false | 'left' | 'right' | 'both');
```

Rows are changed through `grid.setOptions({ pinning: { rows }, stickyRows })`.
`stickyRows.top` docks a seen row after scrolling below it, while `stickyRows.bottom`
docks a seen row after scrolling back above it. `stickyRows.both` chooses the closest vertical
edge after normal scrolling would clip the row.

## Example 04 conversion

Vanilla Example 04 now loads the equivalent of its previous configuration through the new APIs:

- previous `frozenColumn: 2` becomes `pinning.columns.left: 2`; core expands that
  inclusive boundary to the first three final visible columns (checkbox, title,
  percent complete). Explicit arrays remain available for non-contiguous pins;
- previous `frozenRow: 3`/top becomes `pinning.rows.top: [0, 1, 2]`;
- the existing column-count, row-count, remove, set-three, top/bottom, and large-width controls now mutate the nested `pinning` option;
- legacy Grid Menu/Header Menu freeze commands remain available when configured, but now write
  the canonical `pinning` state instead of recreating frozen panes;
- the page title identifies it as the single-viewport POC.

Some variable/function names and Cypress `data-test` attributes still say `frozen` to keep the example diff focused. They can be renamed after the POC is accepted.

## Example 47 — sticky financial-report fixture

Vanilla Example 47 reproduces the report shape from Discussion 1237's animated mockup:

- the example intentionally has **no permanent pins**;
- `Account`, Q1–Q4, and YTD retain their natural locations and declare `sticky: 'both'`, so
  each docks to the nearest edge only after scrolling would clip it;
- the three report totals (`Total Revenue`, `Total Expenses`, and `Net Profit`) declare
  `stickyRows.both`, so they dock to whichever vertical edge is closest after they have been
  seen; they retain the dark summary band from the mockup;
- follow-on Capex, headcount, R&D, grants, FX, and provisions rows remain after Net Profit,
  allowing the statement totals to be crossed in both vertical scroll directions;
- a small horizontal auto-scroll control makes it easy to inspect the eventual sticky
  transitions without manually dragging the scrollbar.

Example 47 is the primary fixture for validating sticky columns, future sticky summary rows,
and later group-header behavior without conflating those semantics with Example 04's
permanent-pinning controls.

## User-observed status

- Initial load first failed in `getHeaderChildren()` because column resize assumed `_headers[1]` existed.
- That was fixed by flattening the connected header collection.
- SortableJS no longer assumes or creates a connected second header instance.
- The user subsequently reported no more console errors before the Example 04 API conversion.
- Visual correctness after the final Example 04 conversion and right-edge transform change still needs user confirmation.
- Sticky columns are enabled in Example 47 for Q1–Q4; their large-scroll, resize, RTL, and
  multi-sticky visual behavior still needs manual confirmation.
- The stable docking-region DOM is now implemented and the old 1000px header offset has been
  removed. Header/row/footer regions and per-row body regions should now be selected by their
  explicit left/center/right classes rather than by legacy pane roots.

## Files changed

Core implementation:

- `packages/common/src/core/dockingController.ts` — new shared docking resolver.
- `packages/common/src/core/slickGrid.ts` — single live viewport, stable header/body regions,
  per-row pin/sticky routing, scrolling, row caching, runtime API, validation, and hit-testing fixes.
- `packages/common/src/services/headerGrouping.service.ts` — grouped/pre-header titles now use
  normal coordinates without the legacy 1000px offset.
- `packages/common/src/styles/slick-grid.scss` — three-region row layout and docked stacking styles.
- `packages/common/src/core/index.ts` — public controller exports.

Public types:

- `packages/common/src/interfaces/docking.interface.ts`
- `packages/common/src/interfaces/column.interface.ts`
- `packages/common/src/interfaces/gridOption.interface.ts`
- `packages/common/src/interfaces/index.ts`

POC demonstration:

- `demos/vanilla/src/examples/example04.ts`
- `demos/vanilla/src/examples/example04.html`
- `demos/vanilla/src/examples/example47.ts`
- `demos/vanilla/src/examples/example47.html`
- `demos/vanilla/src/examples/example47.scss`

## Validation completed

The following implementation-only checks passed:

```bash
pnpm --filter @slickgrid-universal/common exec tsc --noEmit --pretty false
pnpm --dir demos/vanilla type-check
pnpm exec oxlint packages/common/src/core/slickGrid.ts
pnpm exec prettier --write <changed TypeScript/HTML/SCSS files>
git diff --check
```

Static validation for the recent cleanup passed: common-package TypeScript, Oxlint,
Prettier, and `git diff --check`. The framework Cypress TypeScript configs also pass after
the custom-command typing fix. The root Cypress config still reports unrelated existing
errors in `test/cypress/support/common.ts` and `test/cypress/support/index.ts`; a Cypress
run in the current agent environment exits with code 132 before browser startup.

The Cypress custom-command return-type fix was applied consistently to the root, Angular,
Aurelia, React, and Vue support copies: `getCell`/`getNthCell` now return
`Chainable<JQuery<HTMLElement>>`, and `convertPosition` has its concrete chainable shape.
Do not undo this narrowing when revisiting Cypress typings. The remaining root support errors
are separate pre-existing typing issues and should be handled independently.

## Current production LOC delta and cleanup estimate

These are rough **library-only** figures for `packages/common` (including SCSS and public
interfaces, excluding Example 04, tests, generated output, and framework-wrapper changes).
They are calculated from the current diff, counting the two new files as additions:

- current working-tree library diff: approximately `+2,886 / -387`, or **+2,499 net LOC**
  relative to `HEAD` (packages, excluding tests/demos);
- this includes the new `DockingController` and docking types, single-viewport/per-row
  routing, sticky/pinning hardening, and the pinning/docking stylesheet changes;
- this is not the expected final size because the old frozen-pane implementation is still
  present and forcibly disabled for the POC.

The earlier 800–1,200-line removal estimate is retained only as a planning range. It is not a
final forecast: the exact permanent-pinning LOC must be measured immediately after deleting
the old full-height pane/frozen-row/frozen-column plumbing, core branches, option/state/menu
wiring, and frozen SCSS.

Hardening basic sticky columns/rows would add roughly **+150–300 LOC**, giving an estimated
**+120 to +670 net LOC** after cleanup. Supporting grouped quarterly sticky headers would add
another **+150–300 LOC**, for an estimated **+270 to +970 net LOC** in the broader design.
These ranges are planning numbers, not a final count; the deletion pass and grouped-header
requirements are the two largest sources of variance.

## Known limitations and likely breakage

### Latest visual fixes (2026-09-03)

- The dedicated horizontal scrollbar now reserves its measured height from the live body viewport. Unlike the native scrollbar it replaces, the proxy is absolutely positioned and otherwise covered the last fully scrolled row.
- Financial-report summary rows now force their dark foreground/background palette on individual cells, including when a sticky row is moved to the docking overlay; this prevents an inherited canvas background from making Total Expenses unreadable.
- Bottom sticky-row activation now tests the row's bottom edge rather than its top edge. Bottom candidates are resolved upward from the viewport edge, reserving the height of each already-docked row; a preceding summary therefore docks against Net Profit rather than one full row-height late.
- Sticky-row transitions use the exact top/bottom boundary instead of the configurable 2px column hysteresis, preventing an otherwise visible 1–2px snap into the docking overlay.
- Example 47's sticky candidate and active sticky cells/headers now consistently use the exact `#e4edf7` report blue with higher CSS priority than odd-row striping; docking no longer darkens the cells.
- Horizontal sticky-column thresholds and cell coordinates now use the visible body width (excluding the vertical scrollbar gutter), preventing right stickies from activating 10–15px late. Scroll transitions commit the current header transform before measuring right chrome, avoiding stale left/right header offsets when the right sticky set changes.
- The initial leftmost sticky-column pass now seeds configured candidates as eligible, allowing offscreen-right Q3/Q4/YTD columns to dock immediately at load instead of requiring a right-and-back scroll first.
- The initial top sticky-row pass likewise seeds configured rows as eligible, allowing two-sided report summary rows to dock at their nearest vertical edge immediately at load.
- Example 47's YTD definition now retains the shared sticky-candidate classes when adding its YTD-specific classes, so it keeps the sticky blue background even when it reaches its natural right edge and Q4 takes over the separator.
- Added a higher-specificity right-edge separator rule for header, header-row, and footer chrome so the first right-sticky column title/filter receives the same `--slick-frozen-border-right` separator as the body region.
- Removed the non-user-facing Example 47 auto-scroll control and timer; the fixture now uses only normal manual grid scrolling.
- Draggable Grouping now tolerates the single-viewport layout: it creates a Sortable instance only for header containers that actually exist, instead of passing a removed right header (`null`) to SortableJS.
- Pinned left/right edge header-row and footer cells now use border-box sizing with the full measured header outer width. This keeps an empty edge filter cell aligned with its data cells when the pinning separator contributes a border (for example, 100px data cell versus 98px header-row cell).
- The single horizontal scrollbar proxy now has an opaque canvas background, themed `scrollbar-color`, pointer events, and an isolated stacking context. Its z-index remains above grid rows but below application overlays such as Bulma navbar menus, and its track is aligned to the pane content edge.
- The docking scrollbar now uses `overflow-x: auto` and sizes its spacer from the natural docking content width. When all columns fit the viewport, the proxy has zero height and no horizontal track is shown; when overflow exists, its height still comes from the measured native scrollbar dimensions.
- The full-width docked-row overlay now uses a scroll-aware clip window equal to the viewport's content width. It can still retain enough translated width for right-pinned cells, while excluding the native vertical scrollbar strip from overlay painting.
- The docked-row overlay stacking layer is now `z-index: 5`, matching the normal pinned-row layer. This keeps pinned rows above scrolling cells but below application overlays such as Bulma navbar dropdowns (`z-index: 20`).
- In single-viewport mode the header-row scroller now gets an opaque header-row background. Its unused trailing gutter (the body viewport's scrollbar space) no longer reveals translated center columns when widths change; logical right-pinned column widths remain unchanged.
- The right-edge pinned header-row cell now extends by the measured vertical scrollbar width when that scrollbar is present. This fills the header-only gutter directly while leaving body cells and right-pinning offsets at their normal widths.
- The right-edge pinned header-row cell is positioned by the computed physical separator border width (with RTL-aware direction), rather than a hard-coded 1px, to match customized or hidden borders.
- Example04 now clears the opposite `pinning.rows` side when toggling top/bottom. This is required because `setOptions()` deep-merges nested option objects; supplying only `{ bottom }` previously left the old top references active.
- Example04 bottom mode now pins the last configured rows instead of reusing indexes `0..N`. This matches the former `frozenBottom` behavior and prevents the first rows' natural slots from becoming blank when they move to the bottom overlay.
- Docked left/right row regions now mirror odd-row striping and hover backgrounds. Their opaque pinning backgrounds no longer hide the configured gray odd-row color.
- Docked rows no longer receive the legacy active-row padding, preventing every cell in a clicked row from shrinking. Active-cell coordinate resolution now handles rows rendered in the docking overlay, allowing editors to open on top-pinned cells.
- Docked rows now receive an explicit resolved `rowHeight` inline, including the default value. This prevents active/editor box-model styles from reducing a configured 45px row to its 35px content height.
- Cell interaction handlers are bound to the docking overlay as well as the canvas, enabling click/auto-edit and double-click editing for top- and bottom-pinned rows.
- Example04 includes a Toggle Right Pinning button that switches the right-pinned Action column on/off while preserving the configured left pins.
- `internal_setOptions()` now renders after `setColumns()` invalidation. This fixes dynamic row-pinning count changes, which were previously rendered and then cleared when the column refresh removed cached rows.
- `setOptions()` now replaces `pinning.rows.top`/`bottom` arrays atomically instead of deep-merging them. This removes stale row references when the configured pin count decreases.
- Browser grow-after-shrink handling now separates the natural column-content width from the rendered docked-row width. The canvas and row center region grow to at least the body viewport, preventing a white gap before a right pin; right-pinned body regions use the rendered-width offset while header chrome retains natural scroll coordinates. Right-pinned header cells are also taken out of flex flow and explicitly positioned, so their titles remain at the visible right edge. The inner header/header-row/footer column containers now allow this docked chrome to overflow to their existing outer viewport clip; the old inner `overflow: hidden` was clipping every right-pinned header title and filter. This needs visual confirmation in Example 04 after shrinking the browser and restoring it to full width.
- Right-pinned header chrome no longer uses the shared natural-content transform used by row regions. Each right-pinned header/header-row/footer cell is positioned at its direct viewport coordinate (`scrollLeft + viewportWidth - rightBandWidth + columnOffset`) inside the already translated chrome layer. This fixes titles landing beside a center column and supports multiple right-pinned columns; visual confirmation remains pending.
- The viewport width used for right-pinned chrome is now read from the header scroller itself, rather than from the horizontal-scroll proxy. The proxy can retain a stale narrow width during resize (for example, yielding `left: 1537px` from a 1637px proxy for a 100px column), while the header scroller is the actual visible clip boundary. Visual confirmation is pending.
- The legacy `-1000px` header-container / `+1000px` header-column coordinate pair has now been
  removed from the single-viewport renderer and grouped-header service. Header widths no longer
  include the corresponding 1000px slack. If any remaining legacy pane path is temporarily
  exercised during migration, it must not be mixed with the new docking coordinate system.
- Bulk Freeze/Unfreeze migration state is keyed by stable column IDs rather than
  column object identity. This preserves the generated-pin bookkeeping across
  `updateColumnProps()` cloning and makes the existing `Unfreeze Columns` command
  reliably restore the pre-freeze pin state.
- Sticky-column horizontal scrolling now keeps the scrollbar/compositor path
  immediate while coalescing sticky-band resolution to one animation-frame pass.
  On a band transition, rendered cells are moved between their existing
  left/center/right row regions instead of being discarded and reformatted; the
  same frame updates only those row-wrapper dimensions and lets the regular
  deferred virtualizer fill missing cells. A full row rebuild remains only as a
  safe fallback when a layout gains its first docking region. Permanent-pinning-
  only grids retain the synchronous fast path; visual validation of Example 47
  is still required.
- Empty left docking regions no longer paint the left separator: the pinned
  border is now enabled only while the left region contains an active docked
  column, including when sticky membership changes during scrolling.
- Right-edge sticky/pinned header, header-row, and footer chrome now offsets
  its physical start coordinate by the configured separator border width, so
  the title/filter border aligns with the body separator for any border size.
- Vanilla Example 11 view presets now retain and restore the complete pinning
  state again. Creating/updating a view serializes `GridState.pinning`, reset
  clears permanent pinning, and selecting a view reapplies pinning after its
  column layout (the required order for hidden/reordered columns).
- Removed the duplicate `pinnedColumn` and `pinnedRows` grid options. Header-menu
  bulk freeze/unfreeze and row docking now write/read the canonical `pinning`
  object directly; `Column.pinned` remains available for explicit per-column pins.
- Reworked the Vanilla Example 04 Cypress spec for the persistent docking DOM:
  header assertions now query `.slick-header-column` descendants, row assertions
  target `data-row` plus cell index, and no-pinning checks expect stable empty
  left/right regions rather than removed panes. Previously skipped autocomplete,
  header-menu, accessibility, large-scroll, and reorder cases are enabled again.
- Restored the legacy invalid-hide alert contract for pinning. `validateColumnFreeze()`
  now validates the prospective visible set against the canonical pinning layout,
  so hiding the last available center column is rejected without mutating the grid.
- Column reorder now creates Sortable instances for the persistent left, center,
  and right docking wrappers and combines their order on drop. This keeps drag
  auto-scroll and reorder functional after the old right pane is removed.
- Sticky transitions now rehome header titles, header-row filters, and footer
  cells into the same persistent left/center/right wrappers as their body cells,
  then restore column order within each wrapper. This fixes the intermittent
  Example 47/48 state where body Q2/Q3 had moved bands but their chrome remained
  in the old wrapper and appeared misaligned while scrolling. Left-band chrome
  now uses the grouped wrapper flow rather than subtracting its old natural
  center-column offset, keeping Q1/Q2 visible at the far-right scroll position.
- Docking chrome now keeps the region bands as direct `.slick-header-columns`
  (and equivalent header-row/footer) children of a separate `*-columns-root`.
  This preserves the legacy selector contract where `.slick-header-columns`
  `.children()` are actual cells, while still exposing stable left/center/right
  region classes for pinning/sticky grids. Empty explicit pinning keeps the row
  bands stable; grids with no pinning configuration remain flat.
- Tightened docking activation so an empty `pinning.columns` state does not
  create nested header wrappers, while an explicitly pinning-configured grid
  retains predictable row-region DOM after clearing pinning. Fixed the related
  TypeScript narrowing error in `hasConfiguredRowDocking()`.
- Example 04 vertical-scroll coverage now uses rows that exist in its 40-item
  fixture, resets both scroll owners between suites, and identifies reordered
  columns by stable IDs. With the dev server running, Firefox headless Cypress
  passes all 42 Example 04 tests with retries disabled. Electron cannot start in
  this environment because its bundled binary exits with SIGILL.
- Example 04's large-column action now applies its explicit layout before
  applying pinning. This avoids validating stale, previously resized widths and
  accidentally clearing pinning (which removed the center docking region before
  the final drag/reorder test).
- Added dedicated right-pinning coverage to Example 04: multiple right columns,
  header/header-row regions, horizontal-scroll retention, numeric disable/re-enable,
  removing the first right-pinned column, and restoring the hidden edge column.
  The focused Firefox spec now passes all 46 tests.
- Example 04 now explicitly enables `showHeaderRow`. The persistent docking
  header-row root also receives `headerRowHeight`; without that root height,
  `display: contents` band wrappers collapsed the visible filter bar to the
  1px spacer height.
- Example 17 Cypress migration is in progress. Its demo now uses canonical
  `pinning` instead of inert frozen options, and the shared drag helper reads the
  docking horizontal scrollbar for single-viewport grids. Active canvas/viewport
  fallback now also supports drag selection from pinned-row overlays. A related
  `scrollRowIntoView()` fix accounts for top/bottom docked-row height when
  determining the usable center viewport. Firefox currently reports 12 passing,
  1 pending (the intentionally skipped grouping auto-scroll case), and one
  remaining bottom-edge assertion that still needs follow-up; do not spend more
  migration time here until the other spec failures are triaged.

1. **Legacy freeze code is inert, not fully deleted.** `setFrozenOptions()` forces `frozenColumn`/`frozenRow` to `-1` and `frozenBottom` to `false`. Many dead fields, branches, validation callbacks, services, grid-state shapes, styles, and public option types remain and must be removed after acceptance.
2. **Old options intentionally no longer work.** `frozenColumn`, `frozenRow`, and `frozenBottom` are not valid ways to configure this POC. The existing `Freeze Columns` menu label remains for migration familiarity, but its implementation writes the canonical `pinning` option. `GridService.setPinning()` accepts the unified nested shape.
3. **Visual/browser validation is incomplete.** Left/right pinning, bottom rows, sticky transitions, resize, reorder, RTL, variable row height, row/column spans, editors, selection, and all four framework wrappers need manual follow-up.
4. **Colspans crossing docking bands are not defined.** A colspan beginning in one band and ending in another can produce incorrect geometry. The final design should reject, split, or explicitly define this case.
5. **Grouped/pre-header chrome is not dock-aware yet.** Standard column headers, header-row cells, footer cells, and body cells are wired. Multi-level/group header layout needs a dedicated band implementation.
6. **Sticky activation can be skipped by a very large scroll jump.** Candidates currently must first be fully visible. A final implementation should detect that the scroll path crossed a candidate even if no intermediate frame showed it fully.
7. **Numeric row reference ambiguity.** An in-range number is treated as a row index before it is treated as a dataset ID. A tagged `{ id } | { index }` row reference would remove this ambiguity.
8. **Pinned rows remain part of the normal dataset height.** They reuse/move the real row node and their natural dataset slot remains represented in scroll geometry. Confirm this product semantic against the desired AG Grid behavior.
9. **Permanent pin over-allocation is rejected at the API boundary.** Pinning every visible
   column or consuming the whole viewport invokes the configured legacy validation callback and
   leaves the prior pinning state intact. The final API may still rename those legacy callback and
   message options during the cleanup pass.
10. **Column reorder policy is undecided.** The visual order groups permanent pins at the edges, but dragging between center and pinned regions does not yet automatically change `pinned` state.
11. **Header Menu terminology is provisional.** The bulk `Freeze Columns` command is
    retained as a migration-friendly label and writes `pinning.columns.left`; the
    single-column `Pin Column` command writes `Column.pinned`. Add explicit left/right
    submenu actions only if the final public UX requires them.
12. **Public controller surface is provisional.** `DockingController` is currently exported for the POC; it may be better kept internal in the final API.
13. **No compatibility/migration layer is intended.** Any temporary legacy fields should be deleted, not deprecated, once this direction is approved.

## Resume checklist

1. Reload Vanilla Example 04 and confirm:
   - only one horizontal and one vertical scrollbar are visible;
   - checkbox/title/percent-complete stay pinned left;
   - the first three rows stay pinned top;
   - toggling rows to the bottom works;
   - widening the first three columns preserves the right/center layout;
   - cell clicking, editing, filtering, resizing, and horizontal scrolling still work.
2. Add at least one temporary right-pinned column in Example 04 and confirm it is visible before horizontal scrolling and remains aligned vertically/horizontally.
3. Use Example 47's Account/Q1–Q4/YTD sticky columns and bottom sticky totals to confirm activation/deactivation/hysteresis. Add a top sticky-row counterpart only after deciding its report hierarchy/push-off behavior.
4. Fix visual/interaction problems before adding tests.
5. Review the implemented unified `GridOption.pinning` shape and `CurrentColumn.pinning` precedence before freezing the public API. The former `pinnedColumn`/`pinnedRows` shorthands have been removed.
6. Review the provisional Header Menu terminology: retain `Freeze Columns` only as the
   migration-friendly bulk command while the POC is being validated, and keep `Pin Column`/
   `Unpin Column` for the single-column action. Remove the legacy terminology during the final
   major-version API cleanup if the migration window no longer requires it.
7. Immediately after the first PR is created, delete the old pane-freezing implementation rather than layering compatibility over it:
   - remove frozen options/defaults/validation/messages;
   - remove right/bottom pane fields and DOM construction entirely;
   - collapse canvas/viewport/header collections to single objects where practical;
   - remove old synchronized-scroll branches;
   - replace `CurrentPinning`, GridService, GridStateService, menus, and extensions with the new shapes;
   - remove obsolete frozen SCSS and framework assumptions.
8. Recalculate production LOC after the deletion pass.
9. Only then begin unit, coverage, Cypress, framework, documentation, and migration work.

## New-context handoff checklist

- Treat this file and the current working tree as the source of truth; do not restart the POC
  from the old PR 1238 frozen-pane branch.
- The safe cleanup pass is finished, but no claim has been made that the full refactor is done.
  The first PR checkpoint may still contain temporary frozen code; delete it immediately after
  that PR is created.
- Before changing layout code, preserve the current invariants: one native horizontal scroll,
  one native vertical scroll, one rendered row with left/center/right regions, stable header /
  header-row / footer region wrappers, and one shared `DockingController`.
- Re-run the focused checks after edits. A browser/Cypress failure in the current agent
  environment may be infrastructure-related when the process exits with code 132 before
  browser startup; distinguish that from a real spec failure.
- When the legacy deletion pass begins, audit every reference to frozen options, pane roots,
  synchronized scroll branches, header-width slack, frozen SCSS, GridState/GridService,
  resizer, header menus, extensions, and all four framework wrappers. Then recalculate LOC
  from `git diff HEAD` and update this file again.

## Suggested resume prompt

> Read `PINNING-POC-PROGRESS.md` and inspect the current diff. This is a major-breaking
> single-native-scroll pinning/stickiness rewrite, not an extension of SlickGrid frozen panes.
> The immediate task after the first PR is to remove all dead freeze/pane code. Preserve one
> live viewport, one row node with left/center/right cell regions, and the shared
> `DockingController`; do not add more frozen compatibility branches. Coordinate the deletion
> across `SlickGrid`, GridState/GridService, header grouping, resizer, extensions, framework
> wrappers, menus, and frozen SCSS, then run focused Cypress specs and recalculate the
> production-library LOC.
