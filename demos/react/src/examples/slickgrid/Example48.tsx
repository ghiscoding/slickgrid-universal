import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { useEffect, useState } from 'react';
import {
  Formatters,
  SlickEventHandler,
  SlickgridReact,
  type Column,
  type GridOption,
  type SlickgridReactInstance,
  type SlickHybridSelectionModel,
} from 'slickgrid-react';

const NB_ITEMS = 995;

const Example48: React.FC = () => {
  const _eventHandler = new SlickEventHandler();
  const [columnDefinitions1, setColumnDefinitions1] = useState<Column[]>([]);
  const [columnDefinitions2, setColumnDefinitions2] = useState<Column[]>([]);

  const [gridOptions1, setGridOptions1] = useState<GridOption | undefined>();
  const [gridOptions2, setGridOptions2] = useState<GridOption | undefined>();
  const [_reactGrid1, setReactGrid1] = useState<SlickgridReactInstance>();
  const [_reactGrid2, setReactGrid2] = useState<SlickgridReactInstance>();
  const [hideSubTitle, setHideSubTitle] = useState(false);

  // mock some data (different in each dataset)
  const [dataset1] = useState<any[]>(mockData(NB_ITEMS));
  const [dataset2] = useState<any[]>(mockData(NB_ITEMS));

  useEffect(() => {
    defineGrid();
  }, []);

  function defineGrid() {
    /* Define grid Options and Columns */
    const columnDefinitions1: Column[] = [
      { id: 'id', name: '#', field: 'id', width: 32, maxWidth: 40, excludeFromHeaderMenu: true },
      { id: 'title', name: 'Title', field: 'title', width: 90, cssClass: 'cell-title' },
      { id: 'complete', name: '% Complete', field: 'percentComplete', sortable: true, width: 90 },
      { id: 'start', name: 'Start', field: 'start', type: 'date', sortable: true, formatter: Formatters.dateUs },
      { id: 'finish', name: 'Finish', field: 'finish', type: 'date', sortable: true, formatter: Formatters.dateUs },
      {
        id: 'priority',
        name: 'Priority',
        field: 'priority',
        width: 80,
        resizable: false,
        sortable: true,
        type: 'number',
        sortComparer: (x, y, direction) => {
          return (direction ?? 0) * (x === y ? 0 : x > y ? 1 : -1);
        },
        formatter: (_row, _cell, value) => {
          if (!value) {
            return '';
          }
          const count = +(value >= 3 ? 3 : value);
          return count === 3 ? 'High' : count === 2 ? 'Medium' : 'Low';
        },
      },
      {
        id: 'effortDriven',
        name: 'Effort Driven',
        field: 'effortDriven',
        cssClass: 'text-center',
        width: 95,
        maxWidth: 120,
        type: 'boolean',
        sortable: true,
        exportCustomFormatter: (_row, _cell, value) => (value ? 'Yes' : 'No'),
        formatter: Formatters.checkmarkMaterial,
      },
    ];
    const columnDefinitions2: Column[] = [...columnDefinitions1];

    const gridOptions1: GridOption = {
      autoResize: {
        container: '.demo-container',
      },
      gridHeight: 250,
      gridWidth: 800,
      enableCellNavigation: true,
      autoEdit: true,
      editable: true,
      headerRowHeight: 35,
      rowHeight: 35,
      enableExcelExport: true,
      excelExportOptions: {
        exportWithFormatter: true,
      },
      externalResources: [new ExcelExportService()],

      // enable new hybrid selection model (rows & cells)
      enableSelection: true,
      selectionOptions: {
        rowSelectColumnIds: ['id'],
        selectionType: 'mixed',
      },

      // when using the ExcelCopyBuffer, you can see what the selection range is
      enableExcelCopyBuffer: true,
      excelCopyBufferOptions: {
        copyActiveEditorCell: true,
        removeDoubleQuotesOnPaste: true,
        replaceNewlinesWith: ' ',
      },
    };

    // copy the same Grid Options and Column Definitions to 2nd grid
    // but also add Pagination in this grid
    const gridOptions2: GridOption = {
      ...gridOptions1,
      // you can also enable checkbox selection & row selection, make sure to use `rowSelectColumnIds: ['id', '_checkbox_selector']`
      enableCheckboxSelector: true,
      enableSelection: true,
      selectionOptions: {
        // True (Single Selection), False (Multiple Selections)
        selectActiveRow: false,

        // you could use "row" selection to override the hybrid mode
        selectionType: 'row',

        // allow using the mouse drag selection to select multiple rows
        dragToSelect: true,
      },
    };

    setColumnDefinitions1(columnDefinitions1);
    setColumnDefinitions2(columnDefinitions2);
    setGridOptions1(gridOptions1);
    setGridOptions2(gridOptions2);
  }

  function mockData(itemCount: number) {
    const data: any[] = [];
    for (let i = 0; i < itemCount; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor(Math.random() * 29);
      const randomFinishYear = randomYear + Math.floor(Math.random() * 10);
      const randomFinish = new Date(randomFinishYear, randomMonth + 1, randomDay);

      data[i] = {
        id: i,
        title: 'Task ' + i,
        duration: Math.floor(Math.random() * 25) + ' days',
        percentComplete: Math.floor(Math.random() * 100),
        start: new Date(randomYear, randomMonth, randomDay, randomDay),
        finish: randomFinish,
        priority: i % 3 ? 2 : i % 5 ? 3 : 1,
        effortDriven: i % 4 === 0,
      };
    }
    return data;
  }

  function reactGrid1Ready(reactGrid: SlickgridReactInstance) {
    setReactGrid1(reactGrid);

    const cellSelectionModel1 = reactGrid.slickGrid.getSelectionModel() as SlickHybridSelectionModel;
    _eventHandler.subscribe(cellSelectionModel1.onSelectedRangesChanged, (_e, args) => {
      const targetRange = document.querySelector('#selectionRange1') as HTMLSpanElement;
      if (targetRange) {
        targetRange.textContent = '';
        for (const slickRange of args) {
          targetRange.textContent += JSON.stringify(slickRange);
        }
      }
    });
  }

  function reactGrid2Ready(reactGrid: SlickgridReactInstance) {
    setReactGrid2(reactGrid);

    const cellSelectionModel2 = reactGrid.slickGrid.getSelectionModel() as SlickHybridSelectionModel;
    _eventHandler.subscribe(cellSelectionModel2.onSelectedRangesChanged, (_e, args) => {
      const targetRange = document.querySelector('#selectionRange2') as HTMLSpanElement;
      if (targetRange) {
        targetRange.textContent = '';
        for (const slickRange of args) {
          targetRange.textContent += JSON.stringify(slickRange);
        }
      }
    });
  }

  return !gridOptions1 && !gridOptions2 ? (
    ''
  ) : (
    <div id="demo-container" className="container-fluid">
      <h2>
        Example 48: Hybrid Selection Model
        <span className="float-end font18">
          see&nbsp;
          <a
            target="_blank"
            href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example48.tsx"
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
          <code>SlickHybridSelectionModel</code> This Selection Model is an hybrid approach that uses a combination of the row or cell
          selections depending on certain conditions.
          <ul>
            <li>
              1. clicking on the first column (<code>id</code>) will use <code>RowSelectionModel</code> because of our configuration of
              <code>rowSelectColumnIds: ['id']</code> as the columns that will trigger row selection.
            </li>
            <li>
              2. clicking on the any other columns will use <code>CellSelectionModel</code> by default
            </li>
          </ul>
        </div>
      )}

      <h3>
        Grid 1
        <small className="subtitle ms-3 text-italic">
          <label>Range Selection</label>
          <span id="selectionRange1"></span>
        </small>
      </h3>

      <div className="grid-container1">
        <SlickgridReact
          gridId="grid48-1"
          columns={columnDefinitions1}
          options={gridOptions1!}
          dataset={dataset1}
          onReactGridCreated={($event) => reactGrid1Ready($event.detail)}
        />
      </div>

      <hr />

      <h3>
        Grid 2
        <small className="subtitle ms-3 text-italic">
          <label>Range Selection</label>
          <span id="selectionRange2"></span>
        </small>
      </h3>
      <SlickgridReact
        gridId="grid48-2"
        columns={columnDefinitions2}
        options={gridOptions2!}
        dataset={dataset2}
        onReactGridCreated={($event) => reactGrid2Ready($event.detail)}
      />
    </div>
  );
};

export default Example48;
