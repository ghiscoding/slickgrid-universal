import React, { useEffect, useRef, useState } from 'react';
import { Filters, SlickgridReact, type Column, type GridOption, type SlickgridReactInstance } from 'slickgrid-react';
import './example22.scss';
import CUSTOMERS_URL from './data/customers_100.json?url';

const Example22: React.FC = () => {
  const [gridOptions1, setGridOptions1] = useState<GridOption | undefined>(undefined);
  const [gridOptions2, setGridOptions2] = useState<GridOption | undefined>(undefined);
  const [columnDefinitions1, setColumnDefinitions1] = useState<Column[]>([]);
  const [columnDefinitions2, setColumnDefinitions2] = useState<Column[]>([]);
  const [dataset1, setDataset1] = useState<any[]>([]);
  const [dataset2, setDataset2] = useState<any[]>([]);
  const reactGridRef2 = useRef<SlickgridReactInstance | null>(null);
  const [isGrid2DataLoaded, setIsGrid2DataLoaded] = useState(false);
  const [isGrid2Resize, setIsGrid2Resize] = useState(false);
  const [hideSubTitle, setHideSubTitle] = useState(false);

  useEffect(() => {
    defineGrids();
    setDataset1(getData());
  }, []);

  function reactGrid2Ready(reactGrid: SlickgridReactInstance) {
    reactGridRef2.current = reactGrid;
  }

  // Grid2 definition
  function defineGrids() {
    // grid 1
    const columnDefinitions1: Column[] = [
      { id: 'title', name: 'Title', field: 'title', sortable: true, minWidth: 100 },
      { id: 'duration', name: 'Duration (days)', field: 'duration', sortable: true, minWidth: 100 },
      { id: '%', name: '% Complete', field: 'percentComplete', sortable: true, minWidth: 100 },
      { id: 'start', name: 'Start', field: 'start', minWidth: 100 },
      { id: 'finish', name: 'Finish', field: 'finish', minWidth: 100 },
      { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', sortable: true, minWidth: 100 },
    ];
    const gridOptions1: GridOption = {
      enableAutoResize: true,
      autoResize: {
        container: '#demo-container',
        rightPadding: 10,
      },
      enableSorting: true,
    };

    // grid 2
    const columnDefinitions2: Column[] = [
      { id: 'name', name: 'Name', field: 'name', filterable: true, sortable: true },
      {
        id: 'gender',
        name: 'Gender',
        field: 'gender',
        filterable: true,
        sortable: true,
        filter: {
          model: Filters.singleSelect,
          collection: [
            { value: '', label: '' },
            { value: 'male', label: 'male' },
            { value: 'female', label: 'female' },
          ],
        },
      },
      { id: 'company', name: 'Company', field: 'company', filterable: true, sortable: true },
    ];

    const gridOptions2: GridOption = {
      enableAutoResize: true,
      autoResize: {
        container: '#demo-container',
        rightPadding: 10,
      },
      enableFiltering: true,
      enableSorting: true,
    };

    setColumnDefinitions1(columnDefinitions1);
    setColumnDefinitions2(columnDefinitions2);
    setGridOptions1(gridOptions1);
    setGridOptions2(gridOptions2);
  }

  async function loadGrid2Data() {
    // load data with Fetch
    const response2 = await fetch(CUSTOMERS_URL);
    const dataset2 = await response2['json']();

    setDataset2(dataset2);
    setIsGrid2DataLoaded(true);
  }

  function getData() {
    // mock a dataset
    const mockDataset: any[] = [];
    for (let i = 0; i < 1000; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor(Math.random() * 29);
      const randomPercent = Math.round(Math.random() * 100);

      mockDataset[i] = {
        id: i,
        title: 'Task ' + i,
        duration: Math.round(Math.random() * 100) + '',
        percentComplete: randomPercent,
        start: `${randomMonth}/${randomDay}/${randomYear}`,
        finish: `${randomMonth}/${randomDay}/${randomYear}`,
        effortDriven: i % 5 === 0,
      };
    }

    return mockDataset;
  }

  /**
   * When changing Tab, we need to resize the grid in the new Tab that becomes in focus.
   * We need to do this (only once) because SlickGrid relies on the grid being visible in the DOM for it to be sized properly
   * and if it's not (like our use case) we need to resize the grid ourselve and we just need to do that once.
   */
  async function resizeGrid2() {
    if (!isGrid2DataLoaded) {
      await loadGrid2Data();
    }
    if (!isGrid2Resize) {
      reactGridRef2.current?.resizerService.resizeGrid(10);
      setIsGrid2Resize(true);
    }
  }

  return !gridOptions1 ? (
    ''
  ) : (
    <div id="demo-container" className="container-fluid">
      <h2>
        Example 22: Grids in Bootstrap Tabs
        <span className="float-end font18">
          see&nbsp;
          <a
            target="_blank"
            href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example22.tsx"
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
          This example demonstrate the creation of multiple grids in Bootstrap Tabs
          <ol>
            <li>Regular mocked data with JavaScript</li>
            <li>Load dataset through Fetch. Also note we need to call a "resizeGrid()" after focusing on this tab</li>
          </ol>
        </div>
      )}

      <div>
        <ul className="nav nav-tabs" id="myTab" role="tablist">
          <li className="nav-item">
            <a
              className="nav-link active"
              id="javascript-tab"
              data-bs-toggle="tab"
              href="#javascript"
              role="tab"
              aria-controls="javascript"
              aria-selected="true"
            >
              Javascript
            </a>
          </li>
          <li className="nav-item">
            <a
              className="nav-link"
              id="fetch-tab"
              data-bs-toggle="tab"
              href="#fetch"
              role="tab"
              aria-controls="fetch"
              aria-selected="false"
              onClick={() => resizeGrid2()}
            >
              Fetch
            </a>
          </li>
        </ul>

        <div className="tab-content" id="myTabContent">
          <div className="tab-pane fade show active" id="javascript" role="tabpanel" aria-labelledby="javascript-tab">
            <h4>Grid 1 - Load Local Data</h4>
            <SlickgridReact gridId="grid1" columns={columnDefinitions1} options={gridOptions1} dataset={dataset1} />
          </div>
          <div className="tab-pane fade" id="fetch" role="tabpanel" aria-labelledby="fetch-tab">
            <h4>Grid 2 - Load a JSON dataset through Fetch</h4>
            <SlickgridReact
              gridId="grid2"
              columns={columnDefinitions2}
              options={gridOptions2}
              dataset={dataset2}
              onReactGridCreated={($event) => reactGrid2Ready($event.detail)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Example22;
