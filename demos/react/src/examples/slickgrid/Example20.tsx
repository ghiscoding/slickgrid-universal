import {
  type Column,
  type ColumnEditorDualInput,
  Editors,
  Filters,
  formatNumber,
  Formatters,
  type GridOption,
  SlickEventHandler,
  SlickgridReact,
  type SlickgridReactInstance,
} from 'slickgrid-react';
import React, { useEffect, useRef, useState } from 'react';

import './example20.scss'; // provide custom CSS/SASS styling

const Example20: React.FC = () => {
  const [columnDefinitions, setColumnDefinitions] = useState<Column[]>([]);
  const [dataset] = useState<any[]>(getData());
  const [gridOptions, setGridOptions] = useState<GridOption | undefined>(undefined);
  const [frozenColumnCount, setFrozenColumnCount] = useState(2);
  const [frozenRowCount, setFrozenRowCount] = useState(3);
  const [isFrozenBottom, setIsFrozenBottom] = useState(false);
  const [hideSubTitle, setHideSubTitle] = useState(false);

  const reactGridRef = useRef<SlickgridReactInstance | null>(null);
  const slickEventHandler = new SlickEventHandler();

  useEffect(() => {
    defineGrid();

    // when unmounting
    return () => {
      slickEventHandler.unsubscribeAll();
    };
  }, []);

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;

    // with frozen (pinned) grid, in order to see the entire row being highlighted when hovering
    // we need to do some extra tricks (that is because frozen grids use 2 separate div containers)
    // the trick is to use row selection to highlight when hovering current row and remove selection once we're not
    slickEventHandler.subscribe(reactGridRef.current?.slickGrid.onMouseEnter, (event) => highlightRow(event, true));
    slickEventHandler.subscribe(reactGridRef.current?.slickGrid.onMouseLeave, (event) => highlightRow(event, false));
  }

  function highlightRow(event: any, isMouseEnter: boolean) {
    const cell = reactGridRef.current?.slickGrid.getCellFromEvent(event);
    const rows = isMouseEnter ? [cell?.row ?? 0] : [];
    reactGridRef.current?.slickGrid.setSelectedRows(rows); // highlight current row
    event.preventDefault();
  }

  /* Define grid Options and Columns */
  function defineGrid() {
    const columnDefinitions: Column[] = [
      {
        id: 'sel',
        name: '#',
        field: 'id',
        minWidth: 40,
        width: 40,
        maxWidth: 40,
        cannotTriggerInsert: true,
        resizable: false,
        unselectable: true,
      },
      {
        id: 'title',
        name: 'Title',
        field: 'title',
        minWidth: 100,
        width: 120,
        filterable: true,
        sortable: true,
      },
      {
        id: 'percentComplete',
        name: '% Complete',
        field: 'percentComplete',
        resizable: false,
        minWidth: 130,
        width: 140,
        formatter: Formatters.percentCompleteBar,
        type: 'number',
        filterable: true,
        filter: { model: Filters.slider, operator: '>=' },
        sortable: true,
      },
      {
        id: 'start',
        name: 'Start',
        field: 'start',
        minWidth: 100,
        width: 120,
        filterable: true,
        sortable: true,
        formatter: Formatters.dateIso,
      },
      {
        id: 'finish',
        name: 'Finish',
        field: 'finish',
        minWidth: 100,
        width: 120,
        filterable: true,
        sortable: true,
        formatter: Formatters.dateIso,
      },
      {
        id: 'cost',
        name: 'Cost | Duration',
        field: 'cost',
        formatter: costDurationFormatter,
        minWidth: 150,
        width: 170,
        sortable: true,
        // filterable: true,
        filter: {
          model: Filters.compoundSlider,
        },
        editor: {
          model: Editors.dualInput,
          // the DualInputEditor is of Type ColumnEditorDualInput and MUST include (leftInput/rightInput) in its params object
          // in each of these 2 properties, you can pass any regular properties of a column editor
          // and they will be executed following the options defined in each
          params: {
            leftInput: {
              field: 'cost',
              type: 'float',
              decimal: 2,
              minValue: 0,
              maxValue: 50000,
              placeholder: '< 50K',
              errorMessage: 'Cost must be positive and below $50K.',
            },
            rightInput: {
              field: 'duration',
              type: 'float', // you could have 2 different input type as well
              minValue: 0,
              maxValue: 100,
              title: 'make sure Duration is withing its range of 0 to 100',
              errorMessage: 'Duration must be between 0 and 100.',

              // Validator Option #1
              // You could also optionally define a custom validator in 1 or both inputs
              /*
              validator: (value, args) => {
                let isValid = true;
                let errorMsg = '';
                if (value < 0 || value > 120) {
                  isValid = false;
                  errorMsg = 'Duration MUST be between 0 and 120.';
                }
                return { valid: isValid, msg: errorMsg };
              }
              */
            },
          } as ColumnEditorDualInput,

          // Validator Option #2 (shared Validator) - this is the last alternative, option #1 (independent Validators) is still the recommended way
          // You can also optionally use a common Validator (if you do then you cannot use the leftInput/rightInput validators at same time)
          // to compare both values at the same time.
          /*
          validator: (values, args) => {
            let isValid = true;
            let errorMsg = '';
            if (values.cost < 0 || values.cost > 50000) {
              isValid = false;
              errorMsg = 'Cost MUST be between 0 and 50k.';
            }
            if (values.duration < 0 || values.duration > 120) {
              isValid = false;
              errorMsg = 'Duration MUST be between 0 and 120.';
            }
            if (values.cost < values.duration) {
              isValid = false;
              errorMsg = 'Cost can never be lower than its Duration.';
            }
            return { valid: isValid, msg: errorMsg };
          }
          */
        },
      },
      {
        id: 'effortDriven',
        name: 'Effort Driven',
        field: 'effortDriven',
        minWidth: 100,
        width: 120,
        formatter: Formatters.checkmarkMaterial,
        filterable: true,
        filter: {
          collection: [
            { value: '', label: '' },
            { value: true, label: 'True' },
            { value: false, label: 'False' },
          ],
          model: Filters.singleSelect,
        },
        sortable: true,
      },
      {
        id: 'title1',
        name: 'Title 1',
        field: 'title1',
        minWidth: 100,
        width: 120,
        filterable: true,
        sortable: true,
      },
      {
        id: 'title2',
        name: 'Title 2',
        field: 'title2',
        minWidth: 100,
        width: 120,
        filterable: true,
        sortable: true,
      },
      {
        id: 'title3',
        name: 'Title 3',
        field: 'title3',
        minWidth: 100,
        width: 120,
        filterable: true,
        sortable: true,
      },
      {
        id: 'title4',
        name: 'Title 4',
        field: 'title4',
        minWidth: 100,
        width: 120,
        filterable: true,
        sortable: true,
      },
    ];

    const gridOptions: GridOption = {
      autoResize: {
        container: '#demo-container',
        rightPadding: 10,
      },
      gridWidth: 920,
      enableCellNavigation: true,
      editable: true,
      autoEdit: true,
      enableExcelCopyBuffer: true,
      frozenColumn: 2,
      frozenRow: 3,
      // frozenBottom: true, // if you want to freeze the bottom instead of the top, you can enable this property

      // show both Frozen Columns in HeaderMenu & GridMenu, these are opt-in commands so they're disabled by default
      gridMenu: { hideClearFrozenColumnsCommand: false },
      headerMenu: { hideFreezeColumnsCommand: false },
    };

    setColumnDefinitions(columnDefinitions);
    setGridOptions(gridOptions);
  }

  function getData() {
    // Set up some test columns.
    const mockDataset: any[] = [];
    for (let i = 0; i < 500; i++) {
      mockDataset[i] = {
        id: i,
        title: 'Task ' + i,
        cost: i % 33 === 0 ? null : Math.random() * 10000,
        duration: i % 8 ? Math.round(Math.random() * 100) + '' : null,
        percentComplete: Math.round(Math.random() * 100),
        start: new Date(2009, 0, 1),
        finish: new Date(2009, 4, 5),
        effortDriven: i % 5 === 0,
        title1: `Some Text ${Math.round(Math.random() * 25)}`,
        title2: `Some Text ${Math.round(Math.random() * 25)}`,
        title3: `Some Text ${Math.round(Math.random() * 25)}`,
        title4: `Some Text ${Math.round(Math.random() * 25)}`,
      };
    }
    return mockDataset;
  }

  /** change dynamically, through slickgrid "setOptions()" the number of pinned columns */
  function changeFrozenColumnCount(e: React.FormEvent<HTMLInputElement>) {
    const frozenColumn = +((e.target as HTMLInputElement)?.value ?? 0);
    setFrozenColumnCount(frozenColumn);
  }

  function updateFrozenColumnCount() {
    reactGridRef.current?.slickGrid?.setOptions({
      frozenColumn: frozenColumnCount,
    });
  }

  /** change dynamically, through slickgrid "setOptions()" the number of pinned rows */
  function changeFrozenRowCount(e: React.FormEvent<HTMLInputElement>) {
    const frozenRow = +((e.target as HTMLInputElement)?.value ?? 0);
    setFrozenRowCount(frozenRow);
  }

  function updateFrozenRowCount() {
    reactGridRef.current?.slickGrid?.setOptions({
      frozenRow: frozenRowCount,
    });
  }

  function costDurationFormatter(_row: number, _cell: number, _value: any, _columnDef: Column, dataContext: any) {
    const costText = isNullUndefinedOrEmpty(dataContext.cost) ? 'n/a' : formatNumber(dataContext.cost, 0, 2, false, '$', '', '.', ',');
    let durationText = 'n/a';
    if (!isNullUndefinedOrEmpty(dataContext.duration) && dataContext.duration >= 0) {
      durationText = `${dataContext.duration} ${dataContext.duration > 1 ? 'days' : 'day'}`;
    }
    return `<b>${costText}</b> | ${durationText}`;
  }

  function isNullUndefinedOrEmpty(data: any) {
    return data === '' || data === null || data === undefined;
  }

  function onCellValidationError(_e: Event, args: any) {
    alert(args.validationResults.msg);
  }

  function setFrozenColumns(frozenCols: number) {
    reactGridRef.current?.slickGrid.setOptions({ frozenColumn: frozenCols });
    const updatedGridOptions = reactGridRef.current?.slickGrid.getOptions();
    setGridOptions(updatedGridOptions);
  }

  /** toggle dynamically, through slickgrid "setOptions()" the top/bottom pinned location */
  function toggleFrozenBottomRows() {
    reactGridRef.current?.slickGrid.setOptions({
      frozenBottom: !isFrozenBottom,
    });

    const newIsFrozenBottom = !isFrozenBottom;
    setIsFrozenBottom(newIsFrozenBottom);
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
        Example 20: Pinned (frozen) Columns/Rows
        <span className="float-end font18">
          see&nbsp;
          <a
            target="_blank"
            href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example20.tsx"
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
        This example demonstrates the use of Pinned (aka frozen) Columns and/or Rows (
        <a href="https://ghiscoding.gitbook.io/slickgrid-react/grid-functionalities/frozen-columns-rows" target="_blank">
          Docs
        </a>
        )
        <ul>
          <li>Option to pin any number of columns (left only) or rows</li>
          <li>Option to pin the rows at the bottom instead of the top (default)</li>
          <li>You can also dynamically any of these options, through SlickGrid "setOptions()"</li>
          <li>Possibility to change the styling of the line border between pinned columns/rows</li>
        </ul>
      </div>

      <br />

      <div className="row">
        <div className="col-sm-12">
          <span>
            <label htmlFor="">Pinned Rows: </label>
            <input type="number" defaultValue={frozenRowCount} onInput={($event) => changeFrozenRowCount($event)} />
            <button className="btn btn-outline-secondary btn-xs btn-icon mx-1" onClick={() => updateFrozenRowCount()}>
              Set
            </button>
          </span>
          <span style={{ marginLeft: '10px' }}>
            <label htmlFor="">Pinned Columns: </label>
            <input type="number" defaultValue={frozenColumnCount} onInput={($event) => changeFrozenColumnCount($event)} />
            <button className="btn btn-outline-secondary btn-xs btn-icon mx-1" onClick={() => updateFrozenColumnCount()}>
              Set
            </button>
          </span>
        </div>
      </div>

      <div className="row mt-2">
        <div className="col-sm-12">
          <button
            className="btn btn-outline-secondary btn-sm btn-icon mx-1"
            onClick={() => setFrozenColumns(-1)}
            data-test="remove-frozen-column-button"
          >
            <i className="mdi mdi-close"></i> Remove Frozen Columns
          </button>
          <button className="btn btn-outline-secondary btn-sm btn-icon" onClick={() => setFrozenColumns(2)} data-test="set-3frozen-columns">
            <i className="mdi mdi-pin-outline"></i> Set 3 Frozen Columns
          </button>
          <span style={{ marginLeft: '15px' }}>
            <button className="btn btn-outline-secondary btn-sm btn-icon" onClick={() => toggleFrozenBottomRows()}>
              <i className="mdi mdi-flip-vertical"></i> Toggle Pinned Rows
            </button>
            <span style={{ fontWeight: 'bold' }}>: {isFrozenBottom ? 'Bottom' : 'Top'}</span>
          </span>
        </div>
      </div>

      <div className="col-sm-12">
        <hr />
      </div>

      <SlickgridReact
        gridId="grid20"
        columns={columnDefinitions}
        options={gridOptions}
        dataset={dataset}
        onReactGridCreated={($event) => reactGridReady($event.detail)}
        onValidationError={($event) => onCellValidationError($event.detail.eventData, $event.detail.args)}
      />
    </div>
  );
};

export default Example20;
