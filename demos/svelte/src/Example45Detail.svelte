<script lang="ts">
  import { SlickgridSvelte, type Column, type GridOption, type GridState, type SlickgridSvelteInstance } from 'slickgrid-svelte';
  import { onMount } from 'svelte';
  import type { Distributor } from './data/example45.model.js';

  export let model: Distributor;
  export let parentRef: any;
  export let addon: any;
  let innerGrid: SlickgridSvelteInstance;
  let showGrid = false;
  const innerGridClass = `row-detail-inner-${model.id}`;
  const stateKey = `gridstate_row-detail-${model.id}`;
  let presets: GridState | undefined;
  if (model.isUsingInnerGridStatePresets) {
    const stored = sessionStorage.getItem(stateKey);
    if (stored) {
      presets = JSON.parse(stored);
    }
  }
  let columns: Column[] = [
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
  let dataset = [...model.orderData];
  onMount(() => (showGrid = true));
  function saveState() {
    if (model.isUsingInnerGridStatePresets && innerGrid?.gridStateService) {
      sessionStorage.setItem(stateKey, JSON.stringify(innerGrid.gridStateService.getCurrentGridState()));
    }
  }
  function alertAssignee() {
    alert(`Orders for ${model.companyName}`);
  }
  function deleteRow() {
    if (confirm(`Are you sure that you want to delete ${model.companyName}?`)) {
      addon?.collapseAll();
      parentRef?.showFlashMessage?.(`Deleted row with ${model.companyName}`, 'danger');
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
