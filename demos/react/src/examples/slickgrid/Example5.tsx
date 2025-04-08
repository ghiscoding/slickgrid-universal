import { format } from '@formkit/tempo';
import { GridOdataService, type OdataServiceApi, type OdataOption } from '@slickgrid-universal/odata';
import { useState, useEffect, useRef } from 'react';

import {
  type Column,
  FieldType,
  Filters,
  type GridOption,
  type GridStateChange,
  type Metrics,
  OperatorType,
  type Pagination,
  SlickgridReact,
  type SlickgridReactInstance,
} from 'slickgrid-react';
import Data from './data/customers_100.json';

const defaultPageSize = 20;
const CARET_HTML_ESCAPED = '%5E';
const PERCENT_HTML_ESCAPED = '%25';

interface Status {
  text: string;
  class: string;
}

const Example5: React.FC = () => {
  const [gridOptions, setGridOptions] = useState<GridOption | undefined>(undefined);
  const [columnDefinitions, setColumnDefinitions] = useState<Column[]>([]);
  const [dataset, setDataset] = useState<any[]>([]);
  const [paginationOptions, setPaginationOptions] = useState<Pagination | undefined>(undefined);
  const [errorStatus, setErrorStatus] = useState<string>('');
  const [isCountEnabled, setIsCountEnabled] = useState<boolean>(true);
  const [isSelectEnabled, setIsSelectEnabled] = useState<boolean>(false);
  const [isExpandEnabled, setIsExpandEnabled] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<Metrics>({} as Metrics);
  const [status, setStatus] = useState<Status>({ class: '', text: '' });
  const [odataVersion, setOdataVersion] = useState<number>(2);
  const [odataQuery, setOdataQuery] = useState<string>('');
  const [processing, setProcessing] = useState<boolean>(false);
  const [isPageErrorTest] = useState<boolean>(false);
  const [hideSubTitle, setHideSubTitle] = useState(false);

  const isPageErrorTestRef = useRef(isPageErrorTest);
  const gridOptionsRef = useRef<GridOption | null>(null);
  const reactGridRef = useRef<SlickgridReactInstance | null>(null);

  useEffect(() => {
    defineGrid();
  }, []);

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  function getGridDefinition(): GridOption {
    return {
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
      compoundOperatorAltTexts: {
        // where '=' is any of the `OperatorString` type shown above
        text: { Custom: { operatorAlt: '%%', descAlt: 'SQL Like' } },
      },
      enableCellNavigation: true,
      enableFiltering: true,
      enableCheckboxSelector: true,
      enableRowSelection: true,
      enablePagination: true, // you could optionally disable the Pagination
      pagination: {
        pageSizes: [10, 20, 50, 100, 500, 50000],
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
          filterQueryOverride: ({ fieldName, columnDef, columnFilterOperator, searchValues }) => {
            if (columnFilterOperator === OperatorType.custom && columnDef?.id === 'name') {
              let matchesSearch = searchValues[0].replace(/\*/g, '.*');
              matchesSearch = matchesSearch.slice(0, 1) + CARET_HTML_ESCAPED + matchesSearch.slice(1);
              matchesSearch = matchesSearch.slice(0, -1) + "$'";

              return `matchesPattern(${fieldName}, ${matchesSearch})`;
            }
            return;
          },
          version: odataVersion, // defaults to 2, the query string is slightly different between OData 2 and 4
        },
        onError: (error: Error) => {
          setErrorStatus(error.message);
          displaySpinner(false, true);
        },
        preProcess: () => {
          setErrorStatus('');
          displaySpinner(true);
        },
        process: (query) => getCustomerApiCall(query),
        postProcess: (response) => {
          setMetrics(response.metrics);
          getCustomerCallback(response);
          displaySpinner(false);
        },
      } as OdataServiceApi,
    };
  }

  function getColumnDefinitions(): Column[] {
    return [
      {
        id: 'name',
        name: 'Name',
        field: 'name',
        sortable: true,
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
        },
      },
      {
        id: 'gender',
        name: 'Gender',
        field: 'gender',
        filterable: true,
        sortable: true,
        filter: {
          model: Filters.singleSelect,
          collection: [
            { value: '', label: '' },
            { value: 'male', label: 'male' },
            { value: 'female', label: 'female' },
          ],
        },
      },
      { id: 'company', name: 'Company', field: 'company', filterable: true, sortable: true },
      { id: 'category_name', name: 'Category', field: 'category/name', filterable: true, sortable: true },
    ];
  }

  function defineGrid() {
    const columnDefinitions = getColumnDefinitions();
    const gridOptions = getGridDefinition();

    gridOptionsRef.current = gridOptions;
    setColumnDefinitions(columnDefinitions);
    setGridOptions(gridOptions);
  }

  function displaySpinner(isProcessing: boolean, isError?: boolean) {
    setProcessing(isProcessing);

    if (isError) {
      setStatus({ text: 'ERROR!!!', class: 'alert alert-danger' });
    } else {
      setStatus(isProcessing ? { text: 'loading', class: 'alert alert-warning' } : { text: 'finished', class: 'alert alert-success' });
    }
  }

  function getCustomerCallback(data: any) {
    // totalItems property needs to be filled for pagination to work correctly
    // however we need to force React to do a dirty check, doing a clone object will do just that
    let totalItemCount: number = data['totalRecordCount'];
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
    // in your case, you will call your WebAPI function (wich needs to return a Promise)
    // for the demo purpose, we will call a mock WebAPI function
    return getCustomerDataApiMock(query);
  }

  /**
   * This function is only here to mock a WebAPI call (since we are using a JSON file for the demo)
   *  in your case the getCustomer() should be a WebAPI function returning a Promise
   */
  function getCustomerDataApiMock(query: string): Promise<any> {
    // the mock is returning a Promise, just like a WebAPI typically does
    return new Promise((resolve) => {
      const queryParams = query.toLowerCase().split('&');
      let top: number;
      let skip = 0;
      let orderBy = '';
      let countTotalItems = 100;
      const columnFilters = {};

      if (isPageErrorTestRef.current) {
        isPageErrorTestRef.current = false;
        throw new Error('Server timed out trying to retrieve data for the last page');
      }

      for (const param of queryParams) {
        if (param.includes('$top=')) {
          top = +param.substring('$top='.length);
          if (top === 50000) {
            throw new Error('Server timed out retrieving 50,000 rows');
          }
        }
        if (param.includes('$skip=')) {
          skip = +param.substring('$skip='.length);
        }
        if (param.includes('$orderby=')) {
          orderBy = param.substring('$orderby='.length);
        }
        if (param.includes('$filter=')) {
          const filterBy = param.substring('$filter='.length).replace('%20', ' ');
          if (filterBy.includes('matchespattern')) {
            const regex = new RegExp(`matchespattern\\(([a-zA-Z]+),\\s'${CARET_HTML_ESCAPED}(.*?)'\\)`, 'i');
            const filterMatch = filterBy.match(regex) || [];
            const fieldName = filterMatch[1].trim();
            (columnFilters as any)[fieldName] = { type: 'matchespattern', term: '^' + filterMatch[2].trim() };
          }
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
          for (const operator of ['eq', 'ne', 'le', 'lt', 'gt', 'ge']) {
            if (filterBy.includes(operator)) {
              const re = new RegExp(`([a-zA-Z ]*) ${operator} '(.*?)'`);
              const filterMatch = re.exec(filterBy);
              if (Array.isArray(filterMatch)) {
                const fieldName = filterMatch[1].trim();
                (columnFilters as any)[fieldName] = { type: operator, term: filterMatch[2].trim() };
              }
            }
          }
          if (filterBy.includes('startswith') && filterBy.includes('endswith')) {
            const filterStartMatch = filterBy.match(/startswith\(([a-zA-Z ]*),\s?'(.*?)'/) || [];
            const filterEndMatch = filterBy.match(/endswith\(([a-zA-Z ]*),\s?'(.*?)'/) || [];
            const fieldName = filterStartMatch[1].trim();
            (columnFilters as any)[fieldName] = { type: 'starts+ends', term: [filterStartMatch[2].trim(), filterEndMatch[2].trim()] };
          } else if (filterBy.includes('startswith')) {
            const filterMatch = filterBy.match(/startswith\(([a-zA-Z ]*),\s?'(.*?)'/);
            const fieldName = filterMatch![1].trim();
            (columnFilters as any)[fieldName] = { type: 'starts', term: filterMatch![2].trim() };
          } else if (filterBy.includes('endswith')) {
            const filterMatch = filterBy.match(/endswith\(([a-zA-Z ]*),\s?'(.*?)'/);
            const fieldName = filterMatch![1].trim();
            (columnFilters as any)[fieldName] = { type: 'ends', term: filterMatch![2].trim() };
          }

          // simulate a backend error when trying to sort on the "Company" field
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
      let data = Data as unknown as { name: string; gender: string; company: string; id: string; category: { id: string; name: string } }[];
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
              if (columnId?.indexOf(' ') !== -1) {
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
                const [term1, term2] = Array.isArray(searchTerm) ? searchTerm : [searchTerm];

                switch (filterType) {
                  case 'eq':
                    return filterTerm.toLowerCase() === term1;
                  case 'ne':
                    return filterTerm.toLowerCase() !== term1;
                  case 'le':
                    return filterTerm.toLowerCase() <= term1;
                  case 'lt':
                    return filterTerm.toLowerCase() < term1;
                  case 'gt':
                    return filterTerm.toLowerCase() > term1;
                  case 'ge':
                    return filterTerm.toLowerCase() >= term1;
                  case 'ends':
                    return filterTerm.toLowerCase().endsWith(term1);
                  case 'starts':
                    return filterTerm.toLowerCase().startsWith(term1);
                  case 'starts+ends':
                    return filterTerm.toLowerCase().startsWith(term1) && filterTerm.toLowerCase().endsWith(term2);
                  case 'substring':
                    return filterTerm.toLowerCase().includes(term1);
                  case 'matchespattern':
                    return new RegExp((term1 as string).replace(new RegExp(PERCENT_HTML_ESCAPED, 'g'), '.*'), 'i').test(filterTerm);
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

      window.setTimeout(() => {
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

        // console.log('Backend Result', backendResult);
        resolve(backendResult);
      }, 150);
    });
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

  function throwPageChangeError() {
    isPageErrorTestRef.current = true;
    reactGridRef.current?.paginationService?.goToLastPage();
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
    setOdataVersion(version);
    resetOptions({ version });
    return true;
  }

  function resetOptions(options: Partial<OdataOption>) {
    displaySpinner(true);
    const odataService = gridOptionsRef.current!.backendServiceApi!.service as GridOdataService;
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

  return !gridOptions ? null : (
    <div id="demo-container" className="container-fluid">
      <h2>
        Example 5: Grid with Backend OData Service
        <span className="float-end font18">
          see&nbsp;
          <a target="_blank" href="https://github.com/ghiscoding/slickgrid-react/blob/master/src/examples/slickgrid/Example5.tsx">
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

      <div className="row">
        <div className="col-sm-9">
          <div className="subtitle">
            Use it when you need to support Pagination with a OData endpoint (for simple JSON, use a regular grid)
            <br />
            Take a look at the (
            <a href="https://ghiscoding.gitbook.io/slickgrid-react/backend-services/odata" target="_blank">
              Wiki documentation
            </a>
            )
            <br />
            <ul className="small">
              <li>
                Only "Name" field is sortable for the demo (because we use JSON files), however "multiColumnSort: true" is also supported
              </li>
              <li>This example also demos the Grid State feature, open the console log to see the changes</li>
              <li>String column also support operator (&gt;, &gt;=, &lt;, &lt;=, &lt;&gt;, !=, =, ==, *)</li>
              <ul>
                <li>
                  The (*) can be used as startsWith (ex.: "abc*" =&gt; startsWith "abc") / endsWith (ex.: "*xyz" =&gt; endsWith "xyz")
                </li>
                <li>The other operators can be used on column type number for example: "&gt;=100" (greater than or equal to 100)</li>
              </ul>
              <li>OData Service could be replaced by other Service type in the future (GraphQL or whichever you provide)</li>
              <li>
                You can also preload a grid with certain "presets" like Filters / Sorters / Pagination{' '}
                <a href="https://ghiscoding.gitbook.io/slickgrid-react/grid-functionalities/grid-state-preset" target="_blank">
                  Wiki - Grid Preset
                </a>
              </li>
              <li>
                <span className="text-danger">NOTE:</span> For demo purposes, the last column (filter & sort) will always throw an error and
                its only purpose is to demo what would happen when you encounter a backend server error (the UI should rollback to previous
                state before you did the action). Also changing Page Size to 50,000 will also throw which again is for demo purposes.
              </li>
            </ul>
          </div>
        </div>
        <div className="col-sm-3">
          {errorStatus && (
            <div className="alert alert-danger" data-test="error-status">
              <em>
                <strong>Backend Error:</strong> <span>{errorStatus}</span>
              </em>
            </div>
          )}
        </div>
      </div>

      <div className="row">
        <div className="col-sm-2">
          <div className={status.class} role="alert" data-test="status">
            <strong>Status: </strong> {status.text}
            {processing && (
              <span>
                <i className="mdi mdi-sync mdi-spin"></i>
              </span>
            )}
          </div>
        </div>
        <div className="col-sm-10">
          <div className="alert alert-info" data-test="alert-odata-query">
            <strong>OData Query:</strong> <span data-test="odata-query-result">{odataQuery}</span>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-sm-4">
          <button
            className="btn btn-outline-secondary btn-sm btn-icon"
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
          <br />
          {metrics && (
            <span>
              <>
                <b>Metrics:</b>
                {metrics?.endTime ? format(metrics.endTime, 'YYYY-MM-DD HH:mm:ss') : ''}| {metrics.itemCount} of {metrics.totalItemCount}{' '}
                items{' '}
              </>
            </span>
          )}
        </div>
        <div className="col-sm-8">
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
        </div>
      </div>
      <div className="row mt-2 mb-1">
        <div className="col-md-12">
          <button className="btn btn-outline-danger btn-sm" data-test="throw-page-error-btn" onClick={() => throwPageChangeError()}>
            <span>Throw Error Going to Last Page... </span>
            <i className="mdi mdi-page-last"></i>
          </button>

          <span className="ms-2">
            <label>Programmatically go to first/last page:</label>
            <div className="btn-group" role="group">
              <button
                className="btn btn-outline-secondary btn-xs btn-icon px-2"
                data-test="goto-first-page"
                onClick={() => goToFirstPage()}
              >
                <i className="mdi mdi-page-first"></i>
              </button>
              <button className="btn btn-outline-secondary btn-xs btn-icon px-2" data-test="goto-last-page" onClick={() => goToLastPage()}>
                <i className="mdi mdi-page-last"></i>
              </button>
            </div>
          </span>
        </div>
      </div>

      <SlickgridReact
        gridId="grid5"
        columns={columnDefinitions}
        options={gridOptions}
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

export default Example5;
