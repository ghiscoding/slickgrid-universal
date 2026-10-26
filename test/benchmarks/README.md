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
