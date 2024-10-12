import { type Column, type GridOption, SlickEventHandler, Editors, Formatters } from '@slickgrid-universal/common';
import { Slicker, type SlickVanillaGridBundle } from '@slickgrid-universal/vanilla-bundle';

import { ExampleGridOptions } from './example-grid-options.js';
import './example19.scss';

const NB_ITEMS = 100;

export default class Example19 {
  protected _eventHandler: SlickEventHandler;

  columnDefinitions: Column[] = [];
  dataset: any[] = [];
  gridOptions!: GridOption;
  gridContainerElm: HTMLDivElement;
  isWithPagination = true;
  sgb: SlickVanillaGridBundle;
  isGridEditable = true;

  attached() {
    this._eventHandler = new SlickEventHandler();

    // define the grid options & columns and then create the grid itself
    this.defineGrid();

    // mock some data (different in each dataset)
    this.dataset = this.getData(NB_ITEMS);
    this.gridContainerElm = document.querySelector<HTMLDivElement>(`.grid19`) as HTMLDivElement;
    this.sgb = new Slicker.GridBundle(document.querySelector(`.grid19`) as HTMLDivElement, this.columnDefinitions, { ...ExampleGridOptions, ...this.gridOptions }, this.dataset);
    document.body.classList.add('salesforce-theme');

    // bind any of the grid events, e.g. onSelectedRangesChanged to show selection range on screen
    const cellSelectionModel = this.sgb.slickGrid!.getSelectionModel();
    this._eventHandler.subscribe(cellSelectionModel!.onSelectedRangesChanged, (_e, args) => {
      const targetRange = document.querySelector('#selectionRange') as HTMLSpanElement;
      targetRange.textContent = '';
      for (const slickRange of args) {
        targetRange.textContent += JSON.stringify(slickRange);
      }
    });

    // or subscribe to any events via internal PubSub (from `this.sgb.instances?.eventPubSubService` or `this.sgb.slickGrid?.getPubSubService()`)
    // Note: SlickEvent use the structure:: { eventData: SlickEventData; args: any; }
    //       while other regular PubSub events use the structure:: args: any;
    // this.sgb.instances?.eventPubSubService?.subscribe('onSelectedRangesChanged', (e) => console.log(e));
    // this.sgb.slickGrid?.getPubSubService()?.subscribe('onSelectedRangesChanged', (e) => {
    //   const targetRange = document.querySelector('#selectionRange') as HTMLSpanElement;
    //   targetRange.textContent = '';
    //   for (const slickRange of e.args) {
    //     targetRange.textContent += JSON.stringify(slickRange);
    //   }
    // });

    const hash = {
      0: {},
      1: {
        2: 'blocked-cell',
        3: 'blocked-cell',
        4: 'blocked-cell',
      }
    };
    for (let i = 0; i < NB_ITEMS; i++) {
      hash[0][i] = 'blocked-cell';
    }

    this.sgb.slickGrid?.setCellCssStyles(`blocked-cells`, hash);
  }

  dispose() {
    this._eventHandler.unsubscribeAll();
    this.sgb?.dispose();
    this.gridContainerElm.remove();
    document.body.classList.remove('salesforce-theme');
  }

  /* Define grid Options and Columns */
  defineGrid() {
    this.columnDefinitions = [
      {
        id: 'selector',
        name: '',
        field: 'num',
        width: 30,
      }
    ];

    this.columnDefinitions.push({
      id: 'approvalDate',
      name: 'Approval Date',
      field: 'approvalDate',
      minWidth: 120,
      width: 120,
      editor: { model: Editors.date, type: 'date' },
      formatter: Formatters.dateIso,
      exportWithFormatter: true
    });
    for (let i = 0; i < NB_ITEMS; i++) {
      this.columnDefinitions.push({
        id: i,
        name: i < 26
          ? String.fromCharCode('A'.charCodeAt(0) + (i % 26))
          : String.fromCharCode('A'.charCodeAt(0) + (Math.floor(i / 26)) - 1) + String.fromCharCode('A'.charCodeAt(0) + (i % 26)),
        field: String(i),
        minWidth: 60,
        exportWithFormatter: true,
        formatter: (row, cell, value) => {
          if (value !== null && value !== undefined) {
            return value;
          }

          return `${row + 1}:${cell + 1}`;
        },
        width: 60,
        editor: { model: Editors.text },
      });
    }

    this.gridOptions = {
      autoResize: {
        container: '.demo-container',
      },
      enableCellNavigation: true,
      enablePagination: true,
      autoEdit: true,
      editable: this.isGridEditable,
      pagination: {
        pageSizes: [5, 10, 15, 20, 25, 50, 75, 100],
        pageSize: 20
      },
      headerRowHeight: 35,
      rowHeight: 30,

      // when using the ExcelCopyBuffer, you can see what the selection range is
      enableExcelCopyBuffer: true,
      excelCopyBufferOptions: {
        //   onCopyCells: (e, args: { ranges: SelectedRange[] }) => console.log('onCopyCells', args.ranges),
        //   onPasteCells: (e, args: { ranges: SelectedRange[] }) => console.log('onPasteCells', args.ranges),
        //   onCopyCancelled: (e, args: { ranges: SelectedRange[] }) => console.log('onCopyCancelled', args.ranges),
        onBeforePasteCell: (_e, args) => {
          // deny the whole first row and the cells C-E of the second row
          return !(args.row === 0 || (args.row === 1 && args.cell > 2 && args.cell < 6));
        },
        copyActiveEditorCell: true,
        removeDoubleQuotesOnPaste: true,
        replaceNewlinesWith: ' ',
      }
    };
  }

  getData(itemCount: number) {
    // mock a dataset
    const datasetTmp: any[] = [];
    const start = new Date(2000, 0, 1);
    const end = new Date();
    for (let i = 0; i < itemCount; i++) {
      const d: any = (datasetTmp[i] = {});
      d['id'] = i;
      d['num'] = i;
      d['approvalDate'] = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    }

    return datasetTmp;
  }

  // Toggle the Grid Pagination
  // IMPORTANT, the Pagination MUST BE CREATED on initial page load before you can start toggling it
  // Basically you cannot toggle a Pagination that doesn't exist (must created at the time as the grid)
  togglePagination() {
    this.isWithPagination = !this.isWithPagination;
    this.sgb.paginationService!.togglePaginationVisibility(this.isWithPagination);
    this.sgb.slickGrid!.setSelectedRows([]);
  }

  toggleGridEditReadonly() {
    // then change a single grid options to make the grid non-editable (readonly)
    this.isGridEditable = !this.isGridEditable;
    this.sgb.gridOptions = { editable: this.isGridEditable };
    this.gridOptions = this.sgb.gridOptions;
  }
}
