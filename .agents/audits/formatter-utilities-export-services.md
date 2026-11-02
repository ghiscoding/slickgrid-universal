# Formatter utilities & export services audit

Audit of `formatterUtilities.ts` (used by every export service for every exported cell) followed by an audit of the
Excel, PDF and Text (CSV/TXT) export services, for performance, lines of code and correctness.

Related earlier audit: [excel-export-performance.md](./excel-export-performance.md) (htmlDecode fast path, stream chunking).

## Status overview

| Area | Status |
| --- | --- |
| `formatterUtilities.ts` perf & LOC audit | ✅ Done (#2892, #2893) |
| Export services bugs | ✅ Done (#2895, #2897) |
| Export services perf (PDF fallback renderer) | ✅ Done (#2896) |
| Export services perf (shared cell loops) | ✅ Done (#2899) |
| Export services LOC (shared helpers) | ❌ Remaining |
| Benchmark tooling (Vitest 5) | ✅ Done (#2898, branch `chore/benchmarks-vitest5`) |

## Completed work

### #2892 — `perf(export): speed up formatter utilities used by export services`

Files: [formatterUtilities.ts](../../packages/common/src/formatters/formatterUtilities.ts),
[utils.ts](../../packages/utils/src/utils.ts), Excel/PDF/Text export services, benchmarks.

- `formatCellOutput()` (private, used by `exportWithFormatterWhenDefined()` & `parseFormatterWhenExist()`):
  - string formatter results skip `isPrimitiveOrHTML()` + `getHtmlStringOutput()`
  - strings extracted from `{ html }` / `{ text }` results also skip `getHtmlStringOutput()`
- Dotted fields use `indexOf` + `slice` instead of `split('.')` (no array per cell).
- `retrieveFormatterOptions()`: lookup table for default decimals, grid options read once, about 75 → 30 lines.
- Input date format cached per column type (`getInputDateFormat()`), used by both date formatter factories.
- `getCopyCellValue()`: no formatter call when `queryFieldNameGetterFn` discards it, 2 regexes merged into 1.
- Private helpers: `isExportingWithFormatter`, `getFieldProperty`, `formatCellOutput`, `findOptionValue`.
- New public `createExportCellReader()` + `ExportCellReader` type: resolves the formatter, field & sanitize flag once per
  column. Used by all 3 exporters:
  - Excel: stored as `readCell` in the per-column metadata
  - Text & PDF: new optional `cellReaders` argument on `readRegularRowData()`, defaulting to building them
- `isPrimitiveOrHTML()` checks primitives before HTML elements.
- New `pnpm bench:formatter-utils` ([formatterUtilities.bench.ts](../../test/benchmarks/formatterUtilities.bench.ts)),
  and `excel-export.mjs` now swaps `formatterUtilities.ts` + `utils/src/utils.ts` for the `before` baseline.

Results (Node + jsdom, 20,000 cells, median): string formatter −89%, dotted field −83%, `{ text }` −30%,
`Formatters.decimal`/`dollar` −29 to −30%, `Formatters.dateUs` −28%, `getCopyCellValue` −73%.
Excel export (5,000 × 20) formatter-mode preparation ~31–34 ms → ~18–26 ms, identical worksheet checksums.

### #2893 — `fix(formatters): apply dateSeparator option to built-in date formatters`

- Root cause: `formatters.index.ts` registered date formatters with `getAssociatedDateFormatter(dateType, dateType)`,
  passing the type name as the separator, so `formatterOptions.dateSeparator` was silently ignored.
- `defaultSeparator` is now optional and derived from the output format (1st non-alphanumeric character).
- The custom separator replaces the default separator in the output *format* (cached per separator) instead of a regex
  over every output string: unparseable values stay untouched, `.` isn't a regex wildcard, `:` & ISO8601 unchanged,
  empty separator supported.
- Visible change: Example 02 (Angular, React, Vue, Aurelia demos) sets `dateSeparator: '.'`, dates now show `2002.01.01`.

### #2895 — `fix(export): text export group totals should use same delimiter & sanitizer`

`TextExportService.readGroupedTotalRow()` now uses `this._delimiter` (honors `delimiterOverride`), checks
`this._fileFormat` for CSV quote escaping, and strips HTML when `sanitizeDataExport` is enabled (column or export option).

### #2896 — `perf(pdf): speed up PDF export fallback renderer & column styles setup`

- Fallback renderer (no jsPDF-AutoTable): column list built once instead of `columns.filter()` per cell/row; per header
  cell options, alignment, text offsets and the row background offset resolved once per export.
- AutoTable: 2 column loops merged into 1, cached column options reused (were resolved 3× per column).
- New `pnpm bench:pdf-export` ([pdfExport.bench.ts](../../test/benchmarks/pdfExport.bench.ts)): stubbed jsPDF, AutoTable /
  fallback / fallback with grouping, text checksum to verify identical output against a baseline report.
- Result (20,000 × 20, interleaved runs): fallback −11 to −17%, AutoTable unchanged.

### #2897 — `fix(export): skip width-0 columns in data rows & fix PDF row mapping`

1. All 3 exporters: `readRegularRowData()` skips `width: 0` columns, same as headers, group totals & Excel column styles
   (data rows previously had extra cells, shifting every following cell under the wrong header).
2. PDF fallback: group title rows detected from the actual group item (`_groupTitleRows` WeakSet filled in
   `getAllGridRowData()`) instead of guessing from content (`['A0', '']` used to be drawn as a group title).
3. PDF fallback: cells mapped to the same visible column list as headers/widths; when grouping, the alternate row
   background offset now comes from the 1st data column (was the 2nd, off-by-one).
4. PDF variable row heights: read from the grid row of each exported row (`_gridRowIndexByExportedRow` WeakMap), via
   `data.row.raw` in AutoTable `didParseCell` and the row array in the fallback (was drifting after Row Detail rows).

### `perf(export): read formatted data cache once per row in export services` (#2899)

- New additive `SlickDataView.getFormattedRowValues(item)`: returns the cached formatted export values of a row (or
  `undefined`), so the 3 exporters look up the row cache once per row instead of calling `getFormattedCellValue()`
  (item id + row cache lookup) for every cell. Columns that aren't cached are a plain property miss.
- Excel: per-cell `cachedColumnMetadata.get(String(columnDef.id))` replaced by an array indexed by column position
  (new protected `getColumnMetadataList()`, new optional `columnMetadataList` argument on `readRegularRowData()`).
- Text: CSV/sanitize flags hoisted out of the cell loop, `/"/gi` → `/"/g` in regular & group title rows.
  PDF: column export options only resolved for cells that are actually read.
- ❌ Not done (#4, rejected): skipping `getItemMetadata(row)` without a provider would break users who override
  `dataView.getItemMetadata` directly (Example 11/46/57 do it for colspan), and the exporters can't see DataView options.
- Benchmarks: new "CSV with formatted data cache" (text) and "AutoTable with formatted data cache" (PDF) scenarios, the
  stub DataViews implement both `getFormattedCellValue()` & `getFormattedRowValues()` so baselines still run.
- Results: identical output checksums (text, PDF, Excel worksheet). Gains are small and mostly within the noise of this
  shared machine: isolated best-of-4 text runs, cache 63.2 → 62.5 ms, sanitized TXT 79.3 → 69.0 ms; Excel cache-mode
  preparation (5,000 × 20) ~22 → ~18 ms.
- Benchmark gotcha: scenarios in the same file affect each other (heap growth), e.g. the cache scenario measured
  ~188 ms after the grouping scenario vs ~63 ms alone. Compare scenarios in isolation with `-t "<name>"`.

## Remaining work

### LOC: shared helpers (follow-up `refactor:` PR)

Most duplicated code lives in `protected` methods that subclasses can override, so call shared helpers from inside those
methods and keep the methods for backward compatibility.

- Row reading loop (skip Row Detail rows, then regular / group title / group totals) is copied in all 3 services.
- Colspan/rowspan `prevColspan` logic is copied 3× and is the hardest code to read; one helper returning skip / merge /
  read per cell.
- `getColumnHeaders`, `getColumnGroupedHeaderTitles`, the translated "Group by" title and the pre-header condition are
  duplicated across exporters.
- The width rule `(width === undefined || width > 0) && !excludeFromExport` is now repeated in ~10 places; a shared
  `isColumnExported()`-style helper would remove the duplication.
- Excel: the cell format fallback inside the row loop (~20 lines) repeats `cacheRegularCellExcelFormats()`.
- Excel: `preCalculateColumnMetadata()` re-implements the `exportWithFormatter` check & dotted field split; with
  `createExportCellReader()` only `readCell` is needed.
- Group totals text: `totalResult instanceof HTMLElement ? textContent : totalResult` appears in every exporter.

### #2898 — Benchmark tooling (`chore:` PR, merged)

The branch was fast-forwarded to `master` at #2897 (`120bcabd7`), so it includes every merged PR listed above. Its
uncommitted changes only touch `test/benchmarks/*`, `package.json` and this audit file (no overlap with the export
services).

- ✅ On this branch: `pnpm bench:data-view` failed with `TypeError: bench is not a function` because Vitest 5 removed the
  top-level `bench` export (`bench` is now a test-context fixture). The other benchmarks were fine (they use `test()` with
  manual timing). [slickDataView.bench.ts](../../test/benchmarks/slickDataView.bench.ts) is ported to:

  ```ts
  test('production loop - string predicate', ({ bench }) =>
    runBenchmark(bench, 'production loop - string predicate', () => { /* ... */ }));
  // runBenchmark() calls bench(name, fn).run(options), or writes/compares a baseline (see below)
  ```

- ✅ On this branch: [README.md](../../test/benchmarks/README.md) now documents the Vitest 5 workflow
  (`BENCH_WRITE=1 pnpm bench:data-view` saves baselines to the git-ignored `test/benchmarks/dist/` through `writeResult`,
  later runs compare against them with `bench.from()`); `bench:data-view` uses `--reporter=verbose` because the default
  reporter hides the comparison tables when the output isn't a terminal. Docs: https://vitest.dev/guide/benchmarking
- ✅ On this branch: new `pnpm bench:text-export` ([textExport.bench.ts](../../test/benchmarks/textExport.bench.ts)), CSV /
  CSV with grouping / sanitized TXT, 20,000 × 20, with output checksum. Medians on `master` with #2897: CSV ~93 ms,
  CSV with grouping ~88 ms, TXT ~72 ms (same as before #2897, within noise).
- ⚠️ Open check: after #2897, `pnpm bench:pdf-export` gave AutoTable ~147–150 ms (median, 3 runs) vs 111–118 ms measured
  before #2897; fallback ~283–295 ms vs ~272–278 ms. #2897 only adds a width check per cell and 1 `WeakMap.set` per
  row, so this is probably machine drift, but it's unconfirmed: the interleaved #2896 vs #2897 comparison was
  inconclusive (machine too noisy, same code varied 285–807 ms). Before the shared cell loop perf PR, compare on an
  idle machine with `git restore --source=7b5fc40f7 -- packages/pdf-export/src/pdfExport.service.ts`, run the
  benchmark, then `git restore -- packages/pdf-export/src/pdfExport.service.ts` (don't pipe `git show` into
  PowerShell's `Set-Content -NoNewline`, it drops the newlines and breaks the file). Still unconfirmed after the shared
  cell loop PR: the machine was even noisier then (fallback ~850–930 ms for the same code).

### Unverified observations (check before acting)

- Excel cell merges use `getExcelColumnNameByIndex(col + 1)` with the grid column index, which may not match the Excel
  column when columns are excluded or have a width of 0 (and when the "Group by" column is prepended).
- Colspan `'*'` uses `columns.length - col`, which counts excluded/width-0 columns.

## Validation recipes

- Focused tests with coverage scoped to changed files (the exporter specs import `@slickgrid-universal/common` from
  `dist/`, so scope coverage to each package's own source):

  ```sh
  pnpm exec vitest run --config test/vitest.config.mts packages/pdf-export packages/excel-export packages/text-export \
    --coverage.enabled --coverage.include=packages/pdf-export/src/pdfExport.service.ts --coverage.reporter=lcov
  ```

- Changed-lines coverage: parse `test/vitest-coverage/lcov.info` (`DA:<line>,0` and `BRDA:<line>,...,0|-`) and intersect
  with the `+` hunk ranges of `git diff -U0 -- <file>`; repo standard is 100% on changed production lines & branches.
- Build/lint: `pnpm exec tsc --build ./tsconfig.packages.json`, `pnpm exec oxlint <paths>`, `pnpm exec prettier --check <paths>`.
- Benchmarks: `pnpm bench:formatter-utils`, `pnpm bench:pdf-export` (both support `*_BENCH_REPORT` / `*_BENCH_BASELINE`
  env vars and print deltas), `pnpm bench:excel-export before <commit>` then `pnpm bench:excel-export after`.
  For a clean baseline of a single file: `git stash push <file>`, run the benchmark, `git stash pop`.

## Gotchas learned

- Don't run `tsc --build` at the same time as exporter tests: they import `common` from `dist/`, which `tsc` rewrites
  mid-run and causes random failures.
- The text export spec has tests that rely on state left by earlier tests (e.g. `mockColumns` in the
  "startDownloadFile call after all private methods ran" block): run the whole file, not `-t` filters, and never mutate
  shared mocks (clone, then restore the stub).
- `jspdf` is only installed in `packages/pdf-export`; benchmarks must mock `../../packages/pdf-export/node_modules/jspdf`,
  otherwise the real jsPDF runs and writes `bench.pdf` on every export (the first PDF benchmark results were invalid for
  this reason; the benchmark now asserts the stub was used).
- The machine is shared and noisy: 5,000-row PDF runs varied 88–234 ms for the same code. Use 20,000 rows and interleave
  baseline/change runs.
- Vitest swallows `console.*` output in `afterAll` hooks of bench runs; benchmarks write their summary with
  `process.stdout.write`.
- PDF defaults set `dataRowTextOffset: -4` and `dataRowBackgroundOffset: -1`, account for them in position assertions.
- With the stubbed jsPDF, reading the row data (not drawing) is now the largest cost of a PDF export, which is the target
  of the remaining shared cell loop perf work.
