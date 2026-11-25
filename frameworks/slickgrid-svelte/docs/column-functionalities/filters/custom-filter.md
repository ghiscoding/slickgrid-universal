# Custom Filters

Use a custom filter when the built-in input, select, autocomplete, date, slider, or range filters do not match the search UI your application needs. A custom filter implements SlickGrid's `Filter` interface and is registered as the column's `filter.model`.

## Register a custom filter

```ts
const columns: Column[] = [
  {
    id: 'status',
    name: 'Status',
    field: 'status',
    filterable: true,
    filter: { model: StatusFilter },
  },
];
```

The filter adapter receives a `FilterArguments` object from SlickGrid. Implement `init`, `getValues`, `setValues`, `clear`, and `destroy` to create the filter UI, synchronize the selected search terms, and release its resources. Call the provided `callback` when the filter changes so the DataView or backend service can run the query.

For a filter implemented with a Svelte component, mount the component into `args.filterContainerElm` and unmount it in `destroy()`. See [Svelte Component Editors and Filters](../svelte-components.md) and the complete [Example 26 filter adapter](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/data/custom-svelteComponentFilter.ts).

See the common [`Filter` interface](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/interfaces/filter.interface.ts) for the required contract. Standard filter choices are described in [Filters](filter-intro.md).
