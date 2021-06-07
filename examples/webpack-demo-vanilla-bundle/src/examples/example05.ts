import {
  BindingEventService,
  Column,
  FieldType,
  Filters,
  Formatters,
  GridOption,
} from '@slickgrid-universal/common';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { Slicker, SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';

import { ExampleGridOptions } from './example-grid-options';
import './example05.scss';

const NB_ITEMS = 500;

export class Example5 {
  private _bindingEventService: BindingEventService;
  columnDefinitions: Column[];
  gridOptions: GridOption;
  dataset: any[];
  sgb: SlickVanillaGridBundle;
  loadingClass = '';
  isLargeDataset = false;
  hasNoExpandCollapseChanged = true;
  collapsedTreeItems: { parentId: number | string; isCollapsed: boolean; }[] = [];

  constructor() {
    this._bindingEventService = new BindingEventService();
  }

  attached() {
    this.initializeGrid();
    this.dataset = [];
    const gridContainerElm = document.querySelector<HTMLDivElement>('.grid5');

    this.sgb = new Slicker.GridBundle(gridContainerElm, this.columnDefinitions, { ...ExampleGridOptions, ...this.gridOptions });
    this.dataset = this.loadData(NB_ITEMS);
    // this.sgb.dataset = this.dataset;

    // with large dataset you maybe want to show spinner before/after these events: sorting/filtering/collapsing/expanding
    this._bindingEventService.bind(gridContainerElm, 'onbeforefilterchange', this.showSpinner.bind(this));
    this._bindingEventService.bind(gridContainerElm, 'onfilterchanged', this.hideSpinner.bind(this));
    this._bindingEventService.bind(gridContainerElm, 'onbeforefilterclear', this.showSpinner.bind(this));
    this._bindingEventService.bind(gridContainerElm, 'onfiltercleared', this.hideSpinner.bind(this));
    this._bindingEventService.bind(gridContainerElm, 'onbeforesortchange', this.showSpinner.bind(this));
    this._bindingEventService.bind(gridContainerElm, 'onsortchanged', this.hideSpinner.bind(this));
    this._bindingEventService.bind(gridContainerElm, 'onbeforetoggletreecollapse', this.showSpinner.bind(this));
    this._bindingEventService.bind(gridContainerElm, 'ontreetoggleallrequested', this.hideSpinner.bind(this));
    // @ts-ignore
    this._bindingEventService.bind(gridContainerElm, 'onTreeToggleStageChanged', (e: CustomEvent) => {
      this.hasNoExpandCollapseChanged = false;
      const treeToggleExecution = e.detail;
      this.collapsedTreeItems = treeToggleExecution.treeChanges;
      console.log('onTreeCollapseChanged', treeToggleExecution);
    });
  }

  dispose() {
    this.sgb?.dispose();
  }

  hideSpinner() {
    setTimeout(() => this.loadingClass = '', 200); // delay the hide spinner a bit to avoid show/hide too quickly
  }

  showSpinner() {
    if (this.isLargeDataset) {
      this.loadingClass = 'mdi mdi-load mdi-spin-1s mdi-24px color-alt-success';
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
      exportOptions: { exportWithFormatter: true },
      excelExportOptions: { exportWithFormatter: true },
      registerExternalResources: [new ExcelExportService()],
      enableFiltering: true,
      showCustomFooter: true, // display some metrics in the bottom custom footer
      customFooterOptions: {
        // optionally display some text on the left footer container
        leftFooterText: 'Grid created with <a href="https://github.com/ghiscoding/slickgrid-universal" target="_blank">Slickgrid-Universal</a>',
      },
      enableTreeData: true, // you must enable this flag for the filtering & sorting to work as expected
      treeDataOptions: {
        columnId: 'title',
        parentPropName: 'parentId',
        // this is optional, you can define the tree level property name that will be used for the sorting/indentation, internally it will use "__treeLevel"
        levelPropName: 'treeLevel',
        indentMarginLeft: 15,

        // you can optionally sort by a different column and/or sort direction
        // this is the recommend approach, unless you are 100% that your original array is already sorted (in most cases it's not)
        initialSort: {
          columnId: 'title',
          direction: 'ASC'
        },
        // we can also add a custom Formatter just for the title text portion
        titleFormatter: (_row, _cell, value, _def, dataContext) => {
          let prefix = '';
          if (dataContext.treeLevel > 0) {
            prefix = `<span class="mdi mdi-subdirectory-arrow-right mdi-v-align-sub color-se-secondary"></span>`;
          }
          return `${prefix}<span class="bold">${value}</span> <span style="font-size:11px; margin-left: 15px;">(parentId: ${dataContext.parentId})</span>`;
        },
      },
      multiColumnSort: false, // multi-column sorting is not supported with Tree Data, so you need to disable it
      presets: {
        filters: [{ columnId: 'percentComplete', searchTerms: [25], operator: '>=' }],
        // @ts-ignore
        treeCollapsedParents: [{ parentId: 12, isCollapsed: true }],
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
    const parentItemFound = this.sgb.dataView.getItemByIdx(childItemFound[parentPropName]);

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
    }
  }

  collapseAll() {
    this.sgb.treeDataService.toggleTreeDataCollapse(true);
  }

  expandAll() {
    this.sgb.treeDataService.toggleTreeDataCollapse(false);
  }

  dynamicallyChangeFilter() {
    this.sgb.filterService.updateFilters([{ columnId: 'percentComplete', operator: '<', searchTerms: [40] }]);
  }

  reapplyCollapsedItems() {
    // const collapsedItems = Object.keys(this.collapsedTreeItems);
    const collapsedItems = this.collapsedTreeItems.filter(item => item.isCollapsed);
    if (Array.isArray(collapsedItems)) {
      this.sgb.dataView.beginUpdate(true);
      for (const collapsedItem of collapsedItems) {
        if (collapsedItem) {
          this.sgb.dataView.updateItem(collapsedItem.parentId, { ...this.sgb.dataView.getItemById(collapsedItem.parentId), __collapsed: collapsedItem.isCollapsed });
        }
      }
      this.sgb.dataView.endUpdate();
      this.sgb.dataView.refresh();
    }
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
    const parents = [];
    const data = [];

    // prepare the data
    for (let i = 0; i < rowCount; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor((Math.random() * 29));
      const item = (data[i] = {});
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
}
