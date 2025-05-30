### Demo

#### Header Button Plugin
[Demo Page](https://ghiscoding.github.io/slickgrid-vue-demos/#/Example7) / [Demo Component](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example7.vue)

#### Header Menu Plugin
[Demo Page](https://ghiscoding.github.io/slickgrid-vue-demos/#/Example8) / [Demo Component](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example8.vue)

## Header Menu
The `Header Menu` is now part of `Slickgrid-Universal` and is enabled by default via the grid option "enableHeaderMenu" flag.

### How to use it?
#### It's Enabled by default
Technically, it's enable by default and so you don't have anything to do to enjoy it. However if you want to customize the content of the Header Menu, then continue reading.

## Customization
### Custom Commands
The Header Menu also comes, by default, with a list of built-in custom commands (all their `positionOrder` are in the reserved range of 40 to 60)
- Sort Ascending (you can hide it with `hideSortCommands: true`)
- Sort Descending (you can hide it with `hideSortCommands: true`)
- Hide Column (you can hide it with `hideColumnHideCommand: true`)

This section is called Custom Commands because you can also customize this section with your own commands. To do that, you need to fill in 2 properties (an array of `headerMenuItems` that will go under each column definition and define `onCommand` callbacks) in your Grid Options. For example, `Slickgrid-Universal` is configured by default with these settings (you can overwrite any one of them):
```ts
gridOptions.value = {
  enableAutoResize: true,
  enableHeaderMenu: true,   // <<-- this will automatically add extra custom commands
  enableFiltering: true,
  headerMenu: {
    onCommand: (e, args) => {
      if (args.command === 'hide') {
        controlService.hideColumn(args.column);
        controlService.autoResizeColumns();
      } else if (args.command === 'sort-asc' || args.command === 'sort-desc') {
        // get previously sorted columns
        const cols: ColumnSort[] = sortService.getPreviousColumnSorts(args.column.id + '');

        // add to the column array, the column sorted by the header menu
        cols.push({ sortCol: args.column, sortAsc: (args.command === 'sort-asc') });
        sortService.onLocalSortChanged(gridObj, gridOptions, dataviewObj, cols);

        // update the gridObj sortColumns array which will at the same add the visual sort icon(s) on the UI
        const newSortColumns: ColumnSort[] = cols.map((col) => {
          return { columnId: col.sortCol.id, sortAsc: col.sortAsc };
        });
        gridObj.setSortColumns(newSortColumns); // add sort icon in UI
      } else {
        alert('Command: ' + args.command);
      }
    }
  }
};
```
#### Callback Hooks
There are 2 callback hooks which are accessible in the Grid Options
- `onBeforeMenuShow`
- `onCommand`

For more info on all the available properties of the custom commands, you can read refer to the doc written in the Grid Menu [implementation](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/extensions/slickHeaderButtons.ts) itself.

### How to change icon(s) of the default commands?
You can change any of the default command icon(s) by changing the `icon[X-command]`, for example, see below for the defaults.
```ts
gridOptions.value = {
  enableHeaderMenu: true,
  headerMenu: {
    iconColumnHideCommand: 'mdi mdi-close'
    iconSortAscCommand: 'mdi mdi-sort-ascending'
    iconSortDescCommand: 'mdi mdi-sort-descending',
  },
};
```

### How to Disable the Header Menu?
You can disable the Header Menu, by calling `enableHeaderMenu: false` from the Grid Options.
```ts
gridOptions = {
   enableHeaderMenu: false
};
```

### How to Exclude Header Menu from a Particular Column?
You can exclude a column from getting a Header Menu by calling `excludeFromHeaderMenu` in your Column Definition. For example, we don't need it on a column that has an edit icon:

```ts
columnDefinitions.value = [
  { id: 'edit', formatter: Formatters.editIcon, excludeFromHeaderMenu: true, excludeFromExport: true },
  { id: 'title', name: 'Title', field: 'title', sortable: true },
  { id: 'duration', name: 'Duration (days)', field: 'duration', sortable: true },
];
```

### Sample
You can add Header Menu to 1 column or all columns like shown below. You can also add sub-menus by nesting `commandItems`

```ts
// add custom Header Menu to all columns except "Action"
columnDefinitions.value.forEach(col => {
  col.header = {
    menu: {
      commandItems: [
        { command: 'sort-ascending', title: 'Sort Ascending' },
        { command: 'sort-descending', title: 'Sort Descending' },
        'divider',
        {
          // we can also have multiple nested sub-menus
          command: 'custom-actions', title: 'Hello', positionOrder: 99,
          commandItems: [
            { command: 'hello-world', title: 'Hello World' },
            { command: 'hello-slickgrid', title: 'Hello SlickGrid' },
            {
              command: 'sub-menu', title: `Let's play`, cssClass: 'green', subMenuTitle: 'choose your game', subMenuTitleCssClass: 'text-italic salmon',
              commandItems: [
                { command: 'sport-badminton', title: 'Badminton' },
                { command: 'sport-tennis', title: 'Tennis' },
                { command: 'sport-racquetball', title: 'Racquetball' },
                { command: 'sport-squash', title: 'Squash' },
              ]
            }
          ]
        }
      ]
    }
  };
});
```
