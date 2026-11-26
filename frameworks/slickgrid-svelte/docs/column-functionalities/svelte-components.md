# Custom editors and filters with Svelte components

SlickGrid editors and filters use framework-neutral lifecycle interfaces. To render a Svelte component inside a grid editor or filter, implement the corresponding `Editor` or `Filter` class and mount the component into the container supplied by SlickGrid.

The complete working example is [Example 26](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example26.svelte). It includes the [Svelte select component](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/AssigneeSelect.svelte), [editor adapter](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/data/custom-svelteComponentEditor.ts), and [filter adapter](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/data/custom-svelteComponentFilter.ts).

The snippets below show the adapter lifecycle and omit interface methods for brevity; use the linked demo for complete implementations.

## Configure a column

Register your adapter class in the column definition. The `model` is an adapter class that implements SlickGrid's lifecycle; it is not the `.svelte` component itself.

```ts
const columns: Column[] = [
  {
    id: 'assignee',
    name: 'Assignee',
    field: 'assignee',
    filterable: true,
    filter: { model: AssigneeComponentFilter, collection: assignees },
    editor: { model: AssigneeComponentEditor, collection: assignees },
  },
];
```

## Editor adapter

Mount the Svelte component into `EditorArguments.container`, synchronize its value through the editor lifecycle methods, and commit or cancel edits through `EditorArguments`. Unmount the component from `destroy()` so repeated edits do not leak component instances.

```ts
import { mount, unmount } from 'svelte';
import AssigneeSelect from './AssigneeSelect.svelte';

class AssigneeComponentEditor implements Editor {
  private component: Record<string, any>;

  constructor(private args: EditorArguments) {
    this.component = mount(AssigneeSelect, { target: args.container });
  }

  loadValue(item: any) { /* set the component's selected value from item */ }
  serializeValue() { /* return the current selected value */ }
  applyValue(item: any, value: any) { item[this.args.column.field] = value; }
  isValueChanged() { /* compare the edited value with the original value */ }
  validate() { return { valid: true, msg: null }; }
  destroy() { void unmount(this.component); }
}
```

The editor must implement the methods required by the SlickGrid `Editor` interface. Use `args.commitChanges()` or `args.cancelChanges()` when your component has explicit Save or Cancel actions. The linked demo shows validation, keyboard focus, and `autoCommitEdit` handling.

## Filter adapter

Mount the component into `FilterArguments.filterContainerElm`. When the selection changes, call the supplied filter callback with the column, operator, and search terms. Unmount in `destroy()`.

```ts
import { mount, unmount } from 'svelte';
import AssigneeSelect from './AssigneeSelect.svelte';

class AssigneeComponentFilter implements Filter {
  private component?: Record<string, any>;

  init(args: FilterArguments) {
    this.component = mount(AssigneeSelect, {
      target: args.filterContainerElm,
      props: {
        onSelectedItemChanged: (item) =>
          args.callback(undefined, {
            columnDef: args.columnDef,
            operator: args.operator ?? 'EQ',
            searchTerms: item ? [item.id] : [],
          }),
      },
    });
  }

  destroy() {
    if (this.component) void unmount(this.component);
  }
}
```

Implement the remaining `Filter` methods such as `getValues`, `setValues`, and `clear` to support restoring filter state and clearing the grid filters. The demo filter adapter shows the full implementation.

## Cell rendering

Use a formatter when a cell value can be represented as a string or HTML. Use the editor and filter adapter approach above for interactive component UI. For asynchronous row detail content and custom pagination, use the dedicated [Svelte Row Detail](../grid-functionalities/svelte-row-detail.md) and [Svelte pagination](../grid-functionalities/svelte-pagination.md) integrations.
