import { BindingEventService } from '@slickgrid-universal/binding';
import { type Column, FieldType, Filters, type GridOption, type GridStateChange, type Metrics, OperatorType, type GridState, } from '@slickgrid-universal/common';
import { GridOdataService, type OdataServiceApi, type OdataOption } from '@slickgrid-universal/odata';
import { Slicker, type SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';
import { ExampleGridOptions } from './example-grid-options';
import Data from './data/customers_100.json';
import './example09.scss';

const STORAGE_KEY = 'slickgrid-universal-example09-gridstate';
const defaultPageSize = 20;

export default class Example09 {
  private _bindingEventService: BindingEventService;
  columnDefinitions: Column[];
  gridOptions: GridOption;
  metrics: Metrics;
  sgb: SlickVanillaGridBundle;

  isCountEnabled = true;
  isSelectEnabled = false;
  isExpandEnabled = false;
  odataVersion = 2;
  odataQuery = '';
  processing = false;
  errorStatus = '';
  errorStatusClass = 'hidden';
  status = '';
  statusClass = 'is-success';
  isPageErrorTest = false;

  constructor() {
    this._bindingEventService = new BindingEventService();
    this.resetAllStatus();
  }

  attached() {
    this.initializeGrid();
    const gridContainerElm = document.querySelector(`.grid9`) as HTMLDivElement;

    this._bindingEventService.bind(gridContainerElm, 'ongridstatechanged', this.gridStateChanged.bind(this));
    // this._bindingEventService.bind(gridContainerElm, 'onbeforeexporttoexcel', () => console.log('onBeforeExportToExcel'));
    // this._bindingEventService.bind(gridContainerElm, 'onafterexporttoexcel', () => console.log('onAfterExportToExcel'));
    this.sgb = new Slicker.GridBundle(gridContainerElm, this.columnDefinitions, { ...ExampleGridOptions, ...this.gridOptions }, []);

    // you can optionally cancel the Filtering, Sorting or Pagination with code shown below
    // this._bindingEventService.bind(gridContainerElm, 'onbeforesort', (e) => {
    //   e.preventDefault();
    //   return false;
    // });
    // this._bindingEventService.bind(gridContainerElm, 'onbeforesearchchange', (e) => {
    //   e.preventDefault();
    //   return false;
    // });
    // this._bindingEventService.bind(gridContainerElm, 'onbeforepaginationchange', (e) => {
    //   e.preventDefault();
    //   return false;
    // });
  }

  dispose() {
    if (this.sgb) {
      this.sgb?.dispose();
    }
    this._bindingEventService.unbindAll();
    this.resetAllStatus();
  }

  resetAllStatus() {
    this.status = '';
    this.errorStatus = '';
    this.statusClass = 'is-success';
    this.errorStatusClass = 'hidden';
  }

  initializeGrid() {
    this.columnDefinitions = [
      {
        id: 'name', name: 'Name', field: 'name', sortable: true,
        type: FieldType.string,
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
        id: 'gender', name: 'Gender', field: 'gender', filterable: true, sortable: true,
        filter: {
          model: Filters.singleSelect,
          collection: [{ value: '', label: '' }, { value: 'male', label: 'male' }, { value: 'female', label: 'female' }]
        }
      },
      { id: 'company', name: 'Company', field: 'company', filterable: true, sortable: true },
      { id: 'category_name', name: 'Category', field: 'category/name', filterable: true, sortable: true }
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
      compoundOperatorAltTexts: {
        // where '=' is any of the `OperatorString` type shown above
        text: { 'Custom': { operatorAlt: '%%', descAlt: 'SQL Like' } },
      },
      enableCellNavigation: true,
      enableFiltering: true,
      enableCheckboxSelector: true,
      enableRowSelection: true,
      enablePagination: true, // you could optionally disable the Pagination
      pagination: {
        pageSizes: [10, 20, 50, 100, 500, 50000],
        pageSize: defaultPageSize,
      },
      presets: localStorage.getItem(STORAGE_KEY) ? JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as GridState : {
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
          enableCount: this.isCountEnabled, // add the count in the OData query, which will return a property named "__count" (v2) or "@odata.count" (v4)
          enableSelect: this.isSelectEnabled,
          enableExpand: this.isExpandEnabled,
          filterQueryOverride: (args) => {
            const { fieldName, columnDef, columnFilterOperator, searchValue } = args;
            if (columnFilterOperator === OperatorType.custom && columnDef?.id === 'name') {
              let matchesSearch = (searchValue as string).replace(/\*/g, '.*');
              matchesSearch = matchesSearch.slice(0, 1) + '%5E' + matchesSearch.slice(1);
              matchesSearch = matchesSearch.slice(0, -1) + '$\'';

              return `matchesPattern(${fieldName}, ${matchesSearch})`;
            }
          },
          version: this.odataVersion        // defaults to 2, the query string is slightly different between OData 2 and 4
        },
        onError: (error: Error) => {
          this.errorStatus = error.message;
          this.errorStatusClass = 'visible notification is-light is-danger is-small is-narrow';
          this.displaySpinner(false, true);
        },
        preProcess: () => {
          this.errorStatus = '';
          this.errorStatusClass = 'hidden';
          this.displaySpinner(true);
        },
        process: (query) => this.getCustomerApiCall(query),
        postProcess: (response) => {
          this.metrics = response.metrics;
          this.displaySpinner(false);
          this.getCustomerCallback(response);
        },
      } as OdataServiceApi
    };
  }

  displaySpinner(isProcessing, isError?: boolean) {
    this.processing = isProcessing;

    if (isError) {
      this.status = 'ERROR!!!';
      this.statusClass = 'notification is-light is-danger';
    } else {
      this.status = (isProcessing) ? 'loading...' : 'finished!!';
      this.statusClass = (isProcessing) ? 'notification is-light is-warning' : 'notification is-light is-success';
    }
  }

  getCustomerCallback(data) {
    // totalItems property needs to be filled for pagination to work correctly
    // however we need to force Aurelia to do a dirty check, doing a clone object will do just that
    let totalItemCount: number = data['totalRecordCount']; // you can use "totalRecordCount" or any name or "odata.count" when "enableCount" is set
    if (this.isCountEnabled) {
      totalItemCount = (this.odataVersion === 4) ? data['@odata.count'] : data['d']['__count'];
    }
    if (this.metrics) {
      this.metrics.totalItemCount = totalItemCount;
    }

    // once pagination totalItems is filled, we can update the dataset
    this.sgb.paginationOptions!.totalItems = totalItemCount;
    this.sgb.dataset = this.odataVersion === 4 ? data.value : data.d.results;
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
  getCustomerDataApiMock(query): Promise<any> {
    this.errorStatusClass = 'hidden';

    // the mock is returning a Promise, just like a WebAPI typically does
    return new Promise((resolve) => {
      const queryParams = query.toLowerCase().split('&');
      let top = 0;
      let skip = 0;
      let orderBy = '';
      let countTotalItems = 100;
      const columnFilters = {};

      if (this.isPageErrorTest) {
        this.isPageErrorTest = false;
        throw new Error('Server timed out trying to retrieve data for the last page');
      }

      for (const param of queryParams) {
        if (param.includes('$top=')) {
          top = +(param.substring('$top='.length));
          if (top === 50000) {
            throw new Error('Server timed out retrieving 50,000 rows');
          }
        }
        if (param.includes('$skip=')) {
          skip = +(param.substring('$skip='.length));
        }
        if (param.includes('$orderby=')) {
          orderBy = param.substring('$orderby='.length);
        }
        if (param.includes('$filter=')) {
          const filterBy = param.substring('$filter='.length).replace('%20', ' ');
          if (filterBy.includes('matchespattern')) {
            const filterMatch = filterBy.match(/matchespattern\(([a-zA-Z]+),\s'%5e(.*?)'\)/i);
            const fieldName = filterMatch[1].trim();
            columnFilters[fieldName] = { type: 'matchespattern', term: '^' + filterMatch[2].trim() };
          }
          if (filterBy.includes('contains')) {
            const filterMatch = filterBy.match(/contains\(([a-zA-Z/]+),\s?'(.*?)'/);
            const fieldName = filterMatch[1].trim();
            columnFilters[fieldName] = { type: 'substring', term: filterMatch[2].trim() };
          }
          if (filterBy.includes('substringof')) {
            const filterMatch = filterBy.match(/substringof\('(.*?)',\s([a-zA-Z/]+)/);
            const fieldName = filterMatch[2].trim();
            columnFilters[fieldName] = { type: 'substring', term: filterMatch[1].trim() };
          }
          for (const operator of ['eq', 'ne', 'le', 'lt', 'gt', 'ge']) {
            if (filterBy.includes(operator)) {
              const re = new RegExp(`([a-zA-Z ]*) ${operator} '(.*?)'`);
              const filterMatch = re.exec(filterBy);
              if (Array.isArray(filterMatch)) {
                const fieldName = filterMatch[1].trim();
                columnFilters[fieldName] = { type: operator, term: filterMatch[2].trim() };
              }
            }
          }
          if (filterBy.includes('startswith') && filterBy.includes('endswith')) {
            const filterStartMatch = filterBy.match(/startswith\(([a-zA-Z ]*),\s?'(.*?)'/);
            const filterEndMatch = filterBy.match(/endswith\(([a-zA-Z ]*),\s?'(.*?)'/);
            const fieldName = filterStartMatch[1].trim();
            columnFilters[fieldName] = { type: 'starts+ends', term: [filterStartMatch[2].trim(), filterEndMatch[2].trim()] };
          } else if (filterBy.includes('startswith')) {
            const filterMatch = filterBy.match(/startswith\(([a-zA-Z ]*),\s?'(.*?)'/);
            const fieldName = filterMatch[1].trim();
            columnFilters[fieldName] = { type: 'starts', term: filterMatch[2].trim() };
          } else if (filterBy.includes('endswith')) {
            const filterMatch = filterBy.match(/endswith\(([a-zA-Z ]*),\s?'(.*?)'/);
            const fieldName = filterMatch[1].trim();
            columnFilters[fieldName] = { type: 'ends', term: filterMatch[2].trim() };
          }

          // simular a backend error when trying to sort on the "Company" field
          if (filterBy.includes('company')) {
            throw new Error('Server could not filter using the field "Company"');
          }
        }
      }

      // simulate a backend error when trying to sort on the "Company" field
      if (orderBy.includes('company')) {
        throw new Error('Server could not sort using the field "Company"');
      }

      // read the JSON and create a fresh copy of the data that we are free to modify
      let data = Data as unknown as { name: string; gender: string; company: string; id: string, category: { id: string; name: string; }; }[];
      data = JSON.parse(JSON.stringify(data));

      // Sort the data
      if (orderBy?.length > 0) {
        const orderByClauses = orderBy.split(',');
        for (const orderByClause of orderByClauses) {
          const orderByParts = orderByClause.split(' ');
          const orderByField = orderByParts[0];

          let selector = (obj: any): string => obj;
          for (const orderByFieldPart of orderByField.split('/')) {
            const prevSelector = selector;
            selector = (obj: any) => {
              return prevSelector(obj)[orderByFieldPart];
            };
          }

          const sort = orderByParts[1] ?? 'asc';
          switch (sort.toLocaleLowerCase()) {
            case 'asc':
              data = data.sort((a, b) => selector(a).localeCompare(selector(b)));
              break;
            case 'desc':
              data = data.sort((a, b) => selector(b).localeCompare(selector(a)));
              break;
          }
        }
      }

      // Read the result field from the JSON response.
      let firstRow = skip;
      let filteredData = data;
      if (columnFilters) {
        for (const columnId in columnFilters) {
          if (columnFilters.hasOwnProperty(columnId)) {
            filteredData = filteredData.filter(column => {
              const filterType = columnFilters[columnId].type;
              const searchTerm = columnFilters[columnId].term;
              let colId = columnId;
              if (columnId?.indexOf(' ') !== -1) {
                const splitIds = columnId.split(' ');
                colId = splitIds[splitIds.length - 1];
              }

              let filterTerm;
              let col = column;
              for (const part of colId.split('/')) {
                filterTerm = col[part];
                col = filterTerm;
              }

              if (filterTerm) {
                const [term1, term2] = Array.isArray(searchTerm) ? searchTerm : [searchTerm];

                switch (filterType) {
                  case 'eq': return filterTerm.toLowerCase() === term1;
                  case 'ne': return filterTerm.toLowerCase() !== term1;
                  case 'le': return filterTerm.toLowerCase() <= term1;
                  case 'lt': return filterTerm.toLowerCase() < term1;
                  case 'gt': return filterTerm.toLowerCase() > term1;
                  case 'ge': return filterTerm.toLowerCase() >= term1;
                  case 'ends': return filterTerm.toLowerCase().endsWith(term1);
                  case 'starts': return filterTerm.toLowerCase().startsWith(term1);
                  case 'starts+ends': return filterTerm.toLowerCase().startsWith(term1) && filterTerm.toLowerCase().endsWith(term2);
                  case 'substring': return filterTerm.toLowerCase().includes(term1);
                  case 'matchespattern': return new RegExp((term1 as string).replaceAll('%25', '.*'), 'i').test(filterTerm);
                }
              }
            });
          }
        }
        countTotalItems = filteredData.length;
      }

      // make sure page skip is not out of boundaries, if so reset to first page & remove skip from query
      if (firstRow > filteredData.length) {
        query = query.replace(`$skip=${firstRow}`, '');
        firstRow = 0;
      }
      const updatedData = filteredData.slice(firstRow, firstRow + top);

      setTimeout(() => {
        const backendResult = { query };
        if (!this.isCountEnabled) {
          backendResult['totalRecordCount'] = countTotalItems;
        }

        if (this.odataVersion === 4) {
          backendResult['value'] = updatedData;
          if (this.isCountEnabled) {
            backendResult['@odata.count'] = countTotalItems;
          }
        } else {
          backendResult['d'] = { results: updatedData };
          if (this.isCountEnabled) {
            backendResult['d']['__count'] = countTotalItems;
          }
        }

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

      localStorage.setItem(STORAGE_KEY, JSON.stringify(gridStateChanges.gridState));
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

  clearLocalStorage() {
    localStorage.removeItem(STORAGE_KEY);
  }

  throwPageChangeError() {
    this.isPageErrorTest = true;
    this.sgb.paginationService.goToLastPage();
  }

  // THE FOLLOWING METHODS ARE ONLY FOR DEMO PURPOSES DO NOT USE THIS CODE
  // ---

  changeCountEnableFlag() {
    this.isCountEnabled = !this.isCountEnabled;
    this.resetOptions({ enableCount: this.isCountEnabled });
    return true;
  }

  changeEnableSelectFlag() {
    this.isSelectEnabled = !this.isSelectEnabled;
    this.resetOptions({ enableSelect: this.isSelectEnabled });
    return true;
  }

  changeEnableExpandFlag() {
    this.isExpandEnabled = !this.isExpandEnabled;
    this.resetOptions({ enableExpand: this.isExpandEnabled });
    return true;
  }

  setOdataVersion(version: number) {
    this.odataVersion = version;
    this.resetOptions({ version: this.odataVersion });
    return true;
  }

  private resetOptions(options: Partial<OdataOption>) {
    const odataService = this.gridOptions.backendServiceApi!.service;
    odataService.updateOptions(options);
    odataService.clearFilters?.();
    this.sgb?.filterService.clearFilters();
  }
}
