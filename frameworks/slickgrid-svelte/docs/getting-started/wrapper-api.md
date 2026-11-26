# Svelte wrapper API

`SlickgridSvelte` creates and owns one SlickGrid instance. It accepts the grid inputs as Svelte props and exposes the created grid and services through a bindable instance.

## Props

| Prop | Purpose |
| --- | --- |
| `gridId` | Required unique ID for the grid. |
| `columns` | Column definitions. Reassign the array to update columns. |
| `options` | SlickGrid options. Reassign the object to apply option changes supported by SlickGrid. |
| `dataset` | Flat row data. Reassign the array to replace the grid data. |
| `datasetHierarchical` | Hierarchical data for Tree Data. Reassign to refresh the hierarchy. |
| `customDataView` | Supply a DataView when the grid is created. The wrapper does not populate it from `dataset`. |
| `paginationOptions` | Pagination configuration, as an alternative to `options.pagination`. |
| `events` | Object of typed SlickGrid event callbacks. See [Svelte event handlers](../events/svelte-events.md). |
| `i18n` | i18next-compatible instance used when grid translations are enabled. |
| `customPaginationComponent` | Svelte component used in place of the built-in pagination component. |
| `className` | CSS class applied to the outer grid container. |
| `instances` | Bindable grid, DataView, service, extension, and component references. |
| `extensions` | Bindable list of grid extensions after grid creation. |
| `onSvelteGridCreated` | Callback receiving the wrapper instance after grid creation. |
| `header` / `footer` | Optional [snippets](#snippets) rendered above / below the grid. |

Grid options and column definitions are shared with the other framework wrappers. See the [Grid Options](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/interfaces/gridOption.interface.ts) and [Column](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/interfaces/column.interface.ts) interfaces for the complete option list.

## Reactive updates

The wrapper watches for new references to `columns`, `options`, `dataset`, `datasetHierarchical`, `paginationOptions`, and event handlers. Reassign a value when you want the wrapper to apply an update:

```svelte
<script lang="ts">
  let dataset = $state.raw([{ id: 1, title: 'Task 1' }]);
  let options = $state.raw({ enableSorting: false });

  function addRow() {
    dataset = [...dataset, { id: 3, title: 'Task 3' }];
  }

  function enableSorting() {
    options = { ...options, enableSorting: true };
  }
</script>
```

Use `$state.raw` (not `$state`) for large `dataset`, `columns`, and `options` values. `$state` wraps them in a deep reactive proxy, which slows down SlickGrid, and mutating a proxied array in place is not detected by the wrapper either way.

Changing a reference does not make initialization-only SlickGrid options mutable. For options that SlickGrid can change at runtime, use `instances.slickGrid.setOptions(...)` or the corresponding service API.

## Access grid instances and services

```svelte
<script lang="ts">
  import { SlickgridSvelte, type SlickgridSvelteInstance } from 'slickgrid-svelte';

  let grid = $state<SlickgridSvelteInstance>();

  function onGridCreated(instance: SlickgridSvelteInstance) {
    console.log(instance.slickGrid, instance.dataView);
    instance.gridService.addItemToDatagrid({ id: 3, title: 'Task 3' });
  }
</script>

<SlickgridSvelte gridId="tasks" {columns} {options} {dataset} bind:instances={grid} onSvelteGridCreated={onGridCreated} />
```

The instance exposes `slickGrid`, `dataView`, `element`, `extensions`, and services such as `gridService`, `filterService`, `sortService`, `gridStateService`, `paginationService`, and `resizerService`. It is cleared when the component is destroyed. The wrapper disposes its grid automatically; call `grid.dispose()` only when you need to dispose it before the Svelte component unmounts.

## Snippets

Use the `header` and `footer` snippets to place content before or after the SlickGrid DOM:

```svelte
<SlickgridSvelte gridId="tasks" {columns} {options} {dataset}>
  {#snippet header()}<div>Tasks</div>{/snippet}
  {#snippet footer()}<div>Showing current task data</div>{/snippet}
</SlickgridSvelte>
```

Grid options such as `customFooter` remain available for grid-owned footer rows. These snippets are ordinary Svelte content in the wrapper container.
