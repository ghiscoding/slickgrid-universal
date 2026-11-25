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

Grid options and column definitions are shared with the other framework wrappers. See the [Grid Options](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/interfaces/gridOption.interface.ts) and [Column](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/interfaces/column.interface.ts) interfaces for the complete option list.

## Reactive updates

The wrapper watches for new references to `columns`, `options`, `dataset`, `datasetHierarchical`, `paginationOptions`, and event handlers. Reassign a value when you want the wrapper to apply an update:

```svelte
<script lang="ts">
  function addRow() {
    dataset = [...dataset, { id: 3, title: 'Task 3' }];
  }

  function enableSorting() {
    options = { ...options, enableSorting: true };
  }
</script>
```

Changing a reference does not make initialization-only SlickGrid options mutable. For options that SlickGrid can change at runtime, use `instances.slickGrid.setOptions(...)` or the corresponding service API.

## Access grid instances and services

```svelte
<script lang="ts">
  import { SlickgridSvelte, type SlickgridSvelteInstance } from 'slickgrid-svelte';

  let grid: SlickgridSvelteInstance | undefined;

  function onGridCreated(instance: SlickgridSvelteInstance) {
    console.log(instance.slickGrid, instance.dataView);
    instance.gridService.addItemToDatagrid({ id: 3, title: 'Task 3' });
  }
</script>

<SlickgridSvelte gridId="tasks" {columns} {options} {dataset} bind:instances={grid} onSvelteGridCreated={onGridCreated} />
```

The instance exposes `slickGrid`, `dataView`, `element`, `extensions`, and services such as `gridService`, `filterService`, `sortService`, `gridStateService`, `paginationService`, and `resizerService`. It is cleared when the component is destroyed. The wrapper disposes its grid automatically; call `grid.dispose()` only when you need to dispose it before the Svelte component unmounts.

## Slots

Use the named `header` and `footer` slots to place content before or after the SlickGrid DOM:

```svelte
<SlickgridSvelte gridId="tasks" {columns} {options} {dataset}>
  <div slot="header">Tasks</div>
  <div slot="footer">Showing current task data</div>
</SlickgridSvelte>
```

Grid options such as `customFooter` remain available for grid-owned footer rows. These slots are ordinary Svelte content in the wrapper container.
