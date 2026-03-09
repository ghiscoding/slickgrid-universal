import { BindingEventService } from '@slickgrid-universal/binding';
import { Formatters, type Column, type DOMEvent, type Formatter, type GridOption } from '@slickgrid-universal/common';
import { Slicker, type SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';
import { ExampleGridOptions } from './example-grid-options.js';
import './example11-modal.scss';

export default class Example11Modal {
  private _bindingEventService: BindingEventService;
  columns: Column[];
  gridOptions: GridOption;
  sgb: SlickVanillaGridBundle;
  gridContainerElm: HTMLDivElement;
  remoteCallbackFn: any;
  selectedIds: string[] = [];

  constructor() {
    this._bindingEventService = new BindingEventService();
  }

  attached() {
    this.openBulmaModal(this.handleOnModalClose.bind(this));
    this.initializeGrid();
  }

  bind(bindings: any) {
    if (bindings) {
      if (bindings.columnDefinitions) {
        this.columns = bindings.columnDefinitions;
        this.gridContainerElm = document.querySelector(`.modal-grid`) as HTMLDivElement;
        this._bindingEventService.bind(this.gridContainerElm, 'onvalidationerror', this.handleValidationError.bind(this));

        const dataset = [this.createEmptyItem(bindings.columnDefinitions)];
        this.sgb = new Slicker.GridBundle(this.gridContainerElm, this.columns, { ...ExampleGridOptions, ...this.gridOptions }, dataset);

        // force editor to open (top-left)
        setTimeout(() => this.sgb.slickGrid?.gotoCell(0, 0, true), 50);
      }
      this.remoteCallbackFn = bindings.remoteCallback;
      this.selectedIds = bindings.selectedIds || [];
    }
  }

  dispose() {
    this.sgb?.dispose();
    this._bindingEventService.unbindAll();
    this.gridContainerElm = null as any;
  }

  initializeGrid() {
    this.gridOptions = {
      autoEdit: true,
      autoCommitEdit: true,
      editable: true,
      enableCellNavigation: true,
      enableGridMenu: false,
      gridHeight: 200,
      gridWidth: 1160,
      rowHeight: 33,
    };
  }

  createEmptyItem(columns: Column[]) {
    const emptyObj: any = { id: 0 };
    columns.forEach((column) => {
      emptyObj[column.id] = undefined;
    });

    return emptyObj;
  }

  handleValidationError(event) {
    console.log('handleValidationError', event.detail);
    const args = event.detail && event.detail.args;
    if (args.validationResults) {
      alert(args.validationResults.msg);
    }
    return false;
  }

  handleOnModalClose() {
    this.sgb?.dispose();
    if (this.gridContainerElm) {
      this.gridContainerElm.textContent = '';
    }
    this.closeBulmaModal();
  }

  /**
   * Instead of manually adding a Custom Formatter on every column definition that is editable, let's do it in an automated way
   * We'll loop through all column definitions and add a Formatter (blue background) when necessary
   * Note however that if there's already a Formatter on that column definition, we need to turn it into a Formatters.multiple
   */
  autoAddCustomEditorFormatter(columns: Column[], customFormatter: Formatter) {
    if (Array.isArray(columns)) {
      for (const column of columns) {
        if (column.editor) {
          if (column.formatter && column.formatter !== Formatters.multiple) {
            const prevFormatter = column.formatter;
            column.formatter = Formatters.multiple;
            column.params = { ...column.params, formatters: [prevFormatter, customFormatter] };
          } else if (column.formatter && column.formatter === Formatters.multiple) {
            if (!column.params) {
              column.params = {};
            }
            column.params.formatters = [...column.params.formatters, customFormatter];
          } else {
            column.formatter = customFormatter;
          }
        }
      }
    }
  }

  saveMassUpdate(updateType: 'selection' | 'mass') {
    this.handleOnModalClose();
    const editedItem = this.sgb.dataView?.getItemByIdx(0);

    if (typeof this.remoteCallbackFn === 'function') {
      // before calling the remote callback, let's remove the unnecessary "id" and any undefined properties
      for (const key in editedItem) {
        if (editedItem[key] === undefined || key === 'id') {
          delete editedItem[key];
        }
      }

      // finally execute the remote callback
      this.remoteCallbackFn({ item: editedItem, selectedIds: this.selectedIds, updateType });
    }
  }

  private openBulmaModal(callback?: () => void) {
    const modalElm = document.querySelector('.modal') as HTMLDivElement;
    modalElm.classList.add('is-active');

    this.bindCloseBulmaModal(callback);
  }

  private bindCloseBulmaModal(callback?: () => void) {
    const modalCloseBtnElms = document.querySelectorAll<HTMLButtonElement>('.close, .delete, .modal-close');

    window.addEventListener('click', (event: Event) => {
      if ((event as DOMEvent<HTMLInputElement>).target.className === 'modal-background') {
        this.closeBulmaModal(callback);
      }
    });

    if (modalCloseBtnElms) {
      modalCloseBtnElms.forEach((closeElm) => closeElm.addEventListener('click', () => this.closeBulmaModal(callback)));
    }
  }

  private closeBulmaModal(callback?: () => void) {
    const modalElm = document.querySelector('.modal') as HTMLDivElement;
    modalElm.classList.remove('is-active');
    if (typeof callback === 'function') {
      callback();
    }
  }
}
