# Tree Data benchmark

Run `pnpm bench:tree-data`. Set `TREE_BENCH_SIZES=5000,20000` to choose row counts and `TREE_BENCH_REPORT` to select the JSON report path (defaults to `tree-data-benchmark.json` in the system temporary directory).

Each dataset is a deterministic tree with a fan-out of 10 children per parent. Correctness is checked once before timing (all rows pass the filter, tree items are flagged by auto-recalc, preset and toggled parents are collapsed in both flat and hierarchical datasets). Each case performs two warm-ups and seven timed samples; the median is the middle sample and p95 is the maximum. Measurements run in Node without a mounted grid or browser rendering, and there are no CI timing thresholds.

Cases:

- `customLocalFilter` scan with `autoRecalcTotalsOnFilterChange`: every row looks up its hierarchical item to flag `__filteredOut`.
- `preFilterTreeData` with preset toggled parents (one per parent): measures applying `presets.treeData.toggledItems` on first pre-filtering.
- `dynamicallyToggleItemState` toggling every parent: updates both the flat item and its hierarchical item.
- `unflattenParentChildArrayToTree` and `flattenToParentChildArray`: conversion baselines.

## Before/after comparison

Baseline `origin/master` (`93ddc671e`) and the Tree Data audit branch were run sequentially on Node v24.15.0 with the same dependencies; the second pair reversed the order. Median timings in milliseconds:

| Rows / case | Before 1 | After 1 | Before 2 | After 2 |
| --- | ---: | ---: | ---: | ---: |
| 5000 / auto-recalc filter scan | 106.41 | 1.05 | 99.73 | 0.90 |
| 5000 / preFilterTreeData, 500 presets | 6.69 | 1.19 | 6.71 | 1.13 |
| 5000 / toggle 500 parents | 16.70 | 0.51 | 16.85 | 0.52 |
| 5000 / unflatten | 0.56 | 0.65 | 0.60 | 0.64 |
| 5000 / flatten | 0.49 | 0.76 | 0.50 | 0.77 |
| 20000 / auto-recalc filter scan | 1917.56 | 4.51 | 5741.24 | 4.10 |
| 20000 / preFilterTreeData, 2000 presets | 335.33 | 5.85 | 366.63 | 5.56 |
| 20000 / toggle 2000 parents | 198.78 | 2.34 | 696.34 | 2.27 |
| 20000 / unflatten | 2.30 | 2.46 | 7.07 | 2.26 |
| 20000 / flatten | 1.81 | 1.63 | 5.75 | 1.79 |

The three lookup-heavy cases were quadratic before (a full tree search per row, preset or toggled item) and are now linear. The conversions are sub-millisecond and within run-to-run noise; a separate 200-sample run measured 5000-row flatten at 0.39/0.35 ms before and 0.44/0.42 ms after, and no difference at 20000 rows.

Raw reports are in `results/tree-data-before.json`, `results/tree-data-after.json` and their `-repeat` variants.

The installed Vitest 5 runner does not export the older `bench()` function, so this file uses ordinary tests with a small timing harness under the existing benchmark configuration.
