import React, { useEffect, useRef, useState } from 'react';
import { SlickgridReact, type Column, type GridOption, type SlickgridReactInstance } from 'slickgrid-react';
import './example56.scss';

const NB_ITEMS = 150;

interface TaskItem {
  id: number;
  title: string;
  status: 'Todo' | 'In Progress' | 'Done';
  notes: string;
}

const Example56: React.FC = () => {
  const [columns, setColumns] = useState<Column[]>([]);
  const [dataset, setDataset] = useState<TaskItem[]>([]);
  const [gridOptions, setGridOptions] = useState<GridOption | undefined>(undefined);

  const reactGridRef = useRef<SlickgridReactInstance | null>(null);
  const compactRef = useRef(false);

  useEffect(() => {
    defineGrid();
    setDataset(getData(NB_ITEMS));
  }, []);

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  function toggleDensity() {
    compactRef.current = !compactRef.current;
    reactGridRef.current?.slickGrid?.invalidateRowHeights?.();
  }

  function scrollToRow90() {
    reactGridRef.current?.slickGrid?.scrollRowToTop(90);
  }

  function defineGrid() {
    const columnDefinitions: Column[] = [
      { id: 'id', name: '#', field: 'id', minWidth: 60, maxWidth: 70 },
      { id: 'title', name: 'Task', field: 'title', minWidth: 180, width: 220 },
      { id: 'status', name: 'Status', field: 'status', minWidth: 120, width: 140 },
      { id: 'notes', name: 'Notes', field: 'notes', cssClass: 'cell-wrap', width: 420, maxWidth: 520 },
    ];

    const options: GridOption = {
      enableCellNavigation: true,
      enableTextSelectionOnCells: true,
      rowHeight: 40,
      frozenRow: 2,
      gridHeight: 560,
      gridWidth: 1080,
      dataView: {
        globalItemMetadataProvider: {
          getRowMetadata: (item: TaskItem) => {
            if (item.notes === 'Short note.') {
              return { height: compactRef.current ? 40 : 33 };
            }

            const lineCount = getEstimatedLineCount(item.notes);
            const verticalPadding = 8;
            const lineHeight = compactRef.current ? 21 : 18;
            const minRowHeight = compactRef.current ? 46 : 40;
            const baseHeight = Math.max(minRowHeight, verticalPadding + lineCount * lineHeight);

            return { height: baseHeight };
          },
        },
      },
    };

    setColumns(columnDefinitions);
    setGridOptions(options);
  }

  function getEstimatedLineCount(text: string): number {
    return Math.max(1, Math.ceil(text.length / 55));
  }

  function getData(itemCount: number): TaskItem[] {
    const statuses: Array<TaskItem['status']> = ['Todo', 'In Progress', 'Done'];
    const notesPool = [
      'Short note.',
      'Need to validate keyboard navigation and ensure screen reader output remains stable across frozen panes.',
      'Review row height invalidation path when data changes quickly due to live updates from backend polling.',
      'Longer QA note: validate scrolling behavior at top and bottom boundaries, compare rendered range against expected rows, and confirm no visual clipping for wrapped cells.',
    ];

    const data: TaskItem[] = [];
    for (let i = 0; i < itemCount; i++) {
      data.push({
        id: i,
        title: `Task ${i}`,
        status: statuses[i % statuses.length],
        notes: notesPool[i % notesPool.length],
      });
    }
    return data;
  }

  return !gridOptions ? (
    ''
  ) : (
    <div className="demo56">
      <div id="demo-container" className="container-fluid">
        <h2>
          Example 56: Variable Row Height (Dynamic)
          <span className="float-end font18">
            see&nbsp;
            <a
              target="_blank"
              href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example56.tsx"
            >
              <span className="mdi mdi-link-variant"></span> code
            </a>
          </span>
        </h2>

        <div className="subtitle">
          Variable row heights via <code>ItemMetadata.height</code> fallback, with compact mode rebuilding heights through
          <code>invalidateRowHeights()</code>.
        </div>

        <div className="row" style={{ marginBottom: '6px' }}>
          <div className="col-md-12">
            <button className="btn btn-outline-secondary btn-sm btn-icon" onClick={toggleDensity} data-test="toggle-density">
              <span className="mdi mdi-flip-vertical"></span>
              <span> Toggle Compact Density</span>
            </button>
            <button className="btn btn-outline-secondary btn-sm ms-2 btn-icon" onClick={scrollToRow90} data-test="scroll-row-90-example56">
              <span className="mdi mdi-arrow-down"></span>
              <span> Scroll To row 90</span>
            </button>
          </div>
        </div>

        <SlickgridReact
          gridId="grid56"
          columns={columns}
          options={gridOptions}
          dataset={dataset}
          onReactGridCreated={($event) => reactGridReady($event.detail)}
        />
      </div>
    </div>
  );
};

export default Example56;
