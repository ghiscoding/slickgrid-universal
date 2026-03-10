## Column Picker
Enable by default and provides the list of available fields by simply doing a `right+click` over any column header, you can then hide/show the column(s) you want.

#### Grid Options
To enable/disable the Column Picker, simply call the `enableColumnPicker` flag in the Grid Options (enabled by default).

```ts
gridOptions.value = {
  enableColumnPicker: true,

  // you can also enable/disable options and also use event for it
  columnPicker: {
    hideForceFitButton: true,
    hideSyncResizeButton: true,
    onColumnsChanged: (e, args) => {
      console.log('Column selection changed from Column Picker, visible columns: ', args.visibleColumns);
    }
  },
}
```

#### UI Sample
![image](https://user-images.githubusercontent.com/643976/71301681-6cfc3a00-2370-11ea-9c84-be880f345bcd.png)

### Use the `columnSort` option to sort columns (deprecated)
##### now `@deprecated`, use `columnListBuilder` in >= 10.x

The example below demonstrates how to use the new alphabetical sorting feature:

```ts
columnPicker: {
  // enable the "columnSort" option to sort columns by name
  columnSort: (item1: Column, item2: Column) => {
    const nameA = item1.name?.toString().toLowerCase() || '';
    const nameB = item2.name?.toString().toLowerCase() || '';
    return nameA.localeCompare(nameB);
  },
}
```

### Use the `columnListBuilder` option to filter/sort columns

The `columnListBuilder` is a callback that is executed after reading the built-in columns but before rendering them in the DOM (this is useful to filter or sort columns).

For example:

```ts
columnPicker: {
  // enable the "columnSort" option to sort columns by name
  columnListBuilder: (columns: Column[]) => {
    // optionally sort columns
    columns.sort((a, b) => {
      const nameA = item1.name?.toString().toLowerCase() || '';
      const nameB = item2.name?.toString().toLowerCase() || '';
      return nameA.localeCompare(nameB);
    });

    // optionally filter some columns
    return columns.filter(c => c.field !== 'gender');
  },
}
```