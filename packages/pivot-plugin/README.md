# SlickGrid Universal Pivot

Optional pivot engine, grid resource, and interactive field-list resource, adapted from [SlickGrid PR #1334](https://github.com/6pac/SlickGrid/pull/1334). Install `@slickgrid-universal/pivot-plugin` alongside the normal grid packages and import a matching pivot stylesheet.

Create your grid normally and explicitly register the optional resources. The layout container must hold the grid element; the field-list resource adds the sidebar, toolbar, and status bar without creating another grid.

```ts
import { SlickPivot, SlickPivotFieldList } from '@slickgrid-universal/pivot-plugin';
import '@slickgrid-universal/pivot-plugin/dist/styles/css/slick.pivot-default.css';

const pivot = new SlickPivot({
  pivotMode: false,
  fields: [{ id: 'year', type: 'number' }, { id: 'amount', type: 'number' }],
  spec: { rows: ['region'], columns: ['year'], values: [{ field: 'amount', aggregator: 'sum' }] },
});
const fieldList = new SlickPivotFieldList({ container: '#grid-and-pivot', pivot });
const gridOptions = {
  externalResources: [pivot, fieldList],
  enableCellNavigation: true,
};
// Pass gridOptions, your regular column definitions, and dataset to your grid wrapper.
// After the wrapper has initialized the grid, enable the pivot:
await pivot.setPivotMode(true);
```

Fields are derived from the grid columns, with `fields` providing overrides or calculated fields. `pivot.setPivotMode(false)` restores the host grid's data and columns; `pivot.setPivotMode(true)` displays the saved pivot layout again. Register both resources explicitly; options alone do not load the plugin.

Start the resource with `pivotMode: false` and enable it after the wrapper initializes: Universal services need the original DataView during grid creation. The pivot displays aggregated rows while active. Application handlers, menus, exports, filtering, and selection logic that expect source records must account for pivot mode. See Vanilla Example 48 for a complete example.
