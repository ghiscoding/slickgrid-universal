# PR 1238 compact rewrite — progress handoff

Last updated: 2026-09-02 13:47 EDT

## Goal and architecture

Implement right-side frozen columns and demand-materialized layouts from 6pac/SlickGrid PR 1238 as a breaking, 300–400 net production LOC rewrite.

- `frozenRightColumn` is the number of trailing visible columns to pin. It is clamped so one visible middle column remains after any left freeze.
- This is a real three-band layout, not the discarded CSS-transform prototype.
- Classic SlickGrid pane objects are constructed detached; `setPaneVisibility()` attaches only combinations currently used.
- The optional right-frozen header/top/bottom panes are lazily created by the narrow ~128-line `packages/common/src/core/viewportManager.ts`.
- `ViewportMgr` owns optional DOM materialization only. SlickGrid still owns geometry, scrolling, rendering, row caching, events, and editors.
- Right headers, header-row cells, footer cells, and row cells render into dedicated right containers/canvases.
- Runtime `setOptions()` enable/disable is supported.
- `getCanvases()`, `getViewports()`, and `getTopPanels()` intentionally return connected active elements only (breaking behavior).

All PR conversation comments were read in the initial analysis. The upstream manager was about 1,758 LOC and the PR about +1,534 net production LOC; its generalized layout/compatibility machinery was deliberately not copied.

## Latest browser bugs fixed

### Right rows did not vertically scroll and disappeared

Two causes were fixed:

1. `updateRowCount()` now gives the active right canvas the same virtual content height as the middle canvas.
2. Normal user scrolling updates `prevScrollTop` before `scrollTo()`, so mirroring only in `scrollTo()` was skipped. `syncRightScrollTop()` is now called directly from `_handleScroll()` too.

A regression test dispatches an actual middle viewport `scroll` event and asserts exact right/middle `scrollTop` equality. The user confirmed scrolling works better after this fix.

### Three-band bottom rows were offset by scrollbar height

The right viewports were forced to `overflow: hidden`, so they did not reserve the horizontal scrollbar gutter used by the left and middle viewports. They now keep only vertical overflow hidden and mirror each corresponding classic viewport's horizontal gutter after widths are calculated. The right scrollbar is inert but keeps row heights aligned.

A regression test asserts `overflowX: scroll` for left, middle, and pinned-right bands. The user still needs to visually confirm this latest gutter fix after reloading Example 04.

## Size

Current production delta is approximately **+373 net LOC**, including the complete untracked 128-line `ViewportMgr`. This is inside the agreed 300–400 target.

The final reduction introduced typed helpers for selecting a column's left/middle/right container and local band index, removing repeated branching from headers, header rows, footers, and data rendering.

## Verification

Before the final deduplication, all passed:

```bash
pnpm test --run packages/common/src/core/__tests__/slickGrid.spec.ts packages/common/src/services/__tests__/gridState.service.spec.ts packages/common/src/services/__tests__/grid.service.spec.ts
# 649/649

pnpm exec tsc -p packages/common/tsconfig.json --noEmit --pretty false
pnpm lint
```

After the final deduplication, Common TypeScript and lint passed. The complete focused suite also passed: **651/651 tests** across SlickGrid, ViewportMgr, GridStateService, and GridService.

Manager coverage from the core spec was 100% statements/functions/lines and 80% branches. `viewportManager.spec.ts` was then added for complementary pre-creation, reuse, attach/detach, RTL, and visible-panel paths. Run combined coverage to obtain the final number.

The Cypress regression `test/cypress/e2e/example04-right-freeze.cy.ts` exists, but local Cypress exits with code 132 before tests execute in Electron and Chrome. Do not claim Cypress passed.

## Resume steps

1. Ask whether Example 04 bottom rows are now visually aligned across left/middle/right.
2. Run:

   ```bash
   pnpm test --run packages/common/src/core/__tests__/slickGrid.spec.ts packages/common/src/core/__tests__/viewportManager.spec.ts packages/common/src/services/__tests__/gridState.service.spec.ts packages/common/src/services/__tests__/grid.service.spec.ts
   pnpm exec tsc -p packages/common/tsconfig.json --noEmit --pretty false
   pnpm lint
   ```

3. Run manager coverage:

   ```bash
   pnpm test --run packages/common/src/core/__tests__/slickGrid.spec.ts packages/common/src/core/__tests__/viewportManager.spec.ts --coverage.enabled --coverage.include=packages/common/src/core/viewportManager.ts --coverage.reporter=text
   ```

4. Add focused full-grid cases for `frozenBottom`, right-only vertical scrolling, hidden suffix columns, and RTL geometry.
5. Reconcile old Example 04 Cypress assumptions and document `frozenRightColumn` plus active-only layout getters.
6. Review the final diff for unrelated changes; keep net production LOC at 300–400.

## Workspace notes

- Preserve the user's Example 04 edits: `frozenRightColumn: 2` and `ITEMS_COUNT = 40`.
- The user's Vite watch server is already running.
- Do not edit generated `dist/` output.

## Resume prompt

> Read `PR-1238-PROGRESS.md` and inspect the diff. First confirm the Example 04 three-band scrollbar alignment visually, then run the full focused suite and combined manager coverage after the final deduplication. Add frozen-bottom/right-only/RTL geometry coverage, retain the narrow lazy `ViewportMgr`, and keep production net LOC within 300–400.
