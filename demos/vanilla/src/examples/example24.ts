import { BindingEventService } from '@slickgrid-universal/binding';
import { type Column, Editors, FieldType, type GridOption, SlickEventHandler } from '@slickgrid-universal/common';
import { Slicker, type SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';

import { ExampleGridOptions } from './example-grid-options.js';
import './example24.scss';

const NB_ITEMS = 100;

export default class Example24 {
  private _bindingEventService: BindingEventService;
  private _darkMode = false;
  private _eventHandler: SlickEventHandler;

  columnDefinitions: Column[] = [];
  dataset: any[] = [];
  gridOptions!: GridOption;
  gridContainerElm: HTMLDivElement;
  sgb: SlickVanillaGridBundle;

  constructor() {
    this._bindingEventService = new BindingEventService();
  }

  attached() {
    this._eventHandler = new SlickEventHandler();

    // define the grid options & columns and then create the grid itself
    this.defineGrid();

    // mock some data (different in each dataset)
    this.dataset = this.getData(NB_ITEMS);
    this.gridContainerElm = document.querySelector<HTMLDivElement>('.grid24') as HTMLDivElement;

    this.sgb = new Slicker.GridBundle(
      document.querySelector('.grid24') as HTMLDivElement,
      this.columnDefinitions,
      { ...ExampleGridOptions, ...this.gridOptions },
      this.dataset
    );
    this.updateAllTotals();

    // bind any of the grid events
    this._bindingEventService.bind(this.gridContainerElm, 'oncolumnsreordered', this.handleOnColumnsReordered.bind(this));
    this._bindingEventService.bind(this.gridContainerElm, 'oncellchange', this.handleOnCellChange.bind(this));

    document.body.classList.add('salesforce-theme');
  }

  dispose() {
    this._eventHandler.unsubscribeAll();
    this.sgb?.dispose();
    this.gridContainerElm.remove();
    document.querySelector('.demo-container')?.classList.remove('dark-mode');
    document.body.setAttribute('data-theme', 'light');
  }

  /* Define grid Options and Columns */
  defineGrid() {
    const columnDefs: Column[] = [];
    for (let i = 0; i < 10; i++) {
      columnDefs.push({
        id: i,
        name: String.fromCharCode('A'.charCodeAt(0) + i),
        field: String(i),
        type: FieldType.number,
        width: 58,
        editor: { model: Editors.integer },
      });
    }
    this.columnDefinitions = columnDefs;

    this.gridOptions = {
      autoEdit: true,
      autoCommitEdit: true,
      editable: true,
      darkMode: this._darkMode,
      gridHeight: 450,
      gridWidth: 800,
      enableCellNavigation: true,
      rowHeight: 33,
      createFooterRow: true,
      showFooterRow: true,
      footerRowHeight: 35,
    };
  }

  getData(itemCount: number) {
    // mock a dataset
    const datasetTmp: any[] = [];
    for (let i = 0; i < itemCount; i++) {
      const d = (datasetTmp[i] = {} as any);
      d.id = i;
      for (let j = 0; j < this.columnDefinitions.length; j++) {
        d[j] = Math.round(Math.random() * 10);
      }
    }

    return datasetTmp;
  }

  handleOnCellChange(e) {
    const args = e?.detail?.args;
    this.updateTotal(args.cell);
  }

  handleOnColumnsReordered() {
    this.updateAllTotals();
  }

  toggleDarkMode() {
    this._darkMode = !this._darkMode;
    this.toggleBodyBackground();
    this.sgb.gridOptions = { ...this.sgb.gridOptions, darkMode: this._darkMode };
    this.sgb.slickGrid?.setOptions({ darkMode: this._darkMode });
    this.updateAllTotals();
  }

  toggleBodyBackground() {
    if (this._darkMode) {
      document.body.setAttribute('data-theme', 'dark');
      document.querySelector('.demo-container')?.classList.add('dark-mode');
    } else {
      document.body.setAttribute('data-theme', 'light');
      document.querySelector('.demo-container')?.classList.remove('dark-mode');
    }
  }

  updateAllTotals() {
    let columnIdx = this.sgb.slickGrid?.getColumns().length || 0;
    while (columnIdx--) {
      this.updateTotal(columnIdx);
    }
  }

  updateTotal(cell: number) {
    const columnId = this.sgb.slickGrid?.getColumns()[cell].id as number;

    let total = 0;
    let i = this.dataset.length;
    while (i--) {
      total += parseInt(this.dataset[i][columnId], 10) || 0;
    }
    const columnElement = this.sgb.slickGrid?.getFooterRowColumn(columnId);
    if (columnElement) {
      columnElement.textContent = `Sum: ${total}`;
    }
  }
}
