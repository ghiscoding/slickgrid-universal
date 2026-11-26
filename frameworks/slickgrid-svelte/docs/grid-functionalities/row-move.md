# Row Move

The Row Move extension lets users drag rows to another position in the grid. By default, it updates the DataView order for you. The Svelte demo shows the complete interaction in [Example 16](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example16.svelte).

## Basic setup

Enable `enableRowMoveManager` and configure its options. If your application also stores the data in a Svelte variable, use `onAfterMoveRows` to replace that variable with the reordered items:

```svelte
<script lang="ts">
  import { SlickgridSvelte, type GridOption } from 'slickgrid-svelte';

  let dataset = Array.from({ length: 500 }, (_, id) => ({ id, title: `Task ${id}` }));
  const columns = [{ id: 'title', name: 'Title', field: 'title' }];
  const options: GridOption = {
    enableRowMoveManager: true,
    rowMoveManager: {
      columnIndexPosition: 0,
      singleRowMove: true,
      disableRowSelection: true,
      cancelEditOnDrag: true,
      hideRowMoveShadow: false,
      onAfterMoveRows: (_event, args) => {
        dataset = args.updatedItems;
      },
    },
  };
</script>

<SlickgridSvelte gridId="tasks" {columns} {options} {dataset} />
```

## Row Move options

| Option | Description |
| --- | --- |
| `autoScrollWhenDrag` | Automatically scroll the grid while dragging. Defaults to `true`. |
| `cancelEditOnDrag` | Cancel the active cell edit when dragging starts. Defaults to `false`. |
| `columnId` | ID of the move handle column. |
| `columnIndexPosition` | Position of the move handle column. Defaults to `0`. |
| `disableRowSelection` | Disable row selection while using the move handle. Defaults to `false`. |
| `dragToSelect` | Allow dragging to select rows. |
| `hideRowMoveShadow` | Hide the dragged-row shadow. Defaults to `true`. |
| `reorderable` | Allow the move handle column itself to be reordered. Defaults to `false`. |
| `rowMoveShadowMarginLeft`, `rowMoveShadowMarginTop` | Offset the dragged-row shadow. |
| `rowMoveShadowOpacity`, `rowMoveShadowScale` | Set the shadow opacity and scale. |
| `singleRowMove` | Limit each drag to one row. Defaults to `false`. |
| `width` | Width of the move handle column in pixels. |
| `usabilityOverride` | Decide whether a target row can be moved over. |
| `onBeforeMoveRows` | Validate a proposed drop. Return `false` to prevent it. |
| `onMoveRows` | Replace the default row-reordering logic with application-specific logic. |
| `onAfterMoveRows` | Receive the updated item order after a move. |

For example, reject a drop directly before or after one of the dragged rows:

```ts
const options: GridOption = {
  enableRowMoveManager: true,
  rowMoveManager: {
    onBeforeMoveRows: (_event, args) =>
      !args.rows.some((row) => row === args.insertBefore || row === args.insertBefore - 1),
  },
};
```

If you provide `onMoveRows`, it replaces the built-in reordering. Implement the order update for your data source there, then use `onAfterMoveRows` when you need to synchronize another Svelte state value. The callback receives the grid, the dragged row indexes, and the insertion index.
