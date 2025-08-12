import { ExcelExportService } from '@slickgrid-universal/excel-export';
import {
  type Column,
  Filters,
  Formatters,
  type GridOption,
  type TreeToggledItem,
  type TreeToggleStateChange,
  SlickgridReact,
  type SlickgridReactInstance,
} from 'slickgrid-react';
import React, { useEffect, useRef, useState } from 'react';

import './example27.scss'; // provide custom CSS/SASS styling

const NB_ITEMS = 500;

const Example27: React.FC = () => {
  const [columnDefinitions, setColumnDefinitions] = useState<Column[]>([]);
  const [dataset, setDataset] = useState<any[]>(loadData(NB_ITEMS));
  const [gridOptions, setGridOptions] = useState<GridOption | undefined>(undefined);
  const reactGridRef = useRef<SlickgridReactInstance | null>(null);
  const [loadingClass, setLoadingClass] = useState('');
  const [hasNoExpandCollapseChanged, setHasNoExpandCollapseChanged] = useState(true);
  const [treeToggleItems, setTreeToggleItems] = useState<TreeToggledItem[]>([]);
  const [hideSubTitle, setHideSubTitle] = useState(false);

  useEffect(() => {
    defineGrid();
  }, []);

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  /* Define grid Options and Columns */
  function defineGrid() {
    const columnDefinitions: Column[] = [
      {
        id: 'title',
        name: 'Title',
        field: 'title',
        width: 220,
        cssClass: 'cell-title',
        filterable: true,
        sortable: true,
        exportWithFormatter: false,
        queryFieldSorter: 'id',
        formatter: Formatters.tree,
        exportCustomFormatter: Formatters.treeExport,
      },
      { id: 'duration', name: 'Duration', field: 'duration', minWidth: 90, filterable: true },
      {
        id: 'percentComplete',
        name: '% Complete',
        field: 'percentComplete',
        minWidth: 120,
        maxWidth: 200,
        exportWithFormatter: false,
        sortable: true,
        filterable: true,
        filter: { model: Filters.compoundSlider, operator: '>=' },
        formatter: Formatters.percentCompleteBarWithText,
        type: 'number',
      },
      {
        id: 'start',
        name: 'Start',
        field: 'start',
        minWidth: 60,
        type: 'dateIso',
        filterable: true,
        sortable: true,
        filter: { model: Filters.compoundDate },
        formatter: Formatters.dateIso,
      },
      {
        id: 'finish',
        name: 'Finish',
        field: 'finish',
        minWidth: 60,
        type: 'dateIso',
        filterable: true,
        sortable: true,
        filter: { model: Filters.compoundDate },
        formatter: Formatters.dateIso,
      },
      {
        id: 'effortDriven',
        name: 'Effort Driven',
        width: 80,
        minWidth: 20,
        maxWidth: 80,
        cssClass: 'cell-effort-driven',
        field: 'effortDriven',
        exportWithFormatter: false,
        formatter: Formatters.checkmarkMaterial,
        cannotTriggerInsert: true,
        filterable: true,
        filter: {
          collection: [
            { value: '', label: '' },
            { value: true, label: 'True' },
            { value: false, label: 'False' },
          ],
          model: Filters.singleSelect,
        },
      },
    ];

    const gridOptions: GridOption = {
      autoResize: {
        container: '#demo-container',
        rightPadding: 10,
      },
      enableAutoSizeColumns: true,
      enableAutoResize: true,
      enableFiltering: true,
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
        // initialSort: {
        //   columnId: 'title',
        //   direction: 'ASC'
        // },
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
      showCustomFooter: true,
      // change header/cell row height for material design theme
      headerRowHeight: 45,
      rowHeight: 40,
      presets: {
        filters: [{ columnId: 'percentComplete', searchTerms: [25], operator: '>=' }],
        // treeData: { toggledItems: [{ itemId: 1, isCollapsed: false }] },
      },
      enableExcelExport: true,
      excelExportOptions: { exportWithFormatter: true, sanitizeDataExport: true },
      externalResources: [new ExcelExportService()],
    };

    setColumnDefinitions(columnDefinitions);
    setGridOptions(gridOptions);
  }

  /**
   * A simple method to add a new item inside the first group that has children which is "Task 1"
   * After adding the item, it will resort by parent/child recursively but keep current sort column
   */
  function addNewRow() {
    const newId = reactGridRef.current?.dataView.getItemCount();
    // find "Task 1" which has `id = 1`
    const parentItemFound = reactGridRef.current?.dataView?.getItemById(1);

    if (parentItemFound?.__hasChildren) {
      const newItem = {
        id: newId,
        parentId: parentItemFound.id,
        title: `Task ${newId}`,
        duration: '1 day',
        percentComplete: 99,
        start: new Date(),
        finish: new Date(),
        effortDriven: false,
      };

      // use the Grid Service to insert the item,
      // it will also internally take care of updating & resorting the hierarchical dataset
      reactGridRef.current?.gridService.addItem(newItem);
    }
  }

  function updateFirstRow() {
    // to update any of the grid rows, we CANNOT simply pass a new updated object
    // we MUST read it from the DataView first (that will include all mutated Tree Data props, like `__treeLevel`, `__parentId`, ...) and then update it
    const item = reactGridRef.current?.dataView.getItemById<any>(0);

    // option 1
    /*
    // now that we have the extra Tree Data props, we can update any of the object properties (while keeping the Tree Data props)
    item.duration = `11 days`;
    item.percentComplete = 77;
    item.start = new Date();
    item.finish = new Date();
    item.effortDriven = false;
    // finally we can now update the item which includes our updated props + the Tree Data props (`__treeLevel`, ...)
    reactGridRef.current?.gridService.updateItem(item);
    */

    // optiona 2 - alternative
    // we could also simply use the spread operator directly
    reactGridRef.current?.gridService.updateItem({
      ...item,
      duration: `11 days`,
      percentComplete: 77,
      start: new Date(),
      finish: new Date(),
      effortDriven: false,
    });
  }

  function collapseAll() {
    reactGridRef.current?.treeDataService.toggleTreeDataCollapse(true);
  }

  function collapseAllWithoutEvent() {
    reactGridRef.current?.treeDataService.toggleTreeDataCollapse(true, false);
  }

  function expandAll() {
    reactGridRef.current?.treeDataService.toggleTreeDataCollapse(false);
  }

  function dynamicallyChangeFilter() {
    reactGridRef.current?.filterService.updateFilters([{ columnId: 'percentComplete', operator: '<', searchTerms: [40] }]);
  }

  function logHierarchicalStructure() {
    console.log('exploded array', reactGridRef.current?.treeDataService.datasetHierarchical /* , JSON.stringify(explodedArray, null, 2) */);
  }

  function logFlatStructure() {
    console.log('flat array', reactGridRef.current?.treeDataService.dataset /* , JSON.stringify(outputFlatArray, null, 2) */);
  }

  function hideSpinner() {
    window.setTimeout(() => {
      setLoadingClass('');
    }, 200); // delay the hide spinner a bit to avoid show/hide too quickly
  }

  function showSpinner() {
    setLoadingClass('mdi mdi-load mdi-spin-1s font-24px color-alt-success');
  }

  function loadData(rowCount: number) {
    let indent = 0;
    const parents: any[] = [];
    const data: any[] = [];

    // prepare the data
    for (let i = 0; i < rowCount; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor(Math.random() * 29);
      const item: any = (data[i] = {});
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
      }
      if (i === 3) {
        indent = 1;
      } else if (i === 2 || i === 4 || (Math.random() > 0.8 && i > 0 && indent < 3 && i - 1 !== 0 && i - 1 !== 2)) {
        // also make sure Task 0, 2 remains empty
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
      item['finish'] = new Date(randomYear, randomMonth + 1, randomDay);
      item['effortDriven'] = i % 5 === 0;
    }
    return data;
  }

  function setData(rowCount: number) {
    setDataset(loadData(rowCount));
  }

  function handleOnTreeFullToggleEnd(_treeToggleExecution: TreeToggleStateChange) {
    hideSpinner();
  }

  /** Whenever a parent is being toggled, we'll keep a reference of all of these changes so that we can reapply them whenever we want */
  function handleOnTreeItemToggled(treeToggleExecution: TreeToggleStateChange) {
    setHasNoExpandCollapseChanged(false);
    setTreeToggleItems(treeToggleExecution.toggledItems as TreeToggledItem[]);
  }

  // function handleOnGridStateChanged(gridStateChange: GridStateChange) {
  //   setHasNoExpandCollapseChanged(false);

  //   if (gridStateChange?.change?.type === 'treeData') {
  //     setTreeToggleItems(gridStateChange?.gridState?.treeData?.toggledItems as TreeToggledItem[]);
  //   }
  // }

  // function logTreeDataToggledItems() {
  //   console.log(reactGridRef.current?.treeDataService.getToggledItems());
  // }

  function dynamicallyToggledFirstParent() {
    const parentPropName = 'parentId';
    const treeLevelPropName = 'treeLevel'; // if undefined in your options, the default prop name is "__treeLevel"
    const newTreeLevel = 1;

    // find first parent object and toggle it
    const childItemFound = dataset?.find((item) => item[treeLevelPropName] === newTreeLevel);
    const parentItemFound = reactGridRef.current?.dataView.getItemByIdx(childItemFound[parentPropName]);

    if (childItemFound && parentItemFound) {
      reactGridRef.current?.treeDataService.dynamicallyToggleItemState([
        { itemId: parentItemFound.id, isCollapsed: !parentItemFound.__collapsed },
      ]);
    }
  }

  function reapplyToggledItems() {
    reactGridRef.current?.treeDataService.applyToggledItemStateChanges(treeToggleItems);
  }

  function toggleSubTitle() {
    const newHideSubTitle = !hideSubTitle;
    setHideSubTitle(newHideSubTitle);
    const action = newHideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    reactGridRef.current?.resizerService.resizeGrid(0);
  }

  return !gridOptions ? (
    ''
  ) : (
    <div id="demo-container" className="container-fluid">
      <h2>
        Example 27: Tree Data{' '}
        <small>
          (from a flat dataset with <code>parentId</code> references)
        </small>
        <span className="float-end font18">
          see&nbsp;
          <a
            target="_blank"
            href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example27.tsx"
          >
            <span className="mdi mdi-link-variant"></span> code
          </a>
        </span>
        <button
          className="ms-2 btn btn-outline-secondary btn-sm btn-icon"
          type="button"
          data-test="toggle-subtitle"
          onClick={() => toggleSubTitle()}
        >
          <span className="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
        </button>
      </h2>

      <div className="subtitle">
        <ul>
          <li>It is assumed that your dataset will have Parent/Child references AND also Tree Level (indent) property.</li>
          <ul>
            <li>
              If you do not have the Tree Level (indent), you could call "convertParentChildArrayToHierarchicalView()" then call
              "convertHierarchicalViewToParentChildArray()"
            </li>
            <li>
              You could also pass the result of "convertParentChildArrayToHierarchicalView()" to "dataset-hierarchical.bind" as defined in
              the next Hierarchical Example
            </li>
          </ul>
        </ul>
      </div>

      <div className="row" style={{ marginBottom: '4px' }}>
        <div className="col-md-12">
          <button className="btn btn-outline-secondary btn-xs btn-icon" data-test="add-500-rows-btn" onClick={() => setData(500)}>
            500 rows
          </button>
          <button className="btn btn-outline-secondary btn-xs btn-icon mx-1" data-test="add-75k-rows-btn" onClick={() => setData(75000)}>
            75k rows
          </button>
          <button
            onClick={() => dynamicallyChangeFilter()}
            className="btn btn-outline-secondary btn-xs btn-icon"
            data-test="change-filter-dynamically"
          >
            <span className="mdi mdi-filter-outline me-1"></span>
            <span>Dynamically Change Filter (% complete &lt; 40)</span>
          </button>
          <button
            onClick={() => collapseAllWithoutEvent()}
            className="btn btn-outline-secondary btn-xs btn-icon mx-1"
            data-test="collapse-all-noevent-btn"
          >
            <span className="mdi mdi-arrow-collapse me-1"></span>
            <span>Collapse All (without triggering event)</span>
          </button>
          <button
            onClick={() => dynamicallyToggledFirstParent()}
            className="btn btn-outline-secondary btn-xs btn-icon"
            data-test="dynamically-toggle-first-parent-btn"
          >
            <span>Dynamically Toggle First Parent</span>
          </button>
          <button
            onClick={() => reapplyToggledItems()}
            data-test="reapply-toggled-items-btn"
            className="btn btn-outline-secondary btn-xs btn-icon ms-1"
            disabled={hasNoExpandCollapseChanged}
          >
            <span className="mdi mdi-history me-1"></span>
            <span>Reapply Previous Toggled Items</span>
          </button>
          <div className={loadingClass}></div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-12">
          <button onClick={() => addNewRow()} data-test="add-item-btn" className="btn btn-primary btn-xs btn-icon mx-1">
            <span className="mdi mdi-plus text-white me-1"></span>
            <span className="text-white">Add New Item to "Task 1" group</span>
          </button>
          <button onClick={() => updateFirstRow()} data-test="update-item-btn" className="btn btn-outline-secondary btn-xs btn-icon mx-1">
            <span className="icon mdi mdi-pencil me-1"></span>
            <span>Update 1st Row Item</span>
          </button>
          <button onClick={() => collapseAll()} data-test="collapse-all-btn" className="btn btn-outline-secondary btn-xs btn-icon">
            <span className="mdi mdi-arrow-collapse me-1"></span>
            <span>Collapse All</span>
          </button>
          <button onClick={() => expandAll()} data-test="expand-all-btn" className="btn btn-outline-secondary btn-xs btn-icon mx-1">
            <span className="mdi mdi-arrow-expand me-1"></span>
            <span>Expand All</span>
          </button>
          <button onClick={() => logFlatStructure()} className="btn btn-outline-secondary btn-xs btn-icon">
            <span>Log Flat Structure</span>
          </button>
          <button onClick={() => logHierarchicalStructure()} className="btn btn-outline-secondary btn-xs btn-icon ms-1">
            <span>Log Hierarchical Structure</span>
          </button>
        </div>
      </div>

      <br />

      <div id="grid-container" className="col-sm-12">
        <SlickgridReact
          gridId="grid27"
          columns={columnDefinitions}
          options={gridOptions}
          dataset={dataset}
          onBeforeFilterChange={() => showSpinner()}
          onFilterChanged={() => hideSpinner()}
          onBeforeFilterClear={() => showSpinner()}
          onFilterCleared={() => hideSpinner()}
          onBeforeSortChange={() => showSpinner()}
          onSortChanged={() => hideSpinner()}
          onBeforeToggleTreeCollapse={() => showSpinner()}
          onToggleTreeCollapsed={() => hideSpinner()}
          onTreeFullToggleStart={() => showSpinner()}
          onTreeFullToggleEnd={($event) => handleOnTreeFullToggleEnd($event.detail)}
          onTreeItemToggled={($event) => handleOnTreeItemToggled($event.detail)}
          onReactGridCreated={($event) => reactGridReady($event.detail)}
        />
      </div>
    </div>
  );
};

export default Example27;
