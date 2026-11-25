<script lang="ts">
  import { SlickgridSvelte, type Column, type GridOption, type GridState, type SlickgridSvelteInstance } from 'slickgrid-svelte';
  import { onMount, untrack } from 'svelte';
  import type { Distributor } from './data/example45.model.js';

  let { model }: { model: Distributor } = $props();
  // the row detail is mounted once per item, so the initial model is all the inner grid needs
  const initialModel = untrack(() => model);
  let innerGrid: SlickgridSvelteInstance | undefined;
  let showGrid = $state(false);
  const innerGridClass = `row-detail-inner-${initialModel.id}`;
  const stateKey = `gridstate_row-detail-${initialModel.id}`;
  let presets: GridState | undefined;
  if (initialModel.isUsingInnerGridStatePresets) {
    const stored = sessionStorage.getItem(stateKey);
    if (stored) {
      presets = JSON.parse(stored);
    }
  }
  const columns: Column[] = [
    { id: 'orderId', field: 'orderId', name: 'Order ID', filterable: true, sortable: true },
    { id: 'shipCity', field: 'shipCity', name: 'Ship City', filterable: true, sortable: true },
    { id: 'freight', field: 'freight', name: 'Freight', filterable: true, sortable: true, type: 'number' },
    { id: 'shipName', field: 'shipName', name: 'Ship Name', filterable: true, sortable: true },
  ];
  const options: GridOption = {
    autoResize: { container: `.${innerGridClass}`, rightPadding: 30, minHeight: 200 },
    enableFiltering: true,
    enableSorting: true,
    rowHeight: 33,
    enableCellNavigation: true,
    datasetIdPropertyName: 'orderId',
    presets,
  };
  const dataset = [...initialModel.orderData];
  onMount(() => (showGrid = true));
  function saveState() {
    if (model.isUsingInnerGridStatePresets && innerGrid?.gridStateService) {
      sessionStorage.setItem(stateKey, JSON.stringify(innerGrid.gridStateService.getCurrentGridState()));
    }
  }
</script>

<div class={innerGridClass}>
  <h4>{model.companyName} - Order Details (id: {model.id})</h4>
  <div class="container-fluid">
    {#if showGrid}<SlickgridSvelte
        gridId={`innergrid-${model.id}`}
        className="innergrid"
        {options}
        {columns}
        {dataset}
        onBeforeGridDestroy={saveState}
        onSvelteGridCreated={(instance) => (innerGrid = instance)}
      />{/if}
  </div>
</div>

<style>
  :global(.innergrid) {
    --slick-header-menu-display: inline-block;
  }
</style>
