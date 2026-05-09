import { Formatters, SlickGlobalEditorLock, type AureliaGridInstance, type Column, type GridOption } from 'aurelia-slickgrid';
import './example41.scss';

export class Example41 {
  aureliaGrid!: AureliaGridInstance;
  gridOptions!: GridOption;
  columns!: Column[];
  dataset: any[] = [];
  dragHelper?: HTMLElement;
  dragRows: number[] = [];
  dragMode = '';
  hideSubTitle = false;

  constructor() {
    this.defineGrid();

    // mock a dataset
    this.dataset = this.mockData();
  }

  aureliaGridReady(aureliaGrid: AureliaGridInstance) {
    this.aureliaGrid = aureliaGrid;
  }

  /* Define grid Options and Columns */
  defineGrid() {
    this.columns = [
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
        cannotTriggerInsert: true,
        formatter: Formatters.checkmarkMaterial,
      },
    ];

    this.gridOptions = {
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
        // you can provide your own `onBeforeMoveRows` and/or `onMoveRows` implementation
        // or use the default implementation, however the default won't work with Tree Data
        // onBeforeMoveRows: () => {},
        // onMoveRows: () => {},
        onAfterMoveRows: (_e, args) => {
          // update dataset for the ms-select list to be updated
          this.dataset = args.updatedItems;
        },

        // you can also override the usability of the rows, for example make every 2nd row the only moveable rows,
        // usabilityOverride: (row, dataContext, grid) => dataContext.id % 2 === 1
      },
    };
  }

  mockData() {
    return [
      { id: 0, name: 'Make a list', complete: true },
      { id: 1, name: 'Check it twice', complete: false },
      { id: 2, name: `Find out who's naughty`, complete: false },
      { id: 3, name: `Find out who's nice`, complete: false },
    ];
  }

  handleOnDragInit(e: CustomEvent) {
    // prevent the grid from cancelling drag'n'drop by default
    e.stopImmediatePropagation();
  }

  handleOnDragStart(e: CustomEvent) {
    const cell = this.aureliaGrid.slickGrid?.getCellFromEvent(e);

    if (!cell || cell.cell === 0) {
      this.dragMode = '';
      return;
    }

    const row = cell.row;
    if (!this.dataset[row]) {
      return;
    }

    if (SlickGlobalEditorLock.isActive()) {
      return;
    }

    e.stopImmediatePropagation();
    this.dragMode = 'recycle';

    let selectedRows: number[] = this.aureliaGrid.slickGrid?.getSelectedRows() || [];

    if (!selectedRows.length || selectedRows.findIndex((row) => row === row) === -1) {
      selectedRows = [row];
      this.aureliaGrid.slickGrid?.setSelectedRows(selectedRows);
    }

    this.dragRows = selectedRows;
    const dragCount = selectedRows.length;

    const dragMsgElm = document.createElement('span');
    dragMsgElm.className = 'drag-message';
    dragMsgElm.textContent = `Drag to Recycle Bin to delete ${dragCount} selected row(s)`;
    this.dragHelper = dragMsgElm;
    document.body.appendChild(dragMsgElm);
    document.querySelector<HTMLDivElement>('#dropzone')?.classList.add('drag-dropzone');

    return dragMsgElm;
  }

  handleOnDrag(e: MouseEvent, args: any) {
    if (this.dragMode !== 'recycle') {
      return;
    }
    if (this.dragHelper instanceof HTMLElement) {
      this.dragHelper.style.top = `${e.pageY + 5}px`;
      this.dragHelper.style.left = `${e.pageX + 5}px`;
    }

    // add/remove pink background color when hovering recycle bin
    const dropzoneElm = document.querySelector<HTMLDivElement>('#dropzone')!;
    if (args.target instanceof HTMLElement && (args.target.id === 'dropzone' || args.target === dropzoneElm)) {
      dropzoneElm.classList.add('drag-hover'); // OR: dd.target.style.background = 'pink';
    } else {
      dropzoneElm.classList.remove('drag-hover');
    }
  }

  handleOnDragEnd(e: CustomEvent, args: any) {
    if (this.dragMode !== 'recycle') {
      return;
    }
    this.dragHelper?.remove();
    document.querySelector<HTMLDivElement>('#dropzone')?.classList.remove('drag-dropzone', 'drag-hover');

    if (this.dragMode !== 'recycle' || args.target.id !== 'dropzone') {
      return;
    }

    // reaching here means that we'll remove the row that we started dragging from the dataset
    const rowsToDelete = this.dragRows.sort().reverse();
    for (const rowToDelete of rowsToDelete) {
      this.dataset.splice(rowToDelete, 1);
    }
    this.aureliaGrid.slickGrid?.invalidate();
    this.aureliaGrid.slickGrid?.setSelectedRows([]);
    this.dataset = [...this.dataset];
  }

  toggleSubTitle() {
    this.hideSubTitle = !this.hideSubTitle;
    const action = this.hideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    this.aureliaGrid.resizerService.resizeGrid(0);
  }
}
