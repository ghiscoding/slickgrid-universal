import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { type Column, Editors, type GridOption, type ItemMetadata, SlickgridReact, type SlickgridReactInstance } from 'slickgrid-react';
import { useRef, useState } from 'react';

import './example43.scss';

export default function Example43() {
  const [reactGrid, setReactGrid] = useState<SlickgridReactInstance>();
  const [isEditable, setIsEditable] = useState<boolean>(false);
  const [hideSubTitle, setHideSubTitle] = useState(false);
  const [dataset] = useState(loadData());
  const [excelExportService] = useState<ExcelExportService>(new ExcelExportService());
  let showEmployeeId = true;
  const metadataRef = useRef<Record<number, ItemMetadata>>({
    // 10001: Davolio
    0: {
      columns: {
        1: { rowspan: 2 },
        2: { colspan: 2 },
        6: { colspan: 3 },
        10: { colspan: 3, rowspan: 10 },
        13: { colspan: 2 },
        17: { colspan: 2, rowspan: 2 },
      },
    },
    // 10002: (Buchanan... name not shown since Davolio has rowspan=2)
    1: {
      columns: {
        3: { colspan: 3 },
        6: { colspan: 4 },
        13: { colspan: 2, rowspan: 5 },
        15: { colspan: 2 },
      },
    },
    // 10003: Fuller
    2: {
      columns: {
        2: { colspan: 3, rowspan: 2 },
        5: { colspan: 2 },
        7: { colspan: 3 },
        15: { colspan: 2 },
        17: { colspan: 2 },
      },
    },
    // 10004: Leverling
    3: {
      columns: {
        6: { colspan: 4 },
        16: { colspan: 2 },
      },
    },
    // 10005: Peacock
    4: {
      columns: {
        2: { colspan: 4 },
        7: { colspan: 3 },
        15: { colspan: 2, rowspan: 2 },
        17: { colspan: 2 },
      },
    },
    // 10006: Janet
    5: {
      columns: {
        2: { colspan: 2 },
        4: { colspan: 3 },
        7: { colspan: 3 },
        17: { colspan: 2 },
      },
    },
    // 10007: Suyama
    6: {
      columns: {
        2: { colspan: 2 },
        5: { colspan: 2 },
        7: { colspan: 3 },
        14: { colspan: 2 },
        16: { colspan: 3 },
      },
    },
    // 10008: Robert
    7: {
      columns: {
        2: { colspan: 3 },
        5: { colspan: 3 },
        13: { colspan: 3, rowspan: 2 },
        16: { colspan: 2 },
      },
    },
    // 10009: Andrew
    8: {
      columns: {
        2: { colspan: 3 },
        7: { colspan: 3, rowspan: 2 },
        17: { colspan: 2 },
      },
    },
    // 10010: Michael
    9: {
      columns: {
        2: { colspan: 3 },
        5: { colspan: 2 },
        13: { colspan: 3 },
        16: { colspan: 3 },
      },
    },
  });

  // the columns field property is type-safe, try to add a different string not representing one of DataItems properties
  const [columnDefinitions] = useState<Column[]>([
    { id: 'employeeID', name: 'Employee ID', field: 'employeeID', minWidth: 100 },
    { id: 'employeeName', name: 'Employee Name', field: 'employeeName', editor: { model: Editors.text }, minWidth: 120 },
    { id: '9:00', name: '9:00 AM', field: '9:00', editor: { model: Editors.text }, minWidth: 120 },
    { id: '9:30', name: '9:30 AM', field: '9:30', editor: { model: Editors.text }, minWidth: 120 },
    { id: '10:00', name: '10:00 AM', field: '10:00', editor: { model: Editors.text }, minWidth: 120 },
    { id: '10:30', name: '10:30 AM', field: '10:30', editor: { model: Editors.text }, minWidth: 120 },
    { id: '11:00', name: '11:00 AM', field: '11:00', editor: { model: Editors.text }, minWidth: 120 },
    { id: '11:30', name: '11:30 AM', field: '11:30', editor: { model: Editors.text }, minWidth: 120 },
    { id: '12:00', name: '12:00 PM', field: '12:00', editor: { model: Editors.text }, minWidth: 120 },
    { id: '12:30', name: '12:30 PM', field: '12:30', editor: { model: Editors.text }, minWidth: 120 },
    { id: '1:00', name: '1:00 PM', field: '1:00', editor: { model: Editors.text }, minWidth: 120 },
    { id: '1:30', name: '1:30 PM', field: '1:30', editor: { model: Editors.text }, minWidth: 120 },
    { id: '2:00', name: '2:00 PM', field: '2:00', editor: { model: Editors.text }, minWidth: 120 },
    { id: '2:30', name: '2:30 PM', field: '2:30', editor: { model: Editors.text }, minWidth: 120 },
    { id: '3:00', name: '3:00 PM', field: '3:00', editor: { model: Editors.text }, minWidth: 120 },
    { id: '3:30', name: '3:30 PM', field: '3:30', editor: { model: Editors.text }, minWidth: 120 },
    { id: '4:00', name: '4:00 PM', field: '4:00', editor: { model: Editors.text }, minWidth: 120 },
    { id: '4:30', name: '4:30 PM', field: '4:30', editor: { model: Editors.text }, minWidth: 120 },
    { id: '5:00', name: '5:00 PM', field: '5:00', editor: { model: Editors.text }, minWidth: 120 },
  ]);
  const gridOptions: GridOption = {
    autoResize: {
      bottomPadding: 30,
      rightPadding: 50,
    },
    enableCellNavigation: true,
    enableColumnReorder: true,
    enableHeaderMenu: false,
    enableCellRowSpan: true,
    enableExcelExport: true,
    externalResources: [excelExportService],
    enableExcelCopyBuffer: true,
    autoEdit: true,
    editable: false,
    datasetIdPropertyName: 'employeeID',
    frozenColumn: 0,
    gridHeight: 348,
    rowHeight: 30,
    dataView: {
      globalItemMetadataProvider: {
        getRowMetadata: (_item, row) => {
          return (metadataRef.current as Record<number, ItemMetadata>)[row];
        },
      },
    },
    rowTopOffsetRenderType: 'top', // rowspan doesn't render well with 'transform', default is 'top'
  };

  function exportToExcel() {
    excelExportService.exportToExcel({ filename: 'export', format: 'xlsx' });
  }

  function navigateDown() {
    reactGrid?.slickGrid?.navigateDown();
  }

  function navigateUp() {
    reactGrid?.slickGrid?.navigateUp();
  }

  function navigateNext() {
    reactGrid?.slickGrid?.navigateNext();
  }

  function navigatePrev() {
    reactGrid?.slickGrid?.navigatePrev();
  }

  function toggleEditing() {
    const editable = !isEditable;
    setIsEditable(editable);
    reactGrid?.slickGrid.setOptions({ editable });
  }

  function loadData() {
    return [
      {
        employeeID: 10001,
        employeeName: 'Davolio',
        '9:00': 'Analysis Tasks',
        '9:30': 'Analysis Tasks',
        '10:00': 'Team Meeting',
        '10:30': 'Testing',
        '11:00': 'Development',
        '11:30': 'Development',
        '12:00': 'Development',
        '12:30': 'Support',
        '1:00': 'Lunch Break',
        '1:30': 'Lunch Break',
        '2:00': 'Lunch Break',
        '2:30': 'Testing',
        '3:00': 'Testing',
        '3:30': 'Development',
        '4:00': 'Conference',
        '4:30': 'Team Meeting',
        '5:00': 'Team Meeting',
      },
      {
        employeeID: 10002,
        employeeName: 'Buchanan',
        '9:00': 'Task Assign',
        '9:30': 'Support',
        '10:00': 'Support',
        '10:30': 'Support',
        '11:00': 'Testing',
        '11:30': 'Testing',
        '12:00': 'Testing',
        '12:30': 'Testing',
        '1:00': 'Lunch Break',
        '1:30': 'Lunch Break',
        '2:00': 'Lunch Break',
        '2:30': 'Development',
        '3:00': 'Development',
        '3:30': 'Check Mail',
        '4:00': 'Check Mail',
        '4:30': 'Team Meeting',
        '5:00': 'Team Meeting',
      },
      {
        employeeID: 10003,
        employeeName: 'Fuller',
        '9:00': 'Check Mail',
        '9:30': 'Check Mail',
        '10:00': 'Check Mail',
        '10:30': 'Analysis Tasks',
        '11:00': 'Analysis Tasks',
        '11:30': 'Support',
        '12:00': 'Support',
        '12:30': 'Support',
        '1:00': 'Lunch Break',
        '1:30': 'Lunch Break',
        '2:00': 'Lunch Break',
        '2:30': 'Development',
        '3:00': 'Development',
        '3:30': 'Team Meeting',
        '4:00': 'Team Meeting',
        '4:30': 'Development',
        '5:00': 'Development',
      },
      {
        employeeID: 10004,
        employeeName: 'Leverling',
        '9:00': 'Testing',
        '9:30': 'Check Mail',
        '10:00': 'Check Mail',
        '10:30': 'Support',
        '11:00': 'Testing',
        '11:30': 'Testing',
        '12:00': 'Testing',
        '12:30': 'Testing',
        '1:00': 'Lunch Break',
        '1:30': 'Lunch Break',
        '2:00': 'Lunch Break',
        '2:30': 'Development',
        '3:00': 'Development',
        '3:30': 'Check Mail',
        '4:00': 'Conference',
        '4:30': 'Conference',
        '5:00': 'Team Meeting',
      },
      {
        employeeID: 10005,
        employeeName: 'Peacock',
        '9:00': 'Task Assign',
        '9:30': 'Task Assign',
        '10:00': 'Task Assign',
        '10:30': 'Task Assign',
        '11:00': 'Check Mail',
        '11:30': 'Support',
        '12:00': 'Support',
        '12:30': 'Support',
        '1:00': 'Lunch Break',
        '1:30': 'Lunch Break',
        '2:00': 'Lunch Break',
        '2:30': 'Development',
        '3:00': 'Development',
        '3:30': 'Team Meeting',
        '4:00': 'Team Meeting',
        '4:30': 'Testing',
        '5:00': 'Testing',
      },
      {
        employeeID: 10006,
        employeeName: 'Janet',
        '9:00': 'Testing',
        '9:30': 'Testing',
        '10:00': 'Support',
        '10:30': 'Support',
        '11:00': 'Support',
        '11:30': 'Team Meeting',
        '12:00': 'Team Meeting',
        '12:30': 'Team Meeting',
        '1:00': 'Lunch Break',
        '1:30': 'Lunch Break',
        '2:00': 'Lunch Break',
        '2:30': 'Development',
        '3:00': 'Development',
        '3:30': 'Team Meeting',
        '4:00': 'Team Meeting',
        '4:30': 'Development',
        '5:00': 'Development',
      },
      {
        employeeID: 10007,
        employeeName: 'Suyama',
        '9:00': 'Analysis Tasks',
        '9:30': 'Analysis Tasks',
        '10:00': 'Testing',
        '10:30': 'Development',
        '11:00': 'Development',
        '11:30': 'Testing',
        '12:00': 'Testing',
        '12:30': 'Testing',
        '1:00': 'Lunch Break',
        '1:30': 'Lunch Break',
        '2:00': 'Lunch Break',
        '2:30': 'Support',
        '3:00': 'Build',
        '3:30': 'Build',
        '4:00': 'Check Mail',
        '4:30': 'Check Mail',
        '5:00': 'Check Mail',
      },
      {
        employeeID: 10008,
        employeeName: 'Robert',
        '9:00': 'Task Assign',
        '9:30': 'Task Assign',
        '10:00': 'Task Assign',
        '10:30': 'Development',
        '11:00': 'Development',
        '11:30': 'Development',
        '12:00': 'Testing',
        '12:30': 'Support',
        '1:00': 'Lunch Break',
        '1:30': 'Lunch Break',
        '2:00': 'Lunch Break',
        '2:30': 'Check Mail',
        '3:00': 'Check Mail',
        '3:30': 'Check Mail',
        '4:00': 'Team Meeting',
        '4:30': 'Team Meeting',
        '5:00': 'Build',
      },
      {
        employeeID: 10009,
        employeeName: 'Andrew',
        '9:00': 'Check Mail',
        '9:30': 'Team Meeting',
        '10:00': 'Team Meeting',
        '10:30': 'Support',
        '11:00': 'Testing',
        '11:30': 'Development',
        '12:00': 'Development',
        '12:30': 'Development',
        '1:00': 'Lunch Break',
        '1:30': 'Lunch Break',
        '2:00': 'Lunch Break',
        '2:30': 'Check Mail',
        '3:00': 'Check Mail',
        '3:30': 'Check Mail',
        '4:00': 'Team Meeting',
        '4:30': 'Development',
        '5:00': 'Development',
      },
      {
        employeeID: 10010,
        employeeName: 'Michael',
        '9:00': 'Task Assign',
        '9:30': 'Task Assign',
        '10:00': 'Task Assign',
        '10:30': 'Analysis Tasks',
        '11:00': 'Analysis Tasks',
        '11:30': 'Development',
        '12:00': 'Development',
        '12:30': 'Development',
        '1:00': 'Lunch Break',
        '1:30': 'Lunch Break',
        '2:00': 'Lunch Break',
        '2:30': 'Testing',
        '3:00': 'Testing',
        '3:30': 'Testing',
        '4:00': 'Build',
        '4:30': 'Build',
        '5:00': 'Build',
      },
    ];
  }

  function reactGridReady(instance: SlickgridReactInstance) {
    setReactGrid(instance);
  }

  // when a side effect happens (e.g. show/hide EmployeeID),
  // you have to recalculate the metadata by yourself
  // if column index(es) aren't changing then "invalidateRows()" or "invalidate()" might be sufficient
  // however, when column index(es) changed then you will have to call "remapAllColumnsRowSpan()" to clear & reevaluate the rowspan cache
  function toggleEmployeeIdVisibility() {
    const newMetadata: any = {};
    const newShowEmployeeId = !showEmployeeId;
    showEmployeeId = newShowEmployeeId;

    // direction to calculate new column indexes (-1 or +1 on the column index)
    // e.g. metadata = `{0:{columns:{1:{rowspan: 2}}}}` if we hide then new result is `{0:{columns:{0:{rowspan: 2}}}}`
    const dir = newShowEmployeeId ? 1 : -1;
    for (const row of Object.keys(metadataRef.current)) {
      newMetadata[row] = { columns: {} };
      for (const col of Object.keys((metadataRef.current as any)[row].columns)) {
        newMetadata[row].columns[Number(col) + dir] = (metadataRef.current as any)[row].columns[col];
      }
    }

    // update column definitions
    const cols = reactGrid?.slickGrid.getColumns() || [];
    if (newShowEmployeeId) {
      cols.unshift({ id: 'employeeID', name: 'Employee ID', field: 'employeeID', width: 100 });
    } else {
      cols.splice(0, 1);
    }
    reactGrid?.slickGrid.setColumns(cols) || [];

    // update & remap rowspans
    metadataRef.current = newMetadata;
    reactGrid?.slickGrid.remapAllColumnsRowSpan();
    reactGrid?.slickGrid.invalidate();
  }

  function toggleSubTitle() {
    const newHideSubTitle = !hideSubTitle;
    setHideSubTitle(newHideSubTitle);
    const action = newHideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    reactGrid?.resizerService.resizeGrid(0);
  }

  return (
    <div id="demo-container" className="container-fluid">
      <h2>
        Example 43: colspan/rowspan - Employees Timesheets
        <span className="float-end">
          <a
            style={{ fontSize: '18px' }}
            target="_blank"
            href="https://github.com/ghiscoding/slickgrid-react/blob/master/src/examples/slickgrid/Example43.tsx"
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
        <p className="italic example-details">
          <b>NOTES</b>: <code>rowspan</code> is an opt-in feature, because of its small perf hit (it needs to loop through all row metadatas
          to map all rowspan), and requires the <code>enableCellRowSpan</code> grid option to be enabled to work properly. The
          <code>colspan</code>/<code>rowspan</code> are both using DataView item metadata and are both based on row indexes and will
          <b>not</b> keep the row in sync with the data. It is really up to you the user to update the metadata logic of how and where the
          cells should span when a side effect kicks in. (i.e: Filtering/Sorting/Paging/Column Reorder... will <b>not</b> change/update the
          spanning in the grid by itself and that is why they these features are all disabled in this example). Also, column/row freezing
          (pinning) are also not supported, or at least not recommended unless you know exactly what you're doing (like in this demo here
          because we know our pinning doesn't intersect)! Any freezing column/row that could intersect with a <code>colspan</code>/
          <code>rowspan</code>
          &nbsp;<b>will cause problems</b>.
        </p>
      </div>

      <button
        className="ms-2 btn btn-outline-secondary btn-sm btn-icon"
        data-test="goto-up"
        onClick={() => navigateUp()}
        title="from an active cell, navigate to cell above"
      >
        <span className="mdi mdi-chevron-down mdi-rotate-180"></span>
        Navigate Up Cell
      </button>
      <button
        className="ms-2 btn btn-outline-secondary btn-sm btn-icon"
        data-test="goto-down"
        onClick={() => navigateDown()}
        title="from an active cell, navigate to cell below"
      >
        <span className="mdi mdi-chevron-down"></span>
        Navigate Down Cell
      </button>
      <button
        className="ms-2 btn btn-outline-secondary btn-sm btn-icon"
        data-test="goto-prev"
        onClick={() => navigatePrev()}
        title="from an active cell, navigate to previous left cell"
      >
        <span className="mdi mdi-chevron-down mdi-rotate-90"></span>
        Navigate to Left Cell
      </button>
      <button
        className="ms-2 btn btn-outline-secondary btn-sm btn-icon"
        data-test="goto-next"
        onClick={() => navigateNext()}
        title="from an active cell, navigate to next right cell"
      >
        <span className="mdi mdi-chevron-down mdi-rotate-270"></span>
        Navigate to Right Cell
      </button>
      <button
        className="ms-2 btn btn-outline-secondary btn-sm btn-icon mx-1"
        data-test="toggle-employee-id"
        onClick={() => toggleEmployeeIdVisibility()}
      >
        Show/Hide EmployeeID
      </button>
      <button className="ms-2 btn btn-outline-secondary btn-sm btn-icon mx-1" onClick={() => toggleEditing()} data-test="toggle-editing">
        <span className="mdi mdi-pencil-outline"></span>
        <span>
          Toggle Editing:{' '}
          <span id="isEditable" className="text-italic">
            {isEditable + ''}
          </span>
        </span>
      </button>
      <button className="btn btn-outline-secondary btn-sm btn-icon mx-1" data-test="export-excel-btn" onClick={() => exportToExcel()}>
        <i className="mdi mdi-file-excel-outline text-success"></i> Export to Excel
      </button>

      <SlickgridReact
        gridId="grid43"
        columns={columnDefinitions}
        options={gridOptions}
        dataset={dataset}
        onReactGridCreated={($event) => reactGridReady($event.detail)}
      />
    </div>
  );
}
