import {
  type Column,
  FieldType,
  Formatters,
  type GridOption,
  type OperatorString,
  SlickgridReact,
  type SlickgridReactInstance,
} from 'slickgrid-react';
import React, { useEffect, useRef, useState } from 'react';

import './example21.scss';

const Example21: React.FC = () => {
  const [columnDefinitions, setColumnDefinitions] = useState<Column[]>([]);
  const [dataset] = useState<any[]>(getData());
  const [gridOptions, setGridOptions] = useState<GridOption | undefined>(undefined);
  const reactGridRef = useRef<SlickgridReactInstance | null>(null);
  const [operatorList] = useState<OperatorString[]>(['=', '<', '<=', '>', '>=', '<>', 'StartsWith', 'EndsWith']);
  const [selectedOperator, setSelectedOperator] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [selectedColumn, setSelectedColumn] = useState<Column>();
  const [hideSubTitle, setHideSubTitle] = useState(false);

  useEffect(() => {
    defineGrid();
  }, []);

  useEffect(() => {
    updateFilter();
  }, [searchValue, selectedOperator, selectedColumn]);

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
        width: 100,
        sortable: true,
        type: FieldType.string,
      },
      {
        id: 'duration',
        name: 'Duration (days)',
        field: 'duration',
        width: 100,
        sortable: true,
        type: FieldType.number,
      },
      {
        id: 'complete',
        name: '% Complete',
        field: 'percentComplete',
        width: 100,
        sortable: true,
        formatter: Formatters.percentCompleteBar,
        type: FieldType.number,
      },
      {
        id: 'start',
        name: 'Start',
        field: 'start',
        width: 100,
        sortable: true,
        formatter: Formatters.dateIso,
        type: FieldType.date,
      },
      {
        id: 'finish',
        name: 'Finish',
        field: 'finish',
        width: 100,
        formatter: Formatters.dateIso,
        sortable: true,
        type: FieldType.date,
      },
      {
        id: 'effort-driven',
        name: 'Effort Driven',
        field: 'effortDriven',
        width: 100,
        sortable: true,
        formatter: Formatters.checkmarkMaterial,
        type: FieldType.number,
      },
    ];

    const gridOptions: GridOption = {
      // if you want to disable autoResize and use a fixed width which requires horizontal scrolling
      // it's advised to disable the autoFitColumnsOnFirstLoad as well
      // enableAutoResize: false,
      // autoFitColumnsOnFirstLoad: false,

      autoHeight: true,
      autoResize: {
        container: '#demo-container',
        rightPadding: 10,
      },

      // enable the filtering but hide the user filter row since we use our own single filter
      enableFiltering: true,
      showHeaderRow: false, // hide the filter row (header row)

      alwaysShowVerticalScroll: false,
      enableColumnPicker: true,
      enableCellNavigation: true,
      enableRowSelection: true,
    };

    setColumnDefinitions(columnDefinitions);
    setGridOptions(gridOptions);
  }

  function getData() {
    // mock a dataset
    const mockedDataset: any[] = [];
    for (let i = 0; i < 25; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor(Math.random() * 29);
      const randomPercent = Math.round(Math.random() * 100);

      mockedDataset[i] = {
        id: i,
        title: 'Task ' + i,
        duration: Math.round(Math.random() * 100) + '',
        percentComplete: randomPercent,
        percentCompleteNumber: randomPercent,
        start: new Date(randomYear, randomMonth, randomDay),
        finish: new Date(randomYear, randomMonth + 1, randomDay),
        effortDriven: i % 5 === 0,
      };
    }
    return mockedDataset;
  }

  //
  // -- if any of the Search form input changes, we'll call the updateFilter() method
  //

  function clearGridSearchInput() {
    setSearchValue('');
  }

  function selectedOperatorChanged(e: React.FormEvent<HTMLSelectElement>) {
    setSelectedOperator((e.target as HTMLSelectElement)?.value ?? '');
  }

  function selectedColumnChanged(e: React.ChangeEvent<HTMLSelectElement>) {
    const selectedVal = (e.target as HTMLSelectElement)?.value ?? '';
    const selectedColumn = columnDefinitions.find((c) => c.id === selectedVal);

    setSelectedColumn(selectedColumn);
  }

  function searchValueChanged(e: React.FormEvent<HTMLInputElement>) {
    setSearchValue((e.target as HTMLInputElement)?.value ?? '');
  }

  function updateFilter() {
    reactGridRef.current?.filterService.updateSingleFilter({
      columnId: `${selectedColumn?.id ?? ''}`,
      operator: selectedOperator as OperatorString,
      searchTerms: [searchValue || ''],
    });
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
        Example 21: Grid AutoHeight
        <span className="float-end font18">
          see&nbsp;
          <a
            target="_blank"
            href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example21.tsx"
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
        The SlickGrid option "autoHeight" can be used if you wish to keep the full height of the grid without any scrolling
        <ul>
          <li>You define a fixed grid width via "gridWidth" in the View</li>
          <li>You can still use the "autoResize" for the width to be resized automatically (the height will never change in this case)</li>
          <li>
            This dataset has 25 rows, if you scroll down the page you can see the entire set is shown without any grid scrolling (though you
            might have browser scrolling)
          </li>
        </ul>
      </div>

      <div className="row row-cols-lg-auto g-1 align-items-center">
        <div className="col">
          <label htmlFor="columnSelect">Single Search:</label>
        </div>
        <div className="col">
          <select
            className="form-select"
            data-test="search-column-list"
            name="selectedColumn"
            onChange={($event) => selectedColumnChanged($event)}
          >
            <option value="''">...</option>
            {columnDefinitions.map((column) => (
              <option value={column.id} key={column.id}>
                {column.name as string}
              </option>
            ))}
          </select>
        </div>
        <div className="col">
          <select
            className="form-select"
            data-test="search-operator-list"
            name="selectedOperator"
            onChange={($event) => selectedOperatorChanged($event)}
          >
            <option value="''">...</option>
            {operatorList.map((operator) => (
              <option value={operator} key={operator}>
                {operator}
              </option>
            ))}
          </select>
        </div>

        <div className="col">
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="search value"
              data-test="search-value-input"
              value={searchValue}
              onInput={($event) => searchValueChanged($event)}
            />
            <button
              className="btn btn-outline-secondary d-flex align-items-center pl-2 pr-2"
              data-test="clear-search-value"
              onClick={() => clearGridSearchInput()}
            >
              <span className="mdi mdi-close m-1"></span>
            </button>
          </div>
        </div>
      </div>

      <hr />

      <SlickgridReact
        gridId="grid21"
        columns={columnDefinitions}
        options={gridOptions}
        dataset={dataset}
        onReactGridCreated={($event) => reactGridReady($event.detail)}
      />
    </div>
  );
};

export default Example21;
