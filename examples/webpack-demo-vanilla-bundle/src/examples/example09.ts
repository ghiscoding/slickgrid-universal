import { BindingEventService, Column, FieldType, Filters, GridOption, GridStateChange, Metrics, OperatorType, } from '@slickgrid-universal/common';
import { GridOdataService, OdataServiceApi, OdataOption } from '@slickgrid-universal/odata';
import { Slicker, SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';
import { ExampleGridOptions } from './example-grid-options';

const defaultPageSize = 20;

export class Example09 {
  private _bindingEventService: BindingEventService;
  columnDefinitions: Column[];
  gridOptions: GridOption;
  metrics: Metrics;
  sgb: SlickVanillaGridBundle;

  isCountEnabled = true;
  odataVersion = 2;
  odataQuery = '';
  processing = false;
  status = '';
  statusClass = 'is-success';

  constructor() {
    this._bindingEventService = new BindingEventService();
  }

  attached() {
    this.initializeGrid();
    const gridContainerElm = document.querySelector<HTMLDivElement>(`.grid9`);

    this._bindingEventService.bind(gridContainerElm, 'ongridstatechanged', this.gridStateChanged.bind(this));
    // this._bindingEventService.bind(gridContainerElm, 'onbeforeexporttoexcel', () => console.log('onBeforeExportToExcel'));
    // this._bindingEventService.bind(gridContainerElm, 'onafterexporttoexcel', () => console.log('onAfterExportToExcel'));
    this.sgb = new Slicker.GridBundle(gridContainerElm, this.columnDefinitions, { ...ExampleGridOptions, ...this.gridOptions }, []);
  }

  dispose() {
    if (this.sgb) {
      this.sgb?.dispose();
    }
    this._bindingEventService.unbindAll();
  }

  initializeGrid() {
    this.columnDefinitions = [
      {
        id: 'name', name: 'Name', field: 'name', sortable: true,
        type: FieldType.string,
        filterable: true,
        filter: {
          model: Filters.compoundInput
        }
      },
      {
        id: 'gender', name: 'Gender', field: 'gender', filterable: true,
        filter: {
          model: Filters.singleSelect,
          collection: [{ value: '', label: '' }, { value: 'male', label: 'male' }, { value: 'female', label: 'female' }]
        }
      },
      { id: 'company', name: 'Company', field: 'company' },
    ];

    this.gridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '.demo-container',
        rightPadding: 10
      },
      checkboxSelector: {
        // you can toggle these 2 properties to show the "select all" checkbox in different location
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: true
      },
      enableCellNavigation: true,
      enableFiltering: true,
      enableCheckboxSelector: true,
      enableRowSelection: true,
      enablePagination: true, // you could optionally disable the Pagination
      pagination: {
        pageSizes: [10, 20, 50, 100, 500],
        pageSize: defaultPageSize,
      },
      presets: {
        // you can also type operator as string, e.g.: operator: 'EQ'
        filters: [
          // { columnId: 'name', searchTerms: ['w'], operator: OperatorType.startsWith },
          { columnId: 'gender', searchTerms: ['male'], operator: OperatorType.equal },
        ],
        sorters: [
          // direction can be written as 'asc' (uppercase or lowercase) and/or use the SortDirection type
          { columnId: 'name', direction: 'asc' },
        ],
        pagination: { pageNumber: 2, pageSize: 20 }
      },
      backendServiceApi: {
        service: new GridOdataService(),
        options: {
          enableCount: this.isCountEnabled, // add the count in the OData query, which will return a property named "odata.count" (v2) or "@odata.count" (v4)
          version: this.odataVersion        // defaults to 2, the query string is slightly different between OData 2 and 4
        },
        preProcess: () => this.displaySpinner(true),
        process: (query) => this.getCustomerApiCall(query),
        postProcess: (response) => {
          this.metrics = response.metrics;
          this.displaySpinner(false);
          this.getCustomerCallback(response);
        }
      } as OdataServiceApi
    };
  }

  displaySpinner(isProcessing) {
    this.processing = isProcessing;
    this.status = (isProcessing) ? 'loading...' : 'finished!!';
    this.statusClass = (isProcessing) ? 'notification is-light is-warning' : 'notification is-light is-success';
  }

  getCustomerCallback(data) {
    // totalItems property needs to be filled for pagination to work correctly
    // however we need to force Aurelia to do a dirty check, doing a clone object will do just that
    let countPropName = 'totalRecordCount'; // you can use "totalRecordCount" or any name or "odata.count" when "enableCount" is set
    if (this.isCountEnabled) {
      countPropName = (this.odataVersion === 4) ? '@odata.count' : 'odata.count';
    }
    if (this.metrics) {
      this.metrics.totalItemCount = data[countPropName];
    }

    // once pagination totalItems is filled, we can update the dataset
    this.sgb.paginationOptions.totalItems = data[countPropName];
    this.sgb.dataset = data['items'];
    this.odataQuery = data['query'];
  }

  getCustomerApiCall(query) {
    // in your case, you will call your WebAPI function (wich needs to return a Promise)
    // for the demo purpose, we will call a mock WebAPI function
    return this.getCustomerDataApiMock(query);
  }

  /**
   * This function is only here to mock a WebAPI call (since we are using a JSON file for the demo)
   *  in your case the getCustomer() should be a WebAPI function returning a Promise
   */
  getCustomerDataApiMock(query) {
    // the mock is returning a Promise, just like a WebAPI typically does
    return new Promise((resolve) => {
      const queryParams = query.toLowerCase().split('&');
      let top: number;
      let skip = 0;
      let orderBy = '';
      let countTotalItems = 100;
      const columnFilters = {};

      for (const param of queryParams) {
        if (param.includes('$top=')) {
          top = +(param.substring('$top='.length));
        }
        if (param.includes('$skip=')) {
          skip = +(param.substring('$skip='.length));
        }
        if (param.includes('$orderby=')) {
          orderBy = param.substring('$orderby='.length);
        }
        if (param.includes('$filter=')) {
          const filterBy = param.substring('$filter='.length).replace('%20', ' ');
          if (filterBy.includes('contains')) {
            const filterMatch = filterBy.match(/contains\(([a-zA-Z\/]+),\s?'(.*?)'/);
            const fieldName = filterMatch[1].trim();
            columnFilters[fieldName] = { type: 'substring', term: filterMatch[2].trim() };
          }
          if (filterBy.includes('substringof')) {
            const filterMatch = filterBy.match(/substringof\('(.*?)',([a-zA-Z ]*)/);
            const fieldName = filterMatch[2].trim();
            columnFilters[fieldName] = { type: 'substring', term: filterMatch[1].trim() };
          }
          if (filterBy.includes('eq')) {
            const filterMatch = filterBy.match(/([a-zA-Z ]*) eq '(.*?)'/);
            if (Array.isArray(filterMatch)) {
              const fieldName = filterMatch[1].trim();
              columnFilters[fieldName] = { type: 'equal', term: filterMatch[2].trim() };
            }
          }
          if (filterBy.includes('startswith')) {
            const filterMatch = filterBy.match(/startswith\(([a-zA-Z ]*),\s?'(.*?)'/);
            const fieldName = filterMatch[1].trim();
            columnFilters[fieldName] = { type: 'starts', term: filterMatch[2].trim() };
          }
          if (filterBy.includes('endswith')) {
            const filterMatch = filterBy.match(/endswith\(([a-zA-Z ]*),\s?'(.*?)'/);
            const fieldName = filterMatch[1].trim();
            columnFilters[fieldName] = { type: 'ends', term: filterMatch[2].trim() };
          }
        }
      }

      const sort = orderBy.includes('asc')
        ? 'ASC'
        : orderBy.includes('desc')
          ? 'DESC'
          : '';

      let data;
      switch (sort) {
        case 'ASC':
          data = require('./data/customers_100_ASC.json');
          break;
        case 'DESC':
          data = require('./data/customers_100_DESC.json');
          break;
        default:
          data = require('./data/customers_100.json');
          break;
      }

      // Read the result field from the JSON response.
      const firstRow = skip;
      let filteredData = data;
      if (columnFilters) {
        for (const columnId in columnFilters) {
          if (columnFilters.hasOwnProperty(columnId)) {
            filteredData = filteredData.filter(column => {
              const filterType = columnFilters[columnId].type;
              const searchTerm = columnFilters[columnId].term;
              let colId = columnId;
              if (columnId && columnId.indexOf(' ') !== -1) {
                const splitIds = columnId.split(' ');
                colId = splitIds[splitIds.length - 1];
              }
              const filterTerm = column[colId];
              if (filterTerm) {
                switch (filterType) {
                  case 'equal': return filterTerm.toLowerCase() === searchTerm;
                  case 'ends': return filterTerm.toLowerCase().endsWith(searchTerm);
                  case 'starts': return filterTerm.toLowerCase().startsWith(searchTerm);
                  case 'substring': return filterTerm.toLowerCase().includes(searchTerm);
                }
              }
            });
          }
        }
        countTotalItems = filteredData.length;
      }
      const updatedData = filteredData.slice(firstRow, firstRow + top);

      setTimeout(() => {
        let countPropName = 'totalRecordCount';
        if (this.isCountEnabled) {
          countPropName = (this.odataVersion === 4) ? '@odata.count' : 'odata.count';
        }
        const backendResult = { items: updatedData, [countPropName]: countTotalItems, query };
        // console.log('Backend Result', backendResult);
        resolve(backendResult);
      }, 150);
    });
  }

  clearAllFiltersAndSorts() {
    if (this.sgb?.gridService) {
      this.sgb.gridService.clearAllFiltersAndSorts();
    }
  }

  goToFirstPage() {
    this.sgb?.paginationService?.goToFirstPage();
  }

  goToLastPage() {
    this.sgb?.paginationService?.goToLastPage();
  }

  /** Dispatched event of a Grid State Changed event */
  gridStateChanged(event) {
    if (event?.detail) {
      const gridStateChanges: GridStateChange = event.detail;
      // console.log('Client sample, Grid State changed:: ', gridStateChanges);
      console.log('Client sample, Grid State changed:: ', gridStateChanges.change);
    }
  }

  setFiltersDynamically() {
    // we can Set Filters Dynamically (or different filters) afterward through the FilterService
    this.sgb?.filterService.updateFilters([
      // { columnId: 'gender', searchTerms: ['male'], operator: OperatorType.equal },
      { columnId: 'name', searchTerms: ['A'], operator: 'a*' },
    ]);
  }

  setSortingDynamically() {
    this.sgb?.sortService.updateSorting([
      { columnId: 'name', direction: 'DESC' },
    ]);
  }

  // THE FOLLOWING METHODS ARE ONLY FOR DEMO PURPOSES DO NOT USE THIS CODE
  // ---

  changeCountEnableFlag() {
    this.isCountEnabled = !this.isCountEnabled;
    const odataService = this.gridOptions.backendServiceApi.service;
    odataService.updateOptions({ enableCount: this.isCountEnabled } as OdataOption);
    odataService.clearFilters();
    this.sgb?.filterService.clearFilters();
    return true;
  }

  setOdataVersion(version: number) {
    this.odataVersion = version;
    const odataService = this.gridOptions.backendServiceApi.service;
    odataService.updateOptions({ version: this.odataVersion } as OdataOption);
    odataService.clearFilters();
    this.sgb?.filterService.clearFilters();
    return true;
  }
}
