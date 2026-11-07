# Resize by Cell Content - Measurement Rework (v11)

> **Status:** Implemented (unit tests passing, 100% lines/branches on changed code). Vanilla Cypress `example14.cy.ts` passing. Framework `example32.cy.ts` specs passing (Angular/React/Vue/Aurelia). `pnpm build` passing. Source: audit of [6pac/SlickGrid discussion #1329](https://github.com/6pac/SlickGrid/discussions/1329).
>
> Target: `packages/common/src/services/resizer.service.ts` (`ResizerService`), v11 (breaking changes allowed).

## Goal

Improve the accuracy of `resizeColumnsByCellContent()` / `handleSingleColumnResizeByContent()` without growing the bundle,
by replacing the "average char width × length × ratio" estimate with real canvas measurements of a few candidate strings.

Out of scope (rejected, too much code for the benefit): 6pac fitting modes (`sizeToRemaining`, `FitViewportToCols`),
DOM rendering of HTML formatters, plugin split, presets, width caching, `document.fonts.ready` re-measure,
reading rows in view order (`getItem()`).

## Checklist

### 1. Canvas-measure top-K candidates (removes ratio fudging)
- [x] While looping the rows, keep the 10 longest (by char count) distinct stripped strings per column instead of just one.
- [x] After the loop, `measureText()` each candidate with the cell font and keep the widest.
- [x] Reuse one canvas 2D context (`getBrowserCanvas()` currently creates a new canvas every call).
- [x] Remove options (breaking): `resizeByContentOptions.cellCharWidthInPx`, `resizeByContentOptions.defaultRatioForStringType`,
      column `resizeCalcWidthRatio`, column `resizeCharWidthInPx`, and `getAverageCharWidthByFont()` / `_singleCharWidth`.

### 2. Font & padding from CSS (one `getComputedStyle` per resize)
- [x] Font from longhands: `${fontStyle} ${fontWeight} ${fontSize} ${fontFamily}` (the `font` shorthand can be empty in some browsers).
- [x] Cell padding = `paddingLeft + paddingRight + borderLeftWidth + borderRightWidth`.
- [x] `cellPaddingWidthInPx` becomes an optional override (remove its `14` global default).

### 3. Clean-ups / bug fixes
- [x] Off-by-one: `rowIdx > maxItemToInspect` read 1001 rows.
- [x] Remove unused `columnWidths` pre-fill (`originalWidth ?? minWidth ?? 0`), always overwritten.
- [x] Remove duplicate `maxWidth` / `resizeMaxWidthThreshold` clamping from step 1 (kept in step 3).
- [x] Apply `minWidth` last (it was applied before padding, giving `minWidth + padding`).
- [x] Remove no-op `readjustNewColumnWidthWhenOverLimit()` and unused `widthToRemoveFromExceededWidthReadjustment` option.
- [x] Assign `_totalColumnsWidthByContent` once after the loop.
- [x] Fix stale interface JSDoc (defaults, `formatterPaddingWidthInPx` is editor padding).

### 4. Spread sampling
- [x] When `dataset.length > maxItemToInspect`, read every `ceil(length / max)`th item instead of only the first N.

### 5. Header width (opt-in flag)
- [x] New `resizeByContentOptions.includeHeaderWidth?: boolean` (default `false`).
- [x] When enabled, canvas-measure the header title text (`.slick-column-name` text, header font) + header padding/border
      + width of sort indicator / header menu button, and use `max(content, header)`.

### 6. Rename row-count options
- [x] `maxItemToInspectCellContentWidth` -> `sampleSize`, `maxItemToInspectSingleColumnWidthByContent` -> `singleColumnSampleSize` (incl. Salesforce bundle defaults, docs, migration guide & skills).

### Docs, demos & tests
- [x] Update `resize-by-cell-content.md` in `docs/` and the 4 `frameworks/*/docs/` copies.
- [x] Add a v11 migration note (removed options) in `docs/migrations/migration-to-11.x.md` + framework copies.
- [x] Add the same note to the v11 migration AI skills (`docs/migrations/migration-to-11.x/SKILL.md` + framework copies).
- [x] Remove removed options from demos: vanilla `example14.ts`, Angular/React/Vue/Aurelia `example32`.
- [x] Update `resizer.service.spec.ts` (mock `measureText` as `text.length * 7`, new expected widths), 100% coverage on changed file.
- [x] Update Cypress `example14.cy.ts` width & sub-menu alignment assertions (narrower columns change sub-menu side).
- [x] Update framework `example32.cy.ts` `be.gt` width thresholds (Angular/React/Vue/Aurelia), no truncated cells.

## Notes

- 5 candidates was not enough: with ties on char count (e.g. many 20-char product names), the pixel-widest text could be dropped depending on row order, making widths non-deterministic. 10 candidates fixed it and is still negligible cost.
