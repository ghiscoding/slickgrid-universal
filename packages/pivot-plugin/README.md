# SlickGrid Universal Pivot

Optional pivot table plugin for SlickGrid Universal, adapted from [SlickGrid PR #1334](https://github.com/6pac/SlickGrid/pull/1334) (MIT license). It includes the pivot engine, grid plugin, field list, toolbar, source-row details dialog, and a composed pivot table.

```bash
pnpm add @slickgrid-universal/pivot-plugin @slickgrid-universal/common
```

Import the matching theme stylesheet, for example:

```ts
import '@slickgrid-universal/pivot-plugin/dist/styles/css/slick.pivot-default.css';
```

For a complete pivot table, give the container a height and create `SlickPivotTable`:

```ts
import { SlickPivotTable } from '@slickgrid-universal/pivot-plugin';

const table = new SlickPivotTable('#pivot', {
  fields: [
    { id: 'region', label: 'Region' },
    { id: 'year', label: 'Year', type: 'number' },
    { id: 'amount', label: 'Amount', type: 'number' },
  ],
  source: [
    { region: 'East', year: 2025, amount: 120 },
    { region: 'West', year: 2025, amount: 80 },
  ],
  spec: {
    rows: ['region'],
    columns: ['year'],
    values: [{ field: 'amount', aggregator: 'sum' }],
  },
});

// When the host view is removed:
table.destroy();
```

`SlickPivot` can also be registered as a Universal external resource. Create it before the grid, pass `pivot.rowModel` as the grid data, and merge `SlickPivot.getGridOptions()` into the grid options so the grouped column headers have a pre-header panel. The class implements `init()` and `dispose()` for the external resource lifecycle. `PivotEngine` can be used without a DOM or grid.

The `src/styles/slick.pivot.scss` source and compiled styles for Bootstrap, Default, Fluent, Material, and Salesforce themes are published with the package.

See [Vanilla Example 48](../../demos/vanilla/src/examples/example48.ts) for a complete interactive demo with the field list, toolbar, layout actions, and 5,000 sales rows.

The **Pivot Mode** checkbox switches between pivot results and local source rows. The pivot layout is retained across switches. The checkbox is disabled when there is no local source, such as a provider-only pivot. Use `table.isPivotMode()` and `table.setPivotMode(enabled)` to read or change the mode.
