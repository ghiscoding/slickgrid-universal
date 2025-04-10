import React, { useEffect, useRef, useState } from 'react';
import {
  type Column,
  FieldType,
  Filters,
  Formatters,
  type GridOption,
  type MultipleSelectOption,
  OperatorType,
  SlickgridReact,
  type SlickgridReactInstance,
  type SliderRangeOption,
} from 'slickgrid-react';

import CustomPagerComponent from './Example42-Custom-Pager.js';

const NB_ITEMS = 5000;

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const Example42: React.FC = () => {
  const [columnDefinitions, setColumnDefinitions] = useState<Column[]>([]);
  const [dataset] = useState<any[]>(loadData(NB_ITEMS));
  const [pageSize, setPageSize] = useState(50);
  const [gridOptions, setGridOptions] = useState<GridOption | undefined>(undefined);
  const [hideSubTitle, setHideSubTitle] = useState(false);

  const reactGridRef = useRef<SlickgridReactInstance | null>(null);

  useEffect(() => {
    defineGrid();
  }, []);

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  function defineGrid() {
    const columnDefinitions: Column[] = [
      {
        id: 'title',
        name: 'Title',
        field: 'id',
        minWidth: 100,
        sortable: true,
        filterable: true,
        formatter: (_row, _cell, val) => `Task ${val}`,
        params: { useFormatterOuputToFilter: true },
      },
      {
        id: 'description',
        name: 'Description',
        field: 'description',
        filterable: true,
        sortable: true,
        minWidth: 80,
        type: FieldType.string,
      },
      {
        id: 'percentComplete',
        name: '% Complete',
        field: 'percentComplete',
        minWidth: 120,
        customTooltip: { position: 'center' },
        sortable: true,
        type: FieldType.number,
        formatter: Formatters.progressBar,
        filterable: true,
        filter: {
          model: Filters.sliderRange,
          maxValue: 100, // or you can use the filterOptions as well
          operator: OperatorType.rangeInclusive, // defaults to inclusive
          filterOptions: {
            hideSliderNumbers: false, // you can hide/show the slider numbers on both side
            min: 0,
            step: 5,
          } as SliderRangeOption,
        },
      },
      {
        id: 'start',
        name: 'Start',
        field: 'start',
        formatter: Formatters.dateIso,
        sortable: true,
        minWidth: 75,
        width: 100,
        exportWithFormatter: true,
        type: FieldType.date,
        filterable: true,
        filter: { model: Filters.compoundDate },
      },
      {
        id: 'finish',
        name: 'Finish',
        field: 'finish',
        formatter: Formatters.dateIso,
        sortable: true,
        minWidth: 75,
        width: 120,
        exportWithFormatter: true,
        type: FieldType.date,
        filterable: true,
        filter: {
          model: Filters.dateRange,
        },
      },
      {
        id: 'duration',
        field: 'duration',
        name: 'Duration',
        maxWidth: 90,
        type: FieldType.number,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters.input,
          operator: OperatorType.rangeExclusive, // defaults to exclusive
        },
      },
      {
        id: 'completed',
        name: 'Completed',
        field: 'completed',
        minWidth: 85,
        maxWidth: 90,
        formatter: Formatters.checkmarkMaterial,
        exportWithFormatter: true, // you can set this property in the column definition OR in the grid options, column def has priority over grid options
        filterable: true,
        filter: {
          collection: [
            { value: '', label: '' },
            { value: true, label: 'True' },
            { value: false, label: 'False' },
          ],
          model: Filters.singleSelect,
          filterOptions: { autoAdjustDropHeight: true } as MultipleSelectOption,
        },
      },
    ];

    const gridOptions: GridOption = {
      autoResize: {
        container: '#demo-container',
        bottomPadding: 20, // add a padding to include our custom pagination
      },
      enableExcelCopyBuffer: true,
      enableFiltering: true,
      customPaginationComponent: CustomPagerComponent, // load our Custom Pagination Component
      enablePagination: true,
      pagination: {
        pageSize,
      },
      rowHeight: 40,
    };

    setColumnDefinitions(columnDefinitions);
    setGridOptions(gridOptions);
  }

  function loadData(itemCount: number): any[] {
    // mock a dataset
    const tempDataset: any[] = [];
    for (let i = 0, ln = itemCount; i < ln; i++) {
      const randomDuration = randomBetween(0, 365);
      const randomYear = randomBetween(new Date().getFullYear(), new Date().getFullYear() + 1);
      const randomMonth = randomBetween(0, 12);
      const randomDay = randomBetween(10, 28);
      const randomPercent = randomBetween(0, 100);

      tempDataset.push({
        id: i,
        title: 'Task ' + i,
        description: i % 5 ? 'desc ' + i : null, // also add some random to test NULL field
        duration: randomDuration,
        percentComplete: randomPercent,
        percentCompleteNumber: randomPercent,
        start: i % 4 ? null : new Date(randomYear, randomMonth, randomDay), // provide a Date format
        finish: new Date(randomYear, randomMonth, randomDay),
        completed: randomPercent === 100 ? true : false,
      });
    }

    return tempDataset;
  }

  function pageSizeChanged(pageSize: number | string) {
    setPageSize(+pageSize);
    reactGridRef.current?.paginationService?.changeItemPerPage(+pageSize);
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
    <div className="demo42">
      <div id="demo-container" className="container-fluid">
        <h2>
          Example 42: Custom Pagination
          <span className="float-end font18">
            see&nbsp;
            <a
              target="_blank"
              href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example42.tsx"
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
          You can create a Custom Pagination by passing a React Custom Component and it must <code>implements BasePaginationComponent</code>
          . Any of the pagination controls could be moved anywhere on the page (for example we purposely moved the page size away from the
          rest of the pagination elements).
        </div>

        <div>
          <span className="margin-15px">
            Page Size&nbsp;
            <input
              type="text"
              className="input is-small is-narrow"
              data-test="page-size-input"
              style={{ width: '55px' }}
              value={pageSize}
              onInput={($event) => pageSizeChanged(($event.target as HTMLInputElement).value)}
            />
          </span>
        </div>

        <SlickgridReact
          gridId="grid42"
          columns={columnDefinitions}
          options={gridOptions}
          dataset={dataset}
          onReactGridCreated={($event) => reactGridReady($event.detail)}
        />
      </div>
    </div>
  );
};

export default Example42;
