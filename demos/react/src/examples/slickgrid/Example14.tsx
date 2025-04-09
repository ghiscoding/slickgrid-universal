import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { type Column, FieldType, type GridOption, type ItemMetadata, SlickgridReact, type SlickgridReactInstance } from 'slickgrid-react';
import React, { useEffect, useRef, useState } from 'react';

import './example14.scss'; // provide custom CSS/SASS styling

const Example14: React.FC = () => {
  const [gridOptions1, setGridOptions1] = useState<GridOption | undefined>(undefined);
  const [gridOptions2, setGridOptions2] = useState<GridOption | undefined>(undefined);
  const [columnDefinitions1, setColumnDefinitions1] = useState<Column[]>([]);
  const [columnDefinitions2, setColumnDefinitions2] = useState<Column[]>([]);
  const [dataset1, setDataset1] = useState<any[]>([]);
  const [dataset2, setDataset2] = useState<any[]>([]);
  // const reactGridRef1 = useRef<SlickgridReactInstance | null>(null);
  const reactGridRef2 = useRef<SlickgridReactInstance | null>(null);
  const [hideSubTitle, setHideSubTitle] = useState(false);

  useEffect(() => {
    defineGrid1();
    defineGrid2();
    setDataset1(getData(500));
    setDataset2(getData(500));
  }, []);

  // function reactGrid1Ready(reactGrid: SlickgridReactInstance) {
  //   reactGridRef1.current = reactGrid;
  // }

  function reactGrid2Ready(reactGrid: SlickgridReactInstance) {
    reactGridRef2.current = reactGrid;
  }

  function defineGrid1() {
    const columnDefinitions1 = [
      { id: 'title', name: 'Title', field: 'title', sortable: true, columnGroup: 'Common Factor' },
      { id: 'duration', name: 'Duration', field: 'duration', columnGroup: 'Common Factor' },
      { id: 'start', name: 'Start', field: 'start', columnGroup: 'Period' },
      { id: 'finish', name: 'Finish', field: 'finish', columnGroup: 'Period' },
      { id: '%', name: '% Complete', field: 'percentComplete', selectable: false, columnGroup: 'Analysis' },
      { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', type: FieldType.boolean, columnGroup: 'Analysis' },
    ];

    const gridOptions1: GridOption = {
      enableAutoResize: false,
      enableCellNavigation: true,
      enableColumnReorder: false,
      enableSorting: true,
      createPreHeaderPanel: true,
      showPreHeaderPanel: true,
      preHeaderPanelHeight: 28,
      gridHeight: 275,
      gridWidth: 800,
      enableExcelExport: true,
      excelExportOptions: {
        exportWithFormatter: false,
      },
      externalResources: [new ExcelExportService()],
      explicitInitialization: true,
      dataView: {
        globalItemMetadataProvider: {
          getRowMetadata: (item: any, row: number) => renderDifferentColspan(item, row),
        },
      },
      gridMenu: {
        iconButtonContainer: 'preheader', // we can display the grid menu icon in either the preheader or in the column header (default)
      },
    };

    setColumnDefinitions1(columnDefinitions1);
    setGridOptions1(gridOptions1);
  }

  function defineGrid2() {
    const columnDefinitions2 = [
      {
        id: 'sel',
        name: '#',
        field: 'num',
        behavior: 'select',
        cssClass: 'cell-selection',
        width: 40,
        resizable: false,
        selectable: false,
      },
      { id: 'title', name: 'Title', field: 'title', sortable: true, columnGroup: 'Common Factor' },
      { id: 'duration', name: 'Duration', field: 'duration', columnGroup: 'Common Factor' },
      { id: 'start', name: 'Start', field: 'start', columnGroup: 'Period' },
      { id: 'finish', name: 'Finish', field: 'finish', columnGroup: 'Period' },
      { id: '%', name: '% Complete', field: 'percentComplete', selectable: false, columnGroup: 'Analysis' },
      { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', type: FieldType.boolean, columnGroup: 'Analysis' },
    ];

    const gridOptions2 = {
      enableCellNavigation: true,
      enableColumnReorder: false,
      createPreHeaderPanel: true,
      showPreHeaderPanel: true,
      preHeaderPanelHeight: 25,
      explicitInitialization: true,
      gridHeight: 275,
      gridWidth: 800,
      frozenColumn: 2,
      enableExcelExport: true,
      excelExportOptions: {
        exportWithFormatter: false,
      },
      externalResources: [new ExcelExportService()],
      gridMenu: { hideClearFrozenColumnsCommand: false },
      headerMenu: { hideFreezeColumnsCommand: false },
    };

    setColumnDefinitions2(columnDefinitions2);
    setGridOptions2(gridOptions2);
  }

  function getData(count: number) {
    // Set up some test columns.
    const mockDataset: any[] = [];
    for (let i = 0; i < count; i++) {
      mockDataset[i] = {
        id: i,
        num: i,
        title: 'Task ' + i,
        duration: '5 days',
        percentComplete: Math.round(Math.random() * 100),
        start: '01/01/2009',
        finish: '01/05/2009',
        effortDriven: i % 5 === 0,
      };
    }
    return mockDataset;
  }

  function setFrozenColumns2(frozenCols: number) {
    reactGridRef2.current?.slickGrid.setOptions({ frozenColumn: frozenCols });
    const updatedGridOptions = reactGridRef2.current?.slickGrid.getOptions();
    setGridOptions2(updatedGridOptions);
  }

  /**
   * A callback to render different row column span
   * Your callback will always have the "item" argument which you can use to decide on the colspan
   * Your return must always be in the form of:: return { columns: {}}
   */
  function renderDifferentColspan(item: any, row: number): ItemMetadata {
    if (item.id % 2 === 1 || row % 2 === 1) {
      return {
        columns: {
          duration: {
            colspan: 3, // "duration" will span over 3 columns
          },
        },
      };
    }
    return {
      columns: {
        0: {
          colspan: '*', // starting at column index 0, we will span accross all column (*)
        },
      },
    };
  }

  return !gridOptions1 ? (
    ''
  ) : (
    <div id="demo-container" className="container-fluid">
      <h2>
        Example 14: Column Span & Header Grouping
        <span className="float-end font18">
          see&nbsp;
          <a
            target="_blank"
            href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example14.tsx"
          >
            <span className="mdi mdi-link-variant"></span> code
          </a>
        </span>
        <button
          className="ms-2 btn btn-outline-secondary btn-sm btn-icon"
          type="button"
          data-test="toggle-subtitle"
          onClick={() => setHideSubTitle(!hideSubTitle)}
        >
          <span className="mdi mdi-information-outline" title="Toggle example sub-title details"></span>
        </button>
      </h2>
      {hideSubTitle ? null : (
        <div className="subtitle">
          This example demonstrates how to easily span a row over multiple columns & how to group header titles.
          <ul>
            <li>
              Note that you can add Sort but remember that it will sort by the data which the row contains, even if the data is visually
              hidden by colspan it will still sort it
            </li>
          </ul>
        </div>
      )}

      <h3>
        Grid 1 <small>(with Header Grouping &amp; Colspan)</small>
      </h3>
      <SlickgridReact gridId="grid1" columns={columnDefinitions1} options={gridOptions1} dataset={dataset1} />

      <hr />

      <h3>
        Grid 2 <small>(with Header Grouping &amp; Frozen/Pinned Columns)</small>
      </h3>

      <div className="col-sm 12">
        <button
          className="btn btn-outline-secondary btn-sm btn-icon"
          onClick={() => setFrozenColumns2(-1)}
          data-test="remove-frozen-column-button"
        >
          <i className="mdi mdi-close"></i> Remove Frozen Columns
        </button>
        <button
          className="btn btn-outline-secondary btn-sm btn-icon mx-1"
          onClick={() => setFrozenColumns2(2)}
          data-test="set-3frozen-columns"
        >
          <i className="mdi mdi-pin-outline"></i> Set 3 Frozen Columns
        </button>
      </div>

      <SlickgridReact
        gridId="grid2"
        columns={columnDefinitions2}
        options={gridOptions2}
        dataset={dataset2}
        onReactGridCreated={($event) => reactGrid2Ready($event.detail)}
      />
    </div>
  );
};

export default Example14;
