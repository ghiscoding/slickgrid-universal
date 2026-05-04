# Formatted Data Cache - Implementation Notes

> **Status:** Implemented on the current branch.
>
> Current state:
> - `SlickDataView` cache infrastructure is implemented.
> - `SlickGrid` cell-display cache integration is implemented.
> - `ExcelExportService` export-cache integration is implemented.
> - `PdfExportService` export-cache integration is implemented.
> - `TextExportService` export-cache integration is implemented.
> - Unit tests cover cache-off, cache-miss, and cache-hit parity for export helper paths.
> - Focused regression tests cover sanitize/decode-sensitive cache-hit output paths used by PDF/Text export.
> - Focused export specs and build are passing on the current branch.

---

## What it does

When `enableFormattedDataCache: true` is set in grid options, `SlickDataView` asynchronously
pre-computes and caches two kinds of formatter output in the background:

| Cache | Keyed by | Used by |
|---|---|---|
| `formattedDataCache` | `itemId -> columnId -> string` | Export services (Excel, PDF, Text/CSV) |
| `formattedCellCache` | `itemId -> columnId -> FormatterResult` | `SlickGrid` cell rendering (raw formatter result, excluding live DOM cache writes) |

Both caches are keyed by **item ID** (not row index), so they remain valid across sort and filter
operations.

---

## Key files

| File | Role |
|---|---|
| `packages/common/src/core/slickDataview.ts` | All cache logic lives here |
| `packages/common/src/core/slickGrid.ts` | `getFormatter()` wraps the resolved formatter to hit `formattedCellCache` first |
| `packages/excel-export/src/excelExport.service.ts` | Reads `formattedDataCache` via `getFormattedCellValue()` |
| `packages/pdf-export/src/pdfExport.service.ts` | Reads `formattedDataCache` in regular-row export path before formatter fallback |
| `packages/text-export/src/textExport.service.ts` | Reads `formattedDataCache` in regular-row export path before formatter fallback |
| `packages/common/src/interfaces/formattedDataCache.interface.ts` | Event arg interfaces |
| `packages/common/src/interfaces/gridOption.interface.ts` | `enableFormattedDataCache`, `formattedDataCacheBatchSize`, `formattedDataCacheFrameBudgetMs` |
| `packages/common/src/global-grid-options.ts` | Defaults: `enableFormattedDataCache: false` |
| `packages/common/src/formatters/formatterUtilities.ts` | Shared formatter/export helpers |

---

## Grid options

```typescript
// packages/common/src/interfaces/gridOption.interface.ts
enableFormattedDataCache?: boolean;        // default: false - opt-in
formattedDataCacheBatchSize?: number;      // default: 300  - max rows processed per frame
formattedDataCacheFrameBudgetMs?: number;  // default: 8ms  - time budget per batch tick
```

> `enableFormattedCellCache` was removed - `enableFormattedDataCache` covers both export and
> cell display caching.

---

## Architecture

### Cache storage (SlickDataView)

```typescript
// Keyed by item ID (stable across sort/filter)
protected formattedDataCache: Record<DataIdType, Partial<Record<string, string | number>>> = {};
protected formattedCellCache: Record<DataIdType, Partial<Record<string, FormatterResult>>> = {};
protected formattedCacheMetadata: FormattedDataCacheMetadata = {
  isPopulating: false,
  lastProcessedRow: -1,
  totalFormattedCells: 0,
};
```

### Column classification (built once per population run)

`buildCacheContext()` classifies every column into one of three buckets before the first batch
runs, so the inner loop does zero branching per cell:

| Bucket | Condition | Action |
|---|---|---|
| `exportOnlyCacheColumns` | `exportCustomFormatter` present, OR `exportWithFormatter` without a cell `formatter` | Formatter called once ? export string stored in `formattedDataCache` |
| `dualCacheColumns` | `exportWithFormatter` **and** a cell `formatter` (same function for both) | Formatter called **once** ? result post-processed for `formattedDataCache` AND stored raw in `formattedCellCache` |
| `cellOnlyColumns` | Cell `formatter` only, no export requirement | Formatter called once ? raw result stored in `formattedCellCache` |

`dualCacheColumns` is the critical optimisation for typical grids where `exportWithFormatter: true`
is set globally - it halves the formatter calls per row compared to calling export and cell
formatters separately.

### Scheduling

```
populateFormattedDataCacheAsync()
  |
  +- buildCacheContext()           -> columns classified once, context reused for entire run
  |
  +- MessageChannel (reused)       -> single port pair for the entire run; falls back to rAF
  |    port1.onmessage = processBatch
  |    scheduleNextBatch = () => port2.postMessage(null)
  |
  +- processBatch() per tick
       +- time-budget loop: process rows until frameBudgetMs elapsed OR maxRowsPerFrame hit
       |    +- populateSingleRowCache(rowIdx, batchCtx)
       +- fire onFormattedDataCacheProgress (throttled - at most every 250 ms)
       +- if not done -> scheduleNextBatch()
          if done    -> fire onFormattedDataCacheCompleted, cleanup
```

`MessageChannel` fires as a macro-task without waiting for vsync, so batches run at a much
higher rate than `requestAnimationFrame` when formatters are fast. A single `MessageChannel` is
created and **reused** for the whole run (not re-created per batch).

### Per-row cache population (`populateSingleRowCache`)

```
1. Access item directly via `ctx.rows[rowIdx]` (bypasses `getItem()` group/totals overhead)
2. Skip groups and group-totals rows
3. Resolve `itemId = item[ctx.idProperty]` (idProperty cached in context)
4. Loop `exportOnlyCacheColumns` -> call `exportWithFormatterWhenDefined()` -> store in `formattedDataCache`
5. Loop `dualCacheColumns` -> call `col.formatter` once
  -> post-process to string -> store in `formattedDataCache`
  -> store raw result -> store in `formattedCellCache` when the result is cache-safe
6. Loop `cellOnlyColumns` -> call `col.formatter` -> store raw result in `formattedCellCache` when cache-safe
   (skipped entirely if row has a per-row metadata formatter override)

Note: live DOM formatter results (`HTMLElement`, `DocumentFragment`, or formatter result objects
wrapping live DOM) must not be stored in `formattedCellCache` because those nodes are consumed by
rendering and become invalid when reused.
```

### Cell rendering integration (`slickGrid.ts`)

`getFormatter()` returns a **wrapper closure** when the cache is enabled and there are no
per-row/per-column metadata formatter overrides:

```typescript
return (rowIdx, cell, value, columnDef, dataContext, grid) => {
  // dataContext is already in scope - passed to getCellDisplayValue to skip getItem()
  const cached = dataView.getCellDisplayValue(rowIdx, String(columnDef.id), dataContext);
  if (cached !== undefined) return cached;
  return formatter(rowIdx, cell, value, columnDef, dataContext, grid);
};
```

After warmup, scrolling is pure hash lookups - no formatter execution, no DOM creation.

### Export integration (`ExcelExportService`)

```typescript
if (this._gridOptions.enableFormattedDataCache) {
  itemData = this._dataView.getFormattedCellValue(dataRowIdx, columnId, undefined);
  // undefined = cache miss ? falls through to live exportWithFormatterWhenDefined()
}
```

### Export integration (`PdfExportService` / `TextExportService`)

`PdfExportService` and `TextExportService` now mirror the same export contract used by
`ExcelExportService`:

```typescript
if (this._gridOptions.enableFormattedDataCache) {
  const cached = this._dataView.getFormattedCellValue(dataRowIdx, columnId, undefined);
  if (cached !== undefined) {
    itemData = cached;
  } else {
    // fall back to the service's existing formatter/raw-value path
  }
} else {
  // existing formatter/raw-value path
}
```

Important behavior rule:

- cache hit must preserve the exact same downstream sanitize/htmlDecode/quoting/alignment/value-parser
  behavior already used by each export service
- cache miss must remain behavior-identical to the pre-cache implementation
- unit tests should assert output parity for cache-off, cache-on cache-miss, and cache-on cache-hit
- because export services currently have no E2E coverage, output-impacting changes must be protected by
  targeted unit tests before rollout

### Sanitization ownership (why it is done in export services)

Cache population intentionally stores pre-sanitized formatter output for export-only columns by calling
`exportWithFormatterWhenDefined(..., skipSanitization = true)`.

Sanitization is then applied once in each export service's final output pipeline.

This keeps behavior correct and predictable because:

- sanitization policy is an export-time concern (`sanitizeDataExport`, `htmlDecode`, quoting rules)
- cache entries stay policy-neutral and reusable across export flows
- no cache variant explosion (sanitized vs unsanitized vs decode combinations)
- no stale cache risk when export options change after cache warmup
- single-pass sanitization is preserved on both cache-hit and cache-miss paths

---

## Events (fired on `SlickDataView`)

```typescript
onFormattedDataCacheProgress: SlickEvent<FormattedDataCacheProgressEventArgs>
// { rowsProcessed, totalRows, percentComplete }
// Throttled - fires at most every 250 ms during population

onFormattedDataCacheCompleted: SlickEvent<FormattedDataCacheCompletedEventArgs>
// { totalRows, totalFormattedCells, durationMs }
```

---

## Invalidation

| Trigger | Action |
|---|---|
| `setData()` | `clearFormattedDataCache()` + restart `populateFormattedDataCacheAsync()` |
| `updateItem()` / `updateItems()` | `invalidateFormattedDataCacheForRow(rowIdx)` - re-caches that row immediately via `buildCacheContext()` + `populateSingleRowCache()` |
| `deleteItem()` / `deleteItems()` | Row entry deleted from both caches |
| `setColumns()` on grid | `clearFormattedDataCache()` + restart population |

---

## Public API on `SlickDataView`

```typescript
// Used by export services - returns cached export string, or fallbackValue on miss
getFormattedCellValue(rowIdx: number, columnId: string, fallbackValue: any): any

// Used by SlickGrid.getFormatter() wrapper - returns raw formatter result, or undefined on miss
// Pass item (dataContext) to skip internal getItem() call
getCellDisplayValue(rowIdx: number, columnId: string, item?: TData): FormatterResult | undefined

// Returns a snapshot of current cache metadata
getCacheStatus(): FormattedDataCacheMetadata

// Clears both caches and cancels any in-progress background population
clearFormattedDataCache(): void

// Cancels in-progress population without clearing already-populated entries
cancelFormattedDataCachePopulation(): void

// Starts (or restarts) background population from the given row index
populateFormattedDataCacheAsync(startRow?: number): void

// Re-caches a single row immediately (used after item update)
invalidateFormattedDataCacheForRow(rowIdx: number): void
```

---

## Performance profile

Measured: ~22 s to warm **50,202 rows / 50,000 formatted cells** (mixed formatters).
The bottleneck is raw formatter execution time � the scheduling and cache infrastructure
overhead is minimal.

For the real-world scenario in discussion #1922 (168 cols � 11K rows, `exportWithFormatter: true`
on every column, complex-object formatters):

- **Scroll jitter**: eliminated after warmup - each visible cell render is two hash lookups
- **Export**: near-instant once cache is warm
- **Warmup**: background, non-blocking; top of the grid becomes smooth first

---

## `parseFormatterWhenExist` optimisation (`formatterUtilities.ts`)

Applies to **all** formatter call sites, not only the cache. Key changes:

- Dot-split (`fieldId.split('.')`) only performed when a dot is actually present
- `Object.prototype.hasOwnProperty.call()` result stored once and reused for both formatter and
  fallback paths
- Loose equality (`== null`) replaces separate `null`/`undefined` checks

---

## Backward compatibility

- Feature is **opt-in** - disabled by default, zero overhead when off
- No breaking changes to any existing API
- `getCellDisplayValue` third parameter (`item`) is optional - existing callers unaffected
- Cache uses extra memory to store precomputed formatter output; enable it selectively for
  large/formatter-heavy grids instead of enabling it globally on every grid.

---

## Verification checklist

- Keep service-specific post-processing unchanged:
  - Excel: value parsing and Excel metadata
  - PDF: sanitize/htmlDecode plus per-column alignment/layout
  - Text/CSV: sanitize, quote escaping, delimiter handling, and keep-as-string prefix
- Maintain parity across all three export modes for:
  - cache disabled
  - cache enabled with miss
  - cache enabled with hit
- For export output behavior, prefer focused helper-level unit tests over line-coverage-only assertions
  (especially while E2E export tests are absent)
