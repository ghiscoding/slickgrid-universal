import {
  Column,
  FieldType,
  Filters,
  Formatters,
  GridOption,
} from '@slickgrid-universal/common';
import { Slicker } from '@slickgrid-universal/vanilla-bundle';
import { ExampleGridOptions } from './example-grid-options';
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

  attached() {
    this.initializeGrid();
    this.dataset = [];
    const gridContainerElm = document.querySelector('.grid5');

    gridContainerElm.addEventListener('onclick', this.handleOnClick.bind(this));
    gridContainerElm.addEventListener('onslickergridcreated', this.handleOnSlickerGridCreated.bind(this));
    this.slickgridLwc = new Slicker.GridBundle(gridContainerElm, this.columnDefinitions, { ...ExampleGridOptions, ...this.gridOptions });
    this.dataViewObj = this.slickgridLwc.dataView;
    this.gridObj = this.slickgridLwc.grid;
    this.dataset = this.mockDataset();
    this.slickgridLwc.dataset = this.dataset;
  }

  dispose() {
    this.slickgridLwc.dispose();
  }

  initializeGrid() {
    this.columnDefinitions = [
      {
        id: 'title', name: 'Title', field: 'title', width: 220, cssClass: 'cell-title',
        filterable: true, sortable: true,
        queryFieldSorter: 'id', type: FieldType.string,
        formatter: Formatters.tree,
        treeData: {
          levelPropName: 'indent',
          parentPropName: 'parentId'
        }
      },
      { id: 'duration', name: 'Duration', field: 'duration', minWidth: 90, filterable: true },
      {
        id: 'percentComplete', name: '% Complete', field: 'percentComplete', minWidth: 120, maxWidth: 200,
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
        id: 'effortDriven', name: 'Effort Driven', width: 80, minWidth: 20, maxWidth: 80, cssClass: 'cell-effort-driven', field: 'effortDriven',
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
      enableTreeData: true, // you must enable this flag for the filtering & sorting to work as expected
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
      start: new Date(),
      finish: new Date(),
      effortDriven: false
    };
    this.dataViewObj.addItem(newItem);
    this.dataset = this.dataViewObj.getItems();
    this.slickgridLwc.dataset = this.dataset;

    // force a resort
    const titleColumn = this.columnDefinitions.find((col) => col.id === 'title');
    this.slickerGridInstance.sortService.onLocalSortChanged(this.gridObj, this.dataViewObj, [{ columnId: 'title', sortCol: titleColumn, sortAsc: true }]);

    // update dataset and re-render (invalidate) the grid
    this.gridObj.invalidate();

    // scroll to the new row
    const rowIndex = this.dataViewObj.getIdxById(newItem.id);
    this.gridObj.scrollRowIntoView(rowIndex, false);
  }

  collapseAll() {
    this.slickgridLwc.extensionUtility.toggleTreeDataCollapse(true);
  }

  expandAll() {
    this.slickgridLwc.extensionUtility.toggleTreeDataCollapse(false);
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
    console.log('exploded array', this.slickgridLwc.datasetHierarchical /* , JSON.stringify(explodedArray, null, 2) */);
  }

  logFlatStructure() {
    console.log('flat array', this.dataViewObj.getItems() /* , JSON.stringify(outputFlatArray, null, 2) */);
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

      // for implementing filtering/sorting, don't go over indent of 2
      if (Math.random() > 0.8 && i > 0 && indent < 3) {
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
