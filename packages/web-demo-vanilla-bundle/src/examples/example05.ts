import {
  Column,
  convertArrayFlatToHierarchical,
  convertArrayHierarchicalToFlat,
  dedupePrimitiveArray,
  FieldType,
  GridOption,
  SortDirection,
  SortDirectionString,
  sortFlatArrayByHierarchy,
} from '@slickgrid-universal/common';
import { Slicker } from '@slickgrid-universal/vanilla-bundle';
import './example05.scss';

const NB_ITEMS = 4000;


export class Example5 {
  columnDefinitions: Column[];
  gridOptions: GridOption;
  dataset: any[];
  dataViewObj: any;
  gridObj: any;
  slickgridLwc;
  slickerGridInstance;
  durationOrderByCount = false;
  searchString = '';
  sortDirection: SortDirectionString = 'ASC';

  attached() {
    this.initializeGrid();
    this.dataset = [];
    const gridContainerElm = document.querySelector('.grid5');

    gridContainerElm.addEventListener('onclick', this.handleOnClick.bind(this));
    gridContainerElm.addEventListener('onslickergridcreated', this.handleOnSlickerGridCreated.bind(this));
    this.slickgridLwc = new Slicker.GridBundle(gridContainerElm, this.columnDefinitions, this.gridOptions);
    this.dataViewObj = this.slickgridLwc.dataView;
    this.dataViewObj.setFilter(this.treeFilter.bind(this, this.dataViewObj));
    this.dataset = this.mockDataset();
    this.slickgridLwc.dataset = this.dataset;
    this.includeTreeItemsInDataset(this.dataset);
  }

  initializeGrid() {
    this.columnDefinitions = [
      { id: 'title', name: 'Title', field: 'title', width: 220, cssClass: 'cell-title', filterable: true, sortable: true, formatter: this.taskNameFormatter.bind(this) },
      { id: 'duration', name: 'Duration', field: 'duration', minWidth: 90 },
      { id: '%', name: '% Complete', field: 'percentComplete', width: 120, resizable: false, formatter: Slicker.Formatters.percentCompleteBar },
      { id: 'start', name: 'Start', field: 'start', minWidth: 60 },
      { id: 'finish', name: 'Finish', field: 'finish', minWidth: 60 },
      {
        id: 'effort-driven', name: 'Effort Driven', width: 80, minWidth: 20, maxWidth: 80, cssClass: 'cell-effort-driven', field: 'effortDriven',
        formatter: Slicker.Formatters.checkmarkMaterial, cannotTriggerInsert: true
      }
    ];

    this.gridOptions = {
      autoResize: {
        container: '.demo-container',
      },
      enableAutoSizeColumns: true,
      enableAutoResize: true,
      enableSorting: true,
      headerRowHeight: 45,
      rowHeight: 45,
      treeViewOptions: {
        associatedFieldId: 'title'
      }
    };
  }

  dispose() {
    this.slickgridLwc.dispose();
  }

  searchTask(event: KeyboardEvent) {
    this.searchString = (event.target as HTMLInputElement)?.value || '';
    this.dataViewObj.refresh();
  }

  taskNameFormatter(row, cell, value, columnDef, dataContext) {
    if (value === null || value === undefined || dataContext === undefined) { return ''; }
    value = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const spacer = `<span style="display:inline-block;height:1px;width:${15 * dataContext['__treeLevel']}px"></span>`;
    const idx = this.dataViewObj.getIdxById(dataContext.id);

    if (this.dataset[idx + 1] && this.dataset[idx + 1].__treeLevel > this.dataset[idx].__treeLevel) {
      if (dataContext.__collapsed) {
        return `${spacer}<span class="slick-group-toggle collapsed"></span>&nbsp;${value}`;
      } else {
        return `${spacer}<span class="slick-group-toggle expanded"></span>&nbsp;${value}`;
      }
    }
    return `${spacer}<span class="slick-group-toggle"></span>&nbsp;${value}`;
  }

  treeFilter(dataView: any, item: any) {
    const treeAssociatedField = this.gridOptions.treeViewOptions?.associatedFieldId;
    const parentPropName = 'parentId';
    const columnFilters = { [treeAssociatedField]: this.searchString.toLowerCase() };
    let filterCount = 0;

    if (item[parentPropName] !== null) {
      let parent = dataView.getItemById(item[parentPropName]);
      while (parent) {
        if (parent.__collapsed) {
          return false;
        }
        parent = dataView.getItemById(parent[parentPropName]);
      }
    }

    for (const columnId in columnFilters) {
      if (columnId !== undefined && columnFilters[columnId] !== '') {
        filterCount++;

        if (item.__treeItems === undefined || !item.__treeItems.find((itm: string) => itm.endsWith(columnFilters[columnId]))) {
          // if (item.__fullpath === undefined || item.__fullpath.indexOf(columnFilters[columnId]) === -1) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * A simple method to add a new item inside the first group that we find.
   * After adding the item, it will sort by parent/child recursively
   */
  addNewRow() {
    const newId = this.dataset.length;
    const parentPropName = 'parentId';
    const newTreeLevel = 1;

    // find first parent object and add the new item as a child
    const childItemFound = this.dataset.find((item) => item.__treeLevel === newTreeLevel);
    const parentItemFound = this.dataViewObj.getItemByIdx(childItemFound[parentPropName]);

    const newItem = {
      id: newId,
      __treeLevel: newTreeLevel,
      parent: parentItemFound.id,
      title: `Task ${newId}`,
      duration: '1 day',
      percentComplete: 0,
      start: '01/01/2009',
      finish: '01/01/2009',
      effortDriven: false
    };
    this.dataViewObj.addItem(newItem);
    this.gridObj.navigateBottom();
    this.dataset = this.dataViewObj.getItems();
    console.log('new item', newItem, 'parentId', parentItemFound);
    console.warn(this.dataset);
    const resultSortedFlatDataset = sortFlatArrayByHierarchy(
      this.dataset,
      {
        parentPropName: 'parentId',
        childPropName: 'children',
        direction: 'ASC',
        identifierPropName: 'id',
        sortByPropName: 'id',
        sortPropFieldType: FieldType.number,
      });

    // update dataset and re-render (invalidate) the grid
    this.slickgridLwc.dataset = resultSortedFlatDataset;
    this.dataset = resultSortedFlatDataset;
    this.gridObj.invalidate();

    // scroll to the new row
    const rowIndex = this.dataViewObj.getIdxById(newItem.id);
    this.gridObj.scrollRowIntoView(rowIndex, false);
  }

  clearSearch() {
    this.searchTask(new KeyboardEvent('keyup', { code: 'a', bubbles: true, cancelable: true }));
    document.querySelector<HTMLInputElement>('input.search').value = '';
  }

  collapseAll() {
    this.dataset.forEach((item) => item.__collapsed = true);
    this.slickgridLwc.dataset = this.dataset;
    this.gridObj.invalidate();
  }

  expandAll() {
    this.dataset.forEach((item) => item.__collapsed = false);
    this.slickgridLwc.dataset = this.dataset;
    this.gridObj.invalidate();
  }

  toggleSort() {
    this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    this.resortTreeGrid(this.dataset, this.sortDirection);
    this.gridObj.setSortColumns([
      { columnId: 'title', sortAsc: this.sortDirection === 'ASC' },
      // { columnId: 'product', sortAsc: this.sortDirection === 'ASC' },
    ]);
  }

  resortTreeGrid(updatedDataset?: any[], direction?: SortDirection | SortDirectionString) {
    // resort the array taking the tree structure in consideration
    const dataset = updatedDataset || this.dataset;
    const sortedOutputArray = sortFlatArrayByHierarchy(dataset, {
      parentPropName: 'parentId',
      childPropName: 'children',
      direction: direction || 'ASC',
      sortByPropName: 'id',
      sortPropFieldType: FieldType.number,
    });

    this.gridObj.resetActiveCell();
    this.dataset = sortedOutputArray;
    this.slickgridLwc.dataset = sortedOutputArray;
    this.gridObj.invalidate();
  }

  handleOnClick(event: any) {
    const eventDetail = event?.detail;
    const args = event?.detail?.args;

    if (eventDetail && args) {
      const targetElm = eventDetail.eventData.target || {};
      const hasToggleClass = targetElm.className.indexOf('toggle') >= 0 || false;
      if (hasToggleClass) {
        const item = this.dataViewObj.getItem(args.row);
        if (item) {
          item.__collapsed = !item.__collapsed ? true : false;
          this.dataViewObj.updateItem(item.id, item);
          this.gridObj.invalidate();
        }
        event.stopImmediatePropagation();
      }
    }
  }

  handleOnSlickerGridCreated(event) {
    this.slickerGridInstance = event && event.detail;
    this.gridObj = this.slickerGridInstance && this.slickerGridInstance.slickGrid;
    this.dataViewObj = this.slickerGridInstance && this.slickerGridInstance.dataView;
  }

  logExpandedStructure() {
    const explodedArray = convertArrayFlatToHierarchical(this.dataset, { parentPropName: 'parentId', childPropName: 'children' });
    console.log('exploded array', explodedArray);
  }

  logFlatStructure() {
    const outputHierarchicalArray = convertArrayFlatToHierarchical(this.dataset, { parentPropName: 'parentId', childPropName: 'children' });
    const outputFlatArray = convertArrayHierarchicalToFlat(outputHierarchicalArray, { childPropName: 'children' });
    // JSON.stringify(outputFlatArray, null, 2)
    console.log('flat array', outputFlatArray);
  }

  mockDataset() {
    let indent = 0;
    const parents = [];
    const data = [];

    // prepare the data
    for (let i = 0; i < NB_ITEMS; i++) {
      const d = (data[i] = {});
      let parentId;

      if (Math.random() > 0.8 && i > 0) {
        indent++;
        parents.push(i - 1);
      } else if (Math.random() < 0.3 && indent > 0) {
        indent--;
        parents.pop();
      }

      if (parents.length > 0) {
        parentId = parents[parents.length - 1];
      } else {
        parentId = null;
      }

      d['id'] = i;
      d['__treeLevel'] = indent;
      d['parentId'] = parentId;
      d['title'] = 'Task ' + i;
      d['duration'] = '5 days';
      d['percentComplete'] = Math.round(Math.random() * 100);
      d['start'] = '01/01/2009';
      d['finish'] = '01/05/2009';
      d['effortDriven'] = (i % 5 === 0);
    }
    return data;
  }

  /**
   * Loop through the dataset and add all tree items data content (all the nodes under each branch) at the parent level including itself.
   * This is to help in filtering the data afterward, we can simply filter the tree items array instead of having to through the tree on every filter.
   * Portion of the code comes from this Stack Overflow answer https://stackoverflow.com/a/28094393/1212166
   * For example if we have
   * [
   *   { id: 1, title: 'Task 1'},
   *   { id: 2, title: 'Task 2', parentId: 1 },
   *   { id: 3, title: 'Task 3', parentId: 2 },
   *   { id: 4, title: 'Task 4', parentId: 2 }
   * ]
   * The array will be modified as follow (and if we filter/search for say "4", then we know the result will be row 1, 2, 4 because each treeItems contain "4")
   * [
   *   { id: 1, title: 'Task 1', __treeItems: ['Task 1', 'Task 2', 'Task 3', 'Task 4']},
   *   { id: 2, title: 'Task 2', parentId: 1, __treeItems: ['Task 2', 'Task 3', 'Task 4'] },
   *   { id: 3, title: 'Task 3', parentId: 2, __treeItems: ['Task 3'] },
   *   { id: 4, title: 'Task 4', parentId: 2, __treeItems: ['Task 4'] }
   * ]
   *
   * @param items
   */
  includeTreeItemsInDataset(items: any[]) {
    const treeAssociatedField = this.gridOptions.treeViewOptions?.associatedFieldId;
    const parentPropName = 'parentId';
    const treeItemsPropName = '__treeItems';
    if (!treeAssociatedField) {
      throw new Error(`[Slickgrid-Universal] You must provide the Tree associated field id so the grid knows which column has the tree. For example, this.gridOptions: { treeViewOptions: { associatedFieldId: 'title' });`);
    }

    for (let i = 0; i < items.length; i++) {
      items[i][treeItemsPropName] = [items[i][treeAssociatedField]];
      let item = items[i];

      if (item[parentPropName] !== null) {
        let parent = this.dataViewObj.getItemById(item[parentPropName]);

        while (parent) {
          parent[treeItemsPropName] = dedupePrimitiveArray(parent[treeItemsPropName].concat(item[treeItemsPropName]));
          item = parent;
          parent = this.dataViewObj.getItemById(item[parentPropName]);
        }
      }
    }
  }
}
