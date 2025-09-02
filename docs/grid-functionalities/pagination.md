### Introduction
The project has a built-in Pagination Component but in some cases, users might want to provide their own Custom Pagination Component.

### Demo
[Demo Page](https://ghiscoding.github.io/slickgrid-universal/#/example30) / [Demo Component](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vanilla/src/examples/example30.ts)

#### Custom Pagination
When providing a custom pagination component as a `customPaginationComponent`, that class will be instantiated instead of the regular `SlickPaginationComponent`.

> **Note** Your Custom Pagination must `implements BasePaginationComponent` so that the internal instantiation work as intended.

##### Custom Pagination Component

Create a Custom Pagination Component that requires the following functions, your class will be instantiated and the `init()` will contain all the references to the Services. The `render()` will also be called with the grid container DOM element which is important to either prepend or append your Custom Pagination to the grid.

```ts
import type { BasePaginationComponent, PaginationService, PubSubService, SlickGrid } from '@slickgrid-universal/common';

export class CustomPager implements BasePaginationComponent {
  /** initialize the custom pagination class */
  init(grid: SlickGrid, paginationService: PaginationService, pubSubService: PubSubService, translaterService?: TranslaterService) {}

  /** dipose (aka destroy) to execute when disposing of the pagination (that is when destroying the grid) */
  dispose() {}

  /** render the custom pagination */
  render(containerElm: HTMLElement) {}
}
```

##### Component

You then need to reference your Custom Pagination class to your grid options.

```ts
import { CustomPager } from './custom-pager';

export class GridBasicComponent {
  columnDefinitions: Column[];
  gridOptions: GridOption;
  dataset: any[];

  mount(): void {
    // your columns definition
    this.columnDefinitions = [];

    this.gridOptions = {
      // enable pagination and provide a `customPaginationComponent`
      enablePagination: true,
      customPaginationComponent: CustomPager,

      // provide any of the regular pagination options like usual
      pagination: {
        pageSize: this.pageSize
      },
    }
  }
}
```
