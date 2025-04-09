import { type EventPubSubService } from '@slickgrid-universal/event-pub-sub';
import React, { useState, useEffect, useRef } from 'react';
import {
  type Column,
  Editors,
  ExtensionName,
  FieldType,
  Filters,
  Formatters,
  type GridOption,
  SlickgridReact,
  type SlickgridReactInstance,
  SlickRowDetailView,
} from 'slickgrid-react';

import { Example19Preload } from './Example19-preload';
import Example19DetailView from './Example19-detail-view';

const FAKE_SERVER_DELAY = 250;
const NB_ITEMS = 1000;

const Example19: React.FC = () => {
  const [gridOptions, setGridOptions] = useState<GridOption | undefined>(undefined);
  const [columnDefinitions, setColumnDefinitions] = useState<Column[]>([]);
  const [dataset] = useState<any[]>(loadData());
  const [detailViewRowCount, setDetailViewRowCount] = useState<number>(9);
  const [serverWaitDelay, setServerWaitDelay] = useState<number>(FAKE_SERVER_DELAY);
  const [flashAlertType, setFlashAlertType] = useState<string>('info');
  const [message, setMessage] = useState<string>('');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [hideSubTitle, setHideSubTitle] = useState(false);

  const serverWaitDelayRef = useRef(serverWaitDelay);
  const reactGridRef = useRef<SlickgridReactInstance | null>(null);

  useEffect(() => {
    defineGrid();
    return () => {
      // make sure it's back to light mode before unmounting
      document.querySelector('.panel-wm-content')!.classList.remove('dark-mode');
      document.querySelector<HTMLDivElement>('#demo-container')!.dataset.bsTheme = 'light';
    };
  }, []);

  function rowDetailInstance() {
    return reactGridRef.current?.extensionService.getExtensionInstanceByName(ExtensionName.rowDetailView) as SlickRowDetailView;
  }

  const getColumnsDefinition = (): Column[] => {
    return [
      {
        id: 'title',
        name: 'Title',
        field: 'title',
        sortable: true,
        type: FieldType.string,
        width: 70,
        filterable: true,
        editor: { model: Editors.text },
      },
      {
        id: 'duration',
        name: 'Duration (days)',
        field: 'duration',
        formatter: Formatters.decimal,
        params: { minDecimal: 1, maxDecimal: 2 },
        sortable: true,
        type: FieldType.number,
        minWidth: 90,
        filterable: true,
      },
      {
        id: 'percent2',
        name: '% Complete',
        field: 'percentComplete2',
        editor: { model: Editors.slider },
        formatter: Formatters.progressBar,
        type: FieldType.number,
        sortable: true,
        minWidth: 100,
        filterable: true,
        filter: { model: Filters.slider, operator: '>' },
      },
      {
        id: 'start',
        name: 'Start',
        field: 'start',
        formatter: Formatters.dateIso,
        sortable: true,
        type: FieldType.date,
        minWidth: 90,
        exportWithFormatter: true,
        filterable: true,
        filter: { model: Filters.compoundDate },
      },
      {
        id: 'finish',
        name: 'Finish',
        field: 'finish',
        formatter: Formatters.dateIso,
        sortable: true,
        type: FieldType.date,
        minWidth: 90,
        exportWithFormatter: true,
        filterable: true,
        filter: { model: Filters.compoundDate },
      },
      {
        id: 'effort-driven',
        name: 'Effort Driven',
        field: 'effortDriven',
        minWidth: 100,
        formatter: Formatters.checkmarkMaterial,
        type: FieldType.boolean,
        filterable: true,
        sortable: true,
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
  };

  function defineGrid() {
    const columnDefinitions = getColumnsDefinition();
    const gridOptions = getGridOptions();

    setColumnDefinitions(columnDefinitions);
    setGridOptions(gridOptions);
  }

  function showFlashMessage(message: string, alertType = 'info') {
    setMessage(message);
    setFlashAlertType(alertType);
  }

  function simulateServerAsyncCall(item: any) {
    const randomNames = [
      'John Doe',
      'Jane Doe',
      'Chuck Norris',
      'Bumblebee',
      'Jackie Chan',
      'Elvis Presley',
      'Bob Marley',
      'Mohammed Ali',
      'Bruce Lee',
      'Rocky Balboa',
    ];

    return new Promise((resolve) => {
      window.setTimeout(() => {
        const itemDetail = item;
        itemDetail.assignee = randomNames[randomNumber(0, 9)] || '';
        itemDetail.reporter = randomNames[randomNumber(0, 9)] || '';

        resolve(itemDetail);
      }, serverWaitDelayRef.current);
    });
  }

  function getGridOptions(): GridOption {
    return {
      autoResize: {
        container: '#demo-container',
        rightPadding: 10,
      },
      enableFiltering: true,
      enableRowDetailView: true,
      darkMode,
      datasetIdPropertyName: 'rowId',
      preRegisterExternalExtensions: (pubSubService) => {
        const rowDetail = new SlickRowDetailView(pubSubService as EventPubSubService);
        return [{ name: ExtensionName.rowDetailView, instance: rowDetail }];
      },
      rowDetailView: {
        process: (item) => simulateServerAsyncCall(item),
        loadOnce: true,
        singleRowExpand: false,
        useRowClick: true,
        panelRows: detailViewRowCount,
        preloadComponent: Example19Preload,
        viewComponent: Example19DetailView,
        parent: {
          showFlashMessage,
        },
        onBeforeRowDetailToggle: (e, args) => {
          console.log('before toggling row detail', args.item);
          return true;
        },
      },
      rowSelectionOptions: {
        selectActiveRow: true,
      },
    };
  }

  function loadData() {
    const tmpData: any[] = [];
    for (let i = 0; i < NB_ITEMS; i++) {
      const randomYear = 2000 + Math.floor(Math.random() * 10);
      const randomMonth = Math.floor(Math.random() * 11);
      const randomDay = Math.floor(Math.random() * 29);
      const randomPercent = Math.round(Math.random() * 100);

      tmpData[i] = {
        rowId: i,
        title: 'Task ' + i,
        duration: i % 33 === 0 ? null : Math.random() * 100 + '',
        percentComplete: randomPercent,
        percentComplete2: randomPercent,
        percentCompleteNumber: randomPercent,
        start: new Date(randomYear, randomMonth, randomDay),
        finish: new Date(randomYear, randomMonth + 1, randomDay),
        effortDriven: i % 5 === 0,
      };
    }

    return tmpData;
  }

  function changeDetailViewRowCount() {
    const options = rowDetailInstance().getOptions();
    if (options && options.panelRows) {
      options.panelRows = detailViewRowCount;
      rowDetailInstance().setOptions(options);
    }
  }

  function changeEditableGrid() {
    rowDetailInstance().collapseAll();
    (rowDetailInstance() as any).addonOptions.useRowClick = false;
    gridOptions!.autoCommitEdit = !gridOptions!.autoCommitEdit;
    reactGridRef.current?.slickGrid.setOptions({
      editable: true,
      autoEdit: true,
      enableCellNavigation: true,
    });
    return true;
  }

  function closeAllRowDetail() {
    rowDetailInstance().collapseAll();
  }

  const detailViewRowCountChanged = (val: number | string) => {
    setDetailViewRowCount(+val);
  };

  const serverDelayChanged = (e: React.FormEvent<HTMLInputElement>) => {
    const newDelay = +((e.target as HTMLInputElement)?.value ?? '');
    setServerWaitDelay(newDelay);
    serverWaitDelayRef.current = newDelay;
  };

  function toggleDarkMode() {
    closeAllRowDetail();
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

  function toggleSubTitle() {
    const newHideSubTitle = !hideSubTitle;
    setHideSubTitle(newHideSubTitle);
    const action = newHideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    reactGridRef.current?.resizerService.resizeGrid(0);
  }

  return !gridOptions ? null : (
    <div className="demo19">
      <div id="demo-container" className="container-fluid">
        <h2>
          Example 19: Row Detail View
          <span className="float-end font18">
            see&nbsp;
            <a
              target="_blank"
              href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example19.tsx"
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
          <button className="btn btn-outline-secondary btn-sm btn-icon ms-2" onClick={toggleDarkMode} data-test="toggle-dark-mode">
            <i className="mdi mdi-theme-light-dark"></i>
            <span>Toggle Dark Mode</span>
          </button>
        </h2>

        <div className="subtitle">
          Add functionality to show extra information with a Row Detail View, (
          <a href="https://ghiscoding.gitbook.io/slickgrid-react/grid-functionalities/row-detail" target="_blank">
            Wiki docs
          </a>
          )
          <ul>
            <li>
              Click on the row "+" icon or anywhere on the row to open it (the latter can be changed via property "useRowClick: false")
            </li>
            <li>Pass a View/Model as a Template to the Row Detail</li>
            <li>
              You can use "expandableOverride()" callback to override logic to display expand icon on every row (for example only show it
              every 2nd row)
            </li>
          </ul>
        </div>

        <div className="row">
          <div className="col-sm-6">
            <button className="btn btn-outline-secondary btn-sm btn-icon mx-1" onClick={changeEditableGrid} data-test="editable-grid-btn">
              Make Grid Editable
            </button>
            <button className="btn btn-outline-secondary btn-sm btn-icon" onClick={closeAllRowDetail} data-test="collapse-all-btn">
              Close all Row Details
            </button>
            &nbsp;&nbsp;
            <span className="d-inline-flex gap-4px">
              <label htmlFor="detailViewRowCount">Detail View Rows Shown: </label>
              <input
                id="detailViewRowCount"
                type="number"
                value={detailViewRowCount}
                style={{ height: '26px', width: '40px' }}
                onInput={($event) => detailViewRowCountChanged(($event.target as HTMLInputElement).value)}
              />
              <button
                className="btn btn-outline-secondary btn-xs btn-icon"
                style={{ height: '26px' }}
                onClick={changeDetailViewRowCount}
                data-test="set-count-btn"
              >
                Set
              </button>
              <label htmlFor="serverdelay" className="ms-2">
                Server Delay:{' '}
              </label>
              <input
                id="serverdelay"
                type="number"
                defaultValue={serverWaitDelay}
                data-test="server-delay"
                style={{ width: '55px' }}
                onInput={serverDelayChanged}
                title="input a fake timer delay to simulate slow server response"
              />
            </span>
          </div>
          {message ? (
            <div className={'alert alert-' + flashAlertType + ' col-sm-6'} data-test="flash-msg">
              {message}
            </div>
          ) : (
            ''
          )}
        </div>

        <hr />

        <SlickgridReact
          gridId="grid19"
          columns={columnDefinitions}
          options={gridOptions}
          dataset={dataset}
          onReactGridCreated={($event) => (reactGridRef.current = $event.detail)}
        />
      </div>
    </div>
  );
};

function randomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export default Example19;
