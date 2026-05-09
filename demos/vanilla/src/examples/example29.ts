import { BindingEventService } from '@slickgrid-universal/binding';
import { Editors, Formatters, isDefined, SlickGlobalEditorLock, type Column, type GridOption } from '@slickgrid-universal/common';
import { Slicker, type SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';
import { ExampleGridOptions } from './example-grid-options.js';
import './example29.scss';

export default class Example29 {
  private _bindingEventService: BindingEventService;
  gridOptions!: GridOption;
  columns!: Column[];
  dataset!: any[];
  sgb!: SlickVanillaGridBundle;
  dragHelper: HTMLElement;
  dragRows: number[];
  dragMode = '';

  constructor() {
    this._bindingEventService = new BindingEventService();
  }

  attached() {
    this.defineGrids();
    const gridContainer1Elm = document.querySelector(`.grid29-1`) as HTMLDivElement;

    // mock some data (different in each dataset)
    this.dataset = this.mockData(1);

    this.sgb = new Slicker.GridBundle(gridContainer1Elm, this.columns, { ...ExampleGridOptions, ...this.gridOptions }, this.dataset);

    // bind any of the grid events
    this._bindingEventService.bind(gridContainer1Elm, 'ondraginit', this.handleOnDragInit.bind(this) as EventListener);
    this._bindingEventService.bind(gridContainer1Elm, 'ondragstart', this.handleOnDragStart.bind(this) as EventListener);
    this._bindingEventService.bind(gridContainer1Elm, 'ondrag', this.handleOnDrag.bind(this) as EventListener);
    this._bindingEventService.bind(gridContainer1Elm, 'ondragend', this.handleOnDragEnd.bind(this) as EventListener);
  }

  dispose() {
    this.sgb?.dispose();
  }

  isBrowserDarkModeEnabled() {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }

  /* Define grid Options and Columns */
  defineGrids() {
    this.columns = [
      {
        id: 'name',
        name: 'Name',
        field: 'name',
        width: 300,
        cssClass: 'cell-title',
        editor: { model: Editors.text },
        validator: this.requiredFieldValidator,
      },
      {
        id: 'complete',
        name: 'Complete',
        width: 60,
        cssClass: 'cell-effort-driven',
        field: 'complete',
        cannotTriggerInsert: true,
        formatter: Formatters.checkmarkMaterial,
        editor: { model: Editors.Checkbox },
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

  mockData(gridNo: 1 | 2) {
    switch (gridNo) {
      case 1:
        return [
          { id: 0, name: 'Make a list', complete: true },
          { id: 1, name: 'Check it twice', complete: false },
          { id: 2, name: `Find out who's naughty`, complete: false },
          { id: 3, name: `Find out who's nice`, complete: false },
        ];
      case 2:
        return [
          { id: 0, name: 'Onions', complete: true },
          { id: 1, name: 'Vegemite', complete: false },
          { id: 2, name: 'Corn Flakes', complete: false },
          { id: 3, name: 'Beans', complete: false },
        ];
    }
  }

  handleOnDragInit(e: CustomEvent) {
    // prevent the grid from cancelling drag'n'drop by default
    const { eventData } = e.detail;
    eventData.stopImmediatePropagation();
  }

  handleOnDragStart(e: CustomEvent) {
    const { eventData } = e.detail;
    const cell = this.sgb.slickGrid?.getCellFromEvent(eventData);

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

    eventData.stopImmediatePropagation();
    this.dragMode = 'recycle';

    let selectedRows: number[] = this.sgb.slickGrid?.getSelectedRows() || [];

    if (!selectedRows.length || selectedRows.findIndex((row) => row === row) === -1) {
      selectedRows = [row];
      this.sgb.slickGrid?.setSelectedRows(selectedRows);
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

  handleOnDrag(e: CustomEvent) {
    const { args, eventData } = e.detail;
    if (this.dragMode !== 'recycle') {
      return;
    }
    const targetEvent = eventData.touches ? eventData.touches[0] : eventData;
    if (this.dragHelper instanceof HTMLElement) {
      this.dragHelper.style.top = `${targetEvent.pageY + 5}px`;
      this.dragHelper.style.left = `${targetEvent.pageX + 5}px`;
    }

    // add/remove pink background color when hovering recycle bin
    const dropzoneElm = document.querySelector<HTMLDivElement>('#dropzone')!;
    if (args.target instanceof HTMLElement && (args.target.id === 'dropzone' || args.target === dropzoneElm)) {
      dropzoneElm.classList.add('drag-hover'); // OR: dd.target.style.background = 'pink';
    } else {
      dropzoneElm.classList.remove('drag-hover');
    }
  }

  handleOnDragEnd(e: CustomEvent) {
    const args = e.detail?.args;
    if (this.dragMode !== 'recycle') {
      return;
    }
    this.dragHelper.remove();
    document.querySelector<HTMLDivElement>('#dropzone')?.classList.remove('drag-dropzone', 'drag-hover');

    if (this.dragMode !== 'recycle' || args.target.id !== 'dropzone') {
      return;
    }

    // reaching here means that we'll remove the row that we started dragging from the dataset
    const rowsToDelete = this.dragRows.sort().reverse();
    for (const rowToDelete of rowsToDelete) {
      this.sgb.dataset.splice(rowToDelete, 1);
    }
    this.sgb.dataset = this.dataset;
    this.sgb.slickGrid?.invalidate();
    this.sgb.slickGrid?.setSelectedRows([]);
  }

  requiredFieldValidator(value: any) {
    if (isDefined(value)) {
      return { valid: false, msg: 'This is a required field' };
    } else {
      return { valid: true, msg: null };
    }
  }
}
