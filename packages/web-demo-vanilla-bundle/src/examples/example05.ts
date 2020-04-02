import {
  Column,
  convertParentChildFlatArrayToHierarchicalView,
  convertHierarchicalViewToFlatArray,
  FieldType,
  Filters,
  Formatters,
  GridOption,
  SortDirection,
  SortDirectionString,
  sortFlatArrayWithParentChildRef,
  modifyDatasetToAddTreeItemsMapping,
} from '@slickgrid-universal/common';
import { Slicker } from '@slickgrid-universal/vanilla-bundle';
import './example05.scss';

const NB_ITEMS = 200;


export class Example5 {
  columnDefinitions: Column[];
  gridOptions: GridOption;
  dataset: any[];
  dataViewObj: any;
  gridObj: any;
  slickgridLwc;
  slickerGridInstance;
  durationOrderByCount = false;
  sortDirection: SortDirectionString = 'ASC';

  attached() {
    this.initializeGrid();
    this.dataset = [];
    const gridContainerElm = document.querySelector('.grid5');

    gridContainerElm.addEventListener('onclick', this.handleOnClick.bind(this));
    gridContainerElm.addEventListener('onslickergridcreated', this.handleOnSlickerGridCreated.bind(this));
    this.slickgridLwc = new Slicker.GridBundle(gridContainerElm, this.columnDefinitions, this.gridOptions);
    this.dataViewObj = this.slickgridLwc.dataView;
    this.gridObj = this.slickgridLwc.grid;
    this.dataset = this.mockDataset();
    this.slickgridLwc.dataset = this.dataset;
    modifyDatasetToAddTreeItemsMapping(this.dataset, this.columnDefinitions[0], this.dataViewObj);
    // console.log(this.dataset);
  }

  dispose() {
    this.slickgridLwc.dispose();
  }

  initializeGrid() {
    this.columnDefinitions = [
      {
        id: 'title', name: 'Title', field: 'title', width: 220, cssClass: 'cell-title',
        filterable: true, sortable: true,
        formatter: Formatters.tree,
        treeView: {
          levelPropName: 'indent',
          parentPropName: 'parentId'
        }
      },
      { id: 'duration', name: 'Duration', field: 'duration', minWidth: 90, filterable: true },
      {
        id: '%', name: '% Complete', field: 'percentComplete', minWidth: 120, maxWidth: 200,
        sortable: true, filterable: true, filter: { model: Filters.slider, operator: '>=' },
        formatter: Slicker.Formatters.percentCompleteBar, type: FieldType.number,
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
        id: 'effort-driven', name: 'Effort Driven', width: 80, minWidth: 20, maxWidth: 80, cssClass: 'cell-effort-driven', field: 'effortDriven',
        formatter: Formatters.checkmarkMaterial, cannotTriggerInsert: true,
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
      enableFiltering: true,
      enableSorting: true,
      enableTreeView: true, // you must enable this flag for the filtering & sorting to work as expected
      headerRowHeight: 45,
      rowHeight: 45,
    };
  }

  /**
   * A simple method to add a new item inside the first group that we find.
   * After adding the item, it will sort by parent/child recursively
   */
  addNewRow() {
    const newId = this.dataset.length;
    const parentPropName = 'parentId';
    const treeLevelPropName = 'indent';
    const newTreeLevel = 1;

    // find first parent object and add the new item as a child
    const childItemFound = this.dataset.find((item) => item[treeLevelPropName] === newTreeLevel);
    const parentItemFound = this.dataViewObj.getItemByIdx(childItemFound[parentPropName]);

    const newItem = {
      id: newId,
      indent: newTreeLevel,
      parentId: parentItemFound.id,
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
    const resultSortedFlatDataset = sortFlatArrayWithParentChildRef(
      this.dataset,
      {
        parentPropName: 'parentId',
        childPropName: 'children',
        direction: 'ASC',
        identifierPropName: 'id',
        sortByFieldId: 'id',
        sortPropFieldType: FieldType.number,
      });

    // update dataset and re-render (invalidate) the grid
    this.slickgridLwc.dataset = resultSortedFlatDataset;
    this.dataset = resultSortedFlatDataset;
    modifyDatasetToAddTreeItemsMapping(this.dataset, this.columnDefinitions[0], this.dataViewObj);
    this.gridObj.invalidate();

    // scroll to the new row
    const rowIndex = this.dataViewObj.getIdxById(newItem.id);
    this.gridObj.scrollRowIntoView(rowIndex, false);
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
    const sortedOutputArray = sortFlatArrayWithParentChildRef(dataset, {
      parentPropName: 'parentId',
      childPropName: 'children',
      direction: direction || 'ASC',
      sortByFieldId: 'id',
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
    const explodedArray = convertParentChildFlatArrayToHierarchicalView(this.dataset, { parentPropName: 'parentId', childPropName: 'children' });
    console.log('exploded array', explodedArray);
  }

  logFlatStructure() {
    const outputHierarchicalArray = convertParentChildFlatArrayToHierarchicalView(this.dataset, { parentPropName: 'parentId', childPropName: 'children' });
    const outputFlatArray = convertHierarchicalViewToFlatArray(outputHierarchicalArray, { childPropName: 'children' });
    // JSON.stringify(outputFlatArray, null, 2)
    console.log('flat array', outputFlatArray);
  }

  mockDataset() {
    let indent = 0;
    const parents = [];
    const data = [];

    // prepare the data
    for (let i = 0; i < NB_ITEMS; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor((Math.random() * 29));
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
      d['indent'] = indent;
      d['parentId'] = parentId;
      d['title'] = 'Task ' + i;
      d['duration'] = '5 days';
      d['percentComplete'] = Math.round(Math.random() * 100);
      d['start'] = new Date(randomYear, randomMonth, randomDay);
      d['finish'] = new Date(randomYear, (randomMonth + 1), randomDay);
      d['effortDriven'] = (i % 5 === 0);
    }
    return data;
  }
}
