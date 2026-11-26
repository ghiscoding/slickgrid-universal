import { BindingEventService } from '@slickgrid-universal/binding';
import { createDomElement, type Column, type GridOption } from '@slickgrid-universal/common';
import { Slicker, type SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';
import { ExampleGridOptions } from './example-grid-options.js';
import './example48.scss';

const ACTIONS = ['Edit', 'Duplicate', 'Archive', 'Export', 'Delete'];

interface TaskItem {
  id: number;
  title: string;
  owner: string;
  status: string;
  notes: string;
}

export default class Example48 {
  private _bindingEventService = new BindingEventService();
  columns: Column<TaskItem>[] = [];
  dataset: TaskItem[] = [];
  gridOptions!: GridOption;
  lastAction = '';
  modalSgb?: SlickVanillaGridBundle;
  popupElm?: HTMLDivElement;
  sgb!: SlickVanillaGridBundle;
  subTitleStyle = 'display: block';

  attached() {
    this.defineGrid();
    this.dataset = this.getData(30);
    const gridContainerElm = document.querySelector('.grid48') as HTMLDivElement;
    this.sgb = new Slicker.GridBundle(gridContainerElm, this.columns, { ...ExampleGridOptions, ...this.gridOptions }, this.dataset);

    this._bindingEventService.bind(gridContainerElm, 'click', this.handleActionButtonClick.bind(this) as EventListener);
    this._bindingEventService.bind(document.body, 'mousedown', ((e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.example48-popup, .example48-action-btn')) {
        this.closePopup();
      }
    }) as EventListener);
  }

  dispose() {
    this.closePopup();
    this.closeModal();
    this._bindingEventService.unbindAll();
    this.sgb?.dispose();
  }

  defineGrid() {
    this.columns = [
      { id: 'title', name: 'Title', field: 'title', width: 100 },
      { id: 'owner', name: 'Owner', field: 'owner', width: 100 },
      { id: 'status', name: 'Status', field: 'status', width: 100 },
      { id: 'notes', name: 'Notes', field: 'notes', width: 250 },
      {
        id: 'actions',
        name: 'Actions',
        field: 'id',
        width: 100,
        pinned: 'right',
        excludeFromExport: true,
        formatter: () => '<button class="button is-small example48-action-btn" data-test="action-btn">Actions</button>',
      },
    ];

    this.gridOptions = {
      enableAutoResize: false,
      gridHeight: 300,
      gridWidth: 600,
      rowHeight: 33,
    };
  }

  getData(count: number): TaskItem[] {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      title: `Task ${i}`,
      owner: `User ${i % 7}`,
      status: i % 3 ? 'Open' : 'Done',
      notes: `Row ${i} notes`,
    }));
  }

  /** Render a custom popup into `grid.getPopupContainer()` instead of the cell, so it isn't clipped by the row or the pinned column */
  handleActionButtonClick(e: MouseEvent) {
    const buttonElm = (e.target as HTMLElement).closest<HTMLButtonElement>('.example48-action-btn');
    if (!buttonElm) {
      return;
    }
    this.closePopup();
    const cell = this.sgb.slickGrid!.getCellFromEvent(e);
    const item = this.sgb.slickGrid!.getDataItem(cell!.row) as TaskItem;

    this.popupElm = createDomElement('div', { className: 'example48-popup', role: 'menu' });
    this.popupElm.dataset.test = 'action-popup';
    for (const action of ACTIONS) {
      const itemElm = createDomElement('div', { className: 'example48-popup-item', role: 'menuitem', textContent: action }, this.popupElm);
      itemElm.addEventListener('click', () => {
        this.lastAction = `${action} ${item.title}`;
        this.closePopup();
      });
    }

    const buttonRect = buttonElm.getBoundingClientRect();
    this.popupElm.style.top = `${buttonRect.bottom}px`;
    this.popupElm.style.left = `${buttonRect.left}px`;
    this.sgb.slickGrid!.getPopupContainer().appendChild(this.popupElm);
  }

  closePopup() {
    this.popupElm?.remove();
    this.popupElm = undefined;
  }

  openModal() {
    const dialogElm = document.querySelector('.dialog48') as HTMLDialogElement;
    dialogElm.showModal();

    // create the grid after the dialog is shown, a grid created in a closed dialog has no size
    const modalColumns: Column<TaskItem>[] = [
      ...this.columns.filter((col) => col.id !== 'actions'),
      {
        id: 'menu',
        name: 'Menu',
        field: 'id',
        width: 70,
        pinned: 'right',
        excludeFromExport: true,
        formatter: () => '<div class="button is-small" data-test="cell-menu-btn"><span class="mdi mdi-dots-vertical"></span></div>',
        cellMenu: {
          commandTitle: 'Commands',
          commandItems: ACTIONS.map((action) => ({
            command: action.toLowerCase(),
            title: action,
            action: (_e, args) => (this.lastAction = `${action} ${(args.dataContext as TaskItem).title} (modal)`),
          })),
        },
      },
    ];
    this.modalSgb = new Slicker.GridBundle(
      dialogElm.querySelector('.grid48-modal') as HTMLDivElement,
      modalColumns,
      {
        ...ExampleGridOptions,
        ...this.gridOptions,
        gridHeight: 250,
        gridWidth: 550,
        enableCellMenu: true,
        popupContainer: dialogElm,
      },
      this.getData(30)
    );
  }

  closeModal() {
    this.modalSgb?.dispose();
    this.modalSgb = undefined;
    (document.querySelector('.dialog48') as HTMLDialogElement | null)?.close();
  }

  toggleSubTitle() {
    this.subTitleStyle = this.subTitleStyle === 'display: block' ? 'display: none' : 'display: block';
  }
}
