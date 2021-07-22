import {
  BindingEventService,
  Column,
  FieldType,
  Filters,
  Formatters,
  GridOption,
  GridStateChange,
  Metrics,
  MultipleSelectOption,
  OperatorType,
  SortDirection,
} from '@slickgrid-universal/common';
import { GraphqlService, GraphqlPaginatedResult, GraphqlServiceApi, } from '@slickgrid-universal/graphql';
import { Slicker, SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';
import * as moment from 'moment-mini';
import { ExampleGridOptions } from './example-grid-options';
import { TranslateService } from '../translate.service';
import './example10.scss';

const defaultPageSize = 20;
const GRAPHQL_QUERY_DATASET_NAME = 'users';

export class Example10 {
  private _bindingEventService: BindingEventService;
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

  constructor() {
    this._bindingEventService = new BindingEventService();
    // get the Translate Service from the window object,
    // it might be better with proper Dependency Injection but this project doesn't have any at this point
    this.translateService = (<any>window).TranslateService;
    this.selectedLanguage = this.translateService.getCurrentLanguage();
    this.selectedLanguageFile = `${this.selectedLanguage}.json`;
    console.log('TranslateService', this.translateService.translate('ALL_SELECTED'));
  }

  dispose() {
    if (this.sgb) {
      this.sgb?.dispose();
    }
    this._bindingEventService.unbindAll();
    //   this.saveCurrentGridState();
  }

  attached() {
    this.initializeGrid();
    const gridContainerElm = document.querySelector<HTMLDivElement>(`.grid10`);

    // this._bindingEventService.bind(gridContainerElm, 'onbeforeexporttoexcel', () => console.log('onBeforeExportToExcel'));
    // this._bindingEventService.bind(gridContainerElm, 'onafterexporttoexcel', () => console.log('onAfterExportToExcel'));
    this.sgb = new Slicker.GridBundle(gridContainerElm, this.columnDefinitions, { ...ExampleGridOptions, ...this.gridOptions }, this.dataset);
  }

  initializeGrid() {
    this.columnDefinitions = [
      {
        id: 'name', field: 'name', nameKey: 'NAME', width: 60, columnGroupKey: 'CUSTOMER_INFORMATION',
        type: FieldType.string,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters.compoundInput
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

    const presetLowestDay = moment().add(-2, 'days').format('YYYY-MM-DD');
    const presetHighestDay = moment().add(20, 'days').format('YYYY-MM-DD');

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
          { columnId: 'name', searchTerms: ['John Doe'], operator: OperatorType.contains },
          { columnId: 'company', searchTerms: ['xyz'], operator: 'IN' },

          // use a date range with 2 searchTerms values
          { columnId: 'finish', searchTerms: [presetLowestDay, presetHighestDay], operator: OperatorType.rangeInclusive },
        ],
        sorters: [
          // direction can written as 'asc' (uppercase or lowercase) and/or use the SortDirection type
          { columnId: 'name', direction: 'asc' },
          { columnId: 'company', direction: SortDirection.DESC }
        ],
        pagination: { pageNumber: 2, pageSize: 20 }
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
          // when dealing with complex objects, we want to keep our field name with double quotes
          // example with gender: query { users (orderBy:[{field:"gender",direction:ASC}]) {}
          keepArgumentFieldDoubleQuotes: true
        },
        // you can define the onInit callback OR enable the "executeProcessCommandOnInit" flag in the service init
        // onInit: (query) => this.getCustomerApiCall(query),
        preProcess: () => this.displaySpinner(true),
        process: (query) => this.getCustomerApiCall(query),
        postProcess: (result: GraphqlPaginatedResult) => {
          this.metrics = result.metrics;
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
  getCustomerApiCall(_query: string): Promise<GraphqlPaginatedResult> {
    // in your case, you will call your WebAPI function (wich needs to return a Promise)
    // for the demo purpose, we will call a mock WebAPI function
    const mockedResult = {
      // the dataset name is the only unknown property
      // will be the same defined in your GraphQL Service init, in our case GRAPHQL_QUERY_DATASET_NAME
      data: {
        [GRAPHQL_QUERY_DATASET_NAME]: {
          nodes: [],
          totalCount: 100
        }
      }
    };

    return new Promise<GraphqlPaginatedResult>(resolve => {
      setTimeout(() => {
        this.graphqlQuery = this.gridOptions.backendServiceApi.service.buildQuery();
        resolve(mockedResult);
      }, 150);
    });
  }

  goToFirstPage() {
    this.sgb?.paginationService?.goToFirstPage();
  }

  goToLastPage() {
    this.sgb?.paginationService?.goToLastPage();
  }

  /** Dispatched event of a Grid State Changed event */
  gridStateChanged(gridStateChanges: GridStateChange) {
    console.log('GraphQL sample, Grid State changed:: ', gridStateChanges);
  }

  saveCurrentGridState() {
    console.log('GraphQL current grid state', this.sgb?.gridStateService.getCurrentGridState());
  }

  setFiltersDynamically() {
    const presetLowestDay = moment().add(-2, 'days').format('YYYY-MM-DD');
    const presetHighestDay = moment().add(20, 'days').format('YYYY-MM-DD');

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

  async switchLanguage() {
    const nextLanguage = (this.selectedLanguage === 'en') ? 'fr' : 'en';
    await this.translateService.use(nextLanguage);
    this.selectedLanguage = nextLanguage;
    this.selectedLanguageFile = `${this.selectedLanguage}.json`;
  }
}
