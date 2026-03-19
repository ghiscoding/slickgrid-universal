#### index
- [Customize the Column Picker](#column-picker)
  - [Hide Column Picker](#hide-column-picker)
- [Custom Commands](#custom-commands)
- [Dynamic Command List Builder](#advanced-dynamic-command-list-builder)
  - [Custom Menu Item Rendering](#custom-menu-item-rendering)
  - [Custom Menu Slots](menu-slots.md)
  - [Customize icon for all default commands](#how-to-change-an-icon-of-all-default-commands)

## Grid Menu

The `Grid Menu` (also known as the "Hamburger Menu") is enabled by default in the project (it's possible to disable it too).

## How to use it?
#### It's Enabled by default
Technically, it's automatically enabled so just enjoy it, you could optionally disable it though. You could also customize the content of the Grid Menu, see below for more details.

### Demo
[Demo Page](https://ghiscoding.github.io/slickgrid-vue-demos/#/example09) / [Demo ViewModel](https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/vue/src/components/Example09.vue)

## Customization
### Column Picker

The Grid Menu includes, by default, the "Column Picker" list. This brings an easy way to show/hide certain column(s) from the grid. This functionality implementation comes from the [Column Picker Plugin](column-picker.md) and brought over to the Grid Menu.

#### Hide Column Picker

For very large data grid with lots of columns to scroll, you could optionally skip the creation of the Column Picker and only keep the "Commands" section.

```ts
gridOptions.value = {
  gridMenu: {
    hideColumnPickerSection: true,
  }
}
```

### Custom Commands
The Grid Menu also comes, by default, with a list of built-in custom commands (all their `positionOrder` are in the reserved range of 40 to 60)
- Clear all Filters (you can hide it with `hideClearAllFiltersCommand: true`)
- Clear all Sorting (you can hide it with `hideClearAllSortingCommand: true`)
- Toggle the Filter Row (you can hide it with `hideToggleFilterCommand: true`)
- Export to CSV (you can hide it with `hideExportCsvCommand: true`)
- Export to Text Delimited (you can hide it with `hideExportTextDelimitedCommand: true`)
- Refresh Dataset, only shown when using Backend Service API (you can hide it with `hideRefreshDatasetCommand: true`)

> **Note**: all `hide...` and `positionOrder` properties were deprecated in v10 and will be removed in v11, prefer the use of `hideCommands` or the `commandListBuilder` instead (see below).

This section is called Custom Commands because you can also customize this section with your own commands. To do that, you need to fill in 2 properties (an array of `commandItems` and define `onGridMenuCommand` callback) in your Grid Options. For example, `Slickgrid-Vue` is configured by default with these settings (you can overwrite any one of them):

#### Using Static Command Items

```ts
gridOptions.value = {
  enableAutoResize: true,
  enableGridMenu: true,
  enableFiltering: true,
  gridMenu: {
    commandTitle: 'Custom Commands',
    columnTitle: 'Columns',
    iconCssClass: 'mdi mdi-dots-vertical',
    menuWidth: 17,
    resizeOnShowHeaderRow: true,
    commandItems: [
      {
        iconCssClass: 'mdi mdi-filter-remove-outline',
        title: 'Clear All Filters',
        disabled: false,
        command: 'clear-filter'
      },
      {
        iconCssClass: 'mdi-flip-vertical',
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

#### Advanced: Dynamic Command List Builder
For more advanced use cases where you need to dynamically build the command list, use `commandListBuilder`. This callback receives the built-in commands and allows you to filter, sort, or modify the list before it's rendered in the UI, giving you full control over the final command list. This function is executed **after** `commandItems` is processed and is the **last call before rendering** the menu in the DOM.

**When to use `commandListBuilder`:**
- You want to append/prepend items to the built-in commands
- You need to filter commands based on runtime conditions
- You want to sort or reorder commands dynamically
- You need access to both built-in and custom commands to manipulate the final list

**Note:** You would typically use `commandListBuilder` **instead of** `commandItems` (not both), since the builder gives you full control over the final command list.

```ts
gridOptions: {
  gridMenu: {
    // Build the command list dynamically
    commandListBuilder: (builtInItems) => {
      // Example 1: Append custom commands to built-in ones
      return [
        ...builtInItems,
        'divider',
        {
          command: 'help',
          title: 'Help',
          iconCssClass: 'mdi mdi-help-circle',
          positionOrder: 99,
          action: () => window.open('https://example.com/help', '_blank')
        },
      ];
    },
    onCommand: (e, args) => {
      if (args.command === 'help') {
        // command handled via action callback above
      }
    }
  }
}
```

**Example: Filter commands based on user permissions**
```ts
gridOptions: {
  gridMenu: {
    commandListBuilder: (builtInItems) => {
      // Remove export commands if user doesn't have export permission
      if (!this.userHasExportPermission) {
        return builtInItems.filter(item =>
          item !== 'divider' &&
          !item.command?.includes('export')
        );
      }
      return builtInItems;
    }
  }
}
```

**Example: Reorder and customize the command list**
```ts
gridOptions: {
  gridMenu: {
    commandListBuilder: (builtInItems) => {
      // Add custom commands at the beginning
      const customCommands = [
        {
          command: 'refresh-cache',
          title: 'Refresh Cache',
          iconCssClass: 'mdi mdi-cached',
          action: () => this.refreshCache()
        },
        'divider'
      ];

      // Sort built-in items by title
      const sortedBuiltIn = builtInItems
        .filter(item => item !== 'divider')
        .sort((a, b) => (a.title || '').localeCompare(b.title || ''));

      return [...customCommands, ...sortedBuiltIn];
    }
  }
}
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

For more info on all the available properties of the custom commands, you can read refer to the doc written in the Grid Menu [implementation](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/extensions/slickGridMenu.ts) itself.

### Custom Menu Item Rendering
To customize the appearance of menu items with custom HTML, badges, icons, or interactive elements, you can use the `slotRenderer` or `defaultMenuItemRenderer` callbacks.

See [Custom Menu Slots](menu-slots.md) for detailed examples and best practices on rendering custom menu item content.

### How to change an icon of all default commands?
You can change any of the default command icon(s) by changing the `icon[X-command]`, for example, see below for the defaults.
```ts
gridOptions.value = {
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

### When using Pre-Header

By default the Grid Menu icon will be showing on the right after the column headers, if however you wish to move the button icon to show in the pre-header instead, you could simply use the `iconButtonContainer` grid option

```ts
gridOptions.value = {
  createPreHeaderPanel: true,
  showPreHeaderPanel: true,
  preHeaderPanelHeight: 26,
  gridMenu: {
    iconButtonContainer: 'preheader', // we can display the grid menu icon in either the preheader or in the column header (default)
  },
};
```

### How to Disable the Grid Menu?
You can disable the Grid Menu, by calling `enableGridMenu: false` from the Grid Options.
```ts
gridOptions.value = {
   enableGridMenu: false,
};
```

### Use the `columnSort` option to sort columns (deprecated)
##### now `@deprecated`, use `columnListBuilder` in >= 10.x

The example below demonstrates how to use the new alphabetical sorting feature:

```ts
gridOptions.value = {
  gridMenu: {
    // enable the "columnSort" option to sort columns by name
    columnSort: (item1: Column, item2: Column) => {
      const nameA = item1.name?.toString().toLowerCase() || '';
      const nameB = item2.name?.toString().toLowerCase() || '';
      return nameA.localeCompare(nameB);
    },
  }
};
```

### Use the `columnListBuilder` option to filter/sort columns

The `columnListBuilder` is a callback that is executed after reading the built-in columns but before rendering them in the DOM (this is useful to filter and/or sort columns).

For example:

```ts
gridOptions.value = {
  gridMenu: {
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
};
```