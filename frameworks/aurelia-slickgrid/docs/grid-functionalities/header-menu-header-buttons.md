### Demo

#### Header Button Plugin
[Demo Page](https://ghiscoding.github.io/aurelia-slickgrid-demos/#/slickgrid/example7) / [Demo Component](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/aurelia/src/examples/slickgrid/example7.ts)

#### Header Menu Plugin
[Demo Page](https://ghiscoding.github.io/aurelia-slickgrid-demos/#/slickgrid/example8) / [Demo Component](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/aurelia/src/examples/slickgrid/example8.ts)

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

This section is called Custom Commands because you can also customize this section with your own commands. You can do this in two ways: using static command items or using a dynamic command list builder.

#### Static Command Items
To add static commands, fill in an array of items in your column definition's `header.menu.commandItems`. For example, `Slickgrid-Universal` is configured by default with these settings (you can overwrite any one of them):
```ts
this.gridOptions = {
   enableAutoResize: true,
   enableHeaderMenu: true,   // <<-- this will automatically add extra custom commands
   enableFiltering: true,
   headerMenu: {
     onCommand: (e, args) => {
       if (args.command === 'hide') {
         this.controlService.hideColumn(args.column);
         this.controlService.autoResizeColumns();
       } else if (args.command === 'sort-asc' || args.command === 'sort-desc') {
         // get previously sorted columns
         const cols: ColumnSort[] = this.sortService.getPreviousColumnSorts(args.column.id + '');

         // add to the column array, the column sorted by the header menu
         cols.push({ sortCol: args.column, sortAsc: (args.command === 'sort-asc') });
         this.sortService.onLocalSortChanged(this.gridObj, this.gridOptions, this.dataviewObj, cols);

         // update the this.gridObj sortColumns array which will at the same add the visual sort icon(s) on the UI
         const newSortColumns: ColumnSort[] = cols.map((col) => {
           return { columnId: col.sortCol.id, sortAsc: col.sortAsc };
         });
         this.gridObj.setSortColumns(newSortColumns); // add sort icon in UI
       } else {
         alert('Command: ' + args.command);
       }
     }
  }
};
```

#### Dynamic Command List Builder
For advanced use cases where you need to dynamically build the command list, use `commandListBuilder`. This callback receives the built-in commands and allows you to filter, sort, or modify the list before it's rendered in the UI, giving you full control over the final command list. This is executed **after** `commandItems` and is the **last call before rendering**.

```ts
this.columnDefinitions = [
  {
    id: 'title',
    name: 'Title',
    field: 'title',
    header: {
      menu: {
        commandListBuilder: (builtInItems) => {
          // Append custom commands to the built-in sort/hide commands
          return [
            ...builtInItems,
            'divider',
            {
              command: 'freeze-column',
              title: 'Freeze Column',
              iconCssClass: 'mdi mdi-pin',
              action: (e, args) => {
                // Implement column freezing
                console.log('Freeze column:', args.column.name);
              }
            }
          ];
        }
      }
    }
  }
];
```

**Example: Conditional commands based on column type**
```ts
header: {
  menu: {
    commandListBuilder: (builtInItems) => {
      const column = this; // column context
      
      // Add filtering option only for filterable columns
      const extraCommands = [];
      if (column.filterable !== false) {
        extraCommands.push({
          command: 'clear-filter',
          title: 'Clear Filter',
          iconCssClass: 'mdi mdi-filter-remove',
          action: (e, args) => {
            this.filterService.clearFilterByColumnId(args.column.id);
          }
        });
      }
      
      return [...builtInItems, ...extraCommands];
    }
  }
}
```

**Example: Remove sort commands, keep only custom ones**
```ts
header: {
  menu: {
    commandListBuilder: (builtInItems) => {
      // Filter out sort commands
      const filtered = builtInItems.filter(item => 
        item !== 'divider' && 
        !item.command?.includes('sort')
      );
      
      // Add custom commands
      return [
        ...filtered,
        {
          command: 'custom-action',
          title: 'Custom Action',
          iconCssClass: 'mdi mdi-star',
          action: (e, args) => alert('Custom: ' + args.column.name)
        }
      ];
    }
  }
}
```

**When to use `commandListBuilder`:**
- You want to append/prepend items to built-in commands
- You need to filter or modify commands based on column properties
- You want to customize the command list per column dynamically
- You need full control over the final command list

**Note:** Use `commandListBuilder` **instead of** `commandItems`, not both together.

#### Callback Hooks
There are 2 callback hooks which are accessible in the Grid Options
- `onBeforeMenuShow`
- `onCommand`

For more info on all the available properties of the custom commands, you can read refer to the doc written in the Grid Menu [implementation](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/extensions/slickHeaderButtons.ts) itself.

### Custom Menu Item Rendering
To customize the appearance of menu items with custom HTML, badges, icons, or interactive elements, you can use the `slotRenderer` or `defaultMenuItemRenderer` callbacks.

See [Custom Menu Slots](../menu-slots.md) for detailed examples and best practices on rendering custom menu item content.

### How to change icon(s) of the default commands?
You can change any of the default command icon(s) by changing the `icon[X-command]`, for example, see below for the defaults.
```ts
this.gridOptions = {
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
this.gridOptions = {
   enableHeaderMenu: false
};
```

### How to Exclude Header Menu from a Particular Column?
You can exclude a column from getting a Header Menu by calling `excludeFromHeaderMenu` in your Column Definition. For example, we don't need it on a column that has an edit icon:

```ts
this.columnDefinitions = [
  { id: 'edit', formatter: Formatters.editIcon, excludeFromHeaderMenu: true, excludeFromExport: true },
  { id: 'title', name: 'Title', field: 'title', sortable: true },
  { id: 'duration', name: 'Duration (days)', field: 'duration', sortable: true },
];
```

### Sample
You can add Header Menu to 1 column or all columns like shown below. You can also add sub-menus by nesting `commandItems`

```ts
// add custom Header Menu to all columns except "Action"
this.columnDefinitions.forEach(col => {
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
