# Quick start

Slickgrid-Svelte is a Svelte 5 wrapper around SlickGrid Universal. Grid columns, options, data, plugins, filters, editors, and services use the same APIs as the other framework wrappers.

## Install

The `slickgrid-svelte` package is not published to npm yet. When it is available, install it with Svelte and the common package used for theme styles:

```sh
npm install slickgrid-svelte svelte @slickgrid-universal/common
```

For Sass themes, add a Sass compiler such as `sass`. Bootstrap is optional. In this monorepo, install dependencies and start the Svelte demo with:

```sh
pnpm install
pnpm dev:svelte
```

## Import a theme

Import one SlickGrid theme once from your application entry point or a global stylesheet. The Bootstrap theme expects Bootstrap styles; use the default theme if you do not use Bootstrap.

```ts
import '@slickgrid-universal/common/dist/styles/css/slickgrid-theme-bootstrap.css';
```

Available themes include `slickgrid-theme-default`, `slickgrid-theme-bootstrap`, `slickgrid-theme-material`, `slickgrid-theme-salesforce`, and `slickgrid-theme-fluent`. See [Styling CSS/SASS/Themes](../styling/styling.md) for Sass customization.

## Create a grid

```svelte
<script lang="ts">
  import { SlickgridSvelte, type Column, type GridOption, type SlickgridSvelteInstance } from 'slickgrid-svelte';

  let columns: Column[] = [
    { id: 'title', name: 'Title', field: 'title', sortable: true, minWidth: 120 },
    { id: 'duration', name: 'Duration', field: 'duration', sortable: true, minWidth: 90 },
  ];
  let options: GridOption = {
    enableAutoResize: false,
    gridHeight: 320,
    gridWidth: 800,
    enableFiltering: true,
  };
  let dataset = [
    { id: 1, title: 'Task 1', duration: 5 },
    { id: 2, title: 'Task 2', duration: 8 },
  ];
  let grid: SlickgridSvelteInstance | undefined;

  function gridCreated(instance: SlickgridSvelteInstance) {
    grid = instance;
  }

  function addTask() {
    dataset = [...dataset, { id: dataset.length + 1, title: `Task ${dataset.length + 1}`, duration: 3 }];
  }
</script>

<button class="btn btn-primary" onclick={addTask}>Add task</button>

<SlickgridSvelte
  gridId="tasks-grid"
  {columns}
  {options}
  {dataset}
  bind:instances={grid}
  onSvelteGridCreated={gridCreated}
/>
```

Each grid needs a unique `gridId`, and every data item needs a unique ID. The grid uses `id` by default; set `datasetIdPropertyName` in the grid options if your items use a different key.

Reassign `columns`, `options`, `dataset`, `datasetHierarchical`, or `paginationOptions` to notify the wrapper of changes. Mutating an existing array or object in place does not trigger its Svelte update handling.

The wrapper creates the grid when the component mounts and disposes it when the component is destroyed. Use `bind:instances` or `onSvelteGridCreated` to access the SlickGrid and its services. See the [wrapper API](wrapper-api.md) for all props, events, and slots.

## Use the demo as a reference

The [Svelte demo](../../../../demos/svelte) has examples 1–58. Open an example in the demo and follow its code link, or browse [`demos/svelte/src`](../../../../demos/svelte/src). The [examples index](../examples.md) links to each component and Cypress spec.

For shared grid configuration, see the [Grid Options interface](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/interfaces/gridOption.interface.ts) and the feature guides in this documentation.
