Run `pnpm bench:filter-service` for deterministic 10k and 100k row datasets.
On bash, use `FILTER_BENCH_SIZES=500000 pnpm bench:filter-service` for 500k rows.
Results are also written to `filter-service-benchmark.json` in the system temporary
directory. Set `FILTER_BENCH_REPORT` to choose another report path.

The harness verifies exact matching IDs against independent predicates before
timing. Each case performs three warm-up scans and fifteen measured scans,
reporting the median and nearest-rank p95 in milliseconds. With fifteen samples,
p95 is the maximum; use repeated runs to assess variability. There are no CI
timing thresholds. Run on an otherwise idle machine, using the same Node version
and dataset sizes when comparing revisions.

Predicate scans include allocating the matching array. DataView refresh includes
filtering and row bookkeeping, without a mounted grid or browser rendering.
Both measurements use already parsed search terms. These are repeated full scans,
not measurements of typing latency, debounce, filter widget initialization, or
backend requests. The cleared case measures an empty filter dictionary.

This first benchmark covers flat numeric, string, nested-field, date-range,
multiple-filter, and cleared-filter scenarios. Tree data, formatter output,
multi-select, and browser interactions remain to be added. Results on the current
revision are a baseline, not evidence of a speedup over an earlier revision.

See [the before/after comparison](filterService-comparison.md) for measurements
against the pre-audit commit, and [audit disposition](filterService-audit.md) for
implemented changes and remaining work.

The installed Vitest 5 runner does not export the older `bench()` function, so
this file uses ordinary tests with a small timing harness under the existing
benchmark configuration.
