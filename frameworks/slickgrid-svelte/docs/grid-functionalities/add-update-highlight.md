# Add, update, delete, and highlight rows

Use the grid service to change rows in the client-side DataView. These calls update the grid; persist the same change to your backend separately when the application uses server data.

The complete Svelte example is [Example 11](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example11.svelte).

## Get the grid service

Use `bind:instances` or `onSvelteGridCreated` to access `gridService`:

```svelte
<script lang="ts">
  import type { SlickgridSvelteInstance } from 'slickgrid-svelte';

  let grid: SlickgridSvelteInstance | undefined;

  function addTask() {
    if (!grid) return;
    const item = { id: Date.now(), title: 'New task', duration: 1 };
    grid.gridService.addItem(item);
  }
</script>

<button class="btn btn-primary" onclick={addTask}>Add task</button>
<SlickgridSvelte gridId="tasks" {columns} {options} {dataset} bind:instances={grid} />
```

Every row needs a unique value in `datasetIdPropertyName` (which defaults to `id`). Add and update operations can also select and highlight the changed row; a valid row selection model must be enabled if you request row selection.

## Add or upsert

`addItem` inserts an item. Its default position is the top of the grid; pass `{ position: 'bottom' }` to append it. `upsertItem` inserts a new ID or updates an existing ID.

```ts
grid.gridService.addItem(item, {
  position: 'top',
  highlightRow: true,
  selectRow: false,
  resortGrid: false,
  triggerEvent: true,
});

grid.gridService.upsertItem(item);
```

Tree Data has different insertion rules: items are inserted into their parent group, and the regular top/bottom position is not supported.

## Update or delete

Update the item and pass it to `updateItem`, or use `updateItemById` when you have the ID. Delete with `deleteItemById` or `deleteItemByIds`:

```ts
const item = grid.dataView.getItemById(1);
if (item) {
  item.duration = 10;
  grid.gridService.updateItem(item, { highlightRow: true });
}

grid.gridService.deleteItemById(2);
```

The default `triggerEvent` setting is true for add, update, and delete operations. Set it to false when an operation should not publish the corresponding grid event.

## Highlight a row

Use a visible grid row index to highlight it for a short time:

```ts
grid.gridService.highlightRow(4, 1500);
```

The highlight color and fade animation can be customized with the `$row-highlight-background-color` and `$row-highlight-fade-animation` Sass variables in the [common variables file](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/styles/_variables.scss).
