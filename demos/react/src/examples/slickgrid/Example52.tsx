import { format as tempoFormat } from '@formkit/tempo';
import { SqlService, type SqlResult, type SqlServiceApi } from '@slickgrid-universal/sql';
import React, { useEffect, useRef, useState } from 'react';
import {
  Filters,
  Formatters,
  SlickgridReact,
  type Column,
  type GridOption,
  type Metrics,
  type SlickgridReactInstance,
} from 'slickgrid-react';

interface Status {
  text: string;
  class: string;
}

const defaultPageSize = 20;
const SQL_TABLE_NAME = 'users';
const FAKE_SERVER_DELAY = 250;

const Example52: React.FC = () => {
  const [columns, setColumns] = useState<Column[]>([]);
  const [gridOptions, setGridOptions] = useState<GridOption | undefined>();
  const [dataset, setDataset] = useState<any[]>([]);
  const [sqlQuery, setSqlQuery] = useState('');
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<Status>({ text: '', class: '' });
  const [metrics, setMetrics] = useState<Metrics | undefined>(undefined);
  const [serverWaitDelay] = useState(FAKE_SERVER_DELAY);
  const [hideSubTitle, setHideSubTitle] = useState(false);

  const sqlService = useRef(new SqlService());
  const serverWaitDelayRef = useRef(serverWaitDelay);
  const reactGridRef = useRef<SlickgridReactInstance | null>(null);

  useEffect(() => {
    defineGrid();
  }, []);

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  /* Define grid Options and Columns */
  function defineGrid() {
    const columns: Column[] = [
      {
        id: 'name',
        field: 'name',
        name: 'Name',
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
        name: 'Gender',
        filterable: true,
        sortable: true,
        width: 60,
        filter: {
          model: Filters.singleSelect,
          collection: [
            { value: '', label: '' },
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
          ],
        },
      },
      {
        id: 'company',
        field: 'company',
        name: 'Company',
        width: 60,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters.multipleSelect,
          collection: [
            { value: 'acme', label: 'Acme' },
            { value: 'abc', label: 'Company ABC' },
            { value: 'xyz', label: 'Company XYZ' },
          ],
        },
      },
      {
        id: 'billingAddressStreet',
        field: 'billingAddressStreet',
        name: 'Billing Street',
        formatter: Formatters.complexObject,
        width: 60,
        filterable: true,
        sortable: true,
      },
      {
        id: 'billingAddressZip',
        field: 'billingAddressZip',
        name: 'Billing Zip',
        width: 60,
        type: 'number',
        filterable: true,
        sortable: true,
        filter: {
          model: Filters.compoundInput,
        },
        formatter: Formatters.multiple,
        params: { formatters: [Formatters.complexObject] },
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
        type: 'date',
        filterable: true,
        filter: {
          model: Filters.dateRange,
        },
      },
    ];

    const gridOptions: GridOption = {
      gridHeight: 200,
      gridWidth: 900,
      enableFiltering: true,
      enableCellNavigation: true,
      gridMenu: {
        resizeOnShowHeaderRow: true,
      },
      enablePagination: true,
      pagination: {
        pageSizes: [10, 15, 20, 25, 30, 40, 50, 75, 100],
        pageSize: defaultPageSize,
        totalItems: 100, // ensure pagination is enabled initially
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
          { columnId: 'gender', searchTerms: ['male'], operator: 'EQ' },
          { columnId: 'name', searchTerms: ['Joh*oe'], operator: 'StartsWithEndsWith' },
          { columnId: 'company', searchTerms: ['xyz'], operator: 'IN' },
          { columnId: 'finish', searchTerms: ['2026-01-01', '2026-02-15'], operator: 'RangeInclusive' },
        ],
        sorters: [
          { columnId: 'name', direction: 'asc' },
          { columnId: 'company', direction: 'DESC' },
        ],
        pagination: { pageNumber: 2, pageSize: 20 },
      },
      backendServiceApi: {
        service: sqlService.current,
        options: {
          tableName: SQL_TABLE_NAME,
        },
        preProcess: () => displaySpinner(true),
        process: (query) => getCustomerApiCall(query),
        postProcess: (result) => {
          const metrics = result.metrics as Metrics;
          setMetrics(metrics);
          displaySpinner(false);

          setDataset(result.data);
          // update pagination totalItems to reflect backend total count
          if (gridOptions.pagination) {
            gridOptions.pagination.totalItems = result.metrics?.totalItemCount ?? 0;
          }
          if (reactGridRef.current) {
            reactGridRef.current.slickGrid?.invalidate();
          }
          displaySpinner(false);
          updateSqlQuery();
        },
      } satisfies SqlServiceApi<{
        id: number;
        name: string;
        gender: string;
        company: string;
        billingAddressZip: string;
        finish: string;
        totalCount: number;
      }>,
    };

    setColumns(columns);
    setGridOptions(gridOptions);
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

  function getCustomerApiCall(
    _query: string
  ): Promise<
    SqlResult<{ id: number; name: string; gender: string; company: string; billingAddressZip: string; finish: string; totalCount: number }>
  > {
    // Simulate a backend call with no matching data, but totalCount for pagination
    const totalCount = 100;
    const now = new Date();
    const mockedResult = {
      data: [],
      metrics: {
        startTime: now,
        endTime: now,
        executionTime: 0,
        itemCount: 0,
        totalItemCount: totalCount,
      },
    };
    return new Promise((resolve) => {
      setTimeout(() => {
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

  function updateSqlQuery() {
    if (sqlService.current) {
      setSqlQuery(sqlService.current.buildQuery());
    }
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
        Example 52: Grid with SQL Backend Service
        <span className="float-end">
          <a
            style={{ fontSize: 18 }}
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example52.tsx"
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
        <ul className="small">
          <li>
            <span className="red">(*) NO DATA SHOWN</span> - just change Filters/Sorting/Pages and look at the "SQL Query" changing.
          </li>
          <li>This example uses the SQL Backend Service.</li>
          <li>You can also preload a grid with certain "presets" like Filters / Sorters / Pagination.</li>{' '}
        </ul>
      </div>

      <div className="row">
        <div className="col-sm-2">
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
        </div>
        <div className="col-sm-10">
          <div className="alert alert-info" data-test="alert-sql-query">
            <strong>SQL Query:</strong> <span data-test="sql-query-result">{sqlQuery}</span>
          </div>
        </div>
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
            Server Delay:
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

      <div className="row my-2">
        <div className="col-12">
          {metrics && (
            <span>
              <>
                <b>Metrics: </b>
                {metrics.endTime ? tempoFormat(metrics.endTime, 'YYYY-MM-DD HH:mm:ss') : ''}| {metrics.executionTime}ms |
                {metrics.totalItemCount} items
              </>
            </span>
          )}
          <span className="mx-1"> — </span>
          <label>Programmatically go to first/last page:</label>
          <div className="btn-group" role="group">
            <button className="btn btn-outline-secondary btn-xs btn-icon px-2" data-test="goto-first-page" onClick={() => goToFirstPage()}>
              <i className="mdi mdi-page-first"></i>
            </button>
            <button className="btn btn-outline-secondary btn-xs btn-icon px-2" data-test="goto-last-page" onClick={() => goToLastPage()}>
              <i className="mdi mdi-page-last"></i>
            </button>
          </div>
        </div>
      </div>

      <SlickgridReact
        gridId="grid52"
        columns={columns}
        options={gridOptions}
        dataset={dataset}
        onGridStateChanged={() => updateSqlQuery()}
        onReactGridCreated={($event) => reactGridReady($event.detail)}
      />
    </div>
  );
};

export default Example52;
