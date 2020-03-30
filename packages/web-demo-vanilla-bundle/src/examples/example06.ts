import {
  convertArrayFlatToHierarchical,
  Column,
  FieldType,
  Filters,
  findItemInHierarchicalStructure,
  GridOption,
  sortFlatArrayByHierarchy,
  convertArrayHierarchicalToFlat,
  Formatters,
  Formatter,
  sortHierarchicalArray,
} from '@slickgrid-universal/common';
import { Slicker } from '@slickgrid-universal/vanilla-bundle';
import './example06.scss';

export class Example6 {
  columnDefinitions: Column[];
  gridOptions: GridOption;
  datasetFlat: any[];
  datasetHierarchical = [];
  dataViewObj: any;
  gridObj: any;
  slickgridLwc;
  slickerGridInstance;
  durationOrderByCount = false;
  searchString = '';

  attached() {
    this.initializeGrid();
    this.datasetFlat = [];
    const gridContainerElm = document.querySelector('.grid5');

    gridContainerElm.addEventListener('onclick', this.handleOnClick.bind(this));
    gridContainerElm.addEventListener('onslickergridcreated', this.handleOnSlickerGridCreated.bind(this));
    this.slickgridLwc = new Slicker.GridBundle(gridContainerElm, this.columnDefinitions, this.gridOptions);
    this.dataViewObj = this.slickgridLwc.dataView;
    this.dataViewObj.setFilter(this.myFilter.bind(this, this.dataViewObj));
    this.datasetHierarchical = sortHierarchicalArray(this.mockDataset(), { sortByPropName: 'file' });
    this.datasetFlat = convertArrayHierarchicalToFlat(this.datasetHierarchical, { childPropName: 'files' });
    this.slickgridLwc.dataset = this.datasetFlat;
  }

  initializeGrid() {
    this.columnDefinitions = [
      { id: 'file', name: 'Files', field: 'file', filterable: true, sortable: true, type: FieldType.string, width: 150, formatter: this.treeFormatter },
      {
        id: 'dateModified', name: 'Date Modified', field: 'dateModified', formatter: Formatters.dateIso, sortable: true, type: FieldType.date, minWidth: 90,
        // exportWithFormatter: true, filterable: true, filter: { model: Filters.compoundDate }
      },
      {
        id: 'size', name: 'Size', field: 'size', sortable: true, minWidth: 90, formatter: (row, cell, value, columnDef, dataContext, grid) => isNaN(value) ? '' : `${value} MB`
        //  exportWithFormatter: true, filterable: true, filter: { model: Filters.compoundDate }
      },
    ];

    this.gridOptions = {
      autoResize: {
        container: '.demo-container',
      },
      enableAutoSizeColumns: true,
      enableAutoResize: true,
      headerRowHeight: 45,
      rowHeight: 45,
      enableTreeView: true,
      treeViewOptions: {
        fieldId: 'file',
      }
    };
  }

  dispose() {
    this.slickgridLwc.dispose();
  }

  searchFile(event: KeyboardEvent) {
    this.searchString = (event.target as HTMLInputElement).value;
    this.dataViewObj.refresh();
  }

  treeFormatter: Formatter = (row, cell, value, columnDef, dataContext, grid) => {
    if (value === null || value === undefined || dataContext === undefined) {
      return '';
    }
    const dataView = grid.getData();
    const data = dataView.getItems();
    const idx = dataView.getIdxById(dataContext.id);
    const prefix = this.getFileIcon(value);

    value = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const spacer = `<span style="display:inline-block;width:${(15 * dataContext['__treeLevel'])}px"></span>`;

    if (data[idx + 1] && data[idx + 1].__treeLevel > data[idx].__treeLevel) {
      const folderPrefix = `<i class="mdi mdi-20px mdi-folder-outline"></i>`;
      if (dataContext.__collapsed) {
        return `${spacer} <span class="slick-group-toggle collapsed" level="${dataContext['__treeLevel']}"></span>${folderPrefix} ${prefix}&nbsp;${value}`;
      } else {
        return `${spacer} <span class="slick-group-toggle expanded" level="${dataContext['__treeLevel']}"></span>${folderPrefix} ${prefix}&nbsp;${value}`;
      }
    } else {
      return `${spacer} <span class="slick-group-toggle" level="${dataContext['__treeLevel']}"></span>${prefix}&nbsp;${value}`;
    }
  }

  getFileIcon(value: string) {
    let prefix = '';
    if (value.includes('.pdf')) {
      prefix = '<i class="has-text-danger mdi mdi-20px mdi-file-pdf-outline"></i>';
    } else if (value.includes('.txt')) {
      prefix = '<i class="mdi mdi-20px mdi-file-document-outline"></i>';
    } else if (value.includes('.xls')) {
      prefix = '<i class="has-text-success mdi mdi-20px mdi-file-excel-outline"></i>';
    } else if (value.includes('.mp3')) {
      prefix = '<i class="has-text-info mdi mdi-20px mdi-file-music-outline"></i>';
    }
    return prefix;
  }

  myFilter(dataView: any, item: any) {
    const parentPropName = '__parentId';
    const treeAssociatedField = this.gridOptions.treeViewOptions?.fieldId;
    if (this.searchString !== '' && item[treeAssociatedField].indexOf(this.searchString) === -1) {
      return false;
    }

    if (item[parentPropName] !== null) {
      let parent = dataView.getItemById(item[parentPropName]);
      while (parent) {
        if (parent.__collapsed || (this.searchString !== '' && parent[treeAssociatedField].indexOf(this.searchString) === -1)) {
          return false;
        }
        const parentId = parent[parentPropName] !== null ? parent[parentPropName] : null;
        parent = dataView.getItemById(parentId);
      }
    }
    return true;
  }

  /**
   * A simple method to add a new item inside the first group that we find.
   * After adding the item, it will sort by parent/child recursively
   */
  addNewFile() {
    const newId = this.datasetFlat.length + 100;

    // find first parent object and add the new item as a child
    const popItem = findItemInHierarchicalStructure(this.datasetHierarchical, x => x.file === 'pop', 'files');

    if (popItem && Array.isArray(popItem.files)) {
      popItem.files.push({
        id: newId,
        file: `pop${Math.round(Math.random() * 100)}.mp3`,
        dateModified: new Date(),
        size: Math.round(Math.random() * 100),
      });
      const sortedArray = sortHierarchicalArray(this.datasetHierarchical, { sortByPropName: 'file' });
      this.datasetFlat = convertArrayHierarchicalToFlat(sortedArray, { childPropName: 'files' });

      // update dataset and re-render (invalidate) the grid
      this.slickgridLwc.dataset = this.datasetFlat;
      this.gridObj.invalidate();

      // scroll to bottom of the grid
      this.gridObj.navigateBottom();
    }
  }

  collapseAll() {
    this.datasetFlat.forEach((item) => item.__collapsed = true);
    this.slickgridLwc.dataset = this.datasetFlat;
    this.gridObj.invalidate();
  }

  expandAll() {
    this.datasetFlat.forEach((item) => item.__collapsed = false);
    this.slickgridLwc.dataset = this.datasetFlat;
    this.gridObj.invalidate();
  }

  resort(inputFlatArray?: any[]) {
    const datasetFlat = inputFlatArray || this.datasetFlat;

    return sortFlatArrayByHierarchy(
      datasetFlat,
      {
        parentPropName: '__parentId',
        childPropName: 'files',
        direction: 'ASC',
        identifierPropName: 'id',
        sortByPropName: 'id',
        sortPropFieldType: FieldType.number,
      });
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
    const explodedArray = convertArrayFlatToHierarchical(this.datasetFlat, { parentPropName: '__parentId', childPropName: 'files' });
    console.log('exploded array', explodedArray/* , JSON.stringify(explodedArray, null, 2) */);

  }

  logFlatStructure() {
    const outputHierarchicalArray = convertArrayFlatToHierarchical(this.datasetFlat, { parentPropName: '__parentId', childPropName: 'files' });
    const outputFlatArray = convertArrayHierarchicalToFlat(outputHierarchicalArray, { childPropName: 'files' });
    console.log('flat array', outputFlatArray/* , JSON.stringify(outputFlatArray, null, 2) */);
  }

  mockDataset() {
    return [
      {
        id: 21, file: 'Documents', files: [
          { id: 2, file: 'txt', files: [{ id: 3, file: 'todo.txt', dateModified: '2015-05-12T14:50:00', size: 0.7, }] },
          {
            id: 4, file: 'pdf', files: [
              { id: 5, file: 'map.pdf', dateModified: '2015-05-21T10:22:00', size: 3.1, },
              { id: 6, file: 'internet-bill.pdf', dateModified: '2015-05-12T14:50:00', size: 1.4, },
            ]
          },
          { id: 7, file: 'xls', files: [{ id: 8, file: 'compilation.xls', dateModified: '2014-10-02T14:50:00', size: 2.3, }] },
          { id: 9, file: 'misc', files: [{ id: 10, file: 'something.txt', dateModified: '2015-02-26T16:50:00', size: 0.4, }] },
        ]
      },
      {
        id: 11, file: 'Music', files: [{
          id: 12, file: 'mp3', files: [
            { id: 14, file: 'pop', files: [{ id: 15, file: 'theme.mp3', dateModified: '2015-03-01T17:05:00', size: 85, }] },
            { id: 16, file: 'rock', files: [{ id: 17, file: 'soft.mp3', dateModified: '2015-05-13T13:50:00', size: 98, }] },
          ]
        }]
      },
      { id: 18, file: 'else.txt', dateModified: '2015-03-03T03:50:00', size: 90 },
    ];
  }
}
