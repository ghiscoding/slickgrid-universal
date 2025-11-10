import { GridOdataService, type OdataOption, type OdataServiceApi } from '@slickgrid-universal/odata';
import { RxJsResource } from '@slickgrid-universal/rxjs-observable';
import React, { useEffect, useRef, useState } from 'react';
import { Observable, of, type Subject } from 'rxjs';
import {
  Editors,
  Filters,
  OperatorType,
  SlickgridReact,
  type Column,
  type GridOption,
  type GridStateChange,
  type Metrics,
  type Pagination,
  type SlickgridReactInstance,
} from 'slickgrid-react';
import Data from './data/customers_100.json';

const defaultPageSize = 20;

const Example31: React.FC = () => {
  const [columnDefinitions, setColumnDefinitions] = useState<Column[]>([]);
  const [dataset, setDataset] = useState<any[]>([]);
  const [isOtherGenderAdded, setIsOtherGenderAdded] = useState(false);
  const [isCountEnabled, setIsCountEnabled] = useState(true);
  const [isSelectEnabled, setIsSelectEnabled] = useState(false);
  const [isExpandEnabled, setIsExpandEnabled] = useState(false);
  const [metrics, setMetrics] = useState({} as Metrics);
  const [status, setStatus] = useState({ class: '', text: '' });
  const [odataVersion, setOdataVersion] = useState(2);
  const [odataQuery, setOdataQuery] = useState('');
  const [paginationOptions, setPaginationOptions] = useState<Pagination | undefined>(undefined);
  const [genderCollection] = useState([
    { value: 'male', label: 'male' },
    { value: 'female', label: 'female' },
  ]);
  const [hideSubTitle, setHideSubTitle] = useState(false);

  const gridOptionsRef = useRef<GridOption | null>(null);
  const reactGridRef = useRef<SlickgridReactInstance | null>(null);

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
        name: 'Name',
        field: 'name',
        sortable: true,
        filterable: true,
        filter: {
          model: Filters.compoundInput,
        },
      },
      {
        id: 'gender',
        name: 'Gender',
        field: 'gender',
        filterable: true,
        editor: {
          model: Editors.singleSelect,
          // collection: genderCollection,
          collectionAsync: of(genderCollection),
        },
        filter: {
          model: Filters.singleSelect,
          collectionAsync: of(genderCollection),
          collectionOptions: {
            addBlankEntry: true,
          },
        },
      },
      { id: 'company', name: 'Company', field: 'company', filterable: true, sortable: true },
      { id: 'category_name', name: 'Category', field: 'category/name', filterable: true, sortable: true },
    ];

    const gridOptions: GridOption = {
      enableAutoResize: true,
      autoResize: {
        container: '#demo-container',
        rightPadding: 10,
      },
      checkboxSelector: {
        // you can toggle these 2 properties to show the "select all" checkbox in different location
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: true,
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
        pageSizes: [10, 20, 50, 100, 500],
        pageSize: defaultPageSize,
        totalItems: 0,
      },
      presets: {
        // you can also type operator as string, e.g.: operator: 'EQ'
        filters: [{ columnId: 'gender', searchTerms: ['male'], operator: OperatorType.equal }],
        sorters: [
          // direction can be written as 'asc' (uppercase or lowercase) and/or use the SortDirection type
          { columnId: 'name', direction: 'asc' },
        ],
        pagination: { pageNumber: 2, pageSize: 20 },
      },
      backendServiceApi: {
        service: new GridOdataService(),
        options: {
          enableCount: isCountEnabled, // add the count in the OData query, which will return a property named "__count" (v2) or "@odata.count" (v4)
          enableSelect: isSelectEnabled,
          enableExpand: isExpandEnabled,
          version: odataVersion, // defaults to 2, the query string is slightly different between OData 2 and 4
        },
        preProcess: () => {
          displaySpinner(true);
        },
        process: (query) => getCustomerApiCall(query),
        postProcess: (response) => {
          setMetrics(response.metrics);
          getCustomerCallback(response);
          displaySpinner(false);
        },
      } as OdataServiceApi,
      externalResources: [new RxJsResource()],
    };

    setColumnDefinitions(columnDefinitions);
    gridOptionsRef.current = gridOptions;
  }

  function addOtherGender() {
    const newGender = { value: 'other', label: 'other' };
    const genderColumn = columnDefinitions.find((column: Column) => column.id === 'gender');

    if (genderColumn) {
      let editorCollection = genderColumn.editor!.collection;
      const filterCollectionAsync = genderColumn.filter!.collectionAsync as Subject<any>;

      if (Array.isArray(editorCollection)) {
        // refresh the Editor "collection", we have 2 ways of doing it

        // 1. simply Push to the Editor "collection"
        // editorCollection.push(newGender);

        // 2. or replace the entire "collection"
        genderColumn.editor!.collection = [...genderCollection, newGender];
        editorCollection = genderColumn.editor!.collection;

        // However, for the Filter only, we have to trigger an RxJS/Subject change with the new collection
        // we do this because Filter(s) are shown at all time, while on Editor it's unnecessary since they are only shown when opening them
        if (filterCollectionAsync?.next) {
          filterCollectionAsync.next(editorCollection);
        }
      }
    }

    // don't add it more than once
    setIsOtherGenderAdded(true);
  }

  function displaySpinner(isProcessing: boolean) {
    const newStatus = isProcessing
      ? { text: 'loading...', class: 'col-md-2 alert alert-warning' }
      : { text: 'finished!!', class: 'col-md-2 alert alert-success' };

    setStatus(newStatus);
  }

  function getCustomerCallback(data: any) {
    // totalItems property needs to be filled for pagination to work correctly
    // however we need to force React to do a dirty check, doing a clone object will do just that
    let totalItemCount: number = data['totalRecordCount']; // you can use "totalRecordCount" or any name or "odata.count" when "enableCount" is set
    if (isCountEnabled) {
      totalItemCount = odataVersion === 4 ? data['@odata.count'] : data['d']['__count'];
    }

    // once pagination totalItems is filled, we can update the dataset
    setPaginationOptions({ ...gridOptionsRef.current!.pagination, totalItems: totalItemCount } as Pagination);
    setDataset(odataVersion === 4 ? data.value : data.d.results);
    setOdataQuery(data['query']);
    setMetrics({ ...metrics, totalItemCount });

    // Slickgrid-React requires the user to update pagination via this pubsub publish
    reactGridRef.current?.eventPubSubService?.publish(
      'onPaginationOptionsChanged',
      { ...gridOptionsRef.current!.pagination, totalItems: totalItemCount } as Pagination,
      1
    );
  }

  function getCustomerApiCall(query: string) {
    // in your case, you will call your WebAPI function (wich needs to return an Observable)
    // for the demo purpose, we will call a mock WebAPI function
    return getCustomerDataApiMock(query);
  }

  /**
   * This function is only here to mock a WebAPI call (since we are using a JSON file for the demo)
   *  in your case the getCustomer() should be a WebAPI function returning a Promise
   */
  function getCustomerDataApiMock(query: string): Observable<any> {
    // the mock is returning an Observable
    return new Observable((observer) => {
      const queryParams = query.toLowerCase().split('&');
      let top: number;
      let skip = 0;
      let orderBy = '';
      let countTotalItems = 100;
      const columnFilters = {};

      for (const param of queryParams) {
        if (param.includes('$top=')) {
          top = +param.substring('$top='.length);
        }
        if (param.includes('$skip=')) {
          skip = +param.substring('$skip='.length);
        }
        if (param.includes('$orderby=')) {
          orderBy = param.substring('$orderby='.length);
        }
        if (param.includes('$filter=')) {
          const filterBy = param.substring('$filter='.length).replace('%20', ' ');
          if (filterBy.includes('contains')) {
            const filterMatch = filterBy.match(/contains\(([a-zA-Z/]+),\s?'(.*?)'/);
            const fieldName = filterMatch![1].trim();
            (columnFilters as any)[fieldName] = { type: 'substring', term: filterMatch![2].trim() };
          }
          if (filterBy.includes('substringof')) {
            const filterMatch = filterBy.match(/substringof\('(.*?)',\s([a-zA-Z/]+)/);
            const fieldName = filterMatch![2].trim();
            (columnFilters as any)[fieldName] = { type: 'substring', term: filterMatch![1].trim() };
          }
          if (filterBy.includes('eq')) {
            const filterMatch = filterBy.match(/([a-zA-Z ]*) eq '(.*?)'/);
            if (Array.isArray(filterMatch)) {
              const fieldName = filterMatch![1].trim();
              (columnFilters as any)[fieldName] = { type: 'equal', term: filterMatch![2].trim() };
            }
          }
          if (filterBy.includes('startswith')) {
            const filterMatch = filterBy.match(/startswith\(([a-zA-Z ]*),\s?'(.*?)'/);
            const fieldName = filterMatch![1].trim();
            (columnFilters as any)[fieldName] = { type: 'starts', term: filterMatch![2].trim() };
          }
          if (filterBy.includes('endswith')) {
            const filterMatch = filterBy.match(/endswith\(([a-zA-Z ]*),\s?'(.*?)'/);
            const fieldName = filterMatch![1].trim();
            (columnFilters as any)[fieldName] = { type: 'ends', term: filterMatch![2].trim() };
          }
        }
      }

      // read the JSON and create a fresh copy of the data that we are free to modify
      let data = Data as unknown as { name: string; gender: string; company: string; id: string; category: { id: string; name: string; }; }[];
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
              return prevSelector(obj)[orderByFieldPart as any];
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
            filteredData = filteredData.filter((column) => {
              const filterType = (columnFilters as any)[columnId].type;
              const searchTerm = (columnFilters as any)[columnId].term;
              let colId = columnId;
              if (columnId && columnId.indexOf(' ') !== -1) {
                const splitIds = columnId.split(' ');
                colId = splitIds[splitIds.length - 1];
              }

              let filterTerm;
              let col = column;
              for (const part of colId.split('/')) {
                filterTerm = (col as any)[part];
                col = filterTerm;
              }

              if (filterTerm) {
                switch (filterType) {
                  case 'equal':
                    return filterTerm.toLowerCase() === searchTerm;
                  case 'ends':
                    return filterTerm.toLowerCase().endsWith(searchTerm);
                  case 'starts':
                    return filterTerm.toLowerCase().startsWith(searchTerm);
                  case 'substring':
                    return filterTerm.toLowerCase().includes(searchTerm);
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
      const updatedData = filteredData.slice(firstRow, firstRow + top!);

      setTimeout(() => {
        const backendResult: any = { query };
        if (!isCountEnabled) {
          backendResult['totalRecordCount'] = countTotalItems;
        }

        if (odataVersion === 4) {
          backendResult['value'] = updatedData;
          if (isCountEnabled) {
            backendResult['@odata.count'] = countTotalItems;
          }
        } else {
          backendResult['d'] = { results: updatedData };
          if (isCountEnabled) {
            backendResult['d']['__count'] = countTotalItems;
          }
        }

        observer.next(backendResult);
        observer.complete();
      }, 150);
    });
  }

  function clearAllFiltersAndSorts() {
    reactGridRef.current?.gridService.clearAllFiltersAndSorts();
  }

  function goToFirstPage() {
    reactGridRef.current?.paginationService!.goToFirstPage();
  }

  function goToLastPage() {
    reactGridRef.current?.paginationService!.goToLastPage();
  }

  /** Dispatched event of a Grid State Changed event */
  function gridStateChanged(gridStateChanges: GridStateChange) {
    // console.log('Client sample, Grid State changed:: ', gridStateChanges);
    console.log('Client sample, Grid State changed:: ', gridStateChanges.change);
  }

  function setFiltersDynamically() {
    // we can Set Filters Dynamically (or different filters) afterward through the FilterService
    reactGridRef.current?.filterService.updateFilters([
      // { columnId: 'gender', searchTerms: ['male'], operator: OperatorType.equal },
      { columnId: 'name', searchTerms: ['A'], operator: 'a*' },
    ]);
  }

  function setSortingDynamically() {
    reactGridRef.current?.sortService.updateSorting([{ columnId: 'name', direction: 'DESC' }]);
  }

  // YOU CAN CHOOSE TO PREVENT EVENT FROM BUBBLING IN THE FOLLOWING 3x EVENTS
  // note however that internally the cancelling the search is more of a rollback
  function handleOnBeforeSort(_e: Event) {
    // e.preventDefault();
    // return false;
    return true;
  }

  function handleOnBeforeSearchChange(_e: Event) {
    // e.preventDefault();
    // return false;
    return true;
  }

  function handleOnBeforePaginationChange(_e: Event) {
    // e.preventDefault();
    // return false;
    return true;
  }

  // THE FOLLOWING METHODS ARE ONLY FOR DEMO PURPOSES DO NOT USE THIS CODE
  // ---

  function changeCountEnableFlag() {
    displaySpinner(true);
    const newIsCountEnabled = !isCountEnabled;
    setIsCountEnabled(newIsCountEnabled);
    resetOptions({ enableCount: newIsCountEnabled });
    return true;
  }

  function changeEnableSelectFlag() {
    const newIsSelectEnabled = !isSelectEnabled;
    setIsSelectEnabled(newIsSelectEnabled);
    resetOptions({ enableSelect: newIsSelectEnabled });
    return true;
  }

  function changeEnableExpandFlag() {
    const newIsExpandEnabled = !isExpandEnabled;
    setIsExpandEnabled(newIsExpandEnabled);
    resetOptions({ enableExpand: newIsExpandEnabled });
    return true;
  }

  function changeOdataVersion(version: number) {
    displaySpinner(true);
    setOdataVersion(version);
    resetOptions({ version });
    return true;
  }

  function resetOptions(options: Partial<OdataOption>) {
    displaySpinner(true);
    const odataService = gridOptionsRef.current?.backendServiceApi?.service as GridOdataService;
    odataService.updateOptions(options);
    odataService.clearFilters();
    reactGridRef.current?.filterService.clearFilters();
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
    <div id="demo-container" className="container-fluid">
      <h2>
        Example 31: Grid with OData Backend Service using RxJS Observables
        <span className="float-end font18">
          see&nbsp;
          <a
            target="_blank"
            href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example31.tsx"
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
        Optionally use RxJS instead of Promises, you would typically use this with a Backend Service API (OData/GraphQL)
      </div>

      <div className="row">
        <div className="col-md-12" aria-label="Basic Editing Commands">
          <button
            className="btn btn-outline-secondary btn-sm btn-icon"
            data-test="clear-filters-sorting"
            onClick={() => clearAllFiltersAndSorts()}
            title="Clear all Filters & Sorts"
          >
            <span className="mdi mdi-close"></span>
            <span>Clear all Filter & Sorts</span>
          </button>

          <button
            className="btn btn-outline-secondary btn-sm btn-icon mx-1"
            data-test="set-dynamic-filter"
            onClick={() => setFiltersDynamically()}
          >
            Set Filters Dynamically
          </button>
          <button
            className="btn btn-outline-secondary btn-sm btn-icon"
            data-test="set-dynamic-sorting"
            onClick={() => setSortingDynamically()}
          >
            Set Sorting Dynamically
          </button>
          <button
            className="btn btn-outline-secondary btn-sm btn-icon mx-1"
            style={{ marginLeft: '10px' }}
            data-test="add-gender-button"
            onClick={() => addOtherGender()}
            disabled={isOtherGenderAdded}
          >
            Add Other Gender via RxJS
          </button>
        </div>
      </div>

      <br />

      <div>
        <span>
          <label>Programmatically go to first/last page:</label>
          <div className="btn-group" role="group">
            <button className="btn btn-outline-secondary btn-xs btn-icon px-2" data-test="goto-first-page" onClick={() => goToFirstPage()}>
              <i className="mdi mdi-page-first"></i>
            </button>
            <button className="btn btn-outline-secondary btn-xs btn-icon px-2" data-test="goto-last-page" onClick={() => goToLastPage()}>
              <i className="mdi mdi-page-last"></i>
            </button>
          </div>
        </span>

        <span style={{ marginLeft: '10px' }}>
          <label>OData Version:&nbsp;</label>
          <span data-test="radioVersion">
            <label className="radio-inline control-label" htmlFor="radio2">
              <input
                type="radio"
                name="inlineRadioOptions"
                data-test="version2"
                id="radio2"
                defaultChecked={true}
                value="2"
                onChange={() => changeOdataVersion(2)}
              />{' '}
              2&nbsp;
            </label>
            <label className="radio-inline control-label" htmlFor="radio4">
              <input
                type="radio"
                name="inlineRadioOptions"
                data-test="version4"
                id="radio4"
                value="4"
                onChange={() => changeOdataVersion(4)}
              />{' '}
              4
            </label>
          </span>
          <label className="checkbox-inline control-label" htmlFor="enableCount" style={{ marginLeft: '20px' }}>
            <input
              type="checkbox"
              id="enableCount"
              data-test="enable-count"
              defaultChecked={isCountEnabled}
              onChange={() => changeCountEnableFlag()}
            />
            <span style={{ fontWeight: 'bold' }}> Enable Count</span> (add to OData query)
          </label>
          <label className="checkbox-inline control-label" htmlFor="enableSelect" style={{ marginLeft: '20px' }}>
            <input
              type="checkbox"
              id="enableSelect"
              data-test="enable-select"
              defaultChecked={isSelectEnabled}
              onChange={() => changeEnableSelectFlag()}
            />
            <span style={{ fontWeight: 'bold' }}> Enable Select</span> (add to OData query)
          </label>
          <label className="checkbox-inline control-label" htmlFor="enableExpand" style={{ marginLeft: '20px' }}>
            <input
              type="checkbox"
              id="enableExpand"
              data-test="enable-expand"
              defaultChecked={isExpandEnabled}
              onChange={() => changeEnableExpandFlag()}
            />
            <span style={{ fontWeight: 'bold' }}> Enable Expand</span> (add to OData query)
          </label>
        </span>
      </div>

      <div className="row" style={{ marginTop: '5px' }}>
        <div className="col-md-10">
          <div className="alert alert-info" data-test="alert-odata-query">
            <strong>OData Query:</strong> <span data-test="odata-query-result">{odataQuery}</span>
          </div>
        </div>
        <div className={status.class} role="alert" data-test="status">
          <strong>Status: </strong> {status.text}
        </div>
      </div>

      <SlickgridReact
        gridId="grid31"
        columns={columnDefinitions}
        options={gridOptionsRef.current}
        dataset={dataset}
        paginationOptions={paginationOptions}
        onReactGridCreated={($event) => reactGridReady($event.detail)}
        onGridStateChanged={($event) => gridStateChanged($event.detail)}
        onBeforeSort={($event) => handleOnBeforeSort($event.detail.eventData)}
        onBeforeSearchChange={($event) => handleOnBeforeSearchChange($event.detail.eventData)}
        onBeforePaginationChange={($event) => handleOnBeforePaginationChange($event.detail.eventData)}
      />
    </div>
  );
};

export default Example31;
