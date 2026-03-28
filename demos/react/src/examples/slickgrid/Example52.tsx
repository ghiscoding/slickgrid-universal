import { useRef, useState } from 'react';
import { SqlService } from '@slickgrid-universal/sql-backend';
import {
  Filters,
  Formatters,
  SlickgridReact,
  type Column,
  type GridOption,
} from 'slickgrid-react';

const defaultPageSize = 20;
const SQL_TABLE_NAME = 'users';
const FAKE_SERVER_DELAY = 250;

export default function Example52() {
  const gridRef = useRef<any>(null);
  const [sqlQuery, setSqlQuery] = useState('');
  const [processing, setProcessing] = useState(true);
  const [status, setStatus] = useState('processing...');
  const [statusClass, setStatusClass] = useState('is-warning');
  const [serverWaitDelay, setServerWaitDelay] = useState(FAKE_SERVER_DELAY);
  const [dataset] = useState<any[]>([]);

  const columns: Column[] = [
    { id: 'name', field: 'name', name: 'Name', width: 60, sortable: true, filterable: true, filter: { model: Filters.compoundInput } },
    { id: 'gender', field: 'gender', name: 'Gender', width: 60, sortable: true, filterable: true, filter: { model: Filters.singleSelect, collection: [ { value: '', label: '' }, { value: 'male', label: 'Male' }, { value: 'female', label: 'Female' } ] } },
    { id: 'company', field: 'company', name: 'Company', width: 60, sortable: true, filterable: true, filter: { model: Filters.multipleSelect, collection: [ { value: '', label: '' }, { value: 'acme', label: 'Acme' }, { value: 'xyz', label: 'Company XYZ' } ] } },
    { id: 'finish', field: 'finish', name: 'Finish', width: 80, sortable: true, filterable: true, filter: { model: Filters.compoundDate }, formatter: Formatters.dateIso },
    { id: 'billingAddressZip', field: 'billingAddressZip', name: 'Billing Address Zip', width: 80, sortable: true, filterable: true, filter: { model: Filters.input } },
  ];

  const gridOptions: GridOption = {
    enableFiltering: true,
    enableSorting: true,
    enablePagination: true,
    backendServiceApi: {
      service: new SqlService(),
      options: { tableName: SQL_TABLE_NAME },
      preProcess: () => { setProcessing(true); setStatus('processing...'); setStatusClass('is-warning'); },
      postProcess: () => { setProcessing(false); setStatus('finished'); setStatusClass('is-success'); updateSqlQuery(); },
      process: () => new Promise((resolve) => setTimeout(() => resolve([]), serverWaitDelay)),
    },
    pagination: { pageSizes: [10, 20, 30, 50, 100], pageSize: defaultPageSize },
  };

  function updateSqlQuery() {
    const service = gridOptions.backendServiceApi?.service;
    if (service) setSqlQuery(service.buildQuery());
  }

  function clearAllFiltersAndSorts() {
    // implement as needed
  }

  return (
    <div className="container-fluid">
      <h2>
        Example 52: Grid with SQL Backend Service
        <span className="float-end">
          <a style={{ fontSize: 18 }} target="_blank" rel="noopener noreferrer" href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example52.tsx">
            <span className="mdi mdi-link-variant"></span> code
          </a>
        </span>
      </h2>
      <div className="subtitle">
        <ul className="small">
          <li><span className="red">(*) NO DATA SHOWN</span> - just change Filters/Sorting/Pages and look at the "SQL Query" changing.</li>
          <li>This example uses the SQL Backend Service.</li>
          <li>You can also preload a grid with certain "presets" like Filters / Sorters / Pagination.</li>
          <li>String column also supports operators (>, >=, <, <=, <>, !=, =, ==, *).</li>
          <li>The (*) can be used as startsWith (ex.: "abc*" => startsWith "abc") / endsWith (ex.: "*xyz" => endsWith "xyz").</li>
          <li>The other operators can be used on column type number for example: ">=100" (bigger or equal than 100).</li>
        </ul>
      </div>
      <div className="row">
        <div className="col-sm-5">
          <div className={statusClass} role="alert" data-test="status">
            <strong>Status: </strong> {status}
            {processing && <span><i className="mdi mdi-sync mdi-spin-1s"></i></span>}
          </div>
          <div className="row">
            <div className="col-md-12">
              <button className="btn btn-outline-secondary btn-sm me-1" data-test="clear-filters-sorting" onClick={clearAllFiltersAndSorts}>Clear all Filter & Sorts</button>
            </div>
          </div>
          <div className="row mt-2">
            <div className="col-md-12">
              <label htmlFor="serverdelay" className="me-2">Server Delay: </label>
              <input id="serverdelay" type="number" data-test="server-delay" className="form-control form-control-sm d-inline-block w-auto" value={serverWaitDelay} onChange={e => setServerWaitDelay(Number(e.target.value))} title="input a fake timer delay to simulate slow server response" />
            </div>
          </div>
          <div className="row mt-2">
            <div className="col-md-12">
              <div className="alert alert-info" data-test="alert-sql-query">
                <strong>SQL Query:</strong>
                <span data-test="sql-query-result">{sqlQuery}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="col">
          <SlickgridReact
            gridId="grid52"
            columns={columns}
            options={gridOptions}
            dataset={dataset}
            ref={gridRef}
            onGridStateChanged={updateSqlQuery}
          />
        </div>
      </div>
    </div>
  );
}
