# Slickgrid Svelte

A Svelte 5 wrapper around SlickGrid Universal. Install `slickgrid-svelte`, `svelte`, and a Sass compiler, and import a SlickGrid theme in your application.

## Quick Start

```svelte
<script lang="ts">
  import { SlickgridSvelte, type Column, type GridOption } from 'slickgrid-svelte';
  import '@slickgrid-universal/common/dist/styles/sass/slickgrid-theme-bootstrap.scss';

  const columns: Column[] = [{ id: 'title', name: 'Title', field: 'title', sortable: true }];
  const options: GridOption = { enableAutoResize: false, gridWidth: 800, gridHeight: 300 };
  let dataset = $state.raw([{ id: 1, title: 'Task 1' }]);
</script>

<SlickgridSvelte gridId="grid1" {columns} {options} {dataset} />
```

Replace `dataset`, `datasetHierarchical`, `columns`, `options`, or `paginationOptions` with a new value to update the grid (use `$state.raw` for these, mutating them in place is not detected). Each grid needs a unique `gridId`; dataset items need unique IDs. Some options must be enabled at initialization.

Use `className` to add a CSS class to the grid container.

Use `onSvelteGridCreated` or `bind:instances` to access the SlickGrid, DataView, and grid services. The `extensions` prop can also be bound. The component disposes the grid when it unmounts; call `instances.dispose()` to dispose it earlier. The `header` and `footer` snippets render content above and below the grid.

Pass typed event callbacks as component props (for example `onClick`) or in the `events` object using the same names as SlickGrid events. Handlers receive the original `CustomEvent` and can call `preventDefault()` or return `false` for cancellable events. Each event is subscribed once and always calls the latest handler, so handlers can be replaced without re-subscribing.

```svelte
<script lang="ts">
  import { SlickgridSvelte, type SlickgridSvelteInstance } from 'slickgrid-svelte';
  let instances = $state<SlickgridSvelteInstance>();
  const events = {
    onBeforeGridCreate: () => console.log('Creating grid'),
    onGridStateChanged: (event: CustomEvent) => console.log(event.detail),
  };
</script>

<SlickgridSvelte gridId="grid1" {columns} {options} {dataset} {events} bind:instances>
  {#snippet header()}<div>My grid</div>{/snippet}
</SlickgridSvelte>
```

## Integration

- `customDataView` supplies an external DataView at grid creation. The wrapper does not populate it with the `dataset` prop on initialization.
- Supply an i18next-compatible instance through `i18n`, `options.i18n`, or Svelte context under `i18next`. Alternatively, supply a SlickGrid `translater` service. The listener is removed on disposal.
- Supply a Svelte component through `customPaginationComponent` or `options.customPaginationComponent`. Its props are `grid`, `paginationService`, `eventPubSubService`, and `translaterService`; it may export `init`, `renderPagination`, and `dispose` lifecycle methods.
- Install `@slickgrid-universal/svelte-row-detail-plugin` and provide `SvelteRowDetailView` in `externalResources` when `enableRowDetailView` is enabled. Set `rowDetailView.process`, `panelRows`, and Svelte `preloadComponent` / `viewComponent` as needed. Components receive `model`, `addon`, `grid`, `dataView`, and `parentRef`.

Event names and argument types are listed in `SvelteGridEventHandlers`. The Svelte demo includes examples 1 through 58 and a matching Cypress spec for each example.

The [Svelte documentation](./docs/README.md) covers setup, the wrapper API, events, localization, custom Svelte components, pagination, Row Detail, and the shared feature guides. Browse the [documentation contents](./docs/TOC.md).

Run the examples from the repository with `pnpm dev:svelte` after installing dependencies. Build them with `pnpm svelte:build:demo`.
