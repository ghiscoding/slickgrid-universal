import { addDay, format } from '@formkit/tempo';
import { SlickCustomTooltip } from '@slickgrid-universal/custom-tooltip-plugin';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import i18next from 'i18next';

import { CustomInputFilter } from './custom-inputFilter.js';
import {
  type Column,
  type CurrentFilter,
  Filters,
  type Formatter,
  Formatters,
  type GridOption,
  type GridStateChange,
  type Metrics,
  type MultipleSelectOption,
  OperatorType,
  type SliderRangeOption,
  SlickgridReact,
  type SlickgridReactInstance,
} from 'slickgrid-react';
import React, { useEffect, useRef, useState } from 'react';
import { withTranslation } from 'react-i18next';

const NB_ITEMS = 1500;

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// create a custom translate Formatter (typically you would move that a separate file, for separation of concerns)
const taskTranslateFormatter: Formatter = (_row, _cell, value, _columnDef, _dataContext, gridOptions) => {
  return gridOptions.i18n?.t('TASK_X', { x: value }) ?? '';
};

const Example23: React.FC = () => {
  const defaultLang = 'en';
  const [columnDefinitions, setColumnDefinitions] = useState<Column[]>([]);
  const [dataset] = useState<any[]>(getData(NB_ITEMS));
  const [gridOptions, setGridOptions] = useState<GridOption | undefined>(undefined);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(defaultLang);
  const reactGridRef = useRef<SlickgridReactInstance | null>(null);
  const [filterList] = useState<{ value: string; label: string }[]>([
    { value: '', label: '...' },
    { value: 'currentYearTasks', label: 'Current Year Completed Tasks' },
    { value: 'nextYearTasks', label: 'Next Year Active Tasks' },
  ]);
  const [metrics, setMetrics] = useState<Metrics>();
  const [hideSubTitle, setHideSubTitle] = useState(false);

  useEffect(() => {
    i18next.changeLanguage(defaultLang);
    defineGrid();

    // save grid state before unmounting
    return () => {
      saveCurrentGridState();
    };
  }, []);

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  /* Define grid Options and Columns */
  function defineGrid() {
    const columnDefinitions: Column[] = [
      {
        id: 'title',
        name: 'Title',
        field: 'id',
        nameKey: 'TITLE',
        minWidth: 100,
        formatter: taskTranslateFormatter,
        sortable: true,
        filterable: true,
        params: { useFormatterOuputToFilter: true },
      },
      {
        id: 'description',
        name: 'Description',
        field: 'description',
        filterable: true,
        sortable: true,
        minWidth: 80,
        filter: {
          model: CustomInputFilter, // create a new instance to make each Filter independent from each other
          enableTrimWhiteSpace: true, // or use global "enableFilterTrimWhiteSpace" to trim on all Filters
        },
      },
      {
        id: 'percentComplete',
        name: '% Complete',
        field: 'percentComplete',
        nameKey: 'PERCENT_COMPLETE',
        minWidth: 120,
        sortable: true,
        customTooltip: { position: 'center' },
        formatter: Formatters.progressBar,
        type: 'number',
        filterable: true,
        filter: {
          model: Filters.sliderRange,
          maxValue: 100, // or you can use the options as well
          operator: OperatorType.rangeInclusive, // defaults to inclusive
          options: {
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
        nameKey: 'START',
        formatter: Formatters.dateIso,
        sortable: true,
        minWidth: 75,
        width: 100,
        exportWithFormatter: true,
        type: 'date',
        filterable: true,
        filter: { model: Filters.compoundDate },
      },
      {
        id: 'finish',
        name: 'Finish',
        field: 'finish',
        nameKey: 'FINISH',
        formatter: Formatters.dateIso,
        sortable: true,
        minWidth: 75,
        width: 120,
        exportWithFormatter: true,
        type: 'date',
        filterable: true,
        filter: {
          model: Filters.dateRange,
        },
      },
      {
        id: 'duration',
        field: 'duration',
        nameKey: 'DURATION',
        maxWidth: 90,
        type: 'number',
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
        nameKey: 'COMPLETED',
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
          options: { autoAdjustDropHeight: true } as MultipleSelectOption,
        },
      },
    ];

    const presetLowestDay = format(addDay(new Date(), -2), 'YYYY-MM-DD');
    const presetHighestDay = format(addDay(new Date(), 25), 'YYYY-MM-DD');

    const gridOptions: GridOption = {
      autoResize: {
        container: '#demo-container',
        rightPadding: 10,
      },
      enableExcelCopyBuffer: true,
      enableFiltering: true,
      // enableFilterTrimWhiteSpace: true,
      enableTranslate: true,
      i18n: i18next,

      // use columnDef searchTerms OR use presets as shown below
      presets: {
        filters: [
          //  you can use the 2 dots separator on all Filters which support ranges
          { columnId: 'duration', searchTerms: ['4..88'] },
          // { columnId: 'percentComplete', searchTerms: ['5..80'] }, // without operator will default to 'RangeExclusive'
          // { columnId: 'finish', operator: 'RangeInclusive', searchTerms: [`${presetLowestDay}..${presetHighestDay}`] },

          // or you could also use 2 searchTerms values, instead of using the 2 dots (only works with SliderRange & DateRange Filters)
          // BUT make sure to provide the operator, else the filter service won't know that this is really a range
          { columnId: 'percentComplete', operator: 'RangeInclusive', searchTerms: [5, 80] }, // same result with searchTerms: ['5..80']
          { columnId: 'finish', operator: 'RangeInclusive', searchTerms: [presetLowestDay, presetHighestDay] },
        ],
        sorters: [
          { columnId: 'percentComplete', direction: 'DESC' },
          { columnId: 'duration', direction: 'ASC' },
        ],
      },
      externalResources: [new SlickCustomTooltip(), new ExcelExportService()],
    };

    setColumnDefinitions(columnDefinitions);
    setGridOptions(gridOptions);
  }

  function getData(itemCount: number, startingIndex = 0): any[] {
    // mock a dataset
    const tempDataset: any[] = [];
    for (let i = startingIndex; i < startingIndex + itemCount; i++) {
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

  // function clearFilters() {
  //   setSelectedPredefinedFilter('')
  //   //  () => reactGrid.filterService.clearFilters());
  // }

  /** Dispatched event of a Grid State Changed event */
  function gridStateChanged(gridState: GridStateChange) {
    console.log('Client sample, Grid State changed:: ', gridState);
  }

  /** Save current Filters, Sorters in LocaleStorage or DB */
  function saveCurrentGridState() {
    console.log('Client sample, current Grid State:: ', reactGridRef.current?.gridStateService.getCurrentGridState());
  }

  function refreshMetrics(_e: Event, args: any) {
    if (args?.current >= 0) {
      setTimeout(() => {
        setMetrics({
          startTime: new Date(),
          itemCount: args?.current ?? 0,
          totalItemCount: dataset?.length || 0,
        });
      });
    }
  }

  // function selectedColumnChanged(e: React.ChangeEvent<HTMLSelectElement>) {
  //   const selectedVal = (e.target as HTMLSelectElement)?.value ?? '';
  //   const selectedColumn = columnDefinitions.find(c => c.id === selectedVal);

  //   setSelectedColumn(selectedColumn);
  // }

  function setFiltersDynamically() {
    const presetLowestDay = format(addDay(new Date(), -5), 'YYYY-MM-DD');
    const presetHighestDay = format(addDay(new Date(), 25), 'YYYY-MM-DD');

    // we can Set Filters Dynamically (or different filters) afterward through the FilterService
    reactGridRef.current?.filterService.updateFilters([
      { columnId: 'duration', searchTerms: ['14..78'], operator: 'RangeInclusive' },
      { columnId: 'percentComplete', operator: 'RangeExclusive', searchTerms: [15, 85] },
      { columnId: 'finish', operator: 'RangeInclusive', searchTerms: [presetLowestDay, presetHighestDay] },
    ]);
  }

  function setSortingDynamically() {
    reactGridRef.current?.sortService.updateSorting([
      // orders matter, whichever is first in array will be the first sorted column
      { columnId: 'finish', direction: 'DESC' },
      { columnId: 'percentComplete', direction: 'ASC' },
    ]);
  }

  async function switchLanguage() {
    const nextLanguage = selectedLanguage === 'en' ? 'fr' : 'en';
    await i18next.changeLanguage(nextLanguage);
    setSelectedLanguage(nextLanguage);
  }

  function predefinedFilterChanged(e: React.ChangeEvent<HTMLSelectElement>) {
    const newPredefinedFilter = (e.target as HTMLSelectElement)?.value ?? '';
    let filters: CurrentFilter[] = [];
    const currentYear = new Date().getFullYear();

    switch (newPredefinedFilter) {
      case 'currentYearTasks':
        filters = [
          { columnId: 'finish', operator: OperatorType.rangeInclusive, searchTerms: [`${currentYear}-01-01`, `${currentYear}-12-31`] },
          { columnId: 'completed', operator: OperatorType.equal, searchTerms: [true] },
        ];
        break;
      case 'nextYearTasks':
        filters = [{ columnId: 'start', operator: '>=', searchTerms: [`${currentYear + 1}-01-01`] }];
        break;
    }
    reactGridRef.current?.filterService.updateFilters(filters);
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
        Example 23: Filtering from Range of Search Values
        <span className="float-end font18">
          see&nbsp;
          <a
            target="_blank"
            href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example23.tsx"
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
        This demo shows how to use Filters with Range of Search Values (
        <a href="https://ghiscoding.gitbook.io/slickgrid-react/column-functionalities/filters/range-filters" target="_blank">
          Docs
        </a>
        )
        <br />
        <ul className="small">
          <li>
            All input filters support the following operators: (&gt;, &gt;=, &lt;, &lt;=, &lt;&gt;, !=, =, ==, *) and now also the (..) for
            an input range
          </li>
          <li>
            All filters (which support ranges) can be defined via the 2 dots (..) which represents a range, this also works for dates and
            slider in the "presets"
          </li>
          <ul>
            <li>For a numeric range defined in an input filter (must be of type text), you can use 2 dots (..) to represent a range</li>
            <li>example: typing "10..90" will filter values between 10 and 90 (but excluding the number 10 and 90)</li>
          </ul>
        </ul>
      </div>

      <br />

      {metrics && (
        <span>
          <>
            <b>Metrics:</b>
            {metrics.endTime ? format(metrics.endTime, 'YYYY-MM-DD HH:mm:ss') : ''}| {metrics.itemCount} of {metrics.totalItemCount}{' '}
            items{' '}
          </>
        </span>
      )}

      <form className="row row-cols-lg-auto g-1 align-items-center" onSubmit={(e) => e.preventDefault()}>
        <div className="col">
          <button
            className="btn btn-outline-secondary btn-sm btn-icon"
            data-test="clear-filters"
            onClick={() => reactGridRef.current?.filterService.clearFilters()}
          >
            Clear Filters
          </button>
        </div>
        <div className="col">
          <button
            className="btn btn-outline-secondary btn-sm btn-icon"
            data-test="clear-sorting"
            onClick={() => reactGridRef.current?.sortService.clearSorting()}
          >
            Clear Sorting
          </button>
        </div>
        <div className="col">
          <button
            className="btn btn-outline-secondary btn-sm btn-icon"
            data-test="set-dynamic-filter"
            onClick={() => setFiltersDynamically()}
          >
            Set Filters Dynamically
          </button>
        </div>
        <div className="col">
          <button
            className="btn btn-outline-secondary btn-sm btn-icon"
            data-test="set-dynamic-sorting"
            onClick={() => setSortingDynamically()}
          >
            Set Sorting Dynamically
          </button>
        </div>
        <div className="col">
          <label htmlFor="selectedFilter" style={{ marginLeft: '10px' }}>
            Predefined Filters
          </label>
        </div>
        <div className="col">
          <select
            className="form-select"
            data-test="select-dynamic-filter"
            name="selectedFilter"
            onChange={($event) => predefinedFilterChanged($event)}
          >
            {filterList.map((filter) => (
              <option value={filter.value} key={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>
      </form>

      <div className="row mt-2">
        <div className="col">
          <button className="btn btn-outline-secondary btn-sm btn-icon me-1" data-test="language" onClick={() => switchLanguage()}>
            <i className="mdi mdi-translate me-1"></i>
            Switch Language
          </button>
          <b>Locale: </b>{' '}
          <span style={{ fontStyle: 'italic' }} data-test="selected-locale">
            {selectedLanguage + '.json'}
          </span>
        </div>
      </div>

      <SlickgridReact
        gridId="grid23"
        columns={columnDefinitions}
        options={gridOptions}
        dataset={dataset}
        onReactGridCreated={($event) => reactGridReady($event.detail)}
        onGridStateChanged={($event) => gridStateChanged($event.detail)}
        onRowCountChanged={($event) => refreshMetrics($event.detail.eventData, $event.detail.args)}
      />
    </div>
  );
};

export default withTranslation()(Example23);
