# Svelte Row Detail Plugin

Install this package with `slickgrid-svelte` and add `SvelteRowDetailView` to grid `externalResources`. Enable `enableRowDetailView` and configure a `rowDetailView` with `process`, `panelRows`, and optional `preloadComponent` and `viewComponent` Svelte components. Components receive `model`, `addon`, `grid`, `dataView`, and `parentRef` props. The plugin creates and destroys views as rows expand, collapse, and move in and out of the viewport. `keepComponentAlive` retains component state while a row is outside the viewport.
