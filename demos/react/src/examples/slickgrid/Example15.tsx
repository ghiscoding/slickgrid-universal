import { format as tempoFormat } from '@formkit/tempo';
import i18next from 'i18next';
import React, { useEffect, useRef, useState } from 'react';
import { withTranslation } from 'react-i18next';

import {
  type Column,
  Filters,
  Formatters,
  type GridOption,
  type GridState,
  type GridStateChange,
  type MultipleSelectOption,
  SlickgridReact,
  type SlickgridReactInstance,
} from 'slickgrid-react';

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}
const DEFAULT_PAGE_SIZE = 25;
const LOCAL_STORAGE_KEY = 'gridState';
const NB_ITEMS = 500;

const Example15: React.FC = () => {
  const defaultLang = 'en';
  const [columnDefinitions, setColumnDefinitions] = useState<Column[]>([]);
  const [dataset] = useState<any[]>(getData(NB_ITEMS));
  const [gridOptions, setGridOptions] = useState<GridOption | undefined>(undefined);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(defaultLang);
  const [hideSubTitle, setHideSubTitle] = useState(false);

  const reactGridRef = useRef<SlickgridReactInstance | null>(null);

  useEffect(() => {
    i18next.changeLanguage(defaultLang);
    const presets = JSON.parse(localStorage[LOCAL_STORAGE_KEY] || null);

    // use some Grid State preset defaults if you wish or just restore from Locale Storage
    // presets = presets || useDefaultPresets();
    defineGrid(presets);

    // save grid state before unmounting
    return () => {
      saveCurrentGridState();
    };
  }, []);

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  /** Clear the Grid State from Local Storage and reset the grid to it's original state */
  function clearGridStateFromLocalStorage() {
    // reactGridRef.current?.slickGrid.setColumns(reactGridRef.current?.gridService.getAllColumnDefinitions());
    // reactGridRef.current?.slickGrid.autosizeColumns();
    reactGridRef.current?.gridService.resetGrid(getColumnDefinitions());
    reactGridRef.current?.paginationService!.changeItemPerPage(DEFAULT_PAGE_SIZE);
    window.setTimeout(() => (localStorage[LOCAL_STORAGE_KEY] = null));
  }

  /* Define grid Options and Columns */
  function defineGrid(gridStatePresets?: GridState) {
    const gridOptions: GridOption = {
      autoResize: {
        container: '#demo-container',
        rightPadding: 10,
      },
      enableCheckboxSelector: true,
      enableFiltering: true,
      enableTranslate: true,
      i18n: i18next,
      columnPicker: {
        hideForceFitButton: true,
      },
      gridMenu: {
        hideForceFitButton: true,
        hideClearFrozenColumnsCommand: false,
      },
      headerMenu: {
        hideFreezeColumnsCommand: false,
      },
      enablePagination: true,
      pagination: {
        pageSizes: [5, 10, 15, 20, 25, 30, 40, 50, 75, 100],
        pageSize: DEFAULT_PAGE_SIZE,
      },
    };

    // reload the Grid State with the grid options presets
    // but make sure the colums array is part of the Grid State before using them as presets
    if (gridStatePresets) {
      gridOptions.presets = gridStatePresets;
    }

    const columnDefinitions = getColumnDefinitions();
    setColumnDefinitions(columnDefinitions);
    setGridOptions(gridOptions);
  }

  function getColumnDefinitions(): Column[] {
    // prepare a multiple-select array to filter with
    const multiSelectFilterArray: any[] = [];
    for (let i = 0; i < NB_ITEMS; i++) {
      multiSelectFilterArray.push({ value: i, label: i });
    }

    return [
      {
        id: 'title',
        name: 'Title',
        field: 'title',
        nameKey: 'TITLE',
        filterable: true,
        sortable: true,
        minWidth: 45,
        width: 100,
        filter: {
          model: Filters.compoundInput,
        },
      },
      {
        id: 'description',
        name: 'Description',
        field: 'description',
        filterable: true,
        sortable: true,
        minWidth: 80,
        width: 100,
        filter: {
          model: Filters.input,
          filterShortcuts: [
            { titleKey: 'BLANK_VALUES', searchTerms: ['< A'], iconCssClass: 'mdi mdi-filter-minus-outline' },
            { titleKey: 'NON_BLANK_VALUES', searchTerms: ['> A'], iconCssClass: 'mdi mdi-filter-plus-outline' },
          ],
        },
      },
      {
        id: 'duration',
        name: 'Duration (days)',
        field: 'duration',
        sortable: true,
        type: 'number',
        exportCsvForceToKeepAsString: true,
        minWidth: 55,
        width: 100,
        nameKey: 'DURATION',
        filterable: true,
        filter: {
          collection: multiSelectFilterArray,
          model: Filters.multipleSelect,
          // we could add certain option(s) to the "multiple-select" plugin
          filterOptions: {
            maxHeight: 250,
            width: 175,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'complete',
        name: '% Complete',
        field: 'percentComplete',
        nameKey: 'PERCENT_COMPLETE',
        minWidth: 70,
        type: 'number',
        sortable: true,
        width: 100,
        formatter: Formatters.percentCompleteBar,
        filterable: true,
        filter: { model: Filters.slider, operator: '>' },
      },
      {
        id: 'start',
        name: 'Start',
        field: 'start',
        nameKey: 'START',
        formatter: Formatters.dateIso,
        sortable: true,
        minWidth: 75,
        exportWithFormatter: true,
        width: 100,
        type: 'date',
        filterable: true,
        filter: {
          model: Filters.compoundDate,
          filterShortcuts: [
            { titleKey: 'PAST', searchTerms: [tempoFormat(new Date(), 'YYYY-MM-DD')], operator: '<', iconCssClass: 'mdi mdi-calendar' },
            {
              titleKey: 'FUTURE',
              searchTerms: [tempoFormat(new Date(), 'YYYY-MM-DD')],
              operator: '>',
              iconCssClass: 'mdi mdi-calendar-clock',
            },
          ],
        },
      },
      {
        id: 'completed',
        field: 'completed',
        nameKey: 'COMPLETED',
        minWidth: 85,
        maxWidth: 85,
        formatter: Formatters.checkmarkMaterial,
        width: 100,
        type: 'boolean',
        sortable: true,
        filterable: true,
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
  }

  function getData(count: number) {
    // mock a dataset
    const currentYear = new Date().getFullYear();
    const tmpData: any[] = [];
    for (let i = 0; i < count; i++) {
      const randomDuration = Math.round(Math.random() * 100);
      const randomYear = randomBetween(currentYear - 15, currentYear + 8);
      const randomYearShort = randomBetween(10, 25);
      const randomMonth = randomBetween(1, 12);
      const randomMonthStr = randomMonth < 10 ? `0${randomMonth}` : randomMonth;
      const randomDay = randomBetween(10, 28);
      const randomPercent = randomBetween(0, 100);
      const randomHour = randomBetween(10, 23);
      const randomTime = randomBetween(10, 59);

      tmpData[i] = {
        id: i,
        title: 'Task ' + i,
        description: i % 5 ? 'desc ' + i : null, // also add some random to test NULL field
        duration: randomDuration,
        percentComplete: randomPercent,
        percentCompleteNumber: randomPercent,
        start: new Date(randomYear, randomMonth, randomDay), // provide a Date format
        usDateShort: `${randomMonth}/${randomDay}/${randomYearShort}`, // provide a date US Short in the dataset
        utcDate: `${randomYear}-${randomMonthStr}-${randomDay}T${randomHour}:${randomTime}:${randomTime}Z`,
        completed: i % 3 === 0,
      };
    }
    return tmpData;
  }

  /** Dispatched event of a Grid State Changed event (which contain a "change" and the "gridState") */
  function gridStateChanged(gridStateChanges: GridStateChange) {
    console.log('Client sample, Grid State changed:: ', gridStateChanges);
    localStorage[LOCAL_STORAGE_KEY] = JSON.stringify(gridStateChanges.gridState);
  }

  /** Save Grid State in LocaleStorage */
  function saveCurrentGridState() {
    const gridState = reactGridRef.current?.gridStateService.getCurrentGridState() as GridState;
    console.log('Client sample, current Grid State:: ', gridState);
    localStorage[LOCAL_STORAGE_KEY] = JSON.stringify(gridState);
  }

  async function switchLanguage() {
    const nextLanguage = selectedLanguage === 'en' ? 'fr' : 'en';
    await i18next.changeLanguage(nextLanguage);
    setSelectedLanguage(nextLanguage);
  }

  /*
  function useDefaultPresets() {
    // use columnDef searchTerms OR use presets as shown below
    return {
      columns: [
        { columnId: 'description', width: 170 }, // flip column position of Title/Description to Description/Title
        { columnId: 'title', width: 55 },
        { columnId: 'duration' },
        { columnId: 'complete' },
        { columnId: 'start' },
        { columnId: 'usDateShort' },
        { columnId: 'utcDate' },
        // { columnId: 'effort-driven' }, // to HIDE a column, simply ommit it from the preset array
      ],
      filters: [
        { columnId: 'duration', searchTerms: [2, 22, 44] },
        // { columnId: 'complete', searchTerms: ['5'], operator: '>' },
        { columnId: 'usDateShort', operator: '<', searchTerms: ['4/20/25'] },
        // { columnId: 'effort-driven', searchTerms: [true] }
      ],
      sorters: [
        { columnId: 'duration', direction: 'DESC' },
        { columnId: 'complete', direction: 'ASC' }
      ],
    } as GridState;
  }
  */

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
        Example 15: Grid State & Presets using Local Storage
        <span className="float-end font18">
          see&nbsp;
          <a
            target="_blank"
            href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example15.tsx"
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
        Grid State & Preset (
        <a href="https://ghiscoding.gitbook.io/slickgrid-react/grid-functionalities/grid-state-preset" target="_blank">
          Docs
        </a>
        )
        <br />
        <ul className="small">
          <li>Uses Local Storage to persist the Grid State and uses Grid Options "presets" to put the grid back to it's previous state</li>
          <ul>
            <li>
              to demo this, simply change any columns (position reorder, visibility, size, filter, sort), then refresh your browser with
              (F5)
            </li>
          </ul>
          <li>
            Local Storage is just one option, you can use whichever is more convenient for you (Local Storage, Session Storage, DB, ...)
          </li>
        </ul>
      </div>

      <button
        className="btn btn-outline-secondary btn-sm btn-icon"
        data-test="reset-button"
        onClick={() => clearGridStateFromLocalStorage()}
      >
        <i className="mdi mdi-close me-1"></i>
        Clear Grid State from Local Storage &amp; Reset Grid
      </button>

      <button className="btn btn-outline-secondary btn-sm btn-icon mx-1" data-test="language-button" onClick={() => switchLanguage()}>
        <i className="mdi mdi-translate me-1"></i>
        Switch Language
      </button>
      <strong>Locale: </strong>
      <span style={{ fontStyle: 'italic' }} data-test="selected-locale">
        {selectedLanguage + '.json'}
      </span>

      <SlickgridReact
        gridId="grid15"
        columns={columnDefinitions}
        options={gridOptions}
        dataset={dataset}
        onReactGridCreated={($event) => reactGridReady($event.detail)}
        onGridStateChanged={($event) => gridStateChanged($event.detail)}
      />
    </div>
  );
};

export default withTranslation()(Example15);
