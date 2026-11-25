# Dynamic row metadata

SlickGrid DataView item metadata can add CSS classes or override row and cell behavior for individual rows. Use it when row styling depends on the current data values.

This Svelte example applies a class to rows whose duration is greater than 40:

```svelte
<script lang="ts">
  let grid: SlickgridSvelteInstance | undefined;

  function highlightLongTasks() {
    if (!grid) return;

    const dataView = grid.dataView;
    const previousMetadata = dataView.getItemMetadata;
    dataView.getItemMetadata = (rowNumber) => {
      const previous = typeof previousMetadata === 'function' ? previousMetadata.call(dataView, rowNumber) : undefined;
      const item = dataView.getItem(rowNumber);
      const cssClasses = item && Number(item.duration) > 40 ? `${previous?.cssClasses ?? ''} duration-bg`.trim() : previous?.cssClasses;
      return cssClasses ? { ...previous, cssClasses } : (previous ?? null);
    };

    grid.slickGrid.invalidate();
  }
</script>

<button class="btn btn-outline-secondary" onclick={highlightLongTasks}>Highlight long tasks</button>
<SlickgridSvelte gridId="tasks" {columns} {options} {dataset} bind:instances={grid} />

<style>
  :global(.duration-bg) {
    background-color: #fff2cc;
  }
</style>
```

Preserve and merge metadata returned by the previous callback so other plugins and existing row classes continue to work. Call `invalidate()` after replacing the metadata callback to render the new styles. If metadata depends on a dataset update, update or invalidate it after the data changes as well.

For shared item metadata options and styling hooks, see [Dynamic Styling with Item Metadata](../styling/dynamic-styling-with-metadata.md) and [Providing data to the grid](providing-grid-data.md).
