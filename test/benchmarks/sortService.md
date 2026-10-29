# SortService benchmark

Run `pnpm bench:sort-service`. Set `SORT_BENCH_SIZES=1000,10000` to choose row counts and `SORT_BENCH_REPORT` to select the JSON report path (defaults to the system temporary directory).

Each measured run starts with a fresh copy of the same deterministic unsorted input. The timer covers the sorting call using `SortService.sortComparers` or `sortTreeData`; creation and correctness verification are excluded. The harness checks the full sorted output against an independent expected ordering on every iteration. It performs three warm-ups and five timed samples. The reported median is the middle sample; p95 is the maximum, so repeat runs are needed for meaningful comparisons.

Baseline commit `8d3357d18` and the uncommitted sorting-audit branch were run sequentially on Node v24.16.0 with the same dependency installation. Identical ordered ID hashes were verified across revisions. This single pair of runs is not sufficient to establish small speedups or regressions.

| Rows / type | Before median (ms) | After median (ms) | Change |
| --- | ---: | ---: | ---: |
| 1000 / numeric | 3.39 | 2.93 | -13.6% |
| 1000 / string | 3.97 | 3.13 | -21.3% |
| 1000 / date | 184.85 | 169.21 | -8.5% |
| 10000 / numeric | 56.53 | 46.24 | -18.2% |
| 10000 / string | 51.76 | 53.49 | +3.3% |
| 10000 / date | 1829.29 | 1774.90 | -3.0% |
| 1000 / multi-column | 5.54 | 5.78 | +4.3% |
| 1000 / prepared dates | 6.33 | 5.55 | -12.2% |
| 1000 / tree equivalent fields | 2.69 | 2.25 | -16.3% |
| 10000 / multi-column | 83.30 | 85.27 | +2.4% |
| 10000 / prepared dates | 67.68 | 60.55 | -10.5% |
| 10000 / tree equivalent fields | 27.18 | 22.78 | -16.2% |

Raw results, including the maximum sample and output hashes, are in `results/sort-service-before.json` and `results/sort-service-after.json`. The multi-column case checks first-column priority and tie handling; the prepared-date case measures already parsed Date values, excluding their initial preparation. The tree case uses two equivalent fields so both revisions produce identical order. Its size is the number of children; it also creates one parent per 100 children. The old tree implementation orders conflicting fields incorrectly, so this performance case does not represent every tree multi-sort workload. Unit tests cover conflicting priorities and nested siblings.

These measurements do not include DataView refresh, browser rendering, or date preparation. Timings include only the sorting call; each input copy and the output verification occur outside that timed section. The benchmark is intentionally not a CI performance threshold. To reproduce the baseline, create a detached worktree at the baseline commit, copy the same benchmark file into it, use the same dependency versions, and run each revision sequentially with distinct report paths.

The existing forced re-sort is retained: it can establish the order of ties for the following stable sort. Removing it would change behavior and event/refresh counts, so a compatible optimization needs a separate design and measurements.

## Collection sorting follow-up

The collection benchmark times the whole `CollectionService.sortCollection()` call, including comparator preparation. Input copying and exact output verification are outside timing. It also verifies that sorting returns the original array. Run `SORT_BENCH_SIZES=10000,100000 pnpm bench:sort-service -t CollectionService` on bash.

Two sequential before/after comparisons were performed, reversing revision order for the second pair (before → after → after → before). Each invocation uses three warm-ups and five samples. Both revisions produced identical verified output for all eight cases. This compares the complete patch against `8d3357d18`, so it does not isolate the contribution of collection setup from the shared date-type optimization.

| Case | Before 1 (ms) | After 1 (ms) | Before 2 (ms) | After 2 (ms) |
| --- | ---: | ---: | ---: | ---: |
| 10000 / collection single numeric | 29.13 | 20.52 | 35.05 | 19.22 |
| 10000 / collection multiple numeric | 71.58 | 57.62 | 80.90 | 53.40 |
| 10000 / collection translated string | 25.73 | 18.90 | 28.98 | 18.29 |
| 10000 / collection primitive numeric | 31.65 | 19.67 | 35.89 | 19.24 |
| 100000 / collection single numeric | 426.67 | 314.65 | 464.72 | 305.69 |
| 100000 / collection multiple numeric | 984.96 | 758.50 | 1103.15 | 722.51 |
| 100000 / collection translated string | 283.50 | 211.12 | 308.65 | 197.04 |
| 100000 / collection primitive numeric | 411.08 | 282.50 | 454.33 | 239.92 |

The consistent direction supports a collection-sorting improvement on this workload, but the variation between runs means the exact percentage is not a general guarantee. The four raw reports are stored under `results/collection-*.json`.

## Tree extension compatibility

Standard instances retain one traversal for multi-column tree sorting. When `sortTreeChildren()` is overridden on a subclass or instance, the service instead invokes that existing hook in stable passes, from least-significant to most-significant column. This preserves customization at each tree level while correcting first-column priority. Direct calls and the method signature are unchanged; multi-sort hook invocation order necessarily changes to correct the previous priority bug. Regression tests cover subclass invocation and nested ordering.
