# Custom pagination with a Svelte component

The built-in pagination component is recommended for most grids. To use a Svelte component instead, pass it through the `customPaginationComponent` prop or `options.customPaginationComponent`. The wrapper mounts and unmounts the component and adapts it to SlickGrid's pagination lifecycle.

```svelte
<script lang="ts">
  import { SlickgridSvelte, type GridOption } from 'slickgrid-svelte';
  import CustomPager from './CustomPager.svelte';

  const options: GridOption = {
    enablePagination: true,
    pagination: { pageSize: 50 },
  };
</script>

<SlickgridSvelte
  gridId="tasks"
  {columns}
  {dataset}
  {options}
  customPaginationComponent={CustomPager}
/>
```

## Component props and lifecycle

The component receives `grid`, `paginationService`, `eventPubSubService`, and optional `translaterService` props. You can implement lifecycle methods as component exports:

```svelte
<script lang="ts">
  import type { BasePubSubService } from '@slickgrid-universal/event-pub-sub';
  import type { PaginationService, SlickGrid, TranslaterService } from '@slickgrid-universal/common';

  export let paginationService: PaginationService;
  export let eventPubSubService: BasePubSubService;

  export function init(
    _grid: SlickGrid,
    service: PaginationService,
    pubSub: BasePubSubService,
    _translater?: TranslaterService
  ) {
    paginationService = service;
    eventPubSubService = pubSub;
    // Subscribe to onPaginationRefreshed and update component state.
  }

  export function renderPagination(_container: HTMLElement) {
    // Optional: set up a root element or its CSS classes.
  }

  export function dispose() {
    // Unsubscribe any listeners created by init().
  }
</script>

<!-- Render controls that call paginationService.goToFirstPage(),
     goToPreviousPage(), goToNextPage(), and goToLastPage(). -->
```

Slickgrid-Svelte calls `init`, `renderPagination`, and `dispose` when the component exports those functions. Use `eventPubSubService` to subscribe to pagination refresh events, and unsubscribe in `dispose`.

The `createSveltePagination` helper is also exported for integrations that need to create the adapter class directly. The demo's complete pager is [CustomPagerComponent.svelte](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/CustomPagerComponent.svelte), used in [Example 42](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example42.svelte).

For page sizes, server-side pagination, and shared pagination options, see [Pagination](pagination.md).
