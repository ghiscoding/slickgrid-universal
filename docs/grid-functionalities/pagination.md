### Introduction
The project has a built-in Pagination Component but in some cases, users might want to provide their own Custom Pagination Component.

### Demo
[Demo Page](https://ghiscoding.github.io/slickgrid-universal/#/example30) / [Demo Component](https://github.com/ghiscoding/slickgrid-universal/blob/master/examples/webpack-demo-vanilla-bundle/src/examples/example30.ts)

#### Custom Pagination
When providing a custom pagination component as a `customPaginationComponent`, that class will be instantiated instead of the regular `SlickPaginationComponent`.

> **Note** Your Custom Pagination must `implements BasePaginationComponent` so that the internal instantiation work as intended.

##### Component

```ts
import { CustomPager } from './custom-pager';

export class GridBasicComponent {
  columnDefinitions: Column[];
  gridOptions: GridOption;
  dataset: any[];

  attached(): void {
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

###### Custom Pagination Component
```ts
import type { BasePaginationComponent, PaginationService, PubSubService, SlickGrid } from '@slickgrid-universal/common';

export class CustomPager implements BasePaginationComponent {
  constructor(protected readonly grid: SlickGrid, protected readonly paginationService: PaginationService, protected readonly pubSubService: PubSubService) {
     // ...
  }

  dispose() {
    // ...
  }

  render(containerElm: HTMLElement) {
    // ...
  }
}
```
