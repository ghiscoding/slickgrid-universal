## Full list of Events by Categories

All the events are published with a data payload in a `CustomEvent`, so you will typically find the payload under the `detail` property of the `CustomEvent`. However please note that the events from `SlickGrid` and `SlickDataView`, shown at the bottom of the list, are published with a different structure which is also including the JS event that it was triggered with under the property `eventData` and the payload itself is under the `args` property (which follows original SlickGrid structure). To subscribe to all events, you can use your PubSub instance (if available) or add listeners on your grid container DOM element.

#### `SlickGrid` and `SlickDataView`
```ts
// 1. with PubSub instance
this.sgb.instances?.eventPubSubService?.subscribe('onCellChange', (payload) => console.log('PubSub, cell changed data:', payload));

// 2. with event listener on grid container. Notice the lowercase on the event name, this can be configured with `eventNamingStyle` grid option
this.gridContainerElm.addEventListener('oncellchange', (e) => this.handleOnCellChange(e));

handleOnCellChange(e) {
  // `eventData` is the event it was triggered from and `args` is the data payload
  const { eventData, args } = e.detail;
  const dataContext = args?.item;
  console.log('cell changed data:', args);
}
```

#### all other events
```ts
// 1. with PubSub instance
this.sgb.instances?.eventPubSubService?.subscribe('onHeaderMenuCommand', (payload) => console.log('PubSub, header menu command', payload));

// 2. with event listener on grid container. Notice the lowercase on the event name, this can be configured with `eventNamingStyle` grid option
this.gridContainerElm.addEventListener('onheadermenucommand', (e) => this.handleOnHeaderMenuCommand(e));

handleOnHeaderMenuCommand(e) {
  // detail is the args data payload
  const args = e.detail;
  console.log('header menu command', args);
}
```
---

#### CellExternalCopyManager (extension)
  - `onCopyCells`
  - `onCopyCancelled`
  - `onPasteCells`
  - `onBeforePasteCell`

#### Context Menu / Cell Menu (extension)
  - `onContextMenuClearGrouping`
  - `onContextMenuCollapseAllGroups`
  - `onContextMenuExpandAllGroups`
  - **Slick Events**
    - `onAfterMenuShow`
    - `onBeforeMenuShow`
    - `onBeforeMenuClose`
    - `onCommand`
    - `onOptionSelected`

#### Column Picker (extension)
  - `onColumnPickerColumnsChanged`
  - **Slick Events**
    - `onColumnsChanged`

#### Grid Menu (extension)
  - `onGridMenuMenuClose`
  - `onGridMenuBeforeMenuShow`
  - `onGridMenuAfterMenuShow`
  - `onGridMenuClearAllPinning`
  - `onGridMenuClearAllFilters`
  - `onGridMenuClearAllSorting`
  - `onGridMenuColumnsChanged`
  - `onGridMenuCommand`
  - **Slick Events**
    - `onAfterMenuShow`
    - `onBeforeMenuShow`
    - `onBeforeMenuClose`
    - `onColumnsChanged`
    - `onMenuClose`
    - `onCommand`

#### Header Buttons (extension)
  - `onHeaderButtonCommand`

#### Header Menu (extension)
  - `onHeaderMenuCommand`
  - `onHeaderMenuColumnResizeByContent`
  - `onHeaderMenuBeforeMenuShow`
  - `onHeaderMenuAfterMenuShow`

#### Filter Service
   - `onBeforeFilterClear`
   - `onBeforeSearchChange`
   - `onFilterCleared`

#### Grid Service
  - `onHideColumns`
  - `onItemsAdded`
  - `onItemsDeleted`
  - `onItemsUpdated`
  - `onItemsUpserted`

#### GridState Service
  - `onFullResizeByContentRequested`
  - `onGridStateChanged`

#### Pagination Service
  - `onBeforePaginationChange`
  - `onPaginationChanged`
  - `onPaginationRefreshed`
  - `onPaginationPresetsInitialized`
  - `onPaginationVisibilityChanged`
  - `onPaginationSetCursorBased` (for GraphQL only)

#### Resizer Service
  - `onGridBeforeResize`
  - `onGridAfterResize`
  - `onBeforeResizeByContent`
  - `onAfterResizeByContent`

#### Sort Service
  - `onSortCleared`
  - `onSortChanged`
  - `onBeforeSortChange`

#### TreeData Service
  - `onTreeFullToggleStart`
  - `onTreeFullToggleEnd`
  - `onTreeItemToggled`

#### SlickVanillaGridBundle
  - `onBeforeGridDestroy`
  - `onAfterGridDestroyed`
  - `onBeforeGridCreate`
  - `onDataviewCreated`
  - `onGridCreated`
  - `onSlickerGridCreated`
  - `onGridStateChanged`

#### SlickGrid
  - `onActiveCellChanged`
  - `onActiveCellPositionChanged`
  - `onAddNewRow`
  - `onAfterSetColumns`
  - `onAutosizeColumns`
  - `onBeforeAppendCell`
  - `onBeforeCellEditorDestroy`
  - `onBeforeColumnsResize`
  - `onBeforeDestroy`
  - `onBeforeEditCell`
  - `onBeforeFooterRowCellDestroy`
  - `onBeforeHeaderCellDestroy`
  - `onBeforeHeaderRowCellDestroy`
  - `onBeforeRemoveCachedRow`
  - `onBeforeSetColumns`
  - `onBeforeSort`
  - `onBeforeUpdateColumns`
  - `onCellChange`
  - `onCellCssStylesChanged`
  - `onClick`
  - `onColumnsReordered`
  - `onColumnsDrag`
  - `onColumnsResized`
  - `onColumnsResizeDblClick`
  - `onCompositeEditorChange`
  - `onContextMenu`
  - `onDblClick`
  - `onDrag`
  - `onDragInit`
  - `onDragStart`
  - `onDragEnd`
  - `onFooterClick`
  - `onFooterContextMenu`
  - `onFooterRowCellRendered`
  - `onHeaderCellRendered`
  - `onHeaderClick`
  - `onHeaderContextMenu`
  - `onHeaderMouseEnter`
  - `onHeaderMouseLeave`
  - `onHeaderMouseOver`
  - `onHeaderMouseOut`
  - `onHeaderRowCellRendered`
  - `onHeaderRowMouseEnter`
  - `onHeaderRowMouseLeave`
  - `onHeaderRowMouseOver`
  - `onHeaderRowMouseOut`
  - `onKeyDown`
  - `onMouseEnter`
  - `onMouseLeave`
  - `onPreHeaderClick`
  - `onPreHeaderContextMenu`
  - `onRendered`
  - `onScroll`
  - `onSelectedRowsChanged`
  - `onSetOptions`
  - `onActivateChangedOptions`
  - `onSort`
  - `onValidationError`
  - `onViewportChanged`

#### SlickDataView
  - `onBeforePagingInfoChanged`
  - `onGroupExpanded`
  - `onGroupCollapsed`
  - `onPagingInfoChanged`
  - `onRowCountChanged`
  - `onRowsChanged`
  - `onRowsOrCountChanged`
  - `onSelectedRowIdsChanged`
  - `onSetItemsCalled`
