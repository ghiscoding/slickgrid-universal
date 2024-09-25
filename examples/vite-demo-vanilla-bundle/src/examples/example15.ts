import { BindingEventService } from '@slickgrid-universal/binding';
import { type Column, Editors, FieldType, Filters, type GridOption, type GridStateChange, type Metrics, OperatorType, } from '@slickgrid-universal/common';
import { SlickCustomTooltip } from '@slickgrid-universal/custom-tooltip-plugin';
import { GridOdataService, type OdataServiceApi, type OdataOption } from '@slickgrid-universal/odata';
import { RxJsResource } from '@slickgrid-universal/rxjs-observable';
import { Slicker, type SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';
import { delay, Observable, of, type Subject } from 'rxjs';

import { ExampleGridOptions } from './example-grid-options';
import Data from './data/customers_100.json';
import './example15.scss';

const defaultPageSize = 20;

export default class Example15 {
  private _bindingEventService: BindingEventService;
  columnDefinitions: Column[];
  gridOptions: GridOption;
  metrics: Metrics;
  sgb: SlickVanillaGridBundle;

  isCountEnabled = true;
  odataVersion = 2;
  odataQuery = '';
  processing = false;
  errorStatus = '';
  errorStatusClass = '';
  status = '';
  statusClass = 'is-success';
  isOtherGenderAdded = false;
  isPageErrorTest = false;
  genderCollection = [{ value: 'male', label: 'male' }, { value: 'female', label: 'female' }];

  constructor() {
    this._bindingEventService = new BindingEventService();
    this.resetAllStatus();
  }

  attached() {
    this.initializeGrid();
    const gridContainerElm = document.querySelector(`.grid15`) as HTMLDivElement;

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
        editor: {
          model: Editors.text,
        },
        filter: {
          model: Filters.compoundInput
        },
      },
      {
        id: 'gender', name: 'Gender', field: 'gender', filterable: true,
        editor: {
          model: Editors.singleSelect,
          // collection: this.genderCollection,
          collectionAsync: of(this.genderCollection)
        },
        filter: {
          model: Filters.singleSelect,
          collectionAsync: of(this.genderCollection),
          collectionOptions: {
            addBlankEntry: true
          }
        }
      },
      {
        id: 'company', name: 'Company', field: 'company', filterable: true, sortable: true,
        customTooltip: {
          // you can use the Custom Tooltip in 2 ways (synchronous or asynchronous)
          // example 1 (sync):
          // formatter: this.tooltipCompanyAddressFormatter.bind(this),

          // example 2 (async w/Observable):
          // when using async, the `formatter` will contain the loading spinner
          // you will need to provide an `asyncPost` function returning a Promise and also `asyncPostFormatter` formatter to display the result once the Promise resolves
          formatter: () => `<div><span class="mdi mdi-load mdi-spin-1s"></span> loading...</div>`,
          asyncProcess: (_row, _cell, _value, _column, dataContext) => new Observable((observer) => {
            observer.next({
              // return random door number & zip code to simulare company address
              doorNumber: dataContext.id + 100,
              zip: dataContext.id + 600000
            });
            observer.complete();
          }).pipe(delay(150)),
          asyncPostFormatter: this.tooltipCompanyAddressFormatter,

          // optional conditional usability callback
          // usabilityOverride: (args) => !!(args.dataContext?.id % 2) // show it only every second row
        },
      },
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
      editable: true,
      autoEdit: true,
      autoCommitEdit: true,
      rowHeight: 33,
      headerRowHeight: 35,
      enableCellNavigation: true,
      enableFiltering: true,
      enableCheckboxSelector: true,
      enableRowSelection: true,
      enablePagination: true, // you could optionally disable the Pagination
      pagination: {
        pageSizes: [10, 20, 50, 100, 500, 50000],
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
        }
      } as OdataServiceApi,
      externalResources: [new RxJsResource(), new SlickCustomTooltip()]
    };
  }

  addOtherGender() {
    const newGender = { value: 'other', label: 'other' };
    const genderColumn = this.columnDefinitions.find((column: Column) => column.id === 'gender');

    if (genderColumn) {
      let editorCollection = genderColumn.editor!.collection;
      const filterCollectionAsync = genderColumn.filter!.collectionAsync as Subject<any>;

      if (Array.isArray(editorCollection)) {
        // refresh the Editor "collection", we have 2 ways of doing it

        // 1. simply Push to the Editor "collection"
        // editorCollection.push(newGender);

        // 2. or replace the entire "collection"
        genderColumn.editor!.collection = [...this.genderCollection, newGender];
        editorCollection = genderColumn.editor!.collection;

        // However, for the Filter only, we have to trigger an RxJS/Subject change with the new collection
        // we do this because Filter(s) are shown at all time, while on Editor it's unnecessary since they are only shown when opening them
        if (filterCollectionAsync?.next) {
          filterCollectionAsync.next(editorCollection);
          filterCollectionAsync.complete();
        }
      }
    }

    // don't add it more than once
    this.isOtherGenderAdded = true;
  }

  displaySpinner(isProcessing, isError?: boolean) {
    this.processing = isProcessing;
    this.status = (isProcessing) ? 'loading...' : 'finished!!';
    this.statusClass = (isProcessing) ? 'notification is-light is-warning' : 'notification is-light is-success';
    if (isError) {
      this.status = 'ERROR!!!';
      this.statusClass = 'notification is-light is-danger';
    }
  }

  getCustomerCallback(data) {
    // totalItems property needs to be filled for pagination to work correctly
    // however we need to force a dirty check, doing a clone object will do just that
    let countPropName = 'totalRecordCount'; // you can use "totalRecordCount" or any name or "odata.count" when "enableCount" is set
    if (this.isCountEnabled) {
      countPropName = (this.odataVersion === 4) ? '@odata.count' : 'odata.count';
    }
    if (this.metrics) {
      this.metrics.totalItemCount = data[countPropName];
    }

    // once pagination totalItems is filled, we can update the dataset
    this.sgb.paginationOptions!.totalItems = data[countPropName];
    this.sgb.dataset = data['items'];
    this.odataQuery = data['query'];
  }

  getCustomerApiCall(query): Observable<any> {
    // in your case, you will call your WebAPI function (wich needs to return an Observable)
    // for the demo purpose, we will call a mock WebAPI function
    return this.getCustomerDataApiMock(query);
  }

  /**
   * This function is only here to mock a WebAPI call (since we are using a JSON file for the demo)
   *  in your case the getCustomer() should be a WebAPI function returning a Promise
   */
  getCustomerDataApiMock(query): Observable<any> {
    // the mock is returning an Observable
    return new Observable((observer) => {
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
          if (filterBy.includes('contains')) {
            const filterMatch = filterBy.match(/contains\(([a-zA-Z/]+),\s?'(.*?)'/);
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

      // simular a backend error when trying to sort on the "Company" field
      if (orderBy.includes('company')) {
        throw new Error('Server could not sort using the field "Company"');
      }

      const sort = orderBy.includes('asc')
        ? 'ASC'
        : orderBy.includes('desc')
          ? 'DESC'
          : '';

      let data = Data as unknown as { name: string; gender: string; company: string; id: string, category: { id: string; name: string; }; }[];
      switch (sort) {
        case 'ASC':
          data = data.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'DESC':
          data = data.sort((a, b) => b.name.localeCompare(a.name));
          break;
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
              const filterTerm = column[colId];

              if (filterTerm) {
                const [term1, term2] = Array.isArray(searchTerm) ? searchTerm : [searchTerm];
                switch (filterType) {
                  case 'eq':
                  case 'equal': return filterTerm.toLowerCase() === term1;
                  case 'ne': return filterTerm.toLowerCase() !== term1;
                  case 'le': return filterTerm.toLowerCase() <= term1;
                  case 'lt': return filterTerm.toLowerCase() < term1;
                  case 'gt': return filterTerm.toLowerCase() > term1;
                  case 'ge': return filterTerm.toLowerCase() >= term1;
                  case 'ends': return filterTerm.toLowerCase().endsWith(term1);
                  case 'starts': return filterTerm.toLowerCase().startsWith(term1);
                  case 'starts+ends': return filterTerm.toLowerCase().startsWith(term1) && filterTerm.toLowerCase().endsWith(term2);
                  case 'substring': return filterTerm.toLowerCase().includes(term1);
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

      window.setTimeout(() => {
        let countPropName = 'totalRecordCount';
        if (this.isCountEnabled) {
          countPropName = (this.odataVersion === 4) ? '@odata.count' : 'odata.count';
        }
        const backendResult = { items: updatedData, [countPropName]: countTotalItems, query };
        // console.log('Backend Result', backendResult);
        observer.next(backendResult);
        observer.complete();
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

  throwPageChangeError() {
    this.isPageErrorTest = true;
    this.sgb.paginationService.goToLastPage();
  }

  tooltipCompanyAddressFormatter(_row, _cell, _value, _column, dataContext) {
    const tooltipTitle = `${dataContext.company} - Address Tooltip`;

    // display random address and zip code to simulate company address
    const randomStreet = dataContext.id % 3 ? 'Belleville' : 'Hollywood';
    return `<div class="text-color-se-danger text-bold">${tooltipTitle}</div>
      <div class="tooltip-2cols-row"><div>Address:</div> <div>${dataContext.__params.doorNumber.toFixed(0)} ${randomStreet} blvd</div></div>
      <div class="tooltip-2cols-row"><div>Zip:</div> <div>${dataContext.__params.zip.toFixed(0)}</div></div>`;
  }

  // THE FOLLOWING METHODS ARE ONLY FOR DEMO PURPOSES DO NOT USE THIS CODE
  // ---

  changeCountEnableFlag(checked: boolean) {
    this.displaySpinner(true);
    this.isCountEnabled = checked;
    const odataService = this.gridOptions.backendServiceApi!.service;
    odataService.updateOptions({ enableCount: this.isCountEnabled } as OdataOption);
    odataService.clearFilters?.();
    this.sgb?.filterService.clearFilters();
    return true;
  }

  setOdataVersion(version: number) {
    this.displaySpinner(true);
    this.odataVersion = version;
    const odataService = this.gridOptions.backendServiceApi!.service;
    odataService.updateOptions({ version: this.odataVersion } as OdataOption);
    odataService.clearFilters?.();
    this.sgb?.filterService.clearFilters();
    return true;
  }
}
