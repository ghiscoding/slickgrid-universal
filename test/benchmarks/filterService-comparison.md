# Filter audit comparison

Baseline: `8d3357d18` (pre-audit). After: uncommitted changes on `perf/filter-service-audit`.

Node v24.16.0, same installed dependencies and deterministic benchmark harness. The retained baseline and after runs were sequential, without concurrent test/build work. Each case uses 3 warm-ups and 15 samples. These are local Node measurements, without browser rendering. A single pair of runs cannot establish small speedups or regressions.

| Scenario | Before median (ms) | After median (ms) | Change |
| --- | ---: | ---: | ---: |
| 100000 / numeric / broad / DataView refresh | 62.78 | 57.48 | -8.4% |
| 100000 / text / selective / DataView refresh | 56.87 | 53.22 | -6.4% |
| 100000 / text / no matches / DataView refresh | 54.71 | 53.22 | -2.7% |
| 100000 / nested field / DataView refresh | 80.94 | 74.10 | -8.5% |
| 100000 / date range / DataView refresh | 1592.69 | 1560.40 | -2.0% |
| 100000 / two filters / early rejection / DataView refresh | 65.54 | 60.73 | -7.3% |
| 100000 / cleared / DataView refresh | 5.63 | 4.76 | -15.5% |

The current changes do not demonstrate a broad filtering speedup. Date range filtering remains the dominant cost in these scenarios. Prefer correctness and readability benefits when evaluating this patch; performance optimization of dates and trees needs separate profiling.

Raw reports include both predicate scans and DataView refresh at 10k and 100k rows. All 28 cases passed exact matching-ID checks on both revisions.

To reproduce, create a detached worktree at the baseline, copy the same `filterService.bench.ts` into it, and use the same dependency versions. Run the baseline and current checkout sequentially with distinct `FILTER_BENCH_REPORT` paths. The baseline must use its own source files; copying old timing results is not a before/after comparison.
