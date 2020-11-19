import {
  BindingEventService,
  Column,
  DOMEvent,
  emptyElement,
  Formatter,
  Formatters,
  GridOption,
} from '@slickgrid-universal/common';
import { Slicker, SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';

import { ExampleGridOptions } from './example-grid-options';
import '../salesforce-styles.scss';
import './example11-modal.scss';

export class Example11Modal {
  private _bindingEventService: BindingEventService;
  columnDefinitions: Column[];
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
        this.columnDefinitions = bindings.columnDefinitions;
        this.gridContainerElm = document.querySelector<HTMLDivElement>(`.modal-grid`);
        this._bindingEventService.bind(this.gridContainerElm, 'onvalidationerror', this.handleValidationError.bind(this));

        const dataset = [this.createEmptyItem(bindings.columnDefinitions)];
        this.sgb = new Slicker.GridBundle(this.gridContainerElm, this.columnDefinitions, { ...ExampleGridOptions, ...this.gridOptions }, dataset);

        // force editor to open (top-left)
        setTimeout(() => this.sgb.slickGrid.gotoCell(0, 0, true), 50);
      }
      this.remoteCallbackFn = bindings.remoteCallback;
      this.selectedIds = bindings.selectedIds || [];
    }
  }

  dispose() {
    this.sgb?.dispose();
    this._bindingEventService.unbindAll();
    this.gridContainerElm = null;
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

  createEmptyItem(columnDefinitions: Column[]) {
    const emptyObj: any = { id: 0 };
    columnDefinitions.forEach(column => {
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
    this.gridContainerElm = emptyElement(this.gridContainerElm);
    this.closeBulmaModal();
  }

  /**
   * Instead of manually adding a Custom Formatter on every column definition that is editable, let's do it in an automated way
   * We'll loop through all column definitions and add a Formatter (blue background) when necessary
   * Note however that if there's already a Formatter on that column definition, we need to turn it into a Formatters.multiple
   */
  autoAddCustomEditorFormatter(columnDefinitions: Column[], customFormatter: Formatter) {
    if (Array.isArray(columnDefinitions)) {
      for (const columnDef of columnDefinitions) {
        if (columnDef.editor) {
          if (columnDef.formatter && columnDef.formatter !== Formatters.multiple) {
            const prevFormatter = columnDef.formatter;
            columnDef.formatter = Formatters.multiple;
            columnDef.params = { ...columnDef.params, formatters: [prevFormatter, customFormatter] };
          } else if (columnDef.formatter && columnDef.formatter === Formatters.multiple) {
            if (!columnDef.params) {
              columnDef.params = {};
            }
            columnDef.params.formatters = [...columnDef.params.formatters, customFormatter];
          } else {
            columnDef.formatter = customFormatter;
          }
        }
      }
    }
  }

  saveMassUpdate(updateType: 'selection' | 'mass') {
    this.handleOnModalClose();
    const editedItem = this.sgb.dataView.getItemByIdx(0);

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
    const modalElm = document.querySelector<HTMLDivElement>('.modal');
    modalElm.classList.add('is-active');

    this.bindCloseBulmaModal(callback);
  }

  private bindCloseBulmaModal(callback?: () => void) {
    const modalCloseBtnElms = document.querySelectorAll<HTMLButtonElement>('.close, .delete, .modal-close');

    window.addEventListener('click', (event: DOMEvent<HTMLInputElement>) => {
      if (event.target.className === 'modal-background') {
        this.closeBulmaModal(callback);
      }
    });

    if (modalCloseBtnElms) {
      modalCloseBtnElms.forEach(closeElm => closeElm.addEventListener('click', () => this.closeBulmaModal(callback)));
    }
  }

  private closeBulmaModal(callback?: () => void) {
    const modalElm = document.querySelector<HTMLDivElement>('.modal');
    modalElm.classList.remove('is-active');
    if (typeof callback === 'function') {
      callback();
    }
  }
}
