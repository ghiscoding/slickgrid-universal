import {
  convertArrayFlatToHierarchical,
  convertArrayHierarchicalToFlat,
  Column,
  FieldType,
  GridOption,
  sortFlatArrayByHierarchy,
  uniqueArray,
} from '@slickgrid-universal/common';
import { Slicker } from '@slickgrid-universal/vanilla-bundle';
import './example05.scss';

const NB_ITEMS = 10000;


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

  attached() {
    this.initializeGrid();
    this.dataset = [];
    const gridContainerElm = document.querySelector('.grid5');

    gridContainerElm.addEventListener('onclick', this.handleOnClick.bind(this));
    gridContainerElm.addEventListener('onslickergridcreated', this.handleOnSlickerGridCreated.bind(this));
    this.slickgridLwc = new Slicker.GridBundle(gridContainerElm, this.columnDefinitions, this.gridOptions);
    this.dataViewObj = this.slickgridLwc.dataView;
    // this.dataViewObj.setFilter(this.myFilter.bind(this));
    this.dataViewObj.setFilter(this.treeFilter.bind(this, this.dataViewObj));
    this.dataset = this.mockDataset();
    this.modifyTreeDataset(this.dataset);
    // console.log(this.dataset)
    this.slickgridLwc.dataset = this.dataset;
  }

  initializeGrid() {
    this.columnDefinitions = [
      { id: 'title', name: 'Title', field: 'title', width: 220, cssClass: 'cell-title', filterable: true, formatter: this.taskNameFormatter.bind(this) },
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
      headerRowHeight: 45,
      rowHeight: 45,
    };
  }

  dispose() {
    this.slickgridLwc.dispose();
  }

  searchTask(event: KeyboardEvent) {
    this.searchString = (event.target as HTMLInputElement).value;
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

  myFilter(item) {
    // if (item["percentComplete"] < percentCompleteThreshold) {
    //   return false;
    // }

    if (this.searchString !== '' && item['title'].indexOf(this.searchString) === -1) {
      return false;
    }

    if (item.parent !== null) {
      let parent = this.dataset.find(itm => itm.id === item.parent);
      while (parent) {
        if (parent.__collapsed || /* (parent["percentComplete"] < percentCompleteThreshold) || */ (this.searchString !== '' && parent['title'].indexOf(this.searchString) === -1)) {
          return false;
        }
        const parentId = parent.parent !== null ? parent.parent : null;
        parent = this.dataset.find(function (itm2) {
          return itm2.id === parentId;
        });
      }
    }
    return true;
  }

  treeFilter(dataView: any, item: any) {
    const columnFilters = { 'title': this.searchString.toLowerCase() };
    let propCount = 0;

    for (const columnId in columnFilters) {
      if (columnId !== undefined && columnFilters[columnId] !== '') {
        propCount++;

        // if (item.__fullpath === undefined || !item.__fullpath.split(':|:').find((itm: string) => itm.startsWith(columnFilters[columnId]))) {
        if (item.__treeItems === undefined || !item.__treeItems.find((itm: string) => itm.endsWith(columnFilters[columnId]))) {
          // if (item.__fullpath === undefined || item.__fullpath.indexOf(columnFilters[columnId]) === -1) {
          return false;
        } else {
          item.__collapsed = false;
        }
      }
    }

    if (propCount === 0) {
      if (item.parent !== null) {
        let parent = dataView.getItemById(item.parent);
        while (parent) {
          if (parent.__collapsed) {
            return false;
          }

          parent = dataView.getItemById(parent.parent);
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
    const newTreeLevel = 1;

    // find first parent object and add the new item as a child
    const childItemFound = this.dataset.find((item) => item.__treeLevel === newTreeLevel);
    const parentItemFound = this.dataViewObj.getItemByIdx(childItemFound.parent);

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
    console.log('new item', newItem, 'parent', parentItemFound);
    console.warn(this.dataset);
    const resultSortedFlatDataset = sortFlatArrayByHierarchy(
      this.dataset,
      {
        parentPropName: 'parent',
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

  recreateDataset() {
    const newDataset = this.mockDataset();
    this.slickgridLwc.dataset = newDataset;
    this.dataset = newDataset;
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
    const explodedArray = convertArrayFlatToHierarchical(this.dataset, { parentPropName: 'parent', childPropName: 'children' });
    console.log('exploded array', explodedArray);
  }

  logFlatStructure() {
    const outputHierarchicalArray = convertArrayFlatToHierarchical(this.dataset, { parentPropName: 'parent', childPropName: 'children' });
    const outputFlatArray = convertArrayHierarchicalToFlat(outputHierarchicalArray, { childPropName: 'children' });
    console.log('flat array', outputFlatArray, JSON.stringify(outputFlatArray, null, 2));
  }

  mockDataset() {
    let indent = 0;
    const parents = [];
    const data = [];

    // prepare the data
    for (let i = 0; i < NB_ITEMS; i++) {
      const d = (data[i] = {});
      let parent;

      if (Math.random() > 0.8 && i > 0) {
        indent++;
        parents.push(i - 1);
      } else if (Math.random() < 0.3 && indent > 0) {
        indent--;
        parents.pop();
      }

      if (parents.length > 0) {
        parent = parents[parents.length - 1];
      } else {
        parent = null;
      }

      d['id'] = i;
      d['__treeLevel'] = indent;
      d['parent'] = parent;
      d['title'] = 'Task ' + i;
      d['duration'] = '5 days';
      d['percentComplete'] = Math.round(Math.random() * 100);
      d['start'] = '01/01/2009';
      d['finish'] = '01/05/2009';
      d['effortDriven'] = (i % 5 === 0);
    }
    return data;
  }

  createParentIndex(items) {
    for (let i = 0; i < items.length; i++) {
      if (items[i].parent !== null) {
        for (let j = 0; j < items.length; j++) {
          if (items[i].parent === items[j].id) {
            items[i].__parentIdx = j; // parents index
            break;
          }
        }
      }
    }
  }

  uniq_fast(a) {
    const seen = {};
    const out = [];
    const len = a.length;
    let j = 0;
    for (let i = 0; i < len; i++) {
      const item = a[i];
      if (seen[item] !== 1) {
        seen[item] = 1;
        out[j++] = item;
      }
    }
    return out;
  }

  modifyTreeDataset(items: any[]) {
    const searchProperty = 'title';

    // createing index prop for faster get
    this.createParentIndex(items);

    for (let i = 0; i < items.length; i++) {
      items[i].__treeItems = [items[i][searchProperty]];
      let item = items[i];

      if (item.parent !== null) {
        let parent = items[item.__parentIdx];

        while (parent) {
          // parent.__treeItems.push(...item.__treeItems);
          // parent.__treeItems = uniqueArray(parent.__treeItems);
          // parent.__treeItems.push.apply(
          //   parent.__treeItems, this.uniq_fast(item.__treeItems)
          // );
          // parent.__treeItems = this.uniq_fast(parent.__treeItems.concat(item.__treeItems));
          parent.__treeItems.concat(item.__treeItems);

          item = parent;
          parent = items[item.__parentIdx];
        }
      }
    }

    // constructing strings to search
    // for case insensitive (.toLowerCase()) this loop is twice as slow (1152ms instead of 560ms for 5100rows) .toLowerCase();
    // for (let i = 0; i < items.length; i++) {
    //   items[i].__fullpath = items[i].__treeItems.join(':|:').toLowerCase();
    //   // delete items[i].__treeItems;
    // }
  }
}
