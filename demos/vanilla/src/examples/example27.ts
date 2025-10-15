import { format } from '@formkit/tempo';
import { BindingEventService } from '@slickgrid-universal/binding';
import { Filters, type Column, type GridOption, type OnRowCountChangedEventArgs } from '@slickgrid-universal/common';
import { GraphqlService, type GraphqlPaginatedResult, type GraphqlServiceApi } from '@slickgrid-universal/graphql';
import { Slicker, type SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';
import { type MultipleSelectOption } from 'multiple-select-vanilla';
import type { TranslateService } from '../translate.service.js';
import CustomersData from './data/customers_100.json';
import { ExampleGridOptions } from './example-grid-options.js';
import './example27.scss';
import '../material-styles.scss';

const GRAPHQL_QUERY_DATASET_NAME = 'users';
const FAKE_SERVER_DELAY = 250;

function unescapeAndLowerCase(val: string) {
  return val.replace(/^"/, '').replace(/"$/, '').toLowerCase();
}

export default class Example27 {
  private _bindingEventService: BindingEventService;
  private _darkMode = false;
  backendService: GraphqlService;
  columnDefinitions: Column[];
  gridOptions: GridOption;
  dataset = [];
  metricsEndTime = '';
  metricsItemCount = 0;
  metricsTotalItemCount = 0;
  sgb: SlickVanillaGridBundle;
  tagDataClass = 'tag is-primary tag-data';
  jsonData: Array<{ id: number; name: string; gender: string; company: string; category: { id: number; name: string } }> = [];

  graphqlQuery = '...';
  processing = false;
  selectedLanguage = 'en';
  selectedLanguageFile = 'en.json';
  status = '';
  statusClass = 'is-success';
  translateService: TranslateService;
  serverWaitDelay = FAKE_SERVER_DELAY; // server simulation with default of 250ms but 50ms for Cypress tests

  constructor() {
    this.backendService = new GraphqlService();
    this._bindingEventService = new BindingEventService();
    // get the Translate Service from the window object,
    // it might be better with proper Dependency Injection but this project doesn't have any at this point
    this.translateService = (<any>window).TranslateService;
    this.translateService.use('en');
    this.selectedLanguage = 'en';
    this.selectedLanguageFile = `${this.selectedLanguage}.json`;
  }

  async attached() {
    // read the JSON and create a fresh copy of the data that we are free to modify
    this.jsonData = JSON.parse(JSON.stringify(CustomersData));

    this.initializeGrid();
    const gridContainerElm = document.querySelector(`.grid27`) as HTMLDivElement;

    this.sgb = new Slicker.GridBundle(
      gridContainerElm,
      this.columnDefinitions,
      { ...ExampleGridOptions, ...this.gridOptions },
      this.dataset
    );

    // bind any of the grid events
    this._bindingEventService.bind(gridContainerElm, 'onrowcountchanged', this.refreshMetrics.bind(this) as EventListener);
    document.body.classList.add('material-theme');
  }

  dispose() {
    this.sgb?.dispose();
    this._bindingEventService.unbindAll();
    document.body.classList.remove('material-theme');
    document.body.setAttribute('data-theme', 'light');
    document.querySelector('.demo-container')?.classList.remove('dark-mode');
  }

  initializeGrid() {
    this.columnDefinitions = [
      {
        id: 'name',
        field: 'name',
        nameKey: 'NAME',
        width: 60,
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
          collection: this.jsonData.sort((a, b) => (a.company < b.company ? -1 : 1)).map((m) => ({ value: m.company, label: m.company })),
          options: {
            filter: true, // adds a filter on top of the multi-select dropdown
          } as MultipleSelectOption,
        },
      },
    ];

    this.gridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '.demo-container',
        rightPadding: 10,
      },
      enableAutoTooltip: true,
      autoTooltipOptions: {
        enableForHeaderCells: true,
      },
      enableTranslate: true,
      translater: this.translateService, // pass the TranslateService instance to the grid
      enableFiltering: true,
      enableCellNavigation: true,
      multiColumnSort: false,
      gridMenu: {
        resizeOnShowHeaderRow: true,
      },
      backendServiceApi: {
        // we need to disable default internalPostProcess so that we deal with either replacing full dataset or appending to it
        disableInternalPostProcess: true,
        service: this.backendService,
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
        // onInit: (query) => this.getCustomerApiCall(query),
        preProcess: () => this.displaySpinner(true),
        process: (query) => this.getCustomerApiCall(query),
        postProcess: (result: GraphqlPaginatedResult) => {
          this.metricsEndTime = format(new Date(), 'DD MMM, h:mm:ssa');
          this.metricsTotalItemCount = result.data[GRAPHQL_QUERY_DATASET_NAME].totalCount || 0;
          this.displaySpinner(false);
          this.getCustomerCallback(result);
        },
      } as GraphqlServiceApi,
    };
  }

  clearAllFiltersAndSorts() {
    if (this.sgb?.gridService) {
      this.sgb.gridService.clearAllFiltersAndSorts();
    }
  }

  displaySpinner(isProcessing) {
    this.processing = isProcessing;
    this.status = isProcessing ? 'loading...' : 'finished!!';
    this.statusClass = isProcessing ? 'notification is-light is-warning' : 'notification is-light is-success';
  }

  getCustomerCallback(result) {
    const { nodes, totalCount } = result.data[GRAPHQL_QUERY_DATASET_NAME];
    this.metricsTotalItemCount = totalCount;

    // even if we're not showing pagination, it is still used behind the scene to fetch next set of data (next page basically)
    // once pagination totalItems is filled, we can update the dataset
    this.sgb.paginationOptions!.totalItems = totalCount;

    // infinite scroll has an extra data property to determine if we hit an infinite scroll and there's still more data (in that case we need append data)
    // or if we're on first data fetching (no scroll bottom ever occured yet)
    if (!result.infiniteScrollBottomHit) {
      // initial load not scroll hit yet, full dataset assignment
      this.sgb.slickGrid?.scrollTo(0); // scroll back to top to avoid unwanted onScroll end triggered
      this.sgb.dataset = nodes;
    } else {
      // scroll hit, for better perf we can simply use the DataView directly for better perf (which is better compare to replacing the entire dataset)
      this.sgb.dataView?.addItems(nodes);
    }

    // NOTE: you can get currently loaded item count via the `onRowCountChanged`slick event, see `refreshMetrics()` below
    // OR you could also calculate it yourself or get it via: `this.sgb.dataView.getItemCount() === totalItemCount`
    // console.log('is data fully loaded: ', this.sgb.dataView?.getItemCount() === totalItemCount);
  }

  /**
   * Calling your GraphQL backend server should always return a Promise of type GraphqlPaginatedResult
   *
   * @param query
   * @return Promise<GraphqlPaginatedResult>
   */
  getCustomerApiCall(query: string): Promise<GraphqlPaginatedResult> {
    // in your case, you will call your WebAPI function (wich needs to return a Promise)
    // for the demo purpose, we will call a mock WebAPI function
    return this.getCustomerDataApiMock(query);
  }

  getCustomerDataApiMock(query: string): Promise<any> {
    let firstCount = 0;
    let offset = 0;
    let orderByField = '';
    let orderByDir = '';
    let filteredData = this.jsonData;

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

        console.log('filterBy:', field, operator, value);
        let [term1, term2] = value.split(',');

        if (field && operator && value !== '') {
          filteredData = filteredData.filter((dataContext) => {
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

    return new Promise<GraphqlPaginatedResult>((resolve) => {
      setTimeout(() => {
        this.graphqlQuery = this.gridOptions.backendServiceApi!.service.buildQuery();
        resolve(mockedResult);
      }, this.serverWaitDelay);
    });
  }

  refreshMetrics(event: CustomEvent<{ args: OnRowCountChangedEventArgs }>) {
    const args = event?.detail?.args;
    if (args?.current >= 0) {
      this.metricsItemCount = this.sgb.dataset.length || 0;
      this.tagDataClass =
        this.metricsItemCount === this.metricsTotalItemCount
          ? 'tag tag-data is-primary fully-loaded'
          : 'tag tag-data is-primary partial-load';
    }
  }

  async switchLanguage() {
    const nextLanguage = this.selectedLanguage === 'en' ? 'fr' : 'en';
    await this.translateService.use(nextLanguage);
    this.selectedLanguage = nextLanguage;
    this.selectedLanguageFile = `${this.selectedLanguage}.json`;

    // we could also force a query since we provide a Locale and it changed
    this.getCustomerApiCall(this.backendService.buildQuery() || '');
  }

  toggleDarkMode() {
    this._darkMode = !this._darkMode;
    this.toggleBodyBackground();
    this.sgb.gridOptions = { ...this.sgb.gridOptions, darkMode: this._darkMode };
    this.sgb.slickGrid?.setOptions({ darkMode: this._darkMode });
  }

  toggleBodyBackground() {
    if (this._darkMode) {
      document.body.setAttribute('data-theme', 'dark');
      document.querySelector('.demo-container')?.classList.add('dark-mode');
    } else {
      document.body.setAttribute('data-theme', 'light');
      document.querySelector('.demo-container')?.classList.remove('dark-mode');
    }
  }
}
