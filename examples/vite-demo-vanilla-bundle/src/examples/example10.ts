import {
  type Column,
  type CursorPageInfo,
  FieldType,
  Filters,
  Formatters,
  type GridOption,
  type GridStateChange,
  type Metrics,
  OperatorType,
  SortDirection,
} from '@slickgrid-universal/common';
import { BindingEventService } from '@slickgrid-universal/binding';
import { GraphqlService, type GraphqlPaginatedResult, type GraphqlServiceApi, type GraphqlServiceOption, } from '@slickgrid-universal/graphql';
import { Slicker, type SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';
import { addDay, format } from '@formkit/tempo';
import { type MultipleSelectOption } from 'multiple-select-vanilla';

import { ExampleGridOptions } from './example-grid-options';
import type { TranslateService } from '../translate.service';
import './example10.scss';
import '../material-styles.scss';

const defaultPageSize = 20;
const GRAPHQL_QUERY_DATASET_NAME = 'users';
const FAKE_SERVER_DELAY = 250;

export default class Example10 {
  private _bindingEventService: BindingEventService;
  private _darkMode = false;
  columnDefinitions: Column[];
  gridOptions: GridOption;
  dataset = [];
  metrics: Metrics;
  sgb: SlickVanillaGridBundle;

  isWithCursor = false;
  graphqlQuery = '...';
  processing = false;
  selectedLanguage: string;
  selectedLanguageFile: string;
  status = '';
  statusClass = 'is-success';
  translateService: TranslateService;
  serverWaitDelay = FAKE_SERVER_DELAY; // server simulation with default of 250ms but 50ms for Cypress tests

  constructor() {
    this._bindingEventService = new BindingEventService();
    // get the Translate Service from the window object,
    // it might be better with proper Dependency Injection but this project doesn't have any at this point
    this.translateService = (<any>window).TranslateService;
    this.selectedLanguage = this.translateService.getCurrentLanguage();
    this.selectedLanguageFile = `${this.selectedLanguage}.json`;
  }

  async attached() {
    this.initializeGrid();
    const gridContainerElm = document.querySelector(`.grid10`) as HTMLDivElement;

    // this._bindingEventService.bind(gridContainerElm, 'onbeforeexporttoexcel', () => console.log('onBeforeExportToExcel'));
    // this._bindingEventService.bind(gridContainerElm, 'onafterexporttoexcel', () => console.log('onAfterExportToExcel'));
    this.sgb = new Slicker.GridBundle(gridContainerElm, this.columnDefinitions, { ...ExampleGridOptions, ...this.gridOptions }, this.dataset);
    this._bindingEventService.bind(gridContainerElm, 'ongridstatechanged', this.handleOnGridStateChanged.bind(this));
    document.body.classList.add('material-theme');
  }

  dispose() {
    if (this.sgb) {
      this.sgb?.dispose();
    }
    this._bindingEventService.unbindAll();
    //   this.saveCurrentGridState();
    document.body.classList.remove('material-theme');
    document.body.setAttribute('data-theme', 'light');
    document.querySelector('.demo-container')?.classList.remove('dark-mode');
  }

  initializeGrid() {
    this.columnDefinitions = [
      {
        id: 'name', field: 'name', nameKey: 'NAME', width: 60, columnGroupKey: 'CUSTOMER_INFORMATION',
        type: FieldType.string,
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
        }
      },
      {
        id: 'gender', field: 'gender', nameKey: 'GENDER', filterable: true, sortable: true, width: 60, columnGroupKey: 'CUSTOMER_INFORMATION',
        filter: {
          model: Filters.singleSelect,
          collection: [{ value: '', label: '' }, { value: 'male', labelKey: 'MALE', }, { value: 'female', labelKey: 'FEMALE', }]
        }
      },
      {
        id: 'company', field: 'company', nameKey: 'COMPANY', width: 60, columnGroupKey: 'CUSTOMER_INFORMATION',
        sortable: true,
        filterable: true,
        filter: {
          model: Filters.multipleSelect,
          collection: [{ value: 'acme', label: 'Acme' }, { value: 'abc', label: 'Company ABC' }, { value: 'xyz', label: 'Company XYZ' }],
          filterOptions: {
            filter: true // adds a filter on top of the multi-select dropdown
          } as MultipleSelectOption
        }
      },
      {
        id: 'billingAddressStreet', field: 'billing.address.street', nameKey: 'BILLING.ADDRESS.STREET',
        formatter: Formatters.complexObject,
        width: 60, filterable: true, sortable: true, columnGroupKey: 'BILLING.INFORMATION',
      },
      {
        id: 'billingAddressZip', field: 'billing.address.zip', nameKey: 'BILLING.ADDRESS.ZIP', width: 60,
        type: FieldType.number,
        columnGroupKey: 'BILLING.INFORMATION',
        filterable: true, sortable: true,
        filter: {
          model: Filters.compoundInput
        },
        formatter: Formatters.multiple, params: { formatters: [Formatters.complexObject, Formatters.translate] }
      },
      {
        id: 'finish', field: 'finish', name: 'Date', formatter: Formatters.dateIso, sortable: true, minWidth: 90, width: 120, exportWithFormatter: true,
        columnGroupKey: 'BILLING.INFORMATION',
        type: FieldType.date,
        filterable: true,
        filter: {
          model: Filters.dateRange,
        }
      },
    ];

    const presetLowestDay = format(addDay(new Date(), -2), 'YYYY-MM-DD');
    const presetHighestDay = format(addDay(new Date(), 20), 'YYYY-MM-DD');

    this.gridOptions = {
      enableAutoTooltip: true,
      autoTooltipOptions: {
        enableForHeaderCells: true
      },
      enableTranslate: true,
      translater: this.translateService, // pass the TranslateService instance to the grid
      enableAutoResize: false,
      gridHeight: 275,
      gridWidth: 900,
      compoundOperatorAltTexts: {
        // where '=' is any of the `OperatorString` type shown above
        text: { 'Custom': { operatorAlt: '%%', descAlt: 'SQL Like' } },
      },
      enableFiltering: true,
      enableCellNavigation: true,
      createPreHeaderPanel: true,
      showPreHeaderPanel: true,
      preHeaderPanelHeight: 28,
      gridMenu: {
        resizeOnShowHeaderRow: true,
      },
      enablePagination: true, // you could optionally disable the Pagination
      pagination: {
        pageSizes: [10, 15, 20, 25, 30, 40, 50, 75, 100],
        pageSize: defaultPageSize,
        totalItems: 0
      },
      presets: {
        columns: [
          { columnId: 'name', width: 100 },
          { columnId: 'gender', width: 55 },
          { columnId: 'company' },
          { columnId: 'billingAddressZip' }, // flip column position of Street/Zip to Zip/Street
          { columnId: 'billingAddressStreet', width: 120 },
          { columnId: 'finish', width: 130 },
        ],
        filters: [
          // you can use OperatorType or type them as string, e.g.: operator: 'EQ'
          { columnId: 'gender', searchTerms: ['male'], operator: OperatorType.equal },
          // { columnId: 'name', searchTerms: ['John Doe'], operator: OperatorType.contains },
          { columnId: 'name', searchTerms: ['Joh*oe'], operator: OperatorType.startsWithEndsWith },
          { columnId: 'company', searchTerms: ['xyz'], operator: 'IN' },

          // use a date range with 2 searchTerms values
          { columnId: 'finish', searchTerms: [presetLowestDay, presetHighestDay], operator: OperatorType.rangeInclusive },
        ],
        sorters: [
          // direction can written as 'asc' (uppercase or lowercase) and/or use the SortDirection type
          { columnId: 'name', direction: 'asc' },
          { columnId: 'company', direction: SortDirection.DESC }
        ],
        pagination: { pageNumber: this.isWithCursor ? 1 : 2, pageSize: 20 } // if cursor based, start at page 1
      },
      backendServiceApi: {
        service: new GraphqlService(),
        options: {
          datasetName: GRAPHQL_QUERY_DATASET_NAME, // the only REQUIRED property
          addLocaleIntoQuery: true,   // optionally add current locale into the query
          extraQueryArguments: [{     // optionally add some extra query arguments as input query arguments
            field: 'userId',
            value: 123
          }],
          filterQueryOverride: ({ fieldName, columnDef, columnFilterOperator, searchValue }) => {
            if (columnFilterOperator === OperatorType.custom && columnDef?.id === 'name') {
              // technically speaking GraphQL isn't a database query language like SQL, it's an application query language.
              // What that means is that GraphQL won't let you write arbitrary queries out of the box.
              // It will only support the types of queries defined in your GraphQL schema.
              // see this SO: https://stackoverflow.com/a/37981802/1212166
              return { field: fieldName, operator: 'Like', value: searchValue };
            }
          },
          useCursor: this.isWithCursor, // sets pagination strategy, if true requires a call to setPageInfo() when graphql call returns
          // when dealing with complex objects, we want to keep our field name with double quotes
          // example with gender: query { users (orderBy:[{field:"gender",direction:ASC}]) {}
          keepArgumentFieldDoubleQuotes: true
        },
        // you can define the onInit callback OR enable the "executeProcessCommandOnInit" flag in the service init
        // onInit: (query) => this.getCustomerApiCall(query),
        preProcess: () => this.displaySpinner(true),
        process: (query) => this.getCustomerApiCall(query),
        postProcess: (result: GraphqlPaginatedResult) => {
          this.metrics = result.metrics as Metrics;
          this.displaySpinner(false);
        }
      } as GraphqlServiceApi
    };
  }

  clearAllFiltersAndSorts() {
    if (this.sgb?.gridService) {
      this.sgb.gridService.clearAllFiltersAndSorts();
    }
  }

  displaySpinner(isProcessing) {
    this.processing = isProcessing;
    this.status = (isProcessing) ? 'loading...' : 'finished!!';
    this.statusClass = (isProcessing) ? 'notification is-light is-warning' : 'notification is-light is-success';
  }

  /**
   * Calling your GraphQL backend server should always return a Promise of type GraphqlPaginatedResult
   *
   * @param query
   * @return Promise<GraphqlPaginatedResult>
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getCustomerApiCall(_query: string): Promise<GraphqlPaginatedResult> {
    let pageInfo: CursorPageInfo;
    if (this.sgb) {
      const { paginationService } = this.sgb;
      // there seems to a timing issue where when you click "cursor" it requests the data before the pagination-service is initialized...
      const pageNumber = (paginationService as any)._initialized ? paginationService.getCurrentPageNumber() : 1;
      // In the real world, each node item would be A,B,C...AA,AB,AC, etc and so each page would actually be something like A-T, T-AN
      // but for this mock data it's easier to represent each page as
      // Page1: A-B
      // Page2: B-C
      // Page3: C-D
      // Page4: D-E
      // Page5: E-F
      const startCursor = String.fromCharCode('A'.charCodeAt(0) + pageNumber - 1);
      const endCursor = String.fromCharCode(startCursor.charCodeAt(0) + 1);
      pageInfo = {
        hasPreviousPage: paginationService.dataFrom === 0,
        hasNextPage: paginationService.dataTo === 100,
        startCursor,
        endCursor
      };
    } else {
      pageInfo = {
        hasPreviousPage: false,
        hasNextPage: true,
        startCursor: 'A',
        endCursor: 'B'
      };
    }

    // in your case, you will call your WebAPI function (wich needs to return a Promise)
    // for the demo purpose, we will call a mock WebAPI function
    const mockedResult = {
      // the dataset name is the only unknown property
      // will be the same defined in your GraphQL Service init, in our case GRAPHQL_QUERY_DATASET_NAME
      data: {
        [GRAPHQL_QUERY_DATASET_NAME]: {
          nodes: [],
          totalCount: 100,
          pageInfo
        },
      },
    };

    return new Promise<GraphqlPaginatedResult>(resolve => {
      setTimeout(() => {
        this.graphqlQuery = this.gridOptions.backendServiceApi!.service.buildQuery();
        if (this.isWithCursor) {
          // When using cursor pagination, the pagination service needs to be updated with the PageInfo data from the latest request
          // This might be done automatically if using a framework specific slickgrid library
          // Note because of this timeout, this may cause race conditions with rapid clicks!
          this.sgb?.paginationService.setCursorPageInfo((mockedResult.data[GRAPHQL_QUERY_DATASET_NAME].pageInfo));
        }
        resolve(mockedResult);
      }, this.serverWaitDelay);
    });
  }

  goToFirstPage() {
    this.sgb?.paginationService?.goToFirstPage();
  }

  goToLastPage() {
    this.sgb?.paginationService?.goToLastPage();
  }

  handleOnGridStateChanged(event) {
    if (event?.detail) {
      const gridStateChanges: GridStateChange = event.detail;
      console.log('Grid State changed:: ', gridStateChanges.change);
    }
  }

  saveCurrentGridState() {
    console.log('GraphQL current grid state', this.sgb?.gridStateService.getCurrentGridState());
  }

  setFiltersDynamically() {
    const presetLowestDay = format(addDay(new Date(), -2), 'YYYY-MM-DD');
    const presetHighestDay = format(addDay(new Date(), 20), 'YYYY-MM-DD');

    // we can Set Filters Dynamically (or different filters) afterward through the FilterService
    this.sgb.filterService.updateFilters([
      { columnId: 'gender', searchTerms: ['female'], operator: OperatorType.equal },
      { columnId: 'name', searchTerms: ['Jane'], operator: OperatorType.startsWith },
      { columnId: 'company', searchTerms: ['acme'], operator: 'IN' },
      { columnId: 'billingAddressZip', searchTerms: ['11'], operator: OperatorType.greaterThanOrEqual },
      { columnId: 'finish', searchTerms: [presetLowestDay, presetHighestDay], operator: OperatorType.rangeInclusive },
    ]);
  }

  setSortingDynamically() {
    this.sgb.sortService.updateSorting([
      // orders matter, whichever is first in array will be the first sorted column
      { columnId: 'billingAddressZip', direction: 'DESC' },
      { columnId: 'company', direction: 'ASC' },
    ]);
  }

  resetToOriginalPresets() {
    const presetLowestDay = format(addDay(new Date(), -2), 'YYYY-MM-DD');
    const presetHighestDay = format(addDay(new Date(), 20), 'YYYY-MM-DD');

    this.sgb?.filterService.updateFilters([
      // you can use OperatorType or type them as string, e.g.: operator: 'EQ'
      { columnId: 'gender', searchTerms: ['male'], operator: OperatorType.equal },
      // { columnId: 'name', searchTerms: ['John Doe'], operator: OperatorType.contains },
      { columnId: 'name', searchTerms: ['Joh*oe'], operator: OperatorType.startsWithEndsWith },
      { columnId: 'company', searchTerms: ['xyz'], operator: 'IN' },

      // use a date range with 2 searchTerms values
      { columnId: 'finish', searchTerms: [presetLowestDay, presetHighestDay], operator: OperatorType.rangeInclusive },
    ]);
    this.sgb?.sortService.updateSorting([
      // direction can written as 'asc' (uppercase or lowercase) and/or use the SortDirection type
      { columnId: 'name', direction: 'asc' },
      { columnId: 'company', direction: SortDirection.DESC }
    ]);
    setTimeout(() => {
      this.sgb?.paginationService?.changeItemPerPage(20);
      this.sgb?.paginationService?.goToPageNumber(2);
    });
  }

  setIsWithCursor(newValue: boolean) {
    this.isWithCursor = newValue;
    this.resetOptions({ useCursor: this.isWithCursor });
  }

  async switchLanguage() {
    const nextLanguage = (this.selectedLanguage === 'en') ? 'fr' : 'en';
    await this.translateService.use(nextLanguage);
    this.selectedLanguage = nextLanguage;
    this.selectedLanguageFile = `${this.selectedLanguage}.json`;
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

  private resetOptions(options: Partial<GraphqlServiceOption>) {
    const graphqlService = this.gridOptions.backendServiceApi!.service as GraphqlService;
    this.sgb?.paginationService!.setCursorBased(options.useCursor!);
    graphqlService.updateOptions(options);
    this.gridOptions = { ...this.gridOptions };
    this.sgb?.paginationService?.goToFirstPage();
  }
}
