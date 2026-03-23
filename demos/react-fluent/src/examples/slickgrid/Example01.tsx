import { Button } from '@fluentui/react-components';
import { useState } from 'react';
import { Formatters, SlickgridReact, type Column, type GridOption, type SlickgridReactInstance } from 'slickgrid-react';
import { baseFluentGridOption } from './base-fluent-grid-options.js';

const NB_ITEMS = 995;

const Example1: React.FC = () => {
  const defaultBrowserDarkMode = isBrowserDarkModeEnabled();
  const [darkModeGrid1, setDarkModeGrid1] = useState(defaultBrowserDarkMode);
  const [reactGrid1, setReactGrid1] = useState<SlickgridReactInstance>();

  // mock some data (different in each dataset)
  const [dataset1] = useState<any[]>(mockData(NB_ITEMS));
  const [dataset2] = useState<any[]>(mockData(NB_ITEMS));

  /* Define grid Options and Columns */
  const columns1: Column[] = [
    { id: 'title', name: 'Title', field: 'title', sortable: true, minWidth: 100 },
    { id: 'duration', name: 'Duration (days)', field: 'duration', sortable: true, minWidth: 100 },
    { id: '%', name: '% Complete', field: 'percentComplete', sortable: true, minWidth: 100 },
    { id: 'start', name: 'Start', field: 'start', formatter: Formatters.dateIso },
    { id: 'finish', name: 'Finish', field: 'finish', formatter: Formatters.dateIso },
    { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', sortable: true, minWidth: 100 },
  ];
  const columns2: Column[] = [...columns1];

  const gridOptions1: GridOption = {
    darkMode: defaultBrowserDarkMode,
    gridHeight: 225,
    gridWidth: 800,
    enableAutoResize: false,
    enableSorting: true,
    ...baseFluentGridOption,
  };

  // copy the same Grid Options and Column Definitions to 2nd grid
  // but also add Pagination in this grid
  const gridOptions2: GridOption = {
    darkMode: false,
    gridHeight: 225,
    gridWidth: 800,
    enableAutoResize: false,
    enableSorting: true,
    enablePagination: true,
    pagination: {
      pageSizes: [5, 10, 20, 25, 50],
      pageSize: 5,
    },
    ...baseFluentGridOption,
  };

  function isBrowserDarkModeEnabled() {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }

  function mockData(count: number) {
    // mock a dataset
    const mockDataset: any[] = [];
    for (let i = 0; i < count; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor(Math.random() * 29);
      const randomPercent = Math.round(Math.random() * 100);

      mockDataset[i] = {
        id: i,
        title: 'Task ' + i,
        duration: Math.round(Math.random() * 100) + '',
        percentComplete: randomPercent,
        start: new Date(randomYear, randomMonth + 1, randomDay),
        finish: new Date(randomYear + 1, randomMonth + 1, randomDay),
        effortDriven: i % 5 === 0,
      };
    }

    return mockDataset;
  }

  function reactGrid1Ready(reactGrid: SlickgridReactInstance) {
    setReactGrid1(reactGrid);
  }

  function resetGrid1() {
    // const cols = reactGrid1.slickGrid?.getColumns() || [];
    const cols = columns1.slice();
    cols.forEach((c) => (c.hidden = false));
    reactGrid1?.slickGrid?.setColumns(cols);
    reactGrid1?.slickGrid?.autosizeColumns();
  }

  function toggleDarkModeGrid1() {
    const isDarkMode = !darkModeGrid1;
    setDarkModeGrid1(isDarkMode);
    if (isDarkMode) {
      document.querySelector('.grid-container1')?.classList.add('dark-mode');
    } else {
      document.querySelector('.grid-container1')?.classList.remove('dark-mode');
    }
    reactGrid1?.slickGrid?.setOptions({ darkMode: isDarkMode });
  }

  return (
    <div id="demo-container" className="container-fluid">
      <h2>Example 1: Basic Grids</h2>

      <h3>
        <div className="column">
          <h3 className="mr-3">Grid 1</h3>
          <Button className="mx-1" onClick={() => toggleDarkModeGrid1()} data-test="toggle-dark-mode">
            <i className="fic fic-dark-theme"></i>
            <span className="ms-1">Toggle Dark Mode</span>
          </Button>
          <Button onClick={() => resetGrid1()} data-test="reset-grid1">
            <span>Reset Grid (display all columns)</span>
          </Button>
        </div>
      </h3>

      <div className="grid-container1">
        <SlickgridReact
          gridId="grid1-1"
          columns={columns1}
          options={gridOptions1!}
          dataset={dataset1}
          onReactGridCreated={($event) => reactGrid1Ready($event.detail)}
        />
      </div>

      <hr />

      <h3>
        Grid 2 <small>(with local Pagination)</small>
      </h3>
      <SlickgridReact gridId="grid1-2" columns={columns2} options={gridOptions2!} dataset={dataset2} />
    </div>
  );
};

export default Example1;
