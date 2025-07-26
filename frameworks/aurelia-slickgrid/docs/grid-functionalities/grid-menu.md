The `Grid Menu` (also known as the `Hamburger Menu`) is now part of the project and is enabled by default.

## How to use it?
#### It's Enabled by default
Technically, it's enable by default and so you don't have anything to do to enjoy it. However if you want to customize the content of the Grid Menu, then continue reading.

### Demo
[Demo Page](https://ghiscoding.github.io/aurelia-slickgrid-demos/#/slickgrid/example9) / [Demo ViewModel](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/aurelia/src/examples/slickgrid/example9.ts)

## Customization
### Column Picker
The Grid Menu comes, by default, with a `Column Picker`. This brings an easy way to show/hide certain column(s) from the grid. This functionality was copied from the Column Picker Plugin and brought over to the Grid Menu.

### Custom Commands
The Grid Menu also comes, by default, with a list of built-in custom commands (all their `positionOrder` are in the reserved range of 40 to 60)
- Clear all Filters (you can hide it with `hideClearAllFiltersCommand: true`)
- Clear all Sorting (you can hide it with `hideClearAllSortingCommand: true`)
- Toggle the Filter Row (you can hide it with `hideToggleFilterCommand: true`)
- _Export to CSV_ (you can hide it with `hideExportCsvCommand: true`)
- _Export to Text Delimited (you can hide it with `hideExportTextDelimitedCommand: true`)
- _Refresh Dataset_, only shown when using Backend Service API (you can hide it with `hideRefreshDatasetCommand: true`)

This section is called Custom Commands because you can also customize this section with your own commands. To do that, you need to fill in 2 properties (an array of `commandItems` and define `onGridMenuCommand` callback) in your Grid Options. For example, `Aurelia-Slickgrid` is configured by default with these settings (you can overwrite any one of them):
```typescript
this.gridOptions = {
   enableAutoResize: true,
   enableGridMenu: true,   // <<-- this will automatically add extra custom commands
   enableFiltering: true,
   gridMenu: {
     commandTitle: 'Custom Commands',
     columnTitle: 'Columns',
     iconCssClass: 'mdi mdi-dots-vertical',
     menuWidth: 17,
     resizeOnShowHeaderRow: true,
     commandItems: [
       {
         iconCssClass: 'mdi mdi-filter text-danger',
         title: 'Clear All Filters',
         disabled: false,
         command: 'clear-filter'
       },
       {
         iconCssClass: 'mdi mdi-flip-vertical',
         title: 'Toggle Filter Row',
         disabled: false,
         command: 'toggle-filter'
       },
       // you can add sub-menus by adding nested `commandItems`
       {
         // we can also have multiple nested sub-menus
         command: 'export', title: 'Exports', positionOrder: 99,
         commandItems: [
           { command: 'exports-txt', title: 'Text (tab delimited)' },
           {
              command: 'sub-menu', title: 'Excel', cssClass: 'green', subMenuTitle: 'available formats', subMenuTitleCssClass: 'text-italic orange',
              commandItems: [
                { command: 'exports-csv', title: 'Excel (csv)' },
                { command: 'exports-xlsx', title: 'Excel (xlsx)' },
             ]
           }
         ]
       },
     ],
     onCommand: (e, args) => {
       if (args.command === 'toggle-filter') {
         this.gridObj.setHeaderRowVisibility(!this.gridObj.getOptions().showHeaderRow);
       } else if (args.command === 'clear-filter') {
         this.filterService.clearFilters();
         this.dataviewObj.refresh();
       }
     }
   }
};
```

#### Events
There are multiple events/callback hooks which are accessible from the Grid Options
- `onBeforeMenuShow`
- `onAfterMenuShow`
- `onMenuClose`
- `onColumnsChanged`
- `onCommand`

```ts
gridMenu: {
  // commandItems: [
  //   { command: 'help', title: 'Help', positionOrder: 70, action: (e, args) => console.log(args) },
  //   { command: '', divider: true, positionOrder: 72 },
  //   { command: 'hello', title: 'Hello', positionOrder: 69, action: (e, args) => alert('Hello World'), cssClass: 'red', tooltip: 'Hello World', iconCssClass: 'mdi mdi-close' },
  // ],
  // menuUsabilityOverride: () => false,
  onBeforeMenuShow: () => {
    console.log('onGridMenuBeforeMenuShow');
    // return false; // returning false would prevent the grid menu from opening
  },
  onAfterMenuShow: () => console.log('onGridMenuAfterMenuShow'),
  onColumnsChanged: (_e, args) => console.log('onGridMenuColumnsChanged', args),
  onCommand: (e, args) => {
    // e.preventDefault(); // preventing default event would keep the menu open after the execution
    console.log('onGridMenuCommand', args.command);
  },
  onMenuClose: (e, args) => console.log('onGridMenuMenuClose - visible columns count', args.visibleColumns.length),
},
```

For more info on all the available properties of the custom commands, you can read refer to the doc written in the Grid Menu [implementation](https://github.com/6pac/SlickGrid/blob/master/controls/slick.gridmenu.js) itself.

### How to change an icon of all default commands?
You can change any of the default command icon(s) by changing the `icon[X-command]`, for example, see below for the defaults.
```ts
this.gridOptions = {
   enableGridMenu: true,
   gridMenu: {
     iconClearAllFiltersCommand: 'mdi mdi-filter-remove-outline'
     iconClearAllSortingCommand: 'mdi mdi-sort-variant-off',
     iconExportCsvCommand: 'mdi mdi-download',
     iconExportTextDelimitedCommand: 'mdi mdi-download',
     iconRefreshDatasetCommand: 'mdi mdi-sync',
     iconToggleFilterCommand: 'mdi-flip-vertical',
   },
};
```

### How to Disable the Grid Menu?
You can disable the Grid Menu, by calling `enableGridMenu: false` from the Grid Options.
```typescript
this.gridOptions = {
   enableGridMenu: false,
};
```

### How to change the "columnSort" option to sort columns
The example demonstrates how to use the new alphabetical sorting feature:

```typescript
gridMenu: {
  // enable the "columnSort" option to sort columns by name
  columnSort: (item1: Column, item2: Column) => {
    const nameA = item1.name?.toString().toLowerCase() || '';
    const nameB = item2.name?.toString().toLowerCase() || '';
    return nameA.localeCompare(nameB);
  },
  // ... other grid menu options
}
```