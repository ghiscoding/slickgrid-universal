import React, { useEffect, useRef, useState } from 'react';
import { SlickgridReact, type Column, type GridOption, type SlickgridReactInstance } from 'slickgrid-react';
import './example55.scss';

const NB_ITEMS = 200;

interface StoryItem {
  id: number;
  title: string;
  owner: string;
  summary: string;
  rowHeight: number;
}

const Example55: React.FC = () => {
  const [columns, setColumns] = useState<Column[]>([]);
  const [dataset, setDataset] = useState<StoryItem[]>([]);
  const [gridOptions, setGridOptions] = useState<GridOption | undefined>(undefined);
  const reactGridRef = useRef<SlickgridReactInstance | null>(null);

  useEffect(() => {
    defineGrid();
    setDataset(getData(NB_ITEMS));
  }, []);

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  function scrollToRow90() {
    reactGridRef.current?.slickGrid?.scrollRowToTop(90);
  }

  function defineGrid() {
    const columnDefinitions: Column[] = [
      { id: 'id', name: '#', field: 'id', minWidth: 60, maxWidth: 70 },
      { id: 'title', name: 'Story', field: 'title', minWidth: 180, width: 220 },
      { id: 'owner', name: 'Owner', field: 'owner', minWidth: 110, width: 130 },
      { id: 'summary', name: 'Summary', field: 'summary', cssClass: 'cell-wrap', minWidth: 360, width: 500, maxWidth: 620 },
    ];

    const options: GridOption = {
      enableCellNavigation: true,
      enableTextSelectionOnCells: true,
      rowHeight: 40,
      gridHeight: 560,
      gridWidth: 1080,
      rowHeightProvider: (_grid, _row, item: StoryItem) => item.rowHeight,
    };

    setColumns(columnDefinitions);
    setGridOptions(options);
  }

  function getData(itemCount: number): StoryItem[] {
    const owners = ['Alex', 'Priya', 'Mia', 'Sam', 'Chris'];
    const fragments = [
      'Refactor keyboard shortcut handling for better readability.',
      'Adjust frozen rows when view-model updates after grouping.',
      'Improve screen-reader labels on grid menu actions.',
      'Align batch editor validation with backend constraints.',
      'Capture edge-case around hidden columns and row-span.',
    ];

    const data: StoryItem[] = [];
    for (let i = 0; i < itemCount; i++) {
      const lineCount = (i % 4) + 1;
      const summary = Array.from({ length: lineCount }, (_, idx) => `${fragments[(i + idx) % fragments.length]}`).join(' ');
      const wordCount = summary.trim().split(/\s+/).length;
      const computedRowHeight = Math.max(40, 8 + lineCount * 16);
      data.push({
        id: i,
        title: `Story ${i}`,
        owner: owners[i % owners.length],
        summary,
        rowHeight: wordCount < 10 ? 33 : computedRowHeight,
      });
    }
    return data;
  }

  return !gridOptions ? (
    ''
  ) : (
    <div className="demo55">
      <div id="demo-container" className="container-fluid">
        <h2>
          Example 55: Variable Row Height (Provider)
          <span className="float-end font18">
            see&nbsp;
            <a
              target="_blank"
              href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example55.tsx"
            >
              <span className="mdi mdi-link-variant"></span> code
            </a>
          </span>
        </h2>

        <div className="subtitle">
          Variable row heights driven by <code>rowHeightProvider</code>.
        </div>

        <div className="row" style={{ marginBottom: '6px' }}>
          <div className="col-md-12">
            <button className="btn btn-outline-secondary btn-sm btn-icon" onClick={scrollToRow90} data-test="scroll-row-90-example55">
              <span className="mdi mdi-arrow-down"></span>
              <span> Scroll To row 90</span>
            </button>
          </div>
        </div>

        <SlickgridReact
          gridId="grid55"
          columns={columns}
          options={gridOptions}
          dataset={dataset}
          onReactGridCreated={($event) => reactGridReady($event.detail)}
        />
      </div>
    </div>
  );
};

export default Example55;
