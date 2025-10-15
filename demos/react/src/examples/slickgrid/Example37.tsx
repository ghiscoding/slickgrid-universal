import React, { useEffect, useRef, useState } from 'react';
import {
  Editors,
  SlickgridReact,
  type Column,
  type GridOption,
  type OnCellChangeEventArgs,
  type SlickgridReactInstance,
} from 'slickgrid-react';

const NB_ITEMS = 100;

const Example37: React.FC = () => {
  const [columnDefinitions, setColumnDefinitions] = useState<Column[]>([]);
  const [dataset, setDataset] = useState<any[]>([]);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [gridOptions, setGridOptions] = useState<GridOption | undefined>(undefined);
  const [hideSubTitle, setHideSubTitle] = useState(false);

  const reactGridRef = useRef<SlickgridReactInstance | null>(null);

  useEffect(() => {
    defineGrid();

    // make sure it's back to light mode before unmounting
    return () => {
      document.querySelector('.panel-wm-content')!.classList.remove('dark-mode');
      document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'light';
    };
  }, []);

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
    updateAllTotals();
  }

  /* Define grid Options and Columns */
  function defineGrid() {
    const columnDefs: Column[] = [];
    for (let i = 0; i < 10; i++) {
      columnDefs.push({
        id: i,
        name: String.fromCharCode('A'.charCodeAt(0) + i),
        field: String(i),
        type: 'number',
        width: 58,
        editor: { model: Editors.integer },
      });
    }

    const gridOptions: GridOption = {
      autoEdit: true,
      autoCommitEdit: true,
      editable: true,
      darkMode,
      gridHeight: 450,
      gridWidth: 800,
      enableCellNavigation: true,
      rowHeight: 30,
      createFooterRow: true,
      showFooterRow: true,
      footerRowHeight: 28,
    };

    setColumnDefinitions(columnDefs);
    setGridOptions(gridOptions);
    setDataset(loadData(NB_ITEMS, columnDefs.length));
  }

  function loadData(itemCount: number, colDefLn: number) {
    // mock a dataset
    const datasetTmp: any[] = [];
    for (let i = 0; i < itemCount; i++) {
      const d = (datasetTmp[i] = {} as any);
      d.id = i;
      for (let j = 0; j < colDefLn; j++) {
        d[j] = Math.round(Math.random() * 10);
      }
    }
    return datasetTmp;
  }

  function handleOnCellChange(_e: Event, args: OnCellChangeEventArgs) {
    updateTotal(args.cell);
  }

  function handleOnColumnsReordered() {
    updateAllTotals();
  }

  function toggleDarkMode() {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    toggleBodyBackground(newDarkMode);
    reactGridRef.current?.slickGrid.setOptions({ darkMode: newDarkMode });
  }

  function toggleBodyBackground(darkMode: boolean) {
    if (darkMode) {
      document.querySelector<HTMLDivElement>('.panel-wm-content')!.classList.add('dark-mode');
      document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'dark';
    } else {
      document.querySelector('.panel-wm-content')!.classList.remove('dark-mode');
      document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'light';
    }
  }

  function updateAllTotals() {
    let columnIdx = reactGridRef.current?.slickGrid?.getColumns().length || 0;
    while (columnIdx--) {
      updateTotal(columnIdx);
    }
  }

  function updateTotal(cell: number) {
    const columnId = reactGridRef.current?.slickGrid?.getColumns()[cell].id as number;

    let total = 0;
    let i = dataset!.length || 0;
    while (i--) {
      total += parseInt(dataset![i][columnId], 10) || 0;
    }
    const columnElement = reactGridRef.current?.slickGrid?.getFooterRowColumn(columnId);
    if (columnElement) {
      columnElement.textContent = `Sum: ${total}`;
    }
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
        Example 37: Footer Totals Row
        <button className="btn btn-outline-secondary btn-sm btn-icon ms-2" onClick={() => toggleDarkMode()} data-test="toggle-dark-mode">
          <i className="mdi mdi-theme-light-dark"></i>
          <span>Toggle Dark Mode</span>
        </button>
        <span className="float-end font18">
          see&nbsp;
          <a
            target="_blank"
            href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example37.tsx"
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

      <div className="subtitle">Display a totals row at the end of the grid.</div>

      <SlickgridReact
        gridId="grid37"
        columns={columnDefinitions}
        options={gridOptions}
        dataset={dataset}
        onReactGridCreated={($event) => reactGridReady($event.detail)}
        onCellChange={($event) => handleOnCellChange($event.detail.eventData, $event.detail.args)}
        onColumnsReordered={() => handleOnColumnsReordered()}
      />
    </div>
  );
};

export default Example37;
