import {
  type Column,
  FieldType,
  Filters,
  Formatters,
  type GridOption,
  type GridStateChange,
  GridStateType,
  type OnSelectedRowsChangedEventArgs,
  type TreeToggledItem,
  type TreeToggleStateChange,
} from '@slickgrid-universal/common';
import { BindingEventService } from '@slickgrid-universal/binding';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { Slicker, SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';

import { ExampleGridOptions } from './example-grid-options';
import './example05.scss';

const NB_ITEMS = 500;

export default class Example05 {
  private _bindingEventService: BindingEventService;
  columnDefinitions: Column[];
  gridOptions: GridOption;
  dataset: any[];
  sgb: SlickVanillaGridBundle;
  loadingClass = '';
  isLargeDataset = false;
  hasNoExpandCollapseChanged = true;
  treeToggleItems: TreeToggledItem[] = [];

  constructor() {
    this._bindingEventService = new BindingEventService();
  }

  attached() {
    this.initializeGrid();
    this.dataset = [];
    const gridContainerElm = document.querySelector('.grid5') as HTMLDivElement;

    this.sgb = new Slicker.GridBundle(gridContainerElm, this.columnDefinitions, { ...ExampleGridOptions, ...this.gridOptions });
    this.dataset = this.loadData(NB_ITEMS);

    // optionally display only the parent items count on the right footer
    // this.sgb.slickFooter.rightFooterText = `${this.sgb.treeDataService.getItemCount(0)} parent items`;

    // with large dataset you maybe want to show spinner before/after these events: sorting/filtering/collapsing/expanding
    this._bindingEventService.bind(gridContainerElm, 'onbeforefilterchange', this.showSpinner.bind(this));
    this._bindingEventService.bind(gridContainerElm, 'onfilterchanged', this.hideSpinner.bind(this));
    this._bindingEventService.bind(gridContainerElm, 'onbeforefilterclear', this.showSpinner.bind(this));
    this._bindingEventService.bind(gridContainerElm, 'onfiltercleared', this.hideSpinner.bind(this));
    this._bindingEventService.bind(gridContainerElm, 'onbeforesortchange', this.showSpinner.bind(this));
    this._bindingEventService.bind(gridContainerElm, 'onsortchanged', this.hideSpinner.bind(this));

    // keep toggled items, note that we could also get these changes via the `onGridStateChanged`
    this._bindingEventService.bind(gridContainerElm, 'ontreefulltogglestart', this.showSpinner.bind(this));
    this._bindingEventService.bind(gridContainerElm, 'ontreefulltoggleend', this.handleOnTreeFullToggleEnd.bind(this));
    this._bindingEventService.bind(gridContainerElm, 'ontreeitemtoggled', this.handleOnTreeItemToggled.bind(this));
    // or use the Grid State change event
    // this._bindingEventService.bind(gridContainerElm, 'ongridstatechanged', this.handleOnGridStateChanged.bind(this));

    // the following event is a special use case for our project and is commented out
    // so that we still have code ref if we still need to test the use case
    // this._bindingEventService.bind(gridContainerElm, 'onselectedrowschanged', this.handleOnSelectedRowsChanged.bind(this));
    document.body.classList.add('material-theme');
  }

  dispose() {
    this.sgb?.dispose();
    document.body.classList.remove('material-theme');
  }

  hideSpinner() {
    setTimeout(() => this.loadingClass = '', 200); // delay the hide spinner a bit to avoid show/hide too quickly
  }

  showSpinner() {
    if (this.isLargeDataset) {
      this.loadingClass = 'mdi mdi-load mdi-spin-1s mdi-24px color-alt-success';
    }
  }

  /**
   * From an item object, we'll first check if item is a parent at level 0 and if so we'll return an array of all of its children Ids (including parent Id itself)
   * @param {Object} itemObj - selected item object
   * @returns {Array<number>}
   */
  getTreeIds(itemObj: any) {
    let treeIds: any[] = [];
    if (itemObj.__hasChildren && itemObj.treeLevel === 0) {
      treeIds = this.sgb.dataset
        .filter(item => item.parentId === itemObj.id)
        .map(child => child.id);
      treeIds.push(itemObj.id); // also add parent Id into the list for the complete tree Ids
    }
    return treeIds;
  }

  /**
   * From an item object, find how many item(s) are selected in its tree.
   * @param {Object} itemObj - selected item object
   * @param {Array<number>} - we must provide the selected rows prior to the checkbox toggling, we can get this directly from the `onselectedrowschanged` event
   */
  getTreeSelectedCount(rootParentItemObj, previousSelectedRows: number[]) {
    let treeIds: any[] = [];
    const selectedIds = this.sgb.dataView?.mapRowsToIds(previousSelectedRows);
    if (rootParentItemObj.__hasChildren && rootParentItemObj.treeLevel === 0) {
      treeIds = this.sgb.dataset.filter(item => item.parentId === rootParentItemObj.id)
        .filter(item => selectedIds?.some(selectedId => selectedId === item.id))
        .map(child => child.id);
    }
    return treeIds.length;
  }

  /** Testing of a use case we had in our environment which is to select all child items of the tree being selected */
  handleOnSelectedRowsChanged(event) {
    const args = event.detail.args as OnSelectedRowsChangedEventArgs;

    if (args.caller === 'click.toggle') {
      let treeIds: Array<number> = [];
      const childItemsIdxAndIds: Array<{ itemId: number; rowIdx: number; }> = [];
      const allSelectionChanges = args.changedSelectedRows.concat(args.changedUnselectedRows);
      let changedRowIndex = allSelectionChanges.length > 0 ? allSelectionChanges[0] : null;

      if (changedRowIndex !== null) {
        const isRowBeingUnselected = (args.changedUnselectedRows.length && changedRowIndex === args.changedUnselectedRows[0]);
        let selectedRowItemObj = this.sgb.dataView?.getItem(changedRowIndex);

        // the steps we'll do below are the same for both the if/else
        // 1. we will find all of its children Ids
        // 2. we will toggle all of its underlying child (only on first treeLevel though)

        // step 1) if it's a parent item (or none of the tree items are selected) we'll select (or unselect) its entire tree, basically the children must follow what the parent does (selected or unselected)
        if (selectedRowItemObj.__hasChildren && selectedRowItemObj.treeLevel === 0) {
          // when it's a parent we'll make sure to expand the current tree on first level (if not yet expanded) and then return all tree Ids
          this.sgb.treeDataService.dynamicallyToggleItemState([{ itemId: selectedRowItemObj.id, isCollapsed: false }]);
          treeIds = this.getTreeIds(selectedRowItemObj);
        } else if ((selectedRowItemObj.__hasChildren && selectedRowItemObj.treeLevel === 1) || (!selectedRowItemObj.__hasChildren && selectedRowItemObj.parentId && !this.getTreeSelectedCount(this.sgb.dataView?.getItemById(selectedRowItemObj.parentId), args.previousSelectedRows))) {
          // if we're toggling a child item that is also a parent item (e.g. a switchboard inside an INEQ) then we'll do the following
          // circle back to its root parent and perform (in other word use the parent of this parent)
          // then same as previous condition, we'll return the Ids of that that tree
          const selectedItem = this.sgb.dataView?.getItem(changedRowIndex);
          selectedRowItemObj = this.sgb.dataView?.getItemById(selectedItem.parentId);
          changedRowIndex = this.sgb.dataView?.mapIdsToRows([selectedItem.parentId])?.[0] as number;
          treeIds = this.getTreeIds(selectedRowItemObj);
        }

        // step 2) do the toggle select/unselect of that tree when necessary (we only toggle on a parent item)
        if (treeIds.length > 0) {
          const currentSelectedRows = this.sgb.slickGrid?.getSelectedRows();
          for (const leafId of treeIds) {
            const childIndexes = this.sgb.dataView?.mapIdsToRows([leafId]);
            if (Array.isArray(childIndexes) && childIndexes.length > 0) {
              childItemsIdxAndIds.push({ itemId: leafId, rowIdx: childIndexes[0] });
            }
          }
          const childrenRowIndexes = childItemsIdxAndIds.map(childItem => childItem.rowIdx);
          const currentSelectionPlusChildrenIndexes: number[] = Array.from(new Set(currentSelectedRows?.concat(childrenRowIndexes))); // use Set to remove duplicates

          // if we are unselecting the row then we'll remove the children from the final list of selections else just use that entire tree Ids
          const finalSelection = isRowBeingUnselected
            ? currentSelectionPlusChildrenIndexes.filter(rowIdx => !childrenRowIndexes.includes(rowIdx))
            : currentSelectionPlusChildrenIndexes;
          this.sgb.slickGrid?.setSelectedRows(finalSelection);
        }
      }
    }
  }

  initializeGrid() {
    this.columnDefinitions = [
      {
        id: 'title', name: 'Title', field: 'title', width: 220, cssClass: 'cell-title',
        filterable: true, sortable: true, exportWithFormatter: false,
        queryFieldSorter: 'id', type: FieldType.string,
        formatter: Formatters.tree, exportCustomFormatter: Formatters.treeExport

      },
      { id: 'duration', name: 'Duration', field: 'duration', minWidth: 90, filterable: true },
      {
        id: 'percentComplete', name: '% Complete', field: 'percentComplete',
        minWidth: 120, maxWidth: 200, exportWithFormatter: false,
        sortable: true, filterable: true, filter: { model: Filters.compoundSlider, operator: '>=' },
        formatter: Formatters.percentCompleteBarWithText, type: FieldType.number,
      },
      {
        id: 'start', name: 'Start', field: 'start', minWidth: 60,
        type: FieldType.dateIso, filterable: true, sortable: true,
        filter: { model: Filters.compoundDate },
        formatter: Formatters.dateIso,
      },
      {
        id: 'finish', name: 'Finish', field: 'finish', minWidth: 60,
        type: FieldType.dateIso, filterable: true, sortable: true,
        filter: { model: Filters.compoundDate },
        formatter: Formatters.dateIso,
      },
      {
        id: 'effortDriven', name: 'Effort Driven', width: 80, minWidth: 20, maxWidth: 80, cssClass: 'cell-effort-driven', field: 'effortDriven',
        exportWithFormatter: false,
        formatter: Formatters.checkmark, cannotTriggerInsert: true,
        filterable: true,
        filter: {
          collection: [{ value: '', label: '' }, { value: true, label: 'True' }, { value: false, label: 'False' }],
          model: Filters.singleSelect
        }
      }
    ];

    this.gridOptions = {
      autoResize: {
        container: '.demo-container',
      },
      enableAutoSizeColumns: true,
      enableAutoResize: true,
      enableExcelExport: true,
      textExportOptions: { exportWithFormatter: true },
      excelExportOptions: { exportWithFormatter: true },
      externalResources: [new ExcelExportService()],
      enableFiltering: true,
      showCustomFooter: true, // display some metrics in the bottom custom footer
      customFooterOptions: {
        // optionally display some text on the left footer container
        leftFooterText: 'Grid created with <a href="https://github.com/ghiscoding/slickgrid-universal" target="_blank">Slickgrid-Universal</a> <i class="mdi mdi-github"></i>',
      },
      // enableCheckboxSelector: true,
      // enableRowSelection: true,
      // multiSelect: false,
      // checkboxSelector: {
      //   hideInFilterHeaderRow: false,
      //   hideInColumnTitleRow: true,
      //   onRowToggleStart: (e, args) => console.log('onBeforeRowToggle', args),
      //   onSelectAllToggleStart: () => this.sgb.treeDataService.toggleTreeDataCollapse(false, false),
      // },
      enableTreeData: true, // you must enable this flag for the filtering & sorting to work as expected
      treeDataOptions: {
        columnId: 'title',
        parentPropName: 'parentId',
        // this is optional, you can define the tree level property name that will be used for the sorting/indentation, internally it will use "__treeLevel"
        levelPropName: 'treeLevel',
        indentMarginLeft: 15,
        initiallyCollapsed: true,

        // you can optionally sort by a different column and/or sort direction
        // this is the recommend approach, unless you are 100% that your original array is already sorted (in most cases it's not)
        initialSort: {
          columnId: 'title',
          direction: 'ASC'
        },
        // we can also add a custom Formatter just for the title text portion
        titleFormatter: (_row, _cell, value, _def, dataContext) => {
          let titleResult = '';
          if (dataContext.treeLevel > 0) {
            titleResult = `<span class="mdi mdi-subdirectory-arrow-right mdi-v-align-sub color-se-secondary"></span>`;
          }
          titleResult += `<span class="bold">${value}</span>`;
          if (dataContext.parentId) {
            titleResult += ` <span style="font-size:11px; margin-left: 15px;">(parentId: ${dataContext.parentId})</span>`;
          }
          return titleResult;
        },
      },
      multiColumnSort: false, // multi-column sorting is not supported with Tree Data, so you need to disable it
      presets: {
        filters: [{ columnId: 'percentComplete', searchTerms: [25], operator: '>=' }],
        // treeData: { toggledItems: [{ itemId: 1, isCollapsed: false }] },
      },
      // if you're dealing with lots of data, it is recommended to use the filter debounce
      filterTypingDebounce: 250,
    };
  }

  /**
   * A simple method to add a new item inside the first group that we find (it's random and is only for demo purposes).
   * After adding the item, it will sort by parent/child recursively
   */
  addNewRow() {
    const newId = this.sgb.dataset.length;
    const parentPropName = 'parentId';
    const treeLevelPropName = 'treeLevel'; // if undefined in your options, the default prop name is "__treeLevel"
    const newTreeLevel = 1;
    // find first parent object and add the new item as a child
    const childItemFound = this.sgb.dataset.find((item) => item[treeLevelPropName] === newTreeLevel);
    const parentItemFound = this.sgb.dataView?.getItemByIdx(childItemFound[parentPropName]);

    if (childItemFound && parentItemFound) {
      const newItem = {
        id: newId,
        parentId: parentItemFound.id,
        title: `Task ${newId}`,
        duration: '1 day',
        percentComplete: 99,
        start: new Date(),
        finish: new Date(),
        effortDriven: false
      };

      // use the Grid Service to insert the item,
      // it will also internally take care of updating & resorting the hierarchical dataset
      this.sgb.gridService.addItem(newItem);

      // or insert multiple items
      // const itemCount = 15;
      // const newItems: any[] = [];
      // for (let i = 0; i < itemCount; i++) {
      //   newItems.push({
      //     id: newId + i,
      //     parentId: parentItemFound.id,
      //     title: `Task ${newId + i}`,
      //     duration: '1 day',
      //     percentComplete: 99,
      //     start: new Date(),
      //     finish: new Date(),
      //     effortDriven: false
      //   });
      // }
      // this.sgb.gridService.addItems(newItems);
    }
  }

  updateFirstRow() {
    // to update any of the grid rows, we CANNOT simply pass a new updated object
    // we MUST read it from the DataView first (that will include all mutated Tree Data props, like `__treeLevel`, `__parentId`, ...) and then update it
    const item = this.sgb.dataView?.getItemById(0);

    // option 1
    /*
    // now that we have the extra Tree Data props, we can update any of the object properties (while keeping the Tree Data props)
    item.duration = `11 days`;
    item.percentComplete = 77;
    item.start = new Date();
    item.finish = new Date();
    item.effortDriven = false;
    // finally we can now update the item which includes our updated props + the Tree Data props (`__treeLevel`, ...)
    this.sgb.gridService.updateItem(item);
    */

    // optiona 2 - alternative
    // we could also simply use the spread operator directly
    this.sgb.gridService.updateItem({ ...item, duration: `11 days`, percentComplete: 77, start: new Date(), finish: new Date(), effortDriven: false });
  }

  collapseAll() {
    this.sgb.treeDataService.toggleTreeDataCollapse(true);
  }

  collapseAllWithoutEvent() {
    this.sgb.treeDataService.toggleTreeDataCollapse(true, false);
  }

  expandAll() {
    this.sgb.treeDataService.toggleTreeDataCollapse(false);
  }

  dynamicallyChangeFilter() {
    this.sgb.filterService.updateFilters([{ columnId: 'percentComplete', operator: '<', searchTerms: [40] }]);
  }

  logHierarchicalStructure() {
    console.log('hierarchical array', this.sgb.treeDataService.datasetHierarchical);
  }

  logFlatStructure() {
    console.log('flat array', this.sgb.treeDataService.dataset);
  }

  loadData(rowCount: number) {
    this.isLargeDataset = rowCount > 5000; // we'll show a spinner when it's large, else don't show show since it should be fast enough
    let indent = 0;
    const parents: any[] = [];
    const data: any[] = [];

    // prepare the data
    for (let i = 0; i < rowCount; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor((Math.random() * 29));
      const item = (data[i] = {});
      let parentId;

      /*
        for demo & E2E testing purposes, let's make "Task 0" empty and then "Task 1" a parent that contains at least "Task 2" and "Task 3" which the latter will also contain "Task 4" (as shown below)
        also for all other rows don't go over indent tree level depth of 2
        Task 0
        Task 1
          Task 2
          Task 3
            Task 4
        ...
       */
      if (i === 1 || i === 0) {
        indent = 0;
        parents.pop();
      } if (i === 3) {
        indent = 1;
      } else if (i === 2 || i === 4 || (Math.random() > 0.8 && i > 0 && indent < 3 && i - 1 !== 0 && i - 1 !== 2)) { // also make sure Task 0, 2 remains empty
        indent++;
        parents.push(i - 1);
      } else if ((Math.random() < 0.3 && indent > 0)) {
        indent--;
        parents.pop();
      }

      if (parents.length > 0) {
        parentId = parents[parents.length - 1];
      } else {
        parentId = null;
      }

      item['id'] = i;
      item['parentId'] = parentId;
      item['title'] = `Task ${i}`;
      item['duration'] = '5 days';
      item['percentComplete'] = Math.round(Math.random() * 100);
      item['start'] = new Date(randomYear, randomMonth, randomDay);
      item['finish'] = new Date(randomYear, (randomMonth + 1), randomDay);
      item['effortDriven'] = (i % 5 === 0);
    }
    if (this.sgb) {
      this.sgb.dataset = data;
    }
    return data;
  }

  handleOnTreeFullToggleEnd(e: Event) {
    const treeToggleExecution = (e as CustomEvent<TreeToggleStateChange>).detail;
    console.log('Tree Data changes', treeToggleExecution);
    this.hideSpinner();
  }

  /** Whenever a parent is being toggled, we'll keep a reference of all of these changes so that we can reapply them whenever we want */
  handleOnTreeItemToggled(e: Event) {
    this.hasNoExpandCollapseChanged = false;
    const treeToggleExecution = (e as CustomEvent<TreeToggleStateChange>).detail;
    this.treeToggleItems = treeToggleExecution.toggledItems as TreeToggledItem[];
    console.log('Tree Data changes', treeToggleExecution);
  }

  handleOnGridStateChanged(e: CustomEvent<GridStateChange>) {
    this.hasNoExpandCollapseChanged = false;
    const gridStateChange = e.detail;

    if (gridStateChange.change?.type === GridStateType.treeData) {
      console.log('Tree Data gridStateChange', gridStateChange.gridState?.treeData);
      this.treeToggleItems = gridStateChange.gridState?.treeData?.toggledItems as TreeToggledItem[];
    }
  }

  logTreeDataToggledItems() {
    console.log(this.sgb.treeDataService.getToggledItems());
  }

  dynamicallyToggledFirstParent() {
    const parentPropName = 'parentId';
    const treeLevelPropName = 'treeLevel'; // if undefined in your options, the default prop name is "__treeLevel"
    const newTreeLevel = 1;

    // find first parent object and toggle it
    const childItemFound = this.sgb.dataset.find((item) => item[treeLevelPropName] === newTreeLevel);
    const parentItemFound = this.sgb.dataView?.getItemByIdx(childItemFound[parentPropName]);

    if (childItemFound && parentItemFound) {
      this.sgb.treeDataService.dynamicallyToggleItemState([{ itemId: parentItemFound.id, isCollapsed: !parentItemFound.__collapsed }]);
    }
  }

  reapplyToggledItems() {
    this.sgb.treeDataService.applyToggledItemStateChanges(this.treeToggleItems);
  }
}
