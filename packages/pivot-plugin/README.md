# SlickGrid Universal Pivot

Optional pivot engine, grid resource, and interactive field-list resource, adapted from [SlickGrid PR #1334](https://github.com/6pac/SlickGrid/pull/1334). Install `@slickgrid-universal/pivot-plugin` alongside the normal grid packages and import a matching pivot stylesheet.

Create your grid normally and explicitly register the optional resources. The layout container must hold the grid element; the field-list resource adds the sidebar, toolbar, and status bar without creating another grid.

```ts
import { SlickPivot, SlickPivotFieldList } from '@slickgrid-universal/pivot-plugin';
import '@slickgrid-universal/pivot-plugin/dist/styles/css/slick.pivot-default.css';

const pivot = new SlickPivot({
  pivotMode: true,
  fields: [{ id: 'year', type: 'number' }, { id: 'amount', type: 'number' }],
  spec: { rows: ['region'], columns: ['year'], values: [{ field: 'amount', aggregator: 'sum' }] },
});
const fieldList = new SlickPivotFieldList({ container: '#grid-and-pivot', pivot });
const gridOptions = {
  externalResources: [pivot, fieldList],
  enableCellNavigation: true,
};
// Pass gridOptions, your regular column definitions, and dataset to your grid wrapper.
```

Fields are derived from the grid columns, with `fields` providing overrides or calculated fields. `pivot.setPivotMode(false)` restores the host grid's data and columns; `pivot.setPivotMode(true)` displays the saved pivot layout again. Register both resources explicitly; options alone do not load the plugin.

Initial Pivot Mode is activated after synchronous grid initialization so Universal services can initialize with the source DataView. The pivot displays aggregated rows while active. Application handlers, menus, exports, filtering, and selection logic that expect source records must account for pivot mode. See Vanilla Example 48 for a complete example.

## Drill-down details

Double-clicking a Pivot value opens a details dialog showing its source rows. The dialog creates a separate, basic SlickGrid with sortable columns and its own lifecycle. It does not initialize the host wrapper's services or extensions, including GridMenu, ColumnPicker, and filters. Configure the dialog through the field-list resource's `details` option, including `maxRows`, `columns`, and `gridOptions`.

To provide your own details UI, disable the built-in dialog and subscribe to the Pivot event:

```ts
const fieldList = new SlickPivotFieldList({ container: '#grid-and-pivot', pivot, details: false });
pivot.onPivotCellDrillDown.subscribe((_event, args) => {
  // args.rows contains the source records; rowPath, columnPath and valueId identify the aggregate.
  showDetails(args.rows, args.rowPath, args.columnPath, args.valueId);
});
```

`showDetails` represents an application-provided function. The event also provides row and column keys. Use the normal framework wrapper in that function if the application needs a details grid with its own services and extensions.
