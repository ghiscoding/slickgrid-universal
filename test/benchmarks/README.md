# Performance benchmarks

The SlickDataView benchmark measures the production filter and accumulator loops in isolation from paging, grouping, events, and row-difference calculations.

Run the benchmark on an otherwise idle machine:

```sh
pnpm bench:data-view
```

To compare results across revisions, first save a baseline from the baseline revision (the results are written to the git-ignored `test/benchmarks/dist/` folder):

```sh
BENCH_WRITE=1 pnpm bench:data-view
```

Then run the benchmark from the changed revision, every benchmark is compared against its saved `(baseline)` result in the same table:

```sh
pnpm bench:data-view
```

In PowerShell, set the variable with `$env:BENCH_WRITE="1"` before the first command and clear it with `$env:BENCH_WRITE=""` before the second one. Delete the `test/benchmarks/dist/slick-dataview-*.json` files to stop comparing.

Use the relative results rather than absolute operations per second. Repeat the benchmark at least three times and treat differences smaller than the reported relative margin of error (`rme`) as inconclusive.

## Formatter utilities

The formatter utilities benchmark measures the per-cell export path (`exportWithFormatterWhenDefined()` and the per-column `createExportCellReader()`) used by the Excel, PDF and Text export services, with raw values, custom formatters and built-in number & date formatters (20,000 rows in jsdom). It also covers `retrieveFormatterOptions()` and `getCopyCellValue()`.

Save a baseline report from the baseline revision, then compare the working tree against it (PowerShell syntax shown, use `VAR=value` prefixes in bash):

```sh
$env:FORMATTER_BENCH_REPORT="$env:TEMP/formatter-before.json"; pnpm bench:formatter-utils
$env:FORMATTER_BENCH_BASELINE="$env:TEMP/formatter-before.json"; $env:FORMATTER_BENCH_REPORT="$env:TEMP/formatter-after.json"; pnpm bench:formatter-utils
```

The summary prints the median and p95 of 25 samples per scenario and the delta against the baseline median. Use `FORMATTER_BENCH_ROWS` to change the row count. The `createExportCellReader` scenarios are skipped on revisions where that function doesn't exist.

## PDF export

The PDF export benchmark runs `exportToPdf()` end to end (20,000 rows × 20 columns in jsdom) with a stubbed jsPDF whose drawing methods do nothing, so it measures the export service itself rather than jsPDF. It covers the jsPDF-AutoTable mode and the manual fallback renderer (with and without grouping), and records a checksum of every drawn text, so the summary can confirm that the output is unchanged against a baseline.

```sh
$env:PDF_BENCH_REPORT="$env:TEMP/pdf-before.json"; pnpm bench:pdf-export
$env:PDF_BENCH_BASELINE="$env:TEMP/pdf-before.json"; $env:PDF_BENCH_REPORT="$env:TEMP/pdf-after.json"; pnpm bench:pdf-export
```

Use `PDF_BENCH_ROWS` to change the row count.

## Text export

The text export benchmark runs `exportToFile()` end to end (20,000 rows × 20 columns in jsdom) for CSV, CSV with grouping (group title and group totals rows) and TXT with sanitized data. The file download is replaced by a stub, so the timing stops once the output content is produced, and a checksum of the content (computed outside the timing) confirms that the output is unchanged against a baseline.

```sh
$env:TEXT_BENCH_REPORT="$env:TEMP/text-before.json"; pnpm bench:text-export
$env:TEXT_BENCH_BASELINE="$env:TEMP/text-before.json"; $env:TEXT_BENCH_REPORT="$env:TEMP/text-after.json"; pnpm bench:text-export
```

Use `TEXT_BENCH_ROWS` to change the row count. AutoTable checksums include the full headers, body, and column styles, plus header alignment applied by the hook. When `PDF_BENCH_BASELINE` is set, a missing baseline file or scenario, a different row count, or a checksum mismatch fails the benchmark. Regenerate older baseline reports with this benchmark version before comparing revisions, since the AutoTable checksum calculation has changed.

## Excel export

The Excel export benchmark bundles the production sources and measures export preparation and XLSX serialization in Node + jsdom (5,000 rows × 20 columns) for raw values, formatters, and a warm formatted-data cache. It also verifies that all modes produce identical worksheet data.

Profile a baseline revision, then the working tree:

```sh
pnpm bench:excel-export before <baseline-commit>
pnpm bench:excel-export after
```

The `before` run replaces only the optimized production files with their contents at `<baseline-commit>`. Bundles, JSON samples, and V8 CPU profiles (`*.cpuprofile`) are written to `test/benchmarks/dist/`, which Git ignores. Open the profiles in Chrome/Edge DevTools or VS Code.

After generating both bundles, you can optionally profile them in a browser:

```sh
pnpm exec cypress run --config-file test/benchmarks/cypress.config.ts --browser electron --spec test/benchmarks/excel-export.cy.ts
```

These are synthetic measurements; compare relative results between revisions on the same machine.

### Experimental incremental-row benchmark

`excel-row-stream` compares the existing row materialization with a research prototype
that feeds rows to the XLSX serializer on demand. It uses a flat, deterministic,
example03-like dataset with date and currency formatters. The prototype accesses private
builder internals and only supports this workload; it is not a production exporter.
Both modes use compression level 6. See `.agents/audits/excel-export-performance.md` for
results, limitations, and production-design concerns.

Run each mode in a separate process, with the same row count, and compare the resulting
uncompressed XLSX entries. Outputs are written under `test/benchmarks/dist/` and overwritten
on subsequent runs. Repeat the two commands, alternating modes, for useful comparisons.

```sh
BENCH_ROWS=500000 BENCH_MODE=baseline node --expose-gc test/benchmarks/excel-row-stream.mjs
BENCH_ROWS=500000 BENCH_MODE=incremental node --expose-gc test/benchmarks/excel-row-stream.mjs
python3 test/benchmarks/excel-row-stream-compare.py
```

Each mode warms up with 1,000 rows. The runner reports export time, timer delay and Node
process memory; dataset creation, cache setup and writing the XLSX file are outside the
export timer. The incremental serialization phase includes row preparation, so its phase
timings cannot be compared directly with the baseline's. Use the total time for comparison.
