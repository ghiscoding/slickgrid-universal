import { addDay, format as tempoFormat } from '@formkit/tempo';
import {
  GraphqlService,
  type GraphqlPaginatedResult,
  type GraphqlServiceApi,
  type GraphqlServiceOption,
} from '@slickgrid-universal/graphql';
import i18next from 'i18next';
import React, { useEffect, useRef, useState } from 'react';
import { withTranslation } from 'react-i18next';
import {
  Filters,
  Formatters,
  SlickgridReact,
  type Column,
  type CursorPageInfo,
  type GridOption,
  type GridStateChange,
  type Metrics,
  type MultipleSelectOption,
  type SlickgridReactInstance,
} from 'slickgrid-react';

interface Status {
  text: string;
  class: string;
}

const defaultPageSize = 20;
const GRAPHQL_QUERY_DATASET_NAME = 'users';
const FAKE_SERVER_DELAY = 250;

const Example6: React.FC = () => {
  const defaultLang = 'en';
  const [gridOptions, setGridOptions] = useState<GridOption | undefined>(undefined);
  const [columnDefinitions, setColumnDefinitions] = useState<Column[]>([]);
  const [dataset] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<Metrics | undefined>(undefined);
  const [processing, setProcessing] = useState<boolean>(false);
  const [graphqlQuery, setGraphqlQuery] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>(defaultLang);
  const [status, setStatus] = useState<Status>({ text: '', class: '' });
  const [isWithCursor, setIsWithCursor] = useState<boolean>(false);
  const [serverWaitDelay] = useState(FAKE_SERVER_DELAY);
  const [hideSubTitle, setHideSubTitle] = useState(false);

  const isWithCursorRef = useRef(isWithCursor);
  const serverWaitDelayRef = useRef(serverWaitDelay);
  const reactGridRef = useRef<SlickgridReactInstance | null>(null);
  const graphqlService = new GraphqlService();

  useEffect(() => {
    i18next.changeLanguage(defaultLang);
    defineGrid();
    return () => {
      // save grid state when unmounting
      saveCurrentGridState();
    };
  }, []);

  useEffect(() => {
    isWithCursorRef.current = isWithCursor;
  }, [isWithCursor]);

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  function getColumnsDefinition(): Column[] {
    return [
      {
        id: 'name',
        field: 'name',
        nameKey: 'NAME',
        width: 60,
        columnGroupKey: 'CUSTOMER_INFORMATION',
        sortable: true,
        filterable: true,
        filter: {
          model: Filters.compoundInput,
          compoundOperatorList: [
            { operator: '', desc: 'Contains' },
            { operator: '<>', desc: 'Not Contains' },
            { operator: '=', desc: 'Equals' },
            { operator: '!=', desc: 'Not equal to' },
            { operator: 'a*', desc: 'Starts With' },
            { operator: 'Custom', desc: 'SQL Like' },
          ],
        },
      },
      {
        id: 'gender',
        field: 'gender',
        nameKey: 'GENDER',
        filterable: true,
        sortable: true,
        width: 60,
        columnGroupKey: 'CUSTOMER_INFORMATION',
        filter: {
          model: Filters.singleSelect,
          collection: [
            { value: '', label: '' },
            { value: 'male', label: 'male', labelKey: 'MALE' },
            { value: 'female', label: 'female', labelKey: 'FEMALE' },
          ],
        },
      },
      {
        id: 'company',
        field: 'company',
        nameKey: 'COMPANY',
        width: 60,
        columnGroupKey: 'CUSTOMER_INFORMATION',
        sortable: true,
        filterable: true,
        filter: {
          model: Filters.multipleSelect,
          collection: [
            { value: 'acme', label: 'Acme' },
            { value: 'abc', label: 'Company ABC' },
            { value: 'xyz', label: 'Company XYZ' },
          ],
          options: {
            filter: true, // adds a filter on top of the multi-select dropdown
          } as MultipleSelectOption,
        },
      },
      {
        id: 'billingAddressStreet',
        field: 'billing.address.street',
        nameKey: 'BILLING.ADDRESS.STREET',
        width: 60,
        filterable: true,
        sortable: true,
        columnGroupKey: 'BILLING.INFORMATION',
      },
      {
        id: 'billingAddressZip',
        field: 'billing.address.zip',
        nameKey: 'BILLING.ADDRESS.ZIP',
        width: 60,
        type: 'number',
        columnGroupKey: 'BILLING.INFORMATION',
        filterable: true,
        sortable: true,
        filter: {
          model: Filters.compoundInput,
        },
        formatter: Formatters.multiple,
        params: { formatters: [Formatters.complexObject, Formatters.translate] },
      },
      {
        id: 'finish',
        field: 'finish',
        name: 'Date',
        formatter: Formatters.dateIso,
        sortable: true,
        minWidth: 90,
        width: 120,
        exportWithFormatter: true,
        columnGroupKey: 'BILLING.INFORMATION',
        type: 'date',
        filterable: true,
        filter: {
          model: Filters.dateRange,
          filterShortcuts: [
            {
              titleKey: 'NEXT_20_DAYS',
              iconCssClass: 'mdi mdi-calendar',
              searchTerms: [tempoFormat(new Date(), 'YYYY-MM-DD'), tempoFormat(addDay(new Date(), 20), 'YYYY-MM-DD')],
            },
          ],
        },
      },
    ];
  }

  function defineGrid() {
    const columnDefinitions = getColumnsDefinition();
    const gridOptions = getGridOptions();

    setColumnDefinitions(columnDefinitions);
    setGridOptions(gridOptions);
  }

  function getGridOptions(): GridOption {
    const currentYear = new Date().getFullYear();
    const presetLowestDay = `${currentYear}-01-01`;
    const presetHighestDay = `${currentYear}-02-15`;

    return {
      enableFiltering: true,
      enableCellNavigation: true,
      enableTranslate: true,
      createPreHeaderPanel: true,
      showPreHeaderPanel: true,
      preHeaderPanelHeight: 28,
      i18n: i18next,
      gridHeight: 200,
      gridWidth: 900,
      compoundOperatorAltTexts: {
        text: { Custom: { operatorAlt: '%%', descAlt: 'SQL Like' } },
      },
      gridMenu: {
        resizeOnShowHeaderRow: true,
      },
      enablePagination: true,
      pagination: {
        pageSizes: [10, 15, 20, 25, 30, 40, 50, 75, 100],
        pageSize: defaultPageSize,
        totalItems: 0,
      },
      presets: {
        columns: [
          { columnId: 'name', width: 100 },
          { columnId: 'gender', width: 55 },
          { columnId: 'company' },
          { columnId: 'billingAddressZip' },
          { columnId: 'billingAddressStreet', width: 120 },
          { columnId: 'finish', width: 130 },
        ],
        filters: [
          { columnId: 'gender', searchTerms: ['male'], operator: '=' },
          { columnId: 'name', searchTerms: ['Joh*oe'], operator: 'StartsWithEndsWith' },
          { columnId: 'company', searchTerms: ['xyz'], operator: 'IN' },
          { columnId: 'finish', searchTerms: [presetLowestDay, presetHighestDay], operator: 'RangeInclusive' },
        ],
        sorters: [
          { columnId: 'name', direction: 'asc' },
          { columnId: 'company', direction: 'DESC' },
        ],
        pagination: { pageNumber: isWithCursorRef.current ? 1 : 2, pageSize: 20 },
      },
      backendServiceApi: {
        service: graphqlService,
        options: {
          datasetName: GRAPHQL_QUERY_DATASET_NAME,
          addLocaleIntoQuery: true,
          extraQueryArguments: [{ field: 'userId', value: 123 }],
          filterQueryOverride: ({ fieldName, columnDef, columnFilterOperator, searchValues }) => {
            if (columnFilterOperator === 'Custom' && columnDef?.id === 'name') {
              return { field: fieldName, operator: 'Like', value: searchValues[0] };
            }
            return;
          },
          useCursor: isWithCursorRef.current,
          keepArgumentFieldDoubleQuotes: true,
        },
        preProcess: () => displaySpinner(true),
        process: (query) => getCustomerApiCall(query),
        postProcess: (result: GraphqlPaginatedResult) => {
          const metrics = result.metrics as Metrics;
          setMetrics(metrics);
          displaySpinner(false);
        },
      } as GraphqlServiceApi,
    };
  }

  function clearAllFiltersAndSorts() {
    if (reactGridRef.current?.gridService) {
      reactGridRef.current.gridService.clearAllFiltersAndSorts();
    }
  }

  function displaySpinner(isProcessing: boolean) {
    const newStatus = isProcessing
      ? { text: 'processing...', class: 'alert alert-danger' }
      : { text: 'finished', class: 'alert alert-success' };

    setStatus(newStatus);
    setProcessing(isProcessing);
  }

  function getCustomerApiCall(_query: string): Promise<GraphqlPaginatedResult> {
    let pageInfo: CursorPageInfo;
    if (reactGridRef.current?.paginationService) {
      const { paginationService } = reactGridRef.current;
      const pageNumber = (paginationService as any)._initialized ? paginationService.getCurrentPageNumber() : 1;
      const startCursor = String.fromCharCode('A'.charCodeAt(0) + pageNumber - 1);
      const endCursor = String.fromCharCode(startCursor.charCodeAt(0) + 1);
      pageInfo = {
        hasPreviousPage: paginationService.dataFrom === 0,
        hasNextPage: paginationService.dataTo === 100,
        startCursor,
        endCursor,
      };
    } else {
      pageInfo = {
        hasPreviousPage: false,
        hasNextPage: true,
        startCursor: 'A',
        endCursor: 'B',
      };
    }

    const mockedResult = {
      data: {
        [GRAPHQL_QUERY_DATASET_NAME]: {
          nodes: [],
          totalCount: 100,
          pageInfo,
        },
      },
    };

    return new Promise((resolve) => {
      setTimeout(() => {
        setGraphqlQuery(graphqlService.buildQuery());
        if (isWithCursorRef.current) {
          reactGridRef.current?.paginationService?.setCursorPageInfo(mockedResult.data[GRAPHQL_QUERY_DATASET_NAME].pageInfo);
        }
        resolve(mockedResult);
      }, serverWaitDelayRef.current);
    });
  }

  function goToFirstPage() {
    reactGridRef.current?.paginationService!.goToFirstPage();
  }

  function goToLastPage() {
    reactGridRef.current?.paginationService!.goToLastPage();
  }

  function gridStateChanged(gridStateChanges: GridStateChange) {
    console.log('GraphQL sample, Grid State changed:: ', gridStateChanges);
  }

  function saveCurrentGridState() {
    console.log('GraphQL current grid state', reactGridRef.current?.gridStateService.getCurrentGridState());
  }

  function setFiltersDynamically() {
    const currentYear = new Date().getFullYear();
    const presetLowestDay = `${currentYear}-01-01`;
    const presetHighestDay = `${currentYear}-02-15`;

    reactGridRef.current?.filterService.updateFilters([
      { columnId: 'gender', searchTerms: ['female'], operator: '=' },
      { columnId: 'name', searchTerms: ['Jane'], operator: 'StartsWith' },
      { columnId: 'company', searchTerms: ['acme'], operator: 'IN' },
      { columnId: 'billingAddressZip', searchTerms: ['11'], operator: '>=' },
      { columnId: 'finish', searchTerms: [presetLowestDay, presetHighestDay], operator: 'RangeInclusive' },
    ]);
  }

  function setSortingDynamically() {
    reactGridRef.current?.sortService.updateSorting([
      { columnId: 'billingAddressZip', direction: 'DESC' },
      { columnId: 'company', direction: 'ASC' },
    ]);
  }

  function resetToOriginalPresets() {
    const currentYear = new Date().getFullYear();
    const presetLowestDay = `${currentYear}-01-01`;
    const presetHighestDay = `${currentYear}-02-15`;

    reactGridRef.current?.filterService.updateFilters([
      { columnId: 'gender', searchTerms: ['male'], operator: '=' },
      { columnId: 'name', searchTerms: ['Joh*oe'], operator: 'StartsWithEndsWith' },
      { columnId: 'company', searchTerms: ['xyz'], operator: 'IN' },
      { columnId: 'finish', searchTerms: [presetLowestDay, presetHighestDay], operator: 'RangeInclusive' },
    ]);
    reactGridRef.current?.sortService.updateSorting([
      { columnId: 'name', direction: 'asc' },
      { columnId: 'company', direction: 'DESC' },
    ]);
    setTimeout(() => {
      reactGridRef.current?.paginationService?.changeItemPerPage(20);
      reactGridRef.current?.paginationService?.goToPageNumber(2);
    });
  }

  function serverDelayChanged(e: React.FormEvent<HTMLInputElement>) {
    const newDelay = +((e.target as HTMLInputElement)?.value ?? '');
    serverWaitDelayRef.current = newDelay;
  }

  function changeIsWithCursor(newValue: boolean) {
    setIsWithCursor(newValue);
    resetOptions({ useCursor: newValue });
    return true;
  }

  function resetOptions(options: Partial<GraphqlServiceOption>) {
    displaySpinner(true);
    const graphqlService = gridOptions!.backendServiceApi!.service as GraphqlService;
    reactGridRef.current?.paginationService!.setCursorBased(options.useCursor as boolean);
    reactGridRef.current?.paginationService?.goToFirstPage();
    graphqlService.updateOptions(options);
    setGridOptions({ ...gridOptions });
  }

  async function switchLanguage() {
    const nextLanguage = selectedLanguage === 'en' ? 'fr' : 'en';
    await i18next.changeLanguage(nextLanguage);
    setSelectedLanguage(nextLanguage);
  }

  function toggleSubTitle() {
    const newHideSubTitle = !hideSubTitle;
    setHideSubTitle(newHideSubTitle);
    const action = newHideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    reactGridRef.current?.resizerService.resizeGrid(0);
  }

  return !gridOptions ? null : (
    <div id="demo-container" className="container-fluid">
      <h2>
        Example 6: Grid with Backend GraphQL Service
        <span className="float-end font18">
          see&nbsp;
          <a
            target="_blank"
            href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example6.tsx"
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
        Use it when you need to support Pagination with a GraphQL endpoint (for simple JSON, use a regular grid).
        <br />
        Take a look at the (
        <a href="https://ghiscoding.gitbook.io/slickgrid-react/backend-services/graphql" target="_blank">
          Docs
        </a>
        )
        <ul className="small">
          <li>
            <span className="red bold">(*) NO DATA SHOWN</span> - just change filters &amp; page and look at the "GraphQL Query" changing
          </li>
          <li>Only "Name" field is sortable for the demo (because we use JSON files), however "multiColumnSort: true" is also supported</li>
          <li>String column also support operator (&gt;, &gt;=, &lt;, &lt;=, &lt;&gt;, !=, =, ==, *)</li>
          <ul>
            <li>The (*) can be used as startsWith (ex.: "abc*" =&gt; startsWith "abc") / endsWith (ex.: "*xyz" =&gt; endsWith "xyz")</li>
            <li>The other operators can be used on column type number for example: "&gt;=100" (greater or equal than 100)</li>
          </ul>
          <li>
            You can also preload a grid with certain "presets" like Filters / Sorters / Pagination{' '}
            <a href="https://ghiscoding.gitbook.io/slickgrid-react/grid-functionalities/grid-state-preset" target="_blank">
              Wiki - Grid Preset
            </a>
          </li>
          <li>
            Also note that the column Name has a filter with a custom %% operator that behaves like an SQL LIKE operator supporting %
            wildcards.
          </li>
          <li>
            Depending on your configuration, your GraphQL Server might already support regex querying (e.g. Hasura{' '}
            <a href="https://hasura.io/docs/latest/queries/postgres/filters/text-search-operators/#_regex" target="_blank">
              _regex
            </a>
            ) or you could add your own implementation (e.g. see this SO <a href="https://stackoverflow.com/a/37981802/1212166">Question</a>
            ).
          </li>
        </ul>
      </div>

      <div className="row">
        <div className="col-sm-5">
          <div className={status.class} role="alert" data-test="status">
            <strong>Status: </strong> {status.text}
            {processing ? (
              <span>
                <i className="mdi mdi-sync mdi-spin"></i>
              </span>
            ) : (
              ''
            )}
          </div>

          <div className="row">
            <div className="col-md-12">
              <button
                className="btn btn-outline-secondary btn-sm btn-icon"
                data-test="clear-filters-sorting"
                onClick={() => clearAllFiltersAndSorts()}
                title="Clear all Filters & Sorts"
              >
                <i className="mdi mdi-filter-remove-outline"></i>
                Clear all Filter & Sorts
              </button>
              <button
                className="btn btn-outline-secondary btn-sm btn-icon mx-1"
                data-test="set-dynamic-filter"
                onClick={() => setFiltersDynamically()}
              >
                Set Filters Dynamically
              </button>
              <button
                className="btn btn-outline-secondary btn-sm btn-icon mx-1"
                data-test="set-dynamic-sorting"
                onClick={() => setSortingDynamically()}
              >
                Set Sorting Dynamically
              </button>
              <button
                className="btn btn-outline-secondary btn-sm btn-icon mx-1"
                data-test="reset-presets"
                onClick={() => resetToOriginalPresets()}
              >
                Reset Original Presets
              </button>
              <label htmlFor="serverdelay" className="ml-4">
                Server Delay:{' '}
              </label>
              <input
                id="serverdelay"
                type="number"
                defaultValue={serverWaitDelay}
                data-test="server-delay"
                style={{ width: '55px' }}
                onInput={($event) => serverDelayChanged($event)}
                title="input a fake timer delay to simulate slow server response"
              />
            </div>
          </div>

          <hr />

          <div className="row">
            <div className="col-md-12">
              <button
                className="btn btn-outline-secondary btn-sm btn-icon mx-1"
                onClick={() => switchLanguage()}
                data-test="language-button"
              >
                <i className="mdi mdi-translate me-1"></i>
                Switch Language
              </button>
              <b>Locale: </b>
              <span style={{ fontStyle: 'italic' }} data-test="selected-locale">
                {selectedLanguage + '.json'}
              </span>
            </div>

            <span style={{ marginLeft: '10px' }}>
              <label>Pagination strategy: </label>
              <span data-test="radioStrategy">
                <label className="radio-inline control-label mx-1" htmlFor="offset">
                  <input
                    type="radio"
                    name="inlineRadioOptions"
                    data-test="offset"
                    id="radioOffset"
                    defaultChecked={true}
                    value="false"
                    onChange={() => changeIsWithCursor(false)}
                  />{' '}
                  Offset
                </label>
                <label className="radio-inline control-label mx-1" htmlFor="radioCursor">
                  <input
                    type="radio"
                    name="inlineRadioOptions"
                    data-test="cursor"
                    id="radioCursor"
                    value="true"
                    onChange={() => changeIsWithCursor(true)}
                  />{' '}
                  Cursor
                </label>
              </span>
            </span>
          </div>
          <br />
          {metrics && (
            <span>
              <>
                <b>Metrics: </b>
                {metrics.endTime ? tempoFormat(metrics.endTime, 'YYYY-MM-DD HH:mm:ss') : ''}| {metrics.executionTime}ms |{' '}
                {metrics.totalItemCount} items{' '}
              </>
            </span>
          )}

          <div className="row" style={{ marginBottom: '5px' }}>
            <div className="col-md-12">
              <label>Programmatically go to first/last page:</label>
              <div className="btn-group" role="group">
                <button
                  className="btn btn-outline-secondary btn-xs btn-icon px-2"
                  data-test="goto-first-page"
                  onClick={() => goToFirstPage()}
                >
                  <i className="mdi mdi-page-first"></i>
                </button>
                <button
                  className="btn btn-outline-secondary btn-xs btn-icon px-2"
                  data-test="goto-last-page"
                  onClick={() => goToLastPage()}
                >
                  <i className="mdi mdi-page-last"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="col-sm-7">
          <div className="alert alert-info" data-test="alert-graphql-query">
            <strong>GraphQL Query:</strong> <span data-test="graphql-query-result">{graphqlQuery}</span>
          </div>
        </div>
      </div>

      <hr />

      <SlickgridReact
        gridId="grid6"
        columns={columnDefinitions}
        options={gridOptions}
        dataset={dataset}
        onReactGridCreated={($event) => reactGridReady($event.detail)}
        onGridStateChanged={($event) => gridStateChanged($event.detail)}
      />
    </div>
  );
};

export default withTranslation()(Example6);
