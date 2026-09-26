import React, { useEffect, useState } from 'react';
import { SlickgridReact, type Column, type GridOption, type SlickgridReactInstance } from 'slickgrid-react';

const NB_ITEMS = 300;

const Example57: React.FC = () => {
  const [gridOptions, setGridOptions] = useState<GridOption | undefined>(undefined);
  const [columns, setColumns] = useState<Column[]>([]);
  const [dataset, setDataset] = useState<any[]>([]);
  const [gridInstance, setGridInstance] = useState<SlickgridReactInstance | undefined>();

  useEffect(() => {
    const previousBodyDir = document.body.getAttribute('dir');
    document.body.setAttribute('dir', 'rtl');

    defineGrid();
    const mockData = mockDataset();
    setDataset(mockData);

    return () => {
      if (previousBodyDir) {
        document.body.setAttribute('dir', previousBodyDir);
      } else {
        document.body.removeAttribute('dir');
      }
    };
  }, []);
  const reactGridReady = (reactGrid: SlickgridReactInstance) => {
    setGridInstance(reactGrid);
    reactGrid.dataView.getItemMetadata = (row) => (row % 7 === 2 ? { columns: { 0: { colspan: 3 } } } : null);
    reactGrid.slickGrid.invalidate();
  };

  const applyPinning = () => {
    const getCount = (id: string) =>
      Math.min(columns.length, Math.max(0, Number.parseInt((document.querySelector(`#${id}`) as HTMLInputElement)?.value || '0', 10) || 0));
    const startCount = getCount('pinnedStartColumns');
    const endCount = getCount('pinnedEndColumns');
    gridInstance?.slickGrid.setOptions({
      pinning: {
        columns: { left: startCount > 0 ? startCount - 1 : [], right: endCount },
        rows: { top: [0], bottom: [] },
      },
    });
  };

  const clearPinning = () => gridInstance?.slickGrid.setOptions({ pinning: null });

  const defineGrid = () => {
    const cols: Column[] = [
      { id: 'title', name: 'Title', field: 'title', width: 110 },
      { id: 'duration', name: 'Duration', field: 'duration', width: 90 },
      { id: 'start', name: 'Start', field: 'start', width: 100 },
      { id: 'finish', name: 'Finish', field: 'finish', width: 100 },
      { id: 'priority', name: 'Priority', field: 'priority', width: 100, sticky: true, cssClass: 'sticky-candidate' },
      { id: '%', name: '% Complete', field: 'percentComplete', width: 110 },
      { id: 'assignee', name: 'Assignee', field: 'assignee', width: 100 },
      { id: 'department', name: 'Department', field: 'department', width: 110 },
      { id: 'project', name: 'Project', field: 'project', width: 100 },
      { id: 'reviewer', name: 'Reviewer', field: 'reviewer', width: 100 },
      { id: 'region', name: 'Region', field: 'region', width: 100 },
      { id: 'stage', name: 'Stage', field: 'stage', width: 100 },
      { id: 'budget', name: 'Budget', field: 'budget', width: 100 },
      { id: 'spent', name: 'Spent', field: 'spent', width: 100 },
      { id: 'notes', name: 'Notes', field: 'notes', width: 140 },
      { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', width: 110 },
    ];
    setColumns(cols);

    const opts: GridOption = {
      enableCellNavigation: true,
      enableFiltering: false,
      // Preserve declared widths and horizontal overflow from the fork example.
      enableAutoSizeColumns: false,
      // Disabled in RTL because SortableJS lacks RTL support; patch SortableJS or use https://github.com/HamadHadi/Sortable-rtl to enable it.
      enableColumnReorder: false,
      gridHeight: 400,
      gridWidth: 900,
      rowHeight: 28,
      rtl: true, // ← Enable RTL mode
      // Keep the sticky candidate eligible after the leading pinned columns are resized wider.
      docking: { maxColumnViewportWidthPercent: 100 },
      pinning: { columns: { left: 1, right: 1 }, rows: { top: [0], bottom: [] } },
    };
    setGridOptions(opts);
  };

  const mockDataset = () => {
    const priorities = ['Low', 'Medium', 'High', 'Critical'];
    const assignees = ['Alice', 'Bob', 'Carol', 'Dave', 'Erin', 'Frank', 'Grace'];
    const departments = ['Engineering', 'Marketing', 'Sales', 'Design', 'Support'];
    const projects = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'];
    const regions = ['North', 'South', 'East', 'West'];
    const stages = ['Design', 'Build', 'Test', 'Ship'];
    const data = [];
    for (let i = 0; i < NB_ITEMS; i++) {
      data.push({
        id: i,
        title: `Task ${i}`,
        duration: `${(i % 10) + 2} days`,
        start: `0${(i % 9) + 1}/01/2009`,
        finish: `0${(i % 5) + 1}/05/2009`,
        priority: priorities[i % priorities.length],
        percentComplete: `${(i * 7) % 100}%`,
        assignee: assignees[i % assignees.length],
        department: departments[i % departments.length],
        project: projects[i % projects.length],
        reviewer: assignees[(i + 3) % assignees.length],
        region: regions[i % regions.length],
        stage: stages[i % stages.length],
        budget: ((i % 9) + 1) * 1000,
        spent: ((i % 7) + 1) * 800,
        notes: `Note for task ${i}`,
        effortDriven: i % 5 === 0 ? 'Yes' : 'No',
      });
    }
    return data;
  };

  return !gridOptions ? null : (
    <div id="demo-container" className="container-fluid">
      <h2>
        Example 57: RTL (Right-to-Left)
        <span className="float-end font18">
          see&nbsp;
          <a
            target="_blank"
            href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example57.tsx"
          >
            <span className="mdi mdi-link-variant"></span> code
          </a>
        </span>
      </h2>

      <div className="subtitle">RTL with dynamic two-sided column pinning, sticky columns, pinned rows, and a crossing colspan.</div>

      <div className="rtl-controls" style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0' }}>
        <label>
          Pinned at the start (right) edge: <input type="number" id="pinnedStartColumns" min="0" max="16" defaultValue="2" />
        </label>
        <label>
          Pinned at the end (left) edge: <input type="number" id="pinnedEndColumns" min="0" max="16" defaultValue="1" />
        </label>
        <button className="btn btn-outline-secondary btn-sm btn-icon" id="setPinning" type="button" onClick={applyPinning}>
          Apply
        </button>
        <button className="btn btn-outline-secondary btn-sm btn-icon" id="clearPinning" type="button" onClick={clearPinning}>
          Remove pinning
        </button>
      </div>

      <div dir="rtl">
        <SlickgridReact
          gridId="grid57"
          columns={columns}
          options={gridOptions}
          dataset={dataset}
          onReactGridCreated={(event) => reactGridReady(event.detail)}
        />
      </div>
    </div>
  );
};

export default Example57;
