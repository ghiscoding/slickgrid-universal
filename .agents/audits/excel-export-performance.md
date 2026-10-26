# Excel export performance audit

## Scope

Investigate Excel export latency with the formatted-data cache disabled and warmed.
The comparison library is `excel-builder-vanilla`, which SlickGrid already uses.

## Findings before changes

- Export first materializes every output row, then starts XLSX streaming. Formatting,
  sanitization, HTML decoding, Excel value parsing and allocations precede streaming.
- `htmlDecode` creates a textarea and parses HTML for every string, including plain text.
  Excel enables decoding by default, and decoding still runs after a formatter cache hit.
- The inner cell loop repeatedly retrieves grid options and column metadata. Cache reads
  retrieve the current DataView item again even though the exporter already has it.
- Streaming overrides the library's 64 KiB default with 1,000-byte output chunks. This
  increases chunk handling but is not established as a significant latency source.
- Fixed row-count yielding does not account for the number or cost of exported columns.
- A warm formatter cache does not remove XML serialization, ZIP compression, decoding,
  parsing or worksheet allocation. The implementation plan's “near-instant” claim is
  not a general performance guarantee.

## Initial isolated stream measurement

Node 26.5.0, installed `excel-builder-vanilla` 5.3.1, 20,000 rows × 20 columns,
alternating strings/numbers, same prepared input rows, compression defaults:

| Output chunk size | Warm duration | Output chunks |
| --- | ---: | ---: |
| 65,536 bytes | 2,972 ms | 994 |
| 1,000 bytes | 2,974 ms | 2,422 |

This measures Node streaming only. It neither reproduces browser DOM work nor proves
the visually estimated 4–5× difference against a direct library export.

## Implementation and validation

Implemented changes:

1. Skip HTML parsing for strings that cannot change under the existing textarea decoder.
   Preserve entity decoding, parser normalization and repeated decoding semantics.
2. Resolve export grid options once per row and reuse prepared column settings.
3. Allow export cache lookup to use the already-resolved data item, additively.
4. Restore the stream library's default output chunk size.
5. Add repeatable preparation/serialization measurements and parity regression tests.

The exporter reuses prepared column parser/style references and reads grid options once
per row. Custom value parsers still receive a fresh argument object for each cell.
The cache API's optional fourth argument reuses the item already read by the export loop;
existing three-argument callers remain supported. No framework adapter changes are needed.
The shared decoder optimization also benefits PDF/text exports and other callers, and
PDF/text cache reads also pass the already-resolved item.

## Before/after measurement

Baseline commit: `5b675a68f25e92d6102249dc4a5d982469d82041`.
Node 26.5.0 + jsdom 30.1.3, installed Excel builder 5.3.1, 5,000 rows × 20 columns.
Three profiled samples per revision, with a smaller warmup before collection. Values
alternate plain strings and numbers. Formatting returns strings. Sanitization and
HTML decoding are enabled. Cache population is excluded from export timing.

Median milliseconds (preparation includes the exporter's existing periodic yielding):

| Mode | Preparation before | Preparation after | Total before | Total after |
| --- | ---: | ---: | ---: | ---: |
| Raw values, cache disabled | 2,777 | 90 | 3,468 | 711 |
| Formatter, cache disabled | 5,527 | 124 | 6,145 | 652 |
| Warm formatted cache | 5,121 | 100 | 5,680 | 661 |

These are **Node + jsdom measurements, not browser performance promises**. The simple
formatter does not represent expensive user formatters; the warm cache avoids its
per-cell execution, but both paths still process exported strings. Background cache
population is deliberately absent so it cannot compete with export in this experiment.
The synthetic total-time improvements are about 4.9×, 9.4× and 8.6× respectively.

CPU profiles show textarea creation/parsing and jsdom DOM handling dominating preparation
before the change; ZIP compression becomes the main cost afterwards. The stream produces
253 chunks instead of 570 on this workload. The earlier isolated stream experiment shows
that chunk size alone does not explain the improvement.

The benchmark checks that all three modes produce identical worksheet-data fingerprints
(`1809136089` for the measured workload), and that cache mode bypasses per-cell formatter
execution. Existing Excel format detection can still invoke formatters once per column.
ZIP byte counts can vary slightly because the archive includes timestamps.

## Reproducing and inspecting profiles

From the repository root, with dependencies installed:

```powershell
pnpm bench:excel-export before 5b675a68f25e92d6102249dc4a5d982469d82041
pnpm bench:excel-export after
```

The runner bundles production source directly, so measurements do not depend on stale
package builds. The baseline overrides only the three benchmarked production files
(`domUtils`, `slickDataView`, `excelExport.service`) with
their contents at the given revision; dependencies and the benchmark remain identical.
Generated bundles, JSON samples and V8 CPU profiles are under `test/benchmarks/dist/`
(ignored by Git). Load `excel-export-before.cpuprofile` and `excel-export-after.cpuprofile`
in Chrome/Edge DevTools' JavaScript profiler or VS Code's profile viewer.

For isolated browser measurements and browser CPU profiles after generating both bundles:

```powershell
pnpm exec cypress run --config-file test/benchmarks/cypress.config.ts --browser electron --spec test/benchmarks/excel-export.cy.ts
```

Cypress serves the small static benchmark page itself; this needs no demo/watch server.
Results and profiles use `excel-export-browser-*` filenames in the same ignored directory.
The browser run could not be validated in the agent environment: Cypress exits during
startup with Windows Crashpad access errors, and headless Edge cannot initialize its GPU
process. Node CPU profiles and all measurements above were captured successfully.

## Porting to the standalone SlickGrid fork

The cell-display cache benefits formatter-heavy scrolling and rerendering without any
export services. For the standalone fork, port `SlickGrid.getFormatter()`'s display-cache
integration together with DataView's display-cache storage, background population and
invalidation. Keep caching opt-in and preserve metadata formatter overrides and the
exclusion of live DOM formatter results from the display cache.

The export-value cache and export-column planner are only useful when a consumer needs
formatted export values. A fork without export consumers can omit that machinery and
adapt population to the display cache alone.

This audit's optimization round did not change `slickGrid.ts`; its rendering-cache
integration was already implemented. The new optional `item` argument on DataView's
`getFormattedCellValue()` only avoids a redundant row lookup for export consumers, so
it provides little immediate benefit in a fork without those consumers. The shared
`htmlDecode()` optimization is useful wherever the fork calls an equivalent decoder.

## Validation and remaining limits

- Targeted regressions cover plain-text DOM avoidance, nested decoding, textarea parser
  normalization (including CR/LF/NUL), supplied-item cache reads, zero/empty cached values,
  cache misses, custom parsers/styles and independent callback argument objects.
- All 532 tests in the eight focused Export/DataView/utility specs pass, including
  PDF/text parity checks for the shared change.
  One PDF span assertion expected `undefined` although its own comment specified `A`.
  An earlier test leaked a `document.createElement` spy returning an `<a>` element, whose
  `value` is `undefined`, so the original decoder returned `undefined`. The spy is now
  restored and the assertion expects `A`.
- The five changed production files (DOM utilities, DataView, Excel, PDF and text export
  services) have 100% statement, function and line coverage.
  Whole-file branch coverage retains existing gaps (DataView 90.94%, Excel 93.58%,
  PDF 93.72%, text 91.58%, DOM utilities 92.2%); every newly introduced branch is exercised.
- Production package builds, strict benchmark TypeScript checks, targeted lint and
  formatting pass. Madge reports no cycles for the Excel source graph with declaration
  files excluded. Following package declaration barrels reports existing type cycles;
  this change introduces no imports in production code.
- Full worksheet materialization and Blob collection remain. Formatter-heavy exports
  and entity-heavy strings still have their original costs. A worker or a row-producer
  streaming API would require a separate design to preserve custom formatters, callbacks,
  headers, group totals and row/column spans.
