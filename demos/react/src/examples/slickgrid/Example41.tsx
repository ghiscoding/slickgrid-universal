import React, { useEffect, useRef, useState } from 'react';
import {
  Formatters,
  SlickGlobalEditorLock,
  SlickgridReact,
  type Column,
  type GridOption,
  type SlickgridReactInstance,
} from 'slickgrid-react';
import './example41.scss';

const Example41: React.FC = () => {
  const [columnDefinitions, setColumnDefinitions] = useState<Column[]>([]);
  const [dataset, setDataset] = useState<any[]>(getData());
  const [gridOptions, setGridOptions] = useState<GridOption | undefined>(undefined);
  const [hideSubTitle, setHideSubTitle] = useState(false);

  const dragHelperRef = useRef<HTMLElement | null>(null);
  const dragRowsRef = useRef<number[]>([]);
  const dragModeRef = useRef('');
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
        width: 300,
        cssClass: 'cell-title',
      },
      {
        id: 'complete',
        name: 'Complete',
        width: 60,
        cssClass: 'cell-effort-driven',
        field: 'complete',
        formatter: Formatters.checkmarkMaterial,
      },
    ];

    const gridOptions: GridOption = {
      enableAutoResize: false,
      gridHeight: 225,
      gridWidth: 800,
      rowHeight: 33,
      enableCellNavigation: true,
      enableSelection: true,
      enableRowMoveManager: true,
      selectionOptions: {
        // True (Single Selection), False (Multiple Selections)
        selectActiveRow: false,
        selectionType: 'row',
      },
      rowMoveManager: {
        columnIndexPosition: 0,
        cancelEditOnDrag: true,
        disableRowSelection: true,
        hideRowMoveShadow: false,
        onBeforeMoveRows,
        onMoveRows,

        // you can also override the usability of the rows, for example make every 2nd row the only moveable rows,
        // usabilityOverride: (row, dataContext, grid) => dataContext.id % 2 === 1
      },
    };

    setColumnDefinitions(columnDefinitions);
    setGridOptions(gridOptions);
  }

  function getData() {
    return [
      { id: 0, name: 'Make a list', complete: true },
      { id: 1, name: 'Check it twice', complete: false },
      { id: 2, name: `Find out who's naughty`, complete: false },
      { id: 3, name: `Find out who's nice`, complete: false },
    ];
  }

  function onBeforeMoveRows(e: MouseEvent | TouchEvent, data: { rows: number[]; insertBefore: number }) {
    for (const dataRow of data.rows) {
      // no point in moving before or after itself
      if (dataRow === data.insertBefore || dataRow === data.insertBefore - 1) {
        e.stopPropagation();
        return false;
      }
    }
    return true;
  }

  function onMoveRows(_e: MouseEvent | TouchEvent, args: { rows: number[]; insertBefore: number }) {
    const extractedRows: any[] = [];
    const rows = args.rows;
    const insertBefore = args.insertBefore;
    const tmpDataset = dataset || [];
    const left = tmpDataset.slice(0, insertBefore);
    const right = tmpDataset.slice(insertBefore, tmpDataset.length);

    rows.sort((a, b) => a - b);

    for (const row of rows) {
      extractedRows.push(tmpDataset[row]);
    }

    rows.reverse();

    for (const row of rows) {
      if (row < insertBefore) {
        left.splice(row, 1);
      } else {
        right.splice(row - insertBefore, 1);
      }
    }

    const finalDataset = left.concat(extractedRows.concat(right));
    const selectedRows: number[] = [];
    for (let i = 0; i < rows.length; i++) {
      selectedRows.push(left.length + i);
    }

    reactGridRef.current?.dataView.setItems(finalDataset);
    reactGridRef.current?.slickGrid?.resetActiveCell();
    reactGridRef.current?.slickGrid?.invalidate();
  }

  function handleOnDragInit(e: CustomEvent) {
    // prevent the grid from cancelling drag'n'drop by default
    e.stopImmediatePropagation();
  }

  function handleOnDragStart(e: CustomEvent) {
    const cell = reactGridRef.current?.slickGrid?.getCellFromEvent(e);

    if (!cell || cell.cell === 0) {
      dragModeRef.current = '';
      return;
    }

    const row = cell.row;
    if (!dataset?.[row]) {
      return;
    }

    if (SlickGlobalEditorLock.isActive()) {
      return;
    }

    e.stopImmediatePropagation();
    dragModeRef.current = 'recycle';

    let selectedRows: number[] = reactGridRef.current?.slickGrid?.getSelectedRows() || [];

    if (!selectedRows.length || selectedRows.findIndex((row) => row === row) === -1) {
      selectedRows = [row];
      reactGridRef.current?.slickGrid?.setSelectedRows(selectedRows);
    }

    dragRowsRef.current = selectedRows;
    const dragCount = selectedRows.length;

    const dragMsgElm = document.createElement('span');
    dragMsgElm.className = 'drag-message';
    dragMsgElm.textContent = `Drag to Recycle Bin to delete ${dragCount} selected row(s)`;
    dragHelperRef.current = dragMsgElm;
    document.body.appendChild(dragMsgElm);
    document.querySelector<HTMLDivElement>('#dropzone')?.classList.add('drag-dropzone');

    return dragMsgElm;
  }

  function handleOnDrag(e: MouseEvent, args: any) {
    if (dragModeRef.current !== 'recycle') {
      return;
    }
    if (dragHelperRef.current instanceof HTMLElement) {
      dragHelperRef.current.style.top = `${e.pageY + 5}px`;
      dragHelperRef.current.style.left = `${e.pageX + 5}px`;
    }

    // add/remove pink background color when hovering recycle bin
    const dropzoneElm = document.querySelector<HTMLDivElement>('#dropzone')!;
    if (args.target instanceof HTMLElement && (args.target.id === 'dropzone' || args.target === dropzoneElm)) {
      dropzoneElm.classList.add('drag-hover'); // OR: dd.target.style.background = 'pink';
    } else {
      dropzoneElm.classList.remove('drag-hover');
    }
  }

  function handleOnDragEnd(e: CustomEvent, args: any) {
    if (dragModeRef.current !== 'recycle') {
      return;
    }
    dragHelperRef.current?.remove();
    document.querySelector<HTMLDivElement>('#dropzone')?.classList.remove('drag-dropzone', 'drag-hover');

    if (dragModeRef.current !== 'recycle' || args.target.id !== 'dropzone') {
      return;
    }

    // reaching here means that we'll remove the row that we started dragging from the dataset
    const tmpDataset: any[] = reactGridRef.current?.dataView.getItems() || [];
    const rowsToDelete = dragRowsRef.current.sort().reverse();
    for (const rowToDelete of rowsToDelete) {
      tmpDataset.splice(rowToDelete, 1);
    }
    reactGridRef.current?.slickGrid?.invalidate();
    reactGridRef.current?.slickGrid?.setSelectedRows([]);
    setDataset([...tmpDataset]);
  }

  function toggleSubTitle() {
    const newHideSubTitle = !hideSubTitle;
    setHideSubTitle(newHideSubTitle);
    const action = newHideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    reactGridRef.current?.resizerService.resizeGrid(0);
  }

  return !gridOptions ? (
    ''
  ) : (
    <div className="demo41">
      <div id="demo-container" className="container-fluid">
        <h2>
          Example 41: Drag & Drop
          <span className="float-end font18">
            see&nbsp;
            <a
              target="_blank"
              href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/react/src/examples/slickgrid/Example41.tsx"
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
          <ul>
            <li>Click to select, Ctrl-click to toggle selection(s).</li>
            <li>Drag one or more rows by the handle icon (1st column) to reorder.</li>
            <li>Drag one or more rows by selection (2nd or 3rd column) and drag to the recycle bin to delete.</li>
          </ul>
        </div>

        <div className="row">
          <div className="col">
            <SlickgridReact
              gridId="grid41"
              columns={columnDefinitions}
              options={gridOptions}
              dataset={dataset}
              onReactGridCreated={($event) => reactGridReady($event.detail)}
              onDragInit={($event) => handleOnDragInit($event.detail.eventData)}
              onDragStart={($event) => handleOnDragStart($event.detail.eventData)}
              onDrag={($event) => handleOnDrag($event.detail.eventData, $event.detail.args)}
              onDragEnd={($event) => handleOnDragEnd($event.detail.eventData, $event.detail.args)}
            />
          </div>
        </div>
        <div className="col">
          <div id="dropzone" className="recycle-bin mt-4">
            Recycle Bin
          </div>
        </div>
      </div>
    </div>
  );
};

export default Example41;
