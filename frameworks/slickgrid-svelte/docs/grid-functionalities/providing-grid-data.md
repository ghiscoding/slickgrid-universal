# Providing data to the grid

Pass a flat array through the `dataset` prop. Each item must contain a unique ID field; SlickGrid uses `id` by default. Set `datasetIdPropertyName` in `options` when your model uses a different field.

```svelte
<script lang="ts">
  let dataset = $state.raw([
    { id: 1, title: 'Task 1' },
    { id: 2, title: 'Task 2' },
  ]);

  function refreshData() {
    dataset = loadLatestTasks();
  }
</script>

<SlickgridSvelte gridId="tasks" {columns} {options} {dataset} />
```

The wrapper detects a new array reference. Reassign `dataset` after replacing the data; mutating an existing array in place does not notify the wrapper. For individual client-side changes, use the grid's `gridService` methods described in [Add, Update, or Highlight Items](add-update-highlight.md).

## Use a custom DataView

Pass an existing DataView through `customDataView`. The wrapper uses it when the grid is created and does not populate it from `dataset`, so add items to the DataView before mounting the grid or manage it through your own data flow.

```svelte
<SlickgridSvelte gridId="tasks" {columns} {options} {dataset} {customDataView} />
```

## Tree data

For hierarchical items, pass the nested records through `datasetHierarchical` and configure Tree Data options. Reassign the hierarchy when it changes. See [Tree Data Grid](tree-data-grid.md) for the hierarchy and parent/child options.

## Backend services

When a backend service supplies grid data, configure the relevant backend service API in `options` and let the backend service update its dataset. See [Custom Backend Service](../backend-services/custom-backend-service.md), [OData](../backend-services/OData.md), [GraphQL](../backend-services/GraphQL.md), and [SQL](../backend-services/sql-backend.md).
