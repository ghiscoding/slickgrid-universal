# Performance benchmarks

The SlickDataView benchmark measures the production filter and accumulator loops in isolation from paging, grouping, events, and row-difference calculations.

Run the benchmark on an otherwise idle machine:

```sh
pnpm bench:data-view
```

To compare results across revisions, first save a baseline:

```sh
pnpm bench:data-view --outputJson /tmp/slick-dataview-before.json
```

Then run the comparison from the changed revision:

```sh
pnpm bench:data-view --compare /tmp/slick-dataview-before.json
```

Use the relative results rather than absolute operations per second. Repeat the benchmark at least three times and treat differences smaller than the reported relative margin of error as inconclusive.
