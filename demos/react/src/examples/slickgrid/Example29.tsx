import { type Column, type GridOption, Formatters, SlickgridReact } from 'slickgrid-react';
import React, { useEffect, useState } from 'react';

const NB_ITEMS = 995;

const Header = () => <h5>Header Slot</h5>;
const Footer = () => {
  const [state, setState] = React.useState({ clickedTimes: 0 });
  const buttonClick = () => setState({ ...state, clickedTimes: state.clickedTimes + 1 });
  return (
    <div>
      <h5>Footer Slot</h5>
      <button data-test="footer-btn" onClick={() => buttonClick()}>
        I'm a button in Slickgrid-React footer (click me)
      </button>
      {state.clickedTimes > 0 && <div>You've clicked me {state.clickedTimes} time(s)</div>}
    </div>
  );
};

const Example29: React.FC = () => {
  const [dataset] = useState<Column[]>(getData(NB_ITEMS));
  const [columnDefinitions, setColumnDefinitions] = useState<Column[]>([]);
  const [gridOptions, setGridOptions] = useState<GridOption | undefined>(undefined);
  const [hideSubTitle, setHideSubTitle] = useState(false);

  useEffect(() => {
    defineGrids();
  }, []);

  /* Define grid Options and Columns */
  function defineGrids() {
    const columnDefinitions = [
      { id: 'title', name: 'Title', field: 'title', sortable: true, minWidth: 100 },
      { id: 'duration', name: 'Duration (days)', field: 'duration', sortable: true, minWidth: 100 },
      { id: '%', name: '% Complete', field: 'percentComplete', sortable: true, minWidth: 100 },
      { id: 'start', name: 'Start', field: 'start', formatter: Formatters.dateIso },
      { id: 'finish', name: 'Finish', field: 'finish', formatter: Formatters.dateIso },
      { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', sortable: true, minWidth: 100 },
    ];
    const gridOptions = {
      enableAutoResize: false,
      enableSorting: true,
      gridHeight: 225,
      gridWidth: 800,
    };

    setColumnDefinitions(columnDefinitions);
    setGridOptions(gridOptions);
  }

  function getData(count: number) {
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

  return !gridOptions ? null : (
    <div id="demo-container" className="container-fluid">
      <h2>
        Example 29: Grid with Header and Footer slot
        <span className="float-end font18">
          see&nbsp;
          <a target="_blank" href="https://github.com/ghiscoding/slickgrid-react/blob/master/src/examples/slickgrid/Example29.tsx">
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
      {hideSubTitle ? null : <div className="subtitle">Simple Grids with a custom header and footer via named slots</div>}

      <hr />

      <SlickgridReact
        gridId="grid"
        columns={columnDefinitions}
        options={gridOptions}
        dataset={dataset}
        header={<Header />}
        footer={<Footer />}
      />
    </div>
  );
};

export default Example29;
