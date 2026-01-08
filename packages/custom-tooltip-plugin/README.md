[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![lerna--lite](https://img.shields.io/badge/maintained%20with-lerna--lite-e137ff)](https://github.com/ghiscoding/lerna-lite)
[![npm](https://img.shields.io/npm/v/@slickgrid-universal/custom-tooltip-plugin.svg)](https://www.npmjs.com/package/@slickgrid-universal/custom-tooltip-plugin)
[![npm](https://img.shields.io/npm/dy/@slickgrid-universal/custom-tooltip-plugin)](https://www.npmjs.com/package/@slickgrid-universal/custom-tooltip-plugin)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/@slickgrid-universal/custom-tooltip-plugin?color=success&label=gzip)](https://bundlephobia.com/result?p=@slickgrid-universal/custom-tooltip-plugin)

## Custom Tooltip (plugin)
#### @slickgrid-universal/custom-tooltip-plugin

A plugin to add Custom Tooltip when hovering a cell, it subscribes to the cell `onMouseEnter` and `onMouseLeave` events.
The `customTooltip` is defined in the Column Definition OR Grid Options (the first found will have priority over the second)
To specify a tooltip when hovering a cell, extend the column definition like so:

Available plugin options (same options are available in both column definition and/or grid options)

#### Register the plugin
In order to use the Service, you will need to register it in your grid options via the `externalResources` as shown in the Example 2 below.

##### Example 1  - via Column Definition
```ts
this.columnDefinitions = [
  {
    id: "action", name: "Action", field: "action", formatter: fakeButtonFormatter,
    customTooltip: {
      formatter: tooltipTaskFormatter,
      // ...
    }
  }
];
```

##### OR Example 2 - via Grid Options (for all columns), NOTE: the column definition tooltip options will win over the options defined in the grid options

```ts
import { SlickCustomTooltip } from '@slickgrid-universal/custom-tooltip-plugin';

export class MyExample {
  initializeGrid {
    this.gridOptions = {
      customTooltip: {
        formatter: tooltipTaskFormatter,
        // ...
      },
      externalResources: [new SlickCustomTooltip(), this.excelExportService],
    };
  }
}
```

### Internal Dependencies
- [@slickgrid-universal/common](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/common)

### Installation
Follow the instruction provided in the main [README](https://github.com/ghiscoding/slickgrid-universal#installation)
