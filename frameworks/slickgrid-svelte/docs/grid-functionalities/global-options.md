# Global Grid Options

Every grid accepts the shared `GridOption` interface through the `options` prop. Per-grid values override SlickGrid Universal defaults:

```svelte
<script lang="ts">
  import { SlickgridSvelte, type GridOption } from 'slickgrid-svelte';

  const options: GridOption = {
    enableFiltering: true,
    enableSorting: true,
    rowHeight: 32,
  };
</script>

<SlickgridSvelte gridId="tasks" {columns} {options} {dataset} />
```

To keep application-wide defaults in one place, define a typed object and spread it into each grid's options. The per-grid values can override the shared values:

```ts
const appGridDefaults: Partial<GridOption> = {
  enableFiltering: true,
  enableSorting: true,
  rowHeight: 32,
};

const options: GridOption = {
  ...appGridDefaults,
  enableFiltering: false,
};
```

The Svelte wrapper adds framework defaults internally, including camel-case event names. Apply application settings through each grid's `options`; wrapper-wide mutable defaults are not currently exposed as a Svelte API.

The complete option list is in the shared [GridOption interface](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/interfaces/gridOption.interface.ts). See [Column Options](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/interfaces/column.interface.ts) for column-level settings.
