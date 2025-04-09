import { format as dateFormatter } from '@formkit/tempo';
import { GraphqlService, type GraphqlPaginatedResult, type GraphqlServiceApi } from '@slickgrid-universal/graphql';
import i18next from 'i18next';
import React, { useEffect, useRef, useState } from 'react';
import { withTranslation } from 'react-i18next';
import {
  type Column,
  FieldType,
  Filters,
  type GridOption,
  type Metrics,
  type MultipleSelectOption,
  type OnRowCountChangedEventArgs,
  SlickgridReact,
  type SlickgridReactInstance,
} from 'slickgrid-react';
import SAMPLE_COLLECTION_DATA_URL from './data/customers_100.json?url';

import './example39.scss';

interface Status {
  text: string;
  class: string;
}

const GRAPHQL_QUERY_DATASET_NAME = 'users';
const FAKE_SERVER_DELAY = 250;

function unescapeAndLowerCase(val: string) {
  return val.replace(/^"/, '').replace(/"$/, '').toLowerCase();
}

const Example39: React.FC = () => {
  const defaultLang = 'en';
  const [columnDefinitions, setColumnDefinitions] = useState<Column[]>([]);
  const [dataset, setDataset] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  const [graphqlQuery, setGraphqlQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(defaultLang);
  const [status, setStatus] = useState({} as Status);
  const [serverWaitDelay, setServerWaitDelay] = useState(FAKE_SERVER_DELAY); // server simulation with default of 250ms but 50ms for Cypress tests
  const [tagDataClass, setTagDataClass] = useState('');
  const [hideSubTitle, setHideSubTitle] = useState(false);

  const gridOptionsRef = useRef<GridOption>(null);
  const metricsRef = useRef({} as Metrics);
  const reactGridRef = useRef<SlickgridReactInstance | null>(null);
  const serverWaitDelayRef = useRef(serverWaitDelay);

  useEffect(() => {
    defineGrid();
  }, []);

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  function defineGrid() {
    const columnDefinitions: Column[] = [
      {
        id: 'name',
        field: 'name',
        nameKey: 'NAME',
        width: 60,
        type: FieldType.string,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters.compoundInput,
        },
      },
      {
        id: 'gender',
        field: 'gender',
        nameKey: 'GENDER',
        filterable: true,
        sortable: true,
        width: 60,
        filter: {
          model: Filters.singleSelect,
          collection: [
            { value: '', label: '' },
            { value: 'male', labelKey: 'MALE' },
            { value: 'female', labelKey: 'FEMALE' },
          ],
        },
      },
      {
        id: 'company',
        field: 'company',
        nameKey: 'COMPANY',
        width: 60,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters.multipleSelect,
          customStructure: {
            label: 'company',
            value: 'company',
          },
          collectionSortBy: {
            property: 'company',
            sortDesc: false,
          },
          collectionAsync: fetch(SAMPLE_COLLECTION_DATA_URL).then((e) => e.json()),
          filterOptions: {
            filter: true, // adds a filter on top of the multi-select dropdown
          } as MultipleSelectOption,
        },
      },
    ];

    const gridOptions: GridOption = {
      enableAutoResize: true,
      autoResize: {
        container: '#demo-container',
        rightPadding: 10,
      },
      enableFiltering: true,
      enableCellNavigation: true,
      enableTranslate: true,
      createPreHeaderPanel: true,
      showPreHeaderPanel: true,
      preHeaderPanelHeight: 28,
      i18n: i18next,
      gridMenu: {
        resizeOnShowHeaderRow: true,
      },
      backendServiceApi: {
        // we need to disable default internalPostProcess so that we deal with either replacing full dataset or appending to it
        disableInternalPostProcess: true,
        service: new GraphqlService(),
        options: {
          datasetName: GRAPHQL_QUERY_DATASET_NAME, // the only REQUIRED property
          addLocaleIntoQuery: true, // optionally add current locale into the query
          extraQueryArguments: [
            {
              // optionally add some extra query arguments as input query arguments
              field: 'userId',
              value: 123,
            },
          ],
          // enable infinite via Boolean OR via { fetchSize: number }
          infiniteScroll: { fetchSize: 30 }, // or use true, in that case it would use default size of 25
        },
        // you can define the onInit callback OR enable the "executeProcessCommandOnInit" flag in the service init
        // onInit: (query) => getCustomerApiCall(query)
        preProcess: () => displaySpinner(true),
        process: (query) => getCustomerApiCall(query),
        postProcess: (result: GraphqlPaginatedResult) => {
          metricsRef.current = result.metrics as Metrics;
          displaySpinner(false);
          getCustomerCallback(result);
        },
      } as GraphqlServiceApi,
    };

    setColumnDefinitions(columnDefinitions);
    gridOptionsRef.current = gridOptions;
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

  function getCustomerCallback(result: any) {
    const { nodes, totalCount } = result.data[GRAPHQL_QUERY_DATASET_NAME];
    if (reactGridRef.current) {
      metricsRef.current = { ...metricsRef.current, totalItemCount: totalCount };

      // even if we're not showing pagination, it is still used behind the scene to fetch next set of data (next page basically)
      // once pagination totalItems is filled, we can update the dataset

      // infinite scroll has an extra data property to determine if we hit an infinite scroll and there's still more data (in that case we need append data)
      // or if we're on first data fetching (no scroll bottom ever occured yet)
      if (!result.infiniteScrollBottomHit) {
        // initial load not scroll hit yet, full dataset assignment
        reactGridRef.current.slickGrid?.scrollTo(0); // scroll back to top to avoid unwanted onScroll end triggered
        setDataset(nodes);
        metricsRef.current = { ...metricsRef.current, itemCount: nodes.length };
      } else {
        // scroll hit, for better perf we can simply use the DataView directly for better perf (which is better compare to replacing the entire dataset)
        reactGridRef.current.dataView?.addItems(nodes);
      }

      // NOTE: you can get currently loaded item count via the `onRowCountChanged`slick event, see `refreshMetrics()` below
      // OR you could also calculate it yourself or get it via: `reactGrid?.dataView.getItemCount() === totalItemCount`
      // console.log('is data fully loaded: ', reactGrid?.dataView?.getItemCount() === totalItemCount);
    }
  }

  /**
   * Calling your GraphQL backend server should always return a Promise of type GraphqlPaginatedResult
   *
   * @param query
   * @return Promise<GraphqlPaginatedResult>
   */
  function getCustomerApiCall(query: string): Promise<GraphqlPaginatedResult> {
    // in your case, you will call your WebAPI function (wich needs to return a Promise)
    // for the demo purpose, we will call a mock WebAPI function
    return getCustomerDataApiMock(query);
  }

  function getCustomerDataApiMock(query: string): Promise<any> {
    return new Promise<GraphqlPaginatedResult>((resolve) => {
      let firstCount = 0;
      let offset = 0;
      let orderByField = '';
      let orderByDir = '';

      fetch(SAMPLE_COLLECTION_DATA_URL)
        .then((e) => e.json())
        .then((data: any) => {
          let filteredData: Array<{ id: number; name: string; gender: string; company: string; category: { id: number; name: string } }> =
            data;
          if (query.includes('first:')) {
            const topMatch = query.match(/first:([0-9]+),/) || [];
            firstCount = +topMatch[1];
          }
          if (query.includes('offset:')) {
            const offsetMatch = query.match(/offset:([0-9]+),/) || [];
            offset = +offsetMatch[1];
          }
          if (query.includes('orderBy:')) {
            const [_, field, dir] = /orderBy:\[{field:([a-zA-Z/]+),direction:(ASC|DESC)}\]/gi.exec(query) || [];
            orderByField = field || '';
            orderByDir = dir || '';
          }
          if (query.includes('orderBy:')) {
            const [_, field, dir] = /orderBy:\[{field:([a-zA-Z/]+),direction:(ASC|DESC)}\]/gi.exec(query) || [];
            orderByField = field || '';
            orderByDir = dir || '';
          }
          if (query.includes('filterBy:')) {
            const regex = /{field:(\w+),operator:(\w+),value:([0-9a-z',"\s]*)}/gi;

            // loop through all filters
            let matches;
            while ((matches = regex.exec(query)) !== null) {
              const field = matches[1] || '';
              const operator = matches[2] || '';
              const value = matches[3] || '';

              let [term1, term2] = value.split(',');

              if (field && operator && value !== '') {
                filteredData = filteredData.filter((dataContext: any) => {
                  const dcVal = dataContext[field];
                  // remove any double quotes & lowercase the terms
                  term1 = unescapeAndLowerCase(term1);
                  term2 = unescapeAndLowerCase(term2 || '');

                  switch (operator) {
                    case 'EQ':
                      return dcVal.toLowerCase() === term1;
                    case 'NE':
                      return dcVal.toLowerCase() !== term1;
                    case 'LE':
                      return dcVal.toLowerCase() <= term1;
                    case 'LT':
                      return dcVal.toLowerCase() < term1;
                    case 'GT':
                      return dcVal.toLowerCase() > term1;
                    case 'GE':
                      return dcVal.toLowerCase() >= term1;
                    case 'EndsWith':
                      return dcVal.toLowerCase().endsWith(term1);
                    case 'StartsWith':
                      return dcVal.toLowerCase().startsWith(term1);
                    case 'Starts+Ends':
                      return dcVal.toLowerCase().startsWith(term1) && dcVal.toLowerCase().endsWith(term2);
                    case 'Contains':
                      return dcVal.toLowerCase().includes(term1);
                    case 'Not_Contains':
                      return !dcVal.toLowerCase().includes(term1);
                    case 'IN':
                      const terms = value.toLocaleLowerCase().split(',');
                      for (const term of terms) {
                        if (dcVal.toLocaleLowerCase() === unescapeAndLowerCase(term)) {
                          return true;
                        }
                      }
                      break;
                  }
                });
              }
            }
          }

          // make sure page skip is not out of boundaries, if so reset to first page & remove skip from query
          let firstRow = offset;
          if (firstRow > filteredData.length) {
            query = query.replace(`offset:${firstRow}`, '');
            firstRow = 0;
          }

          // sorting when defined
          const selector = (obj: any) => (orderByField ? obj[orderByField] : obj);
          switch (orderByDir.toUpperCase()) {
            case 'ASC':
              filteredData = filteredData.sort((a, b) => selector(a).localeCompare(selector(b)));
              break;
            case 'DESC':
              filteredData = filteredData.sort((a, b) => selector(b).localeCompare(selector(a)));
              break;
          }

          // return data subset (page)
          const updatedData = filteredData.slice(firstRow, firstRow + firstCount);

          // in your case, you will call your WebAPI function (wich needs to return a Promise)
          // for the demo purpose, we will call a mock WebAPI function
          const mockedResult = {
            // the dataset name is the only unknown property
            // will be the same defined in your GraphQL Service init, in our case GRAPHQL_QUERY_DATASET_NAME
            data: {
              [GRAPHQL_QUERY_DATASET_NAME]: {
                nodes: updatedData,
                totalCount: filteredData.length,
              },
            },
          };

          window.setTimeout(() => {
            setGraphqlQuery(gridOptionsRef.current!.backendServiceApi!.service.buildQuery());
            resolve(mockedResult);
          }, serverWaitDelayRef.current);
        });
    });
  }

  function refreshMetrics(args: OnRowCountChangedEventArgs) {
    const itemCount = reactGridRef.current?.dataView?.getFilteredItemCount() || 0;
    if (args?.current >= 0) {
      metricsRef.current = { ...metricsRef.current, itemCount };
      setTagDataClass(itemCount === metricsRef.current.totalItemCount ? 'fully-loaded' : 'partial-load');
    }
  }

  function serverDelayChanged(e: React.FormEvent<HTMLInputElement>) {
    const newDelay = +((e.target as HTMLInputElement)?.value ?? '');
    setServerWaitDelay(newDelay);
    serverWaitDelayRef.current = newDelay;
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

  return !gridOptionsRef.current ? (
    ''
  ) : (
    <div className="demo39">
      <div id="demo-container" className="container-fluid">
        <h2>
          Example 39: GraphQL Backend Service with Infinite Scroll
          <span className="float-end font18">
            see&nbsp;
            <a
              target="_blank"
              href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example39.tsx"
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
          <ul>
            <li>
              Infinite scrolling allows the grid to lazy-load rows from the server when reaching the scroll bottom (end) position. In its
              simplest form, the more the user scrolls down, the more rows get loaded. If we reached the end of the dataset and there is no
              more data to load, then we'll assume to have the entire dataset loaded in memory. This contrast with the regular Pagination
              approach which will only hold a single page data at a time.
            </li>
            <li>NOTES</li>
            <ol>
              <li>
                <code>presets.pagination</code> is not supported with Infinite Scroll and will revert to the first page, simply because
                since we keep appending data, we always have to start from index zero (no offset).
              </li>
              <li>
                Pagination is not shown BUT in fact, that is what is being used behind the scene whenever reaching the scroll end (fetching
                next batch).
              </li>
              <li>
                Also note that whenever the user changes the Sort(s)/Filter(s) it will always reset and go back to zero index (first page).
              </li>
            </ol>
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
                <label htmlFor="serverdelay" className="mx-1">
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
            </div>
            <br />
            {metricsRef.current && (
              <div>
                <>
                  <b className="me-1">Metrics:</b>
                  {metricsRef.current?.endTime ? dateFormatter(metricsRef.current.endTime, 'DD MMM, h:mm:ss a') : ''} —
                  <span className="mx-1" data-test="itemCount">
                    {metricsRef.current.itemCount}
                  </span>
                  of
                  <span className="mx-1" data-test="totalItemCount">
                    {metricsRef.current.totalItemCount}
                  </span>{' '}
                  items
                  <span className={'badge rounded-pill text-bg-primary mx-1 ' + tagDataClass} data-test="data-loaded-tag">
                    All Data Loaded!!!
                  </span>
                </>
              </div>
            )}
          </div>
          <div className="col-sm-7">
            <div className="alert alert-info" data-test="alert-graphql-query">
              <strong>GraphQL Query:</strong> <span data-test="graphql-query-result">{graphqlQuery}</span>
            </div>
          </div>
        </div>

        <SlickgridReact
          gridId="grid39"
          columns={columnDefinitions}
          options={gridOptionsRef.current}
          dataset={dataset}
          onReactGridCreated={($event) => reactGridReady($event.detail)}
          onRowCountChanged={($event) => refreshMetrics($event.detail.args)}
        />
      </div>
    </div>
  );
};

export default withTranslation()(Example39);
