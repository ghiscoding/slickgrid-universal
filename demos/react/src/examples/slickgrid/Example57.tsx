import React, { useEffect, useState } from 'react';
import { Formatters, SlickgridReact, type Column, type GridOption } from 'slickgrid-react';

const NB_ITEMS = 100;

const Example57: React.FC = () => {
  const [gridOptions, setGridOptions] = useState<GridOption | undefined>(undefined);
  const [columns, setColumns] = useState<Column[]>([]);
  const [dataset, setDataset] = useState<any[]>([]);

  useEffect(() => {
    defineGrid();
    const mockData = mockDataset();
    setDataset(mockData);
    document.querySelector('body')?.setAttribute('dir', 'rtl'); // ← Enable RTL mode

    return () => {
      document.querySelector('body')?.removeAttribute('dir'); // ← Disable RTL mode
    };
  }, []);

  const defineGrid = () => {
    const cols: Column[] = [
      { id: 'id', name: 'ID', field: 'id', filterable: true, sortable: true, minWidth: 60 },
      { id: 'title', name: 'Title', field: 'title', filterable: true, sortable: true, minWidth: 100 },
      { id: 'duration', name: 'Duration (days)', field: 'duration', filterable: true, sortable: true, minWidth: 100, type: 'number' },
      { id: '%', name: '% Complete', field: 'percentComplete', filterable: true, sortable: true, minWidth: 100, type: 'number' },
      {
        id: 'start',
        name: 'Start',
        field: 'start',
        formatter: Formatters.dateIso,
        exportWithFormatter: true,
        filterable: true,
      },
      {
        id: 'finish',
        name: 'Finish',
        field: 'finish',
        formatter: Formatters.dateIso,
        exportWithFormatter: true,
        filterable: true,
      },
      { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', minWidth: 80 },
    ];
    setColumns(cols);

    const opts: GridOption = {
      enableFiltering: true,
      gridHeight: 500,
      gridWidth: 700,
      rowHeight: 33,
      rtl: true, // ← Enable RTL mode
    };
    setGridOptions(opts);
  };

  const mockDataset = () => {
    const data = [];
    for (let i = 0; i < NB_ITEMS; i++) {
      data.push({
        id: i,
        title: `Task ${i}`,
        duration: Math.round(Math.random() * 100),
        percentComplete: Math.round(Math.random() * 100),
        start: new Date(2024, 0, 1 + Math.floor(Math.random() * 30)).toISOString().split('T')[0],
        finish: new Date(2024, 1, 1 + Math.floor(Math.random() * 28)).toISOString().split('T')[0],
        effortDriven: i % 5 === 0,
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

      <div className="subtitle">Basic grid with RTL (Right-to-Left) enabled for RTL languages.</div>

      <SlickgridReact gridId="grid57" columns={columns} options={gridOptions} dataset={dataset} />
    </div>
  );
};

export default Example57;
