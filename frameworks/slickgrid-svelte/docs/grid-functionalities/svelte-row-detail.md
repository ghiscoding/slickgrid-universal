# Row Detail with Svelte components

Install `@slickgrid-universal/svelte-row-detail-plugin` alongside `slickgrid-svelte`. The plugin mounts Svelte preload and detail components into virtualized row-detail panels and unmounts them when they are no longer needed.

## Configure the plugin

Register `SvelteRowDetailView` in `externalResources`, enable Row Detail, and provide a `process` function that returns a promise resolving to an item containing the grid's dataset ID field (by default, `id`).

```svelte
<script lang="ts">
  import { SvelteRowDetailView } from '@slickgrid-universal/svelte-row-detail-plugin';
  import { SlickgridSvelte, type GridOption } from 'slickgrid-svelte';
  import RowDetailView from './RowDetailView.svelte';
  import RowDetailPreload from './RowDetailPreload.svelte';

  const options: GridOption = {
    enableRowDetailView: true,
    externalResources: [SvelteRowDetailView],
    rowDetailView: {
      panelRows: 5,
      process: async (item) => ({ ...item, detail: `Details for ${item.title}` }),
      preloadComponent: RowDetailPreload,
      viewComponent: RowDetailView,
    },
  };
</script>

<SlickgridSvelte gridId="tasks" {columns} {options} {dataset} />
```

`process` can fetch detail data from a server. Return the row's ID with the response so the plugin can associate it with the expanded row. The process callback, `panelRows`, and other standard Row Detail options are configured in `rowDetailView`.

## Component props

The preload and detail components receive these props:

| Prop | Value |
| --- | --- |
| `model` | The row or detail item provided by the Row Detail process. |
| `addon` | The `SvelteRowDetailView` plugin instance. |
| `grid` | The parent `SlickGrid` instance. |
| `dataView` | The parent `SlickDataView`. |
| `parentRef` | Optional value from `rowDetailView.parentRef`. |

```svelte
<script lang="ts">
  export let model: { id: number; title: string; detail?: string };
</script>

<div class="row-detail-content">
  <strong>{model.title}</strong>
  <p>{model.detail}</p>
</div>
```

## Preserve component state while scrolling

By default, a detail component that leaves the viewport is unmounted and recreated when it returns. Set `keepComponentAlive: true` to retain its Svelte state while moving it out of and back into the viewport:

```ts
rowDetailView: {
  // ...other Row Detail options
  keepComponentAlive: true,
}
```

The plugin also exposes `disposeViewByItem`, `disposeAllViewComponents`, `redrawAllViewComponents`, and `getAddonInstance()` for advanced lifecycle control. See the [Svelte Row Detail plugin README](../../../../frameworks-plugins/svelte-row-detail-plugin/README.md) and the complete [Example 45](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example45.svelte), [detail component](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example45Detail.svelte), and [preload component](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example45Preload.svelte).

For the shared Row Detail options and events, see [Row Detail](row-detail.md).
